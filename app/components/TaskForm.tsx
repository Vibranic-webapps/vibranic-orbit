"use client";
import { Task, TaskFormValues, FormErrors, Category } from "@/app/types";
import { priorityOptions } from "@/app/constants"
import { DynamicIcon, type IconName } from "lucide-react/dynamic";

function Field({ label, htmlFor, error, children }: {
    label?: string; htmlFor?: string; error?: string; children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col w-full">
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
}

export default function TaskForm({ value, onChange, errors, categories, onSubmit, submitLabel, onCancel }: TaskFormProps) {
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

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="w-full flex justify-center mt-4">
            <div className="flex flex-col gap-4 w-max">
                <div className="flex flex-row gap-2 w-full">
                    <Field label="Name*" htmlFor="name" error={errors.name}>
                    <input id="name" type="text" placeholder="Task Name"
                            value={value.name}
                            onChange={(e) => onChange({ ...value, name: e.target.value })}
                            className="border p-2 rounded w-full" />
                    </Field>
                    <Field label="Description" htmlFor="description">
                        <input id="description" type="text" placeholder="description" 
                            value={value.description}
                            onChange={(e) => onChange({ ...value, description: e.target.value })}
                            className="border p-2 rounded w-full"
                        />
                    </Field>
                </div>
                <div className="flex flex-row gap-2 w-full">
                    <Field label="startDate*" htmlFor="startDateTime" error={errors.startDateTime}>
                        <input id="startDateTime" type="datetime-local" 
                            value={value.startDateTime}
                            onChange={(e) => onChange({ ...value, startDateTime: e.target.value })}
                            className="border p-2 rounded w-full"
                        />
                    </Field>
                    {!value.frequency && (
                        <Field label="endDate*" htmlFor="endDateTime" error={errors.endDateTime}>
                        <input id="endDateTime" type="datetime-local" 
                            value={value.endDateTime}
                            onChange={(e) => onChange({ ...value, endDateTime: e.target.value })}
                            className="border p-2 rounded w-full"
                        />
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
                <div className="flex gap-2 mt-2 flex-wrap">
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
                        className="border p-2 rounded w-full">
                    <option value="">Does not repeat</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                </select>
                </Field>
                {value.frequency === "WEEKLY" && (
                    <div className="flex flex-col w-full">
                        <div className="flex gap-1">
                        {weekdayOptions.map(d => (
                            <button type="button" key={d.value}
                                    onClick={() => toggleWeekday(d.value)}
                                    className={`px-2 py-1 rounded border ${
                                    value.byWeekday.includes(d.value) ? "bg-blue-500 text-white" : ""
                                    }`}>
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
                            className="border p-2 rounded w-full" />
                    </Field>
                )}
                {value.frequency && (
                    <Field label="Repeat until" htmlFor="recurrenceEnd" error={errors.recurrenceEnd}>
                        <input id="recurrenceEnd" type="date"
                            value={value.recurrenceEnd}
                            onChange={(e) => onChange({ ...value, recurrenceEnd: e.target.value })}
                            className="border p-2 rounded w-full" />
                    </Field>
                )}

                {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
                <button type="submit" className="bg-blue-500 py-1.5 w-full text-white rounded">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
