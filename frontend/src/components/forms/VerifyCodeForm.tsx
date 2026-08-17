"use client";

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent, type ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const RESEND_SECONDS = 60;

export default function VerifyCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [resendSecondsLeft, setResendSecondsLeft] = useState(RESEND_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("reset_email");
    if (!storedEmail) { router.replace("/forgotpassword"); return; }
    setEmail(storedEmail);
  }, [router]);

  // 60s -> 00 countdown. Starts on mount (a code was just sent) and restarts on resend.
  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setResendSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendSecondsLeft > 0]);

  const handleResend = async () => {
    if (resendSecondsLeft > 0 || resendLoading || !email) return;
    setResendLoading(true);
    setResendMessage("");
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errors?.email || data.errors?.general || "Could not resend code.");
        return;
      }
      setCode("");

      setResendSecondsLeft(RESEND_SECONDS);
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const inputRefs = useRef<HTMLInputElement[]>([]);

  const setDigitAt = (index: number, digit: string) => {
    const digits = code.split("").concat(Array(6).fill("")).slice(0, 6);
    digits[index] = digit;
    const newCode = digits.join("");
    setCode(newCode);
    if (error) setError("");
    if (resendMessage) setResendMessage("");
  };

  const handleDigitChange = (e: ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setDigitAt(idx, "");
      return;
    }
    const digit = val.slice(-1);
    setDigitAt(idx, digit);
    const next = inputRefs.current[idx + 1];
    if (next) { next.focus(); next.select(); }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      if (code[idx]) {
        setDigitAt(idx, "");
      } else {
        const prev = inputRefs.current[idx - 1];
        if (prev) {
          setDigitAt(idx - 1, "");
          prev.focus();
        }
      }
    } else if (e.key === "ArrowLeft") {
      const prev = inputRefs.current[idx - 1];
      if (prev) prev.focus();
    } else if (e.key === "ArrowRight") {
      const next = inputRefs.current[idx + 1];
      if (next) next.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, idx: number) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const digits = code.split("").concat(Array(6).fill("")).slice(0, 6);
    for (let i = 0; i < paste.length && idx + i < 6; i++) {
      digits[idx + i] = paste[i];
    }
    const newCode = digits.join("");
    setCode(newCode);
    const focusIdx = Math.min(6, idx + paste.length);
    const toFocus = inputRefs.current[focusIdx - 1];
    if (toFocus) toFocus.focus();
  };

  const normalizeDigits = (s: string) => {
    if (!s) return "";
    // Convert Arabic-Indic and Extended Arabic-Indic digits to ASCII 0-9, then strip non-digits.
    return s
      .replace(/[\u0660-\u0669]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
      .replace(/[\u06F0-\u06F9]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 48))
      .replace(/\D/g, "");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedCode = normalizeDigits(code);
    if (normalizedCode.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      // Debug log to help inspect what's being sent to the server in the network tab
      // Build payload including both string and numeric variants in case the API expects a number
      const numericCode = Number(normalizedCode);
      const payload: any = { email, code: normalizedCode, otp: normalizedCode, pin: normalizedCode };
      if (!Number.isNaN(numericCode)) {
        // include several plausible numeric field names the API might accept
        payload.code_number = numericCode;
        payload.otp_number = numericCode;
        payload.pin_number = numericCode;
        payload.code_numeric = numericCode;
      }
      console.log("Verifying code: payload", payload);
      const res = await fetch(`${API_BASE_URL}/api/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const text = await res.text();
        data = { rawText: text };
      }
      console.log("Verify response", res.status, data);
      if (!res.ok) {
        const msg = data.errors?.general || data.errors?.code || data.message || data.rawText || "Invalid or expired code.";
        // If the server indicates the code expired, clear the input and enable resend immediately with a friendly message.
        if (typeof msg === "string" && /expire/i.test(msg)) {
          setError("This verification code has expired. Please request a new code.");
          setCode("");
          // enable the resend UI by setting timer to 0 so the Re-send Code button appears
          setResendSecondsLeft(0);
          setResendMessage("Code expired. You can request a new code now.");
        } else {
          setError(msg);
        }
        return;
      }
      sessionStorage.setItem("reset_verified", "true");
      sessionStorage.removeItem("reset_pin");
      // Set a redirecting state and await navigation so the UI can hide the form while the new page loads.
      setRedirecting(true);
      try {
        await router.push("/update-password");
      } finally {
        // in case navigation doesn't complete, ensure loading state is reset
        setLoading(false);
      }
    } catch (err) {
      console.error("Verify request failed", err);
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="py-10 text-center">
        <p className="text-lg font-medium text-gray-700">Verification successful</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-center text-2xl font-bold text-gray-800">
        Enter Verification Code
      </h2>

      <div className="flex items-center justify-center">
        <div className="flex items-center justify-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              id={`verify-digit-${i}`}
              name={`verify-digit-${i}`}
              ref={(el) => { inputRefs.current[i] = el as HTMLInputElement; }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={code[i] || ""}
              onChange={(e) => handleDigitChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={(e) => handlePaste(e, i)}
              className={`w-10 h-14 sm:w-12 sm:h-16 rounded-lg border-2 flex items-center justify-center text-center text-xl font-semibold 
                        text-gray-800 mx-1 ${code[i] ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"} focus:outline-none focus:ring-2 focus:ring-blue-200`}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
      </div>
      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      <div className="transition-transform duration-200 hover:scale-[1.01]">
        <Button
          text={loading ? "Verifying..." : "Verify Code"}
          type="submit"
          disabled={loading}
        />
      </div>

      {resendMessage && (
        <p className="text-center text-sm font-medium text-green-600">
          {resendMessage}
        </p>
      )}

      <p className="text-center text-gray-600">
        {resendSecondsLeft > 0 ? (
          <span className="text-gray-400">
            Resend code in{" "}
            <span className="font-semibold text-gray-500 tabular-nums">
              {String(resendSecondsLeft).padStart(2, "0")}s
            </span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="font-semibold text-blue-600 transition hover:text-blue-800 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            {resendLoading ? "Resending..." : "Re-send Code"}
          </button>
        )}
      </p>
    </form>
  );
}