import Logo from "@/components/common/logo";
import LoginForm from "@/components/forms/LoginForm";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-950 via-indigo-900 to-slate-900 p-6">
      <div className="w-full max-w-md rounded-3xl border border-purple-300/20 bg-white/95 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <Logo showWelcome />

        <h2 className="mb-5 text-center text-xl font-semibold text-purple-950">
          Admin Portal Login
        </h2>

        <LoginForm portal="admin" />

      </div>
    </main>
  );
}
