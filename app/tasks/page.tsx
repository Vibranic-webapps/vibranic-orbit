"use client";

import { useEffect, useState } from "react";

interface Task {
    id: string;
    name: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    priority: "EXTRA_SMALL" | "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
    completed: boolean;
    favorite: boolean;
    categoryId?: string;
    userId: string;
    category?: {
        id: string;
        name: string;
        color: string;
        icon: string;
    } | null;
}

interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
    userId: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDateTime, setStartDateTime] = useState("");
    const [endDateTime, setEndDateTime] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [completed, setCompleted] = useState(false);
    const [favorite, setFavorite] = useState(false);
    const [categoryId, setCategoryId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleAddTask = async () => {
        try {
            if (!name || !startDateTime || !endDateTime) {
                setError("Please fill in all required fields.");
                return;
            }

            if (new Date(startDateTime) >= new Date(endDateTime)) {
                setError("Start date and time must be before end date and time.");
                return;
            }

            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, startDateTime, endDateTime, priority, completed, favorite, categoryId })
            });
            if (response.ok) {
                const newTask = await response.json();
                setTasks([...tasks, newTask]);
                setName("");
                setDescription("");
                setStartDateTime("");
                setEndDateTime("");
                setPriority("MEDIUM");
                setCompleted(false);
                setFavorite(false);
                setCategoryId("");
                setError(null);
            } else {
                setError("Failed to add task.");
            }
        } catch (error) {
            console.error("Error adding task:", error);
            setError("Failed to add task.");
        }
    };

    useEffect(() => {
        async function fetchTasks() {
            try {
                const response = await fetch("/api/tasks");
                if (response.ok) {
                    const data = await response.json();
                    setTasks(data);
                }
            } catch (error) {
                console.error("Error fetching tasks:", error);
                setError("Failed to fetch tasks.");
            } finally {
                setLoading(false);
            }
        }

        async function fetchCategories() {
            try {
                const response = await fetch("/api/categories");
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                setError("Failed to fetch categories.");
            }
        }

        void fetchTasks();
        void fetchCategories();
    }, []);

    return (
        <>
        <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">Tasks</h1>
            <div className="mt-4 flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Task Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border p-2 rounded w-full md:w-auto"
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border p-2 rounded w-full md:w-auto"
                />
                <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="border p-2 rounded w-full md:w-auto"
                />
                <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="border p-2 rounded w-full md:w-auto"
                />
                <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="border p-2 rounded w-full md:w-auto"
                >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}

                </select>
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="border p-2 rounded w-full md:w-auto"
                >
                    <option value="EXTRA_SMALL">Extra Small</option>
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LARGE">Large</option>
                    <option value="EXTRA_LARGE">Extra Large</option>
                </select>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={completed}
                        onChange={(e) => setCompleted(e.target.checked)}
                    />
                    Completed
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={favorite}
                        onChange={(e) => setFavorite(e.target.checked)}
                    />
                    Favorite
                </label>
                <button onClick={handleAddTask}>Add Task</button>
            </div>
        </div>
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Tasks</h1>
            {loading ? (
                <p>Loading tasks...</p>
            ) : error ? (
                <p>{error}</p>
            ) : tasks.length === 0 ? (
                <p>No tasks found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.map(task => (
                        <div key={task.id} className="border p-4 rounded">
                            <h2 className="text-xl font-bold">{task.name}</h2>
                            <p>{task.description}</p>
                            <p>Start: {new Date(task.startDateTime).toLocaleString()}</p>
                            <p>End: {new Date(task.endDateTime).toLocaleString()}</p>
                            <p>Priority: {task.priority}</p>
                            <p>Category: {task.category?.name || "No Category"}</p>
                            <p>Completed: {task.completed ? "Yes" : "No"}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </>
    );
}