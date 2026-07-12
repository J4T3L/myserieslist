import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scryptSync, randomBytes } from "crypto";

export const runtime = "nodejs";

// Helper function to hash a password
function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${derivedKey}`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: "Username (email) dan password wajib diisi." }, { status: 400 });
        }

        // Use the username as the email address
        const email = username.toLowerCase();

        // Check if the user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
        }

        // Hash the password securely
        const hashedPassword = hashPassword(password);

        // Create the new user
        const newUser = await prisma.user.create({
            data: {
                email,
                name: email.split("@")[0], // default name from email prefix
                password: hashedPassword,
                role: "user",
            },
        });

        return NextResponse.json({
            message: "Registrasi berhasil",
            user: { id: newUser.id, email: newUser.email, role: newUser.role }
        }, { status: 201 });

    } catch (error) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
    }
}
