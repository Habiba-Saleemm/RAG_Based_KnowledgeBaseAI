"use client";

import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface HistoryRow {
  user_id: number;
  name: string;
  email: string;
  edited: string;
  removed: string;
  added: string;
  uploaded: string;
  details: string;
  time: string | null;
}

const PAGE_SIZE = 20;

export default function AdminHistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/admin/history/table?page=${page}&page_size=${PAGE_SIZE}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }

        const data = await response.json();
        setRows(data.rows || []);
        setTotalPages(data.total_pages || 1);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
        setError("Could not load history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page]);

  const renderBadge = (
    value: string,
    colorClasses: string
  ) => {
    if (!value) return "—";

    return (
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${colorClasses}`}
      >
        {value}
      </span>
    );
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-200 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-gray-800">
            Activity History
          </h1>

          <p className="mt-2 text-gray-500">
            Complete audit trail of user activities.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          {loading && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-700">
              Loading history...
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-600">
              No activity recorded yet.
            </div>
          )}

          {!loading && rows.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="px-3 py-3">User ID</th>
                      <th className="px-3 py-3">Name</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Edited</th>
                      <th className="px-3 py-3 min-w-112.5">Details</th>
                      <th className="px-3 py-3">Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                        key={`${row.user_id}-${index}`}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-3 font-medium text-gray-800">
                          {row.user_id}
                        </td>

                        <td className="px-3 py-3 text-gray-700">
                          {row.name}
                        </td>

                        <td className="px-3 py-3 text-gray-700">
                          {row.email || "—"}
                        </td>

                        <td className="px-3 py-3">
                          {renderBadge(
                            row.edited,
                            "bg-yellow-100 text-yellow-700"
                          )}
                        </td>

                        <td className="px-3 py-3 text-gray-700">
                          {row.details || "—"}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                          {row.time
                            ? new Date(row.time).toLocaleString("en-PK", {
                                timeZone: "Asia/Karachi",
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} &middot; {total} total records
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}