import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAdminByEmail,
  getUserByEmail,
  getFavorite,
  getFavoritesByAdmin,
  getFavoritesByUser,
  createFavorite,
  deleteFavorite,
  getVideoById
} from "@/lib/firestore";
import { firestore, COLLECTIONS } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const isAdmin = session.user.isAdmin;
    let accountId: string;
    let existing: any;

    if (isAdmin) {
      // Admin user
      const admin = await getAdminByEmail(session.user.email);

      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }

      accountId = admin.id;

      // Check if already favorited
      existing = await getFavorite(null, admin.id, videoId);
    } else {
      // Normal user
      const user = await getUserByEmail(session.user.email);

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      accountId = user.id;

      // Check if already favorited
      existing = await getFavorite(user.id, null, videoId);
    }

    if (existing) {
      return NextResponse.json({ error: "Already favorited" }, { status: 400 });
    }

    // Create favorite
    const favorite = await createFavorite(isAdmin ? {
      adminId: accountId,
      videoId: videoId
    } : {
      userId: accountId,
      videoId: videoId
    });

    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    console.error('Error creating favorite:', error);
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
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const isAdmin = session.user.isAdmin;

    if (isAdmin) {
      // Admin user
      const admin = await getAdminByEmail(session.user.email);

      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }

      // Find and delete favorite
      const favorite = await getFavorite(null, admin.id, videoId);
      if (favorite) {
        await deleteFavorite(favorite.id);
      }
    } else {
      // Normal user
      const user = await getUserByEmail(session.user.email);

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Find and delete favorite
      const favorite = await getFavorite(user.id, null, videoId);
      if (favorite) {
        await deleteFavorite(favorite.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.isAdmin;
    let favoritesWithVideos: any[] = [];

    if (isAdmin) {
      // Admin user
      const admin = await getAdminByEmail(session.user.email);

      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }

      const favorites = await getFavoritesByAdmin(admin.id);

      // Fetch videos for each favorite
      for (const fav of favorites) {
        const video = await getVideoById(fav.videoId);
        if (video) {
          favoritesWithVideos.push({
            ...fav,
            video
          });
        }
      }
    } else {
      // Normal user
      const user = await getUserByEmail(session.user.email);

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const favorites = await getFavoritesByUser(user.id);

      // Fetch videos for each favorite
      for (const fav of favorites) {
        const video = await getVideoById(fav.videoId);
        if (video) {
          favoritesWithVideos.push({
            ...fav,
            video
          });
        }
      }
    }

    return NextResponse.json({ favorites: favoritesWithVideos });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
