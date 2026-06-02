import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tasks = await prisma.task.findMany({ where: { userId }, include: { category: true } })
        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {        
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { name, description, startDateTime, endDateTime, priority, categoryId } = body;

        if (!name || !startDateTime || !endDateTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                name,
                description,
                startDateTime,
                endDateTime,
                priority,
                categoryId,
                userId
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}