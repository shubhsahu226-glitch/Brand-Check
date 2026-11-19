import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, NavLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const acceptSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const { user, setSession } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(acceptSchema),
    defaultValues: {
      name: user?.name || '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user?.name) {
      setValue('name', user.name);
    }
  }, [user, setValue]);

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token. Please check your invitation email or link.');
      setLoading(false);
      return;
    }

    async function fetchInvitation() {
      try {
        setLoading(true);
        const res = await api.get(`/invitations/${encodeURIComponent(token)}`);
        const data = res.data?.data || res.data;
        setInvitation(data);
      } catch (err) {
        const message =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Invalid or expired invitation link';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [token]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/invitations/accept', {
        token,
        name: data.name,
        password: data.password,
      });

      const resData = res.data?.data || res.data;
      const { user: acceptedUser, workspace: joinedWorkspace, accessToken } = resData;

      setSession({
        user: acceptedUser,
        workspace: joinedWorkspace,
        accessToken,
      });

      toast.success(
        `Successfully joined ${joinedWorkspace.name} as ${joinedWorkspace.role}!`
      );
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to accept invitation';
      toast.error(msg);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">Verifying invitation...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle size={24} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Invitation Error</h1>
        <p className="mt-2 text-sm text-slate-600">{error || 'This invitation is not valid.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <NavLink
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Log in
          </NavLink>
          <NavLink
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Go to Home
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
        <ShieldCheck size={24} />
      </div>

      <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
        Workspace Invitation
      </span>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
        Join {invitation.workspace?.name}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        You've been invited to join this workspace as a{' '}
        <strong className="text-indigo-600 uppercase font-semibold">
          {invitation.role}
        </strong>
        .
      </p>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600">
        Invitation sent to:{' '}
        <strong className="font-semibold text-slate-900">{invitation.email}</strong>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
            <p className="mt-1 text-xs text-rose-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Joining Workspace...</span>
            </>
          ) : (
            <>
              <span>Accept & Join as {invitation.role}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
