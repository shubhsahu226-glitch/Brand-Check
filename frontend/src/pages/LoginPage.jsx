import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const defaultRedirect = tokenParam
    ? `/invite/accept?token=${encodeURIComponent(tokenParam)}`
    : location.state?.from?.pathname || '/dashboard';

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

      <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
