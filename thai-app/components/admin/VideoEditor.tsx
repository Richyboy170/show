'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import YouTube, { YouTubeProps } from "react-youtube";
import { ArrowLeft, Plus, Save, Trash2, Play, Pause, Sparkles, Music, Download, Piano } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import ExpandableDescription from "@/components/ExpandableDescription";

id ?: string;
thaiText: string;
translation: string;
chords ?: string;
pianoNotes ?: string;
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
  const [importProgress, setImportProgress] = useState(0);
  const [importMessage, setImportMessage] = useState('');
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [showChordHelper, setShowChordHelper] = useState<number | null>(null);
  const [generatingChords, setGeneratingChords] = useState(false);
  const [correctingLyrics, setCorrectingLyrics] = useState(false);
  const [generatingPiano, setGeneratingPiano] = useState(false);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Common chord progressions and quick access chords
  const commonChords = [
    'C', 'D', 'E', 'F', 'G', 'A', 'B',
    'Am', 'Dm', 'Em', 'Fm', 'Gm', 'Bm',
    'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
    'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7',
    'Csus4', 'Dsus4', 'Esus4', 'Fsus4', 'Gsus4', 'Asus4'
  ];

  const chordProgressions = [
    { name: 'I-V-vi-IV (Pop)', chords: 'C G Am F' },
    { name: 'I-IV-V (Rock)', chords: 'C F G' },
    { name: 'ii-V-I (Jazz)', chords: 'Dm G C' },
    { name: 'I-vi-IV-V (50s)', chords: 'C Am F G' },
    { name: 'vi-IV-I-V (Modern)', chords: 'Am F C G' },
    { name: 'I-V-vi-iii-IV', chords: 'C G Am Em F' },
    { name: 'I-IV-vi-V', chords: 'C F Am G' },
    { name: 'vi-V-IV-V', chords: 'Am G F G' },
  ];

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
      translation: "", // Keep for compatibility with existing data
      chords: "",
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

  const addChordToLyric = (index: number, chord: string) => {
    const currentChords = lyrics[index].chords || '';
    const newChords = currentChords ? `${currentChords} ${chord}` : chord;
    updateLyric(index, 'chords', newChords);
  };

  const copyChordFromPrevious = (index: number) => {
    if (index > 0) {
      const previousChords = lyrics[index - 1].chords || '';
      updateLyric(index, 'chords', previousChords);
    }
  };

  const clearChords = (index: number) => {
    updateLyric(index, 'chords', '');
  };

  const applyChordToAll = (chords: string) => {
    const confirmed = confirm(`Apply "${chords}" to all ${lyrics.length} lyric lines?`);
    if (confirmed) {
      const newLyrics = lyrics.map(lyric => ({ ...lyric, chords }));
      setLyrics(newLyrics);
    }
  };

  const applyChordToRange = (startIndex: number, endIndex: number, chords: string) => {
    const newLyrics = [...lyrics];
    for (let i = startIndex; i <= endIndex && i < newLyrics.length; i++) {
      newLyrics[i] = { ...newLyrics[i], chords };
    }
    setLyrics(newLyrics);
  };

  const generateChordsAI = async () => {
    if (!lyrics || lyrics.length === 0) {
      alert('⚠️ No lyrics found!\n\nPlease import or add lyrics first before generating chords.');
      return;
    }

    const confirmed = confirm(`🎸 Generate AI chord suggestions for all ${lyrics.length} lyric lines?\n\nThis will suggest chords based on the song's melody and structure using AI.`);
    if (!confirmed) return;

    setGeneratingChords(true);
    try {
      const response = await axios.post('/api/lyrics/generate-chords', {
        videoId: video.id,
        autoApply: true
      });

      if (response.data.success) {
        alert(`✅ Successfully generated chords for ${response.data.updatedCount} lyrics!\n\nThe page will reload to show the new chords.`);
        router.refresh();
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error generating chords:', error);
      const errorMessage = error.response?.data?.error || 'Failed to generate chords';
      const errorDetails = error.response?.data?.details;

      let displayMessage = `❌ ${errorMessage}`;
      if (errorDetails) {
        displayMessage += `\n\n${errorDetails}`;
      }
      alert(displayMessage);
    } finally {
      setGeneratingChords(false);
    }
  };

  const correctLyricsAI = async () => {
    if (!lyrics || lyrics.length === 0) {
      alert('⚠️ No lyrics found!\n\nPlease import or add lyrics first before correcting them.');
      return;
    }

    const confirmed = confirm(`🔧 AI Lyrics Correction\n\nThis will review and fix any incorrectly transcribed Thai words in your ${lyrics.length} lyric lines.\n\nContinue?`);
    if (!confirmed) return;

    setCorrectingLyrics(true);
    try {
      const response = await axios.post('/api/lyrics/correct-lyrics', {
        videoId: video.id
      });

      if (response.data.success) {
        const updatedCount = response.data.updated || 0;
        if (updatedCount > 0) {
          alert(`✅ Successfully corrected ${updatedCount} lyrics!\n\nThe page will reload to show the corrections.`);
          router.refresh();
          window.location.reload();
        } else {
          alert('✅ All lyrics look correct! No changes needed.');
        }
      }
    } catch (error: any) {
      console.error('Error correcting lyrics:', error);
      const errorMessage = error.response?.data?.error || 'Failed to correct lyrics';
      const errorDetails = error.response?.data?.details;

      let displayMessage = `❌ ${errorMessage}`;
      if (errorDetails) {
        displayMessage += `\n\n${errorDetails}`;
      }
      alert(displayMessage);
    } finally {
      setCorrectingLyrics(false);
    }
  };

  const generatePianoAI = async () => {
    if (!lyrics || lyrics.length === 0) {
      alert('⚠️ No lyrics found!\n\nPlease import or add lyrics first before generating piano notes.');
      return;
    }

    const confirmed = confirm(`🎹 Generate AI piano melodies for all ${lyrics.length} lyric lines?\n\nThis will create sheet music notation based on the song's chords and melody using AI.`);
    if (!confirmed) return;

    setGeneratingPiano(true);
    try {
      const response = await axios.post('/api/lyrics/generate-piano', {
        videoId: video.id,
        autoApply: true
      });

      if (response.data.success) {
        alert(`✅ Successfully generated piano notes for ${response.data.updatedCount} lyrics!\n\nThe page will reload to show the sheet music.`);
        router.refresh();
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error generating piano notes:', error);
      const errorMessage = error.response?.data?.error || 'Failed to generate piano notes';
      const errorDetails = error.response?.data?.details;
      const suggestion = error.response?.data?.suggestion;

      let displayMessage = `❌ ${errorMessage}`;
      if (errorDetails) {
        displayMessage += `\n\n${errorDetails}`;
      }
      if (suggestion) {
        displayMessage += `\n\n💡 ${suggestion}`;
      }
      alert(displayMessage);
    } finally {
      setGeneratingPiano(false);
    }
  };

  const autoImportLyrics = async () => {
    if (lyrics.length > 0) {
      const confirmed = confirm('This will replace all existing lyrics. Are you sure you want to continue?');
      if (!confirmed) return;
    }

    setAutoImporting(true);
    setImportProgress(0);
    setImportMessage('Starting...');

    // Generate jobId on client
    const jobId = `${video.id}-${Date.now()}`;

    try {
      // Start progress polling
      progressIntervalRef.current = setInterval(async () => {
        try {
          const progressResponse = await axios.get(`/api/lyrics/progress?jobId=${jobId}`);
          setImportProgress(progressResponse.data.progress || 0);
          setImportMessage(progressResponse.data.message || '');
          setImportLogs(progressResponse.data.logs || []);

          // Auto-scroll logs to bottom
          if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (err) {
          console.error('Error fetching progress:', err);
        }
      }, 500); // Poll every 500ms

      const response = await axios.post('/api/lyrics/auto-import', {
        videoId: video.id,
        jobId: jobId // Pass jobId to server
      });

      // Stop polling
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (response.data.success) {
        setImportProgress(100);
        setImportMessage('Complete!');

        const method = response.data.method === 'whisper' ? 'AI Audio Transcription' : 'YouTube Captions';

        setTimeout(() => {
          alert(`Successfully imported ${response.data.lyricsCount} lyric lines using ${method}!`);
          // Reload the page to show the new lyrics
          router.refresh();
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error auto-importing lyrics:', error);

      // Stop polling
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setImportProgress(0);
      setImportMessage('');

      const errorData = error.response?.data;
      const errorMessage = errorData?.error || 'Failed to auto-import lyrics';
      const errorDetails = errorData?.details;
      const isQuotaError = errorData?.isQuotaError;
      const suggestion = errorData?.suggestion;

      let displayMessage = `❌ ${errorMessage}`;

      // Handle detailed error object
      if (errorDetails && typeof errorDetails === 'object') {
        if (errorDetails.ocr || errorDetails.whisper || errorDetails.captions) {
          displayMessage += '\n\n🔍 DEBUG INFO:';
          if (errorDetails.ocr) displayMessage += `\n• OCR: ${errorDetails.ocr}`;
          if (errorDetails.whisper) displayMessage += `\n• Whisper: ${errorDetails.whisper}`;
          if (errorDetails.captions) displayMessage += `\n• YouTube Captions: ${errorDetails.captions}`;
        } else if (errorDetails.message) {
          displayMessage += `\n\n🔍 Error: ${errorDetails.message}`;
          if (errorDetails.code) displayMessage += `\nCode: ${errorDetails.code}`;
        }
      } else if (typeof errorDetails === 'string') {
        displayMessage += `\n\n${errorDetails}`;
      }

      // Check for specific quota errors
      const quotaErrors = errorData?.errors;
      if (quotaErrors) {
        if (quotaErrors.youtubeQuota) {
          displayMessage += '\n\n⚠️ YOUTUBE API QUOTA EXCEEDED\nYour YouTube API quota limit has been reached.\n\nSolutions:\n1. Wait 24 hours for quota reset\n2. Use a different YouTube API key\n3. Upgrade your quota at Google Cloud Console';
        }
        if (quotaErrors.whisperQuota) {
          displayMessage += '\n\n⚠️ OPENAI API QUOTA EXCEEDED\nYour OpenAI account has run out of credits.\n\nSolutions:\n1. Visit https://platform.openai.com/account/billing\n2. Add credits ($5+ recommended)\n3. Wait for quota reset if on free tier';
        }
      }

      // Add suggestion if provided
      if (suggestion) {
        displayMessage += `\n\n💡 ${suggestion}`;
      }

      // Generic quota error handling (fallback)
      if (isQuotaError || errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
        if (!quotaErrors) {
          displayMessage += '\n\n⚠️ API QUOTA/RATE LIMIT ISSUE\nOne of your API services has reached its limit.\n\nCheck:\n• YouTube API quota (Google Cloud Console)\n• OpenAI API credits (platform.openai.com)\n• Network connection';
        }
      }

      // Check error message content (convert to string for safety)
      const errorString = JSON.stringify(errorDetails || errorMessage);

      if (errorString.includes('Transcript is disabled')) {
        displayMessage += '\n\n❌ This video has captions/subtitles DISABLED on YouTube.\n\nYour options:\n1. Add credits to OpenAI account for AI transcription\n2. Manually add lyrics using the editor below\n3. Choose a video with Thai captions enabled\n4. Enable captions on YouTube first (if you own the video)';
      } else if (errorString.includes('403') || errorString.includes('ytdl')) {
        displayMessage += '\n\n❌ YouTube is blocking audio download (403 error).\n\nYour options:\n1. Try a video with captions enabled (faster & more reliable)\n2. Manually add lyrics using the editor below\n3. Wait and try again later (YouTube may be rate-limiting)';
      } else if (errorMessage.includes('YouTube captions')) {
        displayMessage += '\n\nSuggestions:\n• Make sure the video has captions enabled on YouTube\n• Try a different video with Thai captions\n• Check that the video is publicly accessible';
      }

      alert(displayMessage);
    } finally {
      setAutoImporting(false);
    }
  };

  const saveLyrics = async () => {
    setSaving(true);
    try {
      // Delete existing lyrics
      for (const lyric of video.lyrics) {
        await axios.delete(`/api/lyrics?id=${lyric.id}&videoId=${video.id}`);
      }

      // Create new lyrics
      for (let i = 0; i < lyrics.length; i++) {
        const lyric = lyrics[i];
        await axios.post('/api/lyrics', {
          videoId: video.id,
          thaiText: lyric.thaiText,
          translation: lyric.translation,
          chords: lyric.chords,
          pianoNotes: lyric.pianoNotes,
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
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        setCurrentTime(getCurrentTime());
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

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
              suppressHydrationWarning
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
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-[#FF6B6B] mb-2" style={{ fontFamily: 'cursive' }}>
                {video.title}
              </h1>
              {video.description && (
                <ExpandableDescription
                  description={video.description}
                  maxLines={3}
                  className="text-gray-600 font-medium"
                />
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
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4 border-4 border-[#FFBE76] shadow-lg">
              <YouTube
                videoId={video.youtubeId}
                opts={opts}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                className="absolute top-0 left-0 w-full h-full"
                iframeClassName="w-full h-full"
              />
            </div>
            <div className="bg-gradient-to-r from-[#95E1D3]/20 to-[#4ECDC4]/20 p-4 rounded-xl border-2 border-[#4ECDC4] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">
                  ⏱️ Current Time: <span className="text-[#4ECDC4]">{currentTime.toFixed(2)}s</span>
                </span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={autoImportLyrics}
                    disabled={autoImporting}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFD166] to-[#FFBE76] text-white rounded-lg hover:from-[#FFBE76] hover:to-[#FFD166] transition-all shadow-lg font-bold transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="Auto-import lyrics from video transcript"
                    suppressHydrationWarning
                  >
                    <Download className="w-4 h-4" />
                    {autoImporting ? 'Importing...' : 'Auto-Import'}
                  </button>
                  <button
                    onClick={generateChordsAI}
                    disabled={generatingChords || lyrics.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-lg hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all shadow-lg font-bold transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="AI generate chords for all lyrics"
                    suppressHydrationWarning
                  >
                    <Sparkles className="w-4 h-4" />
                    {generatingChords ? 'Generating...' : 'AI Chords'}
                  </button>
                  <button
                    onClick={correctLyricsAI}
                    disabled={correctingLyrics || lyrics.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#95E1D3] to-[#4ECDC4] text-white rounded-lg hover:from-[#4ECDC4] hover:to-[#95E1D3] transition-all shadow-lg font-bold transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="AI correct Thai lyrics"
                    suppressHydrationWarning
                  >
                    <Sparkles className="w-4 h-4" />
                    {correctingLyrics ? 'Correcting...' : 'AI Correct'}
                  </button>
                  <button
                    onClick={generatePianoAI}
                    disabled={generatingPiano || lyrics.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white rounded-lg hover:from-[#8E44AD] hover:to-[#9B59B6] transition-all shadow-lg font-bold transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="AI generate piano notes for all lyrics"
                    suppressHydrationWarning
                  >
                    <Piano className="w-4 h-4" />
                    {generatingPiano ? 'Generating...' : 'AI Piano'}
                  </button>
                  <button
                    onClick={addLyric}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white rounded-lg hover:from-[#95E1D3] hover:to-[#4ECDC4] transition-all shadow-lg font-bold transform hover:scale-105 text-sm"
                    suppressHydrationWarning
                  >
                    <Plus className="w-4 h-4" />
                    Add Lyric
                  </button>
                </div>
              </div>

              {/* Progress Bar and Logs */}
              {autoImporting && (
                <div className="w-full space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600">{importMessage}</span>
                      <span className="text-xs font-bold text-[#4ECDC4]">{importProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                        style={{ width: `${importProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Logs Display */}
                  {importLogs.length > 0 && (
                    <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs shadow-inner">
                      {importLogs.map((log, index) => (
                        <div
                          key={index}
                          className="text-green-400 py-0.5 hover:bg-gray-800 px-2 rounded"
                        >
                          {log}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              )}
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
                      className={`rounded-2xl p-4 transition-all ${isActive
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
                            suppressHydrationWarning
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
                          suppressHydrationWarning
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
                            className="w-full px-3 py-2 border-[3px] border-[#4ECDC4] rounded-xl focus:ring-4 focus:ring-[#4ECDC4] focus:border-[#4ECDC4] outline-none thai-text text-lg bg-[#4ECDC4]/5 text-gray-900"
                            rows={2}
                            placeholder="ใส่เนื้อเพลงภาษาไทย..."
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-[#95E1D3] uppercase">
                              🎸 Chords
                            </label>
                            <div className="flex gap-2">
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => copyChordFromPrevious(index)}
                                  className="text-xs px-2 py-1 bg-[#FFD166] text-white rounded-md hover:bg-[#FFBE76] transition-colors font-semibold"
                                  title="Copy chords from previous line"
                                >
                                  Copy ↑
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowChordHelper(showChordHelper === index ? null : index)}
                                className="text-xs px-2 py-1 bg-[#95E1D3] text-white rounded-md hover:bg-[#4ECDC4] transition-colors font-semibold"
                              >
                                {showChordHelper === index ? 'Hide Helper' : 'Show Helper'}
                              </button>
                              {lyric.chords && (
                                <button
                                  type="button"
                                  onClick={() => clearChords(index)}
                                  className="text-xs px-2 py-1 bg-[#FF6B6B] text-white rounded-md hover:bg-[#FFA07A] transition-colors font-semibold"
                                  title="Clear all chords"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={lyric.chords || ''}
                            onChange={(e) => updateLyric(index, 'chords', e.target.value)}
                            className="w-full px-3 py-2 border-[3px] border-[#95E1D3] rounded-xl focus:ring-4 focus:ring-[#95E1D3] focus:border-[#95E1D3] outline-none bg-[#95E1D3]/5 text-gray-900 font-mono"
                            placeholder="C G Am F..."
                          />

                          {/* Chord Helper Panel */}
                          {showChordHelper === index && (
                            <div className="mt-3 p-4 bg-gradient-to-br from-[#95E1D3]/10 to-[#4ECDC4]/10 rounded-xl border-2 border-[#95E1D3] space-y-4">
                              {/* Major Chords */}
                              <div>
                                <p className="text-xs font-bold text-[#4ECDC4] mb-2 uppercase">⭐ Major Chords:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((chord) => (
                                    <button
                                      key={chord}
                                      type="button"
                                      onClick={() => addChordToLyric(index, chord)}
                                      className="px-3 py-1.5 bg-white border-2 border-[#95E1D3] text-[#4ECDC4] rounded-lg hover:bg-[#95E1D3] hover:text-white transition-all font-bold text-sm shadow-sm hover:shadow-md transform hover:scale-105"
                                    >
                                      {chord}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Minor Chords */}
                              <div>
                                <p className="text-xs font-bold text-[#4ECDC4] mb-2 uppercase">🌙 Minor Chords:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {['Am', 'Dm', 'Em', 'Fm', 'Gm', 'Bm'].map((chord) => (
                                    <button
                                      key={chord}
                                      type="button"
                                      onClick={() => addChordToLyric(index, chord)}
                                      className="px-3 py-1.5 bg-white border-2 border-[#FF6B6B] text-[#FF6B6B] rounded-lg hover:bg-[#FF6B6B] hover:text-white transition-all font-bold text-sm shadow-sm hover:shadow-md transform hover:scale-105"
                                    >
                                      {chord}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* 7th & Extended Chords */}
                              <div>
                                <p className="text-xs font-bold text-[#4ECDC4] mb-2 uppercase">🎵 7th & Extended:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'Cmaj7', 'Dmaj7', 'Emaj7', 'Gmaj7', 'Csus4', 'Dsus4', 'Gsus4'].map((chord) => (
                                    <button
                                      key={chord}
                                      type="button"
                                      onClick={() => addChordToLyric(index, chord)}
                                      className="px-2.5 py-1.5 bg-white border-2 border-[#FFD166] text-[#FFD166] rounded-lg hover:bg-[#FFD166] hover:text-white transition-all font-bold text-xs shadow-sm hover:shadow-md transform hover:scale-105"
                                    >
                                      {chord}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Common Progressions */}
                              <div className="pt-2 border-t-2 border-[#95E1D3]/30">
                                <p className="text-xs font-bold text-[#4ECDC4] mb-2 uppercase">🎸 Replace with Progression:</p>
                                <div className="grid grid-cols-1 gap-1.5">
                                  {chordProgressions.map((prog) => (
                                    <button
                                      key={prog.name}
                                      type="button"
                                      onClick={() => updateLyric(index, 'chords', prog.chords)}
                                      className="w-full px-3 py-2 bg-white border-2 border-[#FFD166] text-gray-700 rounded-lg hover:bg-[#FFD166] hover:text-white transition-all font-mono text-sm text-left shadow-sm hover:shadow-md flex items-center justify-between group"
                                    >
                                      <span className="font-bold group-hover:text-white">{prog.chords}</span>
                                      <span className="text-xs text-gray-500 group-hover:text-white/80">{prog.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Quick Tips */}
                              <div className="pt-2 border-t-2 border-[#95E1D3]/30 text-xs text-gray-600 space-y-1">
                                <p className="font-semibold text-[#4ECDC4]">💡 Tips:</p>
                                <ul className="list-disc list-inside space-y-0.5 ml-2">
                                  <li>Click chords to add them one by one</li>
                                  <li>Click progressions to replace all chords</li>
                                  <li>Use "Copy ↑" for repeating sections</li>
                                  <li>Type custom chords directly in the input</li>
                                </ul>
                              </div>
                            </div>
                            </div>
                          )}
                      </div>

                      {/* Piano Notes (Collapsible) */}
                      <div className="border border-[#9B59B6]/30 rounded-xl overflow-hidden bg-[#9B59B6]/5">
                        <details className="group">
                          <summary className="cursor-pointer p-3 flex items-center justify-between hover:bg-[#9B59B6]/10 transition-colors">
                            <div className="flex items-center gap-2">
                              <Piano className="w-4 h-4 text-[#9B59B6]" />
                              <span className="text-xs font-bold text-[#9B59B6] uppercase">Piano Notes</span>
                            </div>
                            <span className="text-[10px] text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="p-3 pt-0">
                            <textarea
                              value={lyric.pianoNotes || ''}
                              onChange={(e) => updateLyric(index, 'pianoNotes', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-[#9B59B6]/30 rounded-lg focus:ring-2 focus:ring-[#9B59B6] outline-none text-sm font-mono text-gray-700 h-20"
                              placeholder="X:1 T:Melody..."
                            />
                          </div>
                        </details>
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
                            className="w-full px-3 py-2 border-[3px] border-[#FF6B6B] rounded-xl focus:ring-4 focus:ring-[#FF6B6B] focus:border-[#FF6B6B] outline-none font-bold bg-[#FF6B6B]/5 text-gray-900"
                            aria-label="Start time in seconds"
                            suppressHydrationWarning
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
                            className="w-full px-3 py-2 border-[3px] border-[#FFA07A] rounded-xl focus:ring-4 focus:ring-[#FFA07A] focus:border-[#FFA07A] outline-none font-bold bg-[#FFA07A]/5 text-gray-900"
                            aria-label="End time in seconds"
                            suppressHydrationWarning
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
    </div >
  );
}