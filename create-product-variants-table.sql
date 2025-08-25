-- Migration script to create product_variants table
-- Run this script in your PostgreSQL database

CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color TEXT,
    size TEXT,
    price DOUBLE PRECISION NOT NULL,
    mrp DOUBLE PRECISION,
    stock INTEGER NOT NULL DEFAULT 0,
    weight DOUBLE PRECISION,
    images JSONB,
    sku TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON product_variants(color);
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON product_variants(size);

-- Insert some sample data for testing
INSERT INTO product_variants (product_id, color, size, price, mrp, stock, weight, images, sku) VALUES
(1, 'Red', 'M', 15999, 17999, 10, 0.5, '["https://example.com/red-m-1.jpg", "https://example.com/red-m-2.jpg"]', 'SMART-RED-M'),
(1, 'Blue', 'L', 15999, 17999, 15, 0.5, '["https://example.com/blue-l-1.jpg", "https://example.com/blue-l-2.jpg"]', 'SMART-BLUE-L'),
(1, 'Black', 'S', 15999, 17999, 8, 0.5, '["https://example.com/black-s-1.jpg", "https://example.com/black-s-2.jpg"]', 'SMART-BLACK-S')
ON CONFLICT DO NOTHING;

-- Update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_variants_updated_at 
    BEFORE UPDATE ON product_variants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
