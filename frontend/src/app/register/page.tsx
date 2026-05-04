'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/api/axios';
import { Loader2, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['STUDENT', 'LIBRARIAN']),
  membershipPlanId: z.number().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface MembershipPlan {
  id: number;
  name: string;
  maxBooks: number;
  maxDays: number;
  fee: number;
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'STUDENT'
    }
  });

  const selectedPlanId = watch('membershipPlanId');
  const selectedRole = watch('role');

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await api.get('/membership-plans');
        setPlans(res.data);
        if (res.data.length > 0) {
          setValue('membershipPlanId', res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    }
    fetchPlans();
  }, [setValue]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await api.post('/auth/register', data);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 5000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Email already exists');
      } else {
        setError(err.response?.data?.message || 'Failed to register account. Please try again.');
      }
    }
  };

  const getPlanIcon = (name: string) => {
    if (name.includes('Basic')) return '📚';
    if (name.includes('Student')) return '🎓';
    if (name.includes('Premium')) return '⭐';
    if (name.includes('Faculty')) return '🏛️';
    return '💳';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] fade-up my-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Create your account</h1>
          <p className="text-sm text-zinc-500">Start your reading journey with ULMS</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] text-red-400 text-sm text-center fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 text-sm text-center fade-in flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {selectedRole === 'LIBRARIAN' 
              ? 'Librarian account created! Awaiting admin approval.'
              : 'Registration successful! Redirecting to login...'}
          </div>
        )}

        <div className="surface p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-zinc-400">First name</label>
                <input
                  {...register('firstName')}
                  type="text"
                  placeholder="Haider"
                  className="input-field"
                />
                {errors.firstName && <p className="text-red-400 text-xs">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-zinc-400">Last name</label>
                <input
                  {...register('lastName')}
                  type="text"
                  placeholder="Rizwan"
                  className="input-field"
                />
                {errors.lastName && <p className="text-red-400 text-xs">{errors.lastName.message}</p>}
              </div>
            </div>

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
                placeholder="Enter password"
                className="input-field"
              />
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-400">Register as</label>
              <select
                {...register('role')}
                className="input-field appearance-none"
              >
                <option value="STUDENT">Student / Faculty Member</option>
                <option value="LIBRARIAN">Librarian</option>
              </select>
            </div>

            {selectedRole === 'STUDENT' && (
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-zinc-400">Membership plan</label>
                {loadingPlans ? (
                  <div className="flex items-center gap-2 text-zinc-500 text-xs py-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading plans...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setValue('membershipPlanId', plan.id)}
                        className={`p-3 rounded-xl text-left transition-all duration-200 border ${
                          selectedPlanId === plan.id
                            ? 'bg-accent/10 border-indigo-500/40 ring-1 ring-indigo-500/20'
                            : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--border-hover)]'
                        }`}
                      >
                        <div className="text-sm mb-0.5">{getPlanIcon(plan.name)}</div>
                        <div className="text-[13px] font-semibold text-white">{plan.name}</div>
                        <div className="text-[11px] text-zinc-500">
                          {plan.maxBooks === 9999 ? 'Unlimited' : `${plan.maxBooks} books`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <input type="hidden" {...register('membershipPlanId')} />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="btn-primary w-full mt-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating account...' : 'Create Account'}
              {!isSubmitting && !success && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
