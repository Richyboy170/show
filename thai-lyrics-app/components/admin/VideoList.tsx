'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Music, Trash2, Edit, ExternalLink } from "lucide-react";
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
      <div className="text-center py-12">
        <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No videos yet</p>
        <p className="text-gray-400 text-sm mt-2">Add your first video to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
        >
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <div className="relative w-40 h-24 bg-gray-200 rounded-lg overflow-hidden">
                {video.thumbnailUrl ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 truncate">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {video.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  {video.lyrics?.length || 0} lyrics
                </span>
                {video.duration && (
                  <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <Link
                href={`/admin/videos/${video.id}/edit`}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit video and lyrics"
              >
                <Edit className="w-5 h-5" />
              </Link>
              <a
                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="View on YouTube"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <button
                onClick={() => handleDelete(video.id, video.youtubeId)}
                disabled={deletingId === video.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete video"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
