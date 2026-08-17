"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type FAQ = {
  id: number;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
};

type FormState = {
  question: string;
  answer: string;
};

const initialFormState: FormState = {
  question: "",
  answer: "",
};

export default function AdminFaqsPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [errors, setErrors] = useState({
  question: "",
  answer: "",
});

  const fetchFaqs = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/api/faqs`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch FAQs.");
      }
      const data: FAQ[] = await res.json();
      setFaqs(data);
    } catch {
      setError("Could not load FAQs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadAdminFaqs = async () => {
      try {
        const meRes = await fetch(`${API_BASE_URL}/api/me`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!meRes.ok) {
          if (isMounted) {
            router.replace("/admin/login");
          }
          return;
        }

        const meData = await meRes.json();
        if (!meData?.user?.isAdmin) {
          if (isMounted) {
            router.replace("/faq");
          }
          return;
        }

        const faqRes = await fetch(`${API_BASE_URL}/api/faqs`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!faqRes.ok) {
          throw new Error("Failed to fetch FAQs.");
        }
        const data: FAQ[] = await faqRes.json();
        if (isMounted) {
          setFaqs(data);
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Could not load FAQs. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAdminFaqs();

    return () => {
      isMounted = false;
    };
  }, [router]);

const resetForm = () => {
  setFormState(initialFormState);
  setEditingFaqId(null);

  setErrors({
    question: "",
    answer: "",
  });

  setIsFormOpen(false);
};
  const openAddForm = () => {
    setError("");
    setSuccessMessage("");
    setEditingFaqId(null);
    setFormState(initialFormState);
    setIsFormOpen(true);
  };

  const openEditForm = (faq: FAQ) => {
    setError("");
    setSuccessMessage("");
    setEditingFaqId(faq.id);
    setFormState({
      question: faq.question,
      answer: faq.answer,
    });
    setIsFormOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const question = formState.question.trim();
    const answer = formState.answer.trim();

    const newErrors = {
  question: "",
  answer: "",
};

let hasError = false;

if (!question) {
  newErrors.question = "Question field cannot be empty.";
  hasError = true;
}

if (!answer) {
  newErrors.answer = "Answer field cannot be empty.";
  hasError = true;
}

setErrors(newErrors);

if (hasError) return;

    const isEditing = editingFaqId !== null;
    const url = isEditing
      ? `${API_BASE_URL}/api/faqs/${editingFaqId}`
      : `${API_BASE_URL}/api/faqs`;
    const method = isEditing ? "PUT" : "POST";

    try {
      setIsSubmitting(true);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
        credentials: "include",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const detail =
          typeof payload?.detail === "string"
            ? payload.detail
            : "Failed to save FAQ.";
        throw new Error(detail);
      }

      await fetchFaqs();
      resetForm();
      setSuccessMessage(isEditing ? "FAQ updated successfully." : "FAQ created successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save FAQ. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (faqId: number) => {
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/faqs/${faqId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const detail =
          typeof payload?.detail === "string"
            ? payload.detail
            : "Failed to delete FAQ.";
        throw new Error(detail);
      }

      await fetchFaqs();
      setSuccessMessage("FAQ deleted successfully.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete FAQ. Please try again."
      );
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin FAQ Manager</h1>
              <p className="mt-2 text-gray-500">
                Add, edit, and delete FAQs stored in the shared database table.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddForm}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Add FAQ
            </button>
          </div>
        </div>

        {(error || successMessage) && (
          <div className="space-y-3">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                {successMessage}
              </div>
            )}
          </div>
        )}

        {isFormOpen && (
          <div className="rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              {editingFaqId !== null ? "Edit FAQ" : "Add FAQ"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
          <div>
  <label className="mb-2 block text-sm font-medium text-gray-700">
    <strong>Question</strong>
  </label>

  <input
    type="text"
    value={formState.question}
    onChange={(event) => {
      setFormState((prev) => ({
        ...prev,
        question: event.target.value,
      }));

      if (errors.question) {
        setErrors((prev) => ({
          ...prev,
          question: "",
        }));
      }
    }}
    className={`w-full rounded-xl p-3 outline-none transition text-gray-800 placeholder-gray-400 ${
      errors.question
        ? "border border-red-500 focus:border-red-500"
        : "border border-gray-300 focus:border-blue-500"
    }`}
    placeholder="Enter question"
  />

  {errors.question && (
    <p className="mt-1 text-sm text-red-600">
      {errors.question}
    </p>
  )}
</div>

            <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Answer
            </label>

            <textarea
              value={formState.answer}
              onChange={(event) => {
                setFormState((prev) => ({
                  ...prev,
                  answer: event.target.value,
                }));

                if (errors.answer) {
                  setErrors((prev) => ({
                    ...prev,
                    answer: "",
                  }));
                }
              }}
              className={`h-36 w-full rounded-xl p-3 outline-none transition text-gray-800 placeholder-gray-400 ${
                errors.answer
                  ? "border border-red-500 focus:border-red-500"
                  : "border border-gray-300 focus:border-blue-500"
              }`}
              placeholder="Enter answer"
            />

            {errors.answer && (
              <p className="mt-1 text-sm text-red-600">
                {errors.answer}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting
                ? "Saving..."
                : editingFaqId !== null
                  ? "Update FAQ"
                  : "Create FAQ"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )}

    <div className="rounded-3xl bg-white p-8 shadow-2xl">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Existing FAQs
      </h2>

      {isLoading && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-700">
          Loading FAQs...
        </div>
      )}

      {!isLoading && faqs.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-600">
          No FAQs found yet.
        </div>
      )}

      {!isLoading && faqs.length > 0 && (
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

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => openEditForm(faq)}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(faq.id)}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</main>
);
}