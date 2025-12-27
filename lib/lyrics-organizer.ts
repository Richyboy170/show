/**
 * LLM-powered Lyrics Organizer
 * Takes bulk unstructured lyrics and chords, uses AI to organize them
 * Then matches to video timestamps using Whisper transcription
 */

import OpenAI from 'openai';

interface OrganizedLyric {
  thaiText: string;
  chords?: string;
  order: number;
}

interface TimedLyric {
  thaiText: string;
  translation?: string;
  chords?: string;
  startTime: number;
  endTime: number;
  order: number;
}

/**
 * Parse and organize bulk lyrics/chords using LLM
 */
export async function organizeBulkLyrics(
  bulkText: string,
  progressCallback?: (progress: number, message: string) => void
): Promise<OrganizedLyric[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env.local file.');
  }

  progressCallback?.(10, 'Connecting to OpenAI...');
  console.log('[LYRICS-ORGANIZER] Using OpenAI to organize bulk lyrics...');

  const openai = new OpenAI({ apiKey });

  progressCallback?.(20, 'Analyzing lyrics structure with AI...');

  const prompt = `You are a lyrics organizer. I will give you unstructured lyrics and chords mixed together.

Your task:
1. Separate the lyrics into individual lines
2. Identify which chords belong to which lyric line
3. Clean up and organize the text
4. Return ONLY a JSON array with this exact structure:

[
  {
    "thaiText": "the lyric line in Thai",
    "chords": "C G Am F",
    "order": 0
  },
  {
    "thaiText": "next lyric line",
    "chords": "Dm G C",
    "order": 1
  }
]

Important rules:
- Keep all Thai text exactly as provided
- Chords should be on separate "chords" field, NOT mixed with lyrics
- If no chords for a line, use empty string ""
- Order starts from 0
- Return ONLY the JSON array, no other text
- Do not translate or modify the Thai text

Here is the bulk text to organize:

${bulkText}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cheap for text organization
      messages: [
        {
          role: 'system',
          content: 'You are a precise lyrics organizer. Return only valid JSON arrays with no additional text or formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Low temperature for consistent formatting
      response_format: { type: 'json_object' }
    });

    progressCallback?.(80, 'Processing AI response...');

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('[LYRICS-ORGANIZER] OpenAI response:', content);

    // Parse the JSON response
    let organizedLyrics: OrganizedLyric[];

    try {
      const parsed = JSON.parse(content);
      // Handle if OpenAI wrapped it in an object with "lyrics" key
      organizedLyrics = parsed.lyrics || parsed;

      if (!Array.isArray(organizedLyrics)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('[LYRICS-ORGANIZER] Failed to parse JSON:', parseError);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Validate and clean up the data
    const validatedLyrics = organizedLyrics
      .filter(lyric => lyric.thaiText && lyric.thaiText.trim().length > 0)
      .map((lyric, index) => ({
        thaiText: lyric.thaiText.trim(),
        chords: lyric.chords?.trim() || '',
        order: index
      }));

    console.log(`[LYRICS-ORGANIZER] Organized ${validatedLyrics.length} lyric lines`);
    progressCallback?.(100, 'Organization complete!');

    return validatedLyrics;
  } catch (error: any) {
    console.error('[LYRICS-ORGANIZER] Error:', error);
    throw new Error(`Failed to organize lyrics: ${error.message}`);
  }
}

/**
 * Get timestamps from video using Whisper
 */
export async function getTimestampsFromVideo(
  youtubeId: string,
  progressCallback?: (progress: number, message: string) => void
): Promise<Array<{ text: string; startTime: number; endTime: number }>> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  progressCallback?.(10, 'Downloading audio...');
  console.log('[LYRICS-ORGANIZER] Getting timestamps from video...');

  // This will use the existing Whisper transcription
  // Import and use the extractLyricsWithWhisper function
  const { extractLyricsWithWhisper } = await import('./whisper-transcript');

  progressCallback?.(30, 'Transcribing audio with Whisper...');
  const transcriptedLyrics = await extractLyricsWithWhisper(
    youtubeId,
    (progress, message) => {
      progressCallback?.(30 + (progress * 0.5), message);
    }
  );

  console.log(`[LYRICS-ORGANIZER] Got ${transcriptedLyrics.length} timestamped segments`);

  return transcriptedLyrics.map(lyric => ({
    text: lyric.thaiText,
    startTime: lyric.startTime,
    endTime: lyric.endTime
  }));
}

/**
 * Match organized lyrics to timestamps using LLM
 */
export async function matchLyricsToTimestamps(
  organizedLyrics: OrganizedLyric[],
  timestamps: Array<{ text: string; startTime: number; endTime: number }>,
  progressCallback?: (progress: number, message: string) => void
): Promise<TimedLyric[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  progressCallback?.(10, 'Matching lyrics to timestamps...');
  console.log('[LYRICS-ORGANIZER] Matching lyrics to timestamps with AI...');

  const openai = new OpenAI({ apiKey });

  // Create the matching prompt
  const lyricsText = organizedLyrics.map((l, i) => `${i}: ${l.thaiText}`).join('\n');
  const timestampsText = timestamps.map((t, i) =>
    `${i}: "${t.text}" (${t.startTime.toFixed(1)}s - ${t.endTime.toFixed(1)}s)`
  ).join('\n');

  const prompt = `You are a lyrics-to-timestamp matcher. Match user-provided lyrics to transcribed audio timestamps.

