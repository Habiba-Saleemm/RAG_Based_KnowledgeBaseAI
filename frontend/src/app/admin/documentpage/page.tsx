"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface DocumentItem {
  id: number;
  filename: string;
  uploaded_at: string | null;
  chunk_count: number;
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<DocumentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
      setError("Could not load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setUploadError("");
      setUploadSuccess("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.detail || data.errors?.general || "Upload failed.");
        return;
      }
      setUploadSuccess(`"${file.name}" uploaded successfully.`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments();
    } catch (err) {
      setUploadError("Could not connect to server.");
    } finally {
      setUploading(false);
    }
  };

  const requestDelete = (doc: DocumentItem) => {
    setConfirmTarget(doc);
  };

  const cancelDelete = () => {
    setConfirmTarget(null);
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    const { id } = confirmTarget;

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError("Failed to delete document.");
        return;
      }
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError("Could not connect to server.");
    } finally {
      setDeletingId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800"> Documents</h1>
              <p className="mt-2 text-gray-500">
                Upload and manage the files your AI assistant answers from.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Upload Section */}
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-gray-800">Upload a document</h2>
          <p className="mt-1 text-sm text-gray-500">
            PDF, Word, Excel, or TXT — max 10MB.
          </p>

          <div className="mt-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.txt"
                onChange={handleFileChange}
                className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
              />
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            {uploadError && <p className="mt-2 text-xs text-red-500">{uploadError}</p>}
            {uploadSuccess && (
              <p className="mt-2 text-xs font-medium text-green-600">{uploadSuccess}</p>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-gray-800">Uploaded documents</h2>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-700">
              Loading documents...
            </div>
          )}

          {!loading && documents.length === 0 && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-600">
              No documents uploaded yet.
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="px-3 py-3">Filename</th>
                    <th className="px-3 py-3">Chunks</th>
                    <th className="px-3 py-3">Uploaded</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-3 py-3 font-medium text-gray-800">
                        {doc.filename}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{doc.chunk_count}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                        {doc.uploaded_at
                          ? new Date(doc.uploaded_at).toLocaleString("en-PK", {
                              timeZone: "Asia/Karachi",
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => requestDelete(doc)}
                          disabled={deletingId === doc.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === doc.id ? "Deleting..." : "Delete"}
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

      {/* Delete Confirmation Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Delete document?
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-gray-700">
                    "{confirmTarget.filename}"
                  </span>
                  ? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={deletingId === confirmTarget.id}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === confirmTarget.id}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === confirmTarget.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}