import { getLLMRouter } from '../ai/router';

export interface License {
  id: string;
  name: string;
  category: 'permissive' | 'copyleft' | 'proprietary';
  permissions: string[];
  conditions: string[];
  limitations: string[];
  description: string;
  bestFor: string[];
  notRecommendedFor: string[];
  popularProjects: string[];
  spdxId: string;
}

export interface LicenseRecommendation {
  recommended: License;
  alternatives: License[];
  reasoning: string;
  warnings?: string[];
}

export const POPULAR_LICENSES: Record<string, License> = {
  mit: {
    id: 'mit',
    name: 'MIT License',
    category: 'permissive',
    spdxId: 'MIT',
    permissions: ['Commercial use', 'Modification', 'Distribution', 'Private use'],
    conditions: ['License and copyright notice'],
    limitations: ['Liability', 'Warranty'],
    description:
      'A short and simple permissive license with conditions only requiring preservation of copyright and license notices.',
    bestFor: [
      'Small to medium projects',
      'Libraries and frameworks',
      'Projects wanting maximum adoption',
      'Academic projects',
    ],
    notRecommendedFor: ['Projects requiring derivative works to remain open source'],
    popularProjects: ['React', 'Node.js', 'jQuery', 'Rails'],
  },
  apache2: {
    id: 'apache2',
    name: 'Apache License 2.0',
    category: 'permissive',
    spdxId: 'Apache-2.0',
    permissions: ['Commercial use', 'Modification', 'Distribution', 'Patent use', 'Private use'],
    conditions: ['License and copyright notice', 'State changes'],
    limitations: ['Liability', 'Warranty', 'Trademark use'],
    description:
      'A permissive license with explicit grants of patent rights and protection against trademark use.',
    bestFor: [
      'Large projects',
      'Projects with potential patent concerns',
      'Corporate environments',
      'Projects wanting patent protection',
    ],
    notRecommendedFor: ['Simple scripts or utilities where MIT would suffice'],
    popularProjects: ['Apache HTTP Server', 'Kubernetes', 'TensorFlow', 'Android'],
  },
  gpl3: {
    id: 'gpl3',
    name: 'GNU General Public License v3.0',
    category: 'copyleft',
    spdxId: 'GPL-3.0',
    permissions: ['Commercial use', 'Modification', 'Distribution', 'Patent use', 'Private use'],
    conditions: [
      'Disclose source',
      'License and copyright notice',
      'State changes',
      'Same license (copyleft)',
    ],
    limitations: ['Liability', 'Warranty'],
    description:
      'Strong copyleft license requiring derivative works to be open source under the same license.',
    bestFor: [
      'Projects ensuring all derivatives remain open source',
      'Community-driven projects',
      'Software freedom advocacy',
    ],
    notRecommendedFor: [
      'Libraries (consider LGPL instead)',
      'Projects wanting commercial adoption',
      'Permissive ecosystems',
    ],
    popularProjects: ['Linux Kernel', 'GIMP', 'Git', 'GCC'],
  },
  agpl3: {
    id: 'agpl3',
    name: 'GNU Affero General Public License v3.0',
    category: 'copyleft',
    spdxId: 'AGPL-3.0',
    permissions: ['Commercial use', 'Modification', 'Distribution', 'Patent use', 'Private use'],
    conditions: [
      'Disclose source',
      'License and copyright notice',
      'State changes',
      'Same license',
      'Network use is distribution',
    ],
    limitations: ['Liability', 'Warranty'],
    description:
      'Strongest copyleft license. Like GPL but also requires source disclosure for network/SaaS use.',
    bestFor: [
      'Web applications and SaaS',
      'Projects preventing SaaS proprietary forks',
      'Strong copyleft advocacy',
    ],
    notRecommendedFor: ['Libraries', 'Projects wanting commercial SaaS adoption'],
    popularProjects: ['MongoDB (historical)', 'Mastodon', 'OnlyOffice'],
  },
  bsd3: {
    id: 'bsd3',
    name: 'BSD 3-Clause License',
    category: 'permissive',
    spdxId: 'BSD-3-Clause',
    permissions: ['Commercial use', 'Modification', 'Distribution', 'Private use'],
    conditions: ['License and copyright notice'],
    limitations: ['Liability', 'Warranty', 'Use for endorsement'],
    description:
      'Permissive license similar to MIT but explicitly prohibits using contributor names for endorsement.',
    bestFor: [
      'Academic projects',
      'Projects concerned about name misuse',
      'Simple permissive licensing',
    ],
    notRecommendedFor: ['Projects needing patent protection (use Apache 2.0)'],
    popularProjects: ['Flask', 'Django', 'NumPy', 'Go'],
  },
  lgpl3: {
    id: 'lgpl3',
    name: 'GNU Lesser General Public License v3.0',
    category: 'copyleft',
    spdxId: 'LGPL-3.0',
    permissions: ['Commercial use', 'Modification', 'Distribution', 'Patent use', 'Private use'],
    conditions: [
      'Disclose source (library only)',
      'License and copyright notice',
      'State changes',
      'Same license (library only)',
    ],
    limitations: ['Liability', 'Warranty'],
    description:
      'Weak copyleft allowing proprietary use when used as a library, but modifications must be open sourced.',
    bestFor: [
      'Libraries in copyleft projects',
      'Projects wanting derivatives open but allowing proprietary use',
    ],
    notRecommendedFor: ['Applications (use GPL)', 'Fully permissive licensing (use MIT/Apache)'],
    popularProjects: ['Qt', 'GTK', 'FFmpeg', 'GNU C Library'],
  },
  mpl2: {
    id: 'mpl2',
    name: 'Mozilla Public License 2.0',
    category: 'copyleft',
    spdxId: 'MPL-2.0',
    permissions: ['Commercial use', 'Modification', 'Distribution', 'Patent use', 'Private use'],
    conditions: [
      'Disclose source (file-level)',
      'License and copyright notice',
      'Same license (file-level)',
    ],
    limitations: ['Liability', 'Warranty', 'Trademark use'],
    description:
      'Weak copyleft requiring modifications to specific files to remain open, allowing proprietary combinations.',
    bestFor: [
      'Projects wanting file-level copyleft',
      'Balance between permissive and strong copyleft',
    ],
    notRecommendedFor: ['Simple projects (too complex)', 'Strong copyleft needs (use GPL)'],
    popularProjects: ['Firefox', 'Thunderbird', 'LibreOffice'],
  },
  unlicense: {
    id: 'unlicense',
    name: 'The Unlicense',
    category: 'permissive',
    spdxId: 'Unlicense',
    permissions: ['Commercial use', 'Modification', 'Distribution', 'Private use'],
    conditions: [],
    limitations: ['Liability', 'Warranty'],
    description: 'Public domain dedication. Releases all rights and imposes no conditions whatsoever.',
    bestFor: ['Public domain dedication', 'Maximum freedom', 'Simple scripts and utilities'],
    notRecommendedFor: ['Jurisdictions without public domain concept', 'Corporate projects'],
    popularProjects: ['SQLite (public domain)', 'stb libraries'],
  },
};

