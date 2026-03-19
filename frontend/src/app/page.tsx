'use client';

import { useState, useEffect } from 'react';
import api from '@/api/axios';
import { Search, Book as BookIcon, Loader2, Library } from 'lucide-react';
import Image from 'next/image';

interface Book {
  id: string;
  title: string;
  authorName: string;
  genre: string;
  isbn: string;
  publishedYear: number;
  availableCopies: number;
  coverImageUrl: string;
}

export default function Catalog() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async (searchQuery: string = '') => {
    setLoading(true);
    try {
      // Assuming search-service handles standard GET requests even with empty query to return all books
      const response = await api.get(`/search?q=${searchQuery}`);
      setBooks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch books:', error);
      // Fallback fallback if search service is down but we still want to show UI setup
      setBooks([
        // Mock fallback data just in case during testing
        {
          id: 'mock-1',
          title: 'The Pragmatic Programmer',
          authorName: 'Andy Hunt',
          genre: 'Technology',
          isbn: '978-0201616224',
          publishedYear: 1999,
          availableCopies: 3,
          coverImageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks(query);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 border border-white/10 p-12 md:p-20 shadow-2xl">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-10 mix-blend-luminosity pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
              Discover your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">great read.</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Explore thousands of books across hundreds of genres. Borrow instantly and start reading today with ULMS.
            </p>
            
            <form onSubmit={handleSearch} className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, or ISBN..."
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-12 pr-32 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-xl"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Results Grid */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-indigo-400" />
            <h2 className="text-2xl font-semibold text-white">Catalog</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <BookIcon className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-300">No books found</h3>
              <p className="text-slate-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {books.map((book) => (
                <div key={book.id} className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 cursor-pointer">
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900 object-cover">
                    {/* Assuming coverImageUrl is present, otherwise fallback styling */}
                    {book.coverImageUrl ? (
                     // Using standard img tag for external unpredictable URLs to avoid next/image host configuring
                      <img 
                        src={book.coverImageUrl} 
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <BookIcon className="w-12 h-12 text-slate-600" />
                      </div>
                    )}
                    
                    {/* Availability Badge */}
                    <div className="absolute top-3 right-3">
                      {book.availableCopies > 0 ? (
                        <span className="bg-emerald-500/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          Available
                        </span>
                      ) : (
                        <span className="bg-slate-800/90 backdrop-blur text-slate-300 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          Checked Out
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-1 text-xs font-medium text-indigo-400 tracking-wider uppercase">
                      {book.genre || 'General'}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-1">
                      {book.authorName || 'Unknown Author'}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">{book.isbn}</span>
                      {book.availableCopies > 0 && (
                        <button className="text-indigo-400 text-sm font-medium hover:text-indigo-300 group-hover:translate-x-1 transition-transform inline-flex items-center">
                          Borrow →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
