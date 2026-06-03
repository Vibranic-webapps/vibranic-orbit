import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const { id } = await params;
        const task = await prisma.task.findFirst({ where: { id: id, userId: userId } });
        if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

        const body = await request.json();
        const { name, description, startDateTime, endDateTime, priority, categoryId, favorite, completed } = body;

        const updatedTask = await prisma.task.update({
            where: { id: id },
            data: {
                name,
                description,
                startDateTime: startDateTime ? new Date(startDateTime) : undefined,
                endDateTime: endDateTime ? new Date(endDateTime) : undefined,
                priority,
                categoryId: categoryId || undefined,
                favorite,
                completed
            },
            include: { category: true }
        });
        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}
