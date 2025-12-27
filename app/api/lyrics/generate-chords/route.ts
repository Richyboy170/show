import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateChordsForLyrics, LyricForChordGeneration } from '@/lib/chord-generator';
import { getVideoByYoutubeId, getLyricsByVideoId, getVideoById } from '@/lib/firestore';
import { firestore, COLLECTIONS } from '@/lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Generate AI chord suggestions for a video's lyrics
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

        console.log('[GENERATE-CHORDS] Starting chord generation for video:', videoId);

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

        // Prepare lyrics for chord generation
        const lyricsForGeneration: LyricForChordGeneration[] = lyrics.map((lyric: any, index: number) => ({
            id: lyric.id,
            thaiText: lyric.thaiText,
            startTime: lyric.startTime,
            endTime: lyric.endTime,
            order: lyric.order ?? index
        }));

        // Generate chord suggestions
        const suggestions = await generateChordsForLyrics(
            video.youtubeId,
            lyricsForGeneration,
            video.title
        );

        // If autoApply is true, update the lyrics with the suggested chords
        if (autoApply) {
            const batch = firestore.batch();
            let updatedCount = 0;

            for (const suggestion of suggestions) {
                if (suggestion.suggestedChords) {
                    const lyricRef = firestore
                        .collection(COLLECTIONS.VIDEOS)
                        .doc(videoDocId)
                        .collection(COLLECTIONS.LYRICS)
                        .doc(suggestion.lyricId);

                    batch.update(lyricRef, {
                        chords: suggestion.suggestedChords,
                        updatedAt: Timestamp.now()
                    });
                    updatedCount++;
                }
            }

            await batch.commit();
            console.log(`[GENERATE-CHORDS] Applied ${updatedCount} chord suggestions`);

            return NextResponse.json({
                success: true,
                message: `Generated and applied chords to ${updatedCount} lyrics`,
                suggestions,
                applied: updatedCount
            });
        }

        // Return suggestions without applying
        return NextResponse.json({
            success: true,
            message: `Generated ${suggestions.filter(s => s.suggestedChords).length} chord suggestions`,
            suggestions,
            applied: 0
        });

    } catch (error: any) {
        console.error('[GENERATE-CHORDS] Error:', error);

        let errorMessage = 'Failed to generate chords';
        let suggestion = '';

        if (error.message?.includes('OpenAI API key')) {
            errorMessage = 'OpenAI API key not configured';
            suggestion = 'Please set OPENAI_API_KEY in your .env file.';
        } else if (error.message?.includes('rate_limit')) {
            errorMessage = 'OpenAI API rate limit exceeded';
            suggestion = 'Please wait a few moments and try again.';
        }

        return NextResponse.json({
            error: errorMessage,
            suggestion,
            details: error.message
        }, { status: 500 });
    }
}
