'use client';

import { useState, useRef, useEffect } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { ArrowLeft, Music, Heart, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Party Lantern Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-10 left-[8%] w-12 h-12 bg-[#FFD166] rounded-full shadow-lg"></div>
        <div className="absolute top-5 right-[12%] w-14 h-14 bg-[#FF6B6B] rounded-full shadow-lg"></div>
        <div className="absolute top-20 left-[25%] w-10 h-10 bg-[#4ECDC4] rounded-full shadow-lg"></div>
        <div className="absolute top-1/3 right-[8%] w-12 h-12 bg-[#FFA07A] rounded-full shadow-lg"></div>
        <div className="absolute top-1/2 left-[10%] w-10 h-10 bg-[#95E1D3] rounded-full shadow-lg"></div>
        <div className="absolute bottom-32 right-[15%] w-12 h-12 bg-[#FFBE76] rounded-full shadow-lg"></div>
        <div className="absolute bottom-20 left-[20%] w-10 h-10 bg-[#FF6B6B] rounded-full shadow-lg"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/95 backdrop-blur-md shadow-lg border-b-4 border-[#FF6B6B] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-[#FF6B6B] transition-colors font-semibold rounded-lg px-3 py-2 hover:bg-[#FFD166]/10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Video Title */}
        <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border-4 border-[#4ECDC4]">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <Music className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-[#FF6B6B] mb-2" style={{ fontFamily: 'cursive' }}>
                {video.title}
              </h1>
              {video.description && (
                <p className="text-gray-700 font-medium">{video.description}</p>
              )}
            </div>
            <Heart className="w-8 h-8 text-[#FF6B6B] fill-[#FF6B6B] animate-pulse flex-shrink-0" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-[#FFD166]">
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
            <div className="bg-white rounded-2xl shadow-2xl p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col border-4 border-[#FFA07A]">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#FF6B6B]" style={{ fontFamily: 'cursive' }}>
                <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                Lyrics
                <Sparkles className="w-5 h-5 text-[#FFD166]" />
              </h2>

              {video.lyrics.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center bg-gradient-to-br from-[#4ECDC4]/10 to-[#95E1D3]/10 rounded-2xl p-8 border-4 border-dashed border-[#4ECDC4]">
                    <div className="relative inline-block mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3] rounded-full flex items-center justify-center">
                        <Music className="w-10 h-10 text-white" />
                      </div>
                      <Sparkles className="w-6 h-6 text-[#FFD166] absolute -top-2 -right-2" />
                    </div>
                    <p className="text-gray-600 font-bold text-lg" style={{ fontFamily: 'cursive' }}>
                      No lyrics yet! 🎵
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  ref={lyricsContainerRef}
                  className="flex-1 overflow-y-auto space-y-3 pr-2"
                >
                  {video.lyrics.map((lyric, index) => {
                    const isActive = currentLyricIndex === index;
                    const isPast = currentTime > lyric.endTime;
                    const isFuture = currentTime < lyric.startTime;

                    // Color themes for different states
                    let borderColor = 'border-[#95E1D3]';
                    let bgColor = 'bg-white';
                    let textColor = 'text-gray-900';
                    let subTextColor = 'text-gray-600';
                    
                    if (isActive) {
                      borderColor = 'border-[#FF6B6B]';
                      bgColor = 'bg-gradient-to-br from-[#FF6B6B]/10 to-[#FFA07A]/10';
                      textColor = 'text-[#FF6B6B]';
                      subTextColor = 'text-[#FFA07A]';
                    } else if (isPast) {
                      borderColor = 'border-[#4ECDC4]/30';
                      bgColor = 'bg-[#4ECDC4]/5';
                      textColor = 'text-gray-500';
                      subTextColor = 'text-gray-400';
                    }

                    return (
                      <div
                        key={lyric.id}
                        id={`lyric-${index}`}
                        onClick={() => seekToLyric(lyric.startTime)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border-[3px] ${borderColor} ${bgColor} hover:shadow-lg ${
                          isActive ? 'shadow-xl scale-105 ring-4 ring-[#FF6B6B]/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white px-3 py-1 rounded-full">
                            {Math.floor(lyric.startTime / 60)}:{(lyric.startTime % 60).toFixed(0).padStart(2, '0')}
                          </span>
                          {isActive && (
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-[#FF6B6B] rounded-full animate-pulse-delay-1"></div>
                              <div className="w-2 h-2 bg-[#FFD166] rounded-full animate-pulse-delay-2"></div>
                              <div className="w-2 h-2 bg-[#4ECDC4] rounded-full animate-pulse-delay-3"></div>
                            </div>
                          )}
                        </div>
                        <p
                          className={`thai-text mb-2 font-bold ${
                            isActive ? 'text-2xl' : 'text-lg'
                          } ${textColor}`}
                          style={isActive ? { fontFamily: 'cursive' } : {}}
                        >
                          {lyric.thaiText}
                        </p>
                        {lyric.translation && (
                          <p
                            className={`text-sm font-semibold ${subTextColor}`}
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