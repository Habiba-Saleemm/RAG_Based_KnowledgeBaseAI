"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type FAQ = {
  id: number;
  question: string;
  answer: string;
};

export default function PublicFaqs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setIsLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/api/faqs`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch FAQs.");
        }

        const data: FAQ[] = await res.json();
        setFaqs(data);
      } catch {
        setError("Could not load FAQs right now. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800">
              Frequently Asked Questions
            </h2>
          </div>

          {isLoading && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-700">
              Loading FAQs...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {!isLoading && !error && faqs.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-600">
              No FAQs found yet.
            </div>
          )}

          {!isLoading && !error && faqs.length > 0 && (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-5 shadow-sm"
                >
                  <h3 className="text-base font-semibold text-gray-800">
                    {faq.question}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
