"use client";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X, Pencil, Trash, Repeat, Heart, Check } from "lucide-react";
import { Task } from "@/app/types";
import { priorityOptions } from "@/app/constants";
import { recurrenceLabel, relativeDue, taskBucket } from "@/app/lib/tasks";

const fmtRange = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })
        : null;

const TONE_HEX: Record<string, string> = {
    overdue: "#ef4444",
    today: "#f59e0b",
    completed: "#22c55e",
    upcoming: "#7C6CFF",
};

interface Props {
    task: Task;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
            {children}
        </span>
    );
}

export default function TaskDetailCard({ task, onClose, onEdit, onDelete }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const priority = priorityOptions.find(o => o.value === task.priority);
    const priColor = priority?.hex ?? "#7C6CFF";
    const recurrence = recurrenceLabel(task);
    const tone = TONE_HEX[taskBucket(task)] ?? TONE_HEX.upcoming;
    const start = fmtRange(task.startDateTime);
    const end = fmtRange(task.endDateTime);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        window.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onDown);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onDown);
        };
    }, [onClose]);

    return (
        <motion.div
            ref={ref}
            role="dialog"
            aria-label={`Details for ${task.name}`}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-12 top-full w-67.5 max-w-[calc(100%-3.5rem)] z-30 mt-1 origin-top rounded-xl border border-white/10 bg-[#0c0b1a]/95 backdrop-blur-xl p-4 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)]"
        >
            <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <h3 className={`text-base font-semibold leading-snug text-white ${task.completed ? "line-through text-white/50" : ""}`}>
                        {task.name}
                    </h3>
                    {(task.completed || task.favorite) && (
                        <div className="mt-1 flex items-center gap-2">
                            {task.completed && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-400">
                                    <Check size={12} strokeWidth={3} /> Done
                                </span>
                            )}
                            {task.favorite && (
                                <Heart size={13} className="fill-red-500 text-red-500" />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button type="button" title="Edit" onClick={onEdit}
                        className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 cursor-pointer">
                        <Pencil size={16} />
                    </button>
                    <button type="button" title="Delete" onClick={onDelete}
                        className="p-1 rounded-md text-white/60 hover:text-red-400 hover:bg-red-500/15 cursor-pointer">
                        <Trash size={16} />
                    </button>
                    <button type="button" title="Close" onClick={onClose}
                        className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {task.description ? (
                <p className="mt-2.5 max-h-40 overflow-y-auto text-sm text-white/70 whitespace-pre-wrap break-words">{task.description}</p>
            ) : null}

            <div
                className="flex items-start gap-3 rounded-lg mt-3"
                
            >
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: tone }}>
                        {relativeDue(task)}
                    </div>
                    {!task.frequency && end ? (
                        <div className="mt-2 flex gap-2.5 text-xs">
                            <div className="flex flex-col items-center self-stretch py-1">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-white/40" />
                                <span className="my-0.5 w-px flex-1"
                                    style={{ background: `linear-gradient(to bottom, rgba(255,255,255,0.25), ${tone})` }} />
                                <span className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ background: tone, boxShadow: `0 0 6px ${tone}` }} />
                            </div>
                            <div className="flex flex-col justify-between gap-1.5 py-0.5">
                                <span className="text-white/70 truncate">{start}</span>
                                <span className="truncate" style={{ color: tone }}>{end}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 flex items-center gap-2.5 text-xs">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-white/40" />
                            <span className="text-white/70 truncate">{start ?? "—"}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                <Pill>
                    <span style={{ color: priColor }}>{priority?.label ?? task.priority}</span>
                </Pill>

                {task.category && (
                    <Pill>
                        <span className="h-2.5 w-2.5 rounded-full"
                            style={{ background: task.category.color, boxShadow: `0 0 6px ${task.category.color}` }} />
                        {task.category.name}
                    </Pill>
                )}

                {recurrence && (
                    <Pill>
                        <Repeat size={12} className="text-white/50" />
                        {recurrence}
                    </Pill>
                )}
            </div>
        </motion.div>
    );
}
