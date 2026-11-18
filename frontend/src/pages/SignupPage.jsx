import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required').trim(),
    email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: emailParam,
      password: '',
      confirmPassword: '',
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
      const result = await signup({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        if (tokenParam) {
          navigate(`/invite/accept?token=${encodeURIComponent(tokenParam)}`);
        } else {
          navigate('/dashboard/admin');
        }
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
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Create your account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Get your team started with brand confident content.
      </p>

      {tokenParam && (
        <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700">
          You are signing up to accept a workspace invitation.
        </div>
      )}

      <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Full Name
            <input
              className="form-input"
              type="text"
              autoComplete="name"
              placeholder="e.g. Jane Doe"
              {...register('name')}
            />
          </label>
          {errors.name && (
            <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Work Email
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
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('password')}
            />
          </label>
          {errors.password && (
            <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Confirm Password
            <input
              className="form-input"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
          </label>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
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
              <span>Creating account...</span>
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <NavLink
          className="font-semibold text-indigo-600 hover:text-indigo-700"
          to={tokenParam ? `/login?email=${encodeURIComponent(emailParam)}&token=${tokenParam}` : '/login'}
        >
          Log in
        </NavLink>
      </p>
    </section>
  );
}
