import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  LogOut,
  Mail,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const { user, refreshUser, logout } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token. Please check your invitation email.');
      setLoading(false);
      return;
    }

    async function fetchInvitation() {
      try {
        setLoading(true);
        const res = await api.get(`/workspaces/invitations/${token}`);
        setInvitation(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invitation link');
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await api.post('/workspaces/invitations/accept', { token });
      const { workspace, role } = res.data.data;
      toast.success(`Successfully joined ${workspace.name} as ${role}!`);
      await refreshUser(workspace.id);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to accept invitation';
      toast.error(msg);
      setError(msg);
    } finally {
      setAccepting(false);
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
        <h1 className="text-xl font-bold text-slate-900">Invitation Invalid</h1>
        <p className="mt-2 text-sm text-slate-600">{error || 'This invitation is not valid.'}</p>
        <div className="mt-6">
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

  if (invitation.status === 'EXPIRED') {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle size={24} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Invitation Expired</h1>
        <p className="mt-2 text-sm text-slate-600">
          This invitation has expired. Please ask the workspace admin to send a new invitation.
        </p>
      </div>
    );
  }

  if (invitation.status === 'ACCEPTED') {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={24} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Already Accepted</h1>
        <p className="mt-2 text-sm text-slate-600">
          This invitation has already been accepted. You can log in to access your dashboard.
        </p>
        <div className="mt-6">
          <NavLink
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Go to Dashboard <ArrowRight size={14} />
          </NavLink>
        </div>
      </div>
    );
  }

  const isEmailMatching = user && user.email.toLowerCase() === invitation.email.toLowerCase();

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
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
        <strong className="text-indigo-600 uppercase font-semibold">{invitation.role}</strong>.
      </p>

      {/* Case 1: User is not logged in */}
      {!user && (
        <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            This invitation was sent to{' '}
            <strong className="font-semibold text-slate-900">{invitation.email}</strong>. Please
            create an account or log in with this email to accept.
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <NavLink
              to={`/signup?email=${encodeURIComponent(invitation.email)}&token=${token}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Sign up as {invitation.role} <ArrowRight size={14} />
            </NavLink>
            <NavLink
              to={`/login?email=${encodeURIComponent(invitation.email)}&token=${token}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Log in
            </NavLink>
          </div>
        </div>
      )}

      {/* Case 2: User is logged in, but with a different email */}
      {user && !isEmailMatching && (
        <div className="mt-6 space-y-4 rounded-xl border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Email Mismatch</p>
              <p>
                This invitation was sent to{' '}
                <strong className="font-medium text-amber-950">{invitation.email}</strong>, but you
                are currently signed in as{' '}
                <strong className="font-medium text-amber-950">{user.email}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100/50"
          >
            <LogOut size={13} />
            Log out to switch accounts
          </button>
        </div>
      )}

      {/* Case 3: User is logged in with matching email */}
      {user && isEmailMatching && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
            <UserCheck size={18} className="text-emerald-600 shrink-0" />
            <span>
              Signed in as <strong className="text-slate-900">{user.email}</strong>
            </span>
          </div>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {accepting ? (
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
        </div>
      )}
    </div>
  );
}

