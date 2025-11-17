-- Create assets table for storing generated game assets
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  generation_prompt TEXT,
  generation_model TEXT NOT NULL,
  style_tags TEXT[] DEFAULT '{}',
  project_name TEXT,
  is_favorite BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_name ON assets(project_name) WHERE project_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_style_tags ON assets USING GIN(style_tags);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);

-- Create generation_history table for tracking all generation attempts
CREATE TABLE IF NOT EXISTS generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  model_used TEXT NOT NULL,
  model_params JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for generation_history
CREATE INDEX IF NOT EXISTS idx_history_user_id ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_asset_id ON generation_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON generation_history(created_at DESC);

-- Create export_configs table for saving export presets
CREATE TABLE IF NOT EXISTS export_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  config_name TEXT NOT NULL,
  export_format TEXT NOT NULL,
  target_engine TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, config_name)
);

-- Create index for export_configs
CREATE INDEX IF NOT EXISTS idx_export_configs_user_id ON export_configs(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_export_configs_updated_at
  BEFORE UPDATE ON export_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (update these based on your auth setup)
-- For now, allow all operations (adjust in production)
CREATE POLICY "Allow all operations on assets" ON assets
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on generation_history" ON generation_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on export_configs" ON export_configs
  FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for game assets (run this via Supabase dashboard or CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('game-assets', 'game-assets', true);
