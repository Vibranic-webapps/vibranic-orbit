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
    /** Fired when an empty part of a day column is clicked, with a 1h slot at the clicked time. */
    onCreateAt: (startDateTime: string, endDateTime: string) => void;
}

const hourLabel = (h: number) => {
    if (h === 0) return "";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display} ${h < 12 ? "AM" : "PM"}`;
};

const clampMin = (m: number) => Math.max(0, Math.min(24 * 60, m));

const withMinutes = (base: Date, minutes: number) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(minutes / 60), minutes % 60);

type DragEdge = "top" | "bottom" | "move";
interface DragState {
    task: Task; edge: DragEdge; startY: number;
    origStart: number; origEnd: number; originDayIndex: number;
    moved: boolean;
    // Live values, kept on the ref so the drag survives the event relocating between columns.
    curStart: number; curEnd: number; curDay: number;
}

export default function TimeGridView({ days, tasks, onEditTask, onUpdateTask, onCreateAt }: TimeGridViewProps) {
    const now = new Date();
    const cols = `repeat(${days.length}, minmax(6rem,1fr))`;
    const rowMinWidth = 56 + days.length * 96;

    const dragRef = useRef<DragState | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    // Swallow the click the browser fires right after a drag ends, so releasing a
    // drag over empty space doesn't also create a task.
    const suppressClickRef = useRef(false);
    const [draft, setDraft] = useState<{ id: string; startMin: number; endMin: number; dayIndex?: number } | null>(null);

    const timedForDay = (day: Date) =>
        tasks.filter(t => occursOn(t, day) && !isMultiDay(t) && t.startDateTime);
    const allDayForDay = (day: Date) =>
        tasks.filter(t => occursOn(t, day) && isMultiDay(t));

    const moveDrag = (e: PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        const deltaMin = Math.round(((e.clientY - d.startY) / HOUR_PX) * 60 / SNAP) * SNAP;
        if (deltaMin !== 0) d.moved = true;
        let startMin = d.origStart;
        let endMin = d.origEnd;
        if (d.edge === "top") startMin = clampMin(Math.min(d.origStart + deltaMin, d.origEnd - SNAP));
        else if (d.edge === "bottom") endMin = clampMin(Math.max(d.origEnd + deltaMin, d.origStart + SNAP));
        else {
            // Move the whole event (time), preserving its duration.
            const dur = d.origEnd - d.origStart;
            startMin = Math.max(0, Math.min(d.origStart + deltaMin, 24 * 60 - dur));
            endMin = startMin + dur;
        }

        // For a move drag, map the pointer's X to a day column (cross-day move).
        let dayIndex = d.originDayIndex;
        if (d.edge === "move") {
            const grid = gridRef.current;
            if (grid) {
                const r = grid.getBoundingClientRect();
                const col = Math.floor(((e.clientX - r.left) / r.width) * days.length);
                dayIndex = Math.max(0, Math.min(col, days.length - 1));
            }
            if (dayIndex !== d.originDayIndex) d.moved = true;
        }
        d.curStart = startMin; d.curEnd = endMin; d.curDay = dayIndex;
        setDraft({ id: d.task.id, startMin, endMin, dayIndex });
    };

    const endDrag = () => {
        const d = dragRef.current;
        dragRef.current = null;
        setDraft(null);
        window.removeEventListener("pointermove", moveDrag);
        window.removeEventListener("pointerup", endDrag);
        if (!d) return;
        suppressClickRef.current = true;
        setTimeout(() => { suppressClickRef.current = false; }, 0);
        // A "move" grab that never moved is really a click → open the task.
        if (d.edge === "move" && !d.moved) { onEditTask(d.task); return; }

        const unchanged = d.curDay === d.originDayIndex && d.curStart === d.origStart && d.curEnd === d.origEnd;
        if (unchanged) return;

        // Rebuild start/end on the target day (handles both time and cross-day moves).
        const targetDay = days[d.curDay] ?? new Date(d.task.startDateTime!);
        onUpdateTask(d.task, {
            startDateTime: toDateTimeValue(withMinutes(targetDay, d.curStart)),
            endDateTime: toDateTimeValue(withMinutes(targetDay, d.curEnd)),
        });
    };

    const beginDrag = (e: React.PointerEvent, task: Task, edge: DragEdge, origStart: number, origEnd: number) => {
        e.stopPropagation();
        e.preventDefault();
        const originDayIndex = days.findIndex(day => isSameDay(day, new Date(task.startDateTime!)));
        dragRef.current = {
            task, edge, startY: e.clientY, origStart, origEnd, originDayIndex, moved: false,
            curStart: origStart, curEnd: origEnd, curDay: originDayIndex,
        };
        setDraft({ id: task.id, startMin: origStart, endMin: origEnd, dayIndex: originDayIndex });
        // Track on window so the drag continues even as the event relocates between columns.
        window.addEventListener("pointermove", moveDrag);
        window.addEventListener("pointerup", endDrag);
    };

    return (
        <div className="rounded-lg border border-white/10 overflow-hidden">
            <div className="scroll-space overflow-auto" style={{ maxHeight: "70vh" }}>
                <div className="sticky top-0 z-30 bg-[#0b0e1c]/95 backdrop-blur-sm" style={{ minWidth: rowMinWidth }}>
                    <div className="flex border-b border-white/10">
                        <div className="w-14 shrink-0 sticky left-0 z-40 bg-[#0b0e1c]" />
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
                        <div className="w-14 shrink-0 sticky left-0 z-40 bg-[#0b0e1c] grid place-items-center text-[10px] text-white/30">all-day</div>
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

                <div className="flex" style={{ minWidth: rowMinWidth }}>
                    <div className="w-14 shrink-0 sticky left-0 z-20 bg-[#0b0e1c]">
                        {HOURS.map(h => (
                            <div key={h} style={{ height: HOUR_PX }} className="relative">
                                <span className="absolute -top-1.5 right-1 text-[10px] text-white/30">{hourLabel(h)}</span>
                            </div>
                        ))}
                    </div>

                    <div ref={gridRef} className="relative grid flex-1" style={{ gridTemplateColumns: cols, height: DAY_PX }}>
                        {HOURS.map(h => (
                            <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-white/5"
                                style={{ top: h * HOUR_PX }} />
                        ))}

                        {days.some(d => isSameDay(d, now)) && (
                            <div className="pointer-events-none absolute inset-x-0 z-20 border-t border-red-500/70"
                                style={{ top: (minutesIntoDay(now) / 60) * HOUR_PX }} />
                        )}

                        {days.map((day, ci) => {
                            // While move-dragging, show the event in the hovered column.
                            const dragTask = draft?.dayIndex != null ? tasks.find(x => x.id === draft.id) ?? null : null;
                            let items = timedForDay(day);
                            if (dragTask) {
                                items = items.filter(t => t.id !== dragTask.id);
                                if (ci === draft!.dayIndex) items = [...items, dragTask];
                            }
                            return (
                            <div key={ci} className="relative border-l border-white/10 cursor-pointer"
                                onClick={(e) => {
                                    // Only fire on the empty background — not on events or drag handles.
                                    if (suppressClickRef.current) return;
                                    if (e.target !== e.currentTarget) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const rawMin = ((e.clientY - rect.top) / HOUR_PX) * 60;
                                    let startMin = clampMin(Math.round(rawMin / SNAP) * SNAP);
                                    if (startMin > 24 * 60 - 60) startMin = 24 * 60 - 60;
                                    onCreateAt(
                                        toDateTimeValue(withMinutes(day, startMin)),
                                        toDateTimeValue(withMinutes(day, startMin + 60)),
                                    );
                                }}>
                                {items.map(t => {
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
                                    const handle = "absolute inset-x-0 h-2 cursor-ns-resize touch-none z-10";

                                    return (
                                        <div key={t.id}
                                            style={{ top, height, background: `${color}33`, borderLeft: `3px solid ${color}` }}
                                            className={`group absolute left-0.5 right-0.5 overflow-hidden rounded-sm ${live ? "ring-1 ring-(--vibranic) brightness-125" : ""}`}>
                                            <div className={`${handle} top-0`}
                                                onPointerDown={(e) => beginDrag(e, t, "top", baseStart, baseEnd)} />

                                            <div
                                                onPointerDown={(e) => beginDrag(e, t, "move", baseStart, baseEnd)}
                                                className={`block w-full h-full px-1 py-0.5 text-left text-[10px] touch-none cursor-grab active:cursor-grabbing hover:brightness-110 ${t.completed ? "line-through text-white/40" : "text-white/90"}`}>
                                                <span className="font-medium">{t.name}</span>
                                                <span className="ml-1 text-white/55 tabular-nums">{startTimeLabel(t)}</span>
                                            </div>

                                            <div className={`${handle} bottom-0`}
                                                onPointerDown={(e) => beginDrag(e, t, "bottom", baseStart, baseEnd)} />
                                        </div>
                                    );
                                })}
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
