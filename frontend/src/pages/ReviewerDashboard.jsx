import { NavLink } from 'react-router-dom';
import { CheckSquare, Clock, ShieldCheck, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
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

          <NavLink
            to="/knowledge-base"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <BookOpen size={16} />
            <span>Consult Brand Guidelines</span>
          </NavLink>
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

      {/* "Review Queue" Active Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare size={20} className="text-amber-600" />
            <h2 className="text-lg font-semibold text-slate-900">Review Queue & Decisions</h2>
          </div>
          <NavLink
            to="/drafts"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            <span>Open Review Queue</span>
          </NavLink>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-slate-800">Draft Review Queue Live</h3>
          <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500">
            Audit submitted creator drafts, inspect explainable brand findings, review compliance scores,
            and make formal approval or changes-requested decisions.
          </p>
          <NavLink
            to="/drafts"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <CheckSquare size={14} />
            <span>Go to Drafts & Review Studio</span>
          </NavLink>
        </div>
      </div>

      {/* Reviewer Capabilities & Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Reviewer Capabilities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NavLink
            to="/drafts"
            className="group rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white p-6 shadow-sm transition hover:border-indigo-400 hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                Live & Ready
              </span>
            </div>
            <span className="rounded bg-indigo-100/70 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
              Decision Controls
            </span>
            <h3 className="mt-2.5 font-semibold text-slate-900 group-hover:text-indigo-600 transition">
              Explainable AI Findings &rarr;
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Inspect AI rule violations with exact citations to brand guidelines, allowing fast
              and defensible decisions.
            </p>
          </NavLink>

          <NavLink
            to="/analytics"
            className="group rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white p-6 shadow-sm transition hover:border-amber-400 hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-600 text-white shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                Live & Ready
              </span>
            </div>
            <span className="rounded bg-amber-100/70 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              Audit Trail
            </span>
            <h3 className="mt-2.5 font-semibold text-slate-900 group-hover:text-amber-600 transition">
              Immutable Publication Log &rarr;
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Keep a permanent record of who reviewed each piece, what was changed, and who gave
              the final publishing sign-off.
            </p>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

