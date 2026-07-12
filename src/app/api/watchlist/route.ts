import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Helper to get authenticated user ID
async function getUserId() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
        return null;
    }
    return (session.user as any).id as string;
}

// GET: Fetch user's watchlist
export async function GET(req: NextRequest) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const watchlist = await prisma.watchlistItem.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
        });

        // Map it back to frontend format
        const formatted = watchlist.map((item: any) => ({
            show: {
                id: item.showId,
                name: item.showName,
                image: item.showImage ? { medium: item.showImage } : null,
                rating: { average: item.showRating },
                genres: item.showGenres ? JSON.parse(item.showGenres) : [],
            },
            trackerStatus: item.trackerStatus,
            personalRating: item.personalRating,
            notes: item.personalNotes || "",
            watchedEpisodeIds: item.watchedEpisodeIds ? JSON.parse(item.watchedEpisodeIds) : [],
            totalEpisodes: item.totalEpisodes || 0,
            addedAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 });
    }
}

// POST: Add or update a watchlist item
export async function POST(req: NextRequest) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { showId, showName, showImage, showRating, showGenres, trackerStatus, personalRating, notes, watchedEpisodeIds, totalEpisodes } = body;

        if (!showId || !showName || !trackerStatus) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const upserted = await prisma.watchlistItem.upsert({
            where: {
                userId_showId: {
                    userId,
                    showId,
                },
            },
            update: {
                trackerStatus,
                personalRating,
                personalNotes: notes || null,
                watchedEpisodeIds: watchedEpisodeIds ? JSON.stringify(watchedEpisodeIds) : "[]",
                totalEpisodes: totalEpisodes || 0,
                // Update show info in case it changed
                showName,
                showImage,
                showRating,
                showGenres: JSON.stringify(showGenres || []),
            },
            create: {
                userId,
                showId,
                showName,
                showImage,
                showRating,
                showGenres: JSON.stringify(showGenres || []),
                trackerStatus,
                personalRating,
                personalNotes: notes || null,
                watchedEpisodeIds: watchedEpisodeIds ? JSON.stringify(watchedEpisodeIds) : "[]",
                totalEpisodes: totalEpisodes || 0,
            },
        });

        return NextResponse.json({ success: true, item: upserted });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to upsert item" }, { status: 500 });
    }
}

// DELETE: Remove a watchlist item
export async function DELETE(req: NextRequest) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const showIdParam = searchParams.get("showId");
        if (!showIdParam) return NextResponse.json({ error: "Missing showId" }, { status: 400 });
        
        const showId = parseInt(showIdParam, 10);

        await prisma.watchlistItem.delete({
            where: {
                userId_showId: {
                    userId,
                    showId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }
}
