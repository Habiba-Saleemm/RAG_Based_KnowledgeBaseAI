"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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


  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
              <p className="mt-2 text-gray-500">
                Create, edit, and delete users, and control their feature access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/admin/users/form")}
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
          <h2 className="mb-4 text-xl font-semibold text-gray-800">All Users</h2>

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
                      <td className="py-3 pr-4 font-medium text-gray-800">{user.name}</td>
                      <td className="py-3 pr-4 text-gray-600">{user.email}</td>
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
                      <td className="py-3 pr-4">{user.can_upload_documents ? "Yes" : "No"}</td>
                      <td className="py-3 pr-4">{user.can_use_ai_chat ? "Yes" : "No"}</td>
                      <td className="py-3 pr-4">{user.can_manage_faqs ? "Yes" : "No"}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/admin/users/form/${user.id}`)}
                            type="button"
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          <button
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
    </main>
  );
}