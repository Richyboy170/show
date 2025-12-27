import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVideoById, getVideoByYoutubeId, createLyric, deleteAllLyricsForVideo } from '@/lib/firestore';
import { extractLyricsFromVideo } from '@/lib/transcript';
import { extractLyricsWithWhisper, isWhisperConfigured } from '@/lib/whisper-transcript';
import { setProgress, addLog, clearProgress } from '@/lib/progress-tracker';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for AI transcription

/**
 * Auto-import lyrics from YouTube video
 * Tries YouTube captions first, falls back to Whisper AI transcription
 */
export async function POST(request: Request) {
    let jobId: string | undefined;

    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!session.user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { videoId, jobId: clientJobId } = body;

        if (!videoId) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        jobId = clientJobId || `${videoId}-${Date.now()}`;
        console.log('[AUTO-IMPORT] Starting for video:', videoId, 'jobId:', jobId);

        setProgress(jobId!, 5, 'Initializing...');
        addLog(jobId!, 'Starting auto-import process');

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
            setProgress(jobId!, 0, 'Video not found');
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        setProgress(jobId!, 10, 'Found video, preparing...');
        addLog(jobId!, `Video: ${video.title}`);

        const youtubeId = video.youtubeId;
        let lyrics: any[] = [];
        let method: 'captions' | 'whisper' = 'captions';
        let errorDetails: any = {};

        // Try YouTube captions first (faster and more reliable)
        setProgress(jobId!, 15, 'Trying YouTube captions...');
        addLog(jobId!, 'Attempting to fetch YouTube captions');

        try {
            lyrics = await extractLyricsFromVideo(youtubeId);
            addLog(jobId!, `Found ${lyrics.length} caption segments`);

            if (lyrics.length === 0) {
                throw new Error('No captions found');
            }

            setProgress(jobId!, 50, 'Successfully fetched captions');
        } catch (captionError: any) {
            console.log('[AUTO-IMPORT] YouTube captions failed:', captionError.message);
            addLog(jobId!, `Captions failed: ${captionError.message}`);
            errorDetails.captions = captionError.message;

            // Check if Whisper is configured
            if (isWhisperConfigured()) {
                setProgress(jobId!, 25, 'Captions unavailable, trying AI transcription...');
                addLog(jobId!, 'Falling back to AI transcription');

                try {
                    // Use Whisper AI transcription
                    lyrics = await extractLyricsWithWhisper(youtubeId, (progress, message) => {
                        // Map whisper progress (25-75) to our progress (25-70)
                        const mappedProgress = Math.round(25 + (progress - 25) * (70 - 25) / (75 - 25));
                        setProgress(jobId!, mappedProgress, message);
                        addLog(jobId!, message);
                    });

                    method = 'whisper';
                    addLog(jobId!, `AI transcription complete: ${lyrics.length} segments`);
                    setProgress(jobId!, 70, 'AI transcription complete');
                } catch (whisperError: any) {
                    console.error('[AUTO-IMPORT] Whisper failed:', whisperError.message);
                    addLog(jobId!, `AI transcription failed: ${whisperError.message}`);
                    errorDetails.whisper = whisperError.message;

                    // Check for specific quota errors
                    const isQuotaError = whisperError.message?.includes('quota') ||
                        whisperError.message?.includes('exceeded') ||
                        whisperError.message?.includes('insufficient_quota') ||
                        whisperError.message?.includes('rate_limit');

                    return NextResponse.json({
                        error: 'All extraction methods failed',
                        details: errorDetails,
                        isQuotaError,
                        suggestion: isQuotaError
                            ? 'Your API quota is exhausted. Add credits or wait for quota reset.'
                            : 'Try a video with captions enabled, or add lyrics manually.'
                    }, { status: 500 });
                }
            } else {
                // No Whisper configured, return error
                addLog(jobId!, 'AI transcription not configured');

                return NextResponse.json({
                    error: 'YouTube captions not available',
                    details: {
                        captions: errorDetails.captions,
                        whisper: 'AI transcription not configured (OPENAI_API_KEY missing)'
                    },
                    suggestion: 'Configure OPENAI_API_KEY for AI transcription, or choose a video with captions.'
                }, { status: 400 });
            }
        }

        if (!lyrics || lyrics.length === 0) {
            setProgress(jobId!, 0, 'No lyrics found');
            return NextResponse.json({
                error: 'No lyrics could be extracted',
                details: errorDetails
            }, { status: 400 });
        }

        // Delete existing lyrics
        setProgress(jobId!, 75, 'Clearing existing lyrics...');
        addLog(jobId!, 'Removing old lyrics');

        await deleteAllLyricsForVideo(videoDocId);

        // Save new lyrics
        setProgress(jobId!, 80, 'Saving new lyrics...');
        addLog(jobId!, `Saving ${lyrics.length} lyric lines`);

        for (let i = 0; i < lyrics.length; i++) {
            const lyric = lyrics[i];
            await createLyric(videoDocId, {
                videoId: videoDocId,
                thaiText: lyric.thaiText,
                translation: lyric.translation || '',
                chords: '',
                startTime: lyric.startTime,
                endTime: lyric.endTime,
                order: i
            });

            // Update progress as we save
            const saveProgress = 80 + Math.round((i / lyrics.length) * 15);
            if (i % 5 === 0) {
                setProgress(jobId!, saveProgress, `Saved ${i + 1}/${lyrics.length} lyrics...`);
            }
        }

        setProgress(jobId!, 100, 'Complete!');
        addLog(jobId!, `Successfully imported ${lyrics.length} lyrics using ${method === 'whisper' ? 'AI transcription' : 'YouTube captions'}`);

        console.log(`[AUTO-IMPORT] Successfully imported ${lyrics.length} lyrics using ${method}`);

        // Clear progress after a delay
        setTimeout(() => {
            if (jobId) clearProgress(jobId!);
        }, 30000);

        return NextResponse.json({
            success: true,
            lyricsCount: lyrics.length,
            method,
            message: `Imported ${lyrics.length} lyrics using ${method === 'whisper' ? 'AI Audio Transcription' : 'YouTube Captions'}`
        });

    } catch (error: any) {
        console.error('[AUTO-IMPORT] Error:', error);

        if (jobId) {
            setProgress(jobId!, 0, 'Error occurred');
            addLog(jobId!, `Error: ${error.message}`);
        }

        // Check for quota errors
        const isQuotaError = error.message?.includes('quota') ||
            error.message?.includes('exceeded') ||
            error.code === 'insufficient_quota';

        return NextResponse.json({
            error: 'Failed to auto-import lyrics',
            details: error.message,
            isQuotaError,
            suggestion: isQuotaError
                ? 'API quota exceeded. Please check your billing settings.'
                : undefined
        }, { status: 500 });
    }
}
