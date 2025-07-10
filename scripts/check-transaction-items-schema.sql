-- Check the actual structure of transaction_items table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'transaction_items' 
ORDER BY ordinal_position;

-- Also check if the table exists and get sample data
SELECT COUNT(*) as total_records FROM transaction_items;

-- Get a sample record to see the actual column names
SELECT * FROM transaction_items LIMIT 1;
