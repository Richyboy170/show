import OpenAI from 'openai';

export interface PianoNoteSuggestion {
    lyricId: string;
    lyricText: string;
    pianoNotes: string; // ABC notation
    confidence: 'high' | 'medium' | 'low';
}

export interface LyricForPianoGeneration {
    id: string;
    thaiText: string;
    chords?: string;
    startTime: number;
    endTime: number;
    order: number;
}

/**
 * Generate piano notes (ABC notation) for lyrics using AI
 * Focuses on transcribing the VOCAL MELODY first, with chords used for harmonic context
 * Uses GPT-4 to analyze the song and generate singable melody lines
 */
export async function generatePianoNotesForLyrics(
    youtubeId: string,
    lyrics: LyricForPianoGeneration[],
    songTitle: string,
    progressCallback?: (progress: number, message: string) => void
): Promise<PianoNoteSuggestion[]> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.');
    }

    progressCallback?.(10, 'Connecting to AI...');
    console.log('[PIANO-GENERATOR] Starting vocal melody generation for:', songTitle);

    const openai = new OpenAI({ apiKey });

    // Prepare lyrics text for analysis
    const lyricsText = lyrics
        .sort((a, b) => a.order - b.order)
        .map((l, i) => {
            const chordInfo = l.chords ? ` (Chords: ${l.chords})` : '';
            return `${i + 1}. [${l.startTime.toFixed(1)}s-${l.endTime.toFixed(1)}s] ${l.thaiText}${chordInfo}`;
        })
        .join('\n');

    progressCallback?.(30, 'Analyzing song melody...');

    const systemPrompt = `You are an expert music transcriber specializing in Thai pop song melodies.
Your PRIMARY task is to generate ABC music notation that captures the VOCAL MELODY - what the singer is actually singing.

MELODY FOCUS (Most Important):
- Focus on transcribing the vocal melody line, not chord accompaniment
- The melody should match what the singer sings, syllable by syllable
- Prioritize melodic contour and singability over chord-fitting
- Think of this as sheet music for the vocalist, not the pianist

ABC Notation Guidelines:
- Use standard ABC notation format
- Start with X:1, T:, M:4/4, L:1/8, K: headers for each line
- Use notes: C D E F G A B c d e f g (lowercase = octave higher)
- Use durations: 2 (half), 4 (whole), /2 (eighth)
- Keep melodies simple and singable (4-12 notes per line)
- Match the melody rhythm to the lyric syllables

Common Thai Pop Melody Patterns:
- Verse melodies often move stepwise (C D E F or E D C B)
- Chorus melodies have more leaps and higher notes
- Melodies often emphasize the 1st, 3rd, or 5th scale degree

CHORD CONTEXT (Secondary):
- Chords are provided for harmonic reference only
- Use them to determine the key and scale context
- Don't force melody notes to be chord tones - the melody should sound natural first

Return ONLY valid JSON array, no markdown formatting.`;

    const userPrompt = `Song Title: "${songTitle}"
YouTube ID: ${youtubeId}

Lyrics (with timestamps and chords for reference):
${lyricsText}

Your task: Generate ABC notation for the VOCAL MELODY of each lyric line.
- Focus on what the singer is singing, not chord accompaniment
- The melodies should be simple, singable, and match typical Thai pop song patterns
- Chords are provided for key/scale context only - don't let them override natural melody

Return as JSON array:
[
  {
    "order": 1,
    "pianoNotes": "X:1\\nT:Line 1\\nM:4/4\\nL:1/8\\nK:C\\nC2 D2 E2 F2 | G4 E4 |",
    "confidence": "high"
  },
  {
    "order": 2,
    "pianoNotes": "X:1\\nT:Line 2\\nM:4/4\\nL:1/8\\nK:C\\nE2 D2 C2 B,2 | C4 z4 |",
    "confidence": "medium"
  }
]

Include all ${lyrics.length} lines. Use "high" confidence for strong melodic matches, "medium" for reasonable guesses, "low" for uncertain.
IMPORTANT: Use \\n for newlines in the ABC notation strings (JSON escaped).`;

    progressCallback?.(50, 'Generating vocal melodies...');

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.4, // Slightly higher for creative melody generation
            max_tokens: 4000
        });

        const aiResponse = response.choices[0]?.message?.content || '';
        console.log('[PIANO-GENERATOR] AI Response length:', aiResponse.length);

        progressCallback?.(80, 'Processing melodies...');

        // Parse the JSON response
        let pianoData: Array<{ order: number; pianoNotes: string; confidence: string }>;

        try {
            // Clean up the response (remove markdown code blocks if present)
            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
            }

            pianoData = JSON.parse(cleanedResponse);
        } catch (e) {
            console.error('[PIANO-GENERATOR] Failed to parse AI response:', aiResponse.substring(0, 500));
            throw new Error('Invalid AI response format');
        }

        if (!Array.isArray(pianoData)) {
            throw new Error('AI response is not an array');
        }

        // Map piano note suggestions to lyrics
        const suggestions: PianoNoteSuggestion[] = lyrics.map((lyric) => {
            const pianoEntry = pianoData.find(p => p.order === lyric.order + 1);

            // Convert escaped newlines to actual newlines
            let notes = pianoEntry?.pianoNotes || '';
            notes = notes.replace(/\\n/g, '\n');

            return {
                lyricId: lyric.id,
                lyricText: lyric.thaiText,
                pianoNotes: notes,
                confidence: (pianoEntry?.confidence as 'high' | 'medium' | 'low') || 'low'
            };
        });

        const validSuggestions = suggestions.filter(s => s.pianoNotes);
        console.log(`[PIANO-GENERATOR] Generated ${validSuggestions.length} vocal melodies`);

        progressCallback?.(100, 'Vocal melody generation complete!');

        return suggestions;
    } catch (error: any) {
        console.error('[PIANO-GENERATOR] Error:', error);
        throw new Error(`Failed to generate piano notes: ${error.message}`);
    }
}

/**
 * Generate a simple default ABC notation for a chord
 */
export function getDefaultPianoNotes(chord: string = 'C'): string {
    const chordNotes: Record<string, string> = {
        'C': 'C E G',
        'D': 'D F A',
        'E': 'E G B',
        'F': 'F A c',
        'G': 'G B d',
        'A': 'A c e',
        'B': 'B d f',
        'Am': 'A C E',
        'Dm': 'D F A',
        'Em': 'E G B',
        'Fm': 'F A c',
        'Gm': 'G B d'
    };

    const notes = chordNotes[chord] || 'C E G';
    return `X:1
T:Melody
M:4/4
L:1/4
K:C
${notes} |`;
}
