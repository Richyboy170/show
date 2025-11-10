import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractVideoId, fetchVideoDetails, parseDuration } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { youtubeUrl, adminId } = body;

    if (!youtubeUrl) {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    // Extract video ID
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Check if video already exists
    const existingVideo = await prisma.video.findUnique({
      where: { youtubeId: videoId }
    });

    if (existingVideo) {
      return NextResponse.json({ error: "Video already exists" }, { status: 400 });
    }

    // Fetch video details from YouTube
    const videoDetails = await fetchVideoDetails(videoId);
    if (!videoDetails) {
      return NextResponse.json({ error: "Could not fetch video details from YouTube" }, { status: 400 });
    }

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

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error adding video:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
