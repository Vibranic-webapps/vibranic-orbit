"use client";
import { useState } from "react";
import { Heart, CircleCheck, X, Trash, Pencil } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { Task, Category, TaskFormValues, FormErrors } from "@/app/types";
import { priorityOptions } from "@/app/constants"
import TaskForm from "./TaskForm";


interface ListViewProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    loading: boolean;
    categories: Category[];
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

export default function ListView({ tasks, setTasks, loading, categories }: ListViewProps) {
    const [form, setForm] = useState(initialForm);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [editErrors, setEditErrors] = useState<FormErrors>({});

    const [editingId, setEditingId] = useState<string | null>(null);
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

    const [error, setError] = useState<string | null>(null);

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
        setEditingId(task.id)
        setEditForm({
            name: task.name,
            description: task.description ?? "",
            startDateTime: task.startDateTime.slice(0, 16),
            endDateTime: task.endDateTime.slice(0, 16),
            priority: task.priority,
            categoryId: task.categoryId ?? "",
            frequency: task.frequency ?? "",
            interval: task.interval ?? 1,
            byWeekday: task.byWeekday,
            recurrenceEnd: task.recurrenceEnd ?? "",
        })
    }

    const handleEditSubmit = (task: Task) => {
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
        setEditingId(null);
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
            } else {
                setError("Failed to add task.");
            }
        } catch (error) {
            console.error("Error adding task:", error);
            setError("Failed to add task.");
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
            }
        } catch (error) {
            console.error("Error updating task:", error);
            setError("Failed to update task.");
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
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            setError("Failed to delete task.");
        }
    }

    return (
        <div className="p-4 flex flex-col gap-4">
            <TaskForm value={form} onChange={setForm} errors={formErrors} categories={categories} onSubmit={handleAddTask} submitLabel="Add task" />
            <div>
                {loading ? (
                    <p>Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <p>No tasks found.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.map(task => {
                            const priorityOption = priorityOptions.find(o => o.value === task.priority);
                            return (
                                <div key={task.id} className="border p-4 rounded">
                                    {editingId === task.id ? (
                                        <TaskForm value={editForm} onChange={setEditForm} errors={editErrors} categories={categories} onSubmit={() => handleEditSubmit(task)} submitLabel="Save changes" onCancel={() => setEditingId(null)} />
                                    ) : (
                                        <div className="flex flex-col">
                                            <h2 className="text-xl font-bold">{task.name}</h2>
                                            <p>{task.description || "No description available."}</p>
                                            <div className="flex">
                                                <p>Start: {new Date(task.startDateTime).toLocaleString()}</p>
                                                <p>End: {new Date(task.endDateTime).toLocaleString()}</p>
                                            </div>
                                            <p className={`border-2 rounded-md w-fit px-2.5 py-0.5 text-xs text-white ${priorityOption?.border} ${priorityOption?.color}`}>
                                                {task.priority}
                                            </p>
                                            {task.category?.icon && (
                                                <DynamicIcon name={task.category.icon as IconName} size={24} />
                                            )}
                                            <div className="">
                                                <button type="button" className="p-2" onClick={() => handleUpdateTask(task, { completed: !task.completed })}>
                                                    {task.completed
                                                        ? <CircleCheck className="text-green-500" size={24} />
                                                        : <X className="text-red-500" size={24} />
                                                    }
                                                </button>
                                                <button type="button" className="p-2" onClick={() => handleUpdateTask(task, { favorite: !task.favorite })}>
                                                    <Heart className={`${task.favorite ? "fill-red-500" : "text-red-500 "}`} size={24} />
                                                </button>
                                            </div>
                                            <div className="">
                                                <button type="submit" className="p-2" onClick={() => handleDeleteTask(task)}>
                                                    <Trash size={24} />
                                                </button>
                                                <button type="button" className="p-2" onClick={() => startEdit(task)}>
                                                    <Pencil size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
