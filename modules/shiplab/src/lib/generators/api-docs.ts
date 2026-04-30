import { readFileSync, existsSync } from 'fs';
import path from 'path';
import fg from 'fast-glob';
import { getLLMRouter } from '../ai/router';

export interface APIEndpoint {
  path: string;
  method: string;
  description?: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  response?: {
    type: string;
    description?: string;
  };
}

export interface APIDocumentation {
  title: string;
  description: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  markdown: string;
}

/**
 * Detect API framework and routes
 */
async function detectAPIRoutes(projectPath: string): Promise<{
  framework: 'nextjs' | 'express' | 'unknown';
  routes: string[];
}> {
  // Check for Next.js API routes
  const nextjsApiPath = path.join(projectPath, 'src', 'app', 'api');
  const nextjsApiPathAlt = path.join(projectPath, 'app', 'api');

  if (existsSync(nextjsApiPath) || existsSync(nextjsApiPathAlt)) {
    const basePath = existsSync(nextjsApiPath) ? nextjsApiPath : nextjsApiPathAlt;

    const routes = await fg(['**/route.ts', '**/route.js'], {
      cwd: basePath,
      absolute: false,
    });

    return {
      framework: 'nextjs',
      routes: routes.map((r) => '/' + r.replace(/\/route\.(ts|js)$/, '')),
    };
  }

  // Check for Express routes (basic detection)
  const expressFiles = await fg(['**/*.{js,ts}'], {
    cwd: projectPath,
    ignore: ['**/node_modules/**'],
    deep: 2,
  });

  for (const file of expressFiles) {
    const content = readFileSync(path.join(projectPath, file), 'utf-8');
    if (content.includes('express()') || content.includes('app.get') || content.includes('app.post')) {
      return {
        framework: 'express',
        routes: extractExpressRoutes(content),
      };
    }
  }

  return {
    framework: 'unknown',
    routes: [],
  };
}

/**
 * Extract Express routes from code (basic regex parsing)
 */
function extractExpressRoutes(content: string): string[] {
  const routes: string[] = [];
  const routeRegex = /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;

  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    routes.push(`${match[1].toUpperCase()} ${match[2]}`);
  }

  return routes;
}

/**
 * Analyze a Next.js route file
 */
async function analyzeNextJSRoute(routePath: string, filePath: string): Promise<APIEndpoint | null> {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Extract HTTP methods
    const methods: string[] = [];
    if (/export\s+async\s+function\s+GET/i.test(content)) methods.push('GET');
    if (/export\s+async\s+function\s+POST/i.test(content)) methods.push('POST');
    if (/export\s+async\s+function\s+PUT/i.test(content)) methods.push('PUT');
    if (/export\s+async\s+function\s+DELETE/i.test(content)) methods.push('DELETE');
    if (/export\s+async\s+function\s+PATCH/i.test(content)) methods.push('PATCH');

    if (methods.length === 0) return null;

    // Try to extract Zod schema for parameters
    const zodSchemaRegex = /z\.object\(\{([^}]+)\}\)/;
    const schemaMatch = content.match(zodSchemaRegex);

    let parameters: APIEndpoint['parameters'] = [];
    if (schemaMatch) {
      // Basic Zod schema parsing
      const schemaContent = schemaMatch[1];
      const fieldRegex = /(\w+):\s*z\.(\w+)\(\)/g;
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(schemaContent)) !== null) {
        parameters.push({
          name: fieldMatch[1],
          type: fieldMatch[2],
          required: true,
        });
      }
    }

    return {
      path: routePath,
      method: methods.join(', '),
      description: `API endpoint at ${routePath}`,
      parameters,
    };
  } catch (error) {
    console.error(`Error analyzing route ${routePath}:`, error);
    return null;
  }
}

/**
 * Generate API documentation
 */
export async function generateAPIDocumentation(
  projectPath: string,
  projectName: string,
  model: string = 'smollm2:1.7b'
): Promise<APIDocumentation> {
  const detection = await detectAPIRoutes(projectPath);

  if (detection.routes.length === 0) {
    return {
      title: `${projectName} API`,
      description: 'No API routes detected in this project.',
      baseUrl: 'http://localhost:3000',
      endpoints: [],
      markdown: `# ${projectName} API\n\nNo API routes detected in this project.`,
    };
  }

  // Analyze endpoints (for Next.js)
  const endpoints: APIEndpoint[] = [];

  if (detection.framework === 'nextjs') {
    const apiBasePath = path.join(projectPath, 'src', 'app', 'api');
    const apiBasePathAlt = path.join(projectPath, 'app', 'api');
    const basePath = existsSync(apiBasePath) ? apiBasePath : apiBasePathAlt;

    for (const route of detection.routes) {
      const filePath = path.join(basePath, route, 'route.ts');
      const filePathJS = path.join(basePath, route, 'route.js');

      const actualPath = existsSync(filePath) ? filePath : filePathJS;

      if (existsSync(actualPath)) {
        const endpoint = await analyzeNextJSRoute('/api' + route, actualPath);
        if (endpoint) endpoints.push(endpoint);
      }
    }
  } else {
    // For Express or unknown, just list the routes
    for (const route of detection.routes) {
      endpoints.push({
        path: route,
        method: 'GET/POST',
        description: `Endpoint: ${route}`,
      });
    }
  }

  // Generate markdown documentation using AI
  const llmRouter = getLLMRouter();

  const prompt = `Generate API documentation in markdown format for the following endpoints:

${endpoints
  .map(
    (e) => `
### ${e.method} ${e.path}
${e.description || ''}
${
  e.parameters && e.parameters.length > 0
    ? `Parameters:\n${e.parameters.map((p) => `- ${p.name} (${p.type})${p.required ? ' *required*' : ''}`).join('\n')}`
    : ''
}
`
  )
  .join('\n')}

Create professional API documentation with:
1. Overview section
2. Authentication (if applicable)
3. Endpoint details with request/response examples
4. Error codes

Format in markdown.`;

  const response = await llmRouter.chat(
    [
      { role: 'system', content: 'You are an API documentation expert.' },
      { role: 'user', content: prompt },
    ],
    model,
    { temperature: 0.5 }
  );

  return {
    title: `${projectName} API Documentation`,
    description: `API documentation for ${projectName}`,
    baseUrl: 'http://localhost:3000',
    endpoints,
    markdown: response.content,
  };
}

/**
 * Generate simple API documentation markdown
 */
export function generateSimpleAPIDoc(endpoints: APIEndpoint[], projectName: string): string {
  return `# ${projectName} API Documentation

## Endpoints

${endpoints
  .map(
    (endpoint) => `
### ${endpoint.method} ${endpoint.path}

${endpoint.description || 'No description available.'}

${
  endpoint.parameters && endpoint.parameters.length > 0
    ? `
**Parameters:**

${endpoint.parameters.map((p) => `- \`${p.name}\` (${p.type})${p.required ? ' - **Required**' : ''} ${p.description || ''}`).join('\n')}
`
    : ''
}

${
  endpoint.response
    ? `
**Response:**

Type: \`${endpoint.response.type}\`
${endpoint.response.description || ''}
`
    : ''
}

---
`
  )
  .join('\n')}

## Error Codes

- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`404\` - Not Found
- \`500\` - Internal Server Error
`;
}
