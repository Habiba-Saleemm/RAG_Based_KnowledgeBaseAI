"use client";

import { usePathname } from "next/navigation";

// Ye pages pe Header/Footer nahi chahiye
const AUTH_PAGES = [
  "/login",
  "/admin/login",
  "/register",
  "/admin/register",
  "/forgotpassword",
  "/verify-code",
  "/update-password",
];

export default function ConditionalLayout({
  children,
  header,
  footer,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  return (
    <>
      {!isAuthPage && header}
      <main className="flex-1">{children}</main>
      {!isAuthPage && footer}
    </>
  );
}