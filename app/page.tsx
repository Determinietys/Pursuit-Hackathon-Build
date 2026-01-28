import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            SnowClear
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with snow removal providers in NYC and top snowiest US cities
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

