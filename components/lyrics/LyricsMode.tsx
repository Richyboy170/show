'use client';

import { useState, useRef, useEffect } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import {
    ArrowLeft,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Music
} from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamically import SheetMusic (client-only)
const SheetMusic = dynamic(() => import('@/components/SheetMusic'), { ssr: false });

interface Lyric {
    id: string;
    thaiText: string;
    translation?: string;
    chords?: string;
    pianoNotes?: string;
    startTime: number;
    endTime: number;
    order: number;
}

interface Video {
    id: string;
    youtubeId: string;
    title: string;
    description?: string;
    lyrics: Lyric[];
}

interface LyricsModeProps {
    video: Video;
    onExit: () => void;
}

export default function LyricsMode({ video, onExit }: LyricsModeProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [currentLyricIndex, setCurrentLyricIndex] = useState<number | null>(null);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
    const playerRef = useRef<any>(null);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const lastScrolledIndexRef = useRef<number>(-1);
    const isProgrammaticScrollRef = useRef(false);

    const onPlayerReady: YouTubeProps['onReady'] = (event) => {
        playerRef.current = event.target;
        setDuration(event.target.getDuration());
        setIsPlayerReady(true);
    };

    const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
        setIsPlaying(event.data === 1);

        // Handle video end for repeat
        if (event.data === 0) { // Ended
            if (repeatMode === 'one' || repeatMode === 'all') {
                playerRef.current?.seekTo(0);
                playerRef.current?.playVideo();
            }
        }
    };

    // Update time continuously (even when paused) and find active lyric
    useEffect(() => {
        if (!isPlayerReady) return;

        const interval = setInterval(() => {
            if (playerRef.current) {
                const time = playerRef.current.getCurrentTime();
                setCurrentTime(time);

                // Update duration if it changes
                const newDuration = playerRef.current.getDuration();
                if (newDuration && newDuration !== duration) {
                    setDuration(newDuration);
                }

                // Find current lyric
                const index = video.lyrics.findIndex(
                    (lyric) => time >= lyric.startTime && time <= lyric.endTime
                );
                setCurrentLyricIndex(index);

                // Auto-scroll to current lyric
                if (index !== -1 && index !== lastScrolledIndexRef.current && lyricsContainerRef.current) {
                    const lyricElement = document.getElementById(`lyrics-mode-lyric-${index}`);
                    if (lyricElement) {
                        lastScrolledIndexRef.current = index;
                        isProgrammaticScrollRef.current = true;
                        lyricElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        setTimeout(() => {
                            isProgrammaticScrollRef.current = false;
                        }, 500);
                    }
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isPlayerReady, video.lyrics, duration]);

    const togglePlayPause = () => {
        if (playerRef.current) {
            if (isPlaying) {
                playerRef.current.pauseVideo();
            } else {
                playerRef.current.playVideo();
            }
        }
    };

    const seekTo = (time: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(time);
        }
    };

    const skipToPrevious = () => {
        // Go to previous lyric or beginning
        if (currentLyricIndex && currentLyricIndex > 0) {
            seekTo(video.lyrics[currentLyricIndex - 1].startTime);
        } else {
            seekTo(0);
        }
    };

    const skipToNext = () => {
        // Go to next lyric
        const nextIndex = (currentLyricIndex ?? -1) + 1;
        if (nextIndex < video.lyrics.length) {
            seekTo(video.lyrics[nextIndex].startTime);
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;
        seekTo(newTime);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getRemainingTime = (): string => {
        const remaining = duration - currentTime;
        return `-${formatTime(remaining)}`;
    };

    const opts: YouTubeProps['opts'] = {
        height: '1',
        width: '1',
        playerVars: {
            autoplay: 0,
            controls: 0,
        },
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black z-50 flex flex-col">
            {/* Hidden YouTube player for audio */}
            <div className="absolute opacity-0 pointer-events-none" style={{ width: 1, height: 1 }}>
                <YouTube
                    videoId={video.youtubeId}
                    opts={opts}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                />
            </div>

            {/* Header with back button */}
            <header className="flex items-center justify-between px-4 py-3 bg-black/50">
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Exit Lyrics Mode</span>
                </button>
                <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-[#FF6B6B]" />
                    <span className="text-white/60 text-sm">Lyrics Mode</span>
                </div>
            </header>

            {/* Song Title */}
            <div className="px-6 py-4 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {video.title}
                </h1>
            </div>

            {/* Lyrics Display - Main Area */}
            <div
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-16 py-8"
            >
                <div className="max-w-3xl mx-auto space-y-8">
                    {video.lyrics.length === 0 ? (
                        <div className="text-center py-20">
                            <Music className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/50 text-lg">No lyrics available</p>
                        </div>
                    ) : (
                        video.lyrics.map((lyric, index) => {
                            const isActive = currentLyricIndex === index;
                            const isPast = currentTime > lyric.endTime;

                            return (
                                <div
                                    key={lyric.id}
                                    id={`lyrics-mode-lyric-${index}`}
                                    onClick={() => {
                                        seekTo(lyric.startTime);
                                        if (!isPlaying) {
                                            playerRef.current?.playVideo();
                                        }
                                    }}
                                    className={`cursor-pointer transition-all duration-500 py-4 px-6 rounded-2xl ${isActive
                                        ? 'bg-white/10 scale-105'
                                        : 'hover:bg-white/5'
                                        }`}
                                >
                                    {/* Chords - Large and prominent */}
                                    {lyric.chords && (
                                        <p className={`font-mono font-bold text-lg sm:text-xl mb-2 transition-all duration-300 ${isActive
                                            ? 'text-[#4ECDC4]'
                                            : isPast
                                                ? 'text-white/30'
                                                : 'text-white/50'
                                            }`}>
                                            {lyric.chords}
                                        </p>
                                    )}

                                    {/* Thai Lyrics - Main Focus */}
                                    <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold leading-relaxed transition-all duration-300 ${isActive
                                        ? 'text-white scale-100'
                                        : isPast
                                            ? 'text-white/30 scale-95'
                                            : 'text-white/60 scale-95'
                                        }`}>
                                        {lyric.thaiText}
                                    </p>

                                    {/* Translation */}
                                    {lyric.translation && (
                                        <p className={`text-base sm:text-lg mt-2 italic transition-all duration-300 ${isActive ? 'text-white/70' : 'text-white/30'
                                            }`}>
                                            {lyric.translation}
                                        </p>
                                    )}

                                    {/* Piano Notes - Sheet Music */}
                                    {lyric.pianoNotes && (
                                        <div className={`mt-3 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                                            <div className="bg-white rounded-lg p-2 inline-block">
                                                <SheetMusic
                                                    notation={lyric.pianoNotes}
                                                    lineHeight={50}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* Bottom padding for scroll */}
                    <div className="h-32"></div>
                </div>
            </div>

            {/* Audio Player Bar - Bottom */}
            <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 safe-area-bottom">
                {/* Progress Bar */}
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-white/60 w-10 text-right font-mono">
                        {formatTime(currentTime)}
                    </span>
                    <div
                        className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer group"
                        onClick={handleProgressClick}
                    >
                        <div
                            className="h-full bg-white rounded-full relative transition-all group-hover:bg-[#FF6B6B]"
                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        >
                            {/* Scrubber dot */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                        </div>
                    </div>
                    <span className="text-xs text-white/60 w-10 font-mono">
                        {getRemainingTime()}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                    {/* Shuffle */}
                    <button
                        onClick={() => setIsShuffle(!isShuffle)}
                        className={`p-2 transition-colors ${isShuffle ? 'text-[#4ECDC4]' : 'text-white/60 hover:text-white'}`}
                    >
                        <Shuffle className="w-5 h-5" />
                    </button>

                    {/* Previous */}
                    <button
                        onClick={skipToPrevious}
                        className="p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <SkipBack className="w-6 h-6" fill="currentColor" />
                    </button>

                    {/* Play/Pause - Main Button */}
                    <button
                        onClick={togglePlayPause}
                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                    >
                        {isPlaying ? (
                            <Pause className="w-7 h-7 text-black" fill="black" />
                        ) : (
                            <Play className="w-7 h-7 text-black ml-1" fill="black" />
                        )}
                    </button>

                    {/* Next */}
                    <button
                        onClick={skipToNext}
                        className="p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <SkipForward className="w-6 h-6" fill="currentColor" />
                    </button>

                    {/* Repeat */}
                    <button
                        onClick={() => {
                            const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
                            const currentIndex = modes.indexOf(repeatMode);
                            setRepeatMode(modes[(currentIndex + 1) % 3]);
                        }}
                        className={`p-2 transition-colors relative ${repeatMode !== 'off' ? 'text-[#4ECDC4]' : 'text-white/60 hover:text-white'}`}
                    >
                        <Repeat className="w-5 h-5" />
                        {repeatMode === 'one' && (
                            <span className="absolute -top-1 -right-1 text-[10px] font-bold text-[#4ECDC4]">1</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
