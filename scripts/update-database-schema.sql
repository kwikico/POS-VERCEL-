-- Update products table with new columns for advanced reporting
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_trackable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tracking_category VARCHAR(20) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS units_sold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_restocked TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS supplier VARCHAR(255),
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2);

-- Create stock_alerts table
CREATE TABLE IF NOT EXISTS stock_alerts (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  current_stock INTEGER NOT NULL,
  min_stock_level INTEGER NOT NULL,
  category VARCHAR(100),
  tracking_category VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product_id ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_active ON stock_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_products_tracking_category ON products(tracking_category);
CREATE INDEX IF NOT EXISTS idx_products_min_stock ON products(min_stock_level);

-- Update existing products to have basic tracking enabled
UPDATE products 
SET is_trackable = TRUE, 
    min_stock_level = 5,
    tracking_category = 'general'
WHERE min_stock_level IS NULL OR min_stock_level = 0;

-- Add some sample tracking categories for demonstration
UPDATE products 
SET tracking_category = 'alcohol' 
WHERE LOWER(name) LIKE '%beer%' 
   OR LOWER(name) LIKE '%wine%' 
   OR LOWER(name) LIKE '%vodka%'
   OR LOWER(name) LIKE '%whiskey%';

UPDATE products 
SET tracking_category = 'tobacco' 
WHERE LOWER(name) LIKE '%cigarette%' 
   OR LOWER(name) LIKE '%cigar%' 
   OR LOWER(name) LIKE '%tobacco%';

UPDATE products 
SET tracking_category = 'high-value' 
WHERE price > 50;
