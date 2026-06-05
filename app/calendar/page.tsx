"use client";

import { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Task {
    id: string;
    name: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    priority: "EXTRA_SMALL" | "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
    completed: boolean;
    favorite: boolean;
    categoryId?: string;
    userId: string;
    category?: {
        id: string;
        name: string;
        color: string;
        icon: string;
    } | null;
}

export default function CalendarPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [viewDate, setViewDate] = useState(new Date());

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    const blanks = Array.from({ length: firstWeekday }, () => null)
    const cells = [...blanks, ...days]

    const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const tasksForDay = (cellDate: Date) => tasks.filter(task => {
        const start = atMidnight(new Date(task.startDateTime));
        const end = atMidnight(new Date(task.endDateTime));
        return cellDate >= start && cellDate <= end;
    });

    const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));
    const goToToday = () => setViewDate(new Date());

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    useEffect(() => {
        async function fetchTasks() {
            try {
                const response = await fetch("/api/tasks");
                if (response.ok) {
                    const data = await response.json();
                    setTasks(data);
                }
            } catch (error) {
                console.error("Error fetching tasks:", error);
                setError("Failed to fetch tasks.");
            } finally {
                setLoading(false);
            }
        }

        void fetchTasks();
    }, []);

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
                                <div className="flex flex-col gap-2">
                                    <div className="text-right">{cell.getDate()}</div>
                                    {tasksForDay(cell).map(task => (
                                        <div key={task.id} className="text-xs rounded px-1 bg-blue-500 truncate">{task.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}