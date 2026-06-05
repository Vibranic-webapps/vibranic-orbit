import { useState, useEffect } from "react";
import { Task } from "@/app/types";

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTasks() {
            try {
                const response = await fetch("/api/tasks");
                if (response.ok) setTasks(await response.json());
            } catch (error) {
                console.error("Failed to fetch tasks:", error);
            } finally {
                setLoading(false);
            }
        }
        void fetchTasks();
    }, []);

    return { tasks, setTasks, loading }
}