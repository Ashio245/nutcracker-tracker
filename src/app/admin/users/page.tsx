"use client";

import { useEffect, useState } from "react";
import { getUsers, updateUserRole, inviteUser } from "./actions";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const result = await getUsers();
    if (result.error) {
      setError(result.error);
    } else if (result.users) {
      setUsers(result.users);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    const result = await updateUserRole(userId, newRole);
    if (result.error) {
      alert("Failed to update role: " + result.error);
    } else {
      await fetchUsers(); // Refresh the list
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteStatus("Inviting...");
    const result = await inviteUser(inviteEmail, inviteRole);
    if (result.error) {
      setInviteStatus(result.error);
    } else {
      setInviteStatus(result.success || "Invited!");
      setInviteEmail("");
      await fetchUsers();
      // We don't auto-close anymore so the admin has time to copy the temporary password
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="pb-4 border-b border-[var(--panel-border)] flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-main">Team Management</h1>
            <p className="text-sm text-muted mt-1">Manage who has access to the admin tools.</p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="mac-button-primary w-8 h-8 flex items-center justify-center rounded-full text-lg leading-none"
            title="Invite User"
          >
            {showInviteForm ? "×" : "+"}
          </button>
        </header>

        {showInviteForm && (
          <div className="mac-card p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-main mb-4">Invite New User</h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-muted mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="mac-input w-full"
                  required
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="block text-xs font-semibold text-muted mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                  className="mac-input w-full bg-[var(--input-bg)] appearance-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={inviteStatus === "Inviting..."}
                className="mac-button-primary py-2.5 px-6 whitespace-nowrap w-full sm:w-auto"
              >
                Send Invite
              </button>
            </form>
            {inviteStatus && (
              <p className={`mt-3 text-sm font-semibold ${inviteStatus.includes("Error") || inviteStatus.includes("Failed") || inviteStatus.includes("Invalid") ? "text-red-500" : "text-green-500"}`}>
                {inviteStatus}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mac-card p-4 border-l-4 border-red-500">
            <p className="text-sm text-red-500 font-semibold">{error}</p>
            {error.includes("SUPABASE_SERVICE_ROLE_KEY") && (
              <p className="text-xs text-muted mt-2">
                To use this page, you must add <code>SUPABASE_SERVICE_ROLE_KEY</code> to your `.env.local` file. 
                You can find this key in your Supabase Dashboard under Project Settings &gt; API.
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="mac-card p-6 flex justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-[var(--accent-color)] border-t-transparent rounded-full" />
          </div>
        ) : users.length > 0 ? (
          <div className="mac-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--hover-bg)] border-b border-[var(--panel-border)]">
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider">Email</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider">Created</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border-inner)]">
                {users.map((u) => {
                  const role = u.user_metadata?.role || "member";
                  return (
                    <tr key={u.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                      <td className="p-4 text-sm font-medium text-main">{u.email}</td>
                      <td className="p-4 text-sm text-muted">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          role === "admin" 
                            ? "bg-[var(--group-sales-bg)] text-[var(--group-sales)] border border-[var(--group-sales-border)]"
                            : "bg-[var(--upcoming-bg)] text-[var(--upcoming)] border border-[var(--upcoming-border)]"
                        }`}>
                          {role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRoleChange(u.id, role)}
                          className="text-xs font-semibold text-[var(--accent-color)] hover:text-[var(--accent-hover)] transition-colors"
                        >
                          Make {role === "admin" ? "Member" : "Admin"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
