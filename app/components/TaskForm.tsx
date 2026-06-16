"use client";
import { useState, useEffect } from "react";
import { Task, TaskFormValues, FormErrors, Category } from "@/app/types";
import { priorityOptions } from "@/app/constants"
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { CalendarClock, CalendarDays } from "lucide-react";
import DateTimePicker from "./DateTimePicker";
import { parseValue } from "@/app/lib/calendar";

type PickField = "startDateTime" | "endDateTime" | "recurrenceEnd";

/** Title for the picker sub-view, shown by the parent's header. */
export const fieldLabel = (p: PickField) =>
    p === "startDateTime" ? "start date & time"
    : p === "endDateTime" ? "end date & time"
    : "repeat-until date";

/** What a parent (e.g. the modal) needs to render chrome for the picker sub-view. */
export interface SubView {
    title: string;
    onBack: () => void;
}

const displayValue = (s: string, withTime: boolean): string => {
    const d = parseValue(s);
    if (!d) return "";
    return withTime
        ? d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

function Field({ label, htmlFor, error, children, className }: {
    label?: string; htmlFor?: string; error?: string; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={`flex flex-col ${className ?? ""}`}>
            {label && <label htmlFor={htmlFor}>{label}</label>}
            {children}
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
}

interface TaskFormProps {
    value: TaskFormValues;
    onChange: React.Dispatch<React.SetStateAction<TaskFormValues>>;
    errors: FormErrors;
    categories: Category[];
    onSubmit: () => void;
    submitLabel: string;
    onCancel?: () => void;
    onSubViewChange?: (sub: SubView | null) => void;
}

export default function TaskForm({ value, onChange, errors, categories, onSubmit, submitLabel, onCancel, onSubViewChange }: TaskFormProps) {
    const [picking, setPicking] = useState<null | PickField>(null)

    // Tell the parent when we enter/leave the picker sub-view, so it can adapt its header.
    useEffect(() => {
        if (!onSubViewChange) return;
        onSubViewChange(picking ? { title: `Select ${fieldLabel(picking)}`, onBack: () => setPicking(null) } : null);
        return () => onSubViewChange(null);
    }, [picking, onSubViewChange]);

    const weekdayOptions = [
        { label: "Mon", value: 1 },
        { label: "Tue", value: 2 },
        { label: "Wed", value: 3 },
        { label: "Thu", value: 4 },
        { label: "Fri", value: 5 },
        { label: "Sat", value: 6 },
        { label: "Sun", value: 0 },
    ];

    const toggleWeekday = (day: number) => {
        onChange({
            ...value,
            byWeekday: value.byWeekday.includes(day)
            ? value.byWeekday.filter(d => d !== day)
            : [...value.byWeekday, day],
        });
    };

    if (picking) {
        const isDateOnly = picking === "recurrenceEnd";

        const today = new Date();
        const start = parseValue(value.startDateTime);
        const min = picking === "startDateTime"
            ? today
            : (start && start > today ? start : today);

        return (
            <DateTimePicker
                key={picking}
                mode={isDateOnly ? "date" : "datetime"}
                value={value[picking]}
                min={min}
                showBack={!onSubViewChange}
                onCancel={() => setPicking(null)}
                onConfirm={(v) => { onChange({ ...value, [picking]: v }); setPicking(null); }}
                onClear={() => { onChange({ ...value, [picking]: "" }); setPicking(null); }}
            />
        );
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <div className="flex flex-col gap-4 w-full">
                <Field label="Name*" htmlFor="name" error={errors.name}>
                    <div className="flex gap-2 mt-2 flex-wrap">
                        <input id="name" type="text" placeholder="Task Name"
                            value={value.name}
                            onChange={(e) => onChange({ ...value, name: e.target.value })}
                            className="border p-2 rounded w-full border-white/10 bg-white/5 text-white/90 placeholder:text-white/40 focus:outline-none focus:border-(--vibranic)" />
                    </div>
                </Field>
                <Field label="Description" htmlFor="description">
                    <div className="flex gap-2 mt-2 flex-wrap">
                        <textarea id="description" placeholder="description" 
                            value={value.description}
                            onChange={(e) => onChange({ ...value, description: e.target.value })}
                            className="border p-2 rounded w-full border-white/10 bg-white/5 text-white/90 placeholder:text-white/40 focus:outline-none focus:border-(--vibranic)"
                        />
                    </div>
                </Field>
                <div className="flex flex-row gap-4 w-full">
                    <Field label="startDate*" htmlFor="startDateTime" error={errors.startDateTime} className="flex-1 min-w-0">
                        <button id="startDateTime" type="button" onClick={() => setPicking("startDateTime")}
                            className="border p-2 rounded w-full flex-1 min-w-0 flex items-center gap-2 text-left border-white/10 bg-white/5 hover:border-white/25 focus:outline-none focus:border-(--vibranic) cursor-pointer"
                        >
                            <CalendarClock size={16} className="text-white/50 shrink-0" />
                            {value.startDateTime
                                ? <span className="text-white/90 truncate">{displayValue(value.startDateTime, true)}</span>
                                : <span className="text-white/40">Select date &amp; time</span>}
                        </button>
                    </Field>
                    {!value.frequency && (
                        <Field label="endDate*" htmlFor="endDateTime" error={errors.endDateTime} className="flex-1 min-w-0">
                        <button id="endDateTime" type="button" onClick={() => setPicking("endDateTime")}
                            className="border p-2 rounded w-full flex-1 min-w-0 flex items-center gap-2 text-left border-white/10 bg-white/5 hover:border-white/25 focus:outline-none focus:border-(--vibranic) cursor-pointer"
                        >
                            <CalendarClock size={16} className="text-white/50 shrink-0" />
                            {value.endDateTime
                                ? <span className="text-white/90 truncate">{displayValue(value.endDateTime, true)}</span>
                                : <span className="text-white/40">Select date &amp; time</span>}
                        </button>
                        </Field>
                    )}
                </div>
                <Field label="Category" htmlFor="category">
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {categories.map(c => (
                            <button 
                                key={c.id} 
                                type="button"
                                onClick={() => onChange({ ...value, categoryId: value.categoryId === c.id ? "" : c.id })}
                                className={`px-3.75 py-2 rounded-md border text-sm font-medium transition-colors cursor-pointer ${value.categoryId === c.id ? "text-white" : "border-white/10 text-white/50 bg-white/5 hover:text-white hover:border-white/25"}`}
                                style={value.categoryId === c.id ? {
                                    background: `color-mix(in srgb, ${c.color} 20%, transparent)`,
                                    borderColor: c.color,
                                    boxShadow: `0 0 12px -2px ${c.color}`,
                                } : undefined}
                            >
                                <DynamicIcon color={`${value.categoryId === c.id ? "#ffffff" : c.color}`} name={c.icon as IconName} size={24} />
                            </button>
                        ))}
                        {categories.length === 0 && (
                            <p className="text-sm text-white/40">No categories yet — add one in the Categories tab.</p>
                        )}
                    </div>
                </Field>
                <Field label="Priority" htmlFor="priority">
                <div className="flex flex-1 gap-3 mt-2 flex-wrap">
                    {priorityOptions.map((o) => (
                        <button 
                            className={`px-3.75 py-2 rounded-md border text-sm font-medium transition-colors cursor-pointer ${value.priority === o.value ? "text-white" : "border-white/10 text-white/50 bg-white/5 hover:text-white hover:border-white/25"}`}
                            style={value.priority === o.value ? {
                                background: `color-mix(in srgb, ${o.hex} 20%, transparent)`,
                                borderColor: o.hex,
                                boxShadow: `0 0 12px -2px ${o.hex}`,
                            } : undefined}

                            onClick={() => onChange({ ...value, priority: o.value as Task["priority"] })} 
                            type="button" 
                            key={o.value}
                        >
                            
                            {o.label}
                        </button>
                    ))}
                </div>
                </Field>
                <Field label="Frequency" htmlFor="frequency">
                <select id="frequency" value={value.frequency}
                        onChange={(e) => onChange({ ...value, frequency: e.target.value })}
                        className="border p-2 rounded w-full border-white/10 bg-white/5">
                    <option value="">Does not repeat</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                </select>
                </Field>
                {value.frequency === "WEEKLY" && (
                    <div className="flex flex-col">
                        <div className="flex gap-1">
                        {weekdayOptions.map(d => (
                            <button 
                                type="button" key={d.value}
                                onClick={() => toggleWeekday(d.value)}
                                className={`px-2 py-1 rounded border ${
                                    value.byWeekday.includes(d.value) ? "bg-(--vibranic) text-white" : ""
                                }`}
                            >
                                {d.label}
                            </button>
                        ))}
                        </div>
                        {errors.byWeekday && <p className="text-red-500 text-sm">{errors.byWeekday}</p>}
                    </div>
                )}
                {value.frequency && (
                    <Field label="Repeat every" htmlFor="interval" error={errors.interval}>
                        <input id="interval" type="number" min={1}
                            value={value.interval}
                            onChange={(e) => onChange({ ...value, interval: Number(e.target.value) })}
                            className="border p-2 rounded w-full border-white/10 bg-white/5 text-white/90 placeholder:text-white/40 focus:outline-none focus:border-(--vibranic)" />
                    </Field>
                )}
                {value.frequency && (
                    <Field label="Repeat until" htmlFor="recurrenceEnd" error={errors.recurrenceEnd}>
                        <button id="recurrenceEnd" type="button" onClick={() => setPicking("recurrenceEnd")}
                            className="border p-2 rounded w-full flex items-center gap-2 text-left border-white/10 bg-white/5 hover:border-white/25 focus:outline-none focus:border-(--vibranic) cursor-pointer"
                        >
                            <CalendarDays size={16} className="text-white/50 shrink-0" />
                            {value.recurrenceEnd
                                ? <span className="text-white/90 truncate">{displayValue(value.recurrenceEnd, false)}</span>
                                : <span className="text-white/40">Select date</span>}
                        </button>
                    </Field>
                )}

                {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
                <button type="submit" className="bg-(--vibranic) py-1.5 w-full text-white rounded">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
