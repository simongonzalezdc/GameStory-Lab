export interface AssetPack {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tags: string[];
  asset_ids: string[];
  asset_count: number;
  created_at: string;
  updated_at: string;
}

export interface AssetPackCreate {
  name: string;
  description?: string;
  tags?: string[];
  asset_ids?: string[];
}

export interface AssetPackListResponse {
  packs: AssetPack[];
  total: number;
}
