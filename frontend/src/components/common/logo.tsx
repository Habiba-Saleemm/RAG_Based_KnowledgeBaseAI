type LogoProps = {
  showWelcome?: boolean;
};

export default function Logo({ showWelcome = false }: LogoProps) {
  return (
    <div className="mb-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4 shadow-md transition-transform duration-300 hover:scale-110">
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-blue-600 transition-colors duration-300 hover:text-blue-700">
        Knowledge Base AI
      </h1>

      {showWelcome && (
        <p className="mt-3 text-center text-lg font-semibold text-slate-700">
          Welcome back!
        </p>
      )}
    </div>
  );
}