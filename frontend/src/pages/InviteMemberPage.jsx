import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  Mail,
  Shield,
  FileText,
  CheckSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  role: z.enum(['CREATOR', 'REVIEWER'], {
    required_error: 'Please select a role',
  }),
});

export default function InviteMemberPage() {
  const { currentWorkspace } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentInvitation, setSentInvitation] = useState(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'CREATOR',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/invitations', {
        email: data.email,
        role: data.role,
      });

      const payload = res.data?.data || res.data;
      const invitation = payload.invitation || payload;
      const inviteUrl = payload.inviteUrl;

      setSentInvitation({
        email: invitation.email,
        role: invitation.role,
        inviteUrl,
      });
      toast.success(`Invitation sent to ${data.email}!`);
      reset();
    } catch (error) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Failed to send invitation';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (sentInvitation?.inviteUrl) {
      navigator.clipboard.writeText(sentInvitation.inviteUrl);
      setCopied(true);
      toast.success('Invitation link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <NavLink
        to="/dashboard/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft size={14} /> Back to Admin Dashboard
      </NavLink>

      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <UserPlus size={22} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Invite Team Member</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Invite a collaborator to join{' '}
          <strong className="text-slate-900">{currentWorkspace?.name}</strong>.
        </p>

        {sentInvitation ? (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50/70 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <h3 className="font-semibold text-emerald-950">Invitation Sent Successfully!</h3>
                <p className="text-sm text-emerald-800">
                  An invitation email has been dispatched to{' '}
                  <strong className="font-medium text-emerald-950">{sentInvitation.email}</strong>{' '}
                  as a <span className="font-semibold uppercase">{sentInvitation.role}</span>.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-emerald-200 bg-white p-3.5">
              <p className="text-xs font-medium text-slate-500">Direct Invitation Link:</p>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  readOnly
                  value={sentInvitation.inviteUrl}
                  className="w-full bg-transparent font-mono text-xs text-slate-700 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSentInvitation(null)}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"
              >
                Invite Another Member
              </button>
              <NavLink
                to="/dashboard/admin"
                className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                View Workspace Members
              </NavLink>
            </div>
          </div>
        ) : (
          <form className="mt-7 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  id="invite-email"
                  className="form-input !mt-0 !pl-10"
                  type="email"
                  placeholder="teammate@company.com"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Assign Role</label>
              <p className="mt-0.5 text-xs text-slate-500">
                Choose the permissions this member will have in this workspace.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="relative flex cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 focus-within:border-indigo-600 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/40">
                  <input
                    type="radio"
                    value="CREATOR"
                    className="sr-only"
                    {...register('role')}
                  />
                  <div className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                      <FileText size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Creator</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-normal">
                        Drafts content, runs brand checks, and addresses reviewer findings.
                      </p>
                    </div>
                  </div>
                </label>

                <label className="relative flex cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 focus-within:border-indigo-600 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/40">
                  <input
                    type="radio"
                    value="REVIEWER"
                    className="sr-only"
                    {...register('role')}
                  />
                  <div className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800">
                      <CheckSquare size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Reviewer</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-normal">
                        Reviews queue drafts, verifies brand compliance, and approves publishing.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-xs text-rose-600">{errors.role.message}</p>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Note:</span> Invitations include a
              secure one-time link valid for 7 days. If Resend credentials are not configured
              locally, the invite link will be shown directly above.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending Invitation...</span>
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

