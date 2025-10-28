"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/app/providers";
import { Rating } from "@/hooks/useRatingVault";

export default function MyDashboardPage() {
  const { wallet, ratingVault } = useApp();
  const [myRatings, setMyRatings] = useState<Rating[]>([]);
  const [myCreatedRatings, setMyCreatedRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (wallet.address) {
      loadMyData();
    }
  }, [wallet.address]);

  const loadMyData = async () => {
    if (!wallet.address) return;

    setIsLoading(true);

    // Load my rated ratings
    const ratedIds = await ratingVault.getMyRatedRatings(wallet.address);
    const ratedRatings = await Promise.all(
      ratedIds.map((id) => ratingVault.getRating(id))
    );
    setMyRatings(ratedRatings.filter((r) => r !== null) as Rating[]);

    // Load my created ratings
    const createdIds = await ratingVault.getMyCreatedRatings(wallet.address);
    const createdRatings = await Promise.all(
      createdIds.map((id) => ratingVault.getRating(id))
    );
    setMyCreatedRatings(createdRatings.filter((r) => r !== null) as Rating[]);

    setIsLoading(false);
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600">
              Please connect your wallet to view your dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-purple-600 mb-8">My Dashboard</h1>
          <div className="glass p-8 rounded-xl text-center">
            <p className="text-gray-600">Loading your data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-purple-600 mb-8">My Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* My Ratings */}
          <div className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              My Ratings ({myRatings.length})
            </h2>
            {myRatings.length === 0 ? (
              <p className="text-gray-600">
                You haven't rated anything yet
              </p>
            ) : (
              <div className="space-y-3">
                {myRatings.map((rating) => (
                  <Link
                    key={Number(rating.id)}
                    href={`/rating/${rating.id}`}
                    className="block p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {rating.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {rating.dimensions.length} dimensions
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          rating.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {rating.active ? "Active" : "Closed"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* My Created Ratings */}
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                My Created Ratings ({myCreatedRatings.length})
              </h2>
              <Link
                href="/create"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Create New
              </Link>
            </div>
            {myCreatedRatings.length === 0 ? (
              <p className="text-gray-600">
                You haven't created any ratings yet
              </p>
            ) : (
              <div className="space-y-3">
                {myCreatedRatings.map((rating) => (
                  <div
                    key={Number(rating.id)}
                    className="block p-4 bg-white/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {rating.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {Number(rating.participantCount)} participants • {rating.dimensions.length} dimensions
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          rating.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {rating.active ? "Active" : "Closed"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/rating/${rating.id}`}
                        className="flex-1 px-3 py-1 text-center bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                      >
                        View
                      </Link>
                      {rating.active && (
                        <button
                          onClick={async () => {
                            if (confirm("Close this rating? No new ratings will be accepted.")) {
                              await ratingVault.closeRating(Number(rating.id));
                              loadMyData();
                            }
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

