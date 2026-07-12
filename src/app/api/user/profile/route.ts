import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Tidak memiliki otorisasi." }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { name: true, email: true, phone: true, role: true, image: true, password: true }
        });
        
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // We return hasPassword boolean to know if the user can change password
        return NextResponse.json({
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            role: user.role,
            image: user.image,
            hasPassword: !!user.password
        });
    } catch (error) {
        console.error("Fetch Profile Error:", error);
        return NextResponse.json({ error: "Gagal memuat profil." }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Tidak memiliki otorisasi." }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, image } = body;

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                ...(name && { name }),
                ...(phone !== undefined && { phone }),
                ...(image !== undefined && { image }),
            },
        });

        return NextResponse.json({
            message: "Profil berhasil diperbarui",
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
            }
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
    }
}
