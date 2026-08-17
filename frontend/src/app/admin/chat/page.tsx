import Logo from "@/components/common/logo";
import ChatInterface from "@/components/forms/ChatInterfaceAdm";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <Logo />
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}