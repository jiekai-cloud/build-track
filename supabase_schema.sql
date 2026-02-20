-- Supabase Schema Initialization for Quality of Life SEMS

-- 1. Create the universal NoSQL-like table for storing all application entities
CREATE TABLE app_data (
    collection TEXT NOT NULL,       -- e.g., 'projects', 'customers', 'quotations'
    item_id TEXT NOT NULL,          -- e.g., 'P-2026-001', 'C-101'
    data JSONB NOT NULL,            -- The actual JSON object of the entity
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (collection, item_id)
);

-- 2. Create index for faster querying by collection
CREATE INDEX idx_app_data_collection ON app_data (collection);

-- 3. Enable Row Level Security (RLS) but set it to allow all for now
-- Note: In a production environment with authenticated users, we will restrict this
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access"
ON app_data FOR SELECT
USING (true);

CREATE POLICY "Allow anonymous insert access"
ON app_data FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anonymous update access"
ON app_data FOR UPDATE
USING (true);

CREATE POLICY "Allow anonymous delete access"
ON app_data FOR DELETE
USING (true);

-- 4. Create a function to auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_data_modtime
BEFORE UPDATE ON app_data
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
