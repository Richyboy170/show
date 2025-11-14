import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import { setFfmpegPath } from 'fluent-ffmpeg';
import { createWorker } from 'tesseract.js';
import { ProcessedLyric, ProcessedWord } from './transcript';

// Set ffmpeg path for Windows
const ffmpegPaths = [
  'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0-full_build\\bin\\ffmpeg.exe',
  'C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe',
  'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'
];

for (const ffmpegPath of ffmpegPaths) {
  if (fs.existsSync(ffmpegPath)) {
    setFfmpegPath(ffmpegPath);
    console.log('[OCR] Using ffmpeg at:', ffmpegPath);
    break;
  }
}

interface OCRFrame {
  timestamp: number; // seconds
  text: string;
  confidence: number;
}

interface OCRConfig {
  frameInterval: number; // seconds between frames
  confidenceThreshold: number; // minimum average confidence (0-100)
}

const DEFAULT_CONFIG: OCRConfig = {
  frameInterval: 2, // Extract frame every 2 seconds
  confidenceThreshold: 60 // 60% minimum confidence
};

/**
 * Download video from YouTube using bundled yt-dlp
 */
async function downloadVideo(videoId: string): Promise<string> {
  const outputPath = path.join(process.cwd(), 'tmp', `${videoId}.mp4`);

  // Create tmp directory if it doesn't exist
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  console.log('[OCR] Downloading video for:', videoId);

  return new Promise((resolve, reject) => {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Use the bundled yt-dlp binary directly with spawn
    const ytdlpBinary = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');

    console.log('[OCR] Using yt-dlp binary at:', ytdlpBinary);

    const args = [
      videoUrl,
      '-f', 'best[height<=720]', // Lower quality to save bandwidth
      '-o', outputPath,
      '--no-warnings',
      '--no-check-certificates',
      '--prefer-free-formats',
      '--add-header', 'referer:youtube.com',
      '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ];

    // Add ffmpeg/ffprobe to PATH for yt-dlp post-processing
    const env = { ...process.env };
    const ffmpegDirs = [
      'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0-full_build\\bin',
      'C:\\ProgramData\\chocolatey\\bin',
      'C:\\Program Files\\ffmpeg\\bin'
    ];

    // Add ffmpeg paths to beginning of PATH
    for (const ffmpegDir of ffmpegDirs) {
      if (fs.existsSync(ffmpegDir)) {
        env.PATH = `${ffmpegDir};${env.PATH}`;
        console.log('[OCR] Added to PATH:', ffmpegDir);
        break;
      }
    }

    const ytdlp = spawn(ytdlpBinary, args, {
      windowsHide: true,
      env
    });

    let stderr = '';

    ytdlp.stdout.on('data', (data) => {
      console.log('[OCR] yt-dlp:', data.toString().trim());
    });

    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('[OCR] yt-dlp stderr:', data.toString().trim());
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        console.log('[OCR] Video downloaded successfully');
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          if (stats.size > 0) {
            console.log(`[OCR] File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            resolve(outputPath);
          } else {
            reject(new Error('Downloaded file is empty (0 bytes)'));
          }
        } else {
          reject(new Error('Download completed but file not found'));
        }
      } else {
        console.error('[OCR] yt-dlp failed with code:', code);
        console.error('[OCR] stderr:', stderr);
        reject(new Error(`Failed to download video: yt-dlp exited with code ${code}. Error: ${stderr}`));
      }
    });

    ytdlp.on('error', (error) => {
      console.error('[OCR] yt-dlp spawn error:', error);
      reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
    });

    // Timeout after 5 minutes
    const timeoutId = setTimeout(() => {
      ytdlp.kill();
      reject(new Error('Video download timeout after 5 minutes'));
    }, 300000);

    ytdlp.on('close', () => clearTimeout(timeoutId));
  });
}

/**
 * Detect scene changes in video using ffmpeg
 * Returns timestamps where visual changes occur (likely lyric changes)
 */
async function detectSceneChanges(
  videoPath: string,
  progressCallback?: (progress: number, message: string) => void
): Promise<number[]> {
  console.log('[OCR] Detecting scene changes for optimal frame extraction...');

  return new Promise((resolve, reject) => {
    const sceneTimestamps: number[] = [0]; // Always include first frame
    let lastTimestamp = 0;

    // Find ffmpeg path
    const ffmpegPath = ffmpegPaths.find(p => fs.existsSync(p)) || 'ffmpeg';

    // Use ffmpeg scene detection filter
    // scene=0.4 means 40% change threshold (moderate sensitivity)
    const ffmpegProcess = spawn(
      ffmpegPath,
      [
        '-i', videoPath,
        '-vf', 'select=\'gt(scene\\,0.4)\',showinfo',
        '-f', 'null',
        '-'
      ],
      { windowsHide: true }
    );

    let stderrData = '';

    ffmpegProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderrData += output;

      // Parse scene change timestamps from showinfo filter output
      // Format: pts_time:12.345
      const ptsMatches = output.matchAll(/pts_time:(\d+\.?\d*)/g);
      for (const match of ptsMatches) {
        const timestamp = parseFloat(match[1]);
        // Only add if it's at least 0.5s after the last timestamp (avoid duplicates)
        if (timestamp > lastTimestamp + 0.5) {
          sceneTimestamps.push(timestamp);
          lastTimestamp = timestamp;
          const logMessage = `Scene change detected at ${timestamp.toFixed(2)}s`;
          console.log(`[OCR] ${logMessage}`);
          if (progressCallback) {
            progressCallback(20 + (sceneTimestamps.length * 0.5), logMessage);
          }
        }
      }

      // Track progress
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (timeMatch && progressCallback) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseFloat(timeMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;

        // Estimate progress (assume ~2 minute video)
        const estimatedDuration = 120;
        const percent = Math.min((currentTime / estimatedDuration) * 100, 100);
        progressCallback(20 + percent * 0.15, `Detecting scene changes: ${Math.round(percent)}%`);
      }
    });

    ffmpegProcess.on('close', (code) => {
      const logMessage = `Scene detection complete: found ${sceneTimestamps.length} scene changes`;
      console.log(`[OCR] ${logMessage}`);
      if (progressCallback) {
        progressCallback(35, logMessage);
      }

      // If too few scenes detected, fall back to 3-second intervals
      if (sceneTimestamps.length < 5) {
        const fallbackMsg = 'Too few scene changes detected, using 3-second intervals as fallback';
        console.log(`[OCR] ${fallbackMsg}`);
        if (progressCallback) {
          progressCallback(35, fallbackMsg);
        }
        const fallbackTimestamps = [];
        for (let t = 0; t < 150; t += 3) {
          fallbackTimestamps.push(t);
        }
        resolve(fallbackTimestamps.slice(0, 50)); // Max 50 frames
      } else {
        // Limit to max 60 frames for performance
        resolve(sceneTimestamps.slice(0, 60));
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('[OCR] Scene detection failed:', err);
      // Fallback to 3-second intervals
      console.log('[OCR] Falling back to 3-second intervals');
      const fallbackTimestamps = [];
      for (let t = 0; t < 150; t += 3) {
        fallbackTimestamps.push(t);
      }
      resolve(fallbackTimestamps.slice(0, 50));
    });
  });
}

/**
 * Extract frames at specific timestamps using scene detection
 */
async function extractFramesAtTimestamps(
  videoPath: string,
  timestamps: number[],
  progressCallback?: (progress: number, message: string) => void
): Promise<{ path: string; timestamp: number }[]> {
  const framesDir = path.join(process.cwd(), 'tmp', 'frames');

  // Clean up old frames and recreate directory
  if (fs.existsSync(framesDir)) {
    fs.rmSync(framesDir, { recursive: true });
  }
  fs.mkdirSync(framesDir, { recursive: true });

  console.log('[OCR] Extracting frames at detected scene changes...');
  console.log(`[OCR] Extracting ${timestamps.length} frames`);

  const framePaths: { path: string; timestamp: number }[] = [];

  // Extract frames one by one at specific timestamps for better quality
  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const frameIndex = i.toString().padStart(4, '0');
    const framePath = path.join(framesDir, `frame-${frameIndex}.png`);

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(timestamp)
          .frames(1)
          .outputOptions([
            '-vf', 'scale=1920:-1' // Maintain high quality for better OCR
          ])
          .output(framePath)
          .on('end', () => {
            framePaths.push({ path: framePath, timestamp });
            if (progressCallback) {
              const progress = 35 + ((i + 1) / timestamps.length) * 5; // 35-40%
              progressCallback(progress, `Extracting frames: ${i + 1}/${timestamps.length}`);
            }
            resolve();
          })
          .on('error', (err) => {
            console.error(`[OCR] Failed to extract frame at ${timestamp}s:`, err.message);
            // Continue even if one frame fails
            resolve();
          })
          .run();
      });
    } catch (err) {
      console.error(`[OCR] Error extracting frame at ${timestamp}s:`, err);
      // Continue with next frame
    }
  }

  console.log(`[OCR] Successfully extracted ${framePaths.length} frames`);
  return framePaths;
}

/**
 * Extract frames from video at specified intervals (OLD METHOD - kept for fallback)
 */
async function extractFrames(
  videoPath: string,
  frameInterval: number,
  progressCallback?: (progress: number, message: string) => void
): Promise<string[]> {
  const framesDir = path.join(process.cwd(), 'tmp', 'frames');

  // Create frames directory
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  console.log('[OCR] Extracting frames from video...');

  return new Promise((resolve, reject) => {
    const framePaths: string[] = [];

    // Get video duration first
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video metadata: ${err.message}`));
        return;
      }

      const duration = metadata.format.duration || 0;
      const totalFrames = Math.floor(duration / frameInterval);
      console.log(`[OCR] Video duration: ${duration}s, extracting ~${totalFrames} frames`);

      // Extract frames at intervals
      for (let time = 0; time < duration; time += frameInterval) {
        const framePath = path.join(framesDir, `frame_${time.toFixed(1)}.png`);
        framePaths.push(framePath);
      }

      // Use ffmpeg to extract all frames at once using fps filter
      const fps = 1 / frameInterval; // frames per second

      ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=${fps}` // Extract frames at specified fps
        ])
        .output(path.join(framesDir, 'frame_%d.png'))
        .on('progress', (progress) => {
          if (progress.percent) {
            const currentProgress = 20 + (progress.percent * 0.2); // 20-40% of total
            progressCallback?.(currentProgress, `Extracting frames: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('[OCR] Frame extraction complete');

          // Get actual extracted frames
          const extractedFrames = fs.readdirSync(framesDir)
            .filter(f => f.startsWith('frame_') && f.endsWith('.png'))
            .sort((a, b) => {
              const numA = parseInt(a.match(/\d+/)?.[0] || '0');
              const numB = parseInt(b.match(/\d+/)?.[0] || '0');
              return numA - numB;
            })
            .map(f => path.join(framesDir, f));

          console.log(`[OCR] Extracted ${extractedFrames.length} frames`);
          resolve(extractedFrames);
        })
        .on('error', (err) => {
          console.error('[OCR] Frame extraction error:', err);
          reject(new Error(`Failed to extract frames: ${err.message}`));
        })
        .run();
    });
  });
}

