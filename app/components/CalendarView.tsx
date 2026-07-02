"use client";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, ChevronLeft, Plus, Check } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { Task, Category } from "@/app/types";
import { useCalendarGrid } from "@/app/hooks/useCalendarGrid";
import { WEEKDAYS, isSameDay, addDays } from "@/app/lib/calendar";
import type { DayCell } from "@/app/lib/calendar";
import { itemKind, startTimeLabel, isMultiDay, layoutWeek, cellDensity, groupByCategory, occursOn, weekStart } from "@/app/lib/tasks";
import type { SpanBar, CategoryGroup } from "@/app/lib/tasks";
import { useTaskActions } from "@/app/hooks/useTaskActions";
import TaskDrawer, { type TaskDrawerHandle } from "./TaskDrawer";
import MiniCalendar from "./MiniCalendar";
import TimeGridView from "./TimeGridView";
import TaskDetailCard from "./tasks/TaskDetailCard";

interface CalendarViewProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    onDrawerOpenChange?: (open: boolean) => void;
}

export default function CalendarView({ tasks, setTasks, categories, setCategories, onDrawerOpenChange }: CalendarViewProps) {
    const { viewDate, setViewDate, cells, goToPrevMonth, goToNextMonth, goToToday } = useCalendarGrid();
    const drawer = useRef<TaskDrawerHandle>(null);
    const { updateTask } = useTaskActions(setTasks);

    const [mounted, setMounted] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [openDay, setOpenDay] = useState<number | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [detailTask, setDetailTask] = useState<Task | null>(null);
    const [hiddenCats, setHiddenCats] = useState<Set<string>>(new Set());

    const catKeyOf = (t: Task) => t.category?.id ?? "none";
    const toggleCat = (id: string) => setHiddenCats(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const selectDay = (d: Date) => {
        setSelectedDay(d);
        if (d.getMonth() !== viewDate.getMonth() || d.getFullYear() !== viewDate.getFullYear()) {
            setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
        }
    };

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    // A right-side panel (edit drawer, or the detail sheet on desktop) pushes the
    // page content aside. Derive the combined open state and report it up to the page.
    const drawerOpen = editOpen || detailTask !== null;
    useEffect(() => {
        onDrawerOpenChange?.(drawerOpen);
    }, [drawerOpen, onDrawerOpenChange]);

    const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const visibleTasks = tasks.filter(t => !hiddenCats.has(catKeyOf(t)));

    const filterCats = [
        ...categories.map(c => ({ id: c.id, name: c.name, color: c.color })),
        ...(tasks.some(t => !t.category) ? [{ id: "none", name: "Uncategorized", color: "#9ca3af" }] : []),
    ];

    const tasksForDay = (cell: Date) => visibleTasks.filter(t => occursOn(t, cell));

    const today = atMidnight(new Date());

    const [viewMode, setViewMode] = useState<"month" | "week" | "3day" | "day">("month");

    const rangeStart = viewMode === "week" ? weekStart(viewDate) : atMidnight(viewDate);
    const rangeLen = viewMode === "3day" ? 3 : viewMode === "day" ? 1 : 7;
    const rangeDays = Array.from({ length: rangeLen }, (_, i) => addDays(rangeStart, i));

    const rangeStep = viewMode === "week" ? 7 : viewMode === "day" ? 1 : 3;
    const goPrev = () => viewMode === "month"
        ? goToPrevMonth()
        : setViewDate(addDays(viewDate, -rangeStep));
    const goNext = () => viewMode === "month"
        ? goToNextMonth()
        : setViewDate(addDays(viewDate, rangeStep));

    // Jump to the single-day time grid for a specific date (from a month cell).
    const openDayView = (d: Date) => { setSelectedDay(d); setViewDate(d); setViewMode("day"); };

    const rangeLabel = () => {
        if (viewMode === "day")
            return rangeDays[0].toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
        const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const last = rangeDays[rangeDays.length - 1];
        return `${fmt(rangeDays[0])} – ${fmt(last)}`;
    };

    const LANE_H = 22;

    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const eventBar = (task: Task) => {
        const color = task.category?.color ?? "#7C6CFF";
        return (
            <button key={task.id} type="button"
                onClick={(e) => { e.stopPropagation(); setDetailTask(task); }}
                style={{ background: `${color}22`, borderLeft: `3px solid ${color}` }}
                className={`flex items-center gap-1 rounded-sm px-1 py-0.5 text-[11px] text-left cursor-pointer hover:brightness-125 ${task.completed ? "line-through text-white/40" : "text-white/90"}`}>
                <span className="font-medium shrink-0 tabular-nums">{startTimeLabel(task)}</span>
                <span className="truncate">{task.name}</span>
            </button>
        );
    };

    const taskRow = (task: Task) => {
        const color = task.category?.color ?? "#7C6CFF";
        return (
            <button key={task.id} type="button"
                onClick={(e) => { e.stopPropagation(); setDetailTask(task); }}
                className={`flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-white/10 text-[11px] text-left cursor-pointer ${task.completed ? "line-through text-white/40" : "text-white/80"}`}>
                <span
                    onClick={(e) => { e.stopPropagation(); updateTask(task, { completed: !task.completed }); }}
                    style={{ borderColor: color, background: task.completed ? color : "transparent" }}
                    className="grid place-items-center h-3 w-3 shrink-0 rounded-[3px] border">
                    {task.completed && <Check size={9} strokeWidth={3} className="text-white" />}
                </span>
                <span className="truncate">{task.name}</span>
            </button>
        );
    };

    const renderItem = (task: Task) =>
        itemKind(task) === "event" ? eventBar(task) : taskRow(task);

    const renderComfortable = (task: Task) => {
        const color = task.category?.color ?? "#7C6CFF";
        const subtitle = task.description?.trim() || task.category?.name || null;
        return (
            <button key={task.id} type="button"
                onClick={(e) => { e.stopPropagation(); setDetailTask(task); }}
                style={{ background: `${color}1f`, borderLeft: `3px solid ${color}` }}
                className={`flex flex-col gap-1 rounded-md px-2 py-2 text-left cursor-pointer hover:brightness-125 ${task.completed ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-1.5">
                    <span className={`font-semibold text-[13px] leading-tight truncate ${task.completed ? "line-through text-white/50" : "text-white/95"}`}>{task.name}</span>
                    {itemKind(task) === "event" && (
                        <span className="shrink-0 text-[11px] text-white/60 tabular-nums">{startTimeLabel(task)}</span>
                    )}
                </div>
                {subtitle && (
                    <p className="text-[11px] leading-snug text-white/50 line-clamp-2">{subtitle}</p>
                )}
            </button>
        );
    };

    const renderCategorySquare = (group: CategoryGroup, onClick: () => void) => (
        <button key={group.id} type="button" title={`${group.name}: ${group.count}`}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{ background: `${group.color}22` }}
            className="flex items-center gap-1 rounded px-1 py-0.5 cursor-pointer hover:brightness-125">
            <span className="grid place-items-center h-4 w-4 rounded-sm shrink-0" style={{ background: group.color }}>
                <DynamicIcon name={group.icon as IconName} size={10} strokeWidth={2.5} className="text-black/70" />
            </span>
            <span className="text-[11px] font-semibold text-white/80">{group.count}</span>
        </button>
    );
    
    const renderSpanBar = (bar: SpanBar) => {
        const { task, startCol, span, lane, continuesLeft, continuesRight } = bar;
        const color = task.category?.color ?? "#7C6CFF";
        return (
            <div key={task.id} className="pointer-events-auto px-px"
                style={{ gridColumn: `${startCol + 1} / span ${span}`, gridRow: lane + 1 }}>
                <button type="button"
                    onClick={(e) => { e.stopPropagation(); setDetailTask(task); }}
                    style={{
                        background: `${color}33`,
                        borderLeft: continuesLeft ? undefined : `3px solid ${color}`,
                    }}
                    className={`w-full truncate text-left text-[11px] leading-4.5 px-1.5 cursor-pointer hover:brightness-125
                        ${continuesLeft ? "rounded-l-none" : "rounded-l-sm"} ${continuesRight ? "rounded-r-none" : "rounded-r-sm"}
                        ${task.completed ? "line-through text-white/40" : "text-white/90"}`}>
                    {continuesLeft && <span className="opacity-60">◂ </span>}
                    { !continuesLeft && task.name }
                    {continuesRight && <span className="opacity-60"> ▸</span>}
                </button>
            </div>
        );
    };

    const renderDayCell = (cell: DayCell, laneCount: number) => {
        const { date, inCurrentMonth } = cell;
        const isToday = date.getTime() === today.getTime();
        const isPast = date < today;
        const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;
        const allForDay = tasksForDay(date);
        const dayTasks = allForDay.filter(t => !isMultiDay(t));
        const spanCount = allForDay.length - dayTasks.length;
        const density = cellDensity(dayTasks.length, spanCount);

        const dateBadge = (
            <div className="flex justify-end">
                <span className={`grid place-items-center h-6 w-6 rounded-full text-xs ${isToday ? "bg-(--vibranic) text-white font-semibold" : "text-white/60"}`}>
                    {date.getDate()}
                </span>
            </div>
        );

        return (
            <div key={date.getTime()}
                onClick={() => openDayView(date)}
                className={`group relative min-h-24 rounded-lg border p-1.5 flex flex-col gap-1 cursor-pointer transition-colors hover:z-30
                    ${isSelected
                        ? "border-(--vibranic) ring-1 ring-(--vibranic)/60"
                        : isToday
                            ? "border-(--vibranic)/60 bg-(--vibranic)/5 shadow-[0_0_16px_-6px_var(--vibranic)]"
                            : "border-white/10 bg-white/2 "}
                    ${!inCurrentMonth || (isPast && !isToday) ? "opacity-40" : ""}
                `}>
                {dateBadge}
                {laneCount > 0 && <div aria-hidden style={{ height: laneCount * LANE_H }} />}

                {density === "comfortable" && (
                    <div className="flex flex-col gap-0.5">{dayTasks.map(renderComfortable)}</div>
                )}
                {density === "cozy" && (
                    <div className="flex flex-col gap-0.5">{dayTasks.map(renderItem)}</div>
                )}
                {density === "compact" && (
                    <div className="grid grid-cols-2 gap-1">
                        {groupByCategory(dayTasks).map(group =>
                            renderCategorySquare(group, () => setOpenDay(date.getTime())))}
                    </div>
                )}

                {openDay === date.getTime() && (
                    <div className="absolute left-0 top-0 z-40 w-56 flex flex-col gap-0.5 rounded-lg border border-(--vibranic)/40 bg-[#0c0e1c] p-1.5 shadow-2xl">
                        {dateBadge}
                        {dayTasks.map(renderItem)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <main className="p-4 w-full max-w-360 mx-auto">
            {mounted && createPortal(
                <div className={`fixed z-30 right-4 bottom-6 lg:inset-x-0 lg:top-4 lg:bottom-auto pointer-events-none transition-opacity ${drawerOpen ? "opacity-0" : "opacity-100"}`}>
                    <div className="lg:max-w-360 lg:mx-auto lg:px-4 flex justify-end">
                        <button
                            onClick={() => drawer.current?.openAdd()}
                            className={`group pointer-events-auto flex items-center gap-2 p-3 rounded-full sm:px-4 sm:py-2 sm:rounded-lg border border-white/10 text-white backdrop-blur-md transition-all cursor-pointer
                                bg-[color-mix(in_srgb,var(--vibranic)_15%,transparent)]
                                hover:bg-[color-mix(in_srgb,var(--vibranic)_30%,transparent)] hover:border-(--vibranic)
                                shadow-[0_0_16px_-4px_var(--vibranic)] hover:shadow-[0_0_24px_-2px_var(--vibranic)]
                                ${drawerOpen ? "pointer-events-none" : ""}`}
                        >
                            <Plus size={18} className="transition-transform group-hover:rotate-90" />
                            <span className="hidden sm:inline">Add task</span>
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
                onOpenChange={setEditOpen}
            />

            <TaskDetailCard
                task={detailTask}
                onClose={() => setDetailTask(null)}
                onEdit={(t) => { setDetailTask(null); drawer.current?.openEdit(t); }}
                onDelete={(t) => { setDetailTask(null); drawer.current?.requestDelete(t); }}
            />

            {openDay !== null && (
                <div className="fixed inset-0 z-30" onClick={() => setOpenDay(null)} />
            )}

            <div className="flex gap-6">
                <aside className="hidden lg:flex flex-col justify-between w-56 shrink-0 pt-15">
                    {filterCats.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Filters</h2>
                            <div className="flex flex-col gap-1.5">
                                {filterCats.map(c => {
                                    const hidden = hiddenCats.has(c.id);
                                    return (
                                        <button key={c.id} type="button" onClick={() => toggleCat(c.id)}
                                            className="flex items-center gap-2 text-left text-sm cursor-pointer">
                                            <span className="grid place-items-center h-4 w-4 rounded border transition-colors shrink-0"
                                                style={{ borderColor: c.color, background: hidden ? "transparent" : c.color }}>
                                                {!hidden && <Check size={11} strokeWidth={3} className="text-black/70" />}
                                            </span>
                                            <span className={`truncate ${hidden ? "text-white/35" : "text-white/80"}`}>{c.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <MiniCalendar
                        viewDate={viewDate}
                        selected={selectedDay}
                        tasks={visibleTasks}
                        onSelectDay={selectDay}
                        onPrevMonth={goToPrevMonth}
                        onNextMonth={goToNextMonth}
                    />
                </aside>

                <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between gap-3 flex-wrap mb-5">
                    <h1 className="text-xl sm:text-2xl font-semibold">
                        {viewMode === "month"
                            ? viewDate.toLocaleString("en-US", { month: "long" })
                            : rangeLabel()}
                        <span className="ml-2 text-white/40 font-normal">{viewDate.getFullYear()}</span>
                    </h1>
                    <div className="flex items-center justify-between w-full gap-4 sm:w-auto sm:justify-normal sm:gap-2">
                        <div className="inline-flex rounded-md border border-white/10 p-0.5">
                            {([["month", "Month"], ["week", "Week"], ["3day", "3 days"], ["day", "Day"]] as const).map(([val, label]) => (
                                <button key={val} onClick={() => setViewMode(val)}
                                    className={`px-2.5 py-1 text-sm rounded cursor-pointer transition-colors ${viewMode === val ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={goPrev} aria-label="Previous"
                                className="p-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white cursor-pointer">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={goToToday}
                                className="px-3 py-1 text-sm rounded-md border border-white/10 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer">
                                Today
                            </button>
                            <button onClick={goNext} aria-label="Next"
                                className="p-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white cursor-pointer">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {viewMode === "month" ? (
                    <>
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="text-center text-xs uppercase tracking-[0.2em] font-medium text-white/40">{day}</div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2">
                            {weeks.map((week, w) => {
                                const { bars, laneCount } = layoutWeek(visibleTasks, week[0].date);
                                return (
                                    <div key={w} className="relative grid grid-cols-7 gap-1 sm:gap-2">
                                        {week.map(cell => renderDayCell(cell, laneCount))}

                                        {bars.length > 0 && (
                                            <div className="pointer-events-none absolute inset-x-0 grid grid-cols-7 gap-x-1 sm:gap-x-2"
                                                style={{ top: 30, gridAutoRows: `${LANE_H}px` }}>
                                                {bars.map(renderSpanBar)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <TimeGridView
                        days={rangeDays}
                        tasks={visibleTasks}
                        onEditTask={(t) => setDetailTask(t)}
                        onUpdateTask={updateTask}
                        onCreateAt={(startDateTime, endDateTime) => drawer.current?.openAdd({ startDateTime, endDateTime })}
                    />
                )}
                </div>
            </div>
        </main>
    );
}
