import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractLyricsFromVideo } from '@/lib/transcript';
import { extractLyricsWithWhisper, isWhisperConfigured } from '@/lib/whisper-transcript';
import { extractLyricsWithOCR, isOCRAvailable } from '@/lib/video-ocr-transcript';
import { setProgress, clearProgress, addLog } from '@/lib/progress-tracker';

// Configure route to allow longer execution time
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.error('[AUTO-IMPORT] Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!session.user?.isAdmin) {
      console.error('[AUTO-IMPORT] Forbidden: User is not an admin');
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { videoId, jobId: clientJobId } = body;

    // Use client jobId or generate one
    const jobId = clientJobId || `${videoId}-${Date.now()}`;

    console.log('[AUTO-IMPORT] Request received:', { videoId, jobId, user: session.user.email });

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Initialize progress
    setProgress(jobId, 0, 'Starting extraction...');
    addLog(jobId, 'Auto-import job started');

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { lyrics: true }
    });

    if (!video) {
      addLog(jobId, `ERROR: Video not found (ID: ${videoId})`);
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if lyrics already exist
    if (video.lyrics.length > 0) {
      addLog(jobId, `ERROR: Video already has ${video.lyrics.length} existing lyrics`);
      return NextResponse.json({
        error: 'Video already has lyrics. Please delete existing lyrics before auto-importing.',
        existingLyricsCount: video.lyrics.length
      }, { status: 400 });
    }

    console.log('[AUTO-IMPORT] Video YouTube ID:', video.youtubeId);
    addLog(jobId, `Video found: "${video.title}" (YouTube ID: ${video.youtubeId})`);

    setProgress(jobId, 10, 'Checking video...');
    console.log('[AUTO-IMPORT] Extracting lyrics from video...');
    addLog(jobId, 'Preparing extraction methods...');

    let processedLyrics;
    let extractionMethod = 'unknown';
    let confidenceScore: number | undefined;

    // Try OCR first (cheapest method)
    if (isOCRAvailable()) {
      console.log('[AUTO-IMPORT] Attempting OCR-based extraction (scanning video frames)...');
      addLog(jobId, 'Method 1: OCR (Optical Character Recognition) - Scanning video frames for Thai text');
      setProgress(jobId, 15, 'Starting OCR extraction...');

      try {
        addLog(jobId, 'Downloading video from YouTube...');
        const ocrResult = await extractLyricsWithOCR(
          video.youtubeId,
          { frameInterval: 2, confidenceThreshold: 60 },
          (progress, message) => {
            setProgress(jobId, progress, message);
            // Also log OCR progress messages
            if (message.includes('Scene') || message.includes('frame') || message.includes('Dedup') || message.includes('OCR')) {
              addLog(jobId, message);
            }
          }
        );
        processedLyrics = ocrResult.lyrics;
        confidenceScore = ocrResult.confidence;
        extractionMethod = 'ocr';
        console.log(`[AUTO-IMPORT] Successfully used OCR extraction (confidence: ${confidenceScore.toFixed(1)}%)`);
        addLog(jobId, `✓ OCR extraction successful! Confidence: ${confidenceScore.toFixed(1)}%`);
        addLog(jobId, `Extracted ${processedLyrics.length} lyric lines from video frames`);
        setProgress(jobId, 80, 'OCR extraction completed!');
      } catch (ocrError: any) {
        console.error('[AUTO-IMPORT] OCR extraction failed:', {
          videoId: video.youtubeId,
          error: ocrError.message,
          stack: ocrError.stack,
          code: ocrError.code
        });

        addLog(jobId, `✗ OCR extraction failed: ${ocrError.message}`);

        // Check for quota/API errors in OCR
        if (ocrError.message?.includes('quota') || ocrError.message?.includes('429')) {
          console.error('[AUTO-IMPORT] API quota exceeded during OCR');
          addLog(jobId, 'ERROR: API quota exceeded');
        }

        console.log('[AUTO-IMPORT] Falling back to audio transcription...');
        addLog(jobId, 'Trying fallback method: Audio transcription...');

        // Fallback to Whisper audio transcription
        if (isWhisperConfigured()) {
          console.log('[AUTO-IMPORT] Attempting Whisper audio transcription...');
          addLog(jobId, 'Method 2: Whisper AI - Audio transcription with OpenAI');
          setProgress(jobId, 20, 'Downloading audio from YouTube...');

          try {
            processedLyrics = await extractLyricsWithWhisper(video.youtubeId, (progress, message) => {
              setProgress(jobId, progress, message);
              addLog(jobId, message);
            });
            extractionMethod = 'whisper';
            console.log('[AUTO-IMPORT] Successfully used Whisper transcription');
            addLog(jobId, `✓ Whisper transcription successful! Extracted ${processedLyrics.length} lyric lines`);
            setProgress(jobId, 80, 'Transcription completed!');
          } catch (whisperError: any) {
            console.error('[AUTO-IMPORT] Whisper transcription failed:', {
              videoId: video.youtubeId,
              error: whisperError.message,
              stack: whisperError.stack,
              code: whisperError.code,
              response: whisperError.response?.data
            });

            addLog(jobId, `✗ Whisper transcription failed: ${whisperError.message}`);

            // Check for OpenAI quota/rate limit errors
            if (whisperError.message?.includes('rate_limit') ||
                whisperError.message?.includes('insufficient_quota') ||
                whisperError.message?.includes('429')) {
              console.error('[AUTO-IMPORT] OpenAI API quota/rate limit exceeded');
              addLog(jobId, 'ERROR: OpenAI API quota/rate limit exceeded');
            }

            console.log('[AUTO-IMPORT] Falling back to YouTube captions...');
            addLog(jobId, 'Trying final fallback method: YouTube captions...');
            setProgress(jobId, 30, 'Trying YouTube captions...');

            // Final fallback to YouTube captions
            try {
              addLog(jobId, 'Method 3: YouTube Captions - Extracting auto-generated captions');
              processedLyrics = await extractLyricsFromVideo(video.youtubeId);
              extractionMethod = 'youtube-captions';
              console.log('[AUTO-IMPORT] Successfully used YouTube captions');
              addLog(jobId, `✓ YouTube captions extracted! Found ${processedLyrics.length} lyric lines`);
              setProgress(jobId, 70, 'Captions extracted!');
            } catch (captionError: any) {
              console.error('[AUTO-IMPORT] YouTube captions also failed:', {
                videoId: video.youtubeId,
                error: captionError.message,
                stack: captionError.stack,
                code: captionError.code
              });

              addLog(jobId, `✗ YouTube captions failed: ${captionError.message}`);

              // Check for YouTube API quota errors
              if (captionError.message?.includes('quota') ||
                  captionError.message?.includes('quotaExceeded') ||
                  captionError.message?.includes('403')) {
                console.error('[AUTO-IMPORT] YouTube API quota exceeded');
                addLog(jobId, 'ERROR: YouTube API quota exceeded');
              }

              addLog(jobId, '✗✗✗ All extraction methods failed ✗✗✗');
              clearProgress(jobId);
              return NextResponse.json({
                error: 'Failed to extract lyrics. All methods failed: OCR, audio transcription, and YouTube captions.',
                details: {
                  ocr: ocrError.message,
                  whisper: whisperError.message,
                  captions: captionError.message
                },
                errors: {
                  ocrQuota: ocrError.message?.includes('quota') || ocrError.message?.includes('429'),
                  whisperQuota: whisperError.message?.includes('rate_limit') || whisperError.message?.includes('insufficient_quota'),
                  youtubeQuota: captionError.message?.includes('quota') || captionError.message?.includes('quotaExceeded')
                },
                videoId: video.youtubeId
              }, { status: 400 });
            }
          }
        } else {
          // No Whisper configured, try YouTube captions
          console.log('[AUTO-IMPORT] Whisper not configured, trying YouTube captions...');
          setProgress(jobId, 30, 'Extracting YouTube captions...');

          try {
            processedLyrics = await extractLyricsFromVideo(video.youtubeId);
            extractionMethod = 'youtube-captions';
            console.log('[AUTO-IMPORT] Successfully used YouTube captions');
            setProgress(jobId, 70, 'Captions extracted!');
          } catch (captionError: any) {
            console.error('[AUTO-IMPORT] YouTube captions also failed:', {
              videoId: video.youtubeId,
              error: captionError.message
            });
            clearProgress(jobId);
            return NextResponse.json({
              error: 'Failed to extract lyrics. Both OCR and YouTube captions failed. Configure OPENAI_API_KEY for audio transcription.',
              details: `OCR Error: ${ocrError.message}; Captions Error: ${captionError.message}`,
              videoId: video.youtubeId
            }, { status: 400 });
          }
        }
      }
    } else {
      // OCR not available (shouldn't happen with Tesseract, but keeping for safety)
      console.log('[AUTO-IMPORT] OCR not available, skipping...');

      // Try Whisper
      if (isWhisperConfigured()) {
        console.log('[AUTO-IMPORT] Attempting Whisper audio transcription...');
        setProgress(jobId, 20, 'Downloading audio from YouTube...');

        try {
          processedLyrics = await extractLyricsWithWhisper(video.youtubeId, (progress, message) => {
            setProgress(jobId, progress, message);
          });
          extractionMethod = 'whisper';
          console.log('[AUTO-IMPORT] Successfully used Whisper transcription');
          setProgress(jobId, 80, 'Transcription completed!');
        } catch (whisperError: any) {
          console.error('[AUTO-IMPORT] Whisper transcription failed:', {
            videoId: video.youtubeId,
            error: whisperError.message
          });
          console.log('[AUTO-IMPORT] Falling back to YouTube captions...');
          setProgress(jobId, 30, 'Trying YouTube captions...');

          try {
            processedLyrics = await extractLyricsFromVideo(video.youtubeId);
            extractionMethod = 'youtube-captions';
            console.log('[AUTO-IMPORT] Successfully used YouTube captions');
            setProgress(jobId, 70, 'Captions extracted!');
          } catch (captionError: any) {
            clearProgress(jobId);
            return NextResponse.json({
              error: 'Failed to extract lyrics. Both audio transcription and YouTube captions failed.',
              details: `Whisper Error: ${whisperError.message}; Captions Error: ${captionError.message}`,
              videoId: video.youtubeId
            }, { status: 400 });
          }
        }
      } else {
        // Only YouTube captions available
        console.log('[AUTO-IMPORT] Trying YouTube captions...');
        setProgress(jobId, 30, 'Extracting YouTube captions...');

        try {
          processedLyrics = await extractLyricsFromVideo(video.youtubeId);
          extractionMethod = 'youtube-captions';
          console.log('[AUTO-IMPORT] Successfully used YouTube captions');
          setProgress(jobId, 70, 'Captions extracted!');
        } catch (error: any) {
          console.error('[AUTO-IMPORT] Failed to extract lyrics:', error);
          clearProgress(jobId);
          return NextResponse.json({
            error: 'Failed to extract lyrics from video. Configure OPENAI_API_KEY for audio transcription.',
            details: error.message
          }, { status: 400 });
        }
      }
    }

    if (processedLyrics.length === 0) {
      addLog(jobId, 'ERROR: No transcript found for this video');
      return NextResponse.json({
        error: 'No transcript found for this video. The video may not have captions enabled.'
      }, { status: 400 });
    }

    setProgress(jobId, 85, 'Processing lyrics...');
    console.log('[AUTO-IMPORT] Creating', processedLyrics.length, 'lyric lines with word-level timestamps...');
    addLog(jobId, `Processing ${processedLyrics.length} lyric lines for database...`);

    // Count total words
    const totalWords = processedLyrics.reduce((sum, lyric) => sum + (lyric.words?.length || 0), 0);
    addLog(jobId, `Total words with timestamps: ${totalWords}`);

    setProgress(jobId, 90, 'Saving to database...');
    addLog(jobId, 'Creating database transaction...');

    // Create lyrics with word-level timestamps in a transaction
    const createdLyrics = await prisma.$transaction(
      processedLyrics.map((lyric) => {
        return prisma.lyric.create({
          data: {
            videoId: video.id,
            thaiText: lyric.thaiText,
            translation: lyric.translation,
            startTime: lyric.startTime,
            endTime: lyric.endTime,
            order: lyric.order,
            words: {
              create: lyric.words.map((word) => ({
                text: word.text,
                startTime: word.startTime,
                duration: word.duration,
                order: word.order
              }))
            }
          },
          include: {
            words: true
          }
        });
      })
    );

    setProgress(jobId, 100, 'Complete!');
    console.log('[AUTO-IMPORT] Successfully imported', createdLyrics.length, 'lyrics');
    addLog(jobId, `✓ Successfully saved ${createdLyrics.length} lyric lines to database`);
    addLog(jobId, `Extraction method: ${extractionMethod.toUpperCase()}`);
    if (confidenceScore) {
      addLog(jobId, `OCR confidence score: ${confidenceScore.toFixed(1)}%`);
    }
    addLog(jobId, '========== AUTO-IMPORT COMPLETE ==========');

    // Clear progress after a short delay
    setTimeout(() => clearProgress(jobId), 2000);

    return NextResponse.json({
      success: true,
      jobId,
      lyricsCount: createdLyrics.length,
      method: extractionMethod,
      confidence: confidenceScore,
      lyrics: createdLyrics
    });
  } catch (error: any) {
    console.error('[AUTO-IMPORT] Unexpected error:', error);

    // Detailed error information for debugging
    const errorDetails = {
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      stack: error.stack,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : undefined
    };

    console.error('[AUTO-IMPORT] Error details:', JSON.stringify(errorDetails, null, 2));

    // Check for specific error types
    let errorMessage = 'Internal server error.';
    let isApiQuotaError = false;

    if (error.message) {
      // YouTube API quota exceeded
      if (error.message.includes('quota') || error.message.includes('quotaExceeded')) {
        errorMessage = 'YouTube API quota exceeded. Please try again tomorrow or use a different API key.';
        isApiQuotaError = true;
      }
      // OpenAI API errors
      else if (error.message.includes('rate_limit') || error.message.includes('insufficient_quota')) {
        errorMessage = 'OpenAI API quota exceeded or rate limited. Please check your API key billing.';
        isApiQuotaError = true;
      }
      // Network/timeout errors
      else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      }
      // API key missing/invalid
      else if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'API authentication failed. Please check your API keys in .env.local';
      }
      else {
        errorMessage = `Error: ${error.message}`;
      }
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails,
      isQuotaError: isApiQuotaError,
      suggestion: isApiQuotaError
        ? 'API quota limits reached. Wait 24 hours or upgrade your API plan.'
        : 'Check server logs for detailed error information.'
    }, { status: 500 });
  }
}
