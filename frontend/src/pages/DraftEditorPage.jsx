import { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Save,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  X,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function DraftEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { user, currentWorkspace } = useAuth();
  const role = currentWorkspace?.role || user?.role || 'CREATOR';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewNote, setReviewNote] = useState('');

  const fetchDraft = async (draftId) => {
    try {
      setLoading(true);
      const res = await api.get(`/drafts/${draftId}`);
      if (res.data?.status === 'success') {
        const d = res.data.data.draft;
        setDraft(d);
        setTitle(d.title);
        setContent(d.content);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load draft');
      navigate('/drafts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNew) {
      fetchDraft(id);
    } else {
      setTitle('Untitled Marketing Draft');
      setContent('');
    }
  }, [id, isNew]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!content.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        const res = await api.post('/drafts', { title, content });
        if (res.data?.status === 'success') {
          toast.success('Draft created successfully');
          navigate(`/drafts/${res.data.data.draft.id}`);
        }
      } else {
        const res = await api.put(`/drafts/${id}`, { title, content });
        if (res.data?.status === 'success') {
          setDraft(res.data.data.draft);
          toast.success('Draft saved');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleRunCheck = async () => {
    if (isNew) {
      toast.error('Please save your draft first before running brand check');
      return;
    }

    try {
      setChecking(true);
      // Auto-save content first if changed
      await api.put(`/drafts/${id}`, { title, content });

      const res = await api.post(`/drafts/${id}/check`);
      if (res.data?.status === 'success') {
        setDraft(res.data.data.draft);
        toast.success(res.data.data.summary || 'Brand check complete!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Brand check failed');
    } finally {
      setChecking(false);
    }
  };

  const handleSuggestionAction = async (suggestionId, action) => {
    try {
      const res = await api.post(`/drafts/${id}/suggestions/${suggestionId}/action`, { action });
      if (res.data?.status === 'success') {
        const updated = res.data.data.draft;
        setDraft(updated);
        setContent(updated.content);
        toast.success(action === 'ACCEPT' ? 'Suggestion accepted & applied' : 'Suggestion dismissed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update suggestion');
    }
  };

  const handleSubmitForReview = async () => {
    try {
      const res = await api.post(`/drafts/${id}/submit`);
      if (res.data?.status === 'success') {
        setDraft(res.data.data.draft);
        toast.success('Draft submitted for team review!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit draft');
    }
  };

  const handleReviewDecisionSubmit = async () => {
    try {
      const res = await api.post(`/drafts/${id}/review`, {
        decision: reviewDecision,
        note: reviewNote,
      });
      if (res.data?.status === 'success') {
        setDraft(res.data.data.draft);
        setReviewModalOpen(false);
        setReviewNote('');
        toast.success(
          reviewDecision === 'APPROVED' ? 'Draft approved!' : 'Changes requested on draft'
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to record review decision');
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const suggestions = draft?.suggestions || [];
  const pendingSuggestions = suggestions.filter((s) => s.status === 'PENDING');
  const acceptedSuggestions = suggestions.filter((s) => s.status === 'ACCEPTED');

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <NavLink
            to="/drafts"
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft size={18} />
          </NavLink>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                {currentWorkspace?.name || 'Workspace'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500">
                {isNew ? 'New Draft' : `Status: ${draft?.status || 'DRAFT'}`}
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Draft Title..."
              className="mt-0.5 text-xl font-bold text-slate-950 focus:border-b focus:border-indigo-500 focus:outline-none sm:text-2xl"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          {!isNew && (
            <button
              onClick={handleRunCheck}
              disabled={checking}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70"
            >
              <Sparkles size={15} className={checking ? 'animate-spin' : ''} />
              <span>{checking ? 'Analyzing Brand Rules...' : 'Run Brand Check'}</span>
            </button>
          )}

          {!isNew && (role === 'CREATOR' || role === 'ADMIN') && draft?.status !== 'APPROVED' && (
            <button
              onClick={handleSubmitForReview}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              <Send size={15} />
              <span>Submit for Review</span>
            </button>
          )}

          {!isNew && (role === 'REVIEWER' || role === 'ADMIN') && (
            <button
              onClick={() => {
                setReviewDecision('APPROVED');
                setReviewModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <CheckCircle2 size={15} />
              <span>Review Decision</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-xs text-slate-500">Loading draft workspace...</p>
        </div>
      ) : (
        /* Two-Column Studio Layout */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Draft Content Editor (7 Cols) */}
          <div className="space-y-4 lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-400">
                <span className="font-medium text-slate-600">Draft Content Editor</span>
                <div className="flex items-center gap-3">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} characters</span>
                </div>
              </div>

              <textarea
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or write your marketing copy, social post, or launch announcement here..."
                className="w-full resize-y rounded-xl border border-slate-200 p-4 font-mono text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              {draft?.reviewNote && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <AlertTriangle size={14} />
                    <span>Reviewer Note:</span>
                  </div>
                  <p className="mt-1 text-xs text-amber-900">{draft.reviewNote}</p>
                </div>
              )}
            </div>

            {/* Human-in-the-Loop Safeguard Notice */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              <ShieldCheck size={20} className="shrink-0 text-indigo-600" />
              <p>
                <strong>Human-Led Guarantee:</strong> BrandCheck AI suggests and highlights brand guideline deviations.
                You retain complete control to accept, edit, or dismiss each recommendation before publishing.
              </p>
            </div>
          </div>

          {/* Right Column: Brand Check Compliance Studio (5 Cols) */}
          <div className="space-y-4 lg:col-span-5">
            {/* Compliance Score Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Brand Compliance Score</h3>
                  <p className="text-xs text-slate-500">Evaluated against approved workspace guidelines</p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-2xl font-black ${
                      (draft?.complianceScore ?? 100) >= 85
                        ? 'text-emerald-600'
                        : (draft?.complianceScore ?? 100) >= 60
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {draft?.complianceScore !== null && draft?.complianceScore !== undefined
                      ? `${draft.complianceScore}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all duration-500 ${
                    (draft?.complianceScore ?? 100) >= 85
                      ? 'bg-emerald-500'
                      : (draft?.complianceScore ?? 100) >= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${draft?.complianceScore ?? 0}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">
                  {pendingSuggestions.length} pending finding{pendingSuggestions.length !== 1 ? 's' : ''}
                </span>
                <span className="text-emerald-600 font-medium">
                  {acceptedSuggestions.length} accepted
                </span>
              </div>
            </div>

            {/* Suggestions & Violations Stream */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Guideline Findings & Corrections
              </h3>

              {isNew ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <p className="text-xs text-slate-500">Save draft and click "Run Brand Check" to view findings.</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                  <h4 className="mt-2 text-sm font-semibold text-slate-800">Clean Brand Report</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    No active brand violations detected. Click "Run Brand Check" to re-scan.
                  </p>
                </div>
              ) : (
                suggestions.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-2xl border p-4 shadow-sm transition ${
                      s.status === 'ACCEPTED'
                        ? 'border-emerald-200 bg-emerald-50/40 opacity-75'
                        : s.status === 'DISMISSED'
                        ? 'border-slate-200 bg-slate-50/60 opacity-50'
                        : s.severity === 'ERROR'
                        ? 'border-rose-200 bg-rose-50/40'
                        : 'border-amber-200 bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            s.severity === 'ERROR'
                              ? 'bg-rose-100 text-rose-800'
                              : s.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {s.severity}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {s.category}
                        </span>
                      </div>

                      <span className="text-[10px] font-medium uppercase text-slate-400">
                        {s.status}
                      </span>
                    </div>

                    {/* Flagged and Suggested Text */}
                    <div className="mt-2.5 space-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400">FLAGGED COPY:</span>
                        <p className="font-mono text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 line-through">
                          "{s.originalText}"
                        </p>
                      </div>

                      {s.suggestedText && (
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400">RECOMMENDED FIX:</span>
                          <p className="font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            "{s.suggestedText}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {s.explanation}
                    </p>

                    {/* Action Buttons for Pending Suggestions */}
                    {s.status === 'PENDING' && (
                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200/60 pt-2.5">
                        <button
                          onClick={() => handleSuggestionAction(s.id, 'DISMISS')}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <X size={12} />
                          <span>Dismiss</span>
                        </button>

                        <button
                          onClick={() => handleSuggestionAction(s.id, 'ACCEPT')}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-indigo-700"
                        >
                          <Check size={12} />
                          <span>Accept Correction</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Decision Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Formal Review Decision</h3>
            <p className="mt-1 text-xs text-slate-500">
              Record approval or request revisions with structured feedback.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Decision</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('APPROVED')}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                      reviewDecision === 'APPROVED'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Approve Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('CHANGES_REQUESTED')}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                      reviewDecision === 'CHANGES_REQUESTED'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ⚠ Request Changes
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Reviewer Note / Feedback</label>
                <textarea
                  rows={4}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Provide guidance on required edits or approval confirmation..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewDecisionSubmit}
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
