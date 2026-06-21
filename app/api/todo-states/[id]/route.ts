import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const state = await prisma.todoState.findFirst({ where: { id, userId } });
        if (!state) return NextResponse.json({ error: "State not found" }, { status: 404 });

        const { name, color, order } = await request.json();

        const updated = await prisma.todoState.update({
            where: { id },
            data: {
                name: typeof name === "string" ? name.trim() : undefined,
                color: color ?? undefined,
                order: typeof order === "number" ? order : undefined,
            },
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating todo state:", error);
        return NextResponse.json({ error: "Failed to update todo state" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const state = await prisma.todoState.findFirst({ where: { id, userId } });
        if (!state) return NextResponse.json({ error: "State not found" }, { status: 404 });

        // Detach todos from this column before removing it (FK is restrict by default).
        await prisma.task.updateMany({ where: { stateId: id, userId }, data: { stateId: null } });
        await prisma.todoState.delete({ where: { id } });

        return NextResponse.json({ message: "State deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting todo state:", error);
        return NextResponse.json({ error: "Failed to delete todo state" }, { status: 500 });
    }
}
