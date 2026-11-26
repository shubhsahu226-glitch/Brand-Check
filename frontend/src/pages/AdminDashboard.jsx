import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Shield,
  Clock,
  Sparkles,
  BookOpen,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function AdminDashboard() {
  const { user, currentWorkspace } = useAuth();
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workspaces/members');
      const membersList =
        res.data?.data?.members || (Array.isArray(res.data) ? res.data : []);
      setMembers(membersList);

      // Fetch pending invitations
      try {
        const invRes = await api.get('/invitations');
        const invData = invRes.data?.data || invRes.data;
        if (Array.isArray(invData)) {
          setPendingInvitations(invData);
        } else if (res.data?.data?.pendingInvitations) {
          setPendingInvitations(res.data.data.pendingInvitations);
        }
      } catch (_e) {
        if (res.data?.data?.pendingInvitations) {
          setPendingInvitations(res.data.data.pendingInvitations);
        }
      }
    } catch (error) {
      console.error('Failed to load workspace members:', error);
      toast.error('Failed to load workspace members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentWorkspace]);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      setUpdatingId(memberId);
      await api.patch(`/workspaces/members/${memberId}/role`, {
        role: newRole,
      });
      toast.success(`Role updated to ${newRole}`);
      await fetchMembers();
    } catch (error) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to update member role';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Workspace & User Header */}
      <div className="rounded-3xl border border-[#e4e8dc] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4ff32]/40 bg-[#0f140f] px-3 py-1 text-xs font-bold text-[#d4ff32]">
                <Shield size={13} />
                ADMIN
              </span>
              <span className="text-xs font-medium text-slate-500">
                Workspace:{' '}
                <strong className="text-[#0f140f]">
                  {currentWorkspace?.name}
                </strong>
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0f140f] sm:text-3xl">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your workspace members, permissions, and brand standards.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NavLink
              to="/invite"
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4ff32] px-4 py-2.5 text-sm font-bold text-[#0f140f] shadow-xs transition hover:bg-[#bfe818] active:scale-[0.98]"
            >
              <UserPlus size={16} />
              Invite Member
            </NavLink>
            <button
              onClick={fetchMembers}
              disabled={loading}
              title="Refresh members"
              className="rounded-xl border border-[#e4e8dc] p-2.5 text-[#0f140f] transition hover:bg-[#eef5ee]"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Workspace Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e4e8dc] bg-[#fbfcf8] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Members</p>
            <p className="mt-1.5 text-2xl font-extrabold text-[#0f140f]">
              {members.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e4e8dc] bg-[#fbfcf8] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Invitations
            </p>
            <p className="mt-1.5 text-2xl font-extrabold text-[#0f140f]">
              {pendingInvitations.length}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl border border-[#e4e8dc] bg-[#fbfcf8] p-4 sm:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Permission</p>
            <p className="mt-1.5 text-2xl font-extrabold text-[#0f140f]">
              Full Access
            </p>
          </div>
        </div>
      </div>

      {/* Workspace Members & Invitations Section */}
      <div className="space-y-6 rounded-3xl border border-[#e4e8dc] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0f140f] text-[#d4ff32]">
              <Users size={18} />
            </span>
            <h2 className="text-lg font-bold text-[#0f140f]">
              Workspace Members
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {members.length} member(s)
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0f140f]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-[#fbfcf8] text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-[#fbfcf8]">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0f140f] text-xs font-bold text-[#d4ff32]">
                          {m.user?.name?.slice(0, 2).toUpperCase() || 'U'}
                        </span>
                        <span className="font-semibold text-[#0f140f]">{m.user?.name}</span>
                        {m.user?.id === user?.id && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {m.user?.email}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          m.role === 'ADMIN'
                            ? 'border border-[#d4ff32]/40 bg-[#0f140f] text-[#d4ff32]'
                            : m.role === 'REVIEWER'
                            ? 'border border-[#f07153]/30 bg-[#fef2ee] text-[#c2410c]'
                            : 'border border-[#d8e6db] bg-[#eef5ee] text-[#1c3822]'
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {m.user?.id !== user?.id ? (
                        <select
                          value={m.role}
                          disabled={updatingId === m.id}
                          onChange={(e) =>
                            handleRoleChange(m.id, e.target.value)
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none hover:border-[#0f140f] focus:border-[#0f140f]"
                        >
                          <option value="CREATOR">Creator</option>
                          <option value="REVIEWER">Reviewer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">Owner</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pending Invitations Table */}
        {pendingInvitations.length > 0 && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Clock size={16} className="text-amber-500" />
              Pending Invitations ({pendingInvitations.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-[#fbfcf8] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Invited Email</th>
                    <th className="px-4 py-2.5">Assigned Role</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingInvitations.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">
                        {inv.email}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            inv.role === 'ADMIN'
                              ? 'border border-[#d4ff32]/40 bg-[#0f140f] text-[#d4ff32]'
                              : inv.role === 'REVIEWER'
                              ? 'border border-[#f07153]/30 bg-[#fef2ee] text-[#c2410c]'
                              : 'border border-[#d8e6db] bg-[#eef5ee] text-[#1c3822]'
                          }`}
                        >
                          {inv.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                          PENDING
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Workspace Modules & Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#0f140f]">
          Workspace Modules &amp; Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NavLink
            to="/knowledge-base"
            className="group rounded-3xl border border-[#d8e6db] bg-white p-6 shadow-sm transition hover:border-[#0f140f] hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f140f] text-[#d4ff32] shadow-sm">
                <BookOpen size={20} />
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                Live &amp; Ready
              </span>
            </div>
            <span className="rounded-md border border-[#d8e6db] bg-[#eef5ee] px-2.5 py-0.5 text-[11px] font-bold text-[#1c3822]">
              Brand Knowledge Base
            </span>
            <h3 className="mt-2.5 font-bold text-[#0f140f] group-hover:underline decoration-[#d4ff32] decoration-2 transition">
              Brand Documents &amp; Guidelines &rarr;
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Upload PDF and Word style guides, approved product claims, and voice
              guidelines. Review, edit, and approve AI-extracted brand rules for your workspace.
            </p>
          </NavLink>

          <NavLink
            to="/analytics"
            className="group rounded-3xl border border-[#d8e6db] bg-white p-6 shadow-sm transition hover:border-[#0f140f] hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f140f] text-[#d4ff32] shadow-sm">
                <TrendingUp size={20} />
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                Live &amp; Ready
              </span>
            </div>
            <span className="rounded-md border border-[#d8e6db] bg-[#eef5ee] px-2.5 py-0.5 text-[11px] font-bold text-[#1c3822]">
              Insights &amp; Analytics
            </span>
            <h3 className="mt-2.5 font-bold text-[#0f140f] group-hover:underline decoration-[#d4ff32] decoration-2 transition">
              Audit Logs &amp; Team Metrics &rarr;
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Track content approvals, reviewer turnaround times, compliance health scores, and adherence
              trends across your team.
            </p>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
