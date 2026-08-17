"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Button from "../ui/Button";
import Input from "../ui/Input";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type LoginPortal = "user" | "admin";

// Detailed, per-case email validation (matches backend validators.py exactly)

function validateEmail(email: string): string {
  if (!email.trim()) return "Please enter your email.";

  if (/\s/.test(email)) {
    return "Email addresses cannot contain spaces.\nPlease remove all spaces and try again.";
  }

  const atCount = (email.match(/@/g) || []).length;

  if (atCount === 0) {
    return "Please enter a valid email address.\nThe email must contain an '@' symbol.\n\nExample: abc@example.com";
  }
  if (atCount > 1) {
    return "Please enter a valid email address.\nAn email address can contain only one '@' symbol.";
  }

  const [local, domain] = email.split("@");

  if (!local) {
    return "Please enter a valid email address.\nThe part before '@' cannot be empty.\n\nExample: abc@gmail.com";
  }
  if (!domain) {
    return "Please enter a valid email address.\nPlease enter the domain name after '@'.\n\nExample: abc@gmail.com";
  }
  if (email.includes("..")) {
    return "Please enter a valid email address.\nConsecutive dots are not allowed.";
  }
  if (!domain.includes(".")) {
    return "Please enter a valid email address.\nThe domain is incomplete.\n\nExample: abc@gmail.com";
  }
  if (domain.endsWith(".")) {
    return "Please enter a valid email address.\nThe domain extension is missing.\n\nExample: abc@gmail.com";
  }
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    return "Please enter a valid email address.\nThe email contains invalid characters.";
  }

  return "";
}

export default function LoginForm({ portal = "user" }: { portal?: LoginPortal }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);


  // Handle Input Change
const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));

  // Live-validate email on every keystroke — error stays until fully valid
  if (name === "email") {
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(value),
    }));
  } else {
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }
};

  // Validation
  const validate = () => {
    let valid = true;

    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    // ===========================
    // Email Validation
    // ===========================

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
      valid = false;
    }

    // ===========================
    // Password Validation
    // ===========================

    // Login only checks that a password was entered — whether it's
    // correct is the backend's job.
    if (!formData.password.trim()) {
      newErrors.password = "Please enter your password.";
      valid = false;
    }

    setErrors(newErrors);

    return valid;
  };

  // Submit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          portal,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          ...data.errors,
        }));
        return;
      }

      const isAdmin = Boolean(data?.user?.isAdmin);
      const redirectPath = portal === "admin"
        ? "/admin/faqs"
        : isAdmin
          ? "/admin/faqs"
          : "/dashboard";

      router.push(redirectPath);
      router.refresh();
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: "Could not reach the server. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
    >
      {errors.general && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}
      <Input
        type="email"
        name="email"
        label="Email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
        autoComplete="email"
      />

      <Input
        type="password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-600 select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-blue-600"
          />
          Remember Me
        </label>

        <Link
          href="/forgotpassword"
          className="font-medium text-blue-600 transition hover:text-blue-800 hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      <div className="transition-transform duration-200 hover:scale-[1.01]">
        <Button
          text={
            isSubmitting
              ? "Logging in..."
              : portal === "admin"
                ? "Admin Login"
                : "Login"
          }
          type="submit"
          disabled={isSubmitting}
        />
      </div>

      <p className="text-center text-gray-600">
        {portal === "admin" ? (
          <>
            Go to user login?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
            >
              User Login
            </Link>
          </>
        ) : (
          <>
            Dont have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
            >
              Register
            </Link>
          </>
        )}
      </p>

    </form>
  );
}