/**
 * Run OCR on a single frame
 */
async function ocrFrame(
  framePath: string,
  timestamp: number,
  worker: Awaited<ReturnType<typeof createWorker>>
): Promise<OCRFrame> {
  console.log(`[OCR] Processing frame at ${timestamp}s`);

  const { data } = await worker.recognize(framePath);

  // Filter for Thai text (confidence-based filtering)
  const thaiText = data.text.trim();
  const confidence = data.confidence || 0;

  console.log(`[OCR] Frame ${timestamp}s: confidence=${confidence.toFixed(1)}%, text="${thaiText.substring(0, 50)}..."`);

  return {
    timestamp,
    text: thaiText,
    confidence
  };
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Create distance matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calculate Levenshtein distance
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  // Convert to similarity percentage
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1;
  const similarity = 1 - matrix[len1][len2] / maxLen;
  return similarity;
}

/**
 * Deduplicate OCR results to remove duplicate/similar text
 * Merges results that are >85% similar within 2 seconds of each other
 */
function deduplicateOCRResults(
  ocrResults: OCRFrame[],
  progressCallback?: (progress: number, message: string) => void
): OCRFrame[] {
  if (ocrResults.length === 0) return [];

  console.log(`[OCR] Deduplicating ${ocrResults.length} OCR results...`);
  if (progressCallback) {
    progressCallback(75, `Deduplicating ${ocrResults.length} OCR results...`);
  }

  const deduplicated: OCRFrame[] = [];
  let currentGroup: OCRFrame[] = [];

  for (let i = 0; i < ocrResults.length; i++) {
    const current = ocrResults[i];

    // Skip empty results
    if (!current.text || current.text.trim().length === 0) {
      continue;
    }

    // Start new group if this is first result or different from previous
    if (currentGroup.length === 0) {
      currentGroup.push(current);
      continue;
    }

    const lastInGroup = currentGroup[currentGroup.length - 1];
    const timeDiff = current.timestamp - lastInGroup.timestamp;
    const similarity = calculateSimilarity(
      current.text.trim().toLowerCase(),
      lastInGroup.text.trim().toLowerCase()
    );

    // If similar text within 2 seconds, it's likely the same lyric
    if (similarity > 0.85 && timeDiff < 2) {
      // Add to current group (same lyric, different frame)
      currentGroup.push(current);
    } else {
      // Different lyric - merge current group and start new one
      const merged = mergeOCRGroup(currentGroup);
      deduplicated.push(merged);
      currentGroup = [current];
    }
  }

  // Don't forget the last group
  if (currentGroup.length > 0) {
    const merged = mergeOCRGroup(currentGroup);
    deduplicated.push(merged);
  }

  const removedCount = ocrResults.length - deduplicated.length;
  const dedupeMsg = `Deduplicated to ${deduplicated.length} unique lyrics (removed ${removedCount} duplicates)`;
  console.log(`[OCR] ${dedupeMsg}`);
  if (progressCallback) {
    progressCallback(78, dedupeMsg);
  }
  return deduplicated;
}

