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
          <span className="inline-flex items-center gap-1 rounded-full border border-[#d8e6db] bg-[#eef5ee] px-2.5 py-0.5 text-xs font-bold text-[#1c3822]">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#f07153]/30 bg-[#fef2ee] px-2.5 py-0.5 text-xs font-bold text-[#c2410c]">
            <Clock size={12} /> In Review
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-800">
            <AlertTriangle size={12} /> Changes Requested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            <FileText size={12} /> Draft
          </span>
        );
    }
  };

  const getScoreBadge = (score) => {
    if (score === null || score === undefined) {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg border border-[#e4e8dc] bg-[#fbfcf8] px-2.5 py-1 text-xs font-medium text-slate-500">
          Not checked
        </span>
      );
    }
    let colorClass = 'border-[#d4ff32]/60 bg-[#0f140f] text-[#d4ff32]';
    if (score < 60) {
      colorClass = 'border-[#f07153]/40 bg-[#fef2ee] text-[#c2410c]';
    } else if (score < 85) {
      colorClass = 'border-amber-300 bg-amber-50 text-amber-900';
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold ${colorClass}`}>
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
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0f140f] sm:text-3xl">
              Drafts &amp; Brand Review Studio
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Manage creator copy, execute instant AI brand compliance audits, and submit for approval.
          </p>
        </div>

        <NavLink
          to="/drafts/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4ff32] px-4 py-2.5 text-sm font-bold text-[#0f140f] shadow-xs transition hover:bg-[#bfe818] active:scale-[0.98]"
        >
          <Plus size={18} />
          <span>New Draft</span>
        </NavLink>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-[#e4e8dc] bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Drafts</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#0f140f]">{stats.total}</p>
        </div>
        <div className="rounded-3xl border border-[#e4e8dc] bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">In Review Queue</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#f07153]">{stats.inReview}</p>
        </div>
        <div className="rounded-3xl border border-[#e4e8dc] bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved Content</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#1c3822]">{stats.approved}</p>
        </div>
        <div className="rounded-3xl border border-[#e4e8dc] bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Compliance Score</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#0f140f]">
            {stats.avgScore !== null ? `${stats.avgScore}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e4e8dc] bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === status
                  ? 'bg-[#0f140f] text-[#d4ff32]'
                  : 'border border-[#e4e8dc] bg-[#fbfcf8] text-slate-600 hover:bg-[#eef5ee] hover:text-[#0f140f]'
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
              className="w-full rounded-xl border border-[#e4e8dc] bg-[#fbfcf8] py-1.5 pl-9 pr-3 text-xs text-[#0f140f] placeholder-slate-400 focus:border-[#0f140f] focus:bg-white focus:outline-none"
            />
          </div>
          <button
            onClick={fetchDrafts}
            title="Refresh drafts"
            className="rounded-xl border border-[#e4e8dc] p-2 text-[#0f140f] hover:bg-[#eef5ee]"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Drafts List Table/Cards */}
      {loading ? (
        <div className="rounded-3xl border border-[#e4e8dc] bg-white p-12 text-center shadow-xs">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#0f140f] border-t-[#d4ff32]" />
          <p className="mt-3 text-xs text-slate-500">Loading drafts...</p>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#e4e8dc] bg-white p-12 text-center shadow-xs">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0f140f] text-[#d4ff32] shadow-xs">
            <FileText size={24} />
          </div>
          <h3 className="mt-4 font-bold text-[#0f140f]">No drafts found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {search
              ? 'No drafts matched your search query.'
              : 'Create your first marketing draft to start scanning against brand guidelines.'}
          </p>
          {!search && (
            <NavLink
              to="/drafts/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d4ff32] px-4 py-2 text-xs font-bold text-[#0f140f] shadow-xs hover:bg-[#bfe818]"
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
              className="group flex cursor-pointer flex-col justify-between gap-4 rounded-3xl border border-[#e4e8dc] bg-white p-5 shadow-xs transition hover:border-[#0f140f] hover:shadow-md sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-extrabold text-[#0f140f] group-hover:text-[#0f140f]">
                    {draft.title}
                  </h3>
                  {getStatusBadge(draft.status)}
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                  {draft.content}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span>Author: <strong className="text-slate-700">{draft.creator?.name || 'You'}</strong></span>
                  <span>Updated: {new Date(draft.updatedAt).toLocaleDateString()}</span>
                  {draft.reviewer && (
                    <span>Reviewer: <strong className="text-slate-700">{draft.reviewer.name}</strong></span>
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

                <div className="flex items-center gap-1 rounded-xl bg-[#0f140f] px-3 py-2 text-xs font-bold text-[#d4ff32] shadow-xs transition group-hover:bg-[#1a231b]">
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
