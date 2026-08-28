import AdminUserForm from "@/components/forms/AdminUserForm";

export default async function AdminUserFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);

  return <AdminUserForm userId={userId} />;
}