/**
 * Merge a group of similar OCR results into a single result
 * Uses the result with highest confidence and earliest timestamp
 */
function mergeOCRGroup(group: OCRFrame[]): OCRFrame {
  if (group.length === 1) return group[0];

  // Find result with highest confidence
  const bestResult = group.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  );

  // Use earliest timestamp
  const earliestTimestamp = Math.min(...group.map(r => r.timestamp));

  return {
    timestamp: earliestTimestamp,
    text: bestResult.text,
    confidence: bestResult.confidence
  };
}

/**
 * Process all frames with OCR
 */
async function processFramesWithOCR(
  framePaths: string[],
  frameInterval: number,
  progressCallback?: (progress: number, message: string) => void
): Promise<OCRFrame[]> {
  console.log('[OCR] Initializing Tesseract worker...');

  // Configure worker paths for Next.js compatibility
  const worker = await createWorker('tha', 1, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
    logger: (m) => {
      if (m.status === 'recognizing text') {
        console.log(`[OCR] Progress: ${(m.progress * 100).toFixed(1)}%`);
      }
    }
  });

  const ocrResults: OCRFrame[] = [];

  try {
    for (let i = 0; i < framePaths.length; i++) {
      const framePath = framePaths[i];
      const timestamp = i * frameInterval;

      // Update progress (40% - 80% of total)
      const ocrProgress = 40 + ((i / framePaths.length) * 40);
      progressCallback?.(ocrProgress, `OCR processing: ${i + 1}/${framePaths.length} frames`);

      const result = await ocrFrame(framePath, timestamp, worker);

      // Only include frames with text
      if (result.text.length > 0) {
        ocrResults.push(result);
      }
    }

    console.log(`[OCR] OCR complete: ${ocrResults.length} frames with text`);
    return ocrResults;
  } finally {
    await worker.terminate();
    console.log('[OCR] Tesseract worker terminated');
  }
}

