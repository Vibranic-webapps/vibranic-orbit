"use client"
import { Task } from "@/app/types"
import { useState } from "react"

export default function TodoView({ tasks, setTasks }: {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
    const [name, setName] = useState("")

    // a todo = a task with no scheduled start
    const todos = tasks.filter(t => t.startDateTime === null)

    async function addTodo() {
        if (!name.trim()) return
        const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),     // name only → dates default to null
        })
        if (!res.ok) return
        const newTask = await res.json()
        setTasks(prev => [...prev, newTask])
        setName("")
    }

    async function toggleComplete(task: Task) {
        const res = await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: !task.completed }),
        })
        if (!res.ok) return
        const updated = await res.json()
        setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    }

    async function deleteTodo(task: Task) {
        const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
        if (res.ok) setTasks(prev => prev.filter(t => t.id !== task.id))
    }

    return (
        <div className="max-w-md mx-auto p-4">
            <div className="flex gap-2">
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addTodo() }}
                    placeholder="What do you need to do?"
                    className="border p-2 rounded flex-1"
                />
                <button onClick={addTodo} className="border px-4 rounded">Add</button>
            </div>

            <ul className="mt-4 flex flex-col gap-1">
                {todos.map(todo => (
                    <li key={todo.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={todo.completed} onChange={() => toggleComplete(todo)} />
                        <span className={todo.completed ? "line-through opacity-50" : ""}>{todo.name}</span>
                        <button onClick={() => deleteTodo(todo)} className="ml-auto">🗑</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
