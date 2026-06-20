"use client";
import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { createPortal } from "react-dom";
import { X, Trash, ChevronLeft } from "lucide-react";
import { Task, Category, TaskFormValues, FormErrors } from "@/app/types";
import TaskForm, { type SubView } from "./TaskForm";
import { useTaskActions } from "@/app/hooks/useTaskActions";
import { toast } from "sonner";

export const initialForm: TaskFormValues = {
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

export interface TaskDrawerHandle {
    openAdd: (prefill?: Partial<TaskFormValues>) => void;
    openEdit: (task: Task) => void;
    requestDelete: (task: Task) => void;
}

interface TaskDrawerProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    onOpenChange?: (open: boolean) => void;
    onEditingChange?: (id: string | null) => void;
}

function validateTask(form: TaskFormValues): FormErrors {
    const errors: FormErrors = {};
    const isRecurring = !!form.frequency;

    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.startDateTime) errors.startDateTime = "Start date is required.";

    if (!isRecurring) {
        if (!form.endDateTime) errors.endDateTime = "End date is required.";
        else if (form.startDateTime && new Date(form.startDateTime) >= new Date(form.endDateTime)) {
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

const TaskDrawer = forwardRef<TaskDrawerHandle, TaskDrawerProps>(function TaskDrawer(
    { tasks, setTasks, categories, setCategories, onOpenChange, onEditingChange }, ref,
) {
    const { createTask, updateTask, deleteTask } = useTaskActions(setTasks);

    const [form, setForm] = useState<TaskFormValues>(initialForm);
    const [editForm, setEditForm] = useState<TaskFormValues>(initialForm);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [editErrors, setEditErrors] = useState<FormErrors>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [drawerIn, setDrawerIn] = useState(false);
    const [subView, setSubView] = useState<SubView | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        if (!formOpen) return;
        const id = requestAnimationFrame(() => setDrawerIn(true));
        return () => { cancelAnimationFrame(id); setDrawerIn(false); };
    }, [formOpen]);

    useEffect(() => { onOpenChange?.(drawerIn); }, [drawerIn, onOpenChange]);
    useEffect(() => { onEditingChange?.(editingId); }, [editingId, onEditingChange]);

    const closeForm = useCallback(() => {
        setDrawerIn(false);
        setTimeout(() => { setFormOpen(false); setEditingId(null); }, 300);
    }, []);

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

    useImperativeHandle(ref, () => ({
        openAdd: (prefill) => {
            setEditingId(null);
            setForm({ ...initialForm, ...prefill });
            setFormErrors({});
            setFormOpen(true);
        },
        openEdit: (task) => {
            setEditErrors({});
            setEditingId(task.id);
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
            });
            setFormOpen(true);
        },
        requestDelete: (task) => setConfirmDelete(task),
    }), []);

    const handleAddTask = async () => {
        const errs = validateTask(form);
        setFormErrors(errs);
        if (Object.keys(errs).length > 0) return;
        const created = await createTask({
            ...form,
            endDateTime: form.frequency ? form.startDateTime : form.endDateTime,
        });
        if (created) { setForm(initialForm); setFormErrors({}); setFormOpen(false); }
    };

    const handleEditSubmit = async () => {
        const task = tasks.find(t => t.id === editingId);
        if (!task) return;
        const errs = validateTask(editForm);
        setEditErrors(errs);
        if (Object.keys(errs).length > 0) return;
        await updateTask(task, {
            ...editForm,
            endDateTime: editForm.frequency ? editForm.startDateTime : editForm.endDateTime,
            frequency: editForm.frequency ? (editForm.frequency as Task["frequency"]) : null,
            recurrenceEnd: editForm.recurrenceEnd || null,
        });
        toast.success("Task updated successfully");
        closeForm();
    };

    if (!mounted) return null;

    return createPortal(
        <>
            {formOpen && (
                <>
                    <div onClick={closeForm}
                        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none transition-opacity duration-300 ${drawerIn ? "opacity-100" : "opacity-0"}`} />
                    <div className={`fixed right-0 top-0 z-50 h-full w-full max-w-122.5 overflow-y-auto bg-white/5 border-l border-white/10 backdrop-blur-md lg:backdrop-blur-none p-6 transition-transform duration-300 ease-out ${drawerIn ? "translate-x-0" : "translate-x-full"}`}>
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
                            <TaskForm value={editForm} onChange={setEditForm} errors={editErrors} categories={categories} setCategories={setCategories} setTasks={setTasks} onSubmit={handleEditSubmit} submitLabel="Save changes" onSubViewChange={setSubView} />
                        ) : (
                            <TaskForm value={form} onChange={setForm} errors={formErrors} categories={categories} setCategories={setCategories} setTasks={setTasks} onSubmit={handleAddTask} submitLabel="Add task" onSubViewChange={setSubView} />
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
                            <button type="button" onClick={() => { const t = confirmDelete; setConfirmDelete(null); deleteTask(t); if (editingId === t.id) closeForm(); }}
                                className="flex-1 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white cursor-pointer">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body,
    );
});

export default TaskDrawer;
