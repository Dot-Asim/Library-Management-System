'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, BookOpen } from 'lucide-react';
import api from '@/api/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const { user, isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated() || !user) return;
    try {
      // 1. Get member ID
      const memberRes = await api.get(`/members/user/${user.id}`).catch(() => null);
      if (!memberRes) return; // Not a member (e.g. Admin/Librarian), so no notifications here yet
      
      const memberId = memberRes.data.id;
      
      // 2. Get notifications
      const res = await api.get(`/notifications/member/${memberId}`);
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      fetchNotifications();
      // Poll every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SYSTEM': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'BOOK': return <BookOpen className="w-4 h-4 text-indigo-400" />;
      default: return <Info className="w-4 h-4 text-zinc-400" />;
    }
  };

  if (!isAuthenticated()) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all relative ${
          isOpen ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'
        }`}
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0a0a0a]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-hidden flex flex-col surface border-white/[0.06] shadow-2xl z-[100] fade-in">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold uppercase tracking-wider">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="overflow-y-auto no-scrollbar flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-2 opacity-20" />
                <p className="text-[12px] text-zinc-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`p-4 border-b border-white/[0.03] transition-all cursor-pointer hover:bg-white/[0.02] relative group ${
                    !n.isRead ? 'bg-indigo-500/[0.02]' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-1">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`text-[12px] font-bold truncate ${n.isRead ? 'text-zinc-400' : 'text-white'}`}>
                          {n.subject}
                        </p>
                        <span className="text-[10px] text-zinc-600 whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.sentAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 self-center" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-white/[0.06] bg-white/[0.01]">
            <button className="w-full py-2 text-[11px] text-zinc-500 hover:text-white transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
