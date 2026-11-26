import { useEffect, useState, useRef } from 'react';
import {
  BookOpen,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Ban,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Search,
  Sparkles,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const KNOWLEDGE_TYPES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'RULE', label: 'Editorial Rules' },
  { value: 'TONE', label: 'Tone of Voice' },
  { value: 'TERM_APPROVED', label: 'Approved Terms' },
  { value: 'TERM_BANNED', label: 'Banned Words' },
  { value: 'FACT', label: 'Company Facts' },
  { value: 'CLAIM', label: 'Certified Claims' },
  { value: 'VISUAL', label: 'Visual & Assets' },
  { value: 'ACCESSIBILITY', label: 'Accessibility' },
  { value: 'DISCLOSURE', label: 'Legal Disclosures' },
];

const TYPE_STYLES = {
  RULE: 'border-[#d8e6db] bg-[#eef5ee] text-[#1c3822]',
  TONE: 'border-[#d4ff32]/60 bg-[#0f140f] text-[#d4ff32]',
  TERM_APPROVED: 'border-[#d8e6db] bg-[#eef5ee] text-[#1c3822]',
  TERM_BANNED: 'border-[#f07153]/40 bg-[#fef2ee] text-[#c2410c]',
  FACT: 'border-slate-200 bg-slate-100 text-slate-800',
  CLAIM: 'border-amber-300 bg-amber-50 text-amber-900',
  VISUAL: 'border-[#212a22] bg-[#0f140f] text-white',
  ACCESSIBILITY: 'border-[#d8e6db] bg-[#eef5ee] text-[#1c3822]',
  DISCLOSURE: 'border-slate-200 bg-slate-100 text-slate-700',
};