/**
 * Calculate average confidence score from OCR results
 */
function calculateAverageConfidence(ocrFrames: OCRFrame[]): number {
  if (ocrFrames.length === 0) return 0;

  const totalConfidence = ocrFrames.reduce((sum, frame) => sum + frame.confidence, 0);
  const avgConfidence = totalConfidence / ocrFrames.length;

  console.log(`[OCR] Average confidence: ${avgConfidence.toFixed(1)}%`);
  return avgConfidence;
}

/**
 * Group consecutive frames with similar text into lyric lines
 */
function groupFramesIntoLyrics(ocrFrames: OCRFrame[]): ProcessedLyric[] {
  if (ocrFrames.length === 0) return [];

  const lyrics: ProcessedLyric[] = [];
  let currentGroup: OCRFrame[] = [];
  let currentText = '';

  ocrFrames.forEach((frame, index) => {
    const normalizedText = frame.text.trim().toLowerCase();

    // Start new group if text is significantly different or it's the first frame
    if (currentGroup.length === 0) {
      currentGroup = [frame];
      currentText = normalizedText;
    } else {
      // Calculate similarity (simple approach: check if 50% of words match)
      const similarity = calculateTextSimilarity(currentText, normalizedText);

      if (similarity > 0.5) {
        // Similar text, add to current group
        currentGroup.push(frame);
      } else {
        // Different text, finalize current group and start new one
        if (currentGroup.length > 0) {
          lyrics.push(createLyricFromGroup(currentGroup, lyrics.length));
        }
        currentGroup = [frame];
        currentText = normalizedText;
      }
    }

    // Finalize last group
    if (index === ocrFrames.length - 1 && currentGroup.length > 0) {
      lyrics.push(createLyricFromGroup(currentGroup, lyrics.length));
    }
  });

  console.log(`[OCR] Grouped ${ocrFrames.length} frames into ${lyrics.length} lyric lines`);
  return lyrics;
}

