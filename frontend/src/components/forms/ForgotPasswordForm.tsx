"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";

import Input from "../ui/Input";
import Button from "../ui/Button";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");

  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);

    // Clear error while typing
    setError("");
  };

  const validate = () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      return false;
    }

    const emailErrors: string[] = [];

    if (!email.includes("@")) {
      emailErrors.push("• '@' symbol is missing.");
    }

    if (!/\.[A-Za-z]{2,}$/.test(email)) {
      emailErrors.push(
        "• Valid domain required (.com, .net, .org, etc.)."
      );
    }

    if (emailErrors.length > 0) {
      setError(
        "Please enter a valid email:\n" +
          emailErrors.join("\n")
      );
      return false;
    }

    return true;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    alert("Reset Password API will be connected later.");

    console.log(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-center text-2xl font-bold text-gray-800">
        Forgot Password
      </h2>

      <p className="text-center text-gray-500">
        Enter your registered email to receive a password reset link.
      </p>

      <Input
        type="email"
        name="email"
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChange={handleChange}
        error={error}
        required
      />

      <div className="transition-transform duration-200 hover:scale-[1.01]">
        <Button
          text="Reset Password"
          type="submit"
        />
      </div>

      <p className="text-center text-gray-600">
        <Link
          href="/login"
          className="font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
        >
          Back to Login
        </Link>
      </p>
    </form>
  );
}