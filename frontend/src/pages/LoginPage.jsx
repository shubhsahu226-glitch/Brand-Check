import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState(null);

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const defaultRedirect = tokenParam
    ? `/invite/accept?token=${encodeURIComponent(tokenParam)}`
    : location.state?.from?.pathname || '/dashboard';

  const handleDemoLogin = async (role) => {
    if (demoLoadingRole) return;
    setDemoLoadingRole(role);
    try {
      const res = await demoLogin(role);
      if (res.success) {
        navigate(defaultRedirect, { replace: true });
      }
    } finally {
      setDemoLoadingRole(null);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailParam,
      password: '',
    },
  });

  useEffect(() => {
    if (emailParam) {
      setValue('email', emailParam);
    }
  }, [emailParam, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await login({
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        navigate(defaultRedirect, { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
        <ShieldCheck size={23} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Welcome back</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Sign in to continue to BrandCheck.
      </p>

      {tokenParam && (
        <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700">
          Sign in to accept your workspace invitation.
        </div>
      )}

      {/* 1-Click Evaluator Quick Access */}
      <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-xs font-bold text-indigo-950">1-Click Evaluator Access</span>
          </div>
          <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            No password
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Instant login for hackathon judges & reviewers:
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={demoLoadingRole !== null}
            onClick={() => handleDemoLogin('ADMIN')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-white px-2 py-2 text-xs font-semibold text-purple-900 shadow-xs transition hover:bg-purple-50 disabled:opacity-60"
          >
            {demoLoadingRole === 'ADMIN' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              'Admin'
            )}
          </button>
          <button
            type="button"
            disabled={demoLoadingRole !== null}
            onClick={() => handleDemoLogin('CREATOR')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2 py-2 text-xs font-semibold text-emerald-900 shadow-xs hover:bg-emerald-50 transition disabled:opacity-60"
          >
            {demoLoadingRole === 'CREATOR' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              'Creator'
            )}
          </button>
          <button
            type="button"
            disabled={demoLoadingRole !== null}
            onClick={() => handleDemoLogin('REVIEWER')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2 py-2 text-xs font-semibold text-amber-900 shadow-xs hover:bg-amber-50 transition disabled:opacity-60"
          >
            {demoLoadingRole === 'REVIEWER' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              'Reviewer'
            )}
          </button>
        </div>
      </div>

      <div className="relative my-6 text-center text-xs text-slate-400">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <span className="relative bg-white px-3 text-slate-400">or sign in with credentials</span>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="form-input"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...register('email')}
            />
          </label>
          {errors.email && (
            <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              className="form-input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
            />
          </label>
          {errors.password && (
            <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            'Log in'
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        New to BrandCheck?{' '}
        <NavLink
          className="font-semibold text-indigo-600 hover:text-indigo-700"
          to={tokenParam ? `/signup?email=${encodeURIComponent(emailParam)}&token=${tokenParam}` : '/signup'}
        >
          Create an account
        </NavLink>
      </p>
    </section>
  );
}
