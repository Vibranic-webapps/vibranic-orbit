"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Task } from "@/app/types";
import { buildMonthCells, WEEKDAYS, isSameDay } from "@/app/lib/calendar";
import { occursOn } from "@/app/lib/tasks";

interface MiniCalendarProps {
    viewDate: Date;
    selected: Date | null;
    tasks: Task[];
    onSelectDay: (date: Date) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

export default function MiniCalendar({ viewDate, selected, tasks, onSelectDay, onPrevMonth, onNextMonth }: MiniCalendarProps) {
    const cells = buildMonthCells(viewDate.getFullYear(), viewDate.getMonth());
    const today = new Date();

    return (
        <div className="w-full select-none">
            <header className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">
                    {viewDate.toLocaleString("en-US", { month: "long" })}
                    <span className="ml-1 text-white/40 font-normal">{viewDate.getFullYear()}</span>
                </span>
                <div className="flex items-center gap-0.5">
                    <button type="button" onClick={onPrevMonth} aria-label="Previous month"
                        className="p-1 rounded text-white/60 hover:bg-white/10 hover:text-white cursor-pointer">
                        <ChevronLeft size={14} />
                    </button>
                    <button type="button" onClick={onNextMonth} aria-label="Next month"
                        className="p-1 rounded text-white/60 hover:bg-white/10 hover:text-white cursor-pointer">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {WEEKDAYS.map(d => (
                    <div key={d} className="text-center text-[10px] text-white/30">{d[0]}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((cell, i) => {
                    const { date, inCurrentMonth } = cell;
                    const isToday = isSameDay(date, today);
                    const isSelected = selected ? isSameDay(date, selected) : false;
                    const dayTasks = tasks.filter(t => occursOn(t, date)).slice(0, 3);

                    return (
                        <button key={i} type="button" onClick={() => onSelectDay(date)}
                            className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded text-[11px] cursor-pointer transition-colors
                                ${isSelected
                                    ? "bg-(--vibranic) text-white"
                                    : isToday
                                        ? "text-(--vibranic) ring-1 ring-(--vibranic)/40 hover:bg-white/10"
                                        : `hover:bg-white/10 ${inCurrentMonth ? "text-white/80" : "text-white/25"}`}`}>
                            <span className="leading-none">{date.getDate()}</span>
                            <span className="flex h-1 items-center gap-0.5">
                                {dayTasks.map(t => (
                                    <span key={t.id} className="h-1 w-1 rounded-full"
                                        style={{ background: t.category?.color ?? "#7C6CFF" }} />
                                ))}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