ORGANIZED LYRICS (with chords):
${lyricsText}

TRANSCRIBED TIMESTAMPS (from audio):
${timestampsText}

Your task:
1. Match each organized lyric to the most appropriate timestamp
2. Some lyrics may match multiple timestamps (combine them)
3. Some timestamps may not match any lyric (skip them)
4. Return ONLY a JSON array with this structure:

[
  {
    "lyricIndex": 0,
    "timestampIndex": 0,
    "confidence": 0.95
  },
  {
    "lyricIndex": 1,
    "timestampIndex": 1,
    "confidence": 0.88
  }
]

Rules:
- Match based on text similarity (Thai characters)
- lyricIndex refers to organized lyrics (0-${organizedLyrics.length - 1})
- timestampIndex refers to timestamps (0-${timestamps.length - 1})
- confidence is 0-1 (how sure you are of the match)
- Return ONLY valid JSON, no other text`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise lyric matcher. Return only valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    progressCallback?.(70, 'Processing matches...');

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    const matches = parsed.matches || parsed;

    if (!Array.isArray(matches)) {
      throw new Error('Invalid matching response');
    }

    // Build the final timed lyrics
    const timedLyrics: TimedLyric[] = organizedLyrics.map((lyric, index) => {
      // Find matching timestamp
      const match = matches.find((m: any) => m.lyricIndex === index);

      if (match && timestamps[match.timestampIndex]) {
        const timestamp = timestamps[match.timestampIndex];
        return {
          thaiText: lyric.thaiText,
          chords: lyric.chords,
          startTime: timestamp.startTime,
          endTime: timestamp.endTime,
          order: index
        };
      } else {
        // No match found, use estimated timing
        const estimatedStart = index * 5; // 5 seconds per line estimate
        return {
          thaiText: lyric.thaiText,
          chords: lyric.chords,
          startTime: estimatedStart,
          endTime: estimatedStart + 5,
          order: index
        };
      }
    });

    console.log(`[LYRICS-ORGANIZER] Created ${timedLyrics.length} timed lyrics`);
    progressCallback?.(100, 'Matching complete!');

    return timedLyrics;
  } catch (error: any) {
    console.error('[LYRICS-ORGANIZER] Matching error:', error);
    throw new Error(`Failed to match lyrics: ${error.message}`);
  }
}

/**
 * Complete workflow: Organize bulk text and sync to video
 */
export async function organizeBulkLyricsWithTimestamps(
  bulkText: string,
  youtubeId: string,
  progressCallback?: (progress: number, message: string) => void
): Promise<TimedLyric[]> {
  try {
    // Step 1: Organize the bulk text (0-30%)
    progressCallback?.(0, 'Starting organization...');
    const organizedLyrics = await organizeBulkLyrics(
      bulkText,
      (progress, message) => {
        progressCallback?.(progress * 0.3, message);
      }
    );

    // Step 2: Get timestamps from video (30-70%)
    progressCallback?.(30, 'Getting timestamps from video...');
    const timestamps = await getTimestampsFromVideo(
      youtubeId,
      (progress, message) => {
        progressCallback?.(30 + (progress * 0.4), message);
      }
    );

    // Step 3: Match lyrics to timestamps (70-100%)
    progressCallback?.(70, 'Matching lyrics to timestamps...');
    const timedLyrics = await matchLyricsToTimestamps(
      organizedLyrics,
      timestamps,
      (progress, message) => {
        progressCallback?.(70 + (progress * 0.3), message);
      }
    );

    progressCallback?.(100, 'Complete!');
    return timedLyrics;
  } catch (error: any) {
    console.error('[LYRICS-ORGANIZER] Complete workflow error:', error);
    throw error;
  }
}
