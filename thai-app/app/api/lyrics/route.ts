import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createLyric, deleteLyric, getVideoById } from "@/lib/firestore";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { videoId, thaiText, translation, chords, pianoNotes, startTime, endTime, order } = body;

        if (!videoId) {
            return NextResponse.json({ error: "videoId is required" }, { status: 400 });
        }

        // Verify video exists
        const video = await getVideoById(videoId);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const lyric = await createLyric(videoId, {
            videoId,
            thaiText: thaiText || "",
            translation: translation || "",
            chords: chords || "",
            pianoNotes: pianoNotes || "",
            startTime: startTime || 0,
            endTime: endTime || 0,
            order: order || 0,
        });

        return NextResponse.json(lyric);
    } catch (error) {
        console.error("Error creating lyric:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const lyricId = searchParams.get("id");
        const videoId = searchParams.get("videoId");

        if (!lyricId || !videoId) {
            return NextResponse.json(
                { error: "Both id and videoId are required" },
                { status: 400 }
            );
        }

        await deleteLyric(videoId, lyricId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting lyric:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
