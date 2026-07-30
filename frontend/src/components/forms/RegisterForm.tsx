"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Input from "../ui/Input";
import Button from "../ui/Button";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Detailed, per-case email validation (matches backend validators.py exactly)
function validateEmail(email: string): string {
  if (!email.trim()) return "Please enter your email.";

  if (/\s/.test(email)) {
    return "Email addresses cannot contain spaces.\nPlease remove all spaces and try again.";
  }

  const atCount = (email.match(/@/g) || []).length;

  if (atCount === 0) {
    return "Please enter a valid email address.\nThe email must contain an '@' symbol.\n\nExample: habiba@example.com";
  }
  if (atCount > 1) {
    return "Please enter a valid email address.\nAn email address can contain only one '@' symbol.";
  }

  const [local, domain] = email.split("@");

  if (!local) {
    return "Please enter a valid email address.\nThe part before '@' cannot be empty.\n\nExample: habiba@gmail.com";
  }
  if (!domain) {
    return "Please enter a valid email address.\nPlease enter the domain name after '@'.\n\nExample: habiba@gmail.com";
  }
  if (email.includes("..")) {
    return "Please enter a valid email address.\nConsecutive dots are not allowed.";
  }
  if (!domain.includes(".")) {
    return "Please enter a valid email address.\nThe domain is incomplete.\n\nExample: habiba@gmail.com";
  }
  if (domain.endsWith(".")) {
    return "Please enter a valid email address.\nThe domain extension is missing.\n\nExample: habiba@gmail.com";
  }
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    return "Please enter a valid email address.\nThe email contains invalid characters.";
  }

  return "";
}

export default function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const PASSWORD_RULES = {
    minLength: 8,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true,
  };

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

  const validate = () => {
    let valid = true;

    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      general: "",
    };

    // Name
    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name.";
      valid = false;
    }

    // Email
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
      valid = false;
    }

    // Password
    if (!formData.password.trim()) {
      newErrors.password = "Please enter a password.";
      valid = false;
    } else {
      const passwordErrors: string[] = [];

      if (formData.password.length < PASSWORD_RULES.minLength) {
        passwordErrors.push(
          `• Minimum ${PASSWORD_RULES.minLength} characters`
        );
      }

      if (
        PASSWORD_RULES.uppercase &&
        !/[A-Z]/.test(formData.password)
      ) {
        passwordErrors.push("• At least one uppercase letter");
      }

      if (
        PASSWORD_RULES.lowercase &&
        !/[a-z]/.test(formData.password)
      ) {
        passwordErrors.push("• At least one lowercase letter");
      }

      if (
        PASSWORD_RULES.number &&
        !/\d/.test(formData.password)
      ) {
        passwordErrors.push("• At least one number");
      }

      if (
        PASSWORD_RULES.special &&
        !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
      ) {
        passwordErrors.push("• At least one special character");
      }

      if (passwordErrors.length > 0) {
        newErrors.password =
          "Password must contain:\n" +
          passwordErrors.join("\n");
        valid = false;
      }
    }

    // Confirm Password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword =
        "Please confirm your password.";
      valid = false;
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
      valid = false;
    }

    setErrors(newErrors);

    return valid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Backend returns the same { field: message } shape as our
        // frontend errors, so we can merge it straight in.
        setErrors((prev) => ({
          ...prev,
          ...data.errors,
        }));
        return;
      }

      router.push("/login");
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general: "Could not reach the server. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.general && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      <Input
        type="text"
        name="name"
        label="Full Name"
        placeholder="Enter your full name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <Input
        type="email"
        name="email"
        label="Email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <Input
        type="password"
        name="password"
        label="Password"
        placeholder="Create password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
      />

      <Input
        type="password"
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        required
      />

      <div className="transition-transform duration-200 hover:scale-[1.01]">
        <Button
          text={isSubmitting ? "Creating account..." : "Register"}
          type="submit"
          disabled={isSubmitting}
        />
      </div>

      <p className="text-center text-gray-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
        >
          Login
        </Link>
      </p>
    </form>
  );
}