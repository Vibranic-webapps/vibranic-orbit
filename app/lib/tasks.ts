import { Task } from "@/app/types";
import { priorityOptions } from "@/app/constants";
import { startOfDay, addDays } from "@/app/lib/calendar";

export type Bucket = "overdue" | "today" | "upcoming" | "completed";
export type ItemKind = "task" | "event";

export function itemKind(t: Task): ItemKind {
    if (!t.startDateTime || !t.endDateTime) return "task";

    const start = new Date(t.startDateTime).getTime();
    const end = new Date(t.endDateTime).getTime();

    return end > start ? "event" : "task";
}

export function startTimeLabel(t: Task): string {
    if (!t.startDateTime) return "";
    return new Date(t.startDateTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const DAY_MS = 86_400_000;
export const dayDiff = (from: Date, to: Date) =>
    Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);

export function isMultiDay(t: Task): boolean {
    if (t.frequency) return false;
    if (!t.startDateTime || !t.endDateTime) return false;
    return dayDiff(new Date(t.startDateTime), new Date(t.endDateTime)) >= 1;
}

export interface SpanGeometry {
    startCol: number;
    span: number;
    continuesLeft: boolean;
    continuesRight: boolean;
}

export function spanGeometry(t: Task, weekStart: Date): SpanGeometry {
    const startOffset = dayDiff(weekStart, new Date(t.startDateTime!));
    const endOffset = dayDiff(weekStart, new Date(t.endDateTime!));

    const startCol = Math.max(0, startOffset);
    const endCol = Math.min(6, endOffset);

    return {
        startCol,
        span: endCol - startCol + 1,
        continuesLeft: startOffset < 0,
        continuesRight: endOffset > 6,
    };
}

export interface SpanBar extends SpanGeometry {
    task: Task;
    lane: number;
}

export function layoutWeek(events: Task[], weekStart: Date): { bars: SpanBar[]; laneCount: number } {
    const weekEnd = addDays(weekStart, 6);

    const overlapping = events.filter(t => {
        if (!isMultiDay(t)) return false;
        const s = startOfDay(new Date(t.startDateTime!));
        const e = startOfDay(new Date(t.endDateTime!));
        return s <= weekEnd && e >= weekStart;
    });

    const placed = overlapping
        .map(task => ({ task, g: spanGeometry(task, weekStart) }))
        .sort((a, b) => a.g.startCol - b.g.startCol);

    const laneEndCol: number[] = [];
    const bars: SpanBar[] = [];

    for (const { task, g } of placed) {
        const endCol = g.startCol + g.span - 1;
        let lane = laneEndCol.findIndex(end => end < g.startCol);
        if (lane === -1) { lane = laneEndCol.length; laneEndCol.push(endCol); }
        else laneEndCol[lane] = endCol;
        bars.push({ ...g, task, lane });
    }

    return { bars, laneCount: laneEndCol.length };
}

export const minutesIntoDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

export function occursOn(task: Task, day: Date): boolean {
    if (!task.startDateTime || !task.endDateTime) return false;
    const start = startOfDay(new Date(task.startDateTime));

    if (day < start) return false;
    if (task.recurrenceEnd && day > startOfDay(new Date(task.recurrenceEnd))) return false;

    if (!task.frequency) {
        return day <= startOfDay(new Date(task.endDateTime));
    }

    if (task.frequency === "DAILY") {
        const days = Math.round((day.getTime() - start.getTime()) / DAY_MS);
        return days % task.interval === 0;
    }

    if (task.frequency === "WEEKLY") {
        const weekdays = task.byWeekday.length ? task.byWeekday : [start.getDay()];
        if (!weekdays.includes(day.getDay())) return false;
        const weeks = Math.floor((day.getTime() - start.getTime()) / (7 * DAY_MS));
        return weeks % task.interval === 0;
    }

    if (task.frequency === "MONTHLY") {
        if (day.getDate() !== start.getDate()) return false;
        const months = (day.getFullYear() - start.getFullYear()) * 12
            + (day.getMonth() - start.getMonth());
        return months % task.interval === 0;
    }

    return false;
}

export const dueOf = (t: Task): Date | null => {
    const s = t.endDateTime || t.startDateTime;
    return s ? new Date(s) : null;
};

export function taskBucket(t: Task, now = new Date()): Bucket {
    if (t.completed) return "completed";
    const due = dueOf(t);
    if (!due) return "upcoming";

    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    if (due < now) return "overdue";
    if (due < startOfTomorrow) return "today";
    return "upcoming";
}

export const priorityRank = (t: Task) =>
    priorityOptions.findIndex(o => o.value === t.priority);

export type CellDensity = "comfortable" | "cozy" | "compact";

export function cellDensity(count: number, spanCount = 0): CellDensity {
    if (count >= 4) return "compact";
    if (count === 1 && spanCount === 0) return "comfortable";
    return "cozy";
}

export interface CategoryGroup {
    id: string;
    name: string;
    color: string;
    icon: string;
    count: number;
}

export function groupByCategory(tasks: Task[]): CategoryGroup[] {
    const map = new Map<string, CategoryGroup>();
    for (const t of tasks) {
        const c = t.category;
        const key = c?.id ?? "none";
        const existing = map.get(key);
        if (existing) {
            existing.count++;
        } else {
            map.set(key, {
                id: key,
                name: c?.name ?? "Uncategorized",
                color: c?.color ?? "#7C6CFF",
                icon: c?.icon ?? "circle",
                count: 1,
            });
        }
    }
    return [...map.values()];
}

export function dueLabel(t: Task): string {
    const due = dueOf(t);
    if (!due) return "No date";
    const date = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = due.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return `${date} · ${time}`;
}

export function relativeDue(t: Task, now = new Date()): string {
    const due = dueOf(t);
    if (!due) return "No date";

    const time = due.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const shortDate = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((dueDay.getTime() - startOfToday.getTime()) / 86_400_000);

    if (due < now && !t.completed) {
        return diffDays === 0 ? `Overdue · ${time}` : `Overdue · ${shortDate}`;
    }
    if (diffDays === 0) return `Today · ${time}`;
    if (diffDays === 1) return `Tomorrow · ${time}`;
    if (diffDays > 1 && diffDays < 7) {
        return `${due.toLocaleDateString("en-US", { weekday: "long" })} · ${time}`;
    }
    return `${shortDate} · ${time}`;
}

export interface DayGroup {
    key: string;
    label: string;
    tone: "overdue" | "today" | "upcoming" | "completed";
    date: Date | null;
    items: Task[];
}

export function weekStart(d: Date): Date {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const mondayIndex = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - mondayIndex);
    return x;
}

