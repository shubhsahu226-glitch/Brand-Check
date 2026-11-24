import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Trash2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function DraftsListPage() {
  const navigate = useNavigate();

  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/drafts');
      if (res.data?.status === 'success') {
        setDrafts(res.data.data.drafts || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    try {
      await api.delete(`/drafts/${id}`);
      toast.success('Draft deleted successfully');
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete draft');
    }
  };

  const filteredDrafts = drafts.filter((d) => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: drafts.length,
    inReview: drafts.filter((d) => d.status === 'IN_REVIEW').length,
    approved: drafts.filter((d) => d.status === 'APPROVED').length,
    avgScore:
      drafts.filter((d) => d.complianceScore !== null).length > 0
        ? Math.round(
            drafts
              .filter((d) => d.complianceScore !== null)
              .reduce((acc, curr) => acc + curr.complianceScore, 0) /
              drafts.filter((d) => d.complianceScore !== null).length
          )
        : null,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Clock size={12} /> In Review
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
            <AlertTriangle size={12} /> Changes Requested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            <FileText size={12} /> Draft
          </span>
        );
    }
  };

  const getScoreBadge = (score) => {
    if (score === null || score === undefined) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          Not checked
        </span>
      );
    }
    let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score < 60) {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (score < 85) {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${colorClass}`}>
        <Sparkles size={12} />
        {score}/100
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Drafts & Brand Review Studio
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Manage creator copy, execute instant AI brand compliance audits, and submit for approval.
          </p>
        </div>

        <NavLink
          to="/drafts/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          <span>New Draft</span>
        </NavLink>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Drafts</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">In Review Queue</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.inReview}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Approved Content</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.approved}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Avg Compliance Score</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">
            {stats.avgScore !== null ? `${stats.avgScore}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {status === 'ALL'
                ? 'All Drafts'
                : status === 'IN_REVIEW'
                ? 'In Review'
                : status === 'CHANGES_REQUESTED'
                ? 'Changes Requested'
                : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or content..."
              className="w-full rounded-xl border border-slate-200 py-1.5 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={fetchDrafts}
            title="Refresh drafts"
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Drafts List Table/Cards */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-xs text-slate-500">Loading drafts...</p>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileText size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">No drafts found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {search
              ? 'No drafts matched your search query.'
              : 'Create your first marketing draft to start scanning against brand guidelines.'}
          </p>
          {!search && (
            <NavLink
              to="/drafts/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus size={16} />
              <span>Create New Draft</span>
            </NavLink>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDrafts.map((draft) => (
            <div
              key={draft.id}
              onClick={() => navigate(`/drafts/${draft.id}`)}
              className="group flex cursor-pointer flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-slate-950 group-hover:text-indigo-600">
                    {draft.title}
                  </h3>
                  {getStatusBadge(draft.status)}
                </div>
                <p className="line-clamp-2 text-xs text-slate-500">
                  {draft.content}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span>Author: <strong className="text-slate-600">{draft.creator?.name || 'You'}</strong></span>
                  <span>Updated: {new Date(draft.updatedAt).toLocaleDateString()}</span>
                  {draft.reviewer && (
                    <span>Reviewer: <strong className="text-slate-600">{draft.reviewer.name}</strong></span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {getScoreBadge(draft.complianceScore)}

                <button
                  onClick={(e) => handleDelete(e, draft.id)}
                  title="Delete draft"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition group-hover:bg-indigo-600 group-hover:text-white">
                  <span>Open Studio</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
