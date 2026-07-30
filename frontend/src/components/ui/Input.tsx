"use client";

import React, { useState } from "react";

interface InputProps {
  type: "text" | "email" | "password";
  name: string;
  label?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function Input({
  type,
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType =
    type === "password"
      ? showPassword
        ? "text"
        : "password"
      : type;

  return (
    <div className="mb-5">
      {label && (
        <label
          htmlFor={name}
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`
            w-full
            rounded-xl
            border-2
            px-4
            py-3
            ${type === "password" ? "pr-16" : ""}
            text-gray-800
            placeholder:text-gray-400
            outline-none
            transition-all
            duration-200

            ${
              error
                ? "border-red-500 bg-white focus:ring-red-200"
                : value
                ? "border-green-500 bg-white"
                : "border-gray-300 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            }

            ${
              disabled
                ? "cursor-not-allowed bg-gray-100"
                : "hover:border-blue-400"
            }
          `}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 hover:text-blue-600"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}