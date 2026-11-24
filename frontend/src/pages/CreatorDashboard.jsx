import { NavLink } from 'react-router-dom';
import { FileText, PlusCircle, Sparkles, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CreatorDashboard() {
  const { user, currentWorkspace } = useAuth();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <FileText size={13} />
                CREATOR
              </span>
              <span className="text-xs font-medium text-slate-500">
                Workspace: <strong className="text-slate-800">{currentWorkspace?.name}</strong>
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Draft, check, and refine content against verified brand guidance.
            </p>
          </div>

          <NavLink
            to="/knowledge-base"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <BookOpen size={16} />
            <span>Browse Brand Guidelines</span>
          </NavLink>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Drafts In Progress</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">0</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Submitted for Review</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">0</p>
          </div>
          <div className="col-span-2 rounded-xl bg-slate-50 p-4 sm:col-span-1">
            <p className="text-xs font-medium text-slate-500">Approved Content</p>
            <p className="mt-1.5 text-2xl font-bold text-emerald-600">0</p>
          </div>
        </div>
      </div>

      {/* "My Drafts" Active Studio Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Draft Intake & Compliance Studio</h2>
          </div>
          <NavLink
            to="/drafts/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <PlusCircle size={14} />
            <span>Create Draft</span>
          </NavLink>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm">
            <Sparkles size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-slate-800">Draft Intake & Review Studio Live</h3>
          <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500">
            Write or paste marketing copy, run instant AI brand compliance audits against verified brand rules,
            and review inline suggestions before publishing.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <NavLink
              to="/drafts"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span>View All Drafts</span>
            </NavLink>
            <NavLink
              to="/drafts/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <PlusCircle size={14} />
              <span>Start New Draft</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Placeholder Cards for Future Creator Features */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Upcoming Creator Capabilities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles size={20} />
            </div>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              Phase 4: Brand Check Engine
            </span>
            <h3 className="mt-2.5 font-semibold text-slate-900">Instant Brand Compliance Check</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Run automated checks against approved facts, tone guidelines, and forbidden terms
              with clear explanations.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle size={20} />
            </div>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Phase 5: Approval Workflow
            </span>
            <h3 className="mt-2.5 font-semibold text-slate-900">Review Collaboration</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Collaborate directly with assigned reviewers, address feedback comments, and resolve
              findings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

