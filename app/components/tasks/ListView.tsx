"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Heart, Check, Trash, Pencil, Plus, Search, ArrowDownUp, Inbox, SearchX, TriangleAlert, X } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { Task, Category } from "@/app/types";
import { priorityOptions } from "@/app/constants"
import { taskBucket, taskStats, dueOf, priorityRank, dueLabel, groupByDay, groupByWeek, type DayGroup } from "@/app/lib/tasks";
import { useTaskActions } from "@/app/hooks/useTaskActions";
import TaskDrawer, { type TaskDrawerHandle } from "../TaskDrawer";
import TaskDetailCard from "./TaskDetailCard";

interface ListViewProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    loading: boolean;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    onDrawerOpenChange?: (open: boolean) => void;
}

export default function ListView({ tasks, setTasks, loading, categories, setCategories, onDrawerOpenChange }: ListViewProps) {
    const drawer = useRef<TaskDrawerHandle>(null);
    const { updateTask } = useTaskActions(setTasks);
    const [detailTask, setDetailTask] = useState<Task | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "favorite">("all");
    const [sortBy, setSortBy] = useState<"date" | "priority">("date");
    const [catFilter, setCatFilter] = useState<string | null>(null);

    const clearFilters = () => { setSearch(""); setStatusFilter("all"); setCatFilter(null); };

    const now = new Date();
    const visible = tasks.filter(t => t.startDateTime !== null);
    const stats = taskStats(visible, now);

    const filtered = visible.filter(t => {
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (catFilter && t.categoryId !== catFilter) return false;
        if (statusFilter === "active" && t.completed) return false;
        if (statusFilter === "completed" && !t.completed) return false;
        if (statusFilter === "favorite" && !t.favorite) return false;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        if (sortBy === "priority") return priorityRank(b) - priorityRank(a);
        return (dueOf(a)?.getTime() ?? Infinity) - (dueOf(b)?.getTime() ?? Infinity);
    });

    const toneHex = (tone: DayGroup["tone"]) =>
        tone === "overdue" ? "#ef4444"
            : tone === "today" ? "#f59e0b"
                : tone === "completed" ? "#22c55e"
                    : "#7C6CFF";

    const renderRow = (task: Task) => {
        const priorityOption = priorityOptions.find(o => o.value === task.priority);
        const bucket = taskBucket(task, now);
        const isEditing = editingId === task.id;
        const dueColor =
            bucket === "overdue" ? "text-red-400"
                : bucket === "today" ? "text-amber-300"
                    : "text-white/50";
        const dot = priorityOption?.hex ?? "#7C6CFF";
        const rank = priorityRank(task);

        return (
            <div key={task.id} className={`group relative pl-11 max-w-75 hover:z-20 ${detailTask?.id === task.id ? "z-30" : ""}`}>
                {task.category ? (
                    <button type="button" title={`Filter by ${task.category.name}`}
                        onClick={() => setCatFilter(catFilter === task.category!.id ? null : task.category!.id)}
                        className={`absolute left-0 top-2 z-10 grid place-items-center h-7 w-7 rounded-full cursor-pointer transition-transform hover:scale-110 ${catFilter === task.category.id ? "ring-2 ring-white/70" : ""}`}
                        style={{
                            background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${task.category.color} 85%, white) 0%, ${task.category.color} 45%, color-mix(in srgb, ${task.category.color}, black 45%) 100%)`,
                            boxShadow: `0 0 8px ${task.category.color}`,
                        }}>
                        {task.category.icon && (
                            <DynamicIcon name={task.category.icon as IconName} size={14} strokeWidth={2.5}
                                style={{
                                    color: `color-mix(in srgb, ${task.category.color}, black 65%)`,
                                    filter: "drop-shadow(0 0 1.5px rgba(255,255,255,0.7))",
                                }} />
                        )}
                    </button>
                ) : (
                    <span aria-hidden className="absolute left-2.25 top-3.5 h-2.5 w-2.5 rounded-full bg-white/25" />
                )}

                <div className={`relative isolate rounded-lg px-3 py-2 transition-shadow ${task.completed ? "opacity-50" : ""} ${isEditing ? "ring-2 ring-(--vibranic)/70 shadow-[0_0_18px_-6px_var(--vibranic)]" : ""}`}>
                    <span aria-hidden
                        className={`absolute inset-0 -z-10 rounded-lg transition-opacity ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        style={{
                            background: task.category?.color
                                ? `linear-gradient(135deg, ${task.category.color}33 0%, transparent 60%), rgba(255,255,255,0.04)`
                                : "rgba(255,255,255,0.04)",
                        }} />

                    <div className="hidden lg:flex absolute left-full top-1/2 -translate-y-1/2 flex-col items-center gap-1 pl-1 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                        <button type="button" title="Edit" className="p-1 rounded-md text-white/60 hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => drawer.current?.openEdit(task)}>
                            <Pencil size={15} />
                        </button>
                        <button type="button" title="Delete" className="p-1 rounded-md text-white/60 hover:bg-red-500/15 hover:text-red-400 cursor-pointer" onClick={() => drawer.current?.requestDelete(task)}>
                            <Trash size={15} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button type="button" title={task.completed ? "Mark as not done" : "Mark as done"}
                            onClick={() => updateTask(task, { completed: !task.completed })}
                            className={`shrink-0 grid place-items-center h-5 w-5 rounded-full border-2 transition-colors cursor-pointer ${task.completed
                                    ? "bg-green-500/80 border-green-500 text-white"
                                    : "border-white/30 text-transparent hover:border-green-400 hover:text-green-400/60"
                                }`}>
                            <Check size={12} strokeWidth={3} />
                        </button>

                        <div className="relative min-w-0 flex-1">
                            <button type="button" title="View details" onClick={() => setDetailTask(task)} className="absolute inset-0 z-0 rounded-md cursor-pointer" aria-label={`View details for ${task.name}`} />
                            <h4 className={`font-medium text-white truncate ${task.completed ? "line-through text-white/50" : ""}`}>{task.name}</h4>
                            <div className="flex items-center gap-2 text-xs mt-0.5">
                                <span className={`pointer-events-none ${dueColor}`}>{dueLabel(task)}</span>
                                {task.categoryRemoved && (
                                    <span className="reletive z-10 flex items-center gap-1 rounded bg-amber-500/15 pl-1.5 pr-1 py-0.5 text-amber-300"
                                        title="This task's category was deleted">
                                        <TriangleAlert size={11} />
                                        Category removed
                                        <button type="button" title="Dismiss"
                                            onClick={() => updateTask(task, { categoryRemoved: false })}
                                            className="ml-0.5 rounded p-0.5 hover:bg-amber-500/25 cursor-pointer">
                                            <X size={10} />
                                        </button>
                                    </span>
                                )}
                                {priorityOption && (
                                    <span className="flex items-end gap-0.5 h-2" title={`${priorityOption.label} priority`}>
                                        {Array.from({ length: 5 }).map((_, i) => {
                                            const on = i <= rank;
                                            return (
                                                <span key={i} className="w-1 rounded-full"
                                                    style={{
                                                        height: 5 + i * 2,
                                                        background: on ? dot : "rgba(255,255,255,0.15)",
                                                        boxShadow: on ? `0 0 4px ${dot}` : undefined,
                                                    }} />
                                            );
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex lg:hidden items-center gap-1 shrink-0">
                            <button type="button" title="Edit" className="p-1 rounded-md text-white/60 hover:text-white cursor-pointer" onClick={() => drawer.current?.openEdit(task)}>
                                <Pencil size={16} />
                            </button>
                            <button type="button" title="Delete" className="p-1 rounded-md text-white/60 hover:text-red-400 cursor-pointer" onClick={() => drawer.current?.requestDelete(task)}>
                                <Trash size={16} />
                            </button>
                        </div>

                        <button type="button" title="Favorite" className="shrink-0 p-1 rounded-md hover:bg-white/10 cursor-pointer" onClick={() => updateTask(task, { favorite: !task.favorite })}>
                            <Heart className={task.favorite ? "fill-red-500 text-red-500" : "text-white/30"} size={18} />
                        </button>
                    </div>

                </div>

                {detailTask?.id === task.id && (
                    <TaskDetailCard
                        task={task}
                        onClose={() => setDetailTask(null)}
                        onEdit={() => { setDetailTask(null); drawer.current?.openEdit(task); }}
                        onDelete={() => { setDetailTask(null); drawer.current?.requestDelete(task); }}
                    />
                )}
            </div>
        );
    };

    const renderColumn = (group: DayGroup) => (
        <div key={group.key} className="min-w-0 flex flex-col gap-3">
            <div className="relative flex items-center gap-3 pl-11">
                <span aria-hidden className="absolute left-1.75 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full"
                    style={{ background: toneHex(group.tone), boxShadow: `0 0 10px ${toneHex(group.tone)}` }} />
                <h3 className="text-xs uppercase tracking-[0.25em] text-white/50">
                    {group.label}
                    <span className="ml-2 text-white/25 tracking-normal">{group.items.length}</span>
                </h3>
            </div>
            <div className="relative">
                <div aria-hidden className="absolute left-3.5 top-1 bottom-1 w-px bg-linear-to-b from-transparent via-white/15 to-transparent" />
                <div className="flex flex-col gap-1">
                    {group.items.map(renderRow)}
                </div>
            </div>
        </div>
    );

    return (
        <div className="@container p-4 flex flex-col gap-4 w-full max-w-360 mx-auto">
            {mounted && createPortal(
                <div className={`fixed z-30 right-4 bottom-6 lg:inset-x-0 lg:top-4 lg:bottom-auto pointer-events-none transition-opacity ${drawerOpen ? "opacity-0" : "opacity-100"}`}>
                    <div className="lg:max-w-360 lg:mx-auto lg:px-4 flex justify-end">
                        <button
                            onClick={() => drawer.current?.openAdd()}
                            className={`group pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white backdrop-blur-md transition-all cursor-pointer
                                bg-[color-mix(in_srgb,var(--vibranic)_15%,transparent)]
                                hover:bg-[color-mix(in_srgb,var(--vibranic)_30%,transparent)] hover:border-(--vibranic)
                                shadow-[0_0_16px_-4px_var(--vibranic)] hover:shadow-[0_0_24px_-2px_var(--vibranic)]
                                ${drawerOpen ? "pointer-events-none" : ""}`}
                        >
                            <Plus size={18} className="transition-transform group-hover:rotate-90" />
                            Add task
                        </button>
                    </div>
                </div>,
                document.body
            )}

            <TaskDrawer
                ref={drawer}
                tasks={tasks}
                setTasks={setTasks}
                categories={categories}
                setCategories={setCategories}
                onEditingChange={setEditingId}
                onOpenChange={(open) => { setDrawerOpen(open); onDrawerOpenChange?.(open); }}
            />

            <div className="flex flex-col gap-8">
                <p className="text-sm text-white/40">
                    <span className="text-white/80">{stats.active}</span> active
                    {stats.today > 0 && <> · <span className="text-amber-300">{stats.today}</span> due today</>}
                    {stats.overdue > 0 && <> · <span className="text-red-400">{stats.overdue}</span> overdue</>}
                    {stats.completed > 0 && <> · <span className="text-white/60">{stats.completed}</span> done</>}
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2 flex-1 min-w-48 border-b border-white/10 focus-within:border-(--vibranic) transition-colors">
                        <Search size={16} className="text-white/40 shrink-0" />
                        <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-transparent py-1.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        {([["all", "All"], ["active", "Active"], ["completed", "Done"], ["favorite", "Favorites"]] as const).map(([val, label]) => (
                            <button key={val} type="button" onClick={() => setStatusFilter(val)}
                                className={`transition-colors cursor-pointer ${statusFilter === val ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/40 hover:text-white"}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={() => setSortBy(s => s === "date" ? "priority" : "date")}
                        className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors cursor-pointer">
                        <ArrowDownUp size={14} /> {sortBy === "date" ? "Date" : "Priority"}
                    </button>
                </div>

                {categories.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setCatFilter(null)}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer ${catFilter === null ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/50 hover:text-white"
                                }`}>
                            All
                        </button>
                        {categories.map(c => (
                            <button key={c.id} type="button" onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}
                                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer ${catFilter === c.id ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/50 hover:text-white"
                                    }`}>
                                <span className="grid place-items-center h-4 w-4 rounded-full"
                                    style={{
                                        background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${c.color} 85%, white) 0%, ${c.color} 45%, color-mix(in srgb, ${c.color}, black 45%) 100%)`,
                                        boxShadow: `0 0 6px ${c.color}`,
                                    }} />
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="grid gap-8 grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4" aria-hidden>
                        {Array.from({ length: 4 }).map((_, c) => (
                            <div key={c} className="flex flex-col gap-3">
                                <div className="h-3 w-24 rounded-full bg-white/10 animate-pulse" />
                                <div className="flex flex-col gap-2 pl-11">
                                    {Array.from({ length: 3 }).map((_, r) => (
                                        <div key={r} className="h-12 rounded-lg bg-white/5 animate-pulse"
                                            style={{ animationDelay: `${(c * 3 + r) * 90}ms` }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sorted.length === 0 ? (
                    visible.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <div className="grid place-items-center h-16 w-16 rounded-full border border-white/10 bg-white/5">
                                <Inbox className="text-white/40" size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white/80">No tasks yet</h3>
                                <p className="mt-1 text-sm text-white/40">Create my first task to get started.</p>
                            </div>
                            <button
                                onClick={() => drawer.current?.openAdd()}
                                className={`group pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white backdrop-blur-md transition-all cursor-pointer
                                    bg-[color-mix(in_srgb,var(--vibranic)_15%,transparent)]
                                    hover:bg-[color-mix(in_srgb,var(--vibranic)_30%,transparent)] hover:border-(--vibranic)
                                    shadow-[0_0_16px_-4px_var(--vibranic)] hover:shadow-[0_0_24px_-2px_var(--vibranic)]
                                    ${drawerOpen ? "pointer-events-none" : ""}`}
                            >
                                <Plus size={18} className="transition-transform group-hover:rotate-90" />
                                Add my first task
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                            <SearchX className="text-white/30" size={28} />
                            <div>
                                <h3 className="text-base font-semibold text-white/70">No matching tasks</h3>
                                <p className="mt-1 text-sm text-white/40">Try adjusting your search or filters.</p>
                            </div>
                            <button type="button" onClick={clearFilters}
                                className="text-sm text-(--vibranic) hover:underline cursor-pointer">
                                Clear filters
                            </button>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col gap-12">
                        {groupByWeek(groupByDay(sorted, now), now).map(section => (
                            <section key={section.key} className="flex flex-col gap-5">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-linear-to-r from-transparent to-white/20" />
                                    <span className="relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 backdrop-blur-sm">
                                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/75">{section.label}</span>
                                    </span>
                                    <div className="h-px flex-1 bg-linear-to-l from-transparent to-white/20" />
                                </div>
                                <div className="grid gap-8 grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
                                    {section.days.map(renderColumn)}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
