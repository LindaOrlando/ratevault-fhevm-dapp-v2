import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 mb-6">
            RateVault
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Privacy-First Multi-Dimensional Rating Platform
          </p>
          <p className="text-lg text-gray-500 mb-12">
            Powered by FHEVM - Your ratings stay encrypted, only you control who sees the results
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/create"
              className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
            >
              Create Rating
            </Link>
            <Link
              href="/explore"
              className="px-8 py-4 glass text-purple-600 rounded-lg hover:bg-white/80 transition-colors shadow-lg"
            >
              Explore Ratings
            </Link>
            <Link
              href="/my"
              className="px-8 py-4 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              My Dashboard
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Privacy Protected
              </h3>
              <p className="text-gray-600 text-sm">
                All ratings encrypted with FHEVM technology
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Multi-Dimensional
              </h3>
              <p className="text-gray-600 text-sm">
                Rate products on 2-10 custom dimensions
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Statistical Insights
              </h3>
              <p className="text-gray-600 text-sm">
                Creators can decrypt aggregated statistics
              </p>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="mt-16 glass p-8 rounded-xl">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">
              Platform Statistics
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Total Ratings</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-indigo-600">0</div>
                <div className="text-sm text-gray-600">Participants</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Active Ratings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

