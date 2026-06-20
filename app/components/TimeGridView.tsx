"use client";
import { useRef, useState } from "react";
import { Task } from "@/app/types";
import { occursOn, isMultiDay, minutesIntoDay, startTimeLabel } from "@/app/lib/tasks";
import { isSameDay, toDateTimeValue } from "@/app/lib/calendar";

const HOUR_PX = 48;
const DAY_PX = HOUR_PX * 24;
const MIN_EVENT_PX = 20;
const SNAP = 15;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

interface TimeGridViewProps {
    days: Date[];
    tasks: Task[];
    onEditTask: (t: Task) => void;
    onUpdateTask: (t: Task, updates: Partial<Task>) => void;
}

const hourLabel = (h: number) => {
    if (h === 0) return "";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display} ${h < 12 ? "AM" : "PM"}`;
};

const clampMin = (m: number) => Math.max(0, Math.min(24 * 60, m));

const withMinutes = (base: Date, minutes: number) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(minutes / 60), minutes % 60);

type DragEdge = "top" | "bottom";
interface DragState { task: Task; edge: DragEdge; startY: number; origStart: number; origEnd: number; }

export default function TimeGridView({ days, tasks, onEditTask, onUpdateTask }: TimeGridViewProps) {
    const now = new Date();
    const cols = `repeat(${days.length}, minmax(0,1fr))`;

    const dragRef = useRef<DragState | null>(null);
    const [draft, setDraft] = useState<{ id: string; startMin: number; endMin: number } | null>(null);

    const timedForDay = (day: Date) =>
        tasks.filter(t => occursOn(t, day) && !isMultiDay(t) && t.startDateTime);
    const allDayForDay = (day: Date) =>
        tasks.filter(t => occursOn(t, day) && isMultiDay(t));

    const beginDrag = (e: React.PointerEvent, task: Task, edge: DragEdge, origStart: number, origEnd: number) => {
        e.stopPropagation();
        e.preventDefault();
        dragRef.current = { task, edge, startY: e.clientY, origStart, origEnd };
        setDraft({ id: task.id, startMin: origStart, endMin: origEnd });
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
    };

    const moveDrag = (e: React.PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        const deltaMin = Math.round(((e.clientY - d.startY) / HOUR_PX) * 60 / SNAP) * SNAP;
        let startMin = d.origStart;
        let endMin = d.origEnd;
        if (d.edge === "top") startMin = clampMin(Math.min(d.origStart + deltaMin, d.origEnd - SNAP));
        else endMin = clampMin(Math.max(d.origEnd + deltaMin, d.origStart + SNAP));
        setDraft({ id: d.task.id, startMin, endMin });
    };

    const endDrag = () => {
        const d = dragRef.current;
        const live = draft;
        dragRef.current = null;
        setDraft(null);
        if (!d || !live) return;
        if (live.startMin === d.origStart && live.endMin === d.origEnd) return;
        const newStart = withMinutes(new Date(d.task.startDateTime!), live.startMin);
        const newEnd = withMinutes(new Date(d.task.endDateTime ?? d.task.startDateTime!), live.endMin);
        onUpdateTask(d.task, {
            startDateTime: toDateTimeValue(newStart),
            endDateTime: toDateTimeValue(newEnd),
        });
    };

    return (
        <div className="rounded-lg border border-white/10 overflow-hidden">
            <div className="scroll-space overflow-y-auto" style={{ maxHeight: "70vh" }}>
                <div className="sticky top-0 z-30 bg-[#0b0e1c]/95 backdrop-blur-sm">
                    <div className="flex border-b border-white/10">
                        <div className="w-14 shrink-0" />
                            <div className="grid flex-1" style={{ gridTemplateColumns: cols }}>
                                {days.map((d, i) => {
                                    const today = isSameDay(d, now);
                                    return (
                                        <div key={i} className="px-2 py-1.5 text-center border-l border-white/10">
                                            <div className="text-[11px] uppercase tracking-wide text-white/40">
                                                {d.toLocaleDateString("en-US", { weekday: "short" })}
                                            </div>
                                            <div className={`text-sm ${today ? "text-(--vibranic) font-semibold" : "text-white/80"}`}>
                                                {d.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                    </div>

                    <div className="flex border-b border-white/10 bg-white/2">
                        <div className="w-14 shrink-0 grid place-items-center text-[10px] text-white/30">all-day</div>
                        <div className="grid flex-1" style={{ gridTemplateColumns: cols }}>
                            {days.map((d, i) => (
                                <div key={i} className="border-l border-white/10 p-1 flex flex-col gap-0.5 min-h-7">
                                    {allDayForDay(d).map(t => {
                                        const color = t.category?.color ?? "#7C6CFF";
                                        return (
                                            <button key={t.id} type="button" onClick={() => onEditTask(t)}
                                                style={{ background: `${color}33`, borderLeft: `3px solid ${color}` }}
                                                className="truncate text-left text-[10px] px-1 rounded-sm text-white/85 hover:brightness-125 cursor-pointer">
                                                {t.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex">
                    <div className="w-14 shrink-0">
                        {HOURS.map(h => (
                            <div key={h} style={{ height: HOUR_PX }} className="relative">
                                <span className="absolute -top-1.5 right-1 text-[10px] text-white/30">{hourLabel(h)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="relative grid flex-1" style={{ gridTemplateColumns: cols, height: DAY_PX }}>
                        {HOURS.map(h => (
                            <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-white/5"
                                style={{ top: h * HOUR_PX }} />
                        ))}

                        {days.some(d => isSameDay(d, now)) && (
                            <div className="pointer-events-none absolute inset-x-0 z-20 border-t border-red-500/70"
                                style={{ top: (minutesIntoDay(now) / 60) * HOUR_PX }} />
                        )}

                        {days.map((day, ci) => (
                            <div key={ci} className="relative border-l border-white/10">
                                {timedForDay(day).map(t => {
                                    const start = new Date(t.startDateTime!);
                                    const end = t.endDateTime ? new Date(t.endDateTime) : start;
                                    const baseStart = minutesIntoDay(start);
                                    const baseEnd = isSameDay(end, start) ? minutesIntoDay(end) : 24 * 60;

                                    const live = draft?.id === t.id ? draft : null;
                                    const startMin = live ? live.startMin : baseStart;
                                    const endMin = live ? live.endMin : baseEnd;

                                    const top = (startMin / 60) * HOUR_PX;
                                    const height = Math.max(MIN_EVENT_PX, ((endMin - startMin) / 60) * HOUR_PX);
                                    const color = t.category?.color ?? "#7C6CFF";
                                    const handle = "absolute inset-x-0 h-2 cursor-ns-resize z-10";

                                    return (
                                        <div key={t.id}
                                            style={{ top, height, background: `${color}33`, borderLeft: `3px solid ${color}` }}
                                            className={`group absolute left-0.5 right-0.5 overflow-hidden rounded-sm ${live ? "ring-1 ring-(--vibranic) brightness-125" : ""}`}>
                                            <div className={`${handle} top-0`}
                                                onPointerDown={(e) => beginDrag(e, t, "top", baseStart, baseEnd)}
                                                onPointerMove={moveDrag} onPointerUp={endDrag} />

                                            <button type="button" onClick={() => onEditTask(t)}
                                                className={`block w-full h-full px-1 py-0.5 text-left text-[10px] cursor-pointer hover:brightness-110 ${t.completed ? "line-through text-white/40" : "text-white/90"}`}>
                                                <span className="font-medium">{t.name}</span>
                                                <span className="ml-1 text-white/55 tabular-nums">{startTimeLabel(t)}</span>
                                            </button>

                                            <div className={`${handle} bottom-0`}
                                                onPointerDown={(e) => beginDrag(e, t, "bottom", baseStart, baseEnd)}
                                                onPointerMove={moveDrag} onPointerUp={endDrag} />
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
