import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import ConditionalLayout from "@/components/common/ConditionalLayout";
import Header from "@/components/common/Header";
import AdminHeader from "@/components/common/AdminHeader";
import Footer from "@/components/common/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Knowledge Base AI",
  description: "Upload documents and chat with AI",
};

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

async function getIsAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return false;

  try {
    const res = await fetch(`${BACKEND_URL}/api/me`, {
      headers: { Cookie: `session_token=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.user?.isAdmin);
  } catch {
    return false;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdmin = await getIsAdmin();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200">
        <ConditionalLayout header={isAdmin ? <AdminHeader /> : <Header />} footer={<Footer />}>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}