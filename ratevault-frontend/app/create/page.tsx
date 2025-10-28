"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/providers";

export default function CreatePage() {
  const router = useRouter();
  const { wallet, ratingVault } = useApp();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dimensions: ["", ""],
    minScore: 1,
    maxScore: 5,
    deadline: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addDimension = () => {
    if (formData.dimensions.length < 10) {
      setFormData({
        ...formData,
        dimensions: [...formData.dimensions, ""],
      });
    }
  };

  const removeDimension = (index: number) => {
    if (formData.dimensions.length > 2) {
      setFormData({
        ...formData,
        dimensions: formData.dimensions.filter((_, i) => i !== index),
      });
    }
  };

  const updateDimension = (index: number, value: string) => {
    const newDimensions = [...formData.dimensions];
    newDimensions[index] = value;
    setFormData({ ...formData, dimensions: newDimensions });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Rating name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.dimensions.some((d) => !d.trim())) {
      newErrors.dimensions = "All dimensions must have a name";
    }

    if (formData.minScore >= formData.maxScore) {
      newErrors.score = "Min score must be less than max score";
    }

    if (formData.deadline) {
      const deadlineTime = new Date(formData.deadline).getTime();
      if (deadlineTime <= Date.now()) {
        newErrors.deadline = "Deadline must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const deadlineTimestamp = formData.deadline
        ? Math.floor(new Date(formData.deadline).getTime() / 1000)
        : 0;

      const result = await ratingVault.createRating({
        name: formData.name,
        description: formData.description,
        dimensions: formData.dimensions,
        minScore: formData.minScore,
        maxScore: formData.maxScore,
        deadline: deadlineTimestamp,
      });

      if (result.success) {
        alert(`Rating created successfully! ID: ${result.ratingId}`);
        router.push(`/rating/${result.ratingId}`);
      } else {
        alert(`Failed to create rating: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="glass p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600">
              Please connect your wallet to create a rating
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-purple-600 mb-8">Create New Rating</h1>

        <form onSubmit={handleSubmit} className="glass p-8 rounded-xl space-y-6">
          {/* Rating Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
              placeholder="e.g., MacBook Pro M4 Review"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
              rows={3}
              placeholder="Describe what users will be rating..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Dimensions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dimensions * (2-10)
            </label>
            <div className="space-y-2">
              {formData.dimensions.map((dim, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={dim}
                    onChange={(e) => updateDimension(index, e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
                    placeholder={`Dimension ${index + 1} (e.g., Quality)`}
                  />
                  {formData.dimensions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeDimension(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formData.dimensions.length < 10 && (
              <button
                type="button"
                onClick={addDimension}
                className="mt-2 px-4 py-2 glass rounded-lg hover:bg-white/80 transition-colors"
              >
                + Add Dimension
              </button>
            )}
            {errors.dimensions && (
              <p className="text-red-500 text-sm mt-1">{errors.dimensions}</p>
            )}
          </div>

          {/* Score Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Score *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.minScore}
                onChange={(e) =>
                  setFormData({ ...formData, minScore: Number(e.target.value) })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Score *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxScore}
                onChange={(e) =>
                  setFormData({ ...formData, maxScore: Number(e.target.value) })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
              />
            </div>
            {errors.score && (
              <p className="text-red-500 text-sm col-span-2">{errors.score}</p>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
            />
            {errors.deadline && (
              <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Leave empty for no deadline
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || ratingVault.isLoading}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || ratingVault.isLoading
              ? "Creating..."
              : "Create Rating"}
          </button>

          {ratingVault.error && (
            <p className="text-red-500 text-sm text-center">{ratingVault.error}</p>
          )}
        </form>
      </div>
    </div>
  );
}