/**
 * Get license recommendations based on project characteristics
 */
export async function getLicenseRecommendation(
  projectType: 'library' | 'application' | 'saas' | 'utility',
  preferences: {
    allowCommercial?: boolean;
    requireOpenSource?: boolean;
    allowPatentUse?: boolean;
    simplicityPreferred?: boolean;
  },
  model: string = 'smollm2:1.7b'
): Promise<LicenseRecommendation> {
  const { allowCommercial = true, requireOpenSource = false, allowPatentUse = true, simplicityPreferred = false } = preferences;

  // Rule-based initial recommendation
  let recommendedId: string;

  if (projectType === 'saas' && requireOpenSource) {
    recommendedId = 'agpl3'; // Prevents proprietary SaaS forks
  } else if (requireOpenSource) {
    recommendedId = projectType === 'library' ? 'lgpl3' : 'gpl3';
  } else if (simplicityPreferred || projectType === 'utility') {
    recommendedId = 'mit';
  } else if (allowPatentUse && !simplicityPreferred) {
    recommendedId = 'apache2';
  } else {
    recommendedId = 'mit';
  }

  const recommended = POPULAR_LICENSES[recommendedId];

  // Select alternatives
  const alternatives: License[] = [];

  if (recommendedId === 'mit') {
    alternatives.push(POPULAR_LICENSES.apache2, POPULAR_LICENSES.bsd3);
  } else if (recommendedId === 'apache2') {
    alternatives.push(POPULAR_LICENSES.mit, POPULAR_LICENSES.mpl2);
  } else if (recommendedId === 'gpl3') {
    alternatives.push(POPULAR_LICENSES.lgpl3, POPULAR_LICENSES.agpl3, POPULAR_LICENSES.mpl2);
  } else if (recommendedId === 'agpl3') {
    alternatives.push(POPULAR_LICENSES.gpl3, POPULAR_LICENSES.mpl2);
  } else {
    alternatives.push(POPULAR_LICENSES.mit, POPULAR_LICENSES.apache2);
  }

  // Generate AI reasoning
  const llmRouter = getLLMRouter();

  const prompt = `Explain why the ${recommended.name} is recommended for a ${projectType} project with these preferences:

- Allow commercial use: ${allowCommercial}
- Require derivative works to be open source: ${requireOpenSource}
- Allow patent use: ${allowPatentUse}
- Prefer simplicity: ${simplicityPreferred}

Provide a brief (2-3 sentence) explanation focusing on the key reasons this license fits the requirements.`;

  const response = await llmRouter.chat(
    [
      { role: 'system', content: 'You are an open source licensing expert.' },
      { role: 'user', content: prompt },
    ],
    model,
    { temperature: 0.6 }
  );

  // Generate warnings if needed
  const warnings: string[] = [];
  if (recommended.category === 'copyleft' && projectType === 'library') {
    warnings.push(
      'Copyleft licenses may limit adoption for libraries as they require derivative works to use the same license.'
    );
  }
  if (recommended.id === 'agpl3') {
    warnings.push(
      'AGPL is the strongest copyleft license and may discourage commercial adoption, especially for SaaS use cases.'
    );
  }

  return {
    recommended,
    alternatives,
    reasoning: response.content,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Generate license text with project details
 */
export function generateLicenseText(
  licenseId: string,
  projectName: string,
  copyrightHolder: string,
  year: number = new Date().getFullYear()
): string {
  const templates: Record<string, string> = {
    mit: `MIT License

Copyright (c) ${year} ${copyrightHolder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,

    apache2: `                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

Copyright ${year} ${copyrightHolder}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,

    bsd3: `BSD 3-Clause License

Copyright (c) ${year}, ${copyrightHolder}

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,

    unlicense: `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>`,
  };

  if (templates[licenseId]) {
    return templates[licenseId];
  }

  // For GPL/AGPL/LGPL/MPL, provide instructions to get full license text
  const gplFamily: Record<string, string> = {
    gpl3: 'https://www.gnu.org/licenses/gpl-3.0.txt',
    agpl3: 'https://www.gnu.org/licenses/agpl-3.0.txt',
    lgpl3: 'https://www.gnu.org/licenses/lgpl-3.0.txt',
    mpl2: 'https://www.mozilla.org/en-US/MPL/2.0/',
  };

  if (gplFamily[licenseId]) {
    return `${projectName}
Copyright (C) ${year} ${copyrightHolder}

This program is licensed under the ${POPULAR_LICENSES[licenseId].name}.

Full license text available at: ${gplFamily[licenseId]}

For ${POPULAR_LICENSES[licenseId].name} projects, include this header in each source file:

${projectName} - [brief description]
Copyright (C) ${year}  ${copyrightHolder}

This program is free software: you can redistribute it and/or modify
it under the terms of the ${POPULAR_LICENSES[licenseId].name} as published by
the Free Software Foundation${licenseId === 'gpl3' || licenseId === 'agpl3' || licenseId === 'lgpl3' ? ', either version 3\nof the License, or (at your option) any later version' : ''}.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
${POPULAR_LICENSES[licenseId].name} for more details.

You should have received a copy of the ${POPULAR_LICENSES[licenseId].name}
along with this program.  If not, see <${gplFamily[licenseId]}>.`;
  }

  return `License: ${POPULAR_LICENSES[licenseId]?.name || 'Unknown'}

Please visit the license URL to get the full license text.`;
}

/**
 * Compare multiple licenses
 */
export function compareLicenses(licenseIds: string[]): {
  licenses: License[];
  comparison: {
    permissions: Record<string, string[]>;
    conditions: Record<string, string[]>;
    limitations: Record<string, string[]>;
  };
  summary: string;
} {
  const licenses = licenseIds.map((id) => POPULAR_LICENSES[id]).filter(Boolean);

  const allPermissions = new Set<string>();
  const allConditions = new Set<string>();
  const allLimitations = new Set<string>();

  licenses.forEach((license) => {
    license.permissions.forEach((p) => allPermissions.add(p));
    license.conditions.forEach((c) => allConditions.add(c));
    license.limitations.forEach((l) => allLimitations.add(l));
  });

  const comparison = {
    permissions: {} as Record<string, string[]>,
    conditions: {} as Record<string, string[]>,
    limitations: {} as Record<string, string[]>,
  };

  allPermissions.forEach((perm) => {
    comparison.permissions[perm] = licenses
      .filter((l) => l.permissions.includes(perm))
      .map((l) => l.id);
  });

  allConditions.forEach((cond) => {
    comparison.conditions[cond] = licenses
      .filter((l) => l.conditions.includes(cond))
      .map((l) => l.id);
  });

  allLimitations.forEach((lim) => {
    comparison.limitations[lim] = licenses
      .filter((l) => l.limitations.includes(lim))
      .map((l) => l.id);
  });

  const permissiveLicenses = licenses.filter((l) => l.category === 'permissive').map((l) => l.name);
  const copyleftLicenses = licenses.filter((l) => l.category === 'copyleft').map((l) => l.name);

  let summary = `Comparing ${licenses.length} licenses:\n\n`;
  if (permissiveLicenses.length > 0) {
    summary += `Permissive licenses (${permissiveLicenses.length}): ${permissiveLicenses.join(', ')}\n`;
  }
  if (copyleftLicenses.length > 0) {
    summary += `Copyleft licenses (${copyleftLicenses.length}): ${copyleftLicenses.join(', ')}\n`;
  }

  return {
    licenses,
    comparison,
    summary,
  };
}

/**
 * Get all available licenses
 */
export function getAllLicenses(): License[] {
  return Object.values(POPULAR_LICENSES);
}

/**
 * Dependency license information
 */
export interface DependencyLicense {
  name: string;
  version: string;
  license: string;
  compatible: boolean;
  warning?: string;
}

/**
 * License compatibility result
 */
export interface LicenseCompatibilityResult {
  compatible: boolean;
  dependencies: DependencyLicense[];
  incompatibleCount: number;
  warnings: string[];
  summary: string;
}

/**
 * Check if a dependency license is compatible with the selected license
 */
function isLicenseCompatible(projectLicense: string, dependencyLicense: string): { compatible: boolean; warning?: string } {
  // Normalize license strings
  const normProjectLicense = projectLicense.toLowerCase().replace(/\s+/g, '-');
  const normDepLicense = dependencyLicense.toLowerCase().replace(/\s+/g, '-');

  // GPL licenses are very restrictive - dependencies must be GPL-compatible
  if (normProjectLicense.includes('gpl') || normProjectLicense.includes('agpl')) {
    // Permissive licenses are compatible with GPL
    if (normDepLicense.includes('mit') || normDepLicense.includes('bsd') || normDepLicense.includes('apache') || normDepLicense.includes('isc')) {
      return { compatible: true };
    }
    // Same GPL version or LGPL is compatible
    if (normDepLicense.includes(normProjectLicense) || normDepLicense.includes('lgpl')) {
      return { compatible: true };
    }
    return {
      compatible: false,
      warning: `GPL/AGPL requires all dependencies to be GPL-compatible. ${dependencyLicense} may not be compatible.`,
    };
  }

  // Permissive licenses (MIT, BSD, Apache) are generally compatible with most licenses
  if (normProjectLicense.includes('mit') || normProjectLicense.includes('bsd') || normProjectLicense.includes('apache')) {
    // GPL dependencies in permissive projects can be problematic
    if (normDepLicense.includes('gpl') && !normDepLicense.includes('lgpl')) {
      return {
        compatible: false,
        warning: `GPL dependency in a ${projectLicense} project requires the entire project to be GPL. Consider using LGPL alternative if available.`,
      };
    }
    return { compatible: true };
  }

  // Default: assume compatible but add warning for unknown combinations
  return {
    compatible: true,
    warning: `License compatibility between ${projectLicense} and ${dependencyLicense} should be verified manually.`,
  };
}

/**
 * Check dependency license compatibility
 * Note: This is a simplified check. For production use, consider using a dedicated tool like 'license-checker'
 */
export async function checkDependencyLicenseCompatibility(
  projectPath: string,
  selectedLicense: string
): Promise<LicenseCompatibilityResult> {
  const dependencies: DependencyLicense[] = [];
  const warnings: string[] = [];
  let incompatibleCount = 0;

  try {
    const fs = await import('fs');
    const path = await import('path');

    // Read package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        compatible: true,
        dependencies: [],
        incompatibleCount: 0,
        warnings: ['No package.json found'],
        summary: 'No package.json found in project',
      };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Read node_modules to check installed dependency licenses
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      warnings.push('node_modules not found. Run npm install to check dependency licenses.');
    } else {
      // Check each dependency
      for (const [depName, depVersion] of Object.entries(allDeps)) {
        try {
          const depPackageJsonPath = path.join(nodeModulesPath, depName as string, 'package.json');
          if (fs.existsSync(depPackageJsonPath)) {
            const depPackageJson = JSON.parse(fs.readFileSync(depPackageJsonPath, 'utf-8'));
            const depLicense = depPackageJson.license || 'Unknown';

            const { compatible, warning } = isLicenseCompatible(selectedLicense, depLicense);

            dependencies.push({
              name: depName as string,
              version: depVersion as string,
              license: depLicense,
              compatible,
              warning,
            });

            if (!compatible) {
              incompatibleCount++;
            }

            if (warning) {
              warnings.push(`${depName}: ${warning}`);
            }
          }
        } catch (error) {
          // Skip dependencies that can't be read
          continue;
        }
      }
    }

    // Generate summary
    let summary = `Checked ${dependencies.length} dependencies for compatibility with ${selectedLicense}.\n`;
    if (incompatibleCount > 0) {
      summary += `⚠️  Found ${incompatibleCount} potentially incompatible ${incompatibleCount === 1 ? 'dependency' : 'dependencies'}.\n`;
    } else if (dependencies.length > 0) {
      summary += `✓ All dependencies appear to be compatible.\n`;
    }
    if (warnings.length > 0) {
      summary += `${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'} found.`;
    }

    return {
      compatible: incompatibleCount === 0,
      dependencies,
      incompatibleCount,
      warnings,
      summary,
    };
  } catch (error) {
    return {
      compatible: true,
      dependencies: [],
      incompatibleCount: 0,
      warnings: [`Error checking dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`],
      summary: 'Failed to check dependency licenses',
    };
  }
}
