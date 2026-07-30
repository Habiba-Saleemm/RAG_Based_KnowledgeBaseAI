import Logo from "@/components/common/logo";
import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/85 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-8">
        <Logo />
        <ForgotPasswordForm />
      </div>
    </main>
  );
}