/**
 * API Service
 * Centralized API client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add timeout for long-running requests (like generation, refinement, and assistant)
  // Note: TypeScript doesn't know about our custom timeout option, so we'll handle it manually
  const isLongRunning = endpoint.includes('/generate') || 
                        endpoint.includes('/refinement') || 
                        endpoint.includes('/assistant') ||
                        endpoint.includes('/architect') ||
                        endpoint.includes('/blend-intelligent'); // LLM-enhanced blending
  let customTimeout = (options as any).timeout || (isLongRunning ? 300000 : 30000); // 5 min for AI operations, 30s default
  
  // Ensure we always use the longer timeout for assistant and AI-enhanced blending endpoints
  if ((endpoint.includes('/assistant') || endpoint.includes('/blend-intelligent')) && customTimeout < 300000) {
    customTimeout = 300000;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), customTimeout);
  config.signal = controller.signal;

  try {
    console.log(`[API] ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body as string) : '');
    
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[API] Error ${response.status}:`, errorData);
      throw new APIError(
        errorData.error?.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // Handle 204 No Content and other empty responses
    if (response.status === 204) {
      console.log(`[API] Success:`, endpoint);
      return {} as T;
    }

    // Try to parse JSON, but handle empty responses gracefully
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.log(`[API] Success:`, endpoint);
      return {} as T;
    }

    const data = JSON.parse(text);
    console.log(`[API] Success:`, endpoint);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[API] Request timeout after ${customTimeout}ms:`, url);
      throw new APIError(
        `Request timed out after ${customTimeout / 1000} seconds. The AI model may be taking longer than expected.`,
        0,
        { timeout: true }
      );
    }
    
    console.error(`[API] Network error:`, error);
    throw new APIError(
      error instanceof Error ? error.message : 'Network error - check if backend is running',
      0,
      error
    );
  }
}

// Projects API
export const projectsAPI = {
  list: () => request<{ projects: any[] }>('/api/projects'),

  get: (id: string) => request<{ project: any; versions: any[] }>(`/api/projects/${id}`),

  create: (data: { name: string; genre?: string }) =>
    request<{ project: any }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; genre?: string }) =>
    request<{ project: any }>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/projects/${id}`, {
      method: 'DELETE',
    }),

  merge: (id: string) =>
    request<{ version: any; mergedCount: number; message: string }>(`/api/projects/${id}/merge`, {
      method: 'POST',
    }),
};

// Templates API
type TemplateDesignOptions = {
  tone?: string;
  camera?: string;
  platform?: string;
  multiplayer?: string;
  sessionLength?: string;
  complexity?: string;
  artDirection?: string;
  monetization?: string;
  accessibility?: string;
};

export const templatesAPI = {
  list: () => request<{ genres: Array<{ id: string; name: string; description: string }> }>('/api/templates'),

  get: (genre: string) => request<any>(`/api/templates/${genre}`),

  customize: (genre: string, data: { mechanicsOverrides?: any; loreOverrides?: any }) =>
    request<{ genre: string; mechanics: any; lore: any }>(`/api/templates/${genre}/customize`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createProject: (genre: string, data: { projectName: string; mechanicsOverrides?: any; loreOverrides?: any; designOptions?: TemplateDesignOptions }) =>
    request<{ project: any; concept: any }>(`/api/templates/${genre}/create-project`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  blend: (data: { genres: Array<{ genre: string; weight: number }>; designOptions?: TemplateDesignOptions }) =>
    request<{ blended: boolean; template: any; sourceGenres: any }>('/api/templates/blend', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  blendIntelligent: (data: { genres: Array<{ genre: string; weight: number }>; designOptions?: TemplateDesignOptions }) =>
    request<{ 
      enhanced: boolean; 
      template: any; 
      analysis: {
        conflicts: Array<{
          type: 'mechanics' | 'lore' | 'setting' | 'conflict' | 'themes';
          description: string;
          severity: 'low' | 'medium' | 'high';
          resolution: string;
        }>;
        coherence_score: number;
        improvements: string[];
      };
      blend_strategy: string;
      reasoning: string;
      sourceGenres: any;
      designOptions?: TemplateDesignOptions;
      ai_enhanced: boolean;
    }>('/api/templates/blend-intelligent', {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: 300000, // 300 seconds (5 minutes) for complex LLM analysis
    }),

  blendAndCreate: (data: { projectName: string; genres: Array<{ genre: string; weight: number }>; designOptions?: TemplateDesignOptions }) =>
    request<{ project: any; version: any; blendedTemplate: string; sourceGenres: any; message: string }>('/api/templates/blend-and-create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Generation API
export const generateAPI = {
  generate: (data: {
    projectId: string;
    taskType: 'mechanics' | 'lore' | 'title' | 'refinement';
    context: any;
    modelPreference?: string;
  }) =>
    request<{ conceptId: string; content: any }>('/api/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Validation API
export const validationAPI = {
  validate: (data: { conceptId: string; mechanics: any; lore: any }) =>
    request<{ conceptId: string; issues: any[]; consistencyScore: number }>('/api/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRules: () => request<{ rules: any[] }>('/api/validate/rules'),

  dismissIssue: (conceptId: string, ruleId: string) =>
    request<{ message: string }>(`/api/validate/${conceptId}/dismiss/${ruleId}`, {
      method: 'PATCH',
    }),
};

// Export API
export const exportAPI = {
  export: (data: { conceptId: string; template: 'gdd' | 'pitch' | 'technical' }) =>
    request<{ markdown: string }>('/api/export', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Refinement API
export const refinementAPI = {
  refine: (data: {
    conceptId: string;
    focus: 'deepen-mechanics' | 'enrich-lore' | 'improve-consistency' | 'enhance-genre-fit';
    specificInstructions?: string;
    preserveFields?: string[];
  }) =>
    request<any>('/api/refinement', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getHistory: (projectId: string) =>
    request<{ projectId: string; versions: any[] }>(`/api/refinement/history/${projectId}`),

  compare: (data: { conceptId1: string; conceptId2: string }) =>
    request<any>('/api/refinement/compare', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFocuses: () => request<{ focuses: any[] }>('/api/refinement/focuses'),
};

// Titles API
export const titlesAPI = {
  generate: (data: {
    mechanics?: any;
    lore?: any;
    genre?: string;
    style?: string;
    count?: number;
    excludeWords?: string[];
    mustIncludeWords?: string[];
  }) =>
    request<{ titles: any[]; topPick: any }>('/api/titles/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStyles: () => request<{ styles: any[] }>('/api/titles/styles'),

  analyze: (data: { title: string; genre?: string }) =>
    request<any>('/api/titles/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Health check
export const healthAPI = {
  check: () => request<any>('/health'),
};

// Assistant API
export const assistantAPI = {
  startSession: (data: { projectId: string; type?: 'concept' | 'architect' | 'project'; mode?: 'concept' | 'architect' | 'auto' }) =>
    request<{ session: any; messages: any[]; proposals: any[] }>('/api/assistant/session', {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: 30000, // 30 seconds for session start
    } as any),

  sendMessage: (sessionId: string, content: string, mode?: 'concept' | 'architect' | 'auto') =>
    request<{ message: any; proposal?: any }>(`/api/assistant/session/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content, mode }),
      timeout: 300000, // 5 minutes for AI response
    } as any),

  updateSessionMode: (sessionId: string, mode: 'concept' | 'architect' | 'auto') =>
    request<{ session: any; message: string }>(`/api/assistant/session/${sessionId}/mode`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    } as any),

  getMessages: (sessionId: string) =>
    request<{ messages: any[] }>(`/api/assistant/session/${sessionId}/messages`),

  getProposals: (sessionId: string) =>
    request<{ proposals: any[] }>(`/api/assistant/session/${sessionId}/proposals`),

  acceptProposal: (sessionId: string, proposalId: string) =>
    request<{ success: boolean; result: any }>(`/api/assistant/proposals/${proposalId}/accept`, {
      method: 'POST',
    } as any),

  dismissProposal: (sessionId: string, proposalId: string) =>
    request<{ success: boolean }>(`/api/assistant/proposals/${proposalId}/reject`, {
      method: 'POST',
    } as any),
};