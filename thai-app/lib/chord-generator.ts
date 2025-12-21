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

    // Prepare lyrics text for analysis
    const lyricsText = lyrics
        .sort((a, b) => a.order - b.order)
        .map((l, i) => `${i + 1}. [${l.startTime.toFixed(1)}s-${l.endTime.toFixed(1)}s] ${l.thaiText}`)
        .join('\n');

    progressCallback?.(30, 'Analyzing song structure...');

    const systemPrompt = `You are an expert music transcriber specializing in Thai pop, rock, and ballad songs. 
Your task is to suggest chord progressions for Thai song lyrics.

Guidelines:
- Analyze the lyrics and suggest appropriate chords based on:
  1. Common Thai pop chord progressions (C-G-Am-F, G-D-Em-C, etc.)
  2. The emotional content of the lyrics
  3. Typical verse/chorus patterns
- Use standard chord notation (C, G, Am, F, Dm, Em, etc.)
- Include 7th chords (Cmaj7, Am7) for ballads
- Use 1-3 chords per lyric line
- Consider key changes between verse and chorus
- For Thai songs, common keys are C, G, D, A major and Am, Em minor

Return ONLY valid JSON array, no markdown formatting.`;

    const userPrompt = `Song Title: "${songTitle}"
YouTube ID: ${youtubeId}

Lyrics (with timestamps):
${lyricsText}

Generate appropriate chords for each lyric line. Consider this is likely a Thai pop/rock/ballad song.

Return as JSON array:
[
  {
    "order": 1,
    "chords": "C G",
    "confidence": "high"
  },
  {
    "order": 2, 
    "chords": "Am F",
    "confidence": "medium"
  }
]

Include all ${lyrics.length} lines. Use "high" confidence for likely chord progressions, "medium" for reasonable guesses, "low" for uncertain.`;

    progressCallback?.(50, 'Generating chord suggestions...');

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3, // Lower temperature for more consistent results
            max_tokens: 2000
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
