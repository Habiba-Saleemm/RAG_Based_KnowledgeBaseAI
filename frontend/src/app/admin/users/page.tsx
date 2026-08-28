"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  can_upload_documents: boolean;
  can_use_ai_chat: boolean;
  can_manage_faqs: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users.");
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError("Could not load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const requestDelete = (user: AdminUser) => {
    setDeleteError("");
    setDeleteTarget(user);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/users/${deleteTarget.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setDeleteError(
          data?.errors?.general || data?.detail || "Failed to delete user."
        );
        return;
      }

      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setDeleteError("Could not connect to server.");
    } finally {
      setDeleting(false);
    }
  };

  // HANDLE LOGS FUNCTION
  const handleLogs = async (userId: number) => {
    try {
      setLogsLoading(true);
      setShowLogs(true);
      setUserLogs([]);

      const res = await fetch(
        `${API_BASE_URL}/api/admin/users/${userId}/chat-history`,
        { method: "GET", credentials: "include", cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data?.detail || "Failed to load chat history.");
        setShowLogs(false);
        return;
      }

      const user = users.find((u) => u.id === userId);

      setSelectedUser(user || null);
      setUserLogs(data.chats || []);
    } catch (error) {
      console.error("Error loading logs:", error);
      alert("Something went wrong while loading logs.");
      setShowLogs(false);
    } finally {
      setLogsLoading(false);
    }
  };

  const closeLogs = () => {
    setShowLogs(false);
    setSelectedUser(null);
    setUserLogs([]);
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                User Management
              </h1>

              <p className="mt-2 text-gray-500">
                Create, edit, and delete users, and control their feature access.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/admin/users/add")}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Add User
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            All Users
          </h2>

          {loading && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-700">
              Loading users...
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-600">
              No users found.
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Upload Docs</th>
                    <th className="py-3 pr-4">AI Chat</th>
                    <th className="py-3 pr-4">Manage FAQs</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-800">
                        {user.name}
                      </td>

                      <td className="py-3 pr-4 text-gray-600">
                        {user.email}
                      </td>

                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3 pr-4 text-gray-700">
                        {user.can_upload_documents ? "Yes" : "No"}
                      </td>

                      <td className="py-3 pr-4 text-gray-700">
                        {user.can_use_ai_chat ? "Yes" : "No"}
                      </td>

                      <td className="py-3 pr-4 text-gray-700">
                        {user.can_manage_faqs ? "Yes" : "No"}
                      </td>

                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          {/* LOGS BUTTON */}
                          <button
                            onClick={() => handleLogs(user.id)}
                            type="button"
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Logs
                          </button>

                          {/* EDIT BUTTON */}
                          <button
                            onClick={() =>
                              router.push(`/admin/users/edit/${user.id}`)
                            }
                            type="button"
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          {/* DELETE BUTTON */}
                          <button
                            onClick={() => requestDelete(user)}
                            type="button"
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Chat Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Chat Logs
                </h2>

                {selectedUser && (
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedUser.name} — {selectedUser.email}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeLogs}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            {/* Logs */}
            <div className="max-h-125 overflow-y-auto p-6">
              {logsLoading && (
                <div className="rounded-xl bg-blue-50 p-4 text-center text-blue-700">
                  Loading logs...
                </div>
              )}

              {!logsLoading && userLogs.length === 0 && (
                <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
                  This user has no AI chat history.
                </div>
              )}

              {!logsLoading && userLogs.length > 0 && (
                <div className="space-y-4">
                  {userLogs.map((chat) => (
                    <div
                      key={chat.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <p className="mb-2 text-sm font-semibold text-blue-700">
                        Q: {chat.question}
                      </p>
                      <p className="text-sm text-gray-700">
                        A: {chat.answer}
                      </p>
                      <p className="mt-3 text-xs text-gray-500">
                        {chat.created_at
                          ? new Date(chat.created_at).toLocaleString("en-PK", {
                              timeZone: "Asia/Karachi",
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "Unknown time"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-200 p-4">
              <button
                type="button"
                onClick={closeLogs}
                className="rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Delete user?
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-gray-700">
                    `{deleteTarget.name}`
                  </span>
                  ? This cannot be undone.
                </p>
                {deleteError && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                    {deleteError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}