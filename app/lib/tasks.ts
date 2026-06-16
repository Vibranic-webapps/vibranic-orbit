import { Task } from "@/app/types";
import { priorityOptions } from "@/app/constants";

export type Bucket = "overdue" | "today" | "upcoming" | "completed";

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
    const mondayIndex = (x.getDay() + 6) % 7; // 0 = Monday
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

    // Fold Overdue into the first week's grid (as its first column) so it doesn't
    // waste a whole band. If there are no upcoming weeks, give it its own section.
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
        if (t.completed) { ensure("completed", "Completed", "completed", Number.MAX_SAFE_INTEGER, null).items.push(t); continue; }
        if (taskBucket(t, now) === "overdue") { ensure("overdue", "Overdue", "overdue", -Infinity, null).items.push(t); continue; }
        const due = dueOf(t);
        if (!due) { ensure("nodate", "No date", "upcoming", Number.MAX_SAFE_INTEGER - 1, null).items.push(t); continue; }
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
