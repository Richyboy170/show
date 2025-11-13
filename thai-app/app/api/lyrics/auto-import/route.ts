import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractLyricsFromVideo } from '@/lib/transcript';

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
    const { videoId } = body;

    console.log('[AUTO-IMPORT] Request received:', { videoId, user: session.user.email });

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { lyrics: true }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if lyrics already exist
    if (video.lyrics.length > 0) {
      return NextResponse.json({
        error: 'Video already has lyrics. Please delete existing lyrics before auto-importing.',
        existingLyricsCount: video.lyrics.length
      }, { status: 400 });
    }

    console.log('[AUTO-IMPORT] Extracting transcript from YouTube...');

    // Extract transcript
    let processedLyrics;
    try {
      processedLyrics = await extractLyricsFromVideo(video.youtubeId);
    } catch (error: any) {
      console.error('[AUTO-IMPORT] Failed to extract transcript:', error);
      return NextResponse.json({
        error: 'Failed to extract transcript from video. The video may not have captions available.',
        details: error.message
      }, { status: 400 });
    }

    if (processedLyrics.length === 0) {
      return NextResponse.json({
        error: 'No transcript found for this video. The video may not have captions enabled.'
      }, { status: 400 });
    }

    console.log('[AUTO-IMPORT] Creating', processedLyrics.length, 'lyric lines with word-level timestamps...');

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

    console.log('[AUTO-IMPORT] Successfully imported', createdLyrics.length, 'lyrics');

    return NextResponse.json({
      success: true,
      lyricsCount: createdLyrics.length,
      lyrics: createdLyrics
    });
  } catch (error) {
    console.error('[AUTO-IMPORT] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error. Please check the server logs for details.'
    }, { status: 500 });
  }
}
