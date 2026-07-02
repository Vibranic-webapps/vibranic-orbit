"use client";
import { useState } from "react";
import { Plus, X, Trash, MoreVertical, GripVertical, Check } from "lucide-react";
import { toast } from "sonner";
import { Task, TodoState } from "@/app/types";
import { useTaskActions } from "@/app/hooks/useTaskActions";

const PALETTE = ["#7C6CFF", "#3b82f6", "#14b8a6", "#22c55e", "#f59e0b", "#f97316", "#ef4444", "#ec4899"];
const STARTERS = [
    { name: "To do", color: "#7C6CFF" },
    { name: "Doing", color: "#f59e0b" },
    { name: "Done", color: "#22c55e" },
];

interface Props {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    states: TodoState[];
    setStates: React.Dispatch<React.SetStateAction<TodoState[]>>;
    loading: boolean;
}

export default function TodoView({ tasks, setTasks, states, setStates, loading }: Props) {
    const { createTask, updateTask, deleteTask } = useTaskActions(setTasks);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [menuFor, setMenuFor] = useState<string | null>(null);
    const [editing, setEditing] = useState<string | null>(null);
    const [confirmDel, setConfirmDel] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    const todos = tasks.filter(t => t.startDateTime === null);
    const orphan = todos.filter(t => !t.stateId);
    const inState = (id: string) =>
        todos.filter(t => t.stateId === id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    async function createState(name: string, color: string, order: number) {
        const res = await fetch("/api/todo-states", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color, order }),
        });
        if (res.ok) { const created = await res.json(); setStates(prev => [...prev, created]); return; }
        toast.error("Failed to add column");
    }

    async function addStarters() {
        for (let i = 0; i < STARTERS.length; i++) await createState(STARTERS[i].name, STARTERS[i].color, i);
    }

    async function patchState(id: string, updates: Partial<TodoState>) {
        setStates(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
        const res = await fetch(`/api/todo-states/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        if (!res.ok) toast.error("Failed to update column");
    }

    async function removeState(id: string) {
        setConfirmDel(null);
        setStates(prev => prev.filter(s => s.id !== id));
        setTasks(prev => prev.map(t => (t.stateId === id ? { ...t, stateId: null, state: null } : t)));
        const res = await fetch(`/api/todo-states/${id}`, { method: "DELETE" });
        if (!res.ok) toast.error("Failed to delete column");
    }

    async function addTodo(stateId: string, name: string) {
        if (!name.trim()) return;
        await createTask({ name: name.trim(), stateId, order: inState(stateId).length });
    }

    function moveTodo(task: Task, stateId: string | null) {
        if (task.stateId === stateId) return;
        const target = states.find(s => s.id === stateId) ?? null;
        const order = stateId ? inState(stateId).length : 0;
        setTasks(prev => prev.map(t =>
            t.id === task.id
                ? { ...t, stateId, order, state: target ? { id: target.id, name: target.name, color: target.color } : null }
                : t));
        updateTask(task, { stateId, order });
    }

    if (loading) {
        return (
            <div className="flex gap-4 p-4 overflow-x-auto">
                {[0, 1, 2].map(i => (
                    <div key={i} className="w-[82vw] max-w-72 shrink-0 snap-start sm:w-72 rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="h-5 w-24 rounded bg-white/10 animate-pulse" />
                        <div className="mt-3 space-y-2">
                            {[0, 1].map(j => <div key={j} className="h-10 rounded-lg bg-white/5 animate-pulse" />)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (states.length === 0) {
        return (
            <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
                <h2 className="text-lg font-semibold text-white">Set up your board</h2>
                <p className="mt-1 text-sm text-white/50">
                    Organize todos into columns by status. Start with a classic set or build your own.
                </p>
                <button onClick={addStarters}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg border border-(--vibranic) bg-[color-mix(in_srgb,var(--vibranic)_18%,transparent)] px-4 py-2 text-sm text-white hover:bg-[color-mix(in_srgb,var(--vibranic)_30%,transparent)] cursor-pointer">
                    <Plus size={16} /> Add To do · Doing · Done
                </button>
                <div>
                    <button onClick={() => createState("New column", PALETTE[0], 0)}
                        className="mt-3 text-xs text-white/50 hover:text-white cursor-pointer">
                        or add a custom column
                    </button>
                </div>
            </div>
        );
    }

    const renderCard = (task: Task) => (
        <div
            key={task.id}
            draggable
            onDragStart={() => setDraggingId(task.id)}
            onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
            className={`group relative rounded-lg border border-white/10 bg-white/4 p-2.5 transition-colors hover:border-white/20 ${draggingId === task.id ? "opacity-40" : ""}`}
        >
            <div className="flex items-center gap-2">
                <GripVertical size={14} className="mt-0.5 shrink-0 cursor-grab text-white/25 active:cursor-grabbing" />
                <span className="min-w-0 flex-1 break-words text-sm text-white/85">{task.name}</span>

                <div className="relative shrink-0">
                    <button type="button" title="Move / delete"
                        onClick={() => setMenuFor(menuFor === `card:${task.id}` ? null : `card:${task.id}`)}
                        className="rounded p-0.5 text-white/40 opacity-100 transition-opacity hover:text-white sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer">
                        <MoreVertical size={15} />
                    </button>
                    {menuFor === `card:${task.id}` && (
                        <div className="absolute right-0 top-6 z-20 w-40 rounded-lg border border-white/10 bg-[#0c0b1a]/95 p-1 shadow-xl backdrop-blur-xl">
                            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/30">Move to</div>
                            {states.filter(s => s.id !== task.stateId).map(s => (
                                <button key={s.id} type="button"
                                    onClick={() => { moveTodo(task, s.id); setMenuFor(null); }}
                                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-white/80 hover:bg-white/10 cursor-pointer">
                                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.name}
                                </button>
                            ))}
                            <button type="button"
                                onClick={() => { deleteTask(task); setMenuFor(null); }}
                                className="mt-1 flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-red-400 hover:bg-red-500/15 cursor-pointer">
                                <Trash size={13} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderColumn = (state: TodoState) => {
        const items = inState(state.id);
        const isOver = dragOver === state.id;
        return (
            <div
                key={state.id}
                onDragOver={e => { e.preventDefault(); setDragOver(state.id); }}
                onDragLeave={() => setDragOver(prev => (prev === state.id ? null : prev))}
                onDrop={e => { e.preventDefault(); const t = todos.find(t => t.id === draggingId); if (t) moveTodo(t, state.id); setDragOver(null); }}
                className={`flex w-[82vw] max-w-72 shrink-0 snap-start sm:w-72 flex-col rounded-xl border bg-white/5 transition-colors ${isOver ? "border-(--vibranic) bg-[color-mix(in_srgb,var(--vibranic)_10%,transparent)]" : "border-white/10"}`}
            >
                {/* header */}
                <div className="flex items-center gap-2 border-b border-white/10 p-3">
                    {confirmDel === state.id ? (
                        <div className="flex w-full items-center justify-between gap-2">
                            <span className="text-sm text-white/70">Delete column?</span>
                            <div className="flex gap-1">
                                <button onClick={() => setConfirmDel(null)} className="rounded px-2 py-0.5 text-xs text-white/60 hover:text-white cursor-pointer">Cancel</button>
                                <button onClick={() => removeState(state.id)} className="rounded bg-red-500/80 px-2 py-0.5 text-xs text-white hover:bg-red-500 cursor-pointer">Delete</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: state.color, boxShadow: `0 0 6px ${state.color}` }} />
                            {editing === state.id ? (
                                <input autoFocus defaultValue={state.name}
                                    onBlur={e => { patchState(state.id, { name: e.target.value || state.name }); setEditing(null); }}
                                    onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(null); }}
                                    className="min-w-0 flex-1 rounded bg-white/10 px-1.5 py-0.5 text-sm text-white outline-none ring-1 ring-(--vibranic)" />
                            ) : (
                                <button onClick={() => setEditing(state.id)} className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-white hover:text-white/80 cursor-text">
                                    {state.name}
                                </button>
                            )}
                            <span className="shrink-0 text-xs text-white/35">{items.length}</span>
                            <div className="relative shrink-0">
                                <button onClick={() => setMenuFor(menuFor === `col:${state.id}` ? null : `col:${state.id}`)}
                                    className="rounded p-0.5 text-white/40 hover:text-white cursor-pointer">
                                    <MoreVertical size={15} />
                                </button>
                                {menuFor === `col:${state.id}` && (
                                    <div className="absolute right-0 top-6 z-20 w-44 rounded-lg border border-white/10 bg-[#0c0b1a]/95 p-2 shadow-xl backdrop-blur-xl">
                                        <div className="mb-1 flex flex-wrap gap-1.5">
                                            {PALETTE.map(c => (
                                                <button key={c} title={c} onClick={() => { patchState(state.id, { color: c }); }}
                                                    className="h-5 w-5 rounded-full ring-offset-1 ring-offset-[#0c0b1a] hover:ring-2 hover:ring-white/60 cursor-pointer"
                                                    style={{ background: c }}>
                                                    {state.color === c && <Check size={12} className="mx-auto text-black/70" />}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => { setEditing(state.id); setMenuFor(null); }}
                                            className="w-full rounded px-2 py-1 text-left text-sm text-white/80 hover:bg-white/10 cursor-pointer">Rename</button>
                                        <button onClick={() => { setConfirmDel(state.id); setMenuFor(null); }}
                                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-red-400 hover:bg-red-500/15 cursor-pointer">
                                            <Trash size={13} /> Delete column
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-2">
                    {items.length === 0 && (
                        <div className="rounded-lg border border-dashed border-white/10 py-4 text-center text-xs text-white/25">Drop here</div>
                    )}
                    {items.map(renderCard)}
                </div>

                <AddTodo onAdd={name => addTodo(state.id, name)} />
            </div>
        );
    };

    return (
        <>
            {menuFor && <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />}

            <div className="flex items-start gap-4 overflow-x-auto p-4 snap-x snap-mandatory scroll-p-4">
                {orphan.length > 0 && (
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver("unassigned"); }}
                        onDrop={e => { e.preventDefault(); const t = todos.find(t => t.id === draggingId); if (t) moveTodo(t, null); setDragOver(null); }}
                        className={`flex w-[82vw] max-w-72 shrink-0 snap-start sm:w-72 flex-col rounded-xl border bg-white/5 ${dragOver === "unassigned" ? "border-(--vibranic)" : "border-white/10"}`}>
                        <div className="flex items-center gap-2 border-b border-white/10 p-3">
                            <span className="h-3 w-3 rounded-full bg-white/30" />
                            <span className="flex-1 text-sm font-semibold text-white/70">Unassigned</span>
                            <span className="text-xs text-white/35">{orphan.length}</span>
                        </div>
                        <div className="flex flex-col gap-2 p-2">{orphan.map(renderCard)}</div>
                    </div>
                )}

                {[...states].sort((a, b) => a.order - b.order).map(renderColumn)}

                <div className="w-[82vw] max-w-72 shrink-0 snap-start sm:w-72">
                    {adding ? (
                        <AddColumn
                            onAdd={name => { if (name.trim()) createState(name.trim(), PALETTE[states.length % PALETTE.length], states.length); setAdding(false); }}
                            onCancel={() => setAdding(false)}
                        />
                    ) : (
                        <button onClick={() => setAdding(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm text-white/50 hover:border-white/30 hover:text-white cursor-pointer">
                            <Plus size={16} /> Add column
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

function AddTodo({ onAdd }: { onAdd: (name: string) => void }) {
    const [name, setName] = useState("");
    return (
        <div className="border-t border-white/10 p-2">
            <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { onAdd(name); setName(""); } }}
                placeholder="+ Add a todo"
                className="w-full rounded-lg bg-white/5 px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:bg-white/10"
            />
        </div>
    );
}

function AddColumn({ onAdd, onCancel }: { onAdd: (name: string) => void; onCancel: () => void }) {
    const [name, setName] = useState("");
    return (
        <div className="rounded-xl border border-white/15 bg-white/5 p-2">
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") onAdd(name); if (e.key === "Escape") onCancel(); }}
                placeholder="Column name"
                className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 outline-none" />
            <div className="mt-2 flex gap-1">
                <button onClick={() => onAdd(name)} className="flex-1 rounded-lg bg-[color-mix(in_srgb,var(--vibranic)_25%,transparent)] py-1 text-sm text-white hover:bg-[color-mix(in_srgb,var(--vibranic)_40%,transparent)] cursor-pointer">Add</button>
                <button onClick={onCancel} className="rounded-lg px-2 text-white/50 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
        </div>
    );
}
