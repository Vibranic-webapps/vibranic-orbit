"use client";
import { useState } from "react";
import { Heart, CircleCheck, X, Trash, Pencil } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { Task, Category } from "@/app/types";

interface ListViewProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    loading: boolean;
    categories: Category[];
}

export default function ListView({ tasks, setTasks, loading, categories }: ListViewProps) {
    const initialForm = { name: "", description: "", startDateTime: "", endDateTime: "", priority: "MEDIUM" as Task["priority"], categoryId: "" };
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{
        name: string;
        description: string;
        startDateTime: string;
        endDateTime: string;
        priority: Task["priority"];
        categoryId: string;
    }>({ name: "", description: "", startDateTime: "", endDateTime: "", priority: "MEDIUM", categoryId: "" });

    const [error, setError] = useState<string | null>(null);
    
    const priorityOptions = [
        { value: "EXTRA_SMALL", label: "Extra Small", color: "bg-amber-500", border: "border-amber-700" },
        { value: "SMALL",       label: "Small",       color: "bg-emerald-500", border: "border-emerald-700" },
        { value: "MEDIUM",      label: "Medium",      color: "bg-teal-500", border: "border-teal-700" },
        { value: "LARGE",       label: "Large",       color: "bg-rose-500", border: "border-rose-700" },
        { value: "EXTRA_LARGE", label: "Extra Large", color: "bg-indigo-500", border: "border-indigo-700" },
    ];

    const startEdit = (task: Task) => {
        setEditingId(task.id)
        setEditForm({
            name: task.name,
            description: task.description ?? "",
            startDateTime: task.startDateTime.slice(0, 16),
            endDateTime: task.endDateTime.slice(0, 16),
            priority: task.priority,
            categoryId: task.categoryId ?? "",
        })
    }

    const handleAddTask = async () => {
        setError(null);
        try {
            if (!form.name || !form.startDateTime || !form.endDateTime) {
                setError("Please fill in all required fields.");
                return;
            }

            if (new Date(form.startDateTime) >= new Date(form.endDateTime)) {
                setError("Start date and time must be before end date and time.");
                return;
            }

            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (response.ok) {
                const newTask = await response.json();
                setTasks([...tasks, newTask]);
                setForm(initialForm)
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

    const handleDeleteTask = async (task: Task) => {
        try {
            const response = await fetch(`/api/tasks/${task.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                setTasks(tasks.filter(t => t.id !== task.id));
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            setError("Failed to delete task.");
        }
    }

    return (
        <div className="p-4 flex flex-col gap-4">
            <form className="w-full flex justify-center">
                <div className="flex flex-col gap-4 w-max">
                    <div className="flex flex-row gap-2 w-full">
                        <input
                            type="text"
                            placeholder="Task Name"
                            value={form.name}
                            onChange={(e) => setForm({...form, name: e.target.value})}
                            className="border p-2 rounded w-full"
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={form.description}
                            onChange={(e) => setForm({...form, description: e.target.value})}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <div className="flex flex-row gap-2 w-full">
                        <input
                            type="datetime-local"
                            value={form.startDateTime}
                            onChange={(e) => setForm({...form, startDateTime: e.target.value})}
                            className="border p-2 rounded w-full"
                        />
                        <input
                            type="datetime-local"
                            value={form.endDateTime}
                            onChange={(e) => setForm({...form, endDateTime: e.target.value})}
                            className="border p-2 rounded w-full "
                        />
                    </div>
                    <select
                        value={form.categoryId}
                        onChange={(e) => setForm({...form, categoryId: e.target.value})}
                        className="border p-2 rounded w-full "
                    >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                    <select
                        value={form.priority}
                        onChange={(e) => setForm({...form, priority: e.target.value as Task["priority"]} )}
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
                            Submit
                        </button>
                        {error && <p className="text-red-500">{error}</p>}
                    </div>
                </div>
            </form>
            <div>
                {loading ? (
                    <p>Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <p>No tasks found.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.map(task => {
                            const priorityOption = priorityOptions.find(o => o.value === task.priority);
                            return (
                                <div key={task.id} className="border p-4 rounded">
                                    {editingId === task.id ? (
                                        <div>
                                            <p>Editing task <span className="text-blue-500 font-semibold">{task.name.toUpperCase()}</span></p>
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="border p-2 rounded w-full"
                                            />
                                            <input
                                                type="text"
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                className="border p-2 rounded w-full"
                                            />
                                            <input
                                                type="datetime-local"
                                                value={editForm.startDateTime}
                                                onChange={(e) => setEditForm({ ...editForm, startDateTime: e.target.value })}
                                                className="border p-2 rounded w-full"
                                            />
                                            <input
                                                type="datetime-local"
                                                value={editForm.endDateTime}
                                                onChange={(e) => setEditForm({ ...editForm, endDateTime: e.target.value })}
                                                className="border p-2 rounded w-full "
                                            />
                                            <select
                                                value={editForm.categoryId}
                                                onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                                                className="border p-2 rounded w-full "
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>{category.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={editForm.priority}
                                                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Task["priority"] })}
                                                className="border p-2 rounded w-full"
                                            >
                                                {priorityOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button onClick={() => setEditingId(null)}>
                                                Cancel
                                            </button>
                                            <button onClick={() => { handleUpdateTask(task, editForm); setEditingId(null); }}>Submit</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <h2 className="text-xl font-bold">{task.name}</h2>
                                            <p>{task.description || "No description available."}</p>
                                            <div className="flex">
                                                <p>Start: {new Date(task.startDateTime).toLocaleString()}</p>
                                                <p>End: {new Date(task.endDateTime).toLocaleString()}</p>
                                            </div>
                                            <p className={`border-2 rounded-md w-fit px-2.5 py-0.5 text-xs text-white ${priorityOption?.border} ${priorityOption?.color}`}>
                                                {task.priority}
                                            </p>
                                            {task.category?.icon && (
                                                <DynamicIcon name={task.category.icon as IconName} size={24} />
                                            )}
                                            <div className="">
                                                <button className="p-2" onClick={() => handleUpdateTask(task, { completed: !task.completed })}>
                                                    {task.completed
                                                        ? <CircleCheck className="text-green-500" size={24} />
                                                        : <X className="text-red-500" size={24} />
                                                    }
                                                </button>
                                                <button className="p-2" onClick={() => handleUpdateTask(task, { favorite: !task.favorite })}>
                                                    <Heart className={`${task.favorite ? "fill-red-500" : "text-red-500 "}`} size={24} />
                                                </button>
                                            </div>
                                            <div className="">
                                                <button className="p-2" onClick={() => handleDeleteTask(task)}>
                                                    <Trash size={24} />
                                                </button>
                                                <button className="p-2" onClick={() => startEdit(task)}>
                                                    <Pencil size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
