export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export interface DayCell {
    date: Date;
    inCurrentMonth: boolean;
}

export function buildMonthCells(year: number, month: number): DayCell[] {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const start = addDays(new Date(year, month, 1), -firstWeekday);
    const TOTAL_CELLS = 42;

    return Array.from({ length: TOTAL_CELLS }, (_, i) => {
        const date = addDays(start, i)
        const inCurrentMonth = date.getMonth() === month;
        return { date, inCurrentMonth }
    })
}

const pad = (n: number) => String(n).padStart(2, "0");

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

export function isDisabled(day: Date, min?: Date | null, max?: Date | null): boolean {
    const t = startOfDay(day).getTime();
    if (min && t < startOfDay(min).getTime()) return true;
    if (max && t > startOfDay(max).getTime()) return true;
    return false;
}

export const addDays = (d: Date, n: number) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const toDateValue = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const toDateTimeValue = (d: Date) =>
    `${toDateValue(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const parseValue = (s: string): Date | null => {
    if (!s) return null;
    const d = new Date(s.length === 10 ? `${s}T00:00` : s);
    return isNaN(d.getTime()) ? null : d;
};
