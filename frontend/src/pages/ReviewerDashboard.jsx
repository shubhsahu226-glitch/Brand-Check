import { NavLink } from 'react-router-dom';
import { CheckSquare, ShieldCheck, CheckCircle2, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ReviewerDashboard() {
  const { user, currentWorkspace } = useAuth();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="rounded-3xl border border-[#e4e8dc] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f07153]/30 bg-[#fef2ee] px-3 py-1 text-xs font-bold text-[#c2410c]">
                <CheckSquare size={13} />
                REVIEWER
              </span>
              <span className="text-xs font-medium text-slate-500">
                Workspace: <strong className="text-[#0f140f]">{currentWorkspace?.name}</strong>
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0f140f] sm:text-3xl">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review submitted content drafts, verify brand findings, and make approval decisions.
            </p>
          </div>

          <NavLink
            to="/knowledge-base"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f140f] px-4 py-2.5 text-xs font-bold text-[#d4ff32] shadow-sm transition hover:bg-[#1a231b]"
          >
            <BookOpen size={16} />
            <span>Consult Brand Guidelines</span>
          </NavLink>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e4e8dc] bg-[#fbfcf8] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Review</p>
            <p className="mt-1.5 text-2xl font-extrabold text-[#0f140f]">0</p>
          </div>
          <div className="rounded-2xl border border-[#e4e8dc] bg-[#fbfcf8] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Changes Requested</p>
            <p className="mt-1.5 text-2xl font-extrabold text-[#f07153]">0</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-[#e4e8dc] bg-[#fbfcf8] p-4 sm:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved This Week</p>
            <p className="mt-1.5 text-2xl font-extrabold text-[#1c3822]">0</p>
          </div>
        </div>
      </div>

      {/* "Review Queue" Active Section */}
      <div className="rounded-3xl border border-[#e4e8dc] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0f140f] text-[#d4ff32]">
              <CheckSquare size={18} />
            </span>
            <h2 className="text-lg font-bold text-[#0f140f]">Review Queue &amp; Decisions</h2>
          </div>
          <NavLink
            to="/drafts"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4ff32] px-3.5 py-2 text-xs font-bold text-[#0f140f] shadow-sm hover:bg-[#bfe818]"
          >
            <span>Open Review Queue</span>
          </NavLink>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[#fbfcf8] p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0f140f] text-[#d4ff32] shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <h3 className="mt-4 font-bold text-[#0f140f]">Draft Review Queue Live</h3>
          <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-600">
            Audit submitted creator drafts, inspect explainable brand findings, review compliance scores,
            and make formal approval or changes-requested decisions.
          </p>
          <NavLink
            to="/drafts"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0f140f] px-4 py-2 text-xs font-bold text-[#d4ff32] shadow-sm hover:bg-[#1a231b]"
          >
            <CheckSquare size={14} />
            <span>Go to Drafts &amp; Review Studio</span>
          </NavLink>
        </div>
      </div>

      {/* Reviewer Capabilities & Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#0f140f]">Reviewer Capabilities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NavLink
            to="/drafts"
            className="group rounded-3xl border border-[#d8e6db] bg-white p-6 shadow-sm transition hover:border-[#0f140f] hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f140f] text-[#d4ff32] shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                Live &amp; Ready
              </span>
            </div>
            <span className="rounded-md border border-[#d8e6db] bg-[#eef5ee] px-2.5 py-0.5 text-[11px] font-bold text-[#1c3822]">
              Decision Controls
            </span>
            <h3 className="mt-2.5 font-bold text-[#0f140f] group-hover:underline decoration-[#d4ff32] decoration-2 transition">
              Explainable AI Findings &rarr;
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Inspect AI rule violations with exact citations to brand guidelines, allowing fast
              and defensible decisions.
            </p>
          </NavLink>

          <NavLink
            to="/analytics"
            className="group rounded-3xl border border-[#d8e6db] bg-white p-6 shadow-sm transition hover:border-[#0f140f] hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f140f] text-[#d4ff32] shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                Live &amp; Ready
              </span>
            </div>
            <span className="rounded-md border border-[#d8e6db] bg-[#eef5ee] px-2.5 py-0.5 text-[11px] font-bold text-[#1c3822]">
              Audit Trail
            </span>
            <h3 className="mt-2.5 font-bold text-[#0f140f] group-hover:underline decoration-[#d4ff32] decoration-2 transition">
              Immutable Publication Log &rarr;
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Keep a permanent record of who reviewed each piece, what was changed, and who gave
              the final sign-off.
            </p>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
