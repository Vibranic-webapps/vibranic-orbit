"use client";
import { Category } from "@/app/types";
import { toast } from "sonner";

export function useCategoryActions(setCategories: React.Dispatch<React.SetStateAction<Category[]>>) {
    const createCategory = async (payload: { name: string; color: string; icon: string }): Promise<Category | null> => {
        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const category: Category = await res.json();
                setCategories(prev => [...prev, category]);
                toast.success("Category created");
                return category;
            }
            toast.error("Failed to create category.");
            return null;
        } catch (error) {
            console.error("Error creating category:", error);
            toast.error("Error creating category");
            return null;
        }
    };

    const deleteCategory = async (id: string): Promise<boolean> => {
        try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (res.ok) {
                const { affected } = await res.json().catch(() => ({ affected: 0 }));
                setCategories(prev => prev.filter(c => c.id !== id));
                toast.success(affected > 0 ? `Category deleted · ${affected} task${affected > 1 ? "s" : ""} updated` : "Category deleted");
                return true;
            }
            toast.error("Failed to delete category.");
            return false;
        } catch (error) {
            console.error("Error deleting category:", error);
            toast.error("Error deleting category");
            return false;
        }
    };

    return { createCategory, deleteCategory };
}
