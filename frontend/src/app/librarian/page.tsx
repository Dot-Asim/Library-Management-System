'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, Send, UserCheck, AlertCircle, Loader2, PlusCircle, 
  Book as BookIcon, History, List, ArrowRight, CheckCircle2, 
  Globe, Hash, Calendar, Layers, Type, Link as LinkIcon
} from 'lucide-react';
import api from '@/api/axios';

const getErrorMessage = (err: any, fallback: string = 'Something went wrong') => {
  return err.response?.data?.message || err.message || fallback;
};

type ActionTab = 'ADD_BOOK' | 'EDIT_BOOK' | 'ADD_COPY' | 'BORROW_LIST';

export default function LibrarianDashboard() {
  const [activeTab, setActiveTab] = useState<ActionTab>('BORROW_LIST');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  // Transaction State
  const [memberId, setMemberId] = useState('');
  const [bookCopyId, setBookCopyId] = useState('');
  const [bookId, setBookId] = useState('');
  const [transAction, setTransAction] = useState<'BORROW' | 'RETURN'>('BORROW');

  // Add Book State
  const [bookForm, setBookForm] = useState({
    title: '',
    isbn: '',
    authorName: '',
    authorId: '',
    categoryId: '1',
    publicationYear: new Date().getFullYear().toString(),
    publisher: 'ULMS Library',
    language: 'English',
    description: '',
    bookType: 'PHYSICAL' as 'PHYSICAL' | 'DIGITAL' | 'BOTH',
    contentUrl: '',
    isFree: true,
    textContent: ''
  });

  // Edit Book State
  const [editBookId, setEditBookId] = useState('');
  const [editBookForm, setEditBookForm] = useState({
    title: '',
    isbn: '',
    authorName: '',
    authorId: '',
    categoryId: '',
    publicationYear: new Date().getFullYear().toString(),
    publisher: '',
    language: 'English',
    description: '',
    bookType: 'PHYSICAL' as 'PHYSICAL' | 'DIGITAL' | 'BOTH',
    contentUrl: '',
    isFree: true,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Copy State
  const [copyForm, setCopyForm] = useState({
    bookId: '',
    condition: 'NEW' as 'NEW' | 'GOOD' | 'WORN' | 'DAMAGED'
  });
  const [allCopies, setAllCopies] = useState<any[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Metadata for Selects
  const [authors, setAuthors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [borrows, setBorrows] = useState<any[]>([]);
  const [allBooks, setAllBooks] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [authRes, catRes, memRes, bookRes] = await Promise.all([
          api.get('/authors'),
          api.get('/categories'),
          api.get('/members'),
          api.get('/books')
        ]);
        setAuthors(authRes.data);
        setCategories(catRes.data);
        setMembers(memRes.data);
        setAllBooks(bookRes.data);
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  const loadBookForEdit = async (id: string) => {
    if (!id) return;
    setEditLoading(true);
    try {
      const res = await api.get(`/books/${id}`);
      const b = res.data;
      setEditBookForm({
        title: b.title || '',
        isbn: b.isbn || '',
        authorName: b.authorName || '',
        authorId: b.authorId?.toString() || '',
        categoryId: b.categoryId?.toString() || '',
        publicationYear: b.publicationYear?.toString() || '',
        publisher: b.publisher || '',
        language: b.language || 'English',
        description: b.description || '',
        bookType: b.bookType || 'PHYSICAL',
        contentUrl: b.contentUrl || '',
        isFree: b.isFree ?? true,
      });
    } catch (err: any) {
      setStatus({ type: 'error', message: 'Book not found.' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBookId) return;
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const payload = {
        ...editBookForm,
        authorId: editBookForm.authorId ? toNumber(editBookForm.authorId) : null,
        authorName: editBookForm.authorName,
        categoryId: toNumber(editBookForm.categoryId),
        publicationYear: toNumber(editBookForm.publicationYear),
      };
      await api.put(`/books/${editBookId}`, payload);
      setStatus({ type: 'success', message: `Book ID ${editBookId} updated successfully.` });
      // Refresh book list
      const bookRes = await api.get('/books');
      setAllBooks(bookRes.data);
    } catch (err: any) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCopyStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyId) return;
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      await api.patch(`/books/copies/${copyId}/status`, null, { params: { status: copyStatus } });
      setStatus({ type: 'success', message: `Copy #${copyId} status updated to ${copyStatus}.` });
      setCopyId('');
    } catch (err: any) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const fetchBorrows = async () => {
    try {
      setLoading(true);
      const res = await api.get('/borrows');
      setBorrows(res.data);
    } catch (err) {
      console.error('Failed to fetch borrows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'BORROW_LIST') {
      fetchBorrows();
    }
  }, [activeTab]);

  const toNumber = (value: string) => Number.parseInt(value, 10);
  
  const getErrorMessage = (err: any) =>
    (typeof err?.response?.data === 'string' && err.response.data) ||
    err?.response?.data?.message ||
    err?.message ||
    'Operation failed. Please check inputs and try again.';

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      if (transAction === 'BORROW') {
        const book = allBooks.find(b => b.id === toNumber(bookId));
        const member = members.find(m => m.id === toNumber(memberId));
        
        await api.post('/borrows', {
          memberId: toNumber(memberId),
          bookCopyId: toNumber(bookCopyId),
          bookId: toNumber(bookId),
          bookTitle: book?.title || 'Unknown Book',
          memberEmail: member?.email || 'unknown@ulms.local'
        });
        setStatus({ type: 'success', message: `"${book?.title || bookCopyId}" checked out to ${member?.firstName || memberId}` });
      } else {
        await api.post('/borrows/return', {
          memberId: toNumber(memberId),
          bookCopyId: toNumber(bookCopyId),
        });
        setStatus({ type: 'success', message: `Book returned successfully.` });
      }
      setBookCopyId('');
      setMemberId('');
      setBookId('');
    } catch (err: any) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const res = await api.post('/books/copies', {
        bookId: toNumber(copyForm.bookId),
        barcode: `BC-${copyForm.bookId}-${Date.now().toString().slice(-4)}`,
        status: 'AVAILABLE',
        condition: copyForm.condition
      });
      setStatus({ type: 'success', message: `Added new copy (ID: ${res.data.id}) for book ID ${copyForm.bookId}.` });
      setCopyForm({ ...copyForm, bookId: '' });
    } catch (err: any) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (id: number) => {
    const mem = members.find(m => m.id === id);
    return mem ? `${mem.firstName} ${mem.lastName}` : `Member #${id}`;
  };

  const handleQuickReturn = async (memberId: number, bookCopyId: number) => {
    setLoading(true);
    try {
      await api.post('/borrows/return', { memberId, bookCopyId });
      setStatus({ type: 'success', message: 'Book returned successfully!' });
      fetchBorrows();
    } catch (err: any) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      let finalContentUrl = bookForm.contentUrl;
      let finalCoverUrl = '';

      // 1. Upload file if exists
      if (selectedFile) {
        setStatus({ type: 'success', message: 'Uploading file...' });
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/books/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (typeof uploadRes.data === 'string') {
          finalContentUrl = uploadRes.data;
        } else {
          finalContentUrl = uploadRes.data.contentUrl;
          finalCoverUrl = uploadRes.data.coverUrl || '';
        }
      }

      const payload = {
        ...bookForm,
        authorId: bookForm.authorId ? toNumber(bookForm.authorId) : null,
        authorName: bookForm.authorName,
        categoryId: toNumber(bookForm.categoryId),
        publicationYear: toNumber(bookForm.publicationYear),
        contentUrl: finalContentUrl,
        coverImageUrl: finalCoverUrl
      };

      const res = await api.post('/books', payload);
      setStatus({ 
        type: 'success', 
        message: `Successfully added "${res.data.title}" (ID: ${res.data.id}) to catalog.` 
      });
      
      // Reset form
      setBookForm({
        title: '',
        isbn: '',
        authorId: '',
        categoryId: '',
        publicationYear: new Date().getFullYear().toString(),
        publisher: '',
        language: 'English',
        description: '',
        bookType: 'PHYSICAL',
        contentUrl: '',
        isFree: true,
        textContent: ''
      });
      setSelectedFile(null);
    } catch (err: any) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-12 max-w-6xl mx-auto">
      
      {/* Sidebar/Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <p className="text-[13px] font-semibold text-indigo-400 uppercase tracking-[0.2em] mb-2">Management Center</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Librarian Dashboard</h1>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-900/50 border border-white/[0.06] rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {(['ADD_BOOK', 'EDIT_BOOK', 'ADD_COPY', 'BORROW_LIST'] as ActionTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setStatus({ type: null, message: '' });
              }}
              className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'ADD_BOOK' ? <PlusCircle className="w-4 h-4" />
                : tab === 'EDIT_BOOK' ? <BookOpen className="w-4 h-4" />
                : tab === 'ADD_COPY' ? <Layers className="w-4 h-4" />
                : <List className="w-4 h-4" />}
              {tab === 'ADD_BOOK' ? 'Add Book'
                : tab === 'EDIT_BOOK' ? 'Edit Book'
                : tab === 'ADD_COPY' ? 'Add Copy'
                : 'Borrow History'}
            </button>
          ))}
        </div>
      </div>

      {/* Global Status Message */}
      {status.type && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-4 fade-in ${
          status.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{status.message}</p>
          <button onClick={() => setStatus({ type: null, message: '' })} className="ml-auto text-zinc-500 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Info Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="surface p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Quick Guide</h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-[13px] text-zinc-400">
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-zinc-300">1</div>
                <p>Ensure member is registered before checkout.</p>
              </li>
              <li className="flex gap-3 text-[13px] text-zinc-400">
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-zinc-300">2</div>
                <p>Use barcodes for book copy identification.</p>
              </li>
              <li className="flex gap-3 text-[13px] text-zinc-400">
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-zinc-300">3</div>
                <p>Digital content URLs must be direct or Gutenberg links.</p>
              </li>
            </ul>
          </div>
          
          <div className="surface p-6 border-indigo-500/20 bg-indigo-500/[0.02]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Loader2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">System Status</h4>
            </div>
            <p className="text-[12px] text-zinc-500 leading-relaxed">
              Connected to ULMS Central Gateway. All transactions are logged for auditing.
            </p>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-8">
          

          {/* TAB: ADD BOOK */}
          {activeTab === 'ADD_BOOK' && (
            <div className="surface p-8 space-y-8 fade-in">
              <form onSubmit={handleAddBook} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Title */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Book Title</label>
                    <div className="relative">
                      <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input
                        type="text"
                        required
                        value={bookForm.title}
                        onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                        className="input-field !pl-12"
                        placeholder="The Great Gatsby"
                      />
                    </div>
                  </div>

                  {/* ISBN & Type */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">ISBN</label>
                    <input
                      type="text"
                      required
                      value={bookForm.isbn}
                      onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                      className="input-field"
                      placeholder="978-3..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Book Type</label>
                    <select
                      value={bookForm.bookType}
                      onChange={(e) => setBookForm({...bookForm, bookType: e.target.value as any})}
                      className="input-field cursor-pointer"
                    >
                      <option value="PHYSICAL">Physical Copy</option>
                      <option value="DIGITAL">Digital E-Book</option>
                      <option value="BOTH">Both (Hybrid)</option>
                    </select>
                  </div>

                  {/* Author & Category */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Author Name</label>
                    <div className="relative">
                      <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input
                        type="text"
                        required
                        value={bookForm.authorName || ''}
                        onChange={(e) => setBookForm({...bookForm, authorName: e.target.value})}
                        className="input-field !pl-12"
                        placeholder="e.g. F. Scott Fitzgerald"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                    <select
                      value={bookForm.categoryId}
                      onChange={(e) => setBookForm({...bookForm, categoryId: e.target.value})}
                      className="input-field cursor-pointer"
                    >
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Year & Publisher */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Pub. Year</label>
                    <input
                      type="number"
                      value={bookForm.publicationYear}
                      onChange={(e) => setBookForm({...bookForm, publicationYear: e.target.value})}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Publisher</label>
                    <input
                      type="text"
                      value={bookForm.publisher}
                      onChange={(e) => setBookForm({...bookForm, publisher: e.target.value})}
                      className="input-field"
                      placeholder="Penguin..."
                    />
                  </div>
                </div>

                {bookForm.bookType !== 'PHYSICAL' && (
                  <div className="p-5 bg-indigo-500/[0.03] border border-indigo-500/10 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-[11px] uppercase tracking-widest">
                      <BookIcon className="w-3.5 h-3.5" /> Digital Content
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-zinc-500">Upload PDF / E-Pub</label>
                      <input
                        type="file"
                        accept=".pdf,.epub,.txt"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="input-field !py-2.5 !text-[12px] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea
                    value={bookForm.description}
                    onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                    className="input-field !py-3 min-h-[80px]"
                    placeholder="Short summary of the book..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary !py-4 rounded-2xl flex items-center justify-center gap-3 text-[15px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                  Register Book in Catalog
                </button>
              </form>
            </div>
          )}

          {/* TAB: BORROW_LIST */}
          {activeTab === 'BORROW_LIST' && (
            <div className="surface p-8 space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Active Borrowing Records</h3>
                <button onClick={fetchBorrows} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500">
                  <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/[0.04]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-white/[0.04]">
                      <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">ID</th>
                      <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Member</th>
                      <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Copy ID</th>
                      <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Borrowed</th>
                      <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Due Date</th>
                      <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrows.length > 0 ? borrows.map((b) => (
                      <tr key={b.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm font-medium text-zinc-400">{b.id}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-200">{getMemberName(b.memberId)}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: #{b.memberId}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-zinc-300 font-mono">CP-{b.bookCopyId}</td>
                        <td className="p-4 text-sm text-zinc-400">{new Date(b.borrowDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`text-sm ${new Date(b.dueDate) < new Date() && b.status === 'BORROWED' ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>
                            {new Date(b.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.status === 'RETURNED' ? 'bg-emerald-500/10 text-emerald-400' : 
                              new Date(b.dueDate) < new Date() ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'
                            }`}>
                              {b.status}
                            </span>
                            {b.status === 'BORROWED' && (
                              <button 
                                onClick={() => handleQuickReturn(b.memberId, b.bookCopyId)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                title="Quick Return"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-zinc-500">
                          No borrowing records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ADD_COPY */}
          {activeTab === 'ADD_COPY' && (
            <div className="surface p-8 space-y-8 fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Inventory Management</h3>
                  <p className="text-sm text-zinc-500">Add physical copies to an existing book in the catalog.</p>
                </div>
              </div>

              <form onSubmit={handleAddCopy} className="space-y-6 max-w-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Select Book</label>
                    <select
                      required
                      value={copyForm.bookId}
                      onChange={(e) => setCopyForm({...copyForm, bookId: e.target.value})}
                      className="input-field cursor-pointer"
                    >
                      <option value="">Choose a book...</option>
                      {allBooks.map(b => (
                        <option key={b.id} value={b.id}>{b.title} (ID: {b.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Condition</label>
                    <select
                      value={copyForm.condition}
                      onChange={(e) => setCopyForm({...copyForm, condition: e.target.value as any})}
                      className="input-field cursor-pointer"
                    >
                      <option value="NEW">BRAND NEW</option>
                      <option value="GOOD">GOOD</option>
                      <option value="WORN">WORN</option>
                      <option value="DAMAGED">DAMAGED</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !copyForm.bookId}
                  className="w-full btn-primary !py-4 rounded-2xl flex items-center justify-center gap-3 text-[15px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                  Generate Physical Copy
                </button>
              </form>
            </div>
          )}

          {/* TAB: EDIT_BOOK */}
          {activeTab === 'EDIT_BOOK' && (
            <div className="surface p-8 space-y-8 fade-in">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Edit Book Details</h3>
                <p className="text-sm text-zinc-500">Select a book, load its current data, then modify and save.</p>
              </div>

              {/* Book Selector */}
              <div className="flex gap-3">
                <select
                  value={editBookId}
                  onChange={(e) => setEditBookId(e.target.value)}
                  className="input-field flex-1 cursor-pointer"
                >
                  <option value="">Choose a book to edit...</option>
                  {allBooks.map(b => (
                    <option key={b.id} value={b.id}>{b.title} (ID: {b.id})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => loadBookForEdit(editBookId)}
                  disabled={!editBookId || editLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-bold text-[13px] border border-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  Load
                </button>
              </div>

              {editBookForm.title && (
                <form onSubmit={handleEditBook} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Book Title</label>
                      <input
                        type="text"
                        required
                        value={editBookForm.title}
                        onChange={(e) => setEditBookForm({...editBookForm, title: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">ISBN</label>
                      <input
                        type="text"
                        value={editBookForm.isbn}
                        onChange={(e) => setEditBookForm({...editBookForm, isbn: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Book Type</label>
                      <select
                        value={editBookForm.bookType}
                        onChange={(e) => setEditBookForm({...editBookForm, bookType: e.target.value as any})}
                        className="input-field cursor-pointer"
                      >
                        <option value="PHYSICAL">Physical Copy</option>
                        <option value="DIGITAL">Digital E-Book</option>
                        <option value="BOTH">Both (Hybrid)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Author Name</label>
                      <input
                        type="text"
                        value={editBookForm.authorName || ''}
                        onChange={(e) => setEditBookForm({...editBookForm, authorName: e.target.value})}
                        className="input-field"
                        placeholder="e.g. F. Scott Fitzgerald"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                      <select
                        value={editBookForm.categoryId}
                        onChange={(e) => setEditBookForm({...editBookForm, categoryId: e.target.value})}
                        className="input-field cursor-pointer"
                      >
                        <option value="">Select Category...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Pub. Year</label>
                      <input
                        type="number"
                        value={editBookForm.publicationYear}
                        onChange={(e) => setEditBookForm({...editBookForm, publicationYear: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Publisher</label>
                      <input
                        type="text"
                        value={editBookForm.publisher}
                        onChange={(e) => setEditBookForm({...editBookForm, publisher: e.target.value})}
                        className="input-field"
                        placeholder="Publisher name..."
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                      <textarea
                        value={editBookForm.description}
                        onChange={(e) => setEditBookForm({...editBookForm, description: e.target.value})}
                        className="input-field !py-3 min-h-[80px]"
                        placeholder="Book description..."
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary !py-4 rounded-2xl flex items-center justify-center gap-3 text-[15px]"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Save Changes
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
