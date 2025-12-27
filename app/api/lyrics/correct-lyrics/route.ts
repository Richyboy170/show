import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVideoById, getLyricsByVideoId } from '@/lib/firestore';
import { firestore, COLLECTIONS } from '@/lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

// Lazy initialization - only create when API is called
let openaiClient: OpenAI | null = null;
function getOpenAI() {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

interface LyricCorrection {
    id: string;
    original: string;
    corrected: string;
    changed: boolean;
}

/**
 * AI Lyrics Corrector - fixes weird/wrong words in extracted lyrics
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!session.user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { videoId } = body;

        if (!videoId) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        console.log('[CORRECT-LYRICS] Starting for video:', videoId);

        // Get video details
        const video = await getVideoById(videoId);

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        // Get lyrics
        const lyrics = await getLyricsByVideoId(videoId);

        if (!lyrics || lyrics.length === 0) {
            return NextResponse.json({
                error: 'No lyrics found for this video.'
            }, { status: 400 });
        }

        // Prepare lyrics text for AI
        const lyricsText = lyrics.map((l, i) => `[${i}] ${l.thaiText}`).join('\n');

        // Call OpenAI to correct lyrics
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a Thai song lyrics expert. Your task is to review and correct Thai song lyrics that may have been incorrectly transcribed.

Rules:
1. Only fix words that are clearly wrong or don't make sense in the song context
2. Keep words that are already correct - DO NOT change them
3. Fix common transcription errors (similar sounding Thai words)
4. Maintain the original meaning and emotion of the lyrics
5. Do NOT add or remove words, only correct wrong ones

Output format: Return a JSON array of corrections. Only include lines that need changes.
Format: [{"index": 0, "corrected": "corrected Thai text"}, ...]

If a line is correct, do NOT include it in the output.`
                },
                {
                    role: 'user',
                    content: `Song title: "${video.title}"

Here are the extracted lyrics (indexed). Please review and correct any wrong words:

${lyricsText}

Return ONLY a JSON array of corrections for lines that need fixing. If all lyrics are correct, return an empty array [].`
                }
            ],
            temperature: 0.3,
            max_tokens: 4000,
        });

        const responseContent = completion.choices[0]?.message?.content || '[]';

        // Parse corrections
        let corrections: Array<{ index: number; corrected: string }> = [];
        try {
            // Extract JSON from response
            const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                corrections = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.error('[CORRECT-LYRICS] Failed to parse AI response:', parseError);
            return NextResponse.json({
                error: 'Failed to parse AI corrections',
                raw: responseContent
            }, { status: 500 });
        }

        if (corrections.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'All lyrics look correct! No changes needed.',
                updated: 0
            });
        }

        // Apply corrections to Firestore
        const batch = firestore.batch();
        const now = Timestamp.now();
        let updatedCount = 0;

        for (const correction of corrections) {
            const lyric = lyrics[correction.index];
            if (lyric && correction.corrected && correction.corrected !== lyric.thaiText) {
                const lyricRef = firestore
                    .collection(COLLECTIONS.VIDEOS)
                    .doc(videoId)
                    .collection(COLLECTIONS.LYRICS)
                    .doc(lyric.id);

                batch.update(lyricRef, {
                    thaiText: correction.corrected,
                    updatedAt: now
                });
                updatedCount++;

                console.log(`[CORRECT-LYRICS] Fixed: "${lyric.thaiText}" -> "${correction.corrected}"`);
            }
        }

        await batch.commit();

        console.log(`[CORRECT-LYRICS] Corrected ${updatedCount} lyrics`);

        return NextResponse.json({
            success: true,
            message: `Corrected ${updatedCount} lyrics`,
            updated: updatedCount,
            corrections: corrections.map(c => ({
                original: lyrics[c.index]?.thaiText,
                corrected: c.corrected
            }))
        });

    } catch (error: any) {
        console.error('[CORRECT-LYRICS] Error:', error);
        return NextResponse.json({
            error: 'Failed to correct lyrics',
            details: error.message
        }, { status: 500 });
    }
}
