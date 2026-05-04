-- Seed Authors
INSERT INTO authors (name, biography) VALUES 
('George Orwell', 'English novelist, essayist, journalist and critic.'),
('J.R.R. Tolkien', 'English writer, poet, philologist, and academic.'),
('Jane Austen', 'English novelist known primarily for her six major novels.'),
('F. Scott Fitzgerald', 'American novelist and short story writer.'),
('Charles Dickens', 'English writer and social critic.'),
('Leo Tolstoy', 'Russian writer who is regarded as one of the greatest authors of all time.'),
('Mark Twain', 'American writer, humorist, entrepreneur, publisher, and lecturer.'),
('Ernest Hemingway', 'American novelist, short-story writer, and journalist.')
ON CONFLICT DO NOTHING;

-- Seed Categories
INSERT INTO categories (name, description) VALUES 
('Fiction', 'Literature in the form of prose that describes imaginary events and people.'),
('Science Fiction', 'Speculative fiction that typically deals with imaginative and futuristic concepts.'),
('Classic', 'A book accepted as being exemplary or noteworthy.'),
('Fantasy', 'Genre of speculative fiction set in a fictional universe.'),
('Biography', 'An account of someone''s life written by someone else.')
ON CONFLICT DO NOTHING;

-- Seed Books (Physical and Digital)
-- We use subqueries to get IDs
DO $$ 
DECLARE 
    classic_id BIGINT;
    scifi_id BIGINT;
    fantasy_id BIGINT;
    fiction_id BIGINT;
    orwell_id BIGINT;
    tolkien_id BIGINT;
    austen_id BIGINT;
    fitzgerald_id BIGINT;
    dickens_id BIGINT;
BEGIN
    SELECT id INTO classic_id FROM categories WHERE name = 'Classic';
    SELECT id INTO scifi_id FROM categories WHERE name = 'Science Fiction';
    SELECT id INTO fantasy_id FROM categories WHERE name = 'Fantasy';
    SELECT id INTO fiction_id FROM categories WHERE name = 'Fiction';

    SELECT id INTO orwell_id FROM authors WHERE name = 'George Orwell';
    SELECT id INTO tolkien_id FROM authors WHERE name = 'J.R.R. Tolkien';
    SELECT id INTO austen_id FROM authors WHERE name = 'Jane Austen';
    SELECT id INTO fitzgerald_id FROM authors WHERE name = 'F. Scott Fitzgerald';
    SELECT id INTO dickens_id FROM authors WHERE name = 'Charles Dickens';

    -- 1984 (Both)
    INSERT INTO books (title, isbn, publication_year, publisher, language, description, author_id, category_id, book_type, content_url, is_free)
    VALUES ('1984', '9780451524935', 1949, 'Secker & Warburg', 'English', 'Dystopian social science fiction novel.', orwell_id, scifi_id, 'BOTH', 'https://www.gutenberg.org/ebooks/74400.epub.images', true)
    ON CONFLICT (isbn) DO NOTHING;

    -- Animal Farm (Digital)
    INSERT INTO books (title, isbn, publication_year, publisher, language, description, author_id, category_id, book_type, content_url, is_free)
    VALUES ('Animal Farm', '9780451526342', 1945, 'Secker & Warburg', 'English', 'Satirical allegorical novella.', orwell_id, fiction_id, 'DIGITAL', 'https://www.gutenberg.org/ebooks/1945', true)
    ON CONFLICT (isbn) DO NOTHING;

    -- The Hobbit (Physical)
    INSERT INTO books (title, isbn, publication_year, publisher, language, description, author_id, category_id, book_type, is_free)
    VALUES ('The Hobbit', '9780261102217', 1937, 'George Allen & Unwin', 'English', 'Children''s fantasy novel.', tolkien_id, fantasy_id, 'PHYSICAL', false)
    ON CONFLICT (isbn) DO NOTHING;

    -- Pride and Prejudice (Both)
    INSERT INTO books (title, isbn, publication_year, publisher, language, description, author_id, category_id, book_type, content_url, is_free)
    VALUES ('Pride and Prejudice', '9780141439518', 1813, 'T. Egerton', 'English', 'Romantic novel of manners.', austen_id, classic_id, 'BOTH', 'https://www.gutenberg.org/ebooks/1342.epub.images', true)
    ON CONFLICT (isbn) DO NOTHING;

    -- The Great Gatsby (Both)
    INSERT INTO books (title, isbn, publication_year, publisher, language, description, author_id, category_id, book_type, content_url, is_free)
    VALUES ('The Great Gatsby', '9780743273565', 1925, 'Charles Scribner''s Sons', 'English', 'Novel that follows a cast of characters living in the fictional towns of West Egg.', fitzgerald_id, classic_id, 'BOTH', 'https://www.gutenberg.org/ebooks/64317.epub.images', true)
    ON CONFLICT (isbn) DO NOTHING;

    -- Great Expectations (Digital)
    INSERT INTO books (title, isbn, publication_year, publisher, language, description, author_id, category_id, book_type, content_url, is_free)
    VALUES ('Great Expectations', '9780141439556', 1861, 'Chapman & Hall', 'English', 'The education of an orphan nicknamed Pip.', dickens_id, classic_id, 'DIGITAL', 'https://www.gutenberg.org/ebooks/1400', true)
    ON CONFLICT (isbn) DO NOTHING;

END $$;
