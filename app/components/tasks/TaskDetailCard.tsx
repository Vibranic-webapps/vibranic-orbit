"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, Repeat, Heart, Check } from "lucide-react";
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
    task: Task | null;
    onClose: () => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
}

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
            {children}
        </span>
    );
}

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const update = () => setIsDesktop(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);
    return isDesktop;
}

export default function TaskDetailCard({ task, onClose, onEdit, onDelete }: Props) {
    const [mounted, setMounted] = useState(false);
    const isDesktop = useIsDesktop();

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        if (!task) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [task, onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {task && (
                <DetailSheet key="task-detail-sheet" task={task} isDesktop={isDesktop} onClose={onClose} onEdit={onEdit} onDelete={onDelete} />
            )}
        </AnimatePresence>,
        document.body,
    );
}

function DetailSheet({ task, isDesktop, onClose }: { task: Task; isDesktop: boolean } & Omit<Props, "task">) {
    const priority = priorityOptions.find(o => o.value === task.priority);
    const priColor = priority?.hex ?? "#7C6CFF";
    const recurrence = recurrenceLabel(task);
    const tone = TONE_HEX[taskBucket(task)] ?? TONE_HEX.upcoming;
    const start = fmtRange(task.startDateTime);
    const end = fmtRange(task.endDateTime);

    const slide = isDesktop
        ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
        : { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 backdrop-blur-sm lg:items-stretch lg:justify-end lg:bg-transparent lg:backdrop-blur-none"
        >
            <motion.div
                role="dialog"
                aria-label={`Details for ${task.name}`}
                onClick={(e) => e.stopPropagation()}
                initial={slide.initial}
                animate={slide.animate}
                exit={slide.exit}
                transition={{ type: "spring", damping: 32, stiffness: 320 }}
                className="w-full rounded-t-2xl border border-white/10 bg-[#0c0b1a]/95 backdrop-blur-xl p-5 pb-8 shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.7)]
                    lg:h-full lg:max-w-122.5 lg:rounded-none lg:border-0 lg:border-l lg:bg-white/5 lg:backdrop-blur-none lg:p-6 lg:pb-6 lg:shadow-none lg:overflow-y-auto"
            >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 lg:hidden" />

                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className={`text-lg font-semibold leading-snug text-white ${task.completed ? "line-through text-white/50" : ""}`}>
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
                        <button type="button" title="Close" onClick={onClose}
                            className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 cursor-pointer">
                            <X size={17} />
                        </button>
                    </div>
                </div>

                {task.description ? (
                    <p className="mt-3 max-h-40 overflow-y-auto text-sm text-white/70 whitespace-pre-wrap wrap-break-word">{task.description}</p>
                ) : null}

                <div className="mt-4">
                    <div className="text-sm font-medium" style={{ color: tone }}>
                        {relativeDue(task)}
                    </div>
                    {!task.frequency && end ? (
                        <div className="mt-2 flex gap-2.5 text-sm">
                            <div className="flex flex-col items-center self-stretch py-1">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-white/40" />
                                <span className="my-0.5 w-px flex-1"
                                    style={{ background: `linear-gradient(to bottom, rgba(255,255,255,0.25), ${tone})` }} />
                                <span className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ background: tone, boxShadow: `0 0 6px ${tone}` }} />
                            </div>
                            <div className="flex flex-col justify-between gap-1.5 py-0.5">
                                <span className="text-white/70">{start}</span>
                                <span style={{ color: tone }}>{end}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 flex items-center gap-2.5 text-sm">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-white/40" />
                            <span className="text-white/70">{start ?? "—"}</span>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
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
        </motion.div>
    );
}
