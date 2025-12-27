'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Music, Trash2, Edit, ExternalLink, Sparkles } from "lucide-react";
import axios from "axios";

interface VideoListProps {
  videos: any[];
  onVideoDeleted: (videoId: string) => void;
}

export default function VideoList({ videos, onVideoDeleted }: VideoListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (videoId: string, youtubeId: string) => {
    if (!confirm('Are you sure you want to delete this video and all its lyrics?')) {
      return;
    }

    setDeletingId(videoId);
    try {
      await axios.delete(`/api/videos/${videoId}`);
      onVideoDeleted(videoId);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    } finally {
      setDeletingId(null);
    }
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3] rounded-full flex items-center justify-center shadow-xl">
            <Music className="w-12 h-12 text-white" />
          </div>
          <Sparkles className="w-6 h-6 text-[#FFD166] absolute -top-2 -right-2 animate-pulse" />
        </div>
        <p className="text-gray-600 text-2xl font-bold mb-2" style={{ fontFamily: 'cursive' }}>
          No videos yet! 🎵
        </p>
        <p className="text-gray-500 text-sm mt-2">Add your first video to start the party!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {videos.map((video, index) => {
        // Alternate colors for each video card
        const colors = [
          { border: 'border-[#FF6B6B]', bg: 'from-[#FF6B6B]/5 to-[#FFA07A]/5', accent: 'text-[#FF6B6B]' },
          { border: 'border-[#4ECDC4]', bg: 'from-[#4ECDC4]/5 to-[#95E1D3]/5', accent: 'text-[#4ECDC4]' },
          { border: 'border-[#FFD166]', bg: 'from-[#FFD166]/5 to-[#FFBE76]/5', accent: 'text-[#FFD166]' },
          { border: 'border-[#FFA07A]', bg: 'from-[#FFA07A]/5 to-[#FF6B6B]/5', accent: 'text-[#FFA07A]' },
        ];
        const colorTheme = colors[index % colors.length];

        return (
          <div
            key={video.id}
            className={`bg-gradient-to-br ${colorTheme.bg} rounded-2xl p-5 border-4 ${colorTheme.border} shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02]`}
          >
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <div className={`relative w-48 h-28 bg-gray-200 rounded-xl overflow-hidden border-[3px] ${colorTheme.border} shadow-lg`}>
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Music className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-xl ${colorTheme.accent} mb-2 truncate`} style={{ fontFamily: 'cursive' }}>
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3 font-medium">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className={`flex items-center gap-2 ${colorTheme.accent} font-bold bg-white px-3 py-1.5 rounded-full shadow-md`}>
                    <Music className="w-4 h-4" />
                    {video.lyrics?.length || 0} lyrics
                  </span>
                  {video.duration && (
                    <span className="flex items-center gap-1 text-gray-600 font-semibold bg-white px-3 py-1.5 rounded-full shadow-md">
                      ⏱️ {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex flex-col justify-center gap-2">
                <Link
                  href={`/admin/videos/${video.id}/edit`}
                  className="p-3 bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white rounded-xl hover:from-[#95E1D3] hover:to-[#4ECDC4] transition-all shadow-lg transform hover:scale-110"
                  title="Edit video and lyrics"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <a
                  href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-xl hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all shadow-lg transform hover:scale-110"
                  title="View on YouTube"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button
                  onClick={() => handleDelete(video.id, video.youtubeId)}
                  disabled={deletingId === video.id}
                  className="p-3 bg-gradient-to-r from-[#FFD166] to-[#FFBE76] text-white rounded-xl hover:from-[#FFBE76] hover:to-[#FFD166] transition-all shadow-lg transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete video"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}