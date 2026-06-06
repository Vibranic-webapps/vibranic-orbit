"use client";
import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Task } from "@/app/types";

interface CalendarViewProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function CalendarView({ tasks, setTasks }: CalendarViewProps) {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [newTaskName, setNewTaskName] = useState("");

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    const blanks = Array.from({ length: firstWeekday }, () => null)
    const cells = [...blanks, ...days]

    const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    function occursOn(task: Task, cell: Date): boolean {
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


        return false;
    }

    const tasksForDay = (cell: Date) => tasks.filter(t => occursOn(t, cell));

    const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));
    const goToToday = () => setViewDate(new Date());

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
                setTasks([...tasks, newTask]);
                setNewTaskName("");
                setSelectedDate(null);
            }
        } catch(error) {
            console.error("Error adding task:", error)
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
                    {weekdays.map(day => (
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
                                        <div key={task.id} className="text-xs rounded px-1 bg-blue-500 truncate">{task.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {selectedDate && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded shadow-lg">
                        <h2 className="font-bold mb-2">Add task for {selectedDate.toDateString()}</h2>
                        <input
                            type="text"
                            placeholder="Task name"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            className="border p-2 rounded w-full mb-2"
                        />
                        <button onClick={() => setSelectedDate(null)}>Close</button>
                        <button onClick={handleAddTask} className="bg-blue-500 text-white px-3 py-1 rounded">Save</button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
