import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginDrawer({ isOpen, onClose }) {
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

  const {
    register,
    handleSubmit,
    setValue,
    reset,
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

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDemoLogin = async (role) => {
    if (demoLoadingRole) return;
    setDemoLoadingRole(role);
    try {
      const res = await demoLogin(role);
      if (res.success) {
        onClose();
        navigate(defaultRedirect, { replace: true });
      }
    } finally {
      setDemoLoadingRole(null);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await login({
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        reset();
        onClose();
        navigate(defaultRedirect, { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-[#0f140f]/60 backdrop-blur-xs transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        aria-hidden="true"
      />

      {/* Slide-over Right Drawer */}
      <aside
        aria-label="Login drawer"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[#e4e8dc] bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out sm:p-8 ${isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
          }`}
      >
        {/* Drawer Header with Close Button */}
        <div className="flex items-center justify-between border-b border-[#e4e8dc] pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f140f] text-[#d4ff32] shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-[#0f140f]">BrandCheck</span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Polished before Published
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close login drawer"
            className="rounded-xl border border-[#e4e8dc] p-2 text-slate-500 transition hover:bg-[#eef5ee] hover:text-[#0f140f] active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto py-5 pr-1">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#0f140f]">
              Welcome back
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Sign in to manage and audit your workspace brand standards.
            </p>
          </div>

          {tokenParam && (
            <div className="mt-4 rounded-xl border border-[#d8e6db] bg-[#eef5ee] p-3 text-xs font-semibold text-[#1c3822]">
              Sign in to accept your workspace invitation.
            </div>
          )}

          {/* 1-Click Evaluator Quick Access */}
          <div className="mt-5 rounded-2xl border border-[#d8e6db] bg-[#eef5ee] p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#0f140f]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#0f140f]">
                  1-Click Evaluator Access
                </span>
              </div>
              <span className="rounded-full bg-[#d4ff32] px-2 py-0.5 text-[10px] font-black text-[#0f140f]">
                Instant
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600">
              Instant login for hackathon judges &amp; reviewers:
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={demoLoadingRole !== null}
                onClick={() => handleDemoLogin('ADMIN')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#0f140f]/15 bg-white px-2 py-2.5 text-xs font-bold text-[#0f140f] shadow-xs transition duration-150 hover:-translate-y-0.5 hover:bg-[#d4ff32] active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
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
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#0f140f]/15 bg-white px-2 py-2.5 text-xs font-bold text-[#0f140f] shadow-xs transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-200 active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
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
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#0f140f]/15 bg-white px-2 py-2.5 text-xs font-bold text-[#0f140f] shadow-xs transition duration-150 hover:-translate-y-0.5 hover:bg-amber-200 active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
              >
                {demoLoadingRole === 'REVIEWER' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  'Reviewer'
                )}
              </button>
            </div>
          </div>

          <div className="relative my-5 text-center text-xs text-slate-400">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e4e8dc]" />
            </div>
            <span className="relative bg-white px-3 font-semibold text-slate-500">
              or sign in with credentials
            </span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email
                <input
                  className="mt-1.5 block w-full rounded-xl border border-[#e4e8dc] bg-[#fbfcf8] px-3.5 py-2.5 text-sm text-[#0f140f] placeholder-slate-400 outline-none transition focus:border-[#0f140f] focus:bg-white focus:ring-2 focus:ring-[#d4ff32]/30"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register('email')}
                />
              </label>
              {errors.email && (
                <p className="mt-1 text-xs font-semibold text-[#f07153]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
                <input
                  className="mt-1.5 block w-full rounded-xl border border-[#e4e8dc] bg-[#fbfcf8] px-3.5 py-2.5 text-sm text-[#0f140f] placeholder-slate-400 outline-none transition focus:border-[#0f140f] focus:bg-white focus:ring-2 focus:ring-[#d4ff32]/30"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                />
              </label>
              {errors.password && (
                <p className="mt-1 text-xs font-semibold text-[#f07153]">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4ff32] px-4 py-3.5 text-sm font-extrabold text-[#0f140f] shadow-xs transition duration-150 hover:bg-[#bfe818] active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#0f140f]" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600">
            New to BrandCheck?{' '}
            <NavLink
              className="font-bold text-[#0f140f] underline decoration-[#d4ff32] decoration-2 underline-offset-4 hover:text-black"
              to={tokenParam ? `/signup?email=${encodeURIComponent(emailParam)}&token=${tokenParam}` : '/signup'}
              onClick={onClose}
            >
              Create an account
            </NavLink>
          </p>
        </div>

        {/* Drawer Footer Notice */}
        <div className="border-t border-[#e4e8dc] pt-3 text-center">
          <p className="text-[11px] font-medium text-slate-400">
            Polished before Published • Zero silent AI rewrites
          </p>
        </div>
      </aside>
    </>
  );
}
