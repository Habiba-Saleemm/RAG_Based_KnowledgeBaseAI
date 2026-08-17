"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin/faqs", label: "Admin FAQs" },
  { href: "/admin/chat", label: "AI Chat" },   
  { href: "/about2", label: "About" },
  { href: "/admin/users", label: "Users" }
];

export default function HeaderNavAdmin() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-8">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-sm font-medium transition-colors duration-200 hover:text-blue-600 ${
            pathname === link.href
              ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
              : "text-gray-600"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
