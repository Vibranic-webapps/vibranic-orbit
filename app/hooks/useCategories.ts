import { useState, useEffect } from "react";
import { Category } from "@/app/types";

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch("/api/categories");
                if (response.ok) setCategories(await response.json());
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setLoading(false);
            }
        }
        void fetchCategories();
    }, []);

    return { categories, setCategories, loading }
}