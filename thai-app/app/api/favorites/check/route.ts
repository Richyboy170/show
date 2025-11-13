import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ isFavorited: false });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const isAdmin = session.user.isAdmin;
    let favorite;

    if (isAdmin) {
      // Admin user
      const admin = await prisma.admin.findUnique({
        where: { email: session.user.email }
      });

      if (!admin) {
        return NextResponse.json({ isFavorited: false });
      }

      // Check if favorited
      favorite = await prisma.favorite.findUnique({
        where: {
          adminId_videoId: {
            adminId: admin.id,
            videoId: videoId
          }
        }
      });
    } else {
      // Normal user
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        return NextResponse.json({ isFavorited: false });
      }

      // Check if favorited
      favorite = await prisma.favorite.findUnique({
        where: {
          userId_videoId: {
            userId: user.id,
            videoId: videoId
          }
        }
      });
    }

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
