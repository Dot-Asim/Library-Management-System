'use client';

import { Users, BookCopy, DollarSign, Activity, Bell } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">System Admin Dashboard</h1>
            <p className="text-slate-400 mt-2">Real-time overview of library operations (Preview Mock Data)</p>
          </div>
          <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors flex items-center gap-2">
            <Activity className="w-4 h-4" /> Export Report
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Members', value: '1,248', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Active Borrows', value: '432', icon: BookCopy, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Fines Collected', value: '$8,240.50', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'System Alerts', value: '3', icon: Bell, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-slate-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-50 blur-2xl transition-opacity group-hover:opacity-100 ${kpi.bg}`}></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1 relative z-10">{kpi.label}</p>
              <h3 className="text-3xl font-bold text-white tracking-tight relative z-10">{kpi.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area placeholder */}
          <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-3xl p-8 min-h-[400px] flex flex-col relative overflow-hidden">
             <div className="absolute top-[-20%] left-[20%] w-[60%] h-[50%] bg-blue-500/5 blur-[120px] pointer-events-none rounded-full"></div>
             <h2 className="text-xl font-semibold text-white mb-6 relative z-10">Borrowing Trends (Past 30 Days)</h2>
             
             <div className="flex-1 flex items-center justify-center border border-dashed border-slate-700 rounded-2xl bg-slate-950/50 relative z-10">
                <div className="text-center">
                   <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                   <p className="text-slate-500 font-medium">Chart Visualization Coming Soon</p>
                   <p className="text-slate-600 text-sm mt-1">Integrate Recharts / Chart.js here</p>
                </div>
             </div>
          </div>

          {/* Recent Activity List */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
             <h2 className="text-xl font-semibold text-white mb-6">Recent Notifications</h2>
             <div className="space-y-6">
                {[
                   { id: 1, title: 'Overdue Notice Sent', time: '10 mins ago', desc: 'Member 1024 - Design Patterns' },
                   { id: 2, title: 'Fine Payment Received', time: '1 hour ago', desc: '$12.50 via Stripe' },
                   { id: 3, title: 'New Member Joined', time: '3 hours ago', desc: 'Alice Smith registered as STUDENT' },
                   { id: 4, title: 'Search Instance Restart', time: '1 day ago', desc: 'Elasticsearch node restarted cleanly' },
                ].map(item => (
                   <div key={item.id} className="flex gap-4 items-start group">
                      <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0 group-hover:scale-150 transition-transform"></div>
                      <div>
                         <p className="text-sm font-bold text-white">{item.title}</p>
                         <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                         <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                      </div>
                   </div>
                ))}
             </div>
             
             <button className="w-full mt-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors">
                View All Logs
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
