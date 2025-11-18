import axios from 'axios';
import type { GenerationRequest, GenerationResponse, RefineRequest, OllamaStatus } from '../types/generation';
import type { Asset, AssetsListResponse } from '../types/asset';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// No authentication required for local use

export const apiClient = {
  // Health check
  async checkHealth(): Promise<{ status: string; service: string }> {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Check Ollama status
  async checkOllamaStatus(): Promise<OllamaStatus> {
    const response = await api.get<OllamaStatus>('/api/health/ollama');
    return response.data;
  },

  // Generate asset
  async generateAsset(request: GenerationRequest): Promise<GenerationResponse> {
    const response = await api.post<GenerationResponse>('/api/generate', request);
    return response.data;
  },

  // Refine asset
  async refineAsset(request: RefineRequest): Promise<GenerationResponse> {
    const response = await api.post<GenerationResponse>('/api/generate/refine', request);
    return response.data;
  },

  // Batch generate assets
  async batchGenerate(request: {
    prompt: string;
    model: string;
    count: number;
    dimensions?: { width: number; height: number };
    style_tags?: string[];
    project_name?: string | null;
  }): Promise<{ success: boolean; assets: any[]; total_count: number; generation_time_ms: number; errors: string[] }> {
    const response = await api.post('/api/generate/batch', request);
    return response.data;
  },

  // Convert image to sprite
  async convertImageToSprite(formData: FormData): Promise<GenerationResponse> {
    const response = await api.post<GenerationResponse>('/api/generate/convert', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // List assets
  async listAssets(params?: {
    project_name?: string;
    style_tags?: string;
    search_query?: string;
    limit?: number;
    offset?: number;
  }): Promise<AssetsListResponse> {
    const response = await api.get<AssetsListResponse>('/api/assets', { params });
    return response.data;
  },

  // Delete asset
  async deleteAsset(assetId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/assets/${assetId}`);
    return response.data;
  },

  // Get asset version history
  async getAssetVersions(assetId: string): Promise<Asset[]> {
    const response = await api.get<Asset[]>(`/api/assets/${assetId}/versions`);
    return response.data;
  },

  // Export assets
  async exportAssets(request: {
    asset_ids: string[];
    format: string;
    target_engine?: string;
    settings?: any;
    resolution_multiplier?: number;
  }): Promise<Blob> {
    const response = await api.post('/api/export', request, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
