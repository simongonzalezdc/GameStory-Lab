/**
 * API Configuration
 * Centralized API endpoint configuration
 */

// Get API base URL from environment or default to localhost
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Assets
  assets: `${API_BASE_URL}/api/assets`,
  assetById: (id: string) => `${API_BASE_URL}/api/assets/${id}`,
  assetVersions: (id: string) => `${API_BASE_URL}/api/assets/${id}/versions`,
  assetDuplicate: (id: string) => `${API_BASE_URL}/api/assets/${id}/duplicate`,

  // Asset Packs
  packs: `${API_BASE_URL}/api/packs`,
  packById: (id: string) => `${API_BASE_URL}/api/packs/${id}`,

  // Generation
  generate: `${API_BASE_URL}/api/generate`,

  // Export
  export: `${API_BASE_URL}/api/export/sprite-sheet`,

  // Health
  health: `${API_BASE_URL}/health`,
  ollamaHealth: `${API_BASE_URL}/health/ollama`,
} as const;

// Asset file URL helper
export const getAssetFileUrl = (fileUrl: string): string => {
  if (fileUrl.startsWith('http')) {
    return fileUrl;
  }
  return `${API_BASE_URL}${fileUrl}`;
};
