'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { BookMarked, LogOut, LayoutDashboard, ChevronDown, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) {
    return <div className="h-16" />;
  }

  const getDashboardLink = () => {
    if (user?.roles.includes('ADMIN')) return '/admin';
    if (user?.roles.includes('LIBRARIAN')) return '/librarian';
    return '/member/dashboard';
  };

  const getRoleName = () => {
    if (user?.roles.includes('ADMIN')) return 'Admin';
    if (user?.roles.includes('LIBRARIAN')) return 'Librarian';
    if (user?.roles.includes('FACULTY')) return 'Faculty';
    if (user?.roles.includes('STUDENT')) return 'Student';
    return 'Member';
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-depth' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
            <BookMarked className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-white hidden sm:block">
            ULMS
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/" className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
            Catalog
          </Link>
          {isAuthenticated() && (
            <>
              <Link 
                href={getDashboardLink()} 
                className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                Dashboard
              </Link>
              <Link 
                href="/settings" 
                className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated() ? (
            <div className="flex items-center gap-3">
              {/* User pill */}
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/[0.06] hover:bg-white/[0.08] transition-all">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                  <span className="text-[11px] font-bold text-indigo-400">
                    {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-zinc-100 whitespace-nowrap">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider leading-none">
                    {getRoleName()}
                  </span>
                </div>
              </div>
              
              <NotificationBell />
              
              <button 
                onClick={logout}
                className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link 
                href="/register" 
                className="btn-primary !py-2 !px-4 !text-[13px] !rounded-lg"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
