'use client';

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import YouTube, { YouTubeProps } from "react-youtube";
import { ArrowLeft, Plus, Save, Trash2, Play, Pause } from "lucide-react";
import Link from "next/link";
import axios from "axios";

interface Lyric {
  id?: string;
  thaiText: string;
  translation: string;
  startTime: number;
  endTime: number;
  order: number;
}

export default function VideoEditor({ video }: { video: any }) {
  const router = useRouter();
  const [lyrics, setLyrics] = useState<Lyric[]>(video.lyrics || []);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const playerRef = useRef<any>(null);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    setIsPlaying(event.data === 1); // 1 = playing
  };

  const getCurrentTime = () => {
    if (playerRef.current) {
      return playerRef.current.getCurrentTime();
    }
    return 0;
  };

  const seekTo = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  };

  const addLyric = () => {
    const time = getCurrentTime();
    const newLyric: Lyric = {
      thaiText: "",
      translation: "",
      startTime: time,
      endTime: time + 5,
      order: lyrics.length
    };
    setLyrics([...lyrics, newLyric]);
  };

  const updateLyric = (index: number, field: keyof Lyric, value: any) => {
    const newLyrics = [...lyrics];
    newLyrics[index] = { ...newLyrics[index], [field]: value };
    setLyrics(newLyrics);
  };

  const deleteLyric = (index: number) => {
    const newLyrics = lyrics.filter((_, i) => i !== index);
    setLyrics(newLyrics);
  };

  const saveLyrics = async () => {
    setSaving(true);
    try {
      // Delete existing lyrics
      for (const lyric of video.lyrics) {
        await axios.delete(`/api/lyrics?id=${lyric.id}`);
      }

      // Create new lyrics
      for (let i = 0; i < lyrics.length; i++) {
        const lyric = lyrics[i];
        await axios.post('/api/lyrics', {
          videoId: video.id,
          thaiText: lyric.thaiText,
          translation: lyric.translation,
          startTime: lyric.startTime,
          endTime: lyric.endTime,
          order: i
        });
      }

      alert('Lyrics saved successfully!');
      router.push('/admin');
    } catch (error) {
      console.error('Error saving lyrics:', error);
      alert('Failed to save lyrics');
    } finally {
      setSaving(false);
    }
  };

  // Update current time periodically
  useState(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        setCurrentTime(getCurrentTime());
      }
    }, 100);

    return () => clearInterval(interval);
  });

  const opts: YouTubeProps['opts'] = {
    height: '400',
    width: '100%',
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={saveLyrics}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save All Lyrics'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Video Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
          {video.description && (
            <p className="text-gray-600 mb-4">{video.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Player */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Video Player</h2>
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <YouTube
                videoId={video.youtubeId}
                opts={opts}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Current Time: {currentTime.toFixed(2)}s</span>
              <button
                onClick={addLyric}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Lyric at Current Time
              </button>
            </div>
          </div>

          {/* Lyrics Editor */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">
              Lyrics ({lyrics.length})
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {lyrics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No lyrics yet. Click "Add Lyric" to get started!
                </div>
              ) : (
                lyrics.map((lyric, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      currentTime >= lyric.startTime && currentTime <= lyric.endTime
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => seekTo(lyric.startTime)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Jump to this lyric"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                          #{index + 1}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteLyric(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete lyric"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Thai Text
                        </label>
                        <textarea
                          value={lyric.thaiText}
                          onChange={(e) => updateLyric(index, 'thaiText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent outline-none thai-text text-lg"
                          rows={2}
                          placeholder="ใส่เนื้อเพลงภาษาไทย..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Translation
                        </label>
                        <textarea
                          value={lyric.translation}
                          onChange={(e) => updateLyric(index, 'translation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent outline-none"
                          rows={2}
                          placeholder="Enter English translation..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Start Time (s)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={lyric.startTime}
                            onChange={(e) => updateLyric(index, 'startTime', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            End Time (s)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={lyric.endTime}
                            onChange={(e) => updateLyric(index, 'endTime', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
