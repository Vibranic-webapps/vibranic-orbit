"use client";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Heart, Check, X, Trash, Pencil, ChevronLeft, Plus, Search, ArrowDownUp } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { Task, Category, TaskFormValues, FormErrors } from "@/app/types";
import { priorityOptions } from "@/app/constants"
import TaskForm, { type SubView } from "./TaskForm";
import { taskBucket, taskStats, dueOf, priorityRank, dueLabel, groupByDay, groupByWeek, type DayGroup } from "@/app/lib/tasks";
import { toast } from "sonner";

interface ListViewProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    loading: boolean;
    categories: Category[];
    onDrawerOpenChange?: (open: boolean) => void;
}

const initialForm: TaskFormValues = {
    name: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    priority: "MEDIUM",
    categoryId: "",
    frequency: "",
    interval: 1,
    byWeekday: [],
    recurrenceEnd: "",
};

export default function ListView({ tasks, setTasks, loading, categories, onDrawerOpenChange }: ListViewProps) {
    const [form, setForm] = useState(initialForm);
    const [formOpen, setFormOpen] = useState(false)
    const [subView, setSubView] = useState<SubView | null>(null);
    const [drawerIn, setDrawerIn] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "favorite">("all");
    const [sortBy, setSortBy] = useState<"date" | "priority">("date");
    const [catFilter, setCatFilter] = useState<string | null>(null);

    useEffect(() => {
        if (!formOpen) return;
        const id = requestAnimationFrame(() => setDrawerIn(true));
        return () => { cancelAnimationFrame(id); setDrawerIn(false); };
    }, [formOpen]);

    const closeForm = useCallback(() => {
        setDrawerIn(false);
        setTimeout(() => { setFormOpen(false); setEditingId(null); }, 300);
    }, []);

    const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);

    useEffect(() => {
        onDrawerOpenChange?.(drawerIn);
    }, [drawerIn, onDrawerOpenChange]);

    useEffect(() => {
        if (!formOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (subView) subView.onBack();
            else closeForm();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [formOpen, subView, closeForm]);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [editErrors, setEditErrors] = useState<FormErrors>({});

    const [editForm, setEditForm] = useState<TaskFormValues>({
        name: "", 
        description: "", 
        startDateTime: "", 
        endDateTime: "",
        priority: "MEDIUM", 
        categoryId: "", 
        frequency: "",
        interval: 1, 
        byWeekday: [], 
        recurrenceEnd: "",
    });

    function validateTask(form: TaskFormValues): FormErrors {
        const errors: FormErrors = {};
        const isRecurring = !!form.frequency;

        if (!form.name.trim()) errors.name = "Name is required.";
        if (!form.startDateTime) errors.startDateTime = "Start date is required.";

        if (!isRecurring) {
            if (!form.endDateTime) errors.endDateTime = "End date is required.";
            else if (form.startDateTime &&
                new Date(form.startDateTime) >= new Date(form.endDateTime)) {
                errors.endDateTime = "End must be after start.";
            }
        }

        if (isRecurring) {
            if (!Number.isInteger(form.interval) || form.interval < 1) {
                errors.interval = "Repeat every must be a whole number of at least 1.";
            }
            if (form.frequency === "WEEKLY" && form.byWeekday.length === 0) {
                errors.byWeekday = "Pick at least one weekday.";
            }
            if (form.recurrenceEnd && form.startDateTime &&
                new Date(form.recurrenceEnd) < new Date(form.startDateTime)) {
                errors.recurrenceEnd = "Repeat-until can't be before the start date.";
            }
        }
        return errors;
    }

    const startEdit = (task: Task) => {
        setEditErrors({});
        setEditingId(task.id)
        setEditForm({
            name: task.name,
            description: task.description ?? "",
            startDateTime: task.startDateTime?.slice(0, 16) ?? "",
            endDateTime: task.endDateTime?.slice(0, 16) ?? "",
            priority: task.priority,
            categoryId: task.categoryId ?? "",
            frequency: task.frequency ?? "",
            interval: task.interval ?? 1,
            byWeekday: task.byWeekday,
            recurrenceEnd: task.recurrenceEnd ? task.recurrenceEnd.slice(0, 10) : "",
        })
        setFormOpen(true)
    }

    const openAdd = () => {
        setEditingId(null);
        setForm(initialForm);
        setFormErrors({});
        setFormOpen(true);
    };

    const handleEditSubmit = () => {
        const task = tasks.find(t => t.id === editingId);
        if (!task) return;
        const errs = validateTask(editForm);
        setEditErrors(errs);
        if (Object.keys(errs).length > 0) return;
        const payload: Partial<Task> = {
            ...editForm,
            endDateTime: editForm.frequency ? editForm.startDateTime : editForm.endDateTime,
            frequency: editForm.frequency ? (editForm.frequency as Task["frequency"]) : null,
            recurrenceEnd: editForm.recurrenceEnd || null,
        };
        handleUpdateTask(task, payload);
        toast.success("Task updated successfully");
        closeForm();
    };


    const handleAddTask = async () => {
        const e = validateTask(form)
        setFormErrors(e)
        if (Object.keys(e).length > 0) return;
        try {
            const payload = {
                ...form,
                endDateTime: form.frequency ? form.startDateTime : form.endDateTime,
            };
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                const newTask = await response.json();
                setTasks(prev => [...prev, newTask]); 
                setForm(initialForm)
                setFormErrors({})
                setFormOpen(false)
                toast.success("Task added successfully")
            } else {
                toast.error("Failed to add task.");
            }
        } catch (error) {
            console.error("Error adding task:", error);
            toast.error("Error adding task")
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
                setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
            } else {
                toast.error("Failed to update task.");
            }
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Error updating task")
            
        }
    }

    const handleDeleteTask = async (task: Task) => {
        try {
            const response = await fetch(`/api/tasks/${task.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                setTasks(prev => prev.filter(t => t.id !== task.id));
                toast.success("Task deleted successfully");
            } else {
                toast.error("Failed to delete task.");
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Error deleting task")
        }
    }

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
            <div key={task.id} className="group relative pl-11 hover:z-20">
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

                        {/* edit / delete — stacked, slide out flush from the right edge on hover (desktop) */}
                        <div className="hidden lg:flex absolute left-full top-1/2 -translate-y-1/2 flex-col items-center gap-1 pl-1 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                            <button type="button" title="Edit" className="p-1 rounded-md text-white/60 hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => startEdit(task)}>
                                <Pencil size={15} />
                            </button>
                            <button type="button" title="Delete" className="p-1 rounded-md text-white/60 hover:bg-red-500/15 hover:text-red-400 cursor-pointer" onClick={() => setConfirmDelete(task)}>
                                <Trash size={15} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button type="button" title={task.completed ? "Mark as not done" : "Mark as done"}
                                onClick={() => handleUpdateTask(task, { completed: !task.completed })}
                                className={`shrink-0 grid place-items-center h-5 w-5 rounded-full border-2 transition-colors cursor-pointer ${
                                    task.completed
                                        ? "bg-green-500/80 border-green-500 text-white"
                                        : "border-white/30 text-transparent hover:border-green-400 hover:text-green-400/60"
                                }`}>
                                <Check size={12} strokeWidth={3} />
                            </button>

                            <div className="min-w-0 flex-1">
                                <h4 className={`font-medium text-white truncate ${task.completed ? "line-through text-white/50" : ""}`}>{task.name}</h4>
                                <div className="flex items-center gap-2 text-xs mt-0.5">
                                    <span className={dueColor}>{dueLabel(task)}</span>
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
                                <button type="button" title="Edit" className="p-1 rounded-md text-white/60 hover:text-white cursor-pointer" onClick={() => startEdit(task)}>
                                    <Pencil size={16} />
                                </button>
                                <button type="button" title="Delete" className="p-1 rounded-md text-white/60 hover:text-red-400 cursor-pointer" onClick={() => setConfirmDelete(task)}>
                                    <Trash size={16} />
                                </button>
                            </div>

                            <button type="button" title="Favorite" className="shrink-0 p-1 rounded-md hover:bg-white/10 cursor-pointer" onClick={() => handleUpdateTask(task, { favorite: !task.favorite })}>
                                <Heart className={task.favorite ? "fill-red-500 text-red-500" : "text-white/30"} size={18} />
                            </button>
                        </div>

                    </div>
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
        <div className="@container p-4 flex flex-col gap-4 w-full max-w-350 mx-auto">
            {mounted && createPortal(
            <>
            <button
                onClick={openAdd}
                className={`group fixed right-4 bottom-6 lg:bottom-auto lg:top-4 z-30 flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white backdrop-blur-md transition-all cursor-pointer
                    bg-[color-mix(in_srgb,var(--vibranic)_15%,transparent)]
                    hover:bg-[color-mix(in_srgb,var(--vibranic)_30%,transparent)] hover:border-(--vibranic)
                    shadow-[0_0_16px_-4px_var(--vibranic)] hover:shadow-[0_0_24px_-2px_var(--vibranic)]
                    ${drawerIn ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
                <Plus size={18} className="transition-transform group-hover:rotate-90" />
                Add task
            </button>
            {formOpen && (
                <>
                    <div
                        onClick={closeForm}
                        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none transition-opacity duration-300 ${drawerIn ? "opacity-100" : "opacity-0"}`}
                    />
                    <div
                        className={`fixed right-0 top-0 z-50 h-full w-full max-w-122.5 overflow-y-auto bg-white/5 border-l border-white/10 backdrop-blur-md lg:backdrop-blur-none p-6 transition-transform duration-300 ease-out ${drawerIn ? "translate-x-0" : "translate-x-full"}`}
                    >
                        <div className="flex justify-between items-center">
                            {subView ? (
                                <button type="button" onClick={subView.onBack}
                                    className="flex items-center gap-1 text-xl font-semibold text-white/80 hover:text-white cursor-pointer">
                                    <ChevronLeft size={22} /> {subView.title}
                                </button>
                            ) : (
                                <h1 className="text-xl font-semibold">{editingId ? "Edit task" : "Add new task"}</h1>
                            )}
                            <div className="flex items-center gap-1">
                                {editingId && !subView && (
                                    <button type="button" title="Delete task"
                                        onClick={() => { const t = tasks.find(t => t.id === editingId); if (t) setConfirmDelete(t); }}
                                        className="p-1 rounded-md text-white/50 hover:text-red-400 hover:bg-red-500/15 cursor-pointer">
                                        <Trash size={20} />
                                    </button>
                                )}
                                <button className="cursor-pointer" onClick={closeForm}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        {editingId ? (
                            <TaskForm value={editForm} onChange={setEditForm} errors={editErrors} categories={categories} onSubmit={handleEditSubmit} submitLabel="Save changes" onSubViewChange={setSubView} />
                        ) : (
                            <TaskForm value={form} onChange={setForm} errors={formErrors} categories={categories} onSubmit={handleAddTask} submitLabel="Add task" onSubViewChange={setSubView} />
                        )}
                    </div>
                </>
            )}

            {confirmDelete && (
                <div onClick={() => setConfirmDelete(null)}
                    className="fixed inset-0 z-60 grid place-items-center bg-black/70 backdrop-blur-sm p-4">
                    <div onClick={e => e.stopPropagation()}
                        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                        <h2 className="text-lg font-semibold">Delete task?</h2>
                        <p className="mt-1 text-sm text-white/60">
                            &ldquo;{confirmDelete.name}&rdquo; will be permanently removed. This can&apos;t be undone.
                        </p>
                        <div className="flex gap-2 mt-6">
                            <button type="button" onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-1.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/25 cursor-pointer">
                                Cancel
                            </button>
                            <button type="button" onClick={() => { handleDeleteTask(confirmDelete); setConfirmDelete(null); if (editingId === confirmDelete.id) closeForm(); }}
                                className="flex-1 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white cursor-pointer">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </>,
            document.body
            )}
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
                            className={`rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer ${
                                catFilter === null ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/50 hover:text-white"
                            }`}>
                            All
                        </button>
                        {categories.map(c => (
                            <button key={c.id} type="button" onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}
                                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                                    catFilter === c.id ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/50 hover:text-white"
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
                    <p className="text-white/40">Loading tasks…</p>
                ) : sorted.length === 0 ? (
                    <p className="text-white/40">No tasks match.</p>
                ) : (
                    <div className="flex flex-col gap-12">
                        {groupByWeek(groupByDay(sorted, now), now).map(section => {
                            return (
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
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
