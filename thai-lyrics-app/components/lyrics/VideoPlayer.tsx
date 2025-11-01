'use client';

import { useState, useRef, useEffect } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { ArrowLeft, Music } from "lucide-react";
import Link from "next/link";

interface Lyric {
  id: string;
  thaiText: string;
  translation: string | null;
  startTime: number;
  endTime: number;
  order: number;
}

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  lyrics: Lyric[];
}

export default function VideoPlayer({ video }: { video: Video }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number | null>(null);
  const playerRef = useRef<any>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    setIsPlaying(event.data === 1); // 1 = playing
  };

  // Update current time and find active lyric
  useEffect(() => {
    if (!isPlaying || !playerRef.current) return;

    const interval = setInterval(() => {
      const time = playerRef.current.getCurrentTime();
      setCurrentTime(time);

      // Find current lyric
      const index = video.lyrics.findIndex(
        (lyric) => time >= lyric.startTime && time <= lyric.endTime
      );
      setCurrentLyricIndex(index);

      // Auto-scroll to current lyric
      if (index !== -1 && lyricsContainerRef.current) {
        const lyricElement = document.getElementById(`lyric-${index}`);
        if (lyricElement) {
          lyricElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, video.lyrics]);

  const seekToLyric = (startTime: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(startTime);
      playerRef.current.playVideo();
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
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
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Video Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{video.title}</h1>
          {video.description && (
            <p className="text-gray-600">{video.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="aspect-video bg-black">
                <YouTube
                  videoId={video.youtubeId}
                  opts={opts}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Lyrics Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-pink-600" />
                Lyrics
              </h2>

              {video.lyrics.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p>No lyrics available yet</p>
                  </div>
                </div>
              ) : (
                <div
                  ref={lyricsContainerRef}
                  className="flex-1 overflow-y-auto space-y-4 pr-2"
                >
                  {video.lyrics.map((lyric, index) => {
                    const isActive = currentLyricIndex === index;
                    const isPast = currentTime > lyric.endTime;
                    const isFuture = currentTime < lyric.startTime;

                    return (
                      <div
                        key={lyric.id}
                        id={`lyric-${index}`}
                        onClick={() => seekToLyric(lyric.startTime)}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-300 lyric-line ${
                          isActive
                            ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-500 shadow-md active'
                            : isPast
                            ? 'bg-gray-50 border border-gray-200 past'
                            : 'bg-white border border-gray-200 hover:border-pink-300 future'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-gray-500">
                            {Math.floor(lyric.startTime / 60)}:{(lyric.startTime % 60).toFixed(0).padStart(2, '0')}
                          </span>
                        </div>
                        <p
                          className={`thai-text mb-2 ${
                            isActive ? 'text-xl font-bold text-pink-700' : 'text-lg text-gray-900'
                          }`}
                        >
                          {lyric.thaiText}
                        </p>
                        {lyric.translation && (
                          <p
                            className={`text-sm ${
                              isActive ? 'text-purple-700 font-medium' : 'text-gray-600'
                            }`}
                          >
                            {lyric.translation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
