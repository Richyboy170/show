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
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const isAdmin = session.user.isAdmin;
    let accountId: string;
    let existing: any;

    if (isAdmin) {
      // Admin user
      const admin = await prisma.admin.findUnique({
        where: { email: session.user.email }
      });

      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }

      accountId = admin.id;

      // Check if already favorited
      existing = await prisma.favorite.findUnique({
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
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      accountId = user.id;

      // Check if already favorited
      existing = await prisma.favorite.findUnique({
        where: {
          userId_videoId: {
            userId: user.id,
            videoId: videoId
          }
        }
      });
    }

    if (existing) {
      return NextResponse.json({ error: "Already favorited" }, { status: 400 });
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: isAdmin ? {
        adminId: accountId,
        videoId: videoId
      } : {
        userId: accountId,
        videoId: videoId
      }
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
      const admin = await prisma.admin.findUnique({
        where: { email: session.user.email }
      });

      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }

      // Delete favorite
      await prisma.favorite.deleteMany({
        where: {
          adminId: admin.id,
          videoId: videoId
        }
      });
    } else {
      // Normal user
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Delete favorite
      await prisma.favorite.deleteMany({
        where: {
          userId: user.id,
          videoId: videoId
        }
      });
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
    let favorites;

    if (isAdmin) {
      // Admin user
      const admin = await prisma.admin.findUnique({
        where: { email: session.user.email },
        include: {
          favorites: {
            include: {
              video: {
                include: {
                  lyrics: {
                    take: 1
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }

      favorites = admin.favorites;
    } else {
      // Normal user
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          favorites: {
            include: {
              video: {
                include: {
                  lyrics: {
                    take: 1
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      favorites = user.favorites;
    }

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
