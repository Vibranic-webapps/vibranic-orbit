"use client";
import { Task } from "@/app/types";
import { toast } from "sonner";

export function useTaskActions(setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
    const createTask = async (payload: Record<string, unknown>): Promise<Task | null> => {
        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const newTask: Task = await res.json();
                setTasks(prev => [...prev, newTask]);
                toast.success("Task added successfully");
                return newTask;
            }
            toast.error("Failed to add task.");
            return null;
        } catch (error) {
            console.error("Error adding task:", error);
            toast.error("Error adding task");
            return null;
        }
    };

    const updateTask = async (task: Task, updates: Partial<Task>): Promise<Task | null> => {
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const updated: Task = await res.json();
                setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
                return updated;
            }
            toast.error("Failed to update task.");
            return null;
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Error updating task");
            return null;
        }
    };

    const deleteTask = async (task: Task): Promise<boolean> => {
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                setTasks(prev => prev.filter(t => t.id !== task.id));
                toast.success("Task deleted successfully");
                return true;
            }
            toast.error("Failed to delete task.");
            return false;
        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Error deleting task");
            return false;
        }
    };

    return { createTask, updateTask, deleteTask };
}
