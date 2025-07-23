-- Add custom_price column to products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'custom_price') THEN
        ALTER TABLE products ADD COLUMN custom_price BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update existing products with custom_price based on category
UPDATE products 
SET custom_price = TRUE 
WHERE category = 'custom-price' AND custom_price IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_custom_price ON products(custom_price);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
