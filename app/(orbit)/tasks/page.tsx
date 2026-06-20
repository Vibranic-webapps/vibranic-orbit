"use client";
import { useState } from "react";
import { useTasks } from "@/app/hooks/useTasks";
import { useCategories } from "@/app/hooks/useCategories";
import ListView from "@/app/components/tasks/ListView";
import CalendarView from "@/app/components/CalendarView";
import TodoView from "@/app/components/TodoView";
import CategoriesView from "@/app/components/CategoriesView";
import AscentShell from "@/app/components/orbit/AscentShell";
import { LayoutList, Calendar, CircleCheckBig, Tags } from "lucide-react"

export default function TasksPage() {
    const { tasks, setTasks, loading: tasksLoading } = useTasks();
    const { categories, setCategories, loading: categoriesLoading } = useCategories();
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
                        <button onClick={() => setView("categories")} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${view === "categories" ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/50 hover:text-white"}`}>
                            <Tags size={16} />
                            Categories
                        </button>
                    </div>
                </div>

                {view === "tasks" && <ListView tasks={tasks} setTasks={setTasks} categories={categories} loading={tasksLoading} onDrawerOpenChange={setDrawerOpen} />}
                {view === "calendar" && <CalendarView tasks={tasks} setTasks={setTasks} categories={categories} onDrawerOpenChange={setDrawerOpen} />}
                {view === "todos" && <TodoView tasks={tasks} setTasks={setTasks} />}
                {view === "categories" && <CategoriesView categories={categories} setCategories={setCategories} loading={categoriesLoading} />}

            </div>
        </AscentShell>
    );
}
