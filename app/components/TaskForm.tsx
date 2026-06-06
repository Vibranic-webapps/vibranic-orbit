"use client";
import { Task, TaskFormValues, FormErrors, Category } from "@/app/types";
import { priorityOptions } from "@/app/constants"

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
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="w-full flex justify-center">
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
                <select id="category" value={value.categoryId}
                        onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
                        className="border p-2 rounded w-full">
                    <option value="">Select Category</option>
                    {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                </Field>
                <Field label="Priority" htmlFor="priority">
                <select id="priority" value={value.priority}
                        onChange={(e) => onChange({ ...value, priority: e.target.value as Task["priority"] })}
                        className="border p-2 rounded w-full">
                    {priorityOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
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
