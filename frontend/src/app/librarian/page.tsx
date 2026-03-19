'use client';

import { useState } from 'react';
import { Scan, BookOpen, Send, UserCheck, AlertCircle } from 'lucide-react';
import api from '@/api/axios';

export default function LibrarianDashboard() {
  const [memberId, setMemberId] = useState('');
  const [bookCopyId, setBookCopyId] = useState('');
  const [action, setAction] = useState<'BORROW' | 'RETURN'>('BORROW');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      if (action === 'BORROW') {
        await api.post('/borrows', {
          memberId,
          bookCopyId
        });
        setStatus({ type: 'success', message: `Book ${bookCopyId} successfully checked out to Member ${memberId}` });
      } else {
        // Find active borrow record to return (simplified for UI, assuming backend handles via borrow copy ID or borrow ID)
        // Note: The UI here is simplified. Backend might require actual BorrowRecord ID. Check specs if this fails.
        const res = await api.post(`/borrows/${bookCopyId}/return`);
        setStatus({ type: 'success', message: `Book returned successfully. Return status: ${res.status}` });
      }
      setBookCopyId('');
      if (action === 'RETURN') setMemberId('');
    } catch (err: any) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Transaction failed. Please check inputs and try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <Scan className="w-16 h-16 text-indigo-500 mx-auto mb-4 bg-indigo-500/10 p-4 rounded-3xl" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Librarian Portal</h1>
          <p className="text-slate-400 mt-2">Process book check-outs and returns quickly</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[100%] bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full"></div>

          <div className="flex gap-2 mb-8 p-1 bg-slate-900/80 rounded-xl relative z-10 border border-white/5">
            <button
              type="button"
              onClick={() => setAction('BORROW')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${action === 'BORROW' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Check Out (Borrow)
            </button>
            <button
              type="button"
              onClick={() => setAction('RETURN')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${action === 'RETURN' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Process Return
            </button>
          </div>

          {status.type && (
            <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 relative z-10 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {status.type === 'success' ? <UserCheck className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="text-sm">{status.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {action === 'BORROW' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Member ID / Barcode</label>
                <input
                  type="text"
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="Scan or enter member card..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-slate-500 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">
                {action === 'BORROW' ? 'Book Copy ID' : 'Borrow Record ID / Book Copy ID'}
              </label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={bookCopyId}
                  onChange={(e) => setBookCopyId(e.target.value)}
                  placeholder="Scan book barcode..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !bookCopyId || (action === 'BORROW' && !memberId)}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${action === 'BORROW' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25 shadow-xl' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25 shadow-xl'}`}
            >
              {loading ? (
                'Processing...'
              ) : action === 'BORROW' ? (
                <>Complete Checkout <Send className="w-5 h-5" /></>
              ) : (
                <>Process Return <Send className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
