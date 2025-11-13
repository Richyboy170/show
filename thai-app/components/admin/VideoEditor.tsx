'use client';

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import YouTube, { YouTubeProps } from "react-youtube";
import { ArrowLeft, Plus, Save, Trash2, Play, Pause, Sparkles, Music, Download } from "lucide-react";
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
  const [autoImporting, setAutoImporting] = useState(false);
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

  const autoImportLyrics = async () => {
    if (lyrics.length > 0) {
      const confirmed = confirm('This will replace all existing lyrics. Are you sure you want to continue?');
      if (!confirmed) return;
    }

    setAutoImporting(true);
    try {
      const response = await axios.post('/api/lyrics/auto-import', {
        videoId: video.id
      });

      if (response.data.success) {
        alert(`Successfully imported ${response.data.lyricsCount} lyric lines!`);
        // Reload the page to show the new lyrics
        router.refresh();
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error auto-importing lyrics:', error);
      const errorMessage = error.response?.data?.error || 'Failed to auto-import lyrics';
      alert(errorMessage);
    } finally {
      setAutoImporting(false);
    }
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Party Lantern Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-10 left-[8%] w-12 h-12 bg-[#FFD166] rounded-full shadow-lg"></div>
        <div className="absolute top-5 right-[12%] w-14 h-14 bg-[#FF6B6B] rounded-full shadow-lg"></div>
        <div className="absolute top-20 left-[25%] w-10 h-10 bg-[#4ECDC4] rounded-full shadow-lg"></div>
        <div className="absolute bottom-32 right-[18%] w-12 h-12 bg-[#FFA07A] rounded-full shadow-lg"></div>
        <div className="absolute bottom-20 left-[30%] w-10 h-10 bg-[#95E1D3] rounded-full shadow-lg"></div>
        <div className="absolute top-1/2 right-[8%] w-8 h-8 bg-[#FFBE76] rounded-full shadow-lg"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/95 backdrop-blur-md shadow-lg border-b-4 border-[#FF6B6B] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-gray-700 hover:text-[#FF6B6B] transition-colors font-semibold rounded-lg px-3 py-2 hover:bg-[#FFD166]/10"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={saveLyrics}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-xl hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all disabled:opacity-50 shadow-lg font-bold transform hover:scale-105"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save All Lyrics'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Video Info */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-4 border-[#4ECDC4]">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3] rounded-full flex items-center justify-center flex-shrink-0">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#FF6B6B] mb-2" style={{ fontFamily: 'cursive' }}>
                {video.title}
              </h1>
              {video.description && (
                <p className="text-gray-600">{video.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Player */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-[#FFD166]">
            <h2 className="text-2xl font-bold mb-4 text-[#FFD166] flex items-center gap-2" style={{ fontFamily: 'cursive' }}>
              <Sparkles className="w-6 h-6" />
              Video Player
            </h2>
            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 border-4 border-[#FFBE76] shadow-lg">
              <YouTube
                videoId={video.youtubeId}
                opts={opts}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
              />
            </div>
            <div className="flex items-center justify-between bg-gradient-to-r from-[#95E1D3]/20 to-[#4ECDC4]/20 p-4 rounded-xl border-2 border-[#4ECDC4]">
              <span className="text-sm font-bold text-gray-700">
                ⏱️ Current Time: <span className="text-[#4ECDC4]">{currentTime.toFixed(2)}s</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={autoImportLyrics}
                  disabled={autoImporting}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFD166] to-[#FFBE76] text-white rounded-lg hover:from-[#FFBE76] hover:to-[#FFD166] transition-all shadow-lg font-bold transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Auto-import lyrics from video transcript"
                >
                  <Download className="w-4 h-4" />
                  {autoImporting ? 'Importing...' : 'Auto-Import'}
                </button>
                <button
                  onClick={addLyric}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white rounded-lg hover:from-[#95E1D3] hover:to-[#4ECDC4] transition-all shadow-lg font-bold transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Add Lyric Here
                </button>
              </div>
            </div>
          </div>

          {/* Lyrics Editor */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-[#FFA07A]">
            <h2 className="text-2xl font-bold mb-4 text-[#FF6B6B] flex items-center gap-2" style={{ fontFamily: 'cursive' }}>
              <Music className="w-6 h-6" />
              Lyrics ({lyrics.length})
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {lyrics.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-[#FFD166]/10 to-[#FFBE76]/10 rounded-2xl border-4 border-dashed border-[#FFD166]">
                  <Music className="w-16 h-16 text-[#FFD166] mx-auto mb-3" />
                  <p className="text-gray-600 font-bold text-lg" style={{ fontFamily: 'cursive' }}>
                    No lyrics yet! 🎵
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Click "Add Lyric" to get started
                  </p>
                </div>
              ) : (
                lyrics.map((lyric, index) => {
                  const isActive = currentTime >= lyric.startTime && currentTime <= lyric.endTime;
                  return (
                    <div
                      key={index}
                      className={`rounded-2xl p-4 transition-all ${
                        isActive
                          ? 'border-4 border-[#FF6B6B] bg-gradient-to-br from-[#FF6B6B]/10 to-[#FFA07A]/10 shadow-xl scale-105'
                          : 'border-[3px] border-[#95E1D3] bg-white shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => seekTo(lyric.startTime)}
                            className="p-2 bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white rounded-lg hover:from-[#95E1D3] hover:to-[#4ECDC4] transition-all shadow-md transform hover:scale-110"
                            title="Jump to this lyric"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold text-white bg-gradient-to-r from-[#FFD166] to-[#FFBE76] px-3 py-1 rounded-full">
                            #{index + 1}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteLyric(index)}
                          className="p-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-lg hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all shadow-md transform hover:scale-110"
                          title="Delete lyric"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-[#4ECDC4] mb-1 uppercase">
                            🇹🇭 Thai Text
                          </label>
                          <textarea
                            value={lyric.thaiText}
                            onChange={(e) => updateLyric(index, 'thaiText', e.target.value)}
                            className="w-full px-3 py-2 border-[3px] border-[#4ECDC4] rounded-xl focus:ring-4 focus:ring-[#4ECDC4] focus:border-[#4ECDC4] outline-none thai-text text-lg bg-[#4ECDC4]/5"
                            rows={2}
                            placeholder="ใส่เนื้อเพลงภาษาไทย..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#FFD166] mb-1 uppercase">
                            🇬🇧 Translation
                          </label>
                          <textarea
                            value={lyric.translation}
                            onChange={(e) => updateLyric(index, 'translation', e.target.value)}
                            className="w-full px-3 py-2 border-[3px] border-[#FFD166] rounded-xl focus:ring-4 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none bg-[#FFD166]/5"
                            rows={2}
                            placeholder="Enter English translation..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor={`start-time-${index}`} className="block text-xs font-bold text-[#FF6B6B] mb-1 uppercase">
                              ⏱️ Start (s)
                            </label>
                            <input
                              id={`start-time-${index}`}
                              type="number"
                              step="0.1"
                              value={lyric.startTime}
                              onChange={(e) => updateLyric(index, 'startTime', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border-[3px] border-[#FF6B6B] rounded-xl focus:ring-4 focus:ring-[#FF6B6B] focus:border-[#FF6B6B] outline-none font-bold bg-[#FF6B6B]/5"
                              aria-label="Start time in seconds"
                            />
                          </div>
                          <div>
                            <label htmlFor={`end-time-${index}`} className="block text-xs font-bold text-[#FFA07A] mb-1 uppercase">
                              ⏱️ End (s)
                            </label>
                            <input
                              id={`end-time-${index}`}
                              type="number"
                              step="0.1"
                              value={lyric.endTime}
                              onChange={(e) => updateLyric(index, 'endTime', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border-[3px] border-[#FFA07A] rounded-xl focus:ring-4 focus:ring-[#FFA07A] focus:border-[#FFA07A] outline-none font-bold bg-[#FFA07A]/5"
                              aria-label="End time in seconds"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}