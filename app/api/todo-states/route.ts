import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const states = await prisma.todoState.findMany({
            where: { userId },
            orderBy: { order: "asc" },
        });
        return NextResponse.json(states);
    } catch (error) {
        console.error("Error fetching todo states:", error);
        return NextResponse.json({ error: "Failed to fetch todo states" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { name, color, order } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Default new columns to the end of the board.
        const nextOrder = typeof order === "number"
            ? order
            : await prisma.todoState.count({ where: { userId } });

        const newState = await prisma.todoState.create({
            data: {
                name: name.trim(),
                color: color || "#7C6CFF",
                order: nextOrder,
                userId,
            },
        });

        return NextResponse.json(newState, { status: 201 });
    } catch (error) {
        console.error("Error creating todo state:", error);
        return NextResponse.json({ error: "Failed to create todo state" }, { status: 500 });
    }
}
