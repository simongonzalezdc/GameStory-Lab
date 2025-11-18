/**
 * API Service
 * Centralized API client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class APIError extends Error {
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

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Network error', 0, error);
  }
}

// Projects API
export const projectsAPI = {
  list: () => request<{ projects: any[] }>('/api/projects'),

  get: (id: string) => request<{ project: any; concepts: any[] }>(`/api/projects/${id}`),

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
};

// Templates API
export const templatesAPI = {
  list: () => request<{ genres: Array<{ id: string; name: string; description: string }> }>('/api/templates'),

  get: (genre: string) => request<any>(`/api/templates/${genre}`),

  customize: (genre: string, data: { mechanicsOverrides?: any; loreOverrides?: any }) =>
    request<{ genre: string; mechanics: any; lore: any }>(`/api/templates/${genre}/customize`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createProject: (genre: string, data: { projectName: string; mechanicsOverrides?: any; loreOverrides?: any }) =>
    request<{ project: any; concept: any }>(`/api/templates/${genre}/create-project`, {
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

export { APIError };
