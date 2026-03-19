'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { BookMarked, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50"></div>;
  }

  const getDashboardLink = () => {
    if (user?.roles.includes('ROLE_ADMIN')) return '/admin';
    if (user?.roles.includes('ROLE_LIBRARIAN')) return '/librarian';
    return '/member/dashboard';
  };

  return (
    <nav className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
          <BookMarked className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight text-white hidden sm:block">ULMS Connect</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Catalog
          </Link>

          {isAuthenticated() ? (
            <>
              <Link 
                href={getDashboardLink()} 
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              
              <button 
                onClick={logout}
                className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 ml-4"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors ml-4">
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors ml-2"
              >
                Join Now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
