"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/app/providers";
import { Rating } from "@/hooks/useRatingVault";

export default function ExplorePage() {
  const { ratingVault } = useApp();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    setIsLoading(true);
    const count = await ratingVault.getRatingCount();
    setTotalCount(count);

    if (count > 0) {
      const allRatings = await ratingVault.getRatings(0, count);
      setRatings(allRatings);
    }
    setIsLoading(false);
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-purple-600 mb-8">Explore Ratings</h1>
          <div className="glass p-8 rounded-xl text-center">
            <p className="text-gray-600">Loading ratings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-purple-600">Explore Ratings</h1>
          <div className="text-sm text-gray-600">
            {totalCount} {totalCount === 1 ? "rating" : "ratings"} available
          </div>
        </div>

        {ratings.length === 0 ? (
          <div className="glass p-12 rounded-xl text-center">
            <p className="text-gray-600 text-lg mb-4">No ratings yet</p>
            <Link
              href="/create"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create First Rating
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ratings.map((rating) => (
              <Link
                key={Number(rating.id)}
                href={`/rating/${rating.id}`}
                className="glass p-6 rounded-xl hover:bg-white/80 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex-1">
                    {rating.name}
                  </h3>
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

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {rating.description}
                </p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-between">
                    <span>Dimensions</span>
                    <span className="font-medium text-purple-600">
                      {rating.dimensions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Participants</span>
                    <span className="font-medium">{Number(rating.participantCount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Creator</span>
                    <span className="font-mono">{formatAddress(rating.creator)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Created</span>
                    <span>{formatDate(rating.createdAt)}</span>
                  </div>
                  {rating.deadline > 0n && (
                    <div className="flex items-center justify-between">
                      <span>Deadline</span>
                      <span>{formatDate(rating.deadline)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Score Range</div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {rating.minScore}
                    </span>
                    <span className="text-gray-400">to</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {rating.maxScore}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

