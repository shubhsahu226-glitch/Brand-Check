import { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Check,
  X,
  ShieldCheck,
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
        const returnedDraft = res.data.data.draft || {};
        const suggestions =
          returnedDraft.suggestions && returnedDraft.suggestions.length > 0
            ? returnedDraft.suggestions
            : res.data.data.suggestions || [];
        const score =
          returnedDraft.complianceScore !== null && returnedDraft.complianceScore !== undefined
            ? returnedDraft.complianceScore
            : res.data.data.complianceScore;

        const merged = {
          ...returnedDraft,
          complianceScore: score !== undefined ? score : 100,
          suggestions,
        };
        setDraft(merged);
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
        if (updated && updated.suggestions && updated.suggestions.length > 0) {
          setDraft(updated);
          setContent(updated.content);
        } else {
          setDraft((prev) => {
            if (!prev) return prev;
            const updatedSuggestions = (prev.suggestions || []).map((s) =>
              s.id === suggestionId ? { ...s, status: action === 'ACCEPT' ? 'ACCEPTED' : 'DISMISSED' } : s
            );
            const targetSug = (prev.suggestions || []).find((s) => s.id === suggestionId);
            let newContent = prev.content;
            if (action === 'ACCEPT' && targetSug?.suggestedText && targetSug?.originalText) {
              newContent = newContent.replace(targetSug.originalText, targetSug.suggestedText);
              setContent(newContent);
            }
            const pending = updatedSuggestions.filter((s) => s.status === 'PENDING');
            let penalty = 0;
            for (const s of pending) {
              penalty += s.severity === 'ERROR' ? 20 : s.severity === 'WARNING' ? 10 : 5;
            }
            return {
              ...prev,
              content: newContent,
              complianceScore: Math.max(0, Math.min(100, 100 - penalty)),
              suggestions: updatedSuggestions,
            };
          });
        }
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
      <div className="flex flex-col gap-4 border-b border-[#e4e8dc] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <NavLink
            to="/drafts"
            className="rounded-xl border border-[#e4e8dc] p-2 text-[#0f140f] transition hover:bg-[#eef5ee]"
          >
            <ArrowLeft size={18} />
          </NavLink>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-[#d8e6db] bg-[#eef5ee] px-2 py-0.5 text-xs font-bold text-[#1c3822]">
                {currentWorkspace?.name || 'Workspace'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-500">
                {isNew ? 'New Draft' : `Status: ${draft?.status || 'DRAFT'}`}
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Draft Title..."
              className="mt-0.5 text-xl font-extrabold text-[#0f140f] focus:border-b-2 focus:border-[#0f140f] focus:outline-none sm:text-2xl"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4e8dc] bg-white px-3.5 py-2 text-xs font-bold text-[#0f140f] shadow-xs hover:bg-[#fbfcf8]"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          {!isNew && (
            <button
              onClick={handleRunCheck}
              disabled={checking}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4ff32] px-4 py-2 text-xs font-bold text-[#0f140f] shadow-xs transition hover:bg-[#bfe818] active:scale-[0.98] disabled:opacity-70"
            >
              <Sparkles size={15} className={checking ? 'animate-spin' : ''} />
              <span>{checking ? 'Analyzing Brand Rules...' : 'Run Brand Check'}</span>
            </button>
          )}

          {!isNew && (role === 'CREATOR' || role === 'ADMIN') && draft?.status !== 'APPROVED' && (
            <button
              onClick={handleSubmitForReview}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f140f] px-3.5 py-2 text-xs font-bold text-[#d4ff32] shadow-xs transition hover:bg-[#1a231b]"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8e6db] bg-[#eef5ee] px-3.5 py-2 text-xs font-bold text-[#1c3822] shadow-xs transition hover:bg-[#d8e6db]"
            >
              <CheckCircle2 size={15} />
              <span>Review Decision</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[#e4e8dc] bg-white p-16 text-center shadow-xs">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#0f140f] border-t-[#d4ff32]" />
          <p className="mt-3 text-xs text-slate-500">Loading draft workspace...</p>
        </div>
      ) : (
        /* Two-Column Studio Layout */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Draft Content Editor (7 Cols) */}
          <div className="space-y-4 lg:col-span-7">
            <div className="rounded-3xl border border-[#e4e8dc] bg-white p-6 shadow-xs">
              <div className="mb-3 flex items-center justify-between border-b border-[#e4e8dc] pb-3 text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-[#0f140f]">Draft Content Editor</span>
                <div className="flex items-center gap-3 font-semibold text-slate-500">
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
                className="w-full resize-y rounded-2xl border border-[#e4e8dc] bg-[#fbfcf8] p-4 font-mono text-sm leading-relaxed text-[#0f140f] placeholder-slate-400 focus:border-[#0f140f] focus:bg-white focus:outline-none"
              />

              {draft?.reviewNote && (
                <div className="mt-4 rounded-2xl border border-[#f07153]/30 bg-[#fef2ee] p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#c2410c]">
                    <AlertTriangle size={14} />
                    <span>Reviewer Note:</span>
                  </div>
                  <p className="mt-1 text-xs text-[#9a3412] leading-relaxed">{draft.reviewNote}</p>
                </div>
              )}
            </div>

            {/* Human-in-the-Loop Safeguard Notice */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#212a22] bg-[#0f140f] p-4 text-xs text-white shadow-xs">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#d4ff32] text-[#0f140f]">
                <ShieldCheck size={18} />
              </div>
              <p className="text-slate-200">
                <strong className="text-white">Polished before Published:</strong> BrandCheck AI suggests and highlights brand guideline deviations.
                You retain complete control to accept, edit, or dismiss each recommendation before publishing.
              </p>
            </div>
          </div>

          {/* Right Column: Brand Check Compliance Studio (5 Cols) */}
          <div className="space-y-4 lg:col-span-5">
            {/* Compliance Score Card */}
            <div className="rounded-3xl border border-[#e4e8dc] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f140f]">Brand Compliance Score</h3>
                  <p className="text-xs text-slate-500">Evaluated against approved workspace guidelines</p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-3xl font-extrabold ${
                      (draft?.complianceScore ?? 100) >= 85
                        ? 'text-[#0f140f]'
                        : (draft?.complianceScore ?? 100) >= 60
                        ? 'text-amber-600'
                        : 'text-[#f07153]'
                    }`}
                  >
                    {draft?.complianceScore !== null && draft?.complianceScore !== undefined
                      ? `${draft.complianceScore}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-[#eef5ee]">
                <div
                  className={`h-full transition-all duration-500 ${
                    (draft?.complianceScore ?? 100) >= 85
                      ? 'bg-[#d4ff32]'
                      : (draft?.complianceScore ?? 100) >= 60
                      ? 'bg-amber-500'
                      : 'bg-[#f07153]'
                  }`}
                  style={{ width: `${draft?.complianceScore ?? 0}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#e4e8dc] pt-3 text-xs">
                <span className="font-semibold text-slate-500">
                  {pendingSuggestions.length} pending finding{pendingSuggestions.length !== 1 ? 's' : ''}
                </span>
                <span className="font-bold text-[#1c3822]">
                  {acceptedSuggestions.length} accepted
                </span>
              </div>
            </div>

            {/* Suggestions & Violations Stream */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Guideline Findings &amp; Corrections
              </h3>

              {isNew ? (
                <div className="rounded-3xl border border-dashed border-[#e4e8dc] bg-white p-8 text-center">
                  <p className="text-xs text-slate-500">Save draft and click "Run Brand Check" to view findings.</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#d8e6db] bg-[#eef5ee] p-8 text-center">
                  <CheckCircle2 size={32} className="mx-auto text-[#1c3822]" />
                  <h4 className="mt-2 text-sm font-bold text-[#1c3822]">Clean Brand Report</h4>
                  <p className="mt-1 text-xs text-[#2d5034]">
                    No active brand violations detected. Click "Run Brand Check" to re-scan.
                  </p>
                </div>
              ) : (
                suggestions.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-2xl border p-4 shadow-xs transition ${
                      s.status === 'ACCEPTED'
                        ? 'border-[#d8e6db] bg-[#eef5ee] opacity-80'
                        : s.status === 'DISMISSED'
                        ? 'border-slate-200 bg-slate-50 opacity-50'
                        : s.severity === 'ERROR'
                        ? 'border-[#f07153]/30 bg-[#fef2ee]'
                        : 'border-amber-200 bg-amber-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            s.severity === 'ERROR'
                              ? 'border border-[#f07153]/40 bg-[#0f140f] text-[#f07153]'
                              : s.severity === 'WARNING'
                              ? 'border border-amber-300 bg-amber-100 text-amber-900'
                              : 'border border-[#d8e6db] bg-[#eef5ee] text-[#1c3822]'
                          }`}
                        >
                          {s.severity}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700">
                          {s.category}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {s.status}
                      </span>
                    </div>

                    {/* Flagged and Suggested Text */}
                    <div className="mt-2.5 space-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">FLAGGED COPY:</span>
                        <p className="mt-0.5 rounded-lg border border-[#f07153]/30 bg-white px-2 py-1 font-mono text-[#c2410c] line-through">
                          "{s.originalText}"
                        </p>
                      </div>

                      {s.suggestedText && (
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">RECOMMENDED FIX:</span>
                          <p className="mt-0.5 rounded-lg border border-[#d8e6db] bg-white px-2 py-1 font-mono text-[#1c3822] font-semibold">
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
                          className="inline-flex items-center gap-1 rounded-lg border border-[#e4e8dc] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-[#fbfcf8]"
                        >
                          <X size={12} />
                          <span>Dismiss</span>
                        </button>

                        <button
                          onClick={() => handleSuggestionAction(s.id, 'ACCEPT')}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#0f140f] px-3 py-1 text-[11px] font-bold text-[#d4ff32] shadow-xs hover:bg-[#1a231b]"
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f140f]/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#e4e8dc] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-extrabold text-[#0f140f]">Formal Review Decision</h3>
            <p className="mt-1 text-xs text-slate-500">
              Record approval or request revisions with structured feedback.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#0f140f]">Decision</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('APPROVED')}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                      reviewDecision === 'APPROVED'
                        ? 'border-[#1c3822] bg-[#eef5ee] text-[#1c3822]'
                        : 'border-[#e4e8dc] text-slate-600 hover:bg-[#fbfcf8]'
                    }`}
                  >
                    ✓ Approve Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('CHANGES_REQUESTED')}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                      reviewDecision === 'CHANGES_REQUESTED'
                        ? 'border-[#f07153] bg-[#fef2ee] text-[#c2410c]'
                        : 'border-[#e4e8dc] text-slate-600 hover:bg-[#fbfcf8]'
                    }`}
                  >
                    ⚠ Request Changes
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0f140f]">Reviewer Note / Feedback</label>
                <textarea
                  rows={4}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Provide guidance on required edits or approval confirmation..."
                  className="mt-1.5 w-full rounded-xl border border-[#e4e8dc] bg-[#fbfcf8] p-2.5 text-xs text-[#0f140f] focus:border-[#0f140f] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-xl border border-[#e4e8dc] px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-[#fbfcf8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewDecisionSubmit}
                className="rounded-xl bg-[#0f140f] px-4 py-1.5 text-xs font-bold text-[#d4ff32] shadow-xs hover:bg-[#1a231b]"
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
