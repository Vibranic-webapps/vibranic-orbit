"use client";
import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Task } from "@/app/types";
import { useCalendarGrid } from "@/app/hooks/useCalendarGrid";
import { WEEKDAYS } from "@/app/lib/calendar";
import { toast } from "sonner";

interface CalendarViewProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function CalendarView({ tasks, setTasks }: CalendarViewProps) {
    const { viewDate, cells, goToPrevMonth, goToNextMonth, goToToday } = useCalendarGrid();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [newTaskName, setNewTaskName] = useState("");

    const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    function occursOn(task: Task, cell: Date): boolean {
        if (!task.startDateTime || !task.endDateTime) return false;
        const start = atMidnight(new Date(task.startDateTime));

        if (cell < start) return false;
        if (task.recurrenceEnd && cell > atMidnight(new Date(task.recurrenceEnd))) {
            return false;
        }

        if (!task.frequency) {
            return cell <= atMidnight(new Date(task.endDateTime));
        }

        if (task.frequency === "DAILY") {
            const days = Math.round((cell.getTime() - start.getTime()) / 86400000);
            return days % task.interval === 0;
        }

        if (task.frequency === "WEEKLY") {
            const weekdays = task.byWeekday.length ? task.byWeekday : [start.getDay()];
            if (!weekdays.includes(cell.getDay())) return false;
            const weeks = Math.floor((cell.getTime() - start.getTime()) / (7 * 86400000));
            return weeks % task.interval === 0;
        }

        if (task.frequency === "MONTHLY") {
            if (cell.getDate() !== start.getDate()) return false
            const months = (cell.getFullYear() - start.getFullYear()) * 12
                + (cell.getMonth() - start.getMonth());
            return months % task.interval === 0;
        }

        return false;
    }

    const tasksForDay = (cell: Date) => tasks.filter(t => occursOn(t, cell));

    const handleAddTask = async () => {
        if (!newTaskName || !selectedDate) return;
        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newTaskName,
                    startDateTime: selectedDate.toISOString(),
                    endDateTime: selectedDate.toISOString(),
                }),
            });
            if (response.ok) {
                const newTask = await response.json();
                setTasks(prev => [...prev, newTask]);
                setNewTaskName("");
                setSelectedDate(null);
                toast.success("Task added successfully")
            } else {
                toast.error("Failed to add task.");
            }
        } catch(error) {
            console.error("Error adding task:", error);
            toast.error("Error adding task");
        }
    }

    return (
        <main className="flex flex-row justify-center w-full">
            <div className="flex flex-col md:w-3/4 xl:w-2/4">
                <header className="flex justify-between items-center h-14">
                    <p>{viewDate.toLocaleString("en-US", { month: "long" })}</p>
                    <p>{viewDate.toLocaleString("en-US", { year: "numeric" })}</p>
                    <div className="flex gap-4">
                        <button className="flex items-center h-fit rounded-md gap-1 hover:cursor-pointer" onClick={goToPrevMonth}>
                            <ChevronLeft size={20} />
                            <p>Prev</p>
                        </button>
                        <button className="rounded-md hover:cursor-pointer" onClick={goToToday}>
                            Today
                        </button>
                        <button className="flex items-center h-fit rounded-md gap-1 hover:cursor-pointer" onClick={goToNextMonth}>
                            <p>Next</p>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </header>
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {WEEKDAYS.map(day => (
                        <div key={day} className="text-center font-semibold text-sm">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {cells.map((cell, index) => (
                        <div key={index} className="border px-2 pt-1 pb-2 text-center">
                            {cell !== null && (
                                <div className="flex flex-col gap-2" onClick={() => setSelectedDate(cell)}>
                                    <div className="text-right">{cell.getDate()}</div>
                                    {tasksForDay(cell).map(task => (
                                        <div key={task.id} className="text-xs rounded px-1 bg-(--vibranic) text-white truncate">{task.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {selectedDate && (
                    <div
                        onClick={() => setSelectedDate(null)}
                        className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm"
                        >
                            <h2 className="font-semibold mb-3">Add task for {selectedDate.toDateString()}</h2>
                            <input
                                type="text"
                                placeholder="Task name"
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                className="border p-2 rounded w-full mb-4 border-white/10 bg-white/5 text-white/90 placeholder:text-white/40 focus:outline-none focus:border-(--vibranic)"
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setSelectedDate(null)}
                                    className="flex-1 py-1.5 rounded border border-white/10 text-white/70 hover:text-white hover:border-white/25 cursor-pointer">
                                    Close
                                </button>
                                <button type="button" onClick={handleAddTask}
                                    className="flex-1 py-1.5 rounded bg-(--vibranic) text-white cursor-pointer">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
