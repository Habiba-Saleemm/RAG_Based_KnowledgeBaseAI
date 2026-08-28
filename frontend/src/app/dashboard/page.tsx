"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-2xl">

        {/* Welcome Banner */}
        <div className="mt-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg text-center">
          <h2 className="text-3xl font-bold" >
            Knowledge Base AI
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">

          {/* Documents (merged with Uploads) */}
          <Link
            href="/admin/documentpage"
            className="cursor-pointer rounded-2xl bg-blue-100 p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="text-4xl">📄</div>
            <h3 className="mt-3 text-lg font-semibold text-blue-700">Documents</h3>
            <p className="mt-1 text-sm text-blue-600/70">
              Upload and manage your knowledge base files.
            </p>
          </Link>

          {/* AI Chats */}
          <Link
            href="/admin/chat"
            className="cursor-pointer rounded-2xl bg-purple-100 p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="text-4xl">🤖</div>
            <h3 className="mt-3 text-lg font-semibold text-purple-700">AI Chats</h3>
            <p className="mt-1 text-sm text-purple-600/70">
              Ask questions and get answers from your knowledge base.
            </p>
          </Link>

        </div>

        {/* Quick Tips */}
        <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-lg font-semibold text-gray-800">Quick Tips</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
            <li>Upload documents to build your knowledge base.</li>
            <li>Start chatting with your AI assistant.</li>
            <li>Monitor uploaded files and AI conversations.</li>
          </ul>
        </div>

      </div>
    </main>
  );
}