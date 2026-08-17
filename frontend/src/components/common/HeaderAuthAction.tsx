"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function HeaderAuthAction({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // still redirect even if the request failed
    } finally {
      router.push("/login?loggedOut=1");
      router.refresh();
    }
  };

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md active:scale-95"
      >
        Login
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="rounded-xl border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-500 transition-all duration-200 hover:bg-red-500 hover:text-white hover:shadow-md active:scale-95"
    >
      Logout
    </button>
  );
}