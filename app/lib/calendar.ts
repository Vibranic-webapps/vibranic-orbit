// Pure calendar math & date-string helpers — no React, no state. Easy to test, safe to reuse.

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Build the cells for a month's grid.
 * `month` is 0-indexed (0 = January, 11 = December), matching the Date API.
 * Returns leading `null`s for the blanks before the 1st, then one Date per day.
 */
export function buildMonthCells(year: number, month: number): (Date | null)[] {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    const leading = Array.from({ length: firstWeekday }, () => null);

    // Pad to a constant 6 rows (42 cells) so the grid's height never changes
    // between months — no layout shift when navigating.
    const TOTAL_CELLS = 42;
    const trailing = Array.from(
        { length: TOTAL_CELLS - leading.length - days.length },
        () => null,
    );

    return [...leading, ...days, ...trailing];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Strip the time so two dates can be compared by calendar day. */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** True if two dates fall on the same calendar day (ignores time). */
export const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

/** A day is disabled if it falls outside [min, max] (compared by day, not time). */
export function isDisabled(day: Date, min?: Date | null, max?: Date | null): boolean {
    const t = startOfDay(day).getTime();
    if (min && t < startOfDay(min).getTime()) return true;
    if (max && t > startOfDay(max).getTime()) return true;
    return false;
}

/** Date + n days, normalised to local midnight. */
export const addDays = (d: Date, n: number) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Date -> "YYYY-MM-DD" (for date-only fields), using local time. */
export const toDateValue = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Date -> "YYYY-MM-DDTHH:mm" (datetime-local format), using local time. */
export const toDateTimeValue = (d: Date) =>
    `${toDateValue(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Parse a stored field string back into a Date, or null. */
export const parseValue = (s: string): Date | null => {
    if (!s) return null;
    // A bare "YYYY-MM-DD" parses as UTC; pin it to local midnight instead.
    const d = new Date(s.length === 10 ? `${s}T00:00` : s);
    return isNaN(d.getTime()) ? null : d;
};
