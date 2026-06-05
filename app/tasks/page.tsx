"use client";
import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { useCategories } from "../hooks/useCategories";
import ListView from "../components/ListView";
import CalendarView from "../components/CalendarView";

export default function TasksPage() {
    const { tasks, setTasks, loading } = useTasks();
    const { categories } = useCategories();
    const [view, setView] = useState<"list" | "calendar">("list");

    return (
        <div>
            <div className="flex gap-2 justify-center p-4">
                <button onClick={() => setView("list")} className={view === "list" ? "font-bold underline" : ""}>List</button>
                <button onClick={() => setView("calendar")} className={view === "calendar" ? "font-bold underline" : ""}>Calendar</button>
            </div>

            {view === "list"
                ? <ListView tasks={tasks} setTasks={setTasks} loading={loading} categories={categories} />
                : <CalendarView tasks={tasks} setTasks={setTasks} />}
        </div>
    );
}
