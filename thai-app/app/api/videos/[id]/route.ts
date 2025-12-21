import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getVideoById,
  deleteVideo,
  updateVideo,
  getLyricsByVideoId
} from "@/lib/firestore";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!session.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    await deleteVideo(resolvedParams.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const video = await getVideoById(resolvedParams.id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Get lyrics for the video
    const lyrics = await getLyricsByVideoId(resolvedParams.id);

    return NextResponse.json({ ...video, lyrics });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!session.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { title, description } = body;

    const video = await updateVideo(resolvedParams.id, {
      title,
      description
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Get lyrics for the response
    const lyrics = await getLyricsByVideoId(resolvedParams.id);

    return NextResponse.json({ ...video, lyrics });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
