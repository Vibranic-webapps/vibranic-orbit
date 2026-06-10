"use client";
import { useState } from "react";
import { useTasks } from "@/app/hooks/useTasks";
import { useCategories } from "@/app/hooks/useCategories";
import ListView from "@/app/components/ListView";
import CalendarView from "@/app/components/CalendarView";
import TodoView from "@/app/components/TodoView";
import AscentShell from "@/app/components/orbit/AscentShell";

export default function TasksPage() {
    const { tasks, setTasks, loading } = useTasks();
    const { categories } = useCategories();
    const [view, setView] = useState<"list" | "calendar" | "categories" | "todos">("list");

    return (
        <AscentShell>
            <div>
                <div className="flex gap-2 justify-center p-4">
                    <button onClick={() => setView("list")} className={view === "list" ? "font-bold underline" : ""}>List</button>
                    <button onClick={() => setView("calendar")} className={view === "calendar" ? "font-bold underline" : ""}>Calendar</button>
                    <button onClick={() => setView("todos")} className={view === "todos" ? "font-bold underline" : ""}>Todos</button>
                    <a href="/categories" className={view === "categories" ? "font-bold underline" : ""}>categories</a>
                </div>

                {view === "list" && <ListView tasks={tasks} setTasks={setTasks} loading={loading} categories={categories} />}
                {view === "calendar" && <CalendarView tasks={tasks} setTasks={setTasks} />}
                {view === "todos" && <TodoView tasks={tasks} setTasks={setTasks} />}

            </div>
        </AscentShell>
    );
}
