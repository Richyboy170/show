import OpenAI from 'openai';

export interface ChordSuggestion {
    lyricId: string;
    lyricText: string;
    suggestedChords: string;
    confidence: 'high' | 'medium' | 'low';
}

export interface LyricForChordGeneration {
    id: string;
    thaiText: string;
    startTime: number;
    endTime: number;
    order: number;
}

/**
 * Generate chord suggestions for lyrics using AI
 * Uses GPT-4 to analyze the song context and suggest appropriate chords
 */
export async function generateChordsForLyrics(
    youtubeId: string,
    lyrics: LyricForChordGeneration[],
    songTitle: string,
    progressCallback?: (progress: number, message: string) => void
): Promise<ChordSuggestion[]> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.');
    }

    progressCallback?.(10, 'Connecting to AI...');
    console.log('[CHORD-GENERATOR] Starting chord generation for:', songTitle);

    const openai = new OpenAI({ apiKey });



    progressCallback?.(30, 'Analyzing song structure...');

    const systemPrompt = `You are an expert music transcriber who specializes in transcribing chords for Thai songs.

YOUR TASK: Transcribe the ACTUAL chords being played in the song during each lyric line.

CRITICAL INSTRUCTIONS:
1. Use the song title to identify the song and recall/infer its chord progression
2. For each lyric line, list ALL the chord changes that occur during that line
3. If a line has 4 chord changes (e.g., the music goes C → G → Am → F), write "C G Am F"
4. If a line only has 1 chord being held throughout, write just that chord
5. The number of chords should match what is ACTUALLY PLAYED in the music, not based on line duration

IMPORTANT:
- Many Thai pop songs use 4-chord progressions per phrase (e.g., "C G Am F" or "G D Em C")
- Verse and chorus often have the same progression repeated
- Bridge sections may have different chords
- Listen mentally to how the song flows - each lyric phrase usually covers a full chord progression
- If unsure about the exact song, use common Thai pop progressions that fit the emotional tone

Use standard chord notation: C, G, Am, F, Dm, Em, Bm, D, A, E, plus 7th chords like Am7, Cmaj7, G7.

Return ONLY valid JSON array, no markdown formatting.`;

    // Prepare lyrics with timestamps
    const lyricsFormatted = lyrics
        .sort((a, b) => a.order - b.order)
        .map((l, i) => `${i + 1}. [${l.startTime.toFixed(1)}s-${l.endTime.toFixed(1)}s] ${l.thaiText}`)
        .join('\n');

    const userPrompt = `Song Title: "${songTitle}"
YouTube ID: ${youtubeId}

Please transcribe the chords for this Thai song. For each lyric line, provide ALL the chords that are played during that line.

Lyrics (with timestamps):
${lyricsFormatted}

For each line, transcribe the chord progression that plays during those lyrics. If the song uses "C G Am F" progression and line 1 covers the full progression, write "C G Am F". If line 2 only covers "C G", write "C G".

Return as JSON array:
[
  {
    "order": 1,
    "chords": "C G Am F",
    "confidence": "high"
  },
  {
    "order": 2, 
    "chords": "C G Am F",
    "confidence": "medium"
  }
]

Include all ${lyrics.length} lines. Use "high" if you recognize the song, "medium" for educated guesses, "low" for uncertain.`;

    progressCallback?.(50, 'Generating chord suggestions...');

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3, // Lower temperature for more consistent results
            max_tokens: 4000 // Increased for longer chord progressions
        });

        const aiResponse = response.choices[0]?.message?.content || '';
        console.log('[CHORD-GENERATOR] AI Response length:', aiResponse.length);

        progressCallback?.(80, 'Processing suggestions...');

        // Parse the JSON response
        let chordData: Array<{ order: number; chords: string; confidence: string }>;

        try {
            // Clean up the response (remove markdown code blocks if present)
            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
            }

            chordData = JSON.parse(cleanedResponse);
        } catch (e) {
            console.error('[CHORD-GENERATOR] Failed to parse AI response:', aiResponse.substring(0, 500));
            throw new Error('Invalid AI response format');
        }

        if (!Array.isArray(chordData)) {
            throw new Error('AI response is not an array');
        }

        // Map chord suggestions to lyrics
        const suggestions: ChordSuggestion[] = lyrics.map((lyric) => {
            const chordEntry = chordData.find(c => c.order === lyric.order + 1);

            return {
                lyricId: lyric.id,
                lyricText: lyric.thaiText,
                suggestedChords: chordEntry?.chords || '',
                confidence: (chordEntry?.confidence as 'high' | 'medium' | 'low') || 'low'
            };
        });

        const validSuggestions = suggestions.filter(s => s.suggestedChords);
        console.log(`[CHORD-GENERATOR] Generated ${validSuggestions.length} chord suggestions`);

        progressCallback?.(100, 'Chord generation complete!');

        return suggestions;
    } catch (error: any) {
        console.error('[CHORD-GENERATOR] Error:', error);
        throw new Error(`Failed to generate chords: ${error.message}`);
    }
}

/**
 * Common chord progressions for reference
 */
export const COMMON_PROGRESSIONS = {
    pop: ['C G Am F', 'G D Em C', 'D A Bm G', 'A E F#m D'],
    ballad: ['C Am F G', 'G Em C D', 'Am F C G', 'Em C G D'],
    rock: ['A D E A', 'G C D G', 'E A B E', 'D G A D'],
    folk: ['G C G D', 'C F C G', 'D G A D', 'A D E A']
};

/**
 * Get a quick chord suggestion based on song position
 * Can be used as fallback when AI is unavailable
 */
export function getQuickChordSuggestion(
    position: 'verse' | 'chorus' | 'bridge',
    key: string = 'C'
): string {
    const progressions: Record<string, Record<string, string>> = {
        'C': { verse: 'C Am F G', chorus: 'F G C Am', bridge: 'Am F G C' },
        'G': { verse: 'G Em C D', chorus: 'C D G Em', bridge: 'Em C D G' },
        'D': { verse: 'D Bm G A', chorus: 'G A D Bm', bridge: 'Bm G A D' },
        'A': { verse: 'A F#m D E', chorus: 'D E A F#m', bridge: 'F#m D E A' },
        'Am': { verse: 'Am F C G', chorus: 'F G Am Em', bridge: 'Em Dm Am G' },
        'Em': { verse: 'Em C G D', chorus: 'C D Em Am', bridge: 'Am Bm Em D' }
    };

    return progressions[key]?.[position] || 'C G Am F';
}
