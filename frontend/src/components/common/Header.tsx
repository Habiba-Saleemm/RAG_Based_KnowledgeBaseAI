import Link from "next/link";
import { cookies } from "next/headers";
import HeaderNav from "./HeaderNav";
import HeaderAuthAction from "./HeaderAuthAction";

export default async function Header() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get("session_token")?.value);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">

        {/* Logo */}
        <Link href={isLoggedIn ? "/dashboard" : "/about"} className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-md transition-transform duration-200 group-hover:scale-110">
            K
          </div>
          <span className="text-xl font-extrabold tracking-tight text-blue-600 transition-colors duration-200 group-hover:text-blue-700">
            Knowledge Base AI
          </span>
        </Link>

        {/* Nav Links */}
        <HeaderNav />

        {/* Corner Auth Action: Login when logged out, Logout when logged in */}
        <HeaderAuthAction isLoggedIn={isLoggedIn} />

      </div>
    </header>
  );
}
