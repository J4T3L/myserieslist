import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Tidak memiliki otorisasi." }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "File gambar tidak ditemukan." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop();
        const fileName = `avatar-${(session.user as any).id || Date.now()}.${ext}`;

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);

        const imagePath = `/uploads/avatars/${fileName}`;

        // Update database with new image path
        await prisma.user.update({
            where: { email: session.user.email },
            data: { image: imagePath },
        });

        return NextResponse.json({
            message: "Foto profil berhasil diunggah",
            imagePath: imagePath
        });
    } catch (error) {
        console.error("Upload Image Error:", error);
        return NextResponse.json({ error: "Gagal mengunggah foto profil." }, { status: 500 });
    }
}
