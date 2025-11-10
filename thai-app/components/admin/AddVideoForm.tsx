'use client';

import { useState } from "react";
import { Youtube, Loader2 } from "lucide-react";
import axios from "axios";

interface AddVideoFormProps {
  onVideoAdded: (video: any) => void;
  adminId: string;
}

export default function AddVideoForm({ onVideoAdded, adminId }: AddVideoFormProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post('/api/videos', {
        youtubeUrl,
        adminId
      });

      onVideoAdded(response.data);
      setYoutubeUrl("");
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Youtube className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add New Video
        </h2>
        <p className="text-gray-600">
          Paste a YouTube URL to add a new video to your collection
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-2">
            YouTube URL
          </label>
          <input
            id="youtubeUrl"
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent outline-none"
            placeholder="https://www.youtube.com/watch?v=..."
            required
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-2">
            Supported formats:
            <br />
            • https://www.youtube.com/watch?v=VIDEO_ID
            <br />
            • https://youtu.be/VIDEO_ID
            <br />
            • VIDEO_ID
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !youtubeUrl}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-pink-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Adding Video...</span>
            </>
          ) : (
            <>
              <Youtube className="w-5 h-5" />
              <span>Add Video</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Add the video using the form above</li>
          <li>The video details will be fetched automatically from YouTube</li>
          <li>Click on the video to add and edit lyrics with timestamps</li>
          <li>Save your changes and the video will appear on the main site</li>
        </ol>
      </div>
    </div>
  );
}
