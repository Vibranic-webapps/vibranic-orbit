"use client";
import { useState } from "react";
import { useTasks } from "@/app/hooks/useTasks";
import { useCategories } from "@/app/hooks/useCategories";
import { useTodoStates } from "@/app/hooks/useTodoStates";
import ListView from "@/app/components/tasks/ListView";
import CalendarView from "@/app/components/CalendarView";
import TodoView from "@/app/components/TodoView";
import AscentShell from "@/app/components/orbit/AscentShell";
import { LayoutList, Calendar, CircleCheckBig } from "lucide-react"

export default function TasksPage() {
    const { tasks, setTasks, loading: tasksLoading } = useTasks();
    const { categories, setCategories } = useCategories();
    const { states, setStates, loading: statesLoading } = useTodoStates();
    const [view, setView] = useState<"tasks" | "calendar" | "categories" | "todos">("tasks");
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <AscentShell>
            <div className={`transition-[margin] duration-300 ease-out ${drawerOpen ? "lg:mr-122.5" : "mr-0"}`}>
                <div className="flex justify-center gap-2 p-4">
                    <div className="inline-flex gap-1 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <button onClick={() => setView("tasks")} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${view === "tasks" ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/50 hover:text-white"}`}>
                            <LayoutList size={16} />
                            Tasks
                        </button>
                        <button onClick={() => setView("calendar")} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${view === "calendar" ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/50 hover:text-white"}`}>
                            <Calendar size={16} />
                            Calendar
                        </button>
                        <button onClick={() => setView("todos")} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${view === "todos" ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/50 hover:text-white"}`}>
                            <CircleCheckBig size={16} />
                            Todos
                        </button>
                    </div>
                </div>
                {view === "tasks" && <ListView tasks={tasks} setTasks={setTasks} categories={categories} setCategories={setCategories} loading={tasksLoading} onDrawerOpenChange={setDrawerOpen} />}
                {view === "calendar" && <CalendarView tasks={tasks} setTasks={setTasks} categories={categories} setCategories={setCategories} onDrawerOpenChange={setDrawerOpen} />}
                {view === "todos" && (
                    <div className="w-full max-w-360 mx-auto">
                        <TodoView tasks={tasks} setTasks={setTasks} states={states} setStates={setStates} loading={statesLoading} />
                    </div>
                )}
            </div>
        </AscentShell>
    );
}
