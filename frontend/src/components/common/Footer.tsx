export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-100 bg-white/90 backdrop-blur-md py-4 mt-auto">
      <div className="mx-auto max-w-6xl px-8 text-center">
        <p className="text-sm text-gray-400">
          © {year} Knowledge Base AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}