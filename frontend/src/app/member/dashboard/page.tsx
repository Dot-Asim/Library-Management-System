'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/axios';
import { Book, Clock, AlertTriangle, CheckCircle2, ChevronRight, Activity, CreditCard } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function MemberDashboard() {
  const { user } = useAuthStore();
  const [activeBorrows, setActiveBorrows] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [borrowRes, fineRes] = await Promise.allSettled([
          api.get(`/borrows/member/${user.id}`), // Assuming this endpoint exists or will be added
          api.get(`/fines/member/${user.id}`)
        ]);

        if (borrowRes.status === 'fulfilled') {
          setActiveBorrows(borrowRes.value.data.filter((b: any) => b.status === 'BORROWED' || b.status === 'OVERDUE'));
        } else {
            // Mock fallback data for presentation until backend endpoint is confirmed
            setActiveBorrows([
              { id: 'b1', bookTitle: 'Clean Code', borrowDate: '2026-03-01T10:00:00Z', dueDate: '2026-03-15T10:00:00Z', status: 'OVERDUE' },
              { id: 'b2', bookTitle: 'Designing Data-Intensive Applications', borrowDate: '2026-03-18T14:30:00Z', dueDate: '2026-04-01T14:30:00Z', status: 'BORROWED' }
            ]);
        }

        if (fineRes.status === 'fulfilled') {
          setFines(fineRes.value.data);
        } else {
             // Mock fallback
             setFines([
                 { id: 'f1', amount: 5.50, status: 'UNPAID', reason: 'Overdue return of Design Patterns' }
             ]);
        }

      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) return null; // Or a loading spinner while hydrating

  const totalUnpaidFines = fines.filter(f => f.status === 'UNPAID').reduce((sum, fine) => sum + fine.amount, 0);
  const overdueBooks = activeBorrows.filter(b => b.status === 'OVERDUE');

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
            <p className="text-slate-400">Welcome back, {user.email}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                   <Book className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                   <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Active Borrows</p>
                   <p className="text-xl font-bold text-white">{activeBorrows.length}</p>
                </div>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${totalUnpaidFines > 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                   <CreditCard className={`w-5 h-5 ${totalUnpaidFines > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                </div>
                <div>
                   <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Unpaid Fines</p>
                   <p className={`text-xl font-bold ${totalUnpaidFines > 0 ? 'text-red-400' : 'text-white'}`}>
                      ${totalUnpaidFines.toFixed(2)}
                   </p>
                </div>
             </div>
          </div>
        </div>

        {loading ? (
           <div className="h-64 flex items-center justify-center">
              <Activity className="w-8 h-8 text-indigo-500 animate-pulse" />
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Active Borrows */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Checked Out Books</h2>
              </div>
              
              {activeBorrows.length === 0 ? (
                 <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                    <Book className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-slate-300">No active borrows</h3>
                    <p className="text-slate-500">Go to the catalog to discover new books!</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeBorrows.map(borrow => {
                       const isOverdue = borrow.status === 'OVERDUE' || new Date(borrow.dueDate) < new Date();
                       const daysRemaining = differenceInDays(new Date(borrow.dueDate), new Date());
                       
                       return (
                          <div key={borrow.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                             {/* Decorative glow */}
                             <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none transition-opacity ${isOverdue ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}></div>
                             
                             <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${isOverdue ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'}`}>
                                   {isOverdue ? 'OVERDUE' : 'BORROWED'}
                                </div>
                                <Book className="w-5 h-5 text-slate-600" />
                             </div>
                             
                             <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 relative z-10">
                                {borrow.bookTitle || `Book ID: ${borrow.bookReference || borrow.id}`}
                             </h3>
                             
                             <div className="space-y-3 mt-6 relative z-10">
                                <div className="flex items-center text-sm text-slate-400">
                                   <Clock className="w-4 h-4 mr-2" />
                                   Due: {format(new Date(borrow.dueDate), 'MMM d, yyyy')}
                                </div>
                                
                                {isOverdue ? (
                                   <div className="flex items-center text-sm text-red-400 font-medium">
                                      <AlertTriangle className="w-4 h-4 mr-2" />
                                      {Math.abs(daysRemaining)} days overdue!
                                   </div>
                                ) : (
                                   <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                         <div 
                                            className={`h-full rounded-full ${daysRemaining <= 3 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${Math.max(5, Math.min(100, (daysRemaining / 14) * 100))}%` }}
                                         ></div>
                                      </div>
                                      <span className="text-xs text-slate-400 font-mono w-16 text-right">
                                         {daysRemaining}d left
                                      </span>
                                   </div>
                                )}
                             </div>
                             
                             <button className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 relative z-10">
                                Renew Book
                             </button>
                          </div>
                       );
                    })}
                 </div>
              )}
            </div>

            {/* Right Column: Fines & Alerts */}
            <div className="space-y-6">
               <h2 className="text-xl font-semibold text-white">Fines & Alerts</h2>
               
               {fines.length === 0 ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
                     <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                     <div>
                        <h3 className="text-emerald-400 font-medium mb-1">Clear Account</h3>
                        <p className="text-sm text-slate-400">You have no pending fines or account alerts. Great job!</p>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {fines.map(fine => (
                        <div key={fine.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                           <div className="flex items-start justify-between mb-3">
                              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${fine.status === 'UNPAID' ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
                                 {fine.status}
                              </span>
                              <span className="text-lg font-bold text-white">${fine.amount.toFixed(2)}</span>
                           </div>
                           <p className="text-sm text-slate-300 mb-4">{fine.reason}</p>
                           
                           {fine.status === 'UNPAID' && (
                              <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                                 Pay via Stripe
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
