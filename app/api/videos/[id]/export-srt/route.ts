import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to convert seconds to SRT timestamp format (HH:MM:SS,mmm)
function secondsToSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

// Helper function to generate SRT content from lyrics
function generateSRT(lyrics: Array<{ thaiText: string; translation: string | null; startTime: number; endTime: number; order: number }>): string {
  return lyrics
    .sort((a, b) => a.order - b.order)
    .map((lyric, index) => {
      const sequenceNumber = index + 1;
      const startTime = secondsToSRTTime(lyric.startTime);
      const endTime = secondsToSRTTime(lyric.endTime);

      // Combine Thai text and translation if available
      const text = lyric.translation
        ? `${lyric.thaiText}\n${lyric.translation}`
        : lyric.thaiText;

      return `${sequenceNumber}\n${startTime} --> ${endTime}\n${text}\n`;
    })
    .join('\n');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch video with lyrics
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        lyrics: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.lyrics.length === 0) {
      return NextResponse.json({ error: 'No lyrics available for this video' }, { status: 400 });
    }

    // Generate SRT content
    const srtContent = generateSRT(video.lyrics);

    // Return as downloadable file
    const fileName = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.srt`;

    return new NextResponse(srtContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting SRT:', error);
    return NextResponse.json({ error: 'Failed to export SRT' }, { status: 500 });
  }
}
