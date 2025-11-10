import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, thaiText, translation, startTime, endTime, order } = body;

    if (!videoId || !thaiText || startTime === undefined || endTime === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lyric = await prisma.lyric.create({
      data: {
        videoId,
        thaiText,
        translation: translation || null,
        startTime: parseFloat(startTime),
        endTime: parseFloat(endTime),
        order: order || 0
      }
    });

    return NextResponse.json(lyric);
  } catch (error) {
    console.error('Error creating lyric:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, thaiText, translation, startTime, endTime, order } = body;

    if (!id) {
      return NextResponse.json({ error: "Lyric ID is required" }, { status: 400 });
    }

    const lyric = await prisma.lyric.update({
      where: { id },
      data: {
        ...(thaiText && { thaiText }),
        ...(translation !== undefined && { translation }),
        ...(startTime !== undefined && { startTime: parseFloat(startTime) }),
        ...(endTime !== undefined && { endTime: parseFloat(endTime) }),
        ...(order !== undefined && { order })
      }
    });

    return NextResponse.json(lyric);
  } catch (error) {
    console.error('Error updating lyric:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Lyric ID is required" }, { status: 400 });
    }

    await prisma.lyric.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lyric:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
