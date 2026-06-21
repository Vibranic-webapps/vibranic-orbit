import { useState, useEffect } from "react";
import { TodoState } from "@/app/types";

export function useTodoStates() {
    const [states, setStates] = useState<TodoState[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStates() {
            try {
                const response = await fetch("/api/todo-states");
                if (response.ok) setStates(await response.json());
            } catch (error) {
                console.error("Failed to fetch todo states:", error);
            } finally {
                setLoading(false);
            }
        }
        void fetchStates();
    }, []);

    return { states, setStates, loading };
}
