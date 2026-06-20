"use client";
import { useState, useEffect } from "react";
import { Task, TaskFormValues, FormErrors, Category } from "@/app/types";
import { priorityOptions } from "@/app/constants";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { CalendarClock, CalendarDays, Tag, Flag, Repeat, ChevronRight, Check, Plus, Trash2 } from "lucide-react";
import { IconPicker } from "@/components/IconPicker";
import ColorPicker from "./ColorPicker";
import DateTimePicker from "./DateTimePicker";
import { useCategoryActions } from "@/app/hooks/useCategoryActions";
import { parseValue } from "@/app/lib/calendar";

type PickField = "startDateTime" | "endDateTime" | "recurrenceEnd";
type Sheet = "category" | "priority" | "repeat";

export const fieldLabel = (p: PickField) =>
    p === "startDateTime" ? "start date & time"
    : p === "endDateTime" ? "end date & time"
    : "repeat-until date";

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

function PropertyRow({ icon: Icon, label, value, placeholder, onClick, error, danger }: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string; value?: React.ReactNode; placeholder: string; onClick: () => void; error?: string; danger?: boolean;
}) {
    return (
        <div>
            <button type="button" onClick={onClick}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 cursor-pointer">
                <Icon size={16} className="shrink-0 text-white/40" />
                <span className="text-sm text-white/70">{label}</span>
                <span className="ml-auto flex min-w-0 items-center gap-1.5">
                    {value
                        ? <span className="flex min-w-0 items-center gap-1.5 truncate text-sm text-white/90">{value}</span>
                        : <span className={`text-sm ${danger ? "text-red-400/70" : "text-white/30"}`}>{placeholder}</span>}
                    <ChevronRight size={15} className="shrink-0 text-white/30" />
                </span>
            </button>
            {error && <p className="px-3 pb-1.5 text-xs text-red-500">{error}</p>}
        </div>
    );
}

interface TaskFormProps {
    value: TaskFormValues;
    onChange: React.Dispatch<React.SetStateAction<TaskFormValues>>;
    errors: FormErrors;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    onSubmit: () => void;
    submitLabel: string;
    onCancel?: () => void;
    onSubViewChange?: (sub: SubView | null) => void;
}

