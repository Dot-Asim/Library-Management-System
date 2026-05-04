import requests
import psycopg2

DB_CONFIG = {
    "dbname": "lms_catalog_db",
    "user": "ulms_admin",
    "password": "ulms_secret_2026",
    "host": "localhost",
    "port": "5432"
}

BOOKS_TO_DOWNLOAD = [
    {
        "title": "A Tale of Two Cities",
        "isbn": "9780141439600",
        "url": "https://www.gutenberg.org/files/98/98-0.txt"
    },
    {
        "title": "The Art of War",
        "isbn": "9781590302255",
        "url": "https://www.gutenberg.org/files/132/132-0.txt"
    }
]

def download_and_seed():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        for book in BOOKS_TO_DOWNLOAD:
            print(f"Downloading {book['title']}...")
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            response = requests.get(book['url'], headers=headers)
            if response.status_code == 200:
                content = response.text[:50000] # Limit to 50KB for "less in memory" as requested
                print(f"Updating database for {book['title']}...")
                
                # Check if book exists
                cur.execute("SELECT id FROM books WHERE isbn = %s", (book['isbn'],))
                if not cur.fetchone():
                    # Insert if missing (using Orwell as placeholder author for now, or just generic)
                    # We'll assume the user wants these added if not present
                    cur.execute("INSERT INTO books (title, isbn, publication_year, publisher, language, description, author_id, category_id, book_type, text_content, is_free) VALUES (%s, %s, %s, %s, %s, %s, 1, 1, 'DIGITAL', %s, true)", 
                                (book['title'], book['isbn'], 1859, 'Project Gutenberg', 'English', 'A classic literary work.', content))
                else:
                    cur.execute("UPDATE books SET text_content = %s WHERE isbn = %s", (content, book['isbn']))
            else:
                print(f"Failed to download {book['title']}")
        
        conn.commit()
        cur.close()
        conn.close()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    download_and_seed()
