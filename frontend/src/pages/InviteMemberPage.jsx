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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#0f140f]"
      >
        <ArrowLeft size={14} /> Back to Admin Dashboard
      </NavLink>

      <div className="rounded-3xl border border-[#e4e8dc] bg-white p-7 shadow-xs sm:p-9">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#0f140f] text-[#d4ff32] shadow-xs">
          <UserPlus size={22} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0f140f]">Invite Team Member</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Invite a collaborator to join{' '}
          <strong className="text-[#0f140f]">{currentWorkspace?.name}</strong>.
        </p>

        {sentInvitation ? (
          <div className="mt-8 rounded-2xl border border-[#d8e6db] bg-[#eef5ee] p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#1c3822] shrink-0" />
              <div className="space-y-1">
                <h3 className="font-bold text-[#1c3822]">Invitation Sent Successfully!</h3>
                <p className="text-sm text-[#2d5034]">
                  An invitation email has been dispatched to{' '}
                  <strong className="font-semibold text-[#1c3822]">{sentInvitation.email}</strong>{' '}
                  as a <span className="font-bold uppercase">{sentInvitation.role}</span>.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#d8e6db] bg-white p-3.5">
              <p className="text-xs font-medium text-slate-500">Direct Invitation Link:</p>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  readOnly
                  value={sentInvitation.inviteUrl}
                  className="w-full bg-transparent font-mono text-xs text-[#0f140f] outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0f140f] px-3.5 py-1.5 text-xs font-bold text-[#d4ff32] transition hover:bg-[#1a231b]"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSentInvitation(null)}
                className="rounded-xl bg-[#0f140f] px-4 py-2.5 text-xs font-bold text-[#d4ff32] shadow-xs hover:bg-[#1a231b]"
              >
                Invite Another Member
              </button>
              <NavLink
                to="/dashboard/admin"
                className="rounded-xl border border-[#e4e8dc] bg-white px-4 py-2.5 text-xs font-semibold text-[#0f140f] hover:bg-[#fbfcf8]"
              >
                View Workspace Members
              </NavLink>
            </div>
          </div>
        ) : (
          <form className="mt-7 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="invite-email" className="block text-sm font-semibold text-[#0f140f]">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  id="invite-email"
                  className="w-full rounded-xl border border-[#e4e8dc] bg-white py-2.5 pl-10 pr-4 text-sm text-[#0f140f] placeholder-slate-400 outline-none transition focus:border-[#0f140f] focus:ring-2 focus:ring-[#d4ff32]/30"
                  type="email"
                  placeholder="teammate@company.com"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-[#f07153] font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f140f]">Assign Role</label>
              <p className="mt-0.5 text-xs text-slate-500">
                Choose the permissions this member will have in this workspace.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="relative flex cursor-pointer rounded-2xl border border-[#e4e8dc] bg-white p-4 shadow-xs transition hover:border-[#0f140f] focus-within:border-[#0f140f] has-[:checked]:border-[#0f140f] has-[:checked]:ring-1 has-[:checked]:ring-[#0f140f] has-[:checked]:bg-[#fbfcf8]">
                  <input
                    type="radio"
                    value="CREATOR"
                    className="sr-only"
                    {...register('role')}
                  />
                  <div className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0f140f] text-[#d4ff32]">
                      <FileText size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#0f140f]">Creator</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-normal">
                        Drafts content, runs brand checks, and addresses reviewer findings.
                      </p>
                    </div>
                  </div>
                </label>

                <label className="relative flex cursor-pointer rounded-2xl border border-[#e4e8dc] bg-white p-4 shadow-xs transition hover:border-[#0f140f] focus-within:border-[#0f140f] has-[:checked]:border-[#0f140f] has-[:checked]:ring-1 has-[:checked]:ring-[#0f140f] has-[:checked]:bg-[#fbfcf8]">
                  <input
                    type="radio"
                    value="REVIEWER"
                    className="sr-only"
                    {...register('role')}
                  />
                  <div className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0f140f] text-[#f07153]">
                      <CheckSquare size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#0f140f]">Reviewer</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-normal">
                        Reviews queue drafts, verifies brand compliance, and approves publishing.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-xs text-[#f07153] font-medium">{errors.role.message}</p>
              )}
            </div>

            <div className="rounded-2xl border border-[#e4e8dc] bg-[#fbfcf8] p-4 text-xs text-slate-600">
              <span className="font-bold text-[#0f140f]">Note:</span> Invitations include a
              secure one-time link valid for 7 days. If Resend credentials are not configured
              locally, the invite link will be shown directly above.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4ff32] px-4 py-3 text-sm font-bold text-[#0f140f] shadow-xs transition hover:bg-[#bfe818] active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#0f140f]" />
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
