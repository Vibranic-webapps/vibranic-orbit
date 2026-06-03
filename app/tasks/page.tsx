"use client";

import { useEffect, useState } from "react";
import { Heart, Check, X } from 'lucide-react';

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
    const priorityOptions = [
        { value: "EXTRA_SMALL", label: "Extra Small" },
        { value: "SMALL", label: "Small" },
        { value: "MEDIUM", label: "Medium" },
        { value: "LARGE", label: "Large" },
        { value: "EXTRA_LARGE", label: "Extra Large" }
    ];
    const [categoryId, setCategoryId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleAddTask = async () => {
        setError(null);
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
                body: JSON.stringify({ name, description, startDateTime, endDateTime, priority, categoryId })
            });
            if (response.ok) {
                const newTask = await response.json();
                setTasks([...tasks, newTask]);
                setName("");
                setDescription("");
                setStartDateTime("");
                setEndDateTime("");
                setPriority("MEDIUM");
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

    const handleUpdateTask = async (task: Task, updates: Partial<Task>) => {
        try {            
            const response = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });
            if (response.ok) {
                const updatedTask = await response.json();
                setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
            }
        } catch (error) {
            console.error("Error updating task:", error);
            setError("Failed to update task.");
        }
    }

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
        <div className="p-4 flex flex-col gap-4">
            <form className="w-full flex justify-center">
                <div className="flex flex-col gap-4 w-max">
                    <div className="flex flex-row gap-2 w-full">
                        <input
                            type="text"
                            placeholder="Task Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <div className="flex flex-row gap-2 w-full">
                        <input
                            type="datetime-local"
                            value={startDateTime}
                            onChange={(e) => setStartDateTime(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                        <input
                            type="datetime-local"
                            value={endDateTime}
                            onChange={(e) => setEndDateTime(e.target.value)}
                            className="border p-2 rounded w-full "
                        />
                    </div>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="border p-2 rounded w-full "
                    >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="border p-2 rounded w-full"
                    >
                        {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="flex-1 mb-2 w-full">
                        <button className="bg-blue-500 py-1.5 w-full text-white rounded" onClick={handleAddTask}>
                            Add Task
                        </button>
                        {error && <p className="text-red-500">{error}</p>}
                    </div>
                </div>
            </form>
            <div>
                <h1 className="text-2xl font-bold mb-4">Tasks</h1>
                {loading ? (
                    <p>Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <p>No tasks found.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.map(task => (
                            <div key={task.id} className="border p-4 rounded">
                                <h2 className="text-xl font-bold">{task.name}</h2>
                                <p>{task.description || "No description available."}</p>
                                <p>Start: {new Date(task.startDateTime).toLocaleString()}</p>
                                <p>End: {new Date(task.endDateTime).toLocaleString()}</p>
                                <p>Priority: {task.priority}</p>
                                <p>Category: {task.category?.name || "No Category"}</p>
                                <button className="p-2" onClick={() => handleUpdateTask(task, {completed: !task.completed})}>
                                    { task.completed 
                                        ? <Check className="text-green-500" size={24}/>
                                        : <X className="text-red-500" size={24} />
                                    }
                                </button>
                                <button className="p-2" onClick={() => handleUpdateTask(task, {favorite: !task.favorite})}>
                                    <Heart className={`text-red-500 ${task.favorite ? "fill-red-500" : ""}`} size={24} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}