"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface RatingStatsProps {
  dimensions: string[];
  minScore: number;
  maxScore: number;
  participantCount: bigint;
  isCreator: boolean;
  onDecryptStats?: () => Promise<number[]>;
  onDecryptMyRating?: () => Promise<number[]>;
}

export function RatingStats({
  dimensions,
  minScore,
  maxScore,
  participantCount,
  isCreator,
  onDecryptStats,
  onDecryptMyRating,
}: RatingStatsProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [statsDecrypted, setStatsDecrypted] = useState(false);
  const [myRatingDecrypted, setMyRatingDecrypted] = useState(false);
  const [aggregatedScores, setAggregatedScores] = useState<number[]>([]);
  const [myScores, setMyScores] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDecryptStats = async () => {
    if (!onDecryptStats) return;

    setIsDecrypting(true);
    setError(null);

    try {
      const scores = await onDecryptStats();
      setAggregatedScores(scores);
      setStatsDecrypted(true);
    } catch (err: any) {
      console.error("Decrypt stats error:", err);
      setError(err.message || "Failed to decrypt statistics");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDecryptMyRating = async () => {
    if (!onDecryptMyRating) return;

    setIsDecrypting(true);
    setError(null);

    try {
      const scores = await onDecryptMyRating();
      setMyScores(scores);
      setMyRatingDecrypted(true);
    } catch (err: any) {
      console.error("Decrypt my rating error:", err);
      setError(err.message || "Failed to decrypt your rating");
    } finally {
      setIsDecrypting(false);
    }
  };

  // Calculate average scores from aggregated scores
  const averageScores =
    statsDecrypted && participantCount > 0n
      ? aggregatedScores.map((total) => total / Number(participantCount))
      : [];

  // Prepare data for charts
  const barChartData = dimensions.map((dim, idx) => ({
    name: dim,
    average: averageScores[idx] || 0,
    myScore: myScores[idx] || 0,
  }));

  const radarChartData = dimensions.map((dim, idx) => ({
    dimension: dim,
    average: averageScores[idx] || 0,
    myScore: myScores[idx] || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Decrypt Buttons */}
      <div className="glass p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          📊 Rating Statistics
        </h2>

        <div className="flex flex-wrap gap-4">
          {isCreator && onDecryptStats && (
            <button
              onClick={handleDecryptStats}
              disabled={isDecrypting || statsDecrypted}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDecrypting
                ? "Decrypting..."
                : statsDecrypted
                ? "✅ Statistics Decrypted"
                : "🔓 Decrypt Statistics (Creator Only)"}
            </button>
          )}

          {onDecryptMyRating && (
            <button
              onClick={handleDecryptMyRating}
              disabled={isDecrypting || myRatingDecrypted}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDecrypting
                ? "Decrypting..."
                : myRatingDecrypted
                ? "✅ My Rating Decrypted"
                : "🔓 Decrypt My Rating"}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2">
            <span className="font-semibold">Total Participants:</span>{" "}
            {Number(participantCount)}
          </p>
          <p className="text-xs text-gray-500">
            🔒 All ratings are encrypted. Decryption requires your signature.
          </p>
        </div>
      </div>

      {/* My Rating Display */}
      {myRatingDecrypted && myScores.length > 0 && (
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Your Submitted Rating
          </h3>
          <div className="space-y-3">
            {dimensions.map((dim, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">{dim}:</span>
                <div className="flex items-center space-x-4">
                  <div className="w-48 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${
                          ((myScores[idx] - minScore) /
                            (maxScore - minScore)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="font-bold text-indigo-600 w-12 text-right">
                    {myScores[idx]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Charts */}
      {statsDecrypted && averageScores.length > 0 && (
        <>
          {/* Bar Chart */}
          <div className="glass p-6 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Average Scores by Dimension
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[minScore, maxScore]} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="average"
                  fill="#9333EA"
                  name="Average Score"
                  radius={[8, 8, 0, 0]}
                />
                {myRatingDecrypted && (
                  <Bar
                    dataKey="myScore"
                    fill="#4F46E5"
                    name="My Score"
                    radius={[8, 8, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="glass p-6 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Multi-Dimensional View
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis domain={[minScore, maxScore]} />
                <Radar
                  name="Average Score"
                  dataKey="average"
                  stroke="#9333EA"
                  fill="#9333EA"
                  fillOpacity={0.6}
                />
                {myRatingDecrypted && (
                  <Radar
                    name="My Score"
                    dataKey="myScore"
                    stroke="#4F46E5"
                    fill="#4F46E5"
                    fillOpacity={0.4}
                  />
                )}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Statistics */}
          <div className="glass p-6 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Summary</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {dimensions.map((dim, idx) => (
                <div key={idx} className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {dim}
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-purple-600">
                      {averageScores[idx].toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {maxScore}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Total: {aggregatedScores[idx]} (from{" "}
                    {Number(participantCount)} participants)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Placeholder when not decrypted */}
      {!statsDecrypted && !myRatingDecrypted && (
        <div className="glass p-12 rounded-xl text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Encrypted Data
          </h3>
          <p className="text-gray-600">
            Click the decrypt button above to view statistics and ratings
          </p>
        </div>
      )}
    </div>
  );
}


