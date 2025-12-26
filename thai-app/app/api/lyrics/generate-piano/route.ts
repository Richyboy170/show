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

        if (error.message?.includes('OpenAI API key')) {
            errorMessage = 'OpenAI API key not configured';
            suggestion = 'Please set OPENAI_API_KEY in your .env file.';
        } else if (error.message?.includes('rate_limit')) {
            errorMessage = 'OpenAI API rate limit exceeded';
            suggestion = 'Please wait a few moments and try again.';
        } else if (error.message?.includes('insufficient_quota')) {
            errorMessage = 'OpenAI API quota exceeded';
            suggestion = 'Please check your OpenAI billing settings.';
        }

        return NextResponse.json({
            error: errorMessage,
            suggestion,
            details: error.message
        }, { status: 500 });
    }
}
