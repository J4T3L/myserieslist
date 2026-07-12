import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export const runtime = "nodejs";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!caller || (caller.role !== "admin" && caller.role !== "supersu")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        include: {
            watchlist: true
        }
    });

    const safeUsers = users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        watchlistCount: u.watchlist.length,
        watchlist: u.watchlist.map((w: any) => ({
            show: {
                id: w.showId,
                name: w.showName,
                image: { medium: w.showImage }
            },
            trackerStatus: w.trackerStatus,
            personalRating: w.personalRating,
            watchedEpisodeIds: w.watchedEpisodeIds ? JSON.parse(w.watchedEpisodeIds as string) : [],
            totalEpisodes: w.totalEpisodes
        }))
    }));

    return NextResponse.json(safeUsers);
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!caller || (caller.role !== "admin" && caller.role !== "supersu")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { targetEmail, newRole } = body;

    if (!targetEmail || !newRole) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (caller.role === "admin" && newRole === "supersu") {
        return NextResponse.json({ error: "Admins cannot grant SuperSU role" }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
        where: { email: targetEmail },
        data: { role: newRole }
    });

    return NextResponse.json({ success: true, user: updatedUser });
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!caller || (caller.role !== "admin" && caller.role !== "supersu")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetEmail = searchParams.get("email");

    if (!targetEmail) {
        return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (caller.role === "admin" && targetUser.role === "supersu") {
         return NextResponse.json({ error: "Admins cannot delete SuperSU accounts" }, { status: 403 });
    }

    await prisma.user.delete({
        where: { email: targetEmail }
    });

    return NextResponse.json({ success: true });
}
