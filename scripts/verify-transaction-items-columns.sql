-- Let's check what the actual transaction_items table structure is
-- This will help us confirm the correct column names

-- First, let's see all columns in transaction_items
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transaction_items' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify the exact column names in transaction_items
\d transaction_items;

-- Let's also check if there are any existing records to see the structure
SELECT * FROM transaction_items LIMIT 5;

-- Check for any price-related columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'transaction_items' 
AND column_name LIKE '%price%';

-- Check the original table creation to see what columns were defined
SELECT 
    t.table_name,
    c.column_name,
    c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('transaction_items', 'transactions', 'products')
    AND t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- Check the relationship with transactions table
SELECT 
  ti.product_id,
  ti.quantity,
  ti.price,
  t.created_at,
  t.total,
  t.is_return
FROM transaction_items ti
JOIN transactions t ON ti.transaction_id = t.id
LIMIT 5;
