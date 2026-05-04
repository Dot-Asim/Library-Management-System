'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/axios';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError('');
      const response = await api.post('/auth/login', data);
      const authData = response.data?.data;
      if (authData?.accessToken) {
        setToken(authData.accessToken);
        // The store handles user decoding from JWT
        const user = authData.user;
        if (user?.role === 'LIBRARIAN') {
          router.push('/librarian');
        } else if (user?.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/member/dashboard');
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 403) {
        setError('Your account is locked. Please try again later.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      {/* Subtle ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[380px] fade-up">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Welcome back</h1>
          <p className="text-sm text-zinc-500">Sign in to your ULMS account</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 p-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] text-red-400 text-sm text-center fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="surface p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-400">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="input-field"
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-400">Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="input-field"
              />
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Signing in...' : 'Continue'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Create one
          </Link>
        </p>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Demo Credentials</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-zinc-400">Admin:</span>
              <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">admin@ulms.com / Admin@2026</code>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-zinc-400">Librarian:</span>
              <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">librarian@ulms.com / librarian123</code>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-zinc-400">Student:</span>
              <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">student@ulms.com / student123</code>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-zinc-400">Faculty:</span>
              <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">faculty@ulms.com / faculty123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
