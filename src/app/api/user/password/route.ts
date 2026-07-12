import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { scryptSync, timingSafeEqual, randomBytes } from "crypto";

export const runtime = "nodejs";

function verifyPassword(password: string, storedHash: string): boolean {
    try {
        const [salt, key] = storedHash.split(":");
        const keyBuffer = Buffer.from(key, "hex");
        const derivedKey = scryptSync(password, salt, 64);
        return timingSafeEqual(keyBuffer, derivedKey);
    } catch {
        return false;
    }
}

function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${derivedKey}`;
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Tidak memiliki otorisasi." }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Kata sandi lama dan baru wajib diisi." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user || !user.password) {
            return NextResponse.json({ error: "Akun ini terdaftar via Google. Silakan ubah sandi di setelan akun Google Anda." }, { status: 400 });
        }

        const isValid = verifyPassword(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "Kata sandi lama salah." }, { status: 403 });
        }

        const hashedPassword = hashPassword(newPassword);

        await prisma.user.update({
            where: { email: session.user.email },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ message: "Kata sandi berhasil diperbarui." });
    } catch (error) {
        console.error("Change Password Error:", error);
        return NextResponse.json({ error: "Gagal mengganti kata sandi." }, { status: 500 });
    }
}
