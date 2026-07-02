"use client";
import { useAnimate, useReducedMotion } from "motion/react"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react";
import { useTasks } from "@/app/hooks/useTasks";
import { useCategories } from "@/app/hooks/useCategories";
import { useTodoStates } from "@/app/hooks/useTodoStates";
import ListView from "@/app/components/tasks/ListView";
import CalendarView from "@/app/components/CalendarView";
import TodoView from "@/app/components/TodoView";
import AscentShell from "@/app/components/orbit/AscentShell";
import { UserButton } from "@clerk/nextjs";
import { LayoutList, Calendar, CircleCheckBig } from "lucide-react"

export default function TasksPage() {
    const { tasks, setTasks, loading: tasksLoading } = useTasks();
    const { categories, setCategories } = useCategories();
    const { states, setStates, loading: statesLoading } = useTodoStates();
    const [view, setView] = useState<"tasks" | "calendar" | "categories" | "todos">("tasks");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const reduce = useReducedMotion()
    const [scope, animate] = useAnimate()
    const tintRef = useRef(null)
    const router = useRouter()

    async function ascend() {
        if (!reduce) {
            animate(scope.current, { 
                scale: 0.4, 
                y: 30, filter: "blur(12px)", 
                opacity: 0 
            }, { duration: 0.45, ease: "easeIn" })
        }
        await animate(tintRef.current, { opacity: 1 }, { duration: reduce ? 0.2 : 0.45, ease: "easeIn" })
        router.push("/")
    }

    return (
        <AscentShell>
            <div className={`transition-[margin] duration-300 ease-out ${drawerOpen ? "lg:mr-122.5" : "mr-0"}`}>
                <div className="flex items-center justify-center gap-3 p-4">
                    <button
                        onClick={ascend}
                        title="Back to Orbit"
                        aria-label="Back to Orbit"
                        className="group fixed top-4 left-[max(1rem,calc((100vw-90rem)/2+1rem))] z-50 flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-1.5 pl-2 pr-2 sm:pr-4 text-white backdrop-blur-md transition-all cursor-pointer
                            hover:border-(--vibranic) hover:bg-[color-mix(in_srgb,var(--vibranic)_15%,transparent)] hover:shadow-[0_0_20px_-4px_var(--vibranic)]"
                    >
                        <span className="relative grid h-8 w-8 place-items-center">
                            <span className="absolute inset-0.5 rounded-full border"
                                style={{ borderColor: "color-mix(in srgb, var(--vibranic) 45%, transparent)" }} />
                            <span className="h-2.5 w-2.5 rounded-full"
                                style={{ background: "var(--vibranic)", boxShadow: "0 0 8px var(--vibranic)" }} />
                            <span className={`absolute inset-0.5 ${reduce ? "" : "animate-[spin_6s_linear_infinite]"}`}>
                                <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_white]" />
                            </span>
                        </span>
                        <span className="hidden sm:inline text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                            Orbit
                        </span>
                    </button>
                    <div className="inline-flex gap-1 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <button onClick={() => setView("tasks")} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${view === "tasks" ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/50 hover:text-white"}`}>
                            <LayoutList size={16} />
                            <span className="hidden sm:inline">Tasks</span>
                        </button>
                        <button onClick={() => setView("calendar")} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${view === "calendar" ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/50 hover:text-white"}`}>
                            <Calendar size={16} />
                            <span className="hidden sm:inline">Calendar</span>
                        </button>
                        <button onClick={() => setView("todos")} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${view === "todos" ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/50 hover:text-white"}`}>
                            <CircleCheckBig size={16} />
                            <span className="hidden sm:inline">Todos</span>
                        </button>
                    </div>
                    <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
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
