import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptSegment {
  text: string;
  offset: number; // milliseconds
  duration: number; // milliseconds
}

export interface ProcessedLyric {
  thaiText: string;
  translation: string | null;
  startTime: number; // seconds
  endTime: number; // seconds
  order: number;
  words: ProcessedWord[];
}

export interface ProcessedWord {
  text: string;
  startTime: number; // seconds
  duration: number; // seconds
  order: number;
}

/**
 * Fetch transcript from YouTube video
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    console.log('[Transcript] Fetching transcript for video:', videoId);

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    console.log('[Transcript] Successfully fetched', transcript.length, 'segments');

    return transcript.map((item: any) => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration
    }));
  } catch (error: any) {
    console.error('[Transcript] Error fetching transcript:', {
      videoId,
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  }
}

/**
 * Split text into words (handles Thai text properly)
 */
function splitIntoWords(text: string): string[] {
  // Remove extra whitespace and split by spaces
  // Thai text may not have spaces between words, so this is a simple approximation
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);

  // For Thai text without spaces, we'll split into characters
  // You might want to use a Thai word segmentation library for better results
  if (words.length === 1 && words[0].length > 20) {
    // Likely Thai text without spaces - split into character groups
    const chars = words[0].split('');
    const groupedWords: string[] = [];

    for (let i = 0; i < chars.length; i += 3) {
      groupedWords.push(chars.slice(i, i + 3).join(''));
    }

    return groupedWords;
  }

  return words;
}

/**
 * Process transcript segments into lyrics with word-level timestamps
 */
export function processTranscriptToLyrics(segments: TranscriptSegment[]): ProcessedLyric[] {
  const lyrics: ProcessedLyric[] = [];

  segments.forEach((segment, index) => {
    const words = splitIntoWords(segment.text);
    const startTime = segment.offset / 1000; // Convert to seconds
    const endTime = (segment.offset + segment.duration) / 1000;
    const totalDuration = segment.duration / 1000;

    // Calculate duration per character for proportional distribution
    const totalChars = segment.text.length;
    const durationPerChar = totalDuration / totalChars;

    // Process words with proportional timing
    const processedWords: ProcessedWord[] = [];
    let currentOffset = 0;

    words.forEach((word, wordIndex) => {
      const wordDuration = word.length * durationPerChar;
      const wordStartTime = startTime + currentOffset;

      processedWords.push({
        text: word,
        startTime: wordStartTime,
        duration: wordDuration,
        order: wordIndex
      });

      currentOffset += wordDuration;
    });

    lyrics.push({
      thaiText: segment.text,
      translation: null, // Will be added manually by admin
      startTime,
      endTime,
      order: index,
      words: processedWords
    });
  });

  return lyrics;
}

/**
 * Main function to extract and process transcript
 */
export async function extractLyricsFromVideo(videoId: string): Promise<ProcessedLyric[]> {
  try {
    console.log('[Transcript] Extracting lyrics from video:', videoId);

    const transcript = await fetchTranscript(videoId);
    const lyrics = processTranscriptToLyrics(transcript);

    console.log('[Transcript] Successfully processed', lyrics.length, 'lyric lines');

    return lyrics;
  } catch (error: any) {
    console.error('[Transcript] Error extracting lyrics:', error);
    throw error;
  }
}