export interface WeekSection {
    key: string;
    label: string;
    days: DayGroup[];
}

export function groupByWeek(groups: DayGroup[], now = new Date()): WeekSection[] {
    const thisMonday = weekStart(now).getTime();
    const nextMonday = thisMonday + 7 * 86_400_000;

    const weekLabel = (monday: Date) => {
        const t = monday.getTime();
        if (t === thisMonday) return "This week";
        if (t === nextMonday) return "Next week";
        return `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    };

    const special = (key: string) => groups.filter(g => g.key === key);
    const dayGroups = groups.filter(g => g.date);

    const weekMap = new Map<number, DayGroup[]>();
    for (const g of dayGroups) {
        const ws = weekStart(g.date!).getTime();
        const arr = weekMap.get(ws);
        if (arr) arr.push(g); else weekMap.set(ws, [g]);
    }
    const weeks: WeekSection[] = [...weekMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([ws, days]) => ({ key: `week-${ws}`, label: weekLabel(new Date(ws)), days }));

    const overdue = special("overdue");
    const nodate = special("nodate");
    const completed = special("completed");

    if (overdue.length && weeks.length) {
        weeks[0] = { ...weeks[0], days: [...overdue, ...weeks[0].days] };
    }

    return [
        ...(overdue.length && !weeks.length ? [{ key: "overdue", label: "Overdue", days: overdue }] : []),
        ...weeks,
        ...(nodate.length ? [{ key: "nodate", label: "No date", days: nodate }] : []),
        ...(completed.length ? [{ key: "completed", label: "Completed", days: completed }] : []),
    ];
}

export function groupByDay(tasks: Task[], now = new Date()): DayGroup[] {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dayLabel = (due: Date) => {
        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        const diff = Math.round((dueDay.getTime() - startOfToday.getTime()) / 86_400_000);
        const weekday = due.toLocaleDateString("en-US", { weekday: "long" });
        if (diff === 0) return `Today · ${weekday}`;
        if (diff === 1) return `Tomorrow · ${weekday}`;
        return weekday;
    };

    type Acc = { label: string; tone: DayGroup["tone"]; order: number; date: Date | null; items: Task[] };
    const map = new Map<string, Acc>();
    const ensure = (key: string, label: string, tone: Acc["tone"], order: number, date: Date | null) => {
        let g = map.get(key);
        if (!g) { g = { label, tone, order, date, items: [] }; map.set(key, g); }
        return g;
    };

    for (const t of tasks) {
        if (t.completed) { 
            ensure("completed", "Completed", "completed", Number.MAX_SAFE_INTEGER, null).items.push(t); continue; 
        }

        if (taskBucket(t, now) === "overdue") { 
            ensure("overdue", "Overdue", "overdue", -Infinity, null).items.push(t); continue; 
        }

        const due = dueOf(t);
        if (!due) { 
            ensure("nodate", "No date", "upcoming", Number.MAX_SAFE_INTEGER - 1, null).items.push(t); continue; 
        }

        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        const tone: DayGroup["tone"] = dueDay.getTime() === startOfToday.getTime() ? "today" : "upcoming";
        ensure(`d${dueDay.getTime()}`, dayLabel(due), tone, dueDay.getTime(), dueDay).items.push(t);
    }

    return [...map.entries()]
        .sort((a, b) => a[1].order - b[1].order)
        .map(([key, g]) => ({ key, label: g.label, tone: g.tone, date: g.date, items: g.items }));
}

export function taskStats(tasks: Task[], now = new Date()) {
    let active = 0, completed = 0, overdue = 0, today = 0;
    for (const t of tasks) {
        const b = taskBucket(t, now);
        if (b === "completed") completed++; else active++;
        if (b === "overdue") overdue++;
        if (b === "today") today++;
    }

    return { total: tasks.length, active, completed, overdue, today };
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Turns a task's recurrence fields into a human sentence, e.g.
// "Every 2 weeks on Mon, Thu · until Aug 1, 2026". Returns null for one-off tasks.
export function recurrenceLabel(t: Task): string | null {
    if (!t.frequency) return null;
    const n = t.interval ?? 1;
    const unit = t.frequency === "DAILY" ? "day" : t.frequency === "WEEKLY" ? "week" : "month";
    let label = n === 1 ? `Every ${unit}` : `Every ${n} ${unit}s`;

    if (t.frequency === "WEEKLY" && t.byWeekday?.length) {
        const days = [...t.byWeekday].sort((a, b) => a - b).map(d => WEEKDAY_NAMES[d]).join(", ");
        label += ` on ${days}`;
    }
    if (t.recurrenceEnd) {
        const end = new Date(t.recurrenceEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        label += ` · until ${end}`;
    }
    return label;
}
