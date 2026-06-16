"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarGrid } from "@/app/hooks/useCalendarGrid";
import { WEEKDAYS, isSameDay, isDisabled, addDays, toDateValue } from "@/app/lib/calendar";

interface CalendarProps {
    selected: Date | null;
    onSelect: (date: Date) => void;
    min?: Date | null;
    max?: Date | null;
}

export default function Calendar({ selected, onSelect, min, max }: CalendarProps) {
    const { viewDate, setViewDate, year, month, cells, goToPrevMonth, goToNextMonth, goToToday } =
        useCalendarGrid(selected ?? new Date());

    const today = new Date();

    // The "roving" focus target: only one day is tabbable; arrow keys move it.
    const [focusedDate, setFocusedDate] = useState<Date>(selected ?? today);
    const gridRef = useRef<HTMLDivElement>(null);
    const shouldFocus = useRef(false);

    // After a keyboard move, pull DOM focus to the newly focused day.
    useEffect(() => {
        if (!shouldFocus.current) return;
        shouldFocus.current = false;
        gridRef.current
            ?.querySelector<HTMLButtonElement>(`[data-day="${toDateValue(focusedDate)}"]`)
            ?.focus();
    }, [focusedDate]);

    const moveFocus = (next: Date) => {
        shouldFocus.current = true;
        setFocusedDate(next);
        // If we crossed into another month, bring it into view.
        if (next.getFullYear() !== year || next.getMonth() !== month) {
            setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const weekdayIndex = (focusedDate.getDay() + 6) % 7; // Monday-first
        switch (e.key) {
            case "ArrowLeft":  moveFocus(addDays(focusedDate, -1)); break;
            case "ArrowRight": moveFocus(addDays(focusedDate, 1)); break;
            case "ArrowUp":    moveFocus(addDays(focusedDate, -7)); break;
            case "ArrowDown":  moveFocus(addDays(focusedDate, 7)); break;
            case "Home":       moveFocus(addDays(focusedDate, -weekdayIndex)); break;
            case "End":        moveFocus(addDays(focusedDate, 6 - weekdayIndex)); break;
            case "PageUp":     moveFocus(new Date(year, month - 1, focusedDate.getDate())); break;
            case "PageDown":   moveFocus(new Date(year, month + 1, focusedDate.getDate())); break;
            default: return; // let other keys (Enter/Space/Tab) behave normally
        }
        e.preventDefault();
    };

    return (
        <div className="w-full">
            <header className="flex items-center justify-between mb-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold">
                        {viewDate.toLocaleString("en-US", { month: "long" })}
                    </span>
                    <span className="text-white/50">{year}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={goToPrevMonth} aria-label="Previous month"
                        className="p-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white cursor-pointer">
                        <ChevronLeft size={18} />
                    </button>
                    <button type="button" onClick={goToToday}
                        className="px-2 py-1 text-sm rounded-md text-white/70 hover:bg-white/10 hover:text-white cursor-pointer">
                        Today
                    </button>
                    <button type="button" onClick={goToNextMonth} aria-label="Next month"
                        className="p-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white cursor-pointer">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-white/40 py-1">
                        {d}
                    </div>
                ))}
            </div>

            <div ref={gridRef} role="grid" onKeyDown={onKeyDown} className="grid grid-cols-7 gap-1">
                {cells.map((cell, i) => {
                    if (!cell) return <div key={i} role="gridcell" />;

                    const disabled = isDisabled(cell, min, max);
                    const isSelected = selected ? isSameDay(cell, selected) : false;
                    const isToday = isSameDay(cell, today);
                    const isFocusTarget = isSameDay(cell, focusedDate);

                    return (
                        <button
                            type="button"
                            key={i}
                            role="gridcell"
                            data-day={toDateValue(cell)}
                            aria-label={cell.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                            aria-selected={isSelected}
                            aria-disabled={disabled}
                            tabIndex={isFocusTarget ? 0 : -1}
                            onClick={() => { if (!disabled) onSelect(cell); }}
                            className={`aspect-square rounded-md text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-(--vibranic) ${
                                disabled
                                    ? "text-white/20 cursor-not-allowed"
                                    : isSelected
                                        ? "bg-(--vibranic) text-white cursor-pointer"
                                        : isToday
                                            ? "text-(--vibranic) border border-(--vibranic)/40 hover:bg-white/10 cursor-pointer"
                                            : "text-white/80 hover:bg-white/10 cursor-pointer"
                            }`}
                        >
                            {cell.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
