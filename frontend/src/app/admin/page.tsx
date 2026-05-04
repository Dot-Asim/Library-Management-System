'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, BookCopy, Activity, Bell, Trash2, DollarSign,
  ShieldCheck, GraduationCap, Briefcase, UserCircle,
  Loader2, CheckCircle2, AlertCircle, RefreshCw,
  UserX, UserCheck, Clock, AlertTriangle, CreditCard
} from 'lucide-react';
import api from '@/api/axios';

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'FACULTY' | 'LIBRARIAN' | 'ADMIN';
  status: string;
}

interface MemberInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  membershipPlanId: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
}

interface MembershipPlan {
  id: number;
  name: string;
  maxBooks: number;
  maxDays: number;
  fee: number;
}

interface FineInfo {
  id: number;
  memberId: number;
  borrowRecordId: number;
  amount: number;
  status: 'UNPAID' | 'PAID';
  issueDate: string;
}

interface BorrowInfo {
  id: number;
  memberId: number;
  bookCopyId: number;
  bookId: number;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
}

type Tab = 'OVERVIEW' | 'USERS' | 'MEMBERS';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [fines, setFines] = useState<FineInfo[]>([]);
  const [borrows, setBorrows] = useState<BorrowInfo[]>([]);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    activeBorrows: 0,
    finesCollected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, bookRes, borrowRes, memberRes, planRes] = await Promise.allSettled([
        api.get('/auth/users'),
        api.get('/books'),
        api.get('/borrows'),
        api.get('/members'),
        api.get('/membership-plans'),
      ]);

      const userList: UserInfo[] = userRes.status === 'fulfilled' ? (userRes.value.data.data ?? userRes.value.data) : [];
      const bookList = bookRes.status === 'fulfilled' ? bookRes.value.data : [];
      const borrowList: BorrowInfo[] = borrowRes.status === 'fulfilled' ? borrowRes.value.data : [];
      const memberList: MemberInfo[] = memberRes.status === 'fulfilled' ? memberRes.value.data : [];
      const planList: MembershipPlan[] = planRes.status === 'fulfilled' ? planRes.value.data : [];

      setUsers(userList);
      setBorrows(borrowList);
      setMembers(memberList);
      setPlans(planList);

      // Fetch fines for all members to get aggregate
      const fineResults = await Promise.allSettled(
        memberList.slice(0, 20).map((m) => api.get(`/fines/member/${m.id}`))
      );
      const allFines: FineInfo[] = fineResults
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r: any) => r.value.data || []);
      setFines(allFines);

      const finesCollected = allFines
        .filter((f) => f.status === 'PAID')
        .reduce((sum, f) => sum + f.amount, 0);

      setStats({
        totalBooks: bookList.length,
        totalUsers: userList.length,
        activeBorrows: borrowList.filter((b) => b.status === 'BORROWED').length,
        finesCollected,
      });

      if (userRes.status === 'rejected') {
        const errorMsg = (userRes.reason as any).response?.data?.message || 'Failed to fetch users';
        setStatusMsg({ type: 'error', message: `Auth Service Error: ${errorMsg}` });
      }
    } catch (err: any) {
      console.error('Failed to fetch admin data:', err);
      const errorDetail = userRes.status === 'rejected' ? 'Auth Service' : 
                          bookRes.status === 'rejected' ? 'Catalog Service' :
                          borrowRes.status === 'rejected' ? 'Borrowing Service' :
                          memberRes.status === 'rejected' ? 'Member Service' : 'System';
      setStatusMsg({ type: 'error', message: `Failed to load data from ${errorDetail}. Please check if services are running.` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleDeleteUser = async (userId: string, role: string) => {
    if (role === 'ADMIN') return;
    if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
    setLoading(true);
    try {
      await api.delete(`/auth/users/${userId}`);
      setStatusMsg({ type: 'success', message: 'User deleted successfully.' });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', message: err.response?.data?.message || 'Failed to delete user.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    setLoading(true);
    try {
      await api.patch(`/auth/users/${userId}/status`, null, { params: { status } });
      setStatusMsg({ type: 'success', message: `User status updated to ${status}.` });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', message: err.response?.data?.message || 'Failed to update user status.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberStatus = async (memberId: number, status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED', reason?: string) => {
    setUpdatingMemberId(memberId);
    try {
      await api.patch(`/members/${memberId}/status`, null, {
        params: { status, reason: reason || undefined },
      });
      setStatusMsg({ type: 'success', message: `Member status updated to ${status}.` });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', message: err.response?.data?.message || 'Failed to update member status.' });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleUpdateMemberPlan = async (memberId: number, planId: number) => {
    setUpdatingMemberId(memberId);
    try {
      await api.patch(`/members/${memberId}/plan`, null, {
        params: { planId },
      });
      setStatusMsg({ type: 'success', message: `Membership plan updated successfully.` });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', message: err.response?.data?.message || 'Failed to update membership plan.' });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <ShieldCheck className="w-4 h-4 text-red-400" />;
      case 'LIBRARIAN': return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case 'FACULTY': return <UserCircle className="w-4 h-4 text-emerald-400" />;
      case 'STUDENT': return <GraduationCap className="w-4 h-4 text-blue-400" />;
      default: return <Users className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'SUSPENDED': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'EXPIRED': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getPlanEmoji = (name: string) => {
    if (name.includes('Basic')) return '📚';
    if (name.includes('Student')) return '🎓';
    if (name.includes('Premium')) return '⭐';
    if (name.includes('Faculty')) return '🏛️';
    return '💳';
  };

  // Build real activity feed from borrows + fines
  const recentActivity = [
    ...borrows
      .filter((b) => b.status === 'BORROWED')
      .slice(0, 3)
      .map((b) => ({
        text: `Member #${b.memberId} borrowed Book Copy #${b.bookCopyId}`,
        time: new Date(b.borrowDate).toLocaleDateString(),
        icon: 'borrow',
      })),
    ...borrows
      .filter((b) => b.status === 'RETURNED' && b.returnDate)
      .slice(0, 2)
      .map((b) => ({
        text: `Book Copy #${b.bookCopyId} returned by Member #${b.memberId}`,
        time: new Date(b.returnDate!).toLocaleDateString(),
        icon: 'return',
      })),
    ...fines
      .filter((f) => f.status === 'PAID')
      .slice(0, 2)
      .map((f) => ({
        text: `Fine of $${f.amount.toFixed(2)} paid by Member #${f.memberId}`,
        time: new Date(f.issueDate).toLocaleDateString(),
        icon: 'fine',
      })),
    ...fines
      .filter((f) => f.status === 'UNPAID')
      .slice(0, 2)
      .map((f) => ({
        text: `Overdue fine of $${f.amount.toFixed(2)} issued to Member #${f.memberId}`,
        time: new Date(f.issueDate).toLocaleDateString(),
        icon: 'alert',
      })),
  ].slice(0, 8);

  const overdueCount = borrows.filter(
    (b) => b.status === 'BORROWED' && new Date(b.dueDate) < new Date()
  ).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-12 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <p className="text-[13px] font-semibold text-red-400 uppercase tracking-[0.2em] mb-2">System Administration</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Admin Control Panel</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex p-1 bg-zinc-900/50 border border-white/[0.06] rounded-2xl">
            {(['OVERVIEW', 'USERS', 'MEMBERS'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'OVERVIEW' ? 'Overview' : tab === 'USERS' ? 'Auth Users' : 'Members'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status */}
      {statusMsg.type && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-4 fade-in ${
          statusMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{statusMsg.message}</p>
          <button onClick={() => setStatusMsg({ type: null, message: '' })} className="ml-auto text-zinc-500 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8 fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="surface p-6 space-y-4 border-l-4 border-blue-500">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Users</p>
                <h2 className="text-4xl font-bold text-white">{stats.totalUsers}</h2>
              </div>
            </div>

            <div className="surface p-6 space-y-4 border-l-4 border-indigo-500">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <BookCopy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Active Borrows</p>
                <h2 className="text-4xl font-bold text-white">{stats.activeBorrows}</h2>
              </div>
            </div>

            <div className="surface p-6 space-y-4 border-l-4 border-emerald-500">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Fines Collected</p>
                <h2 className="text-4xl font-bold text-white">${stats.finesCollected.toFixed(0)}</h2>
              </div>
            </div>

            <div className="surface p-6 space-y-4 border-l-4 border-amber-500">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">System Alerts</p>
                <h2 className="text-4xl font-bold text-white">{overdueCount}</h2>
                <p className="text-xs text-zinc-600 mt-1">overdue books</p>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="surface p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-400" /> Recent Activity
            </h3>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">No activity data yet. Start borrowing!</div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 bg-zinc-900/50 rounded-xl border border-white/[0.04] text-sm text-zinc-400 flex justify-between items-center gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon === 'alert' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : item.icon === 'fine' ? (
                        <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : item.icon === 'return' ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <BookCopy className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                      <span>{item.text}</span>
                    </div>
                    <span className="text-[11px] text-zinc-600 shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Books Warning */}
          {overdueCount > 0 && (
            <div className="surface p-6 border border-amber-500/20 bg-amber-500/[0.03]">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Overdue Books ({overdueCount})</h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-white/[0.04]">
                      <th className="p-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Member</th>
                      <th className="p-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Copy ID</th>
                      <th className="p-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Due Date</th>
                      <th className="p-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Days Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrows
                      .filter((b) => b.status === 'BORROWED' && new Date(b.dueDate) < new Date())
                      .slice(0, 5)
                      .map((b) => {
                        const days = Math.floor((Date.now() - new Date(b.dueDate).getTime()) / 86400000);
                        return (
                          <tr key={b.id} className="border-b border-white/[0.04]">
                            <td className="p-3 text-sm text-zinc-300">Member #{b.memberId}</td>
                            <td className="p-3 text-sm text-zinc-400 font-mono">CP-{b.bookCopyId}</td>
                            <td className="p-3 text-sm text-red-400">{new Date(b.dueDate).toLocaleDateString()}</td>
                            <td className="p-3 text-sm font-bold text-red-400">{days}d</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'USERS' && (
        <div className="surface p-8 space-y-6 fade-in">
          <h3 className="text-xl font-bold text-white">Auth User Accounts</h3>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.04]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-white/[0.04]">
                  <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Name</th>
                  <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Email</th>
                  <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Role</th>
                  <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="text-sm font-bold text-zinc-200">{u.firstName} {u.lastName}</span>
                    </td>
                    <td className="p-4 text-sm text-zinc-400">{u.email}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(u.role)}
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">{u.role}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                        u.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'ACTIVE')}
                              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                              title="Approve Librarian"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.role)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                              title="Reject / Delete"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {u.role !== 'ADMIN' && u.status !== 'PENDING' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.role)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'MEMBERS' && (
        <div className="surface p-8 space-y-6 fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">Member Management</h3>
              <p className="text-sm text-zinc-500">Update membership plans and account statuses.</p>
            </div>
            <div className="flex gap-2">
              {plans.map(p => (
                <div key={p.id} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-zinc-400 flex items-center gap-1.5">
                  <span>{getPlanEmoji(p.name)}</span>
                  <span className="font-bold">{p.name}</span>
                  <span className="text-zinc-600">({p.maxBooks === 9999 ? '∞' : p.maxBooks})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.04]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-white/[0.04]">
                  <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Member</th>
                  <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Email</th>
                  <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Membership Plan</th>
                  <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const currentPlan = plans.find(p => p.id === m.membershipPlanId);
                  return (
                    <tr key={m.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-200">{m.firstName} {m.lastName}</span>
                          <span className="text-[10px] text-zinc-600 font-mono">ID: #{m.id}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-zinc-400">{m.email}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 text-lg`}>
                            {currentPlan ? getPlanEmoji(currentPlan.name) : <CreditCard className="w-4 h-4 text-zinc-500" />}
                          </div>
                          <select
                            value={m.membershipPlanId || ''}
                            onChange={(e) => handleUpdateMemberPlan(m.id, parseInt(e.target.value))}
                            className="bg-transparent text-[13px] font-bold text-zinc-300 focus:outline-none cursor-pointer hover:text-white transition-colors"
                          >
                            <option value="" disabled className="bg-zinc-900">Select Plan...</option>
                            {plans.map(p => (
                              <option key={p.id} value={p.id} className="bg-zinc-900">
                                {getPlanEmoji(p.name)} {p.name} ({p.maxBooks === 9999 ? '∞' : p.maxBooks} books)
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getMemberStatusColor(m.status)}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {updatingMemberId === m.id ? (
                            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                          ) : (
                            <>
                              {m.status !== 'ACTIVE' && (
                                <button
                                  onClick={() => handleUpdateMemberStatus(m.id, 'ACTIVE')}
                                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                  title="Activate"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                              {m.status !== 'SUSPENDED' && (
                                <button
                                  onClick={() => {
                                    const reason = prompt('Reason for suspension (optional):') || undefined;
                                    handleUpdateMemberStatus(m.id, 'SUSPENDED', reason);
                                  }}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                  title="Suspend"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}
                              {m.status !== 'EXPIRED' && (
                                <button
                                  onClick={() => handleUpdateMemberStatus(m.id, 'EXPIRED')}
                                  className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                                  title="Mark Expired"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
