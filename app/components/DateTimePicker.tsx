"use client";
import { useState } from "react";
import { ChevronLeft, CalendarClock, CalendarDays, Clock } from "lucide-react";
import Calendar from "./Calendar";
import WheelColumn from "./WheelColumn";
import { parseValue, toDateValue, toDateTimeValue, isSameDay } from "@/app/lib/calendar";

interface DateTimePickerProps {
    mode: "date" | "datetime";
    value: string;
    min?: Date | null;
    showBack?: boolean;
    onCancel: () => void;
    onConfirm: (value: string) => void;
    onClear?: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function DateTimePicker({ mode, value, min, showBack = true, onCancel, onConfirm, onClear }: DateTimePickerProps) {
    const [draft, setDraft] = useState<Date | null>(parseValue(value));

    const minMinute = mode === "datetime" && min
        ? new Date(min.getFullYear(), min.getMonth(), min.getDate(), min.getHours(), min.getMinutes())
        : null;

    const clamp = (d: Date) => (minMinute && d.getTime() < minMinute.getTime() ? new Date(minMinute) : d);

    const onMinDay = !!(minMinute && draft && isSameDay(draft, minMinute));
    const hourDisabled = (h: number) => onMinDay && h < minMinute!.getHours();
    const minuteDisabled = (m: number) =>
        onMinDay && draft!.getHours() === minMinute!.getHours() && m < minMinute!.getMinutes();

    const handleDay = (day: Date) => {
        const base = draft ?? new Date();
        setDraft(clamp(new Date(
            day.getFullYear(), day.getMonth(), day.getDate(),
            mode === "datetime" ? base.getHours() : 0,
            mode === "datetime" ? base.getMinutes() : 0,
        )));
    };

    const setTime = (hours: number, minutes: number) => {
        const base = draft ?? new Date();
        setDraft(clamp(new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes)));
    };

    const confirm = () => {
        if (!draft) return;
        onConfirm(mode === "datetime" ? toDateTimeValue(draft) : toDateValue(draft));
    };

    const preview = draft
        ? (mode === "datetime"
            ? draft.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : draft.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }))
        : (mode === "datetime" ? "Pick a date & time" : "Pick a date");

    return (
        <div className="mt-4 w-full">
            {showBack && (
                <button type="button" onClick={onCancel}
                    className="flex items-center gap-1 text-white/70 hover:text-white mb-4 cursor-pointer">
                    <ChevronLeft size={18} /> Back
                </button>
            )}

            <div className="flex items-center gap-2 mb-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                {mode === "datetime"
                    ? <CalendarClock size={18} className="text-(--vibranic) shrink-0" />
                    : <CalendarDays size={18} className="text-(--vibranic) shrink-0" />}
                <span className={`text-sm ${draft ? "text-white/90" : "text-white/40"}`}>{preview}</span>
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <Calendar selected={draft} onSelect={handleDay} min={min} />
                </div>

                {mode === "datetime" && (
                    <div className="flex flex-col">
                        <div className="flex items-center mt-1 justify-center gap-1 text-white text-sm mb-5.25">
                            <Clock size={14} /> <span>Time</span>
                        </div>
                        <div className="flex items-start justify-center gap-2">
                            <WheelColumn ariaLabel="Hours" label="Hour" values={HOURS}
                                value={draft ? draft.getHours() : 0}
                                isDisabled={hourDisabled}
                                onChange={(h) => setTime(h, draft ? draft.getMinutes() : 0)} />
                            <span className="text-white/40 text-lg mt-24.5">:</span>
                            <WheelColumn ariaLabel="Minutes" label="Min" values={MINUTES}
                                value={draft ? draft.getMinutes() : 0}
                                isDisabled={minuteDisabled}
                                onChange={(m) => setTime(draft ? draft.getHours() : 0, m)} />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-6">
                {onClear && value && (
                    <button type="button" onClick={onClear}
                        className="py-1.5 px-3 rounded border border-white/10 text-white/50 hover:text-red-400 hover:border-red-400/40 cursor-pointer">
                        Clear
                    </button>
                )}
                <button type="button" onClick={onCancel}
                    className="flex-1 py-1.5 rounded border border-white/10 text-white/70 hover:text-white hover:border-white/25 cursor-pointer">
                    Cancel
                </button>
                <button type="button" onClick={confirm} disabled={!draft}
                    className="flex-1 py-1.5 rounded bg-(--vibranic) text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    Confirm
                </button>
            </div>
        </div>
    );
}
