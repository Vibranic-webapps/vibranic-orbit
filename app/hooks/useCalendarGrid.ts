import { useState } from "react";
import { buildMonthCells } from "@/app/lib/calendar";

/**
 * Owns the "which month am I looking at" state and the navigation behavior.
 * Returns the month's cells plus prev/next/today controls.
 * Reused by both CalendarView and the date picker so the logic lives once.
 */
export function useCalendarGrid(initial: Date = new Date()) {
    const [viewDate, setViewDate] = useState(initial);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const cells = buildMonthCells(year, month);

    const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));
    const goToToday = () => setViewDate(new Date());

    return { viewDate, setViewDate, year, month, cells, goToPrevMonth, goToNextMonth, goToToday };
}
