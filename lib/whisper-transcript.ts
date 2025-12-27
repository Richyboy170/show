import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { ProcessedLyric, ProcessedWord } from './transcript';
import { transcribeWithFallback, hasTranscriptionProvider, getConfiguredProviders } from './multi-provider-transcription';

/**
 * Download audio from YouTube video using bundled yt-dlp
 */
async function downloadAudio(videoId: string): Promise<string> {
  const outputPath = path.join(process.cwd(), 'tmp', `${videoId}.mp3`);

  // Create tmp directory if it doesn't exist
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  console.log('[Whisper] Downloading audio for video:', videoId);

  return new Promise((resolve, reject) => {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Use the bundled yt-dlp binary directly with spawn (handles spaces in paths)
    const ytdlpBinary = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');

    console.log('[Whisper] Using yt-dlp binary at:', ytdlpBinary);

    const args = [
      videoUrl,
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '-o', outputPath,
      '--no-warnings',
      '--no-check-certificates',
      '--prefer-free-formats',
      '--add-header', 'referer:youtube.com',
      '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ];

    // Add ffmpeg/ffprobe to PATH for yt-dlp post-processing
    const env = { ...process.env };
    const ffmpegPaths = [
      'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0-full_build\\bin',
      'C:\\ProgramData\\chocolatey\\bin',
      'C:\\Program Files\\ffmpeg\\bin'
    ];

    // Add ffmpeg paths to beginning of PATH
    for (const ffmpegPath of ffmpegPaths) {
      if (fs.existsSync(ffmpegPath)) {
        env.PATH = `${ffmpegPath};${env.PATH}`;
        console.log('[Whisper] Added to PATH:', ffmpegPath);
        break;
      }
    }

    const ytdlp = spawn(ytdlpBinary, args, {
      windowsHide: true,
      env
    });

    let stderr = '';
    let stdout = '';

    ytdlp.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[Whisper] yt-dlp:', data.toString().trim());
    });

    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('[Whisper] yt-dlp stderr:', data.toString().trim());
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        console.log('[Whisper] Audio downloaded successfully');
        // Check if file actually exists and has size
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          if (stats.size > 0) {
            console.log(`[Whisper] File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            resolve(outputPath);
          } else {
            reject(new Error('Downloaded file is empty (0 bytes)'));
          }
        } else {
          reject(new Error('Download completed but file not found'));
        }
      } else {
        console.error('[Whisper] yt-dlp failed with code:', code);
        console.error('[Whisper] stderr:', stderr);
        reject(new Error(`Failed to download audio: yt-dlp exited with code ${code}. Error: ${stderr}`));
      }
    });

    ytdlp.on('error', (error) => {
      console.error('[Whisper] yt-dlp spawn error:', error);
      reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
    });

    // Timeout after 2 minutes
    const timeoutId = setTimeout(() => {
      ytdlp.kill();
      reject(new Error('Audio download timeout after 2 minutes'));
    }, 120000);

    // Clear timeout on close
    ytdlp.on('close', () => clearTimeout(timeoutId));
  });
}

/**
 * Transcribe audio file using multi-provider fallback system
 */
async function transcribeAudio(
  audioPath: string,
  progressCallback?: (progress: number, message: string) => void
): Promise<any> {
  const providers = getConfiguredProviders();
  console.log('[Whisper] Configured providers:', providers.join(', '));

  try {
    const response = await transcribeWithFallback(audioPath, progressCallback);
    console.log('[Whisper] Transcription completed');
    return response;
  } catch (error: any) {
    console.error('[Whisper] Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Split text into words (handles Thai properly)
 */
function splitIntoWords(text: string): string[] {
  // Split by spaces for Thai text that has spaces
  let words = text.trim().split(/\s+/).filter(word => word.length > 0);

  // If no spaces, split into reasonable chunks
  if (words.length === 1 && words[0].length > 30) {
    const chars = words[0].split('');
    words = [];
    for (let i = 0; i < chars.length; i += 2) {
      words.push(chars.slice(i, i + 2).join(''));
    }
  }

  return words;
}

/**
 * Process Whisper response into lyrics with word-level timestamps
 */
function processWhisperResponse(whisperData: any): ProcessedLyric[] {
  const lyrics: ProcessedLyric[] = [];

  // Whisper returns segments (sentences/phrases)
  const segments = whisperData.segments || [];

  console.log('[Whisper] Processing', segments.length, 'segments');

  segments.forEach((segment: any, index: number) => {
    const words = segment.words || [];

    // If we have word-level timestamps from Whisper
    if (words.length > 0) {
      const processedWords: ProcessedWord[] = words.map((word: any, wordIndex: number) => {
        const start = word.start || segment.start;
        const end = word.end || segment.end;

        return {
          text: word.word.trim(),
          startTime: start,
          duration: end - start,
          order: wordIndex
        };
      });

      lyrics.push({
        thaiText: segment.text.trim(),
        translation: null, // To be added manually by admin
        startTime: segment.start,
        endTime: segment.end,
        order: index,
        words: processedWords
      });
    } else {
      // Fallback: create words manually if Whisper doesn't provide them
      const wordsArray = splitIntoWords(segment.text);
      const duration = segment.end - segment.start;
      const wordDuration = duration / wordsArray.length;

      const processedWords: ProcessedWord[] = wordsArray.map((word, wordIndex) => ({
        text: word,
        startTime: segment.start + (wordIndex * wordDuration),
        duration: wordDuration,
        order: wordIndex
      }));

      lyrics.push({
        thaiText: segment.text.trim(),
        translation: null,
        startTime: segment.start,
        endTime: segment.end,
        order: index,
        words: processedWords
      });
    }
  });

  return lyrics;
}

/**
 * Main function: Extract Thai lyrics from YouTube video using Whisper
 */
export async function extractLyricsWithWhisper(
  videoId: string,
  progressCallback?: (progress: number, message: string) => void
): Promise<ProcessedLyric[]> {
  let audioPath: string | null = null;

  try {
    console.log('[Whisper] Starting audio transcription for video:', videoId);

    // Step 1: Download audio from YouTube
    progressCallback?.(25, 'Downloading audio...');
    audioPath = await downloadAudio(videoId);

    // Step 2: Transcribe with AI (multi-provider fallback)
    progressCallback?.(40, 'Transcribing with AI...');
    const whisperData = await transcribeAudio(audioPath, progressCallback);

    // Step 3: Process into lyrics format
    progressCallback?.(75, 'Processing word timestamps...');
    const lyrics = processWhisperResponse(whisperData);

    console.log('[Whisper] Successfully extracted', lyrics.length, 'lyric lines');

    // Step 4: Clean up audio file
    if (audioPath && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
      console.log('[Whisper] Cleaned up temporary audio file');
    }

    return lyrics;
  } catch (error: any) {
    console.error('[Whisper] Error in extraction process:', error);

    // Clean up on error
    if (audioPath && fs.existsSync(audioPath)) {
      try {
        fs.unlinkSync(audioPath);
      } catch (cleanupError) {
        console.error('[Whisper] Error cleaning up audio file:', cleanupError);
      }
    }

    throw error;
  }
}

/**
 * Check if any AI transcription provider is configured
 */
export function isWhisperConfigured(): boolean {
  return hasTranscriptionProvider();
}
