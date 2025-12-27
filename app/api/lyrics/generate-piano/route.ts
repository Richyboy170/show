import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePianoNotesForLyrics, LyricForPianoGeneration } from '@/lib/piano-generator';
import { getVideoByYoutubeId, getLyricsByVideoId, getVideoById } from '@/lib/firestore';
import { firestore, COLLECTIONS } from '@/lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for AI generation

/**
 * Generate AI piano note suggestions for a video's lyrics
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
        const { videoId, autoApply = false } = body;

        if (!videoId) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        console.log('[GENERATE-PIANO] Starting piano note generation for video:', videoId);

        // Get video details
        let video = await getVideoById(videoId);
        let videoDocId = videoId;

        if (!video) {
            // Try by YouTube ID
            video = await getVideoByYoutubeId(videoId);
            if (video) {
                videoDocId = video.id;
            }
        }

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        // Get lyrics for the video
        const lyrics = await getLyricsByVideoId(videoDocId);

        if (!lyrics || lyrics.length === 0) {
            return NextResponse.json({
                error: 'No lyrics found for this video. Please add lyrics first.'
            }, { status: 400 });
        }

        // Prepare lyrics for piano note generation
        const lyricsForGeneration: LyricForPianoGeneration[] = lyrics.map((lyric: any, index: number) => ({
            id: lyric.id,
            thaiText: lyric.thaiText,
            chords: lyric.chords,
            startTime: lyric.startTime,
            endTime: lyric.endTime,
            order: lyric.order ?? index
        }));

        // Generate piano note suggestions
        const suggestions = await generatePianoNotesForLyrics(
            video.youtubeId,
            lyricsForGeneration,
            video.title
        );

        // If autoApply is true, update the lyrics with the generated piano notes
        if (autoApply) {
            const batch = firestore.batch();
            let updatedCount = 0;

            for (const suggestion of suggestions) {
                if (suggestion.pianoNotes) {
                    const lyricRef = firestore
                        .collection(COLLECTIONS.VIDEOS)
                        .doc(videoDocId)
                        .collection(COLLECTIONS.LYRICS)
                        .doc(suggestion.lyricId);

                    batch.update(lyricRef, {
                        pianoNotes: suggestion.pianoNotes,
                        updatedAt: Timestamp.now()
                    });
                    updatedCount++;
                }
            }

            await batch.commit();
            console.log(`[GENERATE-PIANO] Applied ${updatedCount} piano note suggestions`);

            return NextResponse.json({
                success: true,
                message: `Generated and applied piano notes to ${updatedCount} lyrics`,
                updatedCount,
                suggestions
            });
        }

        // Return suggestions without applying
        return NextResponse.json({
            success: true,
            message: `Generated ${suggestions.filter(s => s.pianoNotes).length} piano note suggestions`,
            suggestions,
            applied: 0
        });

    } catch (error: any) {
        console.error('[GENERATE-PIANO] Error:', error);

        let errorMessage = 'Failed to generate piano notes';
        let suggestion = '';
        let details = error.message || 'Unknown error';

        // Handle specific error types with user-friendly messages
        if (error.message?.includes('copyright') || error.message?.includes('cannot create')) {
            errorMessage = 'Copyright Restriction';
            details = error.message;
            suggestion = 'The AI cannot transcribe copyrighted music as it would reproduce protected melodies. This feature works best with original compositions or public domain music.';
        } else if (error.message?.includes('All AI providers exhausted')) {
            errorMessage = 'All AI providers out of quota';
            details = 'All configured AI services have reached their usage limits.';
            suggestion = 'Please add credits to your AI provider accounts:\n' +
                        '• OpenAI: https://platform.openai.com/account/billing\n' +
                        '• Try again in a few minutes if rate limited';
        } else if (error.message?.includes('Invalid AI response')) {
            errorMessage = 'AI response format error';
            details = error.message;
            suggestion = 'The AI could not generate valid piano notation for this song. This may happen with complex melodies or unfamiliar songs.';
        } else if (error.message?.includes('quota') || error.message?.includes('429')) {
            errorMessage = 'API quota exceeded';
            details = 'Your AI provider accounts have run out of credits.';
            suggestion = 'Please add credits at https://platform.openai.com/account/billing';
        } else if (error.message?.includes('No AI providers')) {
            errorMessage = 'No AI providers configured';
            suggestion = 'Please set up at least one AI API key in your .env file (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)';
        }

        return NextResponse.json({
            error: errorMessage,
            suggestion,
            details
        }, { status: 500 });
    }
}
