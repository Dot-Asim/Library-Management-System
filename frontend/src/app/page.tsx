'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import PdfViewer from '@/components/PdfViewer';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Heart, 
  Share2, 
  Download, 
  Plus, 
  Trash2,
  X 
} from 'lucide-react';
import api from '@/api/axios';
import { useAuthStore } from '@/store/useAuthStore';
import Navbar from '@/components/Navbar';
import ChatBot from '@/components/ChatBot';

const getErrorMessage = (err: any, fallback: string = 'Something went wrong') => {
  if (typeof err.response?.data === 'string') return err.response.data;
  return err.response?.data?.message || err.message || fallback;
};

interface Book {
  id: string;
  title: string;
  isbn: string;
  authorId: string;
  categoryId: string;
  categoryName?: string;
  publicationYear: string;
  publisher: string;
  language: string;
  description: string;
  bookType: 'PHYSICAL' | 'DIGITAL';
  contentUrl?: string;
  coverImageUrl?: string;
  isFree: boolean;
  textContent?: string;
  availableCopies?: number;
}

export default function Catalog() {
  const { user } = useAuthStore();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [categories, setCategories] = useState<string[]>(['All']);

  const [myBorrows, setMyBorrows] = useState<any[]>([]);

  useEffect(() => {
    fetchBooks();
    // Fetch categories from API
    api.get('/categories').then((res) => {
      const names: string[] = ['All', ...(res.data || []).map((c: any) => c.name)];
      setCategories(names);
    }).catch(() => {
      setCategories(['All', 'Fiction', 'Science', 'History', 'Technology', 'Biography', 'Art', 'Modern']);
    });

    if (user) {
      fetchMyBorrows();
    }
  }, [user]);

  const fetchMyBorrows = async () => {
    try {
      const memberRes = await api.get(`/members/user/${user?.id}`).catch(() => null);
      if (!memberRes) return;
      const res = await api.get(`/borrows/member/${memberRes.data.id}`);
      setMyBorrows(res.data || []);
    } catch (err) {
      console.error('Failed to fetch my borrows:', err);
    }
  };

  const isBorrowedByUser = (bookId: string) => {
    return myBorrows.some(b => b.bookId.toString() === bookId && b.status === 'BORROWED');
  };

  const fetchBooks = async (search?: string) => {
    setLoading(true);
    try {
      if (search && search.trim()) {
        // Use Elasticsearch search-service for keyword queries
        try {
          const searchRes = await api.get('/search', { params: { q: search } });
          // Search service returns BookDocument objects; normalise to Book shape
          const searchDocs = searchRes.data || [];
          if (searchDocs.length > 0) {
            setBooks(searchDocs.map((doc: any) => ({
              id: doc.id?.toString() ?? doc.bookId?.toString(),
              title: doc.title,
              isbn: doc.isbn || '',
              authorId: doc.authorId?.toString() || '',
              categoryId: doc.categoryId?.toString() || '',
              categoryName: doc.categoryName || '',
              publicationYear: doc.publicationYear?.toString() || '',
              publisher: doc.publisher || '',
              language: doc.language || 'English',
              description: doc.description || '',
              bookType: doc.bookType || 'PHYSICAL',
              contentUrl: doc.contentUrl || '',
              coverImageUrl: doc.coverImageUrl || '',
              isFree: doc.isFree ?? true,
              textContent: doc.textContent || '',
              availableCopies: doc.availableCopies ?? 0,
            })));
            return;
          }
        } catch {
          // Search service not available — fall through to catalog
        }
      }
      // Default: fetch from catalog service
      const res = await api.get('/books');
      setBooks(normalizeBooksPayload(res.data));
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeBooksPayload = (data: any[]): Book[] => {
    return data.map(item => ({
      ...item,
      id: item.id.toString(),
      authorId: item.authorId?.toString(),
      categoryId: item.categoryId?.toString(),
      publicationYear: item.publicationYear?.toString(),
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks(query);
  };

  const handleClearSearch = () => {
    setQuery('');
    fetchBooks();
  };

  const handleBorrow = async (book: Book) => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please log in to borrow books.' });
      return;
    }

    try {
      // 1. Get the real Member profile to get the numeric Member ID
      const memberRes = await api.get(`/members/user/${user.id}`);
      const memberId = Number(memberRes.data.id);

      // 2. Get an available copy using the correct endpoint
      const res = await api.get(`/books/${book.id}/available-copy`);
      const copyId = Number(res.data.id);

      if (!memberId || !copyId) {
        throw new Error('Member profile or available book copy not found.');
      }

      // 3. Post to borrowing service
      await api.post('/borrows', {
        memberId,
        bookCopyId: copyId,
        bookId: Number(book.id),
        bookTitle: book.title,
        memberEmail: user.email
      });

      setMessage({ type: 'success', text: `Successfully borrowed "${book.title}".` });
      
      // Update local state immediately for better UX
      setBooks(prev => prev.map(b => 
        b.id === book.id 
          ? { ...b, availableCopies: Math.max(0, (b.availableCopies || 0) - 1) } 
          : b
      ));
      
      fetchMyBorrows(); // Refresh my borrows to update button state
      fetchBooks(query); // Sync everything from server
    } catch (error: any) {
      console.error('Borrow failed:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to borrow book.') });
    }
  };

  const handleDelete = async (bookId: string, title: string) => {
    console.log('Delete button clicked for:', title, 'with ID:', bookId);
    try {
      await api.delete(`/books/${bookId}`);
      setMessage({ type: 'success', text: `Book "${title}" deleted successfully.` });
      fetchBooks(query);
    } catch (error: any) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to delete book.') });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white relative">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Explore Catalog</h1>
            <p className="text-zinc-400">Discover over 10,000 digital and physical resources.</p>
          </div>

          <div className="w-full md:max-w-md space-y-1.5">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search by title, author, or ISBN..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 pl-12 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <Filter className="w-5 h-5 text-zinc-500 mr-2" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-8 p-4 rounded-2xl flex items-center justify-between border ${
            message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
          } animate-in fade-in slide-in-from-top-4`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="hover:opacity-70 transition-opacity">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {books.filter(b => activeCategory === 'All' || b.categoryName === activeCategory).length > 0 
              ? books.filter(b => activeCategory === 'All' || b.categoryName === activeCategory).map((book) => (
              <div key={book.id} className="card-3d overflow-hidden group fade-up">
                {/* Book Card Content */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
                  {book.coverImageUrl ? (
                    <img
                      src={book.coverImageUrl.startsWith('/') ? `http://localhost:8080${book.coverImageUrl}` : book.coverImageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-zinc-800" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                    <div className="flex gap-2">
                      {book.contentUrl && (
                        <button 
                          onClick={() => {
                            if (!user) {
                              setMessage({ type: 'error', text: 'Please sign in to read books.' });
                              return;
                            }
                            setReadingBook(book);
                          }}
                          className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                        >
                          <BookOpen className="w-4 h-4" />
                          Read
                        </button>
                      )}
                      {book.bookType !== 'DIGITAL' && (
                        <button 
                          onClick={() => !isBorrowedByUser(book.id) && handleBorrow(book)}
                          disabled={isBorrowedByUser(book.id) || book.availableCopies === 0}
                          className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                            isBorrowedByUser(book.id) 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : book.availableCopies === 0
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500'
                          }`}
                        >
                          {isBorrowedByUser(book.id) ? 'Borrowed' : book.availableCopies === 0 ? 'Out of Stock' : 'Borrow'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-white/5">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-bold text-zinc-100 leading-snug line-clamp-1">{book.title}</h3>
                    {user?.roles?.some(r => ['LIBRARIAN', 'ADMIN'].includes(r)) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(book.id, book.title);
                        }}
                        className="relative z-10 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                        title="Delete Book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">{book.isbn}</p>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold">
                    <span className={book.bookType === 'DIGITAL' ? 'text-emerald-500' : book.bookType === 'BOTH' ? 'text-amber-500' : 'text-indigo-500'}>
                      {book.bookType === 'BOTH' ? 'Digital + Physical' : book.bookType}
                    </span>
                    <span className="text-zinc-500">{book.availableCopies} Copies</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center">
                <div className="inline-flex p-6 rounded-full bg-zinc-900 mb-4">
                  <Search className="w-12 h-12 text-zinc-700" />
                </div>
                <h3 className="text-xl font-bold mb-2">No books found</h3>
                <p className="text-zinc-500">Try adjusting your search or category filter.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Reader Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-5xl aspect-[4/3] surface overflow-hidden flex flex-col scale-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">{readingBook.title}</h2>
                  <p className="text-[11px] text-zinc-500">Reading Mode • Free Edition</p>
                </div>
              </div>
              <button 
                onClick={() => setReadingBook(null)}
                className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 bg-zinc-800 overflow-hidden flex flex-col">
              {readingBook.contentUrl ? (
                <div className="w-full h-full flex flex-col">
                  <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-end gap-4">
                    <p className="text-[10px] text-zinc-500 mr-auto font-mono">
                      Source: {readingBook.contentUrl}
                    </p>
                    <a 
                      href={readingBook.contentUrl.startsWith('/') ? `http://localhost:8080${readingBook.contentUrl}` : readingBook.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      OPEN IN NEW TAB
                    </a>
                  </div>
                  <PdfViewer url={readingBook.contentUrl} />
                </div>
              ) : readingBook.textContent ? (
                <div className="p-12 text-zinc-200 font-serif text-lg leading-relaxed max-w-3xl mx-auto whitespace-pre-wrap overflow-auto">
                  {readingBook.textContent}
                  <div className="mt-20 py-8 border-t border-white/5 text-center text-zinc-500 italic text-sm">
                    End of preview stored in ULMS Local Storage.
                  </div>
                </div>
              ) : (
                <div className="p-20 text-center text-zinc-500">
                  No content available for this book.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-white/[0.06] bg-zinc-900 text-center">
              <p className="text-[11px] text-zinc-600 italic">
                {readingBook.textContent 
                  ? "Reading from ULMS Local Database (Small Footprint Edition)"
                  : "PDF content provided via Digital Library Service."
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Bot */}
      <ChatBot autoOpen={true} />
    </div>
  );
}
