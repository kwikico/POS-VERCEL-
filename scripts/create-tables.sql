-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  barcode VARCHAR(255),
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(255) PRIMARY KEY,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  is_return BOOLEAN DEFAULT FALSE,
  tax_applied BOOLEAN DEFAULT TRUE,
  discount_type VARCHAR(20),
  discount_value DECIMAL(10, 2),
  discount_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transaction_items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(255) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Insert some sample products if the table is empty
INSERT INTO products (id, name, price, category, barcode, stock_quantity)
SELECT * FROM (VALUES
  ('prod_001', 'Coffee - Medium Roast', 12.99, 'Beverages', '1234567890123', 50),
  ('prod_002', 'Chocolate Bar', 3.49, 'Snacks', '2345678901234', 100),
  ('prod_003', 'Notebook - A4', 8.99, 'Stationery', '3456789012345', 25),
  ('prod_004', 'Pen - Blue Ink', 1.99, 'Stationery', '4567890123456', 200),
  ('prod_005', 'Energy Drink', 2.99, 'Beverages', '5678901234567', 75)
) AS sample_data(id, name, price, category, barcode, stock_quantity)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- Enable Row Level Security (optional - uncomment if needed)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (optional - uncomment if RLS is enabled)
-- CREATE POLICY "Allow public read access on products" ON products FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access on products" ON products FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update access on products" ON products FOR UPDATE USING (true);
-- CREATE POLICY "Allow public delete access on products" ON products FOR DELETE USING (true);

-- CREATE POLICY "Allow public read access on transactions" ON transactions FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access on transactions" ON transactions FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update access on transactions" ON transactions FOR UPDATE USING (true);
-- CREATE POLICY "Allow public delete access on transactions" ON transactions FOR DELETE USING (true);

-- CREATE POLICY "Allow public read access on transaction_items" ON transaction_items FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access on transaction_items" ON transaction_items FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update access on transaction_items" ON transaction_items FOR UPDATE USING (true);
-- CREATE POLICY "Allow public delete access on transaction_items" ON transaction_items FOR DELETE USING (true);
