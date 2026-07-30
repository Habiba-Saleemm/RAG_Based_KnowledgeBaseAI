export default function Logo() {
  return (
    <div className="mb-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4 shadow-md transition-transform duration-300 hover:scale-110">
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-blue-600 transition-colors duration-300 hover:text-blue-700">
        Knowledge Base AI
      </h1>

      <p className="mt-3 text-lg font-medium text-gray-700">
        Welcome Back!
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Continue to your workspace
      </p>
    </div>
  );
}