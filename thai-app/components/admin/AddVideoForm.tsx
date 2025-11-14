'use client';

import { useState } from "react";
import { Youtube, Loader2, Sparkles } from "lucide-react";
import axios from "axios";

interface AddVideoFormProps {
  onVideoAdded: (video: any) => void;
}

export default function AddVideoForm({ onVideoAdded }: AddVideoFormProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Video will be shared among all admins
      const response = await axios.post('/api/videos', {
        youtubeUrl
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
      <div className="text-center mb-8 relative">
        {/* Decorative lanterns */}
        <div className="absolute -top-4 left-1/4 w-8 h-8 bg-[#FFD166] rounded-full opacity-40"></div>
        <div className="absolute -top-2 right-1/4 w-6 h-6 bg-[#4ECDC4] rounded-full opacity-40"></div>
        
        <div className="inline-block relative">
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Youtube className="w-11 h-11 text-white" />
          </div>
          <Sparkles className="w-6 h-6 text-[#FFD166] absolute -top-1 -right-1 animate-pulse" />
        </div>
        
        <h2 className="text-3xl font-bold text-[#FF6B6B] mb-3" style={{ fontFamily: 'cursive' }}>
          Add New Video 🎵
        </h2>
        <p className="text-gray-700 font-semibold">
          Add a YouTube video - it will appear on the homepage gallery for all visitors to see and enjoy!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-gradient-to-r from-[#FF6B6B]/10 to-[#FFA07A]/10 border-4 border-[#FF6B6B] text-[#FF6B6B] px-6 py-4 rounded-2xl font-semibold shadow-lg">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border-4 border-[#4ECDC4] shadow-xl">
          <label htmlFor="youtubeUrl" className="block text-lg font-bold text-[#4ECDC4] mb-3" style={{ fontFamily: 'cursive' }}>
            YouTube URL
          </label>
          <input
            id="youtubeUrl"
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full px-5 py-4 border-[3px] border-[#95E1D3] rounded-xl focus:ring-4 focus:ring-[#4ECDC4] focus:border-[#4ECDC4] outline-none text-lg transition-all text-gray-900"
            placeholder="https://www.youtube.com/watch?v=..."
            required
            disabled={loading}
          />
          <div className="mt-4 bg-gradient-to-r from-[#FFD166]/20 to-[#FFBE76]/20 p-4 rounded-xl border-2 border-[#FFD166]">
            <p className="text-sm text-gray-700 font-semibold mb-2">✨ Supported formats:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
              <li>• https://youtu.be/VIDEO_ID</li>
              <li>• VIDEO_ID</li>
            </ul>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !youtubeUrl}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white py-4 rounded-2xl font-bold text-lg hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform hover:scale-105 border-4 border-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Adding Video...</span>
            </>
          ) : (
            <>
              <Youtube className="w-6 h-6" />
              <span>Add Video to Collection</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 bg-gradient-to-br from-[#95E1D3]/20 to-[#4ECDC4]/20 border-4 border-[#4ECDC4] rounded-2xl p-6 shadow-xl">
        <h3 className="font-bold text-xl text-[#4ECDC4] mb-4 flex items-center gap-2" style={{ fontFamily: 'cursive' }}>
          <Sparkles className="w-5 h-5" />
          How It Works
        </h3>
        <ol className="text-sm text-gray-700 space-y-3 list-none">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] text-white rounded-full flex items-center justify-center font-bold text-xs">1</span>
            <span className="font-semibold pt-1">Enter the YouTube URL and click "Add Video to Collection"</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3] text-white rounded-full flex items-center justify-center font-bold text-xs">2</span>
            <span className="font-semibold pt-1">Video details (title, thumbnail, description) are automatically fetched from YouTube</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-[#FFD166] to-[#FFBE76] text-white rounded-full flex items-center justify-center font-bold text-xs">3</span>
            <span className="font-semibold pt-1">The video <strong>immediately appears on the homepage</strong> for all visitors to watch</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-[#FFA07A] to-[#FF6B6B] text-white rounded-full flex items-center justify-center font-bold text-xs">4</span>
            <span className="font-semibold pt-1">Click "Edit" to add synchronized Thai lyrics with English translations using the lyrics editor</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-[#95E1D3] to-[#4ECDC4] text-white rounded-full flex items-center justify-center font-bold text-xs">5</span>
            <span className="font-semibold pt-1">Use "Auto-Import" in the editor to automatically generate lyrics from YouTube captions or AI transcription! 🎉</span>
          </li>
        </ol>

        <div className="mt-4 pt-4 border-t-2 border-[#4ECDC4]">
          <p className="text-xs text-gray-600 font-semibold">
            💡 <strong>Note:</strong> Videos appear on the homepage as colorful cards with thumbnails. Visitors can click to watch and see the synchronized lyrics you add!
          </p>
        </div>
      </div>
    </div>
  );
}