/**
 * Calculate text similarity (simple word overlap)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Create a ProcessedLyric from a group of frames
 */
function createLyricFromGroup(frames: OCRFrame[], order: number): ProcessedLyric {
  // Use the frame with highest confidence for the text
  const bestFrame = frames.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  );

  const startTime = frames[0].timestamp;
  const endTime = frames[frames.length - 1].timestamp + 2; // Add frame interval

  // Split into words for word-level timing
  const words = splitIntoWords(bestFrame.text);
  const duration = endTime - startTime;
  const wordDuration = duration / words.length;

  const processedWords: ProcessedWord[] = words.map((word, index) => ({
    text: word,
    startTime: startTime + (index * wordDuration),
    duration: wordDuration,
    order: index
  }));

  return {
    thaiText: bestFrame.text,
    translation: null, // To be added manually by admin
    startTime,
    endTime,
    order,
    words: processedWords
  };
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
 * Clean up temporary files
 */
function cleanupTempFiles(videoPath?: string) {
  const tmpDir = path.join(process.cwd(), 'tmp');

  // Remove video file
  if (videoPath && fs.existsSync(videoPath)) {
    try {
      fs.unlinkSync(videoPath);
      console.log('[OCR] Removed video file');
    } catch (err) {
      console.error('[OCR] Error removing video file:', err);
    }
  }

  // Remove frames directory
  const framesDir = path.join(tmpDir, 'frames');
  if (fs.existsSync(framesDir)) {
    try {
      const files = fs.readdirSync(framesDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(framesDir, file));
      });
      fs.rmdirSync(framesDir);
      console.log('[OCR] Removed frames directory');
    } catch (err) {
      console.error('[OCR] Error removing frames:', err);
    }
  }
}

/**
 * Main function: Extract lyrics from video using OCR with scene detection
 */
