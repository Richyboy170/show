import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVideoById, deleteLyric, createLyric, getLyricsByVideoId } from "@/lib/firestore";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute for batch operations

/**
 * Batch update all lyrics for a video
 * This is more efficient than individual DELETE + POST calls
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { videoId, lyrics } = body;

        if (!videoId) {
            return NextResponse.json({ error: "videoId is required" }, { status: 400 });
        }

        if (!Array.isArray(lyrics)) {
            return NextResponse.json({ error: "lyrics must be an array" }, { status: 400 });
        }

        console.log(`[BATCH-UPDATE] Starting batch update for video ${videoId} with ${lyrics.length} lyrics`);

        // Verify video exists
        const video = await getVideoById(videoId);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Get existing lyrics
        const existingLyrics = await getLyricsByVideoId(videoId);
        console.log(`[BATCH-UPDATE] Found ${existingLyrics.length} existing lyrics to delete`);

        // Delete all existing lyrics
        const deletePromises = existingLyrics.map((lyric: any) =>
            deleteLyric(videoId, lyric.id)
        );
        await Promise.all(deletePromises);
        console.log(`[BATCH-UPDATE] Deleted ${existingLyrics.length} existing lyrics`);

        // Create new lyrics
        const createPromises = lyrics.map((lyric: any, index: number) =>
            createLyric(videoId, {
                videoId,
                thaiText: lyric.thaiText || "",
                translation: lyric.translation || "",
                chords: lyric.chords || "",
                pianoNotes: lyric.pianoNotes || "",
                startTime: lyric.startTime || 0,
                endTime: lyric.endTime || 0,
                order: index,
            })
        );

        const createdLyrics = await Promise.all(createPromises);
        console.log(`[BATCH-UPDATE] Created ${createdLyrics.length} new lyrics`);

        return NextResponse.json({
            success: true,
            message: `Successfully updated ${createdLyrics.length} lyrics`,
            count: createdLyrics.length,
            lyrics: createdLyrics
        });

    } catch (error: any) {
        console.error("[BATCH-UPDATE] Error:", error);
        return NextResponse.json(
            {
                error: "Failed to batch update lyrics",
                details: error.message
            },
            { status: 500 }
        );
    }
}
