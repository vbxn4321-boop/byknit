-- Migration: Add grid data columns to patterns table for PDF generation
-- These columns store the grid editor data so marketplace can render the pattern chart

-- Add grid_data column (stores 2D array of color indices)
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS grid_data jsonb;

-- Add palette column (stores array of hex color strings)
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS palette jsonb;

-- Add grid dimensions
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS grid_width integer;
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS grid_height integer;

-- Add comments for documentation
COMMENT ON COLUMN patterns.grid_data IS 'Grid editor data: 2D array of color indices from palette';
COMMENT ON COLUMN patterns.palette IS 'Color palette: array of hex color strings used in grid';
COMMENT ON COLUMN patterns.grid_width IS 'Number of columns in the grid pattern';
COMMENT ON COLUMN patterns.grid_height IS 'Number of rows in the grid pattern';
