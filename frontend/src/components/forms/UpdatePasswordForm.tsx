"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "../ui/Input";
import Button from "../ui/Button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function validatePassword(password: string): string {
  if (password === " ") return "Password field cannot be empty.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character.";
  if (/\s/.test(password)) return "Password cannot contain spaces.";
  return "";
}

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({ password: "", confirmPassword: "", general: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

useEffect(() => {
  const storedEmail = sessionStorage.getItem("reset_email");
  const verified = sessionStorage.getItem("reset_verified");
  if (!storedEmail || verified !== "true") {
    router.replace("/forgotpassword");
    return;
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setEmail(storedEmail); 
}, [router]); 

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    if (name === "confirmPassword") setErrors((prev) => ({ ...prev, confirmPassword: value !== formData.password ? "Passwords do not match." : "" }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // special-case: both fields empty -> show a combined message
    if (!formData.password.trim() && !formData.confirmPassword.trim()) {
      setErrors((prev) => ({ ...prev, password: "Password fields cannot be empty.", confirmPassword: "Password fields cannot be empty." }));
      return;
    }

    const passwordError = validatePassword(formData.password);
    const confirmError = !formData.confirmPassword.trim() ? "Please confirm your password." : formData.password !== formData.confirmPassword ? "Passwords do not match." : "";
    if (passwordError || confirmError) { setErrors((prev) => ({ ...prev, password: passwordError, confirmPassword: confirmError })); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/update-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: formData.password, confirmPassword: formData.confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors((prev) => ({ ...prev, general: data.errors?.general || "Something went wrong." })); return; }
      sessionStorage.removeItem("reset_email");
      sessionStorage.removeItem("reset_verified");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1000);
    } catch {
      setErrors((prev) => ({ ...prev, general: "Could not connect to server. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold text-green-500">Password Updated!</h2>
      <p className="text-gray-500">Redirecting you to login page...</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <h2 className="text-center text-2xl font-bold text-gray-800">Update Password</h2>
      {errors.general && <p className="rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-600">{errors.general}</p>}
      <Input type="password" name="password" label="New Password" placeholder="Enter new password" value={formData.password} onChange={handleChange} error={errors.password} required autoComplete="new-password" />
      <Input type="password" name="confirmPassword" label="Confirm New Password" placeholder="Re-enter new password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required autoComplete="new-password" />
      <div className="transition-transform duration-200 hover:scale-[1.01]">
        <Button text={loading ? "Updating..." : "Update Password"} type="submit" disabled={loading} />
      </div>
    </form>
  );
}