export async function extractLyricsWithOCR(
  videoId: string,
  config: Partial<OCRConfig> = {},
  progressCallback?: (progress: number, message: string) => void
): Promise<{ lyrics: ProcessedLyric[], confidence: number }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let videoPath: string | null = null;

  try {
    console.log('[OCR] Starting OCR-based lyric extraction for video:', videoId);
    console.log('[OCR] Config:', finalConfig);
    console.log('[OCR] Using intelligent scene detection for better accuracy');

    // Step 1: Download video
    progressCallback?.(5, 'Downloading video...');
    videoPath = await downloadVideo(videoId);

    // Step 2: Detect scene changes (intelligent frame selection)
    progressCallback?.(20, 'Detecting scene changes...');
    const sceneTimestamps = await detectSceneChanges(videoPath, progressCallback);
    console.log(`[OCR] Detected ${sceneTimestamps.length} potential lyric changes`);

    // Step 3: Extract frames at detected scene changes
    progressCallback?.(35, 'Extracting frames at scene changes...');
    const frameData = await extractFramesAtTimestamps(videoPath, sceneTimestamps, progressCallback);

    // Step 4: Process frames with OCR
    progressCallback?.(40, 'Running OCR on frames...');
    const worker = await createWorker('tha', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] Progress: ${(m.progress * 100).toFixed(1)}%`);
        }
      }
    });

    const ocrResults: OCRFrame[] = [];
    try {
      for (let i = 0; i < frameData.length; i++) {
        const { path: framePath, timestamp } = frameData[i];
        console.log(`[OCR] Processing frame ${i + 1}/${frameData.length} at ${timestamp.toFixed(2)}s`);

        const { data } = await worker.recognize(framePath);
        const text = data.text.trim();
        const confidence = data.confidence;

        if (text && confidence > 0) {
          ocrResults.push({ timestamp, text, confidence });
          console.log(`[OCR] Frame ${i + 1}: "${text.substring(0, 50)}..." (${confidence.toFixed(1)}%)`);
        }

        if (progressCallback) {
          const progress = 40 + ((i + 1) / frameData.length) * 35; // 40-75%
          progressCallback(progress, `OCR: ${i + 1}/${frameData.length} frames`);
        }
      }
    } finally {
      await worker.terminate();
    }

    // Step 5: Deduplicate OCR results (remove duplicate/similar text)
    progressCallback?.(75, 'Removing duplicates...');
    const deduplicatedResults = deduplicateOCRResults(ocrResults, progressCallback);
    console.log(`[OCR] Deduplicated from ${ocrResults.length} to ${deduplicatedResults.length} unique results`);

    // Step 6: Calculate confidence
    progressCallback?.(80, 'Analyzing results...');
    const avgConfidence = calculateAverageConfidence(deduplicatedResults);

    // Step 7: Check if confidence meets threshold
    if (avgConfidence < finalConfig.confidenceThreshold) {
      console.log(`[OCR] Confidence ${avgConfidence.toFixed(1)}% below threshold ${finalConfig.confidenceThreshold}%`);
      throw new Error(`OCR confidence too low: ${avgConfidence.toFixed(1)}% (threshold: ${finalConfig.confidenceThreshold}%)`);
    }

    // Step 8: Group frames into lyrics
    progressCallback?.(85, 'Creating lyrics...');
    const lyrics = groupFramesIntoLyrics(deduplicatedResults);

    console.log(`[OCR] Successfully extracted ${lyrics.length} unique lyric lines with ${avgConfidence.toFixed(1)}% confidence`);

    // Step 9: Clean up
    progressCallback?.(95, 'Cleaning up...');
    cleanupTempFiles(videoPath);

    return {
      lyrics,
      confidence: avgConfidence
    };
  } catch (error) {
    console.error('[OCR] Error in extraction process:', error);

    // Clean up on error
    if (videoPath) {
      cleanupTempFiles(videoPath);
    }

    throw error;
  }
}

/**
 * Check if OCR can be used (always true for Tesseract)
 */
export function isOCRAvailable(): boolean {
  return true; // Tesseract is always available as it's a local library
}
