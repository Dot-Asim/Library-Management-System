'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/axios';
import { Book, Clock, AlertTriangle, CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

function getErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message && typeof data.message === 'string') return data.message;
  if (data?.error && typeof data.error === 'string') return data.error;
  if (error?.message && typeof error.message === 'string') return error.message;
  return fallback;
}

function toNumericUserId(rawId: string): number {
  const numeric = Number.parseInt(rawId, 10);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash * 31 + rawId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || Date.now();
}

function splitNameFromEmail(email: string): { firstName: string; lastName: string } {
  const local = email.split('@')[0] || 'Member';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ? parts[0].slice(0, 1).toUpperCase() + parts[0].slice(1) : 'Member';
  const lastName = parts[1] ? parts[1].slice(0, 1).toUpperCase() + parts[1].slice(1) : 'User';
  return { firstName, lastName };
}

export default function MemberDashboard() {
  const { user } = useAuthStore();
  const [activeBorrows, setActiveBorrows] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingBorrowId, setRenewingBorrowId] = useState<number | null>(null);
  const [payingFineId, setPayingFineId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [bookTitleMap, setBookTitleMap] = useState<Record<number, string>>({});

  const resolveMemberId = async (): Promise<number | null> => {
    if (!user?.id) return null;
    try {
      const response = await api.get(`/members/user/${user.id}`);
      return response.data?.id ?? null;
    } catch (err) {
      console.error('Failed to resolve member ID:', err);
      return null;
    }
  };

  useEffect(() => {
    const loadMemberId = async () => {
      if (!user) return;
      try {
        const id = await resolveMemberId();
        setMemberId(id);
      } catch {
        setMemberId(null);
      }
    };
    loadMemberId();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const effectiveMemberId = memberId ?? (await resolveMemberId());
      if (!effectiveMemberId) {
        setActiveBorrows([]);
        setFines([]);
        setMessage({ type: 'error', text: 'Member profile not found. Please contact librarian/admin.' });
        return;
      }

      const [borrowRes, fineRes] = await Promise.allSettled([
        api.get(`/borrows/member/${effectiveMemberId}`),
        api.get(`/fines/member/${effectiveMemberId}`)
      ]);

      let borrowList: any[] = [];
      if (borrowRes.status === 'fulfilled') {
        borrowList = (borrowRes.value.data || []).filter((b: any) => b.status === 'BORROWED' || b.status === 'OVERDUE');
        setActiveBorrows(borrowList);
      } else {
        setActiveBorrows([]);
      }

      if (fineRes.status === 'fulfilled') {
        setFines(fineRes.value.data || []);
      } else {
        setFines([]);
      }

      // Fetch book titles for each unique bookId
      const uniqueBookIds = [...new Set(borrowList.map((b: any) => b.bookId).filter(Boolean))] as number[];
      if (uniqueBookIds.length > 0) {
        const titleResults = await Promise.allSettled(
          uniqueBookIds.map((id) => api.get(`/books/${id}`))
        );
        const newMap: Record<number, string> = {};
        titleResults.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            newMap[uniqueBookIds[i]] = r.value.data?.title || `Book #${uniqueBookIds[i]}`;
          }
        });
        setBookTitleMap(newMap);
      }
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      setMessage({ type: 'error', text: 'Failed to load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleRenew = async (borrow: any) => {
    if (!user || !memberId) return;
    setRenewingBorrowId(Number(borrow.id));
    try {
      await api.post(`/borrows/${borrow.id}/renew`, { memberId });
      setMessage({ type: 'success', text: 'Book renewed successfully (+14 days).' });
      await fetchDashboardData();
    } catch (err: any) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to renew this book.') });
    } finally {
      setRenewingBorrowId(null);
    }
  };

  const handlePayFine = async (fine: any) => {
    if (!user || !memberId) return;
    setPayingFineId(Number(fine.id));
    try {
      await api.post(`/fines/${fine.id}/pay`, {
        memberId,
        amount: fine.amount,
      });
      setMessage({ type: 'success', text: 'Fine paid successfully.' });
      await fetchDashboardData();
    } catch (err: any) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to pay fine.') });
    } finally {
      setPayingFineId(null);
    }
  };

  if (!user) return null;

  const totalUnpaidFines = fines.filter(f => f.status === 'UNPAID').reduce((sum, fine) => sum + fine.amount, 0);
  const overdueBooks = activeBorrows.filter(b => b.status === 'OVERDUE');

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 fade-up">
          <div>
            <p className="text-[13px] font-medium text-zinc-500 uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{user.email}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="card-3d px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Book className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Active</p>
                <p className="text-lg font-bold text-white">{activeBorrows.length}</p>
              </div>
            </div>
            <div className="card-3d px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalUnpaidFines > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                <CreditCard className={`w-4 h-4 ${totalUnpaidFines > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Fines</p>
                <p className={`text-lg font-bold ${totalUnpaidFines > 0 ? 'text-red-400' : 'text-white'}`}>
                  ${totalUnpaidFines.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06]" />

        {message && (
          <div className={`p-3 rounded-xl border text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Borrows */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-[15px] font-semibold text-white">Checked Out Books</h2>
              
              {activeBorrows.length === 0 ? (
                <div className="surface p-12 text-center">
                  <Book className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-zinc-400 mb-1">No active borrows</h3>
                  <p className="text-xs text-zinc-600">Visit the catalog to discover new books</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeBorrows.map((borrow, idx) => {
                    const isOverdue = borrow.status === 'OVERDUE' || new Date(borrow.dueDate) < new Date();
                    const daysRemaining = differenceInDays(new Date(borrow.dueDate), new Date());
                    
                    return (
                      <div
                        key={borrow.id}
                        className="card-3d p-5 fade-up"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        {/* Status badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-success'}`}>
                            {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                          <Book className="w-4 h-4 text-zinc-700" />
                        </div>
                        
                        <h3 className="text-[15px] font-bold text-white mb-1 line-clamp-2">
                          {bookTitleMap[borrow.bookId] || borrow.bookTitle || `Book Copy #${borrow.bookCopyId}`}
                        </h3>
                        
                        <div className="space-y-2.5 mt-4">
                          <div className="flex items-center text-[13px] text-zinc-500">
                            <Clock className="w-3.5 h-3.5 mr-2" />
                            Due: {format(new Date(borrow.dueDate), 'MMM d, yyyy')}
                          </div>
                          
                          {isOverdue ? (
                            <div className="flex items-center text-[13px] text-red-400 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                              {Math.abs(daysRemaining)} days overdue
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${daysRemaining <= 3 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.max(5, Math.min(100, (daysRemaining / 14) * 100))}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-zinc-500 font-mono w-12 text-right">
                                {daysRemaining}d left
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleRenew(borrow)}
                          disabled={renewingBorrowId === Number(borrow.id)}
                          className="w-full mt-4 py-2 rounded-lg text-[13px] font-medium text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] transition-all border border-white/[0.06] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {renewingBorrowId === Number(borrow.id) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {renewingBorrowId === Number(borrow.id) ? 'Renewing...' : 'Renew Book'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fines */}
            <div className="space-y-4">
              <h2 className="text-[15px] font-semibold text-white">Fines & Alerts</h2>
              
              {fines.length === 0 ? (
                <div className="surface p-5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[13px] text-emerald-400 font-medium mb-0.5">All Clear</h3>
                    <p className="text-[12px] text-zinc-500">No pending fines or alerts.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {fines.map(fine => (
                    <div key={fine.id} className="card-3d p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`badge ${fine.status === 'UNPAID' ? 'badge-danger' : 'badge-neutral'}`}>
                          {fine.status}
                        </span>
                        <span className="text-[15px] font-bold text-white">${fine.amount.toFixed(2)}</span>
                      </div>
                      <p className="text-[13px] text-zinc-400 mb-3">{fine.reason}</p>
                      
                      {fine.status === 'UNPAID' && (
                        <button
                          onClick={() => handlePayFine(fine)}
                          disabled={payingFineId === Number(fine.id)}
                          className="btn-primary w-full !py-2 !text-[13px] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {payingFineId === Number(fine.id) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {payingFineId === Number(fine.id) ? 'Processing...' : 'Pay Fine'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
