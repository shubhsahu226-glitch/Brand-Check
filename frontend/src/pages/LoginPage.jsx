import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2, Sparkles, CheckCircle2, Shield, Lock, Zap, Activity } from 'lucide-react';
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
    <div className="relative mx-auto flex w-full max-w-6xl items-center justify-center py-4 lg:py-8">
      {/* 3D Background Isometric Grid & Ambient Lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Angled 3D Perspective Grid */}
        <div 
          className="absolute -top-24 left-1/2 h-[750px] w-[1100px] -translate-x-1/2 bg-grid-isometric opacity-60 bg-radial-fade [transform:perspective(1000px)_rotateX(60deg)]"
          aria-hidden="true"
        />

        {/* Ambient Glowing Orbs at Different 3D Depths */}
        <div 
          className="absolute -top-16 left-1/4 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-400/25 to-purple-400/25 blur-3xl animate-pulse-mesh"
          aria-hidden="true"
        />
        <div 
          className="absolute -bottom-16 right-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-violet-400/20 via-sky-300/20 to-transparent blur-3xl animate-pulse-mesh"
          style={{ animationDelay: '3s' }}
          aria-hidden="true"
        />

        {/* Floating 3D Geometric Ring / Wireframe Cube */}
        <div 
          className="absolute top-20 left-[6%] hidden h-28 w-28 rounded-3xl border-2 border-indigo-300/40 bg-gradient-to-br from-indigo-500/10 to-transparent backdrop-blur-xs [transform:perspective(800px)_rotateX(45deg)_rotateY(25deg)] animate-spin-slow-3d lg:block"
          aria-hidden="true"
        />
        <div 
          className="absolute bottom-16 right-[6%] hidden h-24 w-24 rounded-2xl border-2 border-purple-300/30 bg-gradient-to-tl from-purple-500/10 to-transparent backdrop-blur-xs [transform:perspective(800px)_rotateX(-35deg)_rotateY(-30deg)] animate-spin-slow-3d lg:block"
          style={{ animationDuration: '28s', animationDirection: 'reverse' }}
          aria-hidden="true"
        />
      </div>

      {/* Main Container with 3D Wings on Large Screens */}
      <div className="relative flex w-full items-center justify-center gap-10">
        {/* Left 3D Floating Wing (Desktop) */}
        <div className="hidden flex-col gap-5 lg:flex xl:w-72">
          {/* 3D Floating Card 1 */}
          <div className="glass-card-3d animate-float-3d-alpha rounded-2xl p-5 transition duration-300 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/30">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Dual-Engine AI</span>
                <h4 className="text-sm font-semibold text-slate-900">Grounded Checks</h4>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              Audits copy against approved brand facts & tone rules in sub-2s latency.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 size={13} />
              <span>Zero Hallucinations</span>
            </div>
          </div>

          {/* 3D Floating Pill 2 */}
          <div className="glass-card-3d animate-float-3d-gamma rounded-xl px-4 py-3 transition duration-300 hover:scale-105">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <div className="h-2 w-2 -ml-3.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-800">Multi-Tenant Isolation</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Cryptographically partitioned workspaces
            </p>
          </div>
        </div>

        {/* Center: Elevated 3D Glassmorphic Login Card */}
        <section className="glass-card-3d relative z-10 w-full max-w-md rounded-3xl p-7 shadow-2xl transition duration-300 hover:shadow-indigo-500/15 sm:p-9">
          <div className="mb-5 flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30">
              <ShieldCheck size={24} />
            </div>
            <span className="rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-[11px] font-bold text-indigo-700 shadow-xs">
              BrandCheck Security
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign in to continue to your brand compliance workspace.
          </p>

          {tokenParam && (
            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 text-xs text-indigo-700 shadow-xs">
              Sign in to accept your workspace invitation.
            </div>
          )}

          {/* 1-Click Evaluator Quick Access */}
          <div className="mt-6 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-white p-4 shadow-sm">
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
                className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 border-b-2 bg-white px-2 py-2.5 text-xs font-semibold text-purple-900 shadow-xs transition duration-150 hover:-translate-y-0.5 hover:bg-purple-50 active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
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
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 border-b-2 bg-white px-2 py-2.5 text-xs font-semibold text-emerald-900 shadow-xs transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-50 active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
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
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 border-b-2 bg-white px-2 py-2.5 text-xs font-semibold text-amber-900 shadow-xs transition duration-150 hover:-translate-y-0.5 hover:bg-amber-50 active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition duration-150 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-600/35 active:scale-[0.98] disabled:opacity-60"
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

        {/* Right 3D Floating Wing (Desktop) */}
        <div className="hidden flex-col gap-5 lg:flex xl:w-72">
          {/* 3D Floating Card 2 */}
          <div className="glass-card-3d animate-float-3d-beta rounded-2xl p-5 transition duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-purple-600" />
                <span className="text-xs font-bold text-slate-900">Compliance Health</span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                100%
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
            </div>
            <p className="mt-2.5 text-xs text-slate-600">
              Human-in-the-loop suggestion approval ensures safe, verified publishing.
            </p>
          </div>

          {/* 3D Floating Pill 3 */}
          <div className="glass-card-3d animate-float-3d-alpha rounded-xl px-4 py-3 transition duration-300 hover:scale-105" style={{ animationDelay: '2s' }}>
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-500" />
              <span className="text-xs font-semibold text-slate-800">Human-Led by Design</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              AI suggests & explains; your team decides
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
