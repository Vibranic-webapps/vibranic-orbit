import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const category = await prisma.category.findFirst({ where: { id, userId } });
        if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

        const flagged = await prisma.task.updateMany({
            where: { categoryId: id, userId },
            data: { categoryRemoved: true },
        });
        await prisma.category.delete({ where: { id } });

        return NextResponse.json({ id, affected: flagged.count });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
