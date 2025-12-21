import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAdminByEmail,
  getUserByEmail,
  getFavorite
} from "@/lib/firestore";

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
      const admin = await getAdminByEmail(session.user.email);

      if (!admin) {
        return NextResponse.json({ isFavorited: false });
      }

      // Check if favorited
      favorite = await getFavorite(null, admin.id, videoId);
    } else {
      // Normal user
      const user = await getUserByEmail(session.user.email);

      if (!user) {
        return NextResponse.json({ isFavorited: false });
      }

      // Check if favorited
      favorite = await getFavorite(user.id, null, videoId);
    }

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