const PRESET_COLORS = ["#7C6CFF", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#a855f7"];

const weekdayOptions = [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
    { label: "Sun", value: 0 },
];

export default function TaskForm({ value, onChange, errors, categories, setCategories, setTasks, onSubmit, submitLabel, onCancel, onSubViewChange }: TaskFormProps) {
    const [picking, setPicking] = useState<PickField | null>(null);
    const [sheet, setSheet] = useState<Sheet | null>(null);

    const { createCategory, deleteCategory } = useCategoryActions(setCategories);
    const [creatingCat, setCreatingCat] = useState(false);
    const [newCat, setNewCat] = useState({ name: "", color: PRESET_COLORS[0], icon: "" });
    const [catError, setCatError] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleDeleteCategory = async (id: string) => {
        const ok = await deleteCategory(id);
        if (ok) {
            setTasks(prev => prev.map(t =>
                t.category?.id === id ? { ...t, categoryId: null, category: null, categoryRemoved: true } : t));
            if (value.categoryId === id) onChange({ ...value, categoryId: "" });
        }
    };

    const handleCreateCategory = async () => {
        if (!newCat.name.trim()) { setCatError("Name is required."); return; }
        if (!newCat.icon) { setCatError("Pick an icon."); return; }
        const created = await createCategory({ name: newCat.name.trim(), color: newCat.color, icon: newCat.icon });
        if (created) {
            onChange({ ...value, categoryId: created.id });
            setNewCat({ name: "", color: PRESET_COLORS[0], icon: "" });
            setCreatingCat(false);
            setCatError(null);
            setSheet(null);
        }
    };

    useEffect(() => {
        if (!onSubViewChange) return;
        let sub: SubView | null = null;
        if (picking) sub = { title: `Select ${fieldLabel(picking)}`, onBack: () => setPicking(null) };
        else if (sheet === "category") sub = { title: "Category", onBack: () => setSheet(null) };
        else if (sheet === "priority") sub = { title: "Priority", onBack: () => setSheet(null) };
        else if (sheet === "repeat") sub = { title: "Repeat", onBack: () => setSheet(null) };
        onSubViewChange(sub);
        return () => onSubViewChange(null);
    }, [picking, sheet, onSubViewChange]);

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
        const min = picking === "startDateTime" ? today : (start && start > today ? start : today);

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

    if (sheet === "category") {
        return (
            <div className="flex flex-col gap-1 mt-2">
                <button type="button" onClick={() => { onChange({ ...value, categoryId: "" }); setSheet(null); }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/5 cursor-pointer">
                    <span className="grid h-6 w-6 place-items-center rounded-md border border-white/15 text-xs text-white/40">—</span>
                    <span className="text-sm text-white/80">None</span>
                    {!value.categoryId && <Check size={16} className="ml-auto text-(--vibranic)" />}
                </button>
                {categories.map(c => (
                    confirmDeleteId === c.id ? (
                        <div key={c.id} className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5">
                            <span className="flex-1 truncate text-sm text-white/80">Delete &ldquo;{c.name}&rdquo;?</span>
                            <button type="button" onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-white/60 hover:text-white cursor-pointer">Cancel</button>
                            <button type="button" onClick={() => { handleDeleteCategory(c.id); setConfirmDeleteId(null); }}
                                className="text-xs font-medium text-red-400 hover:text-red-300 cursor-pointer">Delete</button>
                        </div>
                    ) : (
                        <div key={c.id} className="group flex items-center rounded-lg hover:bg-white/5">
                            <button type="button" onClick={() => { onChange({ ...value, categoryId: c.id }); setSheet(null); }}
                                className="flex flex-1 items-center gap-3 px-3 py-2.5 text-left cursor-pointer">
                                <span className="grid h-6 w-6 place-items-center rounded-md"
                                    style={{ background: `color-mix(in srgb, ${c.color} 25%, transparent)` }}>
                                    <DynamicIcon name={c.icon as IconName} size={14} color={c.color} />
                                </span>
                                <span className="text-sm text-white/80">{c.name}</span>
                                {value.categoryId === c.id && <Check size={16} className="text-(--vibranic)" />}
                            </button>
                            <button type="button" title="Delete category" onClick={() => setConfirmDeleteId(c.id)}
                                className="px-3 py-2.5 text-white/30 hover:text-red-400 cursor-pointer">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )
                ))}

                {creatingCat ? (
                    <div className="mt-2 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                        <input autoFocus placeholder="Category name"
                            value={newCat.name}
                            onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/90 placeholder:text-white/40 focus:outline-none focus:border-(--vibranic)" />
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-white/50">Color</span>
                            <ColorPicker value={newCat.color} onChange={(col) => setNewCat({ ...newCat, color: col })} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-white/50">Icon</span>
                            <IconPicker value={newCat.icon} onChange={(icon) => setNewCat({ ...newCat, icon })} />
                        </div>
                        {catError && <p className="text-red-500 text-sm">{catError}</p>}
                        <div className="flex gap-2">
                            <button type="button" onClick={() => { setCreatingCat(false); setCatError(null); }}
                                className="flex-1 rounded border border-white/10 py-1.5 text-sm text-white/70 hover:text-white hover:border-white/25 cursor-pointer">
                                Cancel
                            </button>
                            <button type="button" onClick={handleCreateCategory}
                                className="flex-1 rounded bg-(--vibranic) py-1.5 text-sm font-medium text-white hover:brightness-110 cursor-pointer">
                                Create
                            </button>
                        </div>
                    </div>
                ) : (
                    <button type="button" onClick={() => setCreatingCat(true)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-(--vibranic) hover:bg-white/5 cursor-pointer">
                        <span className="grid h-6 w-6 place-items-center rounded-md border border-(--vibranic)/40">
                            <Plus size={14} />
                        </span>
                        <span className="text-sm font-medium">New category</span>
                    </button>
                )}
            </div>
        );
    }

    if (sheet === "priority") {
        return (
            <div className="flex flex-col gap-1 mt-2">
                {priorityOptions.map(o => (
                    <button key={o.value} type="button"
                        onClick={() => { onChange({ ...value, priority: o.value as Task["priority"] }); setSheet(null); }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/5 cursor-pointer">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: o.hex }} />
                        <span className="text-sm text-white/80">{o.label}</span>
                        {value.priority === o.value && <Check size={16} className="ml-auto text-(--vibranic)" />}
                    </button>
                ))}
            </div>
        );
    }

    if (sheet === "repeat") {
        return (
            <div className="flex flex-col gap-5 mt-2">
                <div className="flex flex-col gap-2">
                    <span className="text-sm text-white/60">Frequency</span>
                    <div className="grid grid-cols-4 gap-1.5">
                        {([["", "Never"], ["DAILY", "Daily"], ["WEEKLY", "Weekly"], ["MONTHLY", "Monthly"]] as const).map(([val, label]) => {
                            const active = value.frequency === val;
                            return (
                                <button key={val} type="button" onClick={() => onChange({ ...value, frequency: val })}
                                    className={`rounded-lg border py-1.5 text-sm cursor-pointer transition-colors ${active
                                        ? "bg-(--vibranic) border-(--vibranic) text-white"
                                        : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"}`}>
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {value.frequency === "WEEKLY" && (
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-white/60">On these days</span>
                        <div className="flex flex-wrap gap-1.5">
                            {weekdayOptions.map(d => {
                                const active = value.byWeekday.includes(d.value);
                                return (
                                    <button type="button" key={d.value} onClick={() => toggleWeekday(d.value)}
                                        className={`grid h-9 w-9 place-items-center rounded-full border text-xs cursor-pointer transition-colors ${active
                                            ? "bg-(--vibranic) border-(--vibranic) text-white"
                                            : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"}`}>
                                        {d.label[0]}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.byWeekday && <p className="text-red-500 text-sm">{errors.byWeekday}</p>}
                    </div>
                )}

                {value.frequency && (
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-white/60">Repeat every</span>
                        <div className="flex items-center gap-3">
                            <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/5">
                                <button type="button" onClick={() => onChange({ ...value, interval: Math.max(1, value.interval - 1) })}
                                    className="px-3 py-1.5 text-lg leading-none text-white/60 hover:text-white cursor-pointer">−</button>
                                <span className="w-10 text-center text-white/90 tabular-nums">{value.interval}</span>
                                <button type="button" onClick={() => onChange({ ...value, interval: value.interval + 1 })}
                                    className="px-3 py-1.5 text-lg leading-none text-white/60 hover:text-white cursor-pointer">+</button>
                            </div>
                            <span className="text-sm text-white/60">
                                {value.frequency === "DAILY" ? "day" : value.frequency === "WEEKLY" ? "week" : "month"}{value.interval > 1 ? "s" : ""}
                            </span>
                        </div>
                        {errors.interval && <p className="text-red-500 text-sm">{errors.interval}</p>}
                    </div>
                )}

                {value.frequency && (
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-white/60">Repeat until</span>
                        <button type="button" onClick={() => setPicking("recurrenceEnd")}
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left hover:border-white/25 cursor-pointer">
                            <CalendarDays size={16} className="text-white/50 shrink-0" />
                            {value.recurrenceEnd
                                ? <span className="text-white/90 truncate">{displayValue(value.recurrenceEnd, false)}</span>
                                : <span className="text-white/40">No end date</span>}
                        </button>
                        {errors.recurrenceEnd && <p className="text-red-500 text-sm">{errors.recurrenceEnd}</p>}
                    </div>
                )}

                <button type="button" onClick={() => setSheet(null)}
                    className="mt-1 w-full rounded-lg bg-(--vibranic) py-2 font-medium text-white hover:brightness-110 cursor-pointer">
                    Done
                </button>
            </div>
        );
    }

    const selectedCat = categories.find(c => c.id === value.categoryId);
    const selectedPriority = priorityOptions.find(o => o.value === value.priority);
    const repeatSummary = (() => {
        if (!value.frequency) return "";
        const unit = value.frequency === "DAILY" ? "day" : value.frequency === "WEEKLY" ? "week" : "month";
        if (value.interval > 1) return `Every ${value.interval} ${unit}s`;
        return value.frequency.charAt(0) + value.frequency.slice(1).toLowerCase();
    })();

    const categoryValue = selectedCat ? (
        <>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded"
                style={{ background: `color-mix(in srgb, ${selectedCat.color} 25%, transparent)` }}>
                <DynamicIcon name={selectedCat.icon as IconName} size={12} color={selectedCat.color} />
            </span>
            <span className="truncate">{selectedCat.name}</span>
        </>
    ) : undefined;

    const priorityValue = selectedPriority ? (
        <span className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: `color-mix(in srgb, ${selectedPriority.hex} 22%, transparent)`, color: selectedPriority.hex }}>
            {selectedPriority.label}
        </span>
    ) : undefined;

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="mt-2 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <div className="rounded-lg border border-white/10 bg-white/5 transition-colors focus-within:border-(--vibranic)/60">
                    <input id="name" type="text" placeholder="Task name"
                        value={value.name}
                        onChange={(e) => onChange({ ...value, name: e.target.value })}
                        className="w-full bg-transparent px-3 pt-2.5 pb-2 text-lg font-semibold text-white placeholder:text-white/30 focus:outline-none" />
                    <div className="h-px bg-white/10" />
                    <textarea id="description" placeholder="Add description…" rows={2}
                        value={value.description}
                        onChange={(e) => onChange({ ...value, description: e.target.value })}
                        className="w-full resize-none bg-transparent px-3 py-2 text-sm text-white/70 placeholder:text-white/30 focus:outline-none" />
                </div>
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="flex flex-col divide-y divide-white/5 overflow-hidden rounded-lg border border-white/10">
                <PropertyRow icon={CalendarClock} label="Starts" placeholder="Select date & time"
                    value={displayValue(value.startDateTime, true)} error={errors.startDateTime}
                    onClick={() => setPicking("startDateTime")} />
                {!value.frequency && (
                    <PropertyRow icon={CalendarClock} label="Ends" placeholder="Select date & time"
                        value={displayValue(value.endDateTime, true)} error={errors.endDateTime}
                        onClick={() => setPicking("endDateTime")} />
                )}
                <PropertyRow icon={Tag} label="Category" placeholder="None"
                    value={categoryValue} onClick={() => setSheet("category")} />
                <PropertyRow icon={Flag} label="Priority" placeholder="Medium"
                    value={priorityValue} onClick={() => setSheet("priority")} />
                <PropertyRow icon={Repeat} label="Repeat" placeholder="Never"
                    value={repeatSummary}
                    error={errors.interval || errors.byWeekday || errors.recurrenceEnd}
                    onClick={() => setSheet("repeat")} />
            </div>

            <div className="flex gap-2">
                {onCancel && (
                    <button type="button" onClick={onCancel}
                        className="flex-1 rounded-lg border border-white/10 py-2 text-white/70 hover:text-white hover:border-white/25 cursor-pointer">
                        Cancel
                    </button>
                )}
                <button type="submit"
                    className="flex-1 rounded-lg bg-(--vibranic) py-2 font-medium text-white hover:brightness-110 cursor-pointer">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
