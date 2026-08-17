import Logo from "@/components/common/logo";
import RegisterForm from "@/components/forms/RegisterForm";

export default function AdminRegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/85 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl">
        <Logo />
        <h2 className="mb-5 text-center text-xl font-semibold text-gray-800">
          Admin Register
        </h2>
        <RegisterForm portal="admin" />
      </div>
    </main>
  );
}
