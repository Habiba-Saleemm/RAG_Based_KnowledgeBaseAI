export default function About5Page() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-blue-100 to-indigo-200 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">

          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800">
              About
            </h2>
            <p className="mt-2 text-gray-500">
              Learn more about what we do and how it works.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6 text-gray-600 leading-relaxed">
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Our Mission
              </h3>
              <p>
                Knowledge Base AI helps you turn your documents into an
                interactive assistant. Upload files and ask questions to get
                instant, accurate answers grounded in your own content.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                How It Works
              </h3>
              <p>
                We use Retrieval-Augmented Generation (RAG) to find the most
                relevant parts of your uploaded documents and combine them
                with AI to generate helpful, context-aware responses.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Security &amp; Privacy
              </h3>
              <p>
                Your passwords are encrypted with bcrypt, and your session is
                protected with secure, HttpOnly cookies that JavaScript
                cannot access.
              </p>
            </section>
          </div>

        </div>
      </div>
    </main>
  );
}
