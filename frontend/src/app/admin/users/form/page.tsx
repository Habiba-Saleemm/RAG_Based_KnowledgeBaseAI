"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminUserFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const editingUserId = idParam ? Number(idParam) : null;

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    role: "user",
    can_upload_documents: false,
    can_use_ai_chat: true,
    can_manage_faqs: false,
  });

  console.log("AdminUserFormPage rendered");
}