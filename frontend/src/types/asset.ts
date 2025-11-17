export interface Asset {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  generation_prompt: string | null;
  generation_model: string;
  style_tags: string[];
  project_name: string | null;
  is_favorite: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Phase 2: Versioning fields
  parent_asset_id: string | null;
  version_number: number;
  refinement_instruction: string | null;
}

export interface AssetsListResponse {
  assets: Asset[];
  total: number;
  limit: number;
  offset: number;
}
