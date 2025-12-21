'use client';

import { useState, useRef, useEffect } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { ArrowLeft, Music, Heart, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ExpandableDescription from "@/components/ExpandableDescription";
import dynamic from 'next/dynamic';

// Dynamically import SheetMusic (client-only)
const SheetMusic = dynamic(() => import('@/components/SheetMusic'), { ssr: false });

interface LyricWord {
  id: string;
  text: string;
  startTime: number;
  duration: number;
  order: number;
}

interface Lyric {
  id: string;
  thaiText: string;
  translation: string | null;
  chords?: string | null;
  pianoNotes?: string | null;
  section?: string | null;
  startTime: number;
  endTime: number;
  order: number;
  words?: LyricWord[];
}

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  lyrics: Lyric[];
}

export default function VideoPlayer({ video }: { video: Video }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const playerRef = useRef<any>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScrollRef = useRef(false);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    setIsPlaying(event.data === 1); // 1 = playing
  };

  // Detect manual scroll and disable auto-scroll (only if user initiated)
  const handleLyricsScroll = () => {
    // Ignore programmatic scrolls
    if (isProgrammaticScrollRef.current) {
      return;
    }
    // User is manually scrolling
    setAutoScroll(false);
  };

  // Check if video is favorited on mount
  useEffect(() => {
    if (session) {
      fetch(`/api/favorites/check?videoId=${video.id}`)
        .then(res => res.json())
        .then(data => setIsFavorited(data.isFavorited))
        .catch(err => console.error('Error checking favorite:', err));
    }
  }, [session, video.id]);

  // Track last scrolled index to avoid repeated scrolls
  const lastScrolledIndexRef = useRef<number>(-1);

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

      // Auto-scroll to current lyric (only if autoScroll is enabled and lyric changed)
      if (autoScroll && index !== -1 && index !== lastScrolledIndexRef.current && lyricsContainerRef.current) {
        const lyricElement = document.getElementById(`lyric-${index}`);
        if (lyricElement) {
          lastScrolledIndexRef.current = index;
          // Mark as programmatic scroll
          isProgrammaticScrollRef.current = true;
          lyricElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // Reset flag after scroll animation completes
          setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 500);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, video.lyrics, autoScroll]);

  const seekToLyric = (startTime: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(startTime);
      playerRef.current.playVideo();
    }
  };

  const handleFavoriteClick = () => {
    if (!session) {
      setShowSignInPrompt(true);
      return;
    }
    toggleFavorite();
  };

  const toggleFavorite = async () => {
    setIsLoadingFavorite(true);
    try {
      if (isFavorited) {
        // Unlike
        const res = await fetch(`/api/favorites?videoId=${video.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setIsFavorited(false);
        }
      } else {
        // Like
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: video.id })
        });
        if (res.ok) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoadingFavorite(false);
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 text-gray-700 hover:text-[#FF6B6B] transition-colors font-semibold rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-[#FFD166]/10 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
        {/* Video Title */}
        <div className="mb-4 sm:mb-6 lg:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-4 border-[#4ECDC4]">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <Music className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#FF6B6B] mb-1 sm:mb-2" style={{ fontFamily: 'cursive' }}>
                {video.title}
              </h1>
              {video.description && (
                <ExpandableDescription
                  description={video.description}
                  maxLines={3}
                  className="text-sm sm:text-base text-gray-700 font-medium"
                />
              )}
            </div>
            <button
              onClick={handleFavoriteClick}
              disabled={isLoadingFavorite}
              className={`flex-shrink-0 transition-all transform hover:scale-110 ${isLoadingFavorite ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              title={!session ? "Sign in to add to favorites" : isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 ${session && isFavorited
                  ? 'text-[#FF6B6B] fill-[#FF6B6B] animate-pulse'
                  : 'text-gray-400 hover:text-[#FF6B6B]'
                  }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Video Player - smaller */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border-4 border-[#FFD166] lg:sticky lg:top-24">
              <div className="relative aspect-video bg-black">
                <YouTube
                  videoId={video.youtubeId}
                  opts={opts}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                  className="absolute top-0 left-0 w-full h-full"
                  iframeClassName="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Lyrics Panel - larger */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:sticky lg:top-24 max-h-[500px] lg:max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col border-4 border-[#FFA07A]">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-[#FF6B6B]" style={{ fontFamily: 'cursive' }}>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-full flex items-center justify-center">
                  <Music className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  Lyrics
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD166]" />
                </div>
                {/* Auto Scroll Toggle Button */}
                {video.lyrics.length > 0 && !autoScroll && (
                  <button
                    onClick={() => setAutoScroll(true)}
                    className="text-xs px-3 py-1 bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white rounded-full font-bold hover:shadow-lg transition-all"
                  >
                    ▶ Auto Scroll
                  </button>
                )}
              </h2>

              {video.lyrics.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center bg-gradient-to-br from-[#4ECDC4]/10 to-[#95E1D3]/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-4 border-dashed border-[#4ECDC4]">
                    <div className="relative inline-block mb-3 sm:mb-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3] rounded-full flex items-center justify-center">
                        <Music className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD166] absolute -top-2 -right-2" />
                    </div>
                    <p className="text-gray-600 font-bold text-base sm:text-lg" style={{ fontFamily: 'cursive' }}>
                      No lyrics yet! 🎵
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  ref={lyricsContainerRef}
                  onScroll={handleLyricsScroll}
                  className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 px-3 py-3"
                >
                  {video.lyrics.map((lyric, index) => {
                    const isActive = currentLyricIndex === index;
                    const isPast = currentTime > lyric.endTime;

                    // Colorful theme from old design
                    let borderColor = 'border-[#95E1D3]';
                    let bgColor = 'bg-white';
                    let textColor = 'text-gray-900';
                    let chordColor = 'text-[#4ECDC4]';

                    if (isActive) {
                      borderColor = 'border-[#FF6B6B]';
                      bgColor = 'bg-gradient-to-br from-[#FF6B6B]/10 to-[#FFA07A]/10';
                      textColor = 'text-[#FF6B6B]';
                      chordColor = 'text-[#FFD166]';
                    } else if (isPast) {
                      borderColor = 'border-[#4ECDC4]/30';
                      bgColor = 'bg-[#4ECDC4]/5';
                      textColor = 'text-gray-500';
                      chordColor = 'text-gray-400';
                    }

                    return (
                      <div
                        key={lyric.id}
                        id={`lyric-${index}`}
                        onClick={() => seekToLyric(lyric.startTime)}
                        className={`p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 sm:border-[3px] ${borderColor} ${bgColor} hover:shadow-lg ${isActive ? 'shadow-xl scale-[1.03] ring-2 sm:ring-4 ring-[#FF6B6B]/20' : ''
                          }`}
                      >
                        {/* Chords - clean display above lyrics */}
                        {lyric.chords && (
                          <p className={`font-mono font-bold text-sm sm:text-base mb-1 ${chordColor}`}>
                            {lyric.chords}
                          </p>
                        )}

                        {/* Lyrics text - clean and readable */}
                        <p className={`text-base sm:text-lg font-medium leading-relaxed ${textColor}`}>
                          {lyric.thaiText}
                        </p>

                        {/* Translation */}
                        {lyric.translation && (
                          <p className="text-gray-500 text-xs sm:text-sm mt-1 italic">
                            {lyric.translation}
                          </p>
                        )}

                        {/* Piano Notes - rendered as sheet music */}
                        {lyric.pianoNotes && (
                          <div className={`mt-1 ${isActive ? 'sheet-music-active' : 'opacity-50'}`}>
                            <SheetMusic
                              notation={lyric.pianoNotes}
                              lineHeight={40}
                              width={150}
                            />
                          </div>
                        )}

                        {/* Timestamp at bottom - only for active lyric */}
                        {isActive && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="w-1.5 h-1.5 bg-[#FF6B6B] rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-gray-400">
                              {Math.floor(lyric.startTime / 60)}:{(lyric.startTime % 60).toFixed(0).padStart(2, '0')}
                            </span>
                          </div>
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

      {/* Cute Sign-In Prompt Modal */}
      {showSignInPrompt && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowSignInPrompt(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative border-4 border-[#FF6B6B] animate-bounceIn"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'bounceIn 0.5s ease-out' }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowSignInPrompt(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-[#FF6B6B] transition-colors"
              aria-label="Close sign-in prompt"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Decorative corner stickers */}
            <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-[#FFD166] to-[#FFBE76] rounded-full shadow-lg flex items-center justify-center transform rotate-12 border-2 border-white">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3] rounded-full shadow-lg flex items-center justify-center transform -rotate-12 border-2 border-white">
              <Music className="w-5 h-5 text-white" />
            </div>

            {/* Content */}
            <div className="text-center mt-2">
              {/* Big heart icon */}
              <div className="mb-4 relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-full flex items-center justify-center shadow-xl">
                  <Heart className="w-10 h-10 text-white fill-white animate-pulse" />
                </div>
                {/* Sparkle decorations */}
                <Sparkles className="w-6 h-6 text-[#FFD166] absolute -top-2 -right-2 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <Sparkles className="w-5 h-5 text-[#4ECDC4] absolute -bottom-1 -left-1 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>

              {/* Cute message */}
              <h3 className="text-2xl sm:text-3xl font-bold text-[#FF6B6B] mb-3" style={{ fontFamily: 'cursive' }}>
                Oops! Almost there!
              </h3>
              <p className="text-base sm:text-lg text-gray-700 mb-2 font-semibold">
                You need to sign in to save your favorite songs!
              </p>
              <p className="text-sm sm:text-base text-gray-600 mb-6 italic">
                Join the party and keep all your favorites in one place!
              </p>

              {/* Decorative dots */}
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-[#FF6B6B] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-[#FFD166] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#4ECDC4] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[#FFA07A] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-2 h-2 bg-[#95E1D3] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="flex-1 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  <span>Sign In Now!</span>
                </button>
                <button
                  onClick={() => setShowSignInPrompt(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-full shadow hover:shadow-lg hover:bg-gray-200 transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}