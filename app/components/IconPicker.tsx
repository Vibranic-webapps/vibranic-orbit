"use client";
import { useState } from "react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { Search } from "lucide-react";

const ALL_ICONS = iconNames as IconName[];
const LIMIT = 90;

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [query, setQuery] = useState("");
    const q = query.trim().toLowerCase();
    const matches = q ? ALL_ICONS.filter(n => n.includes(q)) : ALL_ICONS;
    const shown = matches.slice(0, LIMIT);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-2">
                <Search size={14} className="text-white/40 shrink-0" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search icons…"
                    className="w-full bg-transparent py-1.5 text-sm text-white/90 placeholder:text-white/40 focus:outline-none" />
            </div>

            <div className="scroll-space grid max-h-44 grid-cols-7 gap-1.5 overflow-y-auto pr-1">
                {shown.map(icon => (
                    <button key={icon} type="button" onClick={() => onChange(icon)} title={icon}
                        className={`grid aspect-square place-items-center rounded-md border cursor-pointer transition-colors ${
                            value === icon
                                ? "border-(--vibranic) bg-(--vibranic)/20 text-white"
                                : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white"
                        }`}>
                        <DynamicIcon name={icon} size={16} />
                    </button>
                ))}
                {shown.length === 0 && <p className="col-span-7 py-2 text-sm text-white/40">No icons found.</p>}
            </div>

            {matches.length > LIMIT && (
                <p className="text-xs text-white/30">Showing {LIMIT} of {matches.length} — refine your search.</p>
            )}
        </div>
    );
}
