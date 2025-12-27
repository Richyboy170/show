import { generateWithFallback, hasMusicProvider, getConfiguredProviders } from './multi-provider-music';

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
 * Validate ABC notation structure and complexity
 */
export function validateABCNotation(abc: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!abc || abc.trim().length === 0) {
        errors.push('ABC notation is empty');
        return { valid: false, errors, warnings };
    }

    // Check for required headers
    const requiredHeaders = ['X:', 'T:', 'M:', 'L:', 'K:'];
    for (const header of requiredHeaders) {
        if (!abc.includes(header)) {
            errors.push(`Missing required header: ${header}`);
        }
    }

    // Check for voice definitions (should have V:1 and V:2 for full arrangement)
    const hasVoice1 = abc.includes('V:1');
    const hasVoice2 = abc.includes('V:2');

    if (!hasVoice1 && !hasVoice2) {
        warnings.push('No voice definitions found - might be a simple melody only');
    } else if (hasVoice1 && !hasVoice2) {
        warnings.push('Only one voice found - missing accompaniment (V:2)');
    }

    // Check for bar lines
    const barLineCount = (abc.match(/\|/g) || []).length;
    if (barLineCount === 0) {
        errors.push('No bar lines found');
    } else if (barLineCount < 4) {
        warnings.push('Very few bars - arrangement might be too short');
    }

    // Check for musical complexity indicators
    const hasOrnaments = /[~TMH]/.test(abc); // grace notes, trills, mordents
    const hasTriplets = /\(3/.test(abc);
    const hasChordSymbols = /"[A-G]/.test(abc);
    const hasChords = /\[[\w,]+\]/.test(abc); // chord notation [CEG]

    if (!hasOrnaments && !hasTriplets) {
        warnings.push('No ornaments or triplets found - melody might be too simple');
    }

    if (!hasChords && hasVoice2) {
        warnings.push('V:2 exists but no chord notation found - accompaniment might be incomplete');
    }

    // Check for varied note durations
    const hasSixteenths = /\/4/.test(abc);
    const hasEighths = /\/2/.test(abc) || /[A-Ga-g](?![0-9])/.test(abc);
    const hasHalves = /2/.test(abc);
    const hasWholes = /4/.test(abc);

    if (!hasSixteenths && !hasEighths && !hasHalves) {
        warnings.push('Limited rhythmic variety - all notes appear to be the same duration');
    }

    // Check for proper ABC syntax issues
    const hasInvalidChars = /[^A-Ga-gzXTMLKV:|\[\],\(\)~'"\/0-9\s\-_=\n\r]/.test(abc);
    if (hasInvalidChars) {
        warnings.push('Contains unusual characters that might not be valid ABC notation');
    }

    const valid = errors.length === 0;
    return { valid, errors, warnings };
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
    // Check if any AI providers are configured
    if (!hasMusicProvider()) {
        throw new Error(
            'No AI providers configured. Please add at least one API key to your .env file:\n' +
            '- OPENAI_API_KEY (recommended)\n' +
            '- ANTHROPIC_API_KEY\n' +
            '- GEMINI_API_KEY\n' +
            '- GROQ_API_KEY (FREE!)'
        );
    }

    progressCallback?.(10, 'Connecting to AI...');
    console.log('[PIANO-GENERATOR] Starting piano arrangement generation for:', songTitle);

    const configuredProviders = getConfiguredProviders();
    console.log('[PIANO-GENERATOR] Available AI providers:', configuredProviders);

    // Prepare lyrics text for analysis
    const lyricsText = lyrics
        .sort((a, b) => a.order - b.order)
        .map((l, i) => {
            const chordInfo = l.chords ? ` (Chords: ${l.chords})` : '';
            return `${i + 1}. [${l.startTime.toFixed(1)}s-${l.endTime.toFixed(1)}s] ${l.thaiText}${chordInfo}`;
        })
        .join('\n');

    progressCallback?.(30, 'Analyzing song structure and harmony...');

    const systemPrompt = `You are an expert music transcriber and arranger specializing in Thai pop music with deep knowledge of Southeast Asian musical traditions.

YOUR TASK: Create a complete piano arrangement in ABC notation that includes BOTH the vocal melody AND sophisticated piano accompaniment.

🎹 PIANO ARRANGEMENT STRUCTURE (Use Multiple Voices):
You must create TWO distinct musical parts using ABC's multi-voice feature:

V:1 - RIGHT HAND (Treble clef): Vocal melody with embellishments
V:2 - LEFT HAND (Bass clef): Chord accompaniment patterns

🎵 MELODY COMPLEXITY REQUIREMENTS (V:1):
- Capture the EXACT vocal melody with all melodic nuances
- Include ornaments: ~(g) for grace notes, T for trills, M for mordents
- Use varied note durations: /4 (16th), /2 (8th), 1 (quarter), 2 (half), 3 (dotted half), 4 (whole)
- Add triplets for rhythmic variety: (3ABC for triplet figures
- Include melodic runs, passing tones, and neighbor tones
- Use octave variations strategically (C, c, c')
- Add dynamics markers if the melody has strong/soft sections
- Include slurs and ties for legato passages: (CD for slurs

🎹 ACCOMPANIMENT COMPLEXITY REQUIREMENTS (V:2):
- Create rich accompaniment patterns, NOT just block chords
- Use broken chord patterns (arpeggios): [CEG]c [CEG]c or C,E,G,C E,G,C,E
- Alberti bass patterns: C,G,E,G, E,G,C,G, for classical feel
- Walking bass lines for jazz/ballad sections
- Syncopated rhythms for upbeat sections
- Include bass notes in lower octave (C, D, E, - capital with comma)
- Vary the pattern between verse/chorus/bridge

📊 RHYTHMIC COMPLEXITY:
- Use dotted rhythms (3/2 for dotted quarter + eighth)
- Add syncopation and off-beat accents
- Include pickup notes (anacrusis) at phrase beginnings
- Use ties across bar lines for sustained notes: C2-C2
- Add rhythmic breaks and rests strategically: z for rests

🎼 HARMONIC SOPHISTICATION:
- Use chord extensions from the chord symbols: Cmaj7 = [CEGBc], Am7 = [ACEGa]
- Add passing chords and chromatic movements
- Include secondary dominants and borrowed chords
- Create voice leading between chord changes
- Use chord inversions for smooth bass movement

🇹🇭 THAI POP MUSIC CHARACTERISTICS:
- Thai pop often features melismatic vocal lines (multiple notes per syllable)
- Common pentatonic scale influences mixed with Western harmony
- Verse melodies tend to be more subdued, chorus melodies more dramatic
- Bridge sections often modulate or use different rhythmic feels
- Frequent use of major 7th, minor 7th, and 9th chords
- Emotional expressiveness through melodic bends and ornaments

📝 ABC NOTATION TECHNICAL REQUIREMENTS:
- Each line MUST start with proper headers:
  X:1
  T:Line [number]
  M:4/4 (or 3/4, 6/8 depending on feel)
  L:1/8 (unit note length)
  K:C (or appropriate key)
  V:1 clef=treble name="Melody"
  V:2 clef=bass name="Accompaniment"
- Use | for bar lines, || for section ends
- Use chord symbols above staff: "Am7"
- Write multiple bars (4-8 bars per line minimum)
- Ensure rhythmically complete measures

⚠️ CRITICAL ACCURACY REQUIREMENTS:
- The melody MUST match the actual sung notes, not just approximations
- Timing must align with lyric syllables and phrasing
- Accompaniment must complement, not overpower the melody
- Use the provided chords as foundation, but add passing chords
- Match the emotional intensity of different sections
- If unsure about exact notes, use your knowledge of Thai pop conventions

EXAMPLE OUTPUT STRUCTURE:
X:1
T:Line 1
M:4/4
L:1/8
K:C
V:1 clef=treble name="Melody"
V:2 clef=bass name="Accompaniment"
V:1
"C"~E2 G2 "G"A3 B | "Am"c2 d2 "F"c4 | "C"(3edc B2 "G"A2 G2 | "C"G6 z2 ||
V:2
[C,E,G,]2 [E,G,C]2 [G,B,D]2 [B,D,G]2 | [A,C,E]2 [C,E,A]2 [F,A,C]2 [A,C,F]2 | [C,E,G,]2 [E,G,C]2 [G,B,D]2 [B,D,G]2 | [C,E,G,]6 z2 ||

Return ONLY valid JSON array, no markdown formatting.`;

    const userPrompt = `Song Title: "${songTitle}"
YouTube ID: ${youtubeId}

Lyrics with timing and harmonic context:
${lyricsText}

🎯 YOUR MISSION: Create a sophisticated piano arrangement for each lyric line with TWO voices:
- V:1 (Right Hand): The actual vocal melody with ornaments, grace notes, and expressive markings
- V:2 (Left Hand): Rich accompaniment patterns (NOT just block chords!)

📋 ARRANGEMENT GUIDELINES:

1. **Analyze the song context**:
   - Use the song title to recall or infer the actual melody
   - Consider if it's verse/chorus/bridge based on the lyric content
   - Match the emotional tone (upbeat, ballad, dramatic, etc.)

2. **Melody Voice (V:1)** - MUST BE COMPLEX:
   - Transcribe the exact vocal melody, including:
     * All melodic ornaments and runs
     * Grace notes before main notes: ~(g)A
     * Melismatic passages (multiple notes per syllable)
     * Rhythmic variations (16th notes, triplets, syncopation)
     * Expressive timing (rubato sections)
   - Use octave range: from G, to e' (or higher for powerful sections)
   - Add proper phrasing and articulation

3. **Accompaniment Voice (V:2)** - MUST BE SOPHISTICATED:
   - DO NOT just play [CEG] [CEG] block chords!
   - Create movement and interest:
     * Arpeggios: C,E,G,C E,G,C,E G,C,E,G,
     * Alberti bass: C,G,E,G, C,G,E,G,
     * Walking bass: C, D, E, F, (for jazz/ballad)
     * Broken chords with rhythm: [C,E,G,]2 C,2 E,2 G,2
     * Stride piano: C,4 [E,G,C]2 [E,G,C]2
   - Include bass notes in low octave (C, D, E, F, G, A, B,)
   - Vary patterns between sections
   - Add counter-melodies when appropriate

4. **Musical Sophistication**:
   - Use ALL chord tones plus extensions (7ths, 9ths, etc.)
   - Add passing tones and chromatic approach notes
   - Include proper voice leading
   - Match the song's genre and style
   - Create musical tension and release

5. **Thai Pop Specific**:
   - Thai pop melodies are often quite elaborate with vocal runs
   - Ballads feature sustained notes with vibrato (indicate with ~)
   - Upbeat songs have syncopated rhythms
   - Emotional peaks in chorus sections (higher notes, more complex)

Return as JSON array with COMPLETE arrangements:
[
  {
    "order": 1,
    "pianoNotes": "X:1\\nT:Line 1\\nM:4/4\\nL:1/8\\nK:C\\nV:1 clef=treble name=\\"Melody\\"\\nV:2 clef=bass name=\\"Accompaniment\\"\\nV:1\\n\\"C\\"~(e)E2 G2 \\"G\\"A2 (3Bcd | \\"Am\\"c2 e2 \\"F\\"d3 c | \\"C\\"(Bc) B2 \\"G\\"A2 G2 | \\"C\\"G6 z2 ||\\nV:2\\n[C,E,G,]2 E,2 G,2 C2 | [A,C,E,]2 C,2 E,2 A,2 | [C,E,G,]2 E,2 [G,B,D,]2 B,2 | [C,E,G,]6 z2 ||",
    "confidence": "high"
  }
]

⚠️ CRITICAL REQUIREMENTS:
- Generate ALL ${lyrics.length} lines
- Each line MUST have BOTH V:1 and V:2 voices
- Minimum 4 bars per line (adjust based on lyric length)
- Use proper ABC syntax with escaped newlines (\\n)
- Confidence: "high" = recognize song, "medium" = educated guess, "low" = uncertain
- The accompaniment MUST be more complex than simple block chords
- The melody MUST include rhythmic and melodic variation

IMPORTANT: Use \\n for newlines in the ABC notation strings (JSON escaped).`;

    progressCallback?.(50, 'Generating sophisticated piano arrangement...');

    try {
        // Use multi-provider system with automatic fallback
        const aiResponse = await generateWithFallback(
            systemPrompt,
            userPrompt,
            progressCallback,
            false // preferCheap = false (prioritize quality)
        );

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

            // Check if AI refused due to copyright concerns
            const lowerResponse = cleanedResponse.toLowerCase();
            if (lowerResponse.includes('copyright') ||
                lowerResponse.includes('cannot create') ||
                lowerResponse.includes('cannot transcribe') ||
                lowerResponse.includes('cannot reproduce') ||
                (lowerResponse.includes('i appreciate') && lowerResponse.includes('limitation'))) {
                console.error('[PIANO-GENERATOR] AI refused copyright request:', aiResponse.substring(0, 300));
                throw new Error(
                    'AI cannot generate piano transcriptions of copyrighted songs. ' +
                    'Piano transcription requires exact melodic reproduction which may infringe copyright. ' +
                    'Consider using original compositions or public domain music instead.'
                );
            }

            pianoData = JSON.parse(cleanedResponse);
        } catch (e: any) {
            // Check if it's our custom copyright error
            if (e.message?.includes('copyright')) {
                throw e;
            }

            console.error('[PIANO-GENERATOR] Failed to parse AI response:', aiResponse.substring(0, 500));
            throw new Error(
                'Invalid AI response format. The AI did not return valid piano notation. ' +
                'This may happen if the song is difficult to transcribe or if the AI is uncertain about the melody.'
            );
        }

        if (!Array.isArray(pianoData)) {
            throw new Error('AI response is not an array');
        }

        // Map piano note suggestions to lyrics with validation
        const suggestions: PianoNoteSuggestion[] = lyrics.map((lyric) => {
            const pianoEntry = pianoData.find(p => p.order === lyric.order + 1);

            // Convert escaped newlines to actual newlines
            let notes = pianoEntry?.pianoNotes || '';
            notes = notes.replace(/\\n/g, '\n');

            // Validate the generated ABC notation
            if (notes) {
                const validation = validateABCNotation(notes);

                if (!validation.valid) {
                    console.warn(`[PIANO-GENERATOR] Invalid ABC for lyric ${lyric.order + 1}:`, validation.errors);
                }

                if (validation.warnings.length > 0) {
                    console.warn(`[PIANO-GENERATOR] Quality warnings for lyric ${lyric.order + 1}:`, validation.warnings);
                }

                // Log complexity metrics
                const hasMultipleVoices = notes.includes('V:1') && notes.includes('V:2');
                const hasOrnaments = /[~TMH]/.test(notes);
                const hasTriplets = /\(3/.test(notes);
                console.log(`[PIANO-GENERATOR] Lyric ${lyric.order + 1} - Voices: ${hasMultipleVoices ? 'Yes' : 'No'}, Ornaments: ${hasOrnaments ? 'Yes' : 'No'}, Triplets: ${hasTriplets ? 'Yes' : 'No'}`);
            }

            return {
                lyricId: lyric.id,
                lyricText: lyric.thaiText,
                pianoNotes: notes,
                confidence: (pianoEntry?.confidence as 'high' | 'medium' | 'low') || 'low'
            };
        });

        const validSuggestions = suggestions.filter(s => s.pianoNotes);
        console.log(`[PIANO-GENERATOR] Generated ${validSuggestions.length} complete piano arrangements`);

        progressCallback?.(100, 'Piano arrangement generation complete!');

        return suggestions;
    } catch (error: any) {
        console.error('[PIANO-GENERATOR] Error:', error);

        // Provide helpful error messages
        let errorMessage = 'Failed to generate piano notes';
        let suggestion = '';

        if (error.message?.includes('copyright') || error.message?.includes('cannot create')) {
            // Already has a clear message, just rethrow
            throw error;
        } else if (error.message?.includes('No AI providers')) {
            errorMessage = 'No AI providers configured';
            suggestion = 'Please add at least one API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY) to your .env file.';
        } else if (error.message?.includes('All') && error.message?.includes('failed')) {
            errorMessage = 'All AI providers exhausted';
            suggestion = 'All configured AI providers have quota/rate limits reached. Please:\n' +
                        '1. Check your OpenAI billing at https://platform.openai.com/account/billing\n' +
                        '2. Wait a few minutes if rate limited\n' +
                        '3. Add credits to your AI provider accounts';
        } else if (error.message?.includes('Invalid AI response')) {
            // Already has a clear message
            throw error;
        } else if (error.message?.includes('quota') || error.message?.includes('429')) {
            errorMessage = 'API quota exceeded';
            suggestion = 'Your AI provider accounts have run out of credits. Please add credits at https://platform.openai.com/account/billing';
        } else {
            errorMessage = error.message || 'Unknown error occurred';
        }

        throw new Error(`${errorMessage}${suggestion ? '. ' + suggestion : ''}`);
    }
}

/**
 * Generate a sophisticated default ABC notation for a chord with arpeggiated accompaniment
 * This is used as fallback when AI generation fails
 */
export function getDefaultPianoNotes(chord: string = 'C', style: 'arpeggio' | 'alberti' | 'broken' = 'arpeggio'): string {
    // Define chord voicings with bass notes and extensions
    const chordVoicings: Record<string, { bass: string; melody: string; trebleNotes: string[] }> = {
        'C': { bass: 'C,', melody: 'E2 G2 c2 e2', trebleNotes: ['C', 'E', 'G', 'c'] },
        'D': { bass: 'D,', melody: 'F2 A2 d2 f2', trebleNotes: ['D', 'F', 'A', 'd'] },
        'E': { bass: 'E,', melody: 'G2 B2 e2 g2', trebleNotes: ['E', 'G', 'B', 'e'] },
        'F': { bass: 'F,', melody: 'A2 c2 f2 a2', trebleNotes: ['F', 'A', 'c', 'f'] },
        'G': { bass: 'G,', melody: 'B2 d2 g2 b2', trebleNotes: ['G', 'B', 'd', 'g'] },
        'A': { bass: 'A,', melody: 'c2 e2 a2 c\'2', trebleNotes: ['A', 'c', 'e', 'a'] },
        'B': { bass: 'B,', melody: 'd2 f2 b2 d\'2', trebleNotes: ['B', 'd', 'f', 'b'] },
        'Am': { bass: 'A,', melody: 'C2 E2 A2 c2', trebleNotes: ['A,', 'C', 'E', 'A'] },
        'Dm': { bass: 'D,', melody: 'F2 A2 d2 f2', trebleNotes: ['D', 'F', 'A', 'd'] },
        'Em': { bass: 'E,', melody: 'G2 B2 e2 g2', trebleNotes: ['E', 'G', 'B', 'e'] },
        'Fm': { bass: 'F,', melody: 'A2 c2 f2 a2', trebleNotes: ['F', 'A', 'c', 'f'] },
        'Gm': { bass: 'G,', melody: 'B2 d2 g2 b2', trebleNotes: ['G', 'B', 'd', 'g'] },
        'Cmaj7': { bass: 'C,', melody: 'E2 G2 B2 c2', trebleNotes: ['C', 'E', 'G', 'B'] },
        'Am7': { bass: 'A,', melody: 'C2 E2 G2 A2', trebleNotes: ['A,', 'C', 'E', 'G'] },
        'Dm7': { bass: 'D,', melody: 'F2 A2 C2 d2', trebleNotes: ['D', 'F', 'A', 'C'] },
        'G7': { bass: 'G,', melody: 'B2 d2 f2 g2', trebleNotes: ['G', 'B', 'd', 'f'] },
    };

    const voicing = chordVoicings[chord] || chordVoicings['C'];
    const [n1, n2, n3, n4] = voicing.trebleNotes;

    let accompanimentPattern: string;
    let melodyLine: string = voicing.melody;

    // Generate different accompaniment patterns
    if (style === 'arpeggio') {
        // Rising arpeggio pattern
        accompanimentPattern = `${voicing.bass}2 ${n1}2 ${n2}2 ${n3}2 | ${voicing.bass}2 ${n1}2 ${n2}2 ${n3}2 |`;
    } else if (style === 'alberti') {
        // Alberti bass pattern (1-3-2-3)
        accompanimentPattern = `${voicing.bass}2 ${n2}2 ${n1}2 ${n2}2 | ${voicing.bass}2 ${n3}2 ${n1}2 ${n3}2 |`;
    } else {
        // Broken chord pattern with rhythm
        accompanimentPattern = `[${voicing.bass}${n1}${n2}]2 ${voicing.bass}2 ${n1}2 ${n2}2 | [${voicing.bass}${n1}${n3}]2 ${voicing.bass}2 ${n1}2 ${n3}2 |`;
    }

    return `X:1
T:Default Pattern
M:4/4
L:1/8
K:C
V:1 clef=treble name="Melody"
V:2 clef=bass name="Accompaniment"
V:1
"${chord}"${melodyLine} | ${melodyLine} ||
V:2
${accompanimentPattern}`;
}

/**
 * Generate a more complex multi-bar piano pattern for a chord progression
 */
export function getDefaultProgressionNotes(chords: string[]): string {
    const patterns = chords.map((chord, idx) => {
        const style: ('arpeggio' | 'alberti' | 'broken')[] = ['arpeggio', 'alberti', 'broken'];
        return getDefaultPianoNotes(chord, style[idx % 3]);
    }).join('\n\n');

    return `X:1
T:Chord Progression
M:4/4
L:1/8
K:C
${patterns}`;
}
