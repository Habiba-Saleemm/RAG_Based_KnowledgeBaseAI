"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AdminUserFormProps {
  userId?: number;
}

export default function AdminUserForm({ userId }: AdminUserFormProps) {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    role: "user",
    can_upload_documents: false,
    can_use_ai_chat: true,
    can_manage_faqs: false,
  });

  const [loading, setLoading] = useState(userId !== undefined);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const router = useRouter();

  const isEdit = userId !== undefined;
  const isSelf = isEdit && userId === currentUserId;

  // Fetch the currently logged-in user
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/me`, {
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok && data.user) {
          setCurrentUserId(data.user.id);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    }

    fetchMe();
  }, []);

  // Fetch user when editing
  useEffect(() => {
    if (userId === undefined) return;

    async function fetchUser() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
          credentials: "include",
        });

        const data = await res.json();

        const user = data.users.find((u: any) => u.id === userId);

        if (user) {
          setFormState({
            name: user.name,
            email: user.email,
            role: user.role,
            can_upload_documents: user.can_upload_documents,
            can_use_ai_chat: user.can_use_ai_chat,
            can_manage_faqs: user.can_manage_faqs,
          });
        } else {
          console.error("No user found with id", userId, data);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  // Form validation
  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();

    setFieldErrors({});
    setFormError("");

    const errors: Record<string, string> = {};

    // Name validation
    if (!formState.name.trim()) {
      errors.name = "Name cannot be empty";
    }

    // Email validation
    if (!formState.email.trim()) {
      errors.email = "Email cannot be empty";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(formState.email.trim())) {
        errors.email = "Please enter a valid email address";
      }
    }

    // If there are validation errors, show them under the fields
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (isEdit) {
      // Editing an existing user — confirm before saving.
      setShowConfirm(true);
      return;
    }

    // Creating a new user — save directly.
    saveUser();
  }

  async function saveUser() {
    const url = isEdit
      ? `${API_BASE_URL}/api/admin/users/${userId}`
      : `${API_BASE_URL}/api/admin/users`;

    const method = isEdit ? "PUT" : "POST";

    setSaving(true);
    setFieldErrors({});
    setFormError("");

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formState),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        router.push("/admin/users");
        return;
      }

      // Backend returns:
      // { success: false, errors: { field: "message" } }
      // or:
      // { detail: "message" }

      if (data?.errors) {
        setFieldErrors(data.errors);
        setShowConfirm(false);
      } else {
        setFormError(
          data?.detail || "Something went wrong. Please try again."
        );
        setShowConfirm(false);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setFormError("Could not connect to server.");
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl bg-white p-8 shadow-2xl text-gray-600">
            Loading...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-8">
      <div className="mx-auto max-w-xl">
        <form
          onSubmit={handleFormSubmit}
          noValidate
          className="rounded-3xl bg-white p-8 shadow-2xl space-y-6"
        >
          {/* Heading */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {userId === undefined ? "Add New User" : "Edit User"}
            </h1>

            <p className="mt-2 text-gray-500">
              {userId === undefined
                ? "Create a new account and set their feature access."
                : "Update this user's details and permissions."}
            </p>
          </div>

          {/* General Form Error */}
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* General Backend Error */}
          {fieldErrors.general && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {fieldErrors.general}
            </div>
          )}

          {/* Name and Email */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Name
              </label>

              <input
                type="text"
                value={formState.name}
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }));

                  setFieldErrors((prev) => ({
                    ...prev,
                    name: "",
                  }));
                }}
                className={`mt-1 w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-gray-800 outline-none transition focus:bg-white focus:ring-2 ${
                  fieldErrors.name
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              />

              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Email
              </label>

              <input
                type="email"
                value={formState.email}
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }));

                  setFieldErrors((prev) => ({
                    ...prev,
                    email: "",
                  }));
                }}
                className={`mt-1 w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-gray-800 outline-none transition focus:bg-white focus:ring-2 ${
                  fieldErrors.email
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              />

              {fieldErrors.email && (
                <p className="mt-1 whitespace-pre-line text-sm text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Role
              </label>

              <select
                value={formState.role}
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }));

                  setFieldErrors((prev) => ({
                    ...prev,
                    role: "",
                  }));
                }}
                disabled={isSelf}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              {isSelf && (
                <p className="mt-1 text-xs text-gray-500">
                  You cannot change your own role.
                </p>
              )}

              {fieldErrors.role && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.role}
                </p>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              Permissions
            </p>

            {/* Upload Documents */}
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formState.can_upload_documents}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    can_upload_documents: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
              />

              Can Upload Documents
            </label>

            {/* AI Chat */}
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formState.can_use_ai_chat}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    can_use_ai_chat: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
              />

              Can Use AI Chat
            </label>

            {/* Manage FAQs */}
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formState.can_manage_faqs}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    can_manage_faqs: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
              />

              Can Manage FAQs
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {userId === undefined ? "Create User" : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/users")}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Save Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Save changes?
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Are you sure you want to update{" "}
                  <span className="font-medium text-gray-700">
                    `{formState.name || "this user"}`
                  </span>
                  `s details and permissions?
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveUser}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}