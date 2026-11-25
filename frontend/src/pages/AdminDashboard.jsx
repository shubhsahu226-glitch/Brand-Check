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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                <Shield size={13} />
                ADMIN
              </span>
              <span className="text-xs font-medium text-slate-500">
                Workspace:{' '}
                <strong className="text-slate-800">
                  {currentWorkspace?.name}
                </strong>
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your workspace members, permissions, and brand standards.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NavLink
              to="/invite"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <UserPlus size={16} />
              Invite Member
            </NavLink>
            <button
              onClick={fetchMembers}
              disabled={loading}
              title="Refresh members"
              className="rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Workspace Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Active Members</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">
              {members.length}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              Pending Invitations
            </p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">
              {pendingInvitations.length}
            </p>
          </div>
          <div className="col-span-2 rounded-xl bg-slate-50 p-4 sm:col-span-1">
            <p className="text-xs font-medium text-slate-500">Your Permission</p>
            <p className="mt-1.5 text-2xl font-bold text-indigo-600">
              Full Access
            </p>
          </div>
        </div>
      </div>

      {/* Workspace Members & Invitations Section */}
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Workspace Members
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {members.length} member(s)
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
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
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                          {m.user?.name?.slice(0, 2).toUpperCase() || 'U'}
                        </span>
                        <span>{m.user?.name}</span>
                        {m.user?.id === user?.id && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
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
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                          m.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : m.role === 'REVIEWER'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
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
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-indigo-500"
                        >
                          <option value="CREATOR">Creator</option>
                          <option value="REVIEWER">Reviewer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400">Owner</span>
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
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Clock size={16} className="text-amber-500" />
              Pending Invitations ({pendingInvitations.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-slate-400">
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
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        {inv.email}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {inv.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-600">
                          PENDING
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">
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
        <h2 className="text-base font-semibold text-slate-800">
          Workspace Modules & Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NavLink
            to="/knowledge-base"
            className="group rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white p-6 shadow-sm transition hover:border-indigo-400 hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <BookOpen size={20} />
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                Live & Ready
              </span>
            </div>
            <span className="rounded bg-indigo-100/70 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
              Brand Knowledge Base
            </span>
            <h3 className="mt-2.5 font-semibold text-slate-900 group-hover:text-indigo-600 transition">
              Brand Documents & Guidelines &rarr;
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Upload PDF and Word style guides, approved product claims, and voice
              guidelines. Review, edit, and approve AI-extracted brand rules for your workspace.
            </p>
          </NavLink>

          <NavLink
            to="/analytics"
            className="group rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-white p-6 shadow-sm transition hover:border-purple-400 hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-600 text-white shadow-sm">
                <TrendingUp size={20} />
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                Live & Ready
              </span>
            </div>
            <span className="rounded bg-purple-100/70 px-2 py-0.5 text-[11px] font-semibold text-purple-800">
              Insights & Analytics
            </span>
            <h3 className="mt-2.5 font-semibold text-slate-900 group-hover:text-purple-600 transition">
              Audit Logs & Team Metrics &rarr;
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