export default function KnowledgeBasePage() {
  const { user, currentWorkspace } = useAuth();
  const isAdmin = (currentWorkspace?.role || user?.role) === 'ADMIN';

  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'documents'
  const [items, setItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState(isAdmin ? 'ALL' : 'APPROVED');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalForm, setModalForm] = useState({
    type: 'RULE',
    title: '',
    body: '',
    status: 'APPROVED',
    evidenceUrl: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedType !== 'ALL') params.type = selectedType;
      if (isAdmin && selectedStatus !== 'ALL') params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const itemsRes = await api.get('/knowledge', { params });
      setItems(itemsRes.data?.data?.items || []);

      if (isAdmin) {
        const docsRes = await api.get('/brand-documents');
        setDocuments(docsRes.data?.data?.documents || []);
      }
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
      toast.error('Failed to load knowledge base items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentWorkspace, selectedType, selectedStatus, searchQuery]);

  // File Upload Handler
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10 MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await api.post('/brand-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const extractedCount = res.data?.data?.itemsCount || 0;
      toast.success(
        `Document uploaded! Extracted ${extractedCount} draft rules for admin review.`
      );
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to upload document';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/knowledge/${id}/approve`);
      toast.success('Knowledge item approved!');
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'APPROVED' } : it))
      );
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to approve item');
    }
  };

  const handleDisable = async (id) => {
    try {
      await api.post(`/knowledge/${id}/disable`);
      toast.success('Rule disabled');
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'DISABLED' } : it))
      );
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to disable item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      await api.delete(`/knowledge/${id}`);
      toast.success('Rule deleted');
      setItems((prev) => prev.filter((it) => it.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete item');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBulkApproving(true);
      const res = await api.post('/knowledge/bulk-approve', {
        itemIds: Array.from(selectedIds),
      });
      toast.success(`Approved ${res.data?.data?.approvedCount || selectedIds.size} items!`);
      setSelectedIds(new Set());
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to bulk approve');
    } finally {
      setBulkApproving(false);
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAllDrafts = () => {
    const draftIds = items.filter((i) => i.status === 'DRAFT').map((i) => i.id);
    if (selectedIds.size === draftIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(draftIds));
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.patch(`/knowledge/${editingItem.id}`, modalForm);
        toast.success('Knowledge item updated');
      } else {
        await api.post('/knowledge', modalForm);
        toast.success('New knowledge item created');
      }
      setShowCreateModal(false);
      setEditingItem(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save item');
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document and all linked rules?')) return;
    try {
      await api.delete(`/brand-documents/${docId}`);
      toast.success('Document deleted');
      await fetchData();
    } catch (_err) {
      toast.error('Failed to delete document');
    }
  };

  const draftCount = items.filter((i) => i.status === 'DRAFT').length;
  const approvedCount = items.filter((i) => i.status === 'APPROVED').length;

  return (
    <div className="space-y-8 pb-16">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-[#d8e6db] bg-[#eef5ee] px-2.5 py-0.5 text-xs font-bold text-[#1c3822]">
              Brand Governance
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0f140f] sm:text-3xl">
            Brand Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isAdmin
              ? 'Upload brand style guides, approved claims, and editorial rules. AI extracts drafts for human approval.'
              : 'Official verified brand guidelines, terminology standards, and approved claims for creators and reviewers.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingItem(null);
                setModalForm({
                  type: 'RULE',
                  title: '',
                  body: '',
                  status: 'APPROVED',
                  evidenceUrl: '',
                });
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e4e8dc] bg-white px-4 py-2.5 text-xs font-bold text-[#0f140f] shadow-xs transition hover:bg-[#fbfcf8] focus:outline-none"
            >
              <Plus size={16} />
              <span>Add Rule Manually</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('documents');
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4ff32] px-4 py-2.5 text-xs font-bold text-[#0f140f] shadow-xs transition hover:bg-[#bfe818] focus:outline-none active:scale-[0.98]"
            >
              <Upload size={16} />
              <span>Upload Document</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards (Admin only) */}
      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#e4e8dc] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Rules &amp; Facts</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0f140f] text-[#d4ff32]">
                <BookOpen size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#0f140f]">{items.length}</p>
            <p className="mt-1 text-xs text-slate-400">In this workspace</p>
          </div>

          <div className="rounded-3xl border border-[#e4e8dc] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Review</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fef2ee] text-[#f07153]">
                <Clock size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#f07153]">{draftCount}</p>
            <p className="mt-1 text-xs text-slate-400">Needs human approval</p>
          </div>

          <div className="rounded-3xl border border-[#e4e8dc] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live &amp; Approved</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#eef5ee] text-[#1c3822]">
                <CheckCircle2 size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#1c3822]">{approvedCount}</p>
            <p className="mt-1 text-xs text-slate-400">Active for creators</p>
          </div>

          <div className="rounded-3xl border border-[#e4e8dc] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Source Documents</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0f140f] text-[#d4ff32]">
                <FileText size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#0f140f]">{documents.length}</p>
            <p className="mt-1 text-xs text-slate-400">PDF, DOCX, PPTX</p>
          </div>
        </div>
      )}

      {/* Tabs (Admin only) */}
      {isAdmin && (
        <div className="flex border-b border-[#e4e8dc]">
          <button
            onClick={() => setActiveTab('rules')}
            className={`border-b-2 px-5 py-3 text-sm font-bold transition ${
              activeTab === 'rules'
                ? 'border-[#0f140f] text-[#0f140f]'
                : 'border-transparent text-slate-500 hover:text-[#0f140f]'
            }`}
          >
            Guidelines &amp; Rules ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
              activeTab === 'documents'
                ? 'border-[#0f140f] text-[#0f140f]'
                : 'border-transparent text-slate-500 hover:text-[#0f140f]'
            }`}
          >
            <span>Uploaded Documents ({documents.length})</span>
            {uploading && (
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[#d4ff32]" />
            )}
          </button>
        </div>
      )}

      {/* TAB 1: GUIDELINES & RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 rounded-3xl border border-[#e4e8dc] bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative min-w-[240px] flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search rules, banned words, or claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#e4e8dc] bg-[#fbfcf8] py-2 pl-9 pr-4 text-xs text-[#0f140f] placeholder-slate-400 outline-none transition focus:border-[#0f140f] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="rounded-xl border border-[#e4e8dc] bg-white px-3 py-2 text-xs font-semibold text-[#0f140f] outline-none focus:border-[#0f140f]"
                >
                  {KNOWLEDGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter (Admin only) */}
              {isAdmin && (
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-[#e4e8dc] bg-white px-3 py-2 text-xs font-semibold text-[#0f140f] outline-none focus:border-[#0f140f]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Pending Approval (DRAFT)</option>
                  <option value="APPROVED">Live (APPROVED)</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              )}
            </div>
          </div>

          {/* Bulk Selection Bar (Admin only) */}
          {isAdmin && draftCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600" />
                <span>
                  <strong>{draftCount} AI-extracted items</strong> are waiting for human review.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllDrafts}
                  className="rounded-xl border border-amber-300 bg-white px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100/50"
                >
                  {selectedIds.size === draftCount ? 'Deselect All' : 'Select All Drafts'}
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkApprove}
                    disabled={bulkApproving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f140f] px-3.5 py-1 font-bold text-[#d4ff32] shadow-xs hover:bg-[#1a231b] disabled:opacity-50"
                  >
                    <Check size={14} />
                    <span>Approve Selected ({selectedIds.size})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Items Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-xs text-slate-400">
              Loading brand knowledge base...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#e4e8dc] bg-white p-12 text-center shadow-xs">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#0f140f] text-[#d4ff32]">
                <Sparkles size={24} />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#0f140f]">
                No knowledge items found
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                {isAdmin
                  ? 'Upload a brand guideline PDF/Word doc or click "Add Rule Manually" to create your first brand guideline.'
                  : 'No approved brand guidelines have been published yet by your workspace administrator.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`relative flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-xs transition hover:border-[#0f140f] hover:shadow-md ${
                      isSelected
                        ? 'border-[#0f140f] ring-2 ring-[#0f140f]/20'
                        : item.status === 'DRAFT'
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-[#e4e8dc]'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Checkbox + Tags */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {isAdmin && item.status === 'DRAFT' && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(item.id)}
                              className="h-4 w-4 rounded border-slate-300 text-[#0f140f] focus:ring-[#0f140f]"
                            />
                          )}
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${
                              TYPE_STYLES[item.type] || 'border-slate-200 bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.status === 'APPROVED'
                              ? 'border border-[#d8e6db] bg-[#eef5ee] text-[#1c3822]'
                              : item.status === 'DRAFT'
                              ? 'border border-amber-300 bg-amber-100 text-amber-900'
                              : 'border border-slate-200 bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.status === 'APPROVED' ? (
                            <CheckCircle2 size={11} />
                          ) : item.status === 'DRAFT' ? (
                            <Clock size={11} />
                          ) : (
                            <Ban size={11} />
                          )}
                          {item.status}
                        </span>
                      </div>

                      {/* Title & Body */}
                      <h3 className="mt-3 text-sm font-extrabold text-[#0f140f] leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {item.body}
                      </p>

                      {/* Source Quote / Citation (If extracted) */}
                      {item.sourceQuote && (
                        <div className="mt-3 rounded-xl border border-[#e4e8dc] bg-[#fbfcf8] p-2.5 text-[11px] text-slate-600 italic">
                          <p className="line-clamp-3">"{item.sourceQuote}"</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-slate-500 not-italic">
                            <span>
                              {item.document?.fileName || 'Source doc'}
                              {item.sourcePage ? ` (Page ${item.sourcePage})` : ''}
                            </span>
                            {item.confidence && (
                              <span className="text-[#1c3822]">
                                {Math.round(item.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Admin Actions Footer */}
                    {isAdmin && (
                      <div className="mt-4 flex items-center justify-between border-t border-[#e4e8dc] pt-3">
                        <div className="flex items-center gap-1">
                          {item.status === 'DRAFT' && (
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-[#0f140f] px-3 py-1 text-xs font-bold text-[#d4ff32] shadow-xs hover:bg-[#1a231b]"
                              title="Approve and publish to creators"
                            >
                              <Check size={13} />
                              <span>Approve</span>
                            </button>
                          )}
                          {item.status === 'APPROVED' && (
                            <button
                              onClick={() => handleDisable(item.id)}
                              className="rounded-xl border border-[#e4e8dc] px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-[#fbfcf8]"
                              title="Disable this rule"
                            >
                              Disable
                            </button>
                          )}
                          {item.status === 'DISABLED' && (
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="rounded-xl border border-[#d8e6db] bg-[#eef5ee] px-2.5 py-1 text-xs font-bold text-[#1c3822] hover:bg-[#d8e6db]"
                              title="Re-enable rule"
                            >
                              Re-enable
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setModalForm({
                                type: item.type,
                                title: item.title,
                                body: item.body,
                                status: item.status,
                                evidenceUrl: item.evidenceUrl || '',
                              });
                              setShowCreateModal(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                            title="Edit rule"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete rule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UPLOADED DOCUMENTS (ADMIN ONLY) */}
      {isAdmin && activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.pptx,.txt,.md"
            onChange={(e) => handleFileUpload(e.target.files[0])}
            className="hidden"
          />

          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition ${
              dragActive
                ? 'border-[#0f140f] bg-[#eef5ee]'
                : 'border-[#e4e8dc] bg-white hover:border-[#0f140f] hover:bg-[#fbfcf8]'
            }`}
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#0f140f] text-[#d4ff32] shadow-xs">
              <Upload size={24} />
            </div>
            <p className="mt-3 text-sm font-bold text-[#0f140f]">
              Click to upload or drag &amp; drop brand files
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Supports PDF, DOCX, PPTX, or TXT up to 10 MB
            </p>
            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#0f140f]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0f140f] border-t-[#d4ff32]" />
                <span>Extracting guidelines with AI... This takes a few seconds.</span>
              </div>
            )}
          </div>

          {/* Documents Table */}
          <div className="overflow-hidden rounded-3xl border border-[#e4e8dc] bg-white shadow-xs">
            <div className="border-b border-[#e4e8dc] bg-[#fbfcf8] px-6 py-4">
              <h3 className="text-sm font-bold text-[#0f140f]">
                Workspace Documents ({documents.length})
              </h3>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No documents uploaded yet. Upload your first brand guide above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#fbfcf8] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-bold">File Name</th>
                      <th className="px-6 py-3 font-bold">Size</th>
                      <th className="px-6 py-3 font-bold">Status</th>
                      <th className="px-6 py-3 font-bold">Extracted Rules</th>
                      <th className="px-6 py-3 font-bold">Uploaded</th>
                      <th className="px-6 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#fbfcf8]">
                        <td className="px-6 py-3.5 font-bold text-[#0f140f]">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-[#0f140f]" />
                            <span>{doc.fileName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {Math.round(doc.sizeBytes / 1024)} KB
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              doc.status === 'EXTRACTED'
                                ? 'border border-[#d8e6db] bg-[#eef5ee] text-[#1c3822]'
                                : doc.status === 'EXTRACTING'
                                ? 'border border-amber-300 bg-amber-100 text-amber-900'
                                : 'border border-rose-200 bg-rose-50 text-rose-800'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-extrabold text-[#0f140f]">
                          {doc._count?.knowledgeItems || 0}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete document"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f140f]/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#e4e8dc] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e4e8dc] pb-3">
              <h3 className="text-base font-extrabold text-[#0f140f]">
                {editingItem ? 'Edit Knowledge Item' : 'Add Brand Rule Manually'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#0f140f]">Category</label>
                <select
                  value={modalForm.type}
                  onChange={(e) => setModalForm({ ...modalForm, type: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#e4e8dc] bg-white px-3 py-2 text-xs font-semibold text-[#0f140f] outline-none focus:border-[#0f140f]"
                >
                  {KNOWLEDGE_TYPES.filter((t) => t.value !== 'ALL').map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0f140f]">Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tone: Empathetic & Direct"
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#e4e8dc] bg-white px-3 py-2 text-xs text-[#0f140f] outline-none focus:border-[#0f140f]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0f140f]">
                  Requirement / Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain the brand standard, prohibited terms, or certified facts clearly."
                  value={modalForm.body}
                  onChange={(e) => setModalForm({ ...modalForm, body: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#e4e8dc] bg-white px-3 py-2 text-xs text-[#0f140f] outline-none focus:border-[#0f140f]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0f140f]">
                  Evidence URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={modalForm.evidenceUrl}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, evidenceUrl: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#e4e8dc] bg-white px-3 py-2 text-xs text-[#0f140f] outline-none focus:border-[#0f140f]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#e4e8dc] pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-[#e4e8dc] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#fbfcf8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#d4ff32] px-4 py-2 text-xs font-bold text-[#0f140f] shadow-xs hover:bg-[#bfe818]"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
