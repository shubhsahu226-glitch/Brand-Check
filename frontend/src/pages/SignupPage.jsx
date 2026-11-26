import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    email: z
      .string()
      .email('Please enter a valid email address')
      .trim()
      .toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    workspaceName: z
      .string()
      .min(2, 'Workspace name must be at least 2 characters')
      .max(100)
      .trim(),
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
      workspaceName: '',
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
        workspaceName: data.workspaceName,
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
    <section className="glass-card-3d mx-auto w-full max-w-md rounded-3xl border border-[#e4e8dc] bg-white p-7 shadow-xl sm:p-9">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#0f140f] text-[#d4ff32] shadow-md">
        <ShieldCheck size={24} />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#0f140f] sm:text-3xl">
        Create your account
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Polished before Published — get your team started with brand confident content.
      </p>

      {tokenParam && (
        <div className="mt-4 rounded-xl border border-[#d8e6db] bg-[#eef5ee] p-3 text-xs font-semibold text-[#1c3822]">
          You are signing up to accept a workspace invitation.
        </div>
      )}

      <form
        className="mt-7 space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
            <p className="mt-1 text-xs font-semibold text-[#f07153]">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
            <p className="mt-1 text-xs font-semibold text-[#f07153]">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Workspace Name
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Acme Marketing"
              {...register('workspaceName')}
            />
          </label>
          {errors.workspaceName && (
            <p className="mt-1 text-xs font-semibold text-[#f07153]">
              {errors.workspaceName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
            <p className="mt-1 text-xs font-semibold text-[#f07153]">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
            <p className="mt-1 text-xs font-semibold text-[#f07153]">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4ff32] px-4 py-3.5 text-sm font-extrabold text-[#0f140f] shadow-sm transition duration-150 hover:bg-[#bfe818] active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#0f140f]" />
          ) : (
            'Create account & workspace'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <NavLink
          to="/?login=true"
          className="font-bold text-[#0f140f] underline decoration-[#d4ff32] decoration-2 underline-offset-4 hover:text-black"
        >
          Sign in
        </NavLink>
      </p>
    </section>
  );
}
