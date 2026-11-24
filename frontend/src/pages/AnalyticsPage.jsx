import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  BookOpen,
  ArrowRight,
  Activity,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsPage() {
  const { currentWorkspace } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workspaces/analytics');
      if (res.data?.status === 'success') {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const summary = analytics?.summary || {};
  const breakdowns = analytics?.breakdowns || {};
  const statusCounts = breakdowns?.statusCounts || {
    DRAFT: 0,
    IN_REVIEW: 0,
    CHANGES_REQUESTED: 0,
    APPROVED: 0,
  };
  const severityCounts = breakdowns?.severityCounts || { ERROR: 0, WARNING: 0, INFO: 0 };
  const topViolations = breakdowns?.topViolations || [];
  const recentActivity = analytics?.recentActivity || [];

  const totalFindings = summary.totalFindings || 0;
  const avgScore = summary.avgComplianceScore ?? 100;

  const getScoreHealth = (score) => {
    if (score >= 85) return { label: 'Optimal', color: 'text-emerald-600', bg: 'bg-emerald-500' };
    if (score >= 65) return { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-500' };
    return { label: 'At Risk', color: 'text-rose-600', bg: 'bg-rose-500' };
  };

  const health = getScoreHealth(avgScore);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              <TrendingUp size={13} />
              PHASE 6: INSIGHTS & ANALYTICS
            </span>
            <span className="text-xs font-medium text-slate-500">
              Workspace: <strong className="text-slate-800">{currentWorkspace?.name}</strong>
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Brand Compliance Analytics & Insights
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor real-time compliance trends, rule violation patterns, and approval velocity across your team.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-xs text-slate-500">Aggregating workspace analytics...</p>
        </div>
      ) : (
        <>
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Workspace Health Score</span>
                <span className={`text-xs font-bold ${health.color}`}>{health.label}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950">{avgScore}%</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all duration-500 ${health.bg}`}
                  style={{ width: `${avgScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Total Drafts Created</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950">
                  {summary.totalDrafts || 0}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {summary.approvedDrafts || 0} approved
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {summary.pendingReview || 0} in review queue
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">AI Correction Acceptance</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950">
                  {summary.acceptanceRate || 100}%
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Human-in-the-loop suggestion approval rate
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Active Brand Rules</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950">
                  {summary.approvedRules || 0}
                </span>
                <span className="text-xs text-slate-400">
                  of {summary.totalRules || 0} total
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Verified guidelines enforced by AI service
              </p>
            </div>
          </div>

          {/* Middle Row: Content Pipeline Funnel & Violations */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Draft Pipeline Status Breakdown (6 Cols) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Content Pipeline Funnel</h3>
                  <p className="text-xs text-slate-500">Distribution of drafts across lifecycle stages</p>
                </div>
                <NavLink
                  to="/drafts"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <span>View Drafts</span>
                  <ArrowRight size={13} />
                </NavLink>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  {
                    label: 'Approved Content',
                    key: 'APPROVED',
                    count: statusCounts.APPROVED,
                    color: 'bg-emerald-500',
                    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  },
                  {
                    label: 'Under Review',
                    key: 'IN_REVIEW',
                    count: statusCounts.IN_REVIEW,
                    color: 'bg-amber-500',
                    badge: 'bg-amber-50 text-amber-700 border-amber-200',
                  },
                  {
                    label: 'Changes Requested',
                    key: 'CHANGES_REQUESTED',
                    count: statusCounts.CHANGES_REQUESTED,
                    color: 'bg-rose-500',
                    badge: 'bg-rose-50 text-rose-700 border-rose-200',
                  },
                  {
                    label: 'Draft In Progress',
                    key: 'DRAFT',
                    count: statusCounts.DRAFT,
                    color: 'bg-slate-400',
                    badge: 'bg-slate-50 text-slate-700 border-slate-200',
                  },
                ].map((item) => {
                  const pct =
                    summary.totalDrafts > 0
                      ? Math.round((item.count / summary.totalDrafts) * 100)
                      : 0;
                  return (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.count}</span>
                          <span className="text-[11px] text-slate-400">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full transition-all duration-500 ${item.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Brand Deviations & Severity (6 Cols) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Top Guideline Deviations</h3>
                  <p className="text-xs text-slate-500">Most frequent rule categories flagged by AI</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    {severityCounts.ERROR} Critical
                  </span>
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {severityCounts.WARNING} Warnings
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {topViolations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                    <p className="mt-2 font-medium">No rule violations recorded</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Drafts checked against brand rules will populate category insights here.
                    </p>
                  </div>
                ) : (
                  topViolations.map((v) => {
                    const pct =
                      totalFindings > 0 ? Math.round((v.count / totalFindings) * 100) : 0;
                    return (
                      <div key={v.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{v.category}</span>
                          <span className="text-slate-500 font-medium">
                            {v.count} finding{v.count !== 1 ? 's' : ''} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Audit Activity Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Recent Workspace Activity Log</h3>
              </div>
              <span className="text-xs text-slate-400">Immutable audit records</span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {recentActivity.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">No activity recorded yet.</p>
              ) : (
                recentActivity.map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700">
                        {event.actor?.name?.slice(0, 2).toUpperCase() || 'SYS'}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800">
                          <strong className="text-slate-950">{event.actor?.name || 'User'}</strong>{' '}
                          performed <span className="font-mono text-indigo-700">{event.action}</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Target: {event.entityType} ({event.entityId?.slice(0, 8)}...)
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(event.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
