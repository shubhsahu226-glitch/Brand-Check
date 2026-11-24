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
  Download,
  AlertCircle,
  FileCheck,
  Check,
  X,
  ExternalLink,
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
  RULE: 'bg-blue-50 text-blue-700 border-blue-200',
  TONE: 'bg-purple-50 text-purple-700 border-purple-200',
  TERM_APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TERM_BANNED: 'bg-rose-50 text-rose-700 border-rose-200',
  FACT: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  CLAIM: 'bg-amber-50 text-amber-700 border-amber-200',
  VISUAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ACCESSIBILITY: 'bg-teal-50 text-teal-700 border-teal-200',
  DISCLOSURE: 'bg-slate-100 text-slate-700 border-slate-200',
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
      // Fetch knowledge items
      const params = {};
      if (selectedType !== 'ALL') params.type = selectedType;
      if (isAdmin && selectedStatus !== 'ALL') params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const itemsRes = await api.get('/knowledge', { params });
      setItems(itemsRes.data?.data?.items || []);

      // If admin, also fetch documents
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

    // Validate size (10MB)
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

  // Drag and Drop handlers
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

  // Single Approve
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

  // Single Disable
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

  // Single Delete
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

  // Bulk Approve
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

  // Toggle selection
  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Select all drafts
  const handleSelectAllDrafts = () => {
    const draftIds = items.filter((i) => i.status === 'DRAFT').map((i) => i.id);
    if (selectedIds.size === draftIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(draftIds));
    }
  };

  // Save manual or edited item
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

  // Document Delete
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
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <BookOpen size={16} />
            <span>Brand Governance</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Brand Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-slate-500">
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none"
            >
              <Plus size={16} className="text-indigo-600" />
              <span>Add Rule Manually</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('documents');
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Rules & Facts</span>
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <BookOpen size={18} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{items.length}</p>
            <p className="mt-1 text-xs text-slate-400">In this workspace</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Review</span>
              <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Clock size={18} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">{draftCount}</p>
            <p className="mt-1 text-xs text-slate-400">Needs human approval</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Live & Approved</span>
              <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <CheckCircle2 size={18} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{approvedCount}</p>
            <p className="mt-1 text-xs text-slate-400">Active for creators</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Source Documents</span>
              <span className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <FileText size={18} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-purple-600">{documents.length}</p>
            <p className="mt-1 text-xs text-slate-400">PDF, DOCX, PPTX</p>
          </div>
        </div>
      )}

      {/* Tabs (Admin only) */}
      {isAdmin && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('rules')}
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'rules'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Guidelines & Rules ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'documents'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Uploaded Documents ({documents.length})</span>
            {uploading && (
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-indigo-600" />
            )}
          </button>
        </div>
      )}

      {/* TAB 1: GUIDELINES & RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
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
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
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
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600" />
                <span>
                  <strong>{draftCount} AI-extracted items</strong> are waiting for human review.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllDrafts}
                  className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100/50"
                >
                  {selectedIds.size === draftCount ? 'Deselect All' : 'Select All Drafts'}
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkApprove}
                    disabled={bulkApproving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
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
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Sparkles size={24} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                No knowledge items found
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
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
                    className={`relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : item.status === 'DRAFT'
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-200'
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
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          )}
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
                              TYPE_STYLES[item.type] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'DRAFT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
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
                      <h3 className="mt-3 text-sm font-semibold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {item.body}
                      </p>

                      {/* Source Quote / Citation (If extracted) */}
                      {item.sourceQuote && (
                        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 text-[11px] text-slate-500 italic">
                          <p className="line-clamp-3">"{item.sourceQuote}"</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-slate-400 not-italic">
                            <span>
                              {item.document?.fileName || 'Source doc'}
                              {item.sourcePage ? ` (Page ${item.sourcePage})` : ''}
                            </span>
                            {item.confidence && (
                              <span className="text-indigo-600">
                                {Math.round(item.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Admin Actions Footer */}
                    {isAdmin && (
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1">
                          {item.status === 'DRAFT' && (
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                              title="Approve and publish to creators"
                            >
                              <Check size={13} />
                              <span>Approve</span>
                            </button>
                          )}
                          {item.status === 'APPROVED' && (
                            <button
                              onClick={() => handleDisable(item.id)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              title="Disable this rule"
                            >
                              Disable
                            </button>
                          )}
                          {item.status === 'DISABLED' && (
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
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
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50/50'
                : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/50'
            }`}
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Upload size={24} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              Click to upload or drag & drop brand files
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Supports PDF, DOCX, PPTX, or TXT up to 10 MB
            </p>
            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <span>Extracting guidelines with AI... This takes a few seconds.</span>
              </div>
            )}
          </div>

          {/* Documents Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Workspace Documents ({documents.length})
              </h3>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No documents uploaded yet. Upload your first brand guide above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-3">File Name</th>
                      <th className="px-6 py-3">Size</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Extracted Rules</th>
                      <th className="px-6 py-3">Uploaded</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-indigo-600" />
                            <span>{doc.fileName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-400">
                          {Math.round(doc.sizeBytes / 1024)} KB
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              doc.status === 'EXTRACTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.status === 'EXTRACTING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-700">
                          {doc._count?.knowledgeItems || 0}
                        </td>
                        <td className="px-6 py-3.5 text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
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
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={modalForm.type}
                  onChange={(e) => setModalForm({ ...modalForm, type: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                >
                  {KNOWLEDGE_TYPES.filter((t) => t.value !== 'ALL').map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tone: Empathetic & Direct"
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Requirement / Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain the brand standard, prohibited terms, or certified facts clearly."
                  value={modalForm.body}
                  onChange={(e) => setModalForm({ ...modalForm, body: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Evidence URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={modalForm.evidenceUrl}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, evidenceUrl: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
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
