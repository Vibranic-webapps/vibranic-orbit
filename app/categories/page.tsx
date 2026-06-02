"use client";

import { useEffect, useState } from "react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { IconPicker } from "@/components/IconPicker";

interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [color, setColor] = useState("#3b82f6");
    const [icon, setIcon] = useState("");

    const handleAddCategory = async () => {
        try {
            if (!name || !color || !icon) {
                setError("Please fill in all fields.");
                return;
            }

            if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
                setError("Category name must be unique.");
                return;
            }

            if (!/^([a-z0-9]+-)?[a-z0-9]+$/i.test(icon)) {
                setError("Invalid icon name. Use lowercase letters, numbers, and optional hyphens.");
                return;
            }

            const response = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, color, icon })
            });

            if (response.ok) {
                const newCategory = await response.json();
                setCategories([...categories, newCategory]);
                setName("");
                setColor("#3b82f6");
                setIcon("");
                setError(null);
            } else {
                setError("Failed to add category.");
            }
        } catch (error) {
            console.error("Error adding category:", error);
            setError("An error occurred while adding the category.");
        } 
    };

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch("/api/categories");
                if (response.ok) {
                    setCategories(await response.json());
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                setError("Failed to fetch categories.");
            } finally { 
                setLoading(false);
            }
        }
    
        void fetchCategories();
    }, [])
    return (
        <>
            <div>
                <h2>Add New Category</h2>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                <IconPicker value={icon} onChange={setIcon} />
                <button onClick={handleAddCategory}>Add Category</button>
            </div>
            <div>
                <h1>Categories</h1>
                <div>
                    {loading ? (
                        <p>Loading categories...</p>
                    ) : error ? (
                        <p>{error}</p>
                    ) : categories.length === 0 ? (
                        <p>No categories found.</p>
                    ) : (
                        <ul>
                            {categories.map(category => (
                                <li key={category.id} style={{ color: category.color }} className="flex items-center gap-2" >
                                    <DynamicIcon name={category.icon as IconName} size={16} />
                                    <span>{category.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}