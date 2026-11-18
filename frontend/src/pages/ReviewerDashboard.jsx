import { CheckSquare, Clock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ReviewerDashboard() {
  const { user, currentWorkspace } = useAuth();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                <CheckSquare size={13} />
                REVIEWER
              </span>
              <span className="text-xs font-medium text-slate-500">
                Workspace: <strong className="text-slate-800">{currentWorkspace?.name}</strong>
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review submitted content drafts, verify brand findings, and make approval decisions.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Pending Review</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">0</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Changes Requested</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">0</p>
          </div>
          <div className="col-span-2 rounded-xl bg-slate-50 p-4 sm:col-span-1">
            <p className="text-xs font-medium text-slate-500">Approved This Week</p>
            <p className="mt-1.5 text-2xl font-bold text-amber-600">0</p>
          </div>
        </div>
      </div>

      {/* "Review Queue" Placeholder Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare size={20} className="text-amber-600" />
            <h2 className="text-lg font-semibold text-slate-900">Review Queue</h2>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            Phase 5 feature
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm">
            <Clock size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-slate-800">Your review queue is clear</h3>
          <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500">
            Submitted drafts, inline diff views, brand violation flags, and approval/rejection
            actions will be available in Phase 5.
          </p>
        </div>
      </div>

      {/* Placeholder Cards for Future Reviewer Features */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Upcoming Reviewer Capabilities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck size={20} />
            </div>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              Phase 5: Decision Controls
            </span>
            <h3 className="mt-2.5 font-semibold text-slate-900">Explainable AI Findings</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Inspect AI rule violations with exact citations to brand guidelines, allowing fast
              and defensible decisions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <CheckCircle2 size={20} />
            </div>
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              Phase 5: Audit Trail
            </span>
            <h3 className="mt-2.5 font-semibold text-slate-900">Immutable Publication Log</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Keep a permanent record of who reviewed each piece, what was changed, and who gave
              the final publishing sign-off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

