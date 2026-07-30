"use client";

import Logo from "@/components/common/logo";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // Even if the request fails, still send the user back to login
    } finally {
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-8">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-2xl">

        <Logo />

        <div className="mt-8 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <h2 className="text-3xl font-bold">
            Welcome Back!
          </h2>

          <p className="mt-2 text-blue-100">
            Login successful. Youre ready to manage your AI Knowledge Base.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">

          <div className="cursor-pointer rounded-2xl bg-blue-100 p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="text-4xl">📄</div>

            <h3 className="mt-3 text-lg font-semibold text-blue-700">
              Documents
            </h3>

            <p className="mt-3 text-4xl font-bold text-blue-900">
              0
            </p>
          </div>

          <div className="cursor-pointer rounded-2xl bg-green-100 p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="text-4xl">📤</div>

            <h3 className="mt-3 text-lg font-semibold text-green-700">
              Uploads
            </h3>

            <p className="mt-3 text-4xl font-bold text-green-900">
              0
            </p>
          </div>

          <div className="cursor-pointer rounded-2xl bg-purple-100 p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="text-4xl">🤖</div>

            <h3 className="mt-3 text-lg font-semibold text-purple-700">
              AI Chats
            </h3>

            <p className="mt-3 text-4xl font-bold text-purple-900">
              0
            </p>
          </div>

        </div>

        <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-lg font-semibold text-gray-800">
            Quick Tips
          </h3>

          <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
            <li>Upload documents to build your knowledge base.</li>
            <li>Start chatting with your AI assistant.</li>
            <li>Monitor uploaded files and AI conversations.</li>
          </ul>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-500 px-6 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-red-600 hover:shadow-lg active:scale-95"
          >
            Logout
          </button>
        </div>

      </div>
    </main>
  );
}