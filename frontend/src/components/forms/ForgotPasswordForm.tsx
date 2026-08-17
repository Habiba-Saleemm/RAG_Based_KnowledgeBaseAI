"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "../ui/Input";
import Button from "../ui/Button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function validateEmail(email: string): string {
  if (!email.trim()) return "Please enter your email.";
  if (/\s/.test(email)) return "Email cannot contain spaces.";
  const atCount = (email.match(/@/g) || []).length;
  if (atCount === 0) return "Please enter a valid email. The email must contain an '@' symbol. Example: abc@example.com";
  if (atCount > 1) return "Email can only contain one '@' symbol.";
  const [local, domain] = email.split("@");
  if (!local) return "Please enter a valid email. The part before '@' cannot be empty.";
  if (!domain || !domain.includes(".")) return "Please enter a valid email. Domain is incomplete. Example: abc@gmail.com";
  if (domain.endsWith(".")) return "Please enter a valid email. Domain extension is missing.";
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) return "Please enter a valid email address.";
  return "";
}

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setError(validateEmail(value));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errors?.email || data.errors?.general || "Something went wrong.");
        return;
      }
      sessionStorage.setItem("reset_email", email.trim().toLowerCase());
      router.push("/verify-code");
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-center text-2xl font-bold text-gray-800">Forgot Password</h2>
      <Input type="email" name="email" label="Email" placeholder="Enter your registered email" value={email} onChange={handleChange} error={error} required />
      <div className="transition-transform duration-200 hover:scale-[1.01]">
        <Button text={loading ? "Sending..." : "Send Verification Code"} type="submit" disabled={loading} />
      </div>
      <p className="text-center text-gray-600">
        <Link href="/login" className="font-semibold text-blue-600 transition hover:text-blue-800 hover:underline">Back to Login</Link>
      </p>
    </form>
  );
}