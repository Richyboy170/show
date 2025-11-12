import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractVideoId, fetchVideoDetails, parseDuration } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error('[VIDEO API] Unauthorized: No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { youtubeUrl, adminId } = body;

    console.log('[VIDEO API] Request received:', { youtubeUrl, adminId, user: session.user.email });

    if (!youtubeUrl) {
      console.error('[VIDEO API] YouTube URL is missing');
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    // Extract video ID
    const videoId = extractVideoId(youtubeUrl);
    console.log('[VIDEO API] Extracted video ID:', videoId);

    if (!videoId) {
      console.error('[VIDEO API] Could not extract video ID from URL:', youtubeUrl);
      return NextResponse.json({
        error: "Invalid YouTube URL. Please use formats like: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
      }, { status: 400 });
    }

    // Check if video already exists
    const existingVideo = await prisma.video.findUnique({
      where: { youtubeId: videoId }
    });

    if (existingVideo) {
      console.warn('[VIDEO API] Video already exists:', videoId);
      return NextResponse.json({
        error: "Video already exists in the database"
      }, { status: 400 });
    }

    // Check if YouTube API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      console.error('[VIDEO API] YOUTUBE_API_KEY is not configured in environment variables');
      return NextResponse.json({
        error: "YouTube API is not configured. Please contact the administrator."
      }, { status: 500 });
    }

    // Fetch video details from YouTube
    console.log('[VIDEO API] Fetching video details from YouTube API...');
    const videoDetails = await fetchVideoDetails(videoId);

    if (!videoDetails) {
      console.error('[VIDEO API] Failed to fetch video details from YouTube for video ID:', videoId);
      return NextResponse.json({
        error: "Could not fetch video details from YouTube. Please check if the video exists and is public, or verify your YouTube API key."
      }, { status: 400 });
    }

    console.log('[VIDEO API] Successfully fetched video details:', {
      title: videoDetails.title,
      channelTitle: videoDetails.channelTitle
    });

    // Create video in database
    const video = await prisma.video.create({
      data: {
        youtubeId: videoId,
        title: videoDetails.title,
        description: videoDetails.description,
        thumbnailUrl: videoDetails.thumbnailUrl,
        publishedAt: new Date(videoDetails.publishedAt),
        duration: parseDuration(videoDetails.duration),
        channelTitle: videoDetails.channelTitle,
        adminId: adminId
      },
      include: {
        lyrics: true
      }
    });

    console.log('[VIDEO API] Video created successfully:', video.id);
    return NextResponse.json(video);
  } catch (error) {
    console.error('[VIDEO API] Unexpected error:', error);
    return NextResponse.json({
      error: "Internal server error. Please check the server logs for details."
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const videos = await prisma.video.findMany({
      include: {
        lyrics: {
          orderBy: {
            startTime: 'asc'
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
