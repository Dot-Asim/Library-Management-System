-- Seed Book Copies for each book
INSERT INTO book_copies (barcode, condition, status, book_id, created_at, updated_at)
SELECT 
    'BC-' || isbn || '-01', 
    'NEW', 
    'AVAILABLE', 
    id, 
    NOW(), 
    NOW()
FROM books
ON CONFLICT (barcode) DO NOTHING;
