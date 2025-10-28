"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/app/providers";
import { Rating } from "@/hooks/useRatingVault";
import { RatingStats } from "@/components/RatingStats";

export default function RatingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { wallet, ratingVault, fhevm } = useApp();

  const ratingId = Number(params.id);

  const [rating, setRating] = useState<Rating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scores, setScores] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadRating();
  }, [ratingId]);

  const loadRating = async () => {
    setIsLoading(true);
    const r = await ratingVault.getRating(ratingId);
    
    if (r) {
      setRating(r);
      setScores(Array(r.dimensions.length).fill(r.minScore));
      
      // Check if user has already rated
      if (wallet.isConnected && wallet.address) {
        try {
          // This would check hasRated mapping in the contract
          // For now, we'll skip this check
        } catch (err) {
          console.error("Check rating status error:", err);
        }
      }
    }
    
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!fhevm.instance) {
      alert("FHEVM instance not ready. Please wait...");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await ratingVault.submitRating(ratingId, scores);

      if (result.success) {
        alert("Rating submitted successfully!");
        setHasRated(true);
        loadRating();
      } else {
        alert(`Failed to submit rating: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 rounded-xl text-center">
            <p className="text-gray-600">Loading rating...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!rating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Rating Not Found</h2>
            <p className="text-gray-600 mb-4">This rating does not exist</p>
            <button
              onClick={() => router.push("/explore")}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Explore
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isExpired =
    rating.deadline > 0n && Date.now() > Number(rating.deadline) * 1000;
  const canRate = rating.active && !isExpired && !hasRated && wallet.isConnected;
  
  const isCreator = Boolean(
    wallet.isConnected && 
    wallet.address && 
    rating.creator.toLowerCase() === wallet.address.toLowerCase()
  );

  const handleDecryptStats = async () => {
    return await ratingVault.decryptAggregatedScores(ratingId);
  };

  const handleDecryptMyRating = async () => {
    return await ratingVault.decryptMyRating(ratingId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Rating Info */}
        <div className="glass p-8 rounded-xl mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-purple-600 flex-1">
              {rating.name}
            </h1>
            <span
              className={`px-3 py-1 rounded text-sm ${
                rating.active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {rating.active ? "Active" : "Closed"}
            </span>
          </div>

          <p className="text-gray-700 mb-6">{rating.description}</p>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Creator:</span>
              <span className="ml-2 font-mono font-medium">
                {formatAddress(rating.creator)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Participants:</span>
              <span className="ml-2 font-medium">
                {Number(rating.participantCount)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Dimensions:</span>
              <span className="ml-2 font-medium">{rating.dimensions.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Score Range:</span>
              <span className="ml-2 font-medium">
                {rating.minScore} - {rating.maxScore}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2">{formatDate(rating.createdAt)}</span>
            </div>
            {rating.deadline > 0n && (
              <div>
                <span className="text-gray-500">Deadline:</span>
                <span className="ml-2">{formatDate(rating.deadline)}</span>
                {isExpired && (
                  <span className="ml-2 text-red-500 text-xs">(Expired)</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Rating Form */}
        {!wallet.isConnected ? (
          <div className="glass p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600">
              Please connect your wallet to submit a rating
            </p>
          </div>
        ) : hasRated ? (
          <div className="glass p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ✅ You have already rated this
            </h2>
            <p className="text-gray-600">
              Thank you for your participation!
            </p>
          </div>
        ) : !rating.active ? (
          <div className="glass p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Rating Closed
            </h2>
            <p className="text-gray-600">
              This rating is no longer accepting new submissions
            </p>
          </div>
        ) : isExpired ? (
          <div className="glass p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Rating Expired</h2>
            <p className="text-gray-600">
              The deadline for this rating has passed
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass p-8 rounded-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Submit Your Rating
            </h2>

            <div className="space-y-6">
              {rating.dimensions.map((dimension, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {dimension}
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min={rating.minScore}
                      max={rating.maxScore}
                      value={scores[index]}
                      onChange={(e) => {
                        const newScores = [...scores];
                        newScores[index] = Number(e.target.value);
                        setScores(newScores);
                      }}
                      className="flex-1"
                    />
                    <span className="font-bold text-purple-600 w-12 text-center">
                      {scores[index]}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{rating.minScore}</span>
                    <span>{rating.maxScore}</span>
                  </div>
                </div>
              ))}
            </div>

            {fhevm.isLoading && (
              <div className="mt-4 text-sm text-gray-600 text-center">
                Initializing FHEVM... ({fhevm.status})
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !fhevm.instance || fhevm.isLoading}
              className="w-full mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Submitting..."
                : !fhevm.instance
                ? "Waiting for FHEVM..."
                : "Submit Rating (Encrypted)"}
            </button>

            {ratingVault.error && (
              <p className="text-red-500 text-sm text-center mt-4">
                {ratingVault.error}
              </p>
            )}

            <p className="text-xs text-gray-500 text-center mt-4">
              🔒 Your ratings will be encrypted using FHEVM before submission
            </p>
          </form>
        )}

        {/* Statistics Section */}
        {wallet.isConnected && rating.participantCount > 0n && (
          <div className="mt-6">
            <div className="glass p-4 rounded-xl mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  View Rating Statistics
                </h3>
                <p className="text-sm text-gray-600">
                  {rating.participantCount.toString()} {Number(rating.participantCount) === 1 ? 'participant' : 'participants'} have rated
                </p>
              </div>
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {showStats ? "Hide Statistics" : "Show Statistics"}
              </button>
            </div>

            {showStats && (
              <RatingStats
                dimensions={rating.dimensions}
                minScore={rating.minScore}
                maxScore={rating.maxScore}
                participantCount={rating.participantCount}
                isCreator={isCreator}
                onDecryptStats={isCreator ? handleDecryptStats : undefined}
                onDecryptMyRating={hasRated ? handleDecryptMyRating : undefined}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

