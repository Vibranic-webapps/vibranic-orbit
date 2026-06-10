"use client";

import { useEffect, useRef, useState } from "react";
import { useTasks } from "@/app/hooks/useTasks";
import Ring from "@/app/components/orbit/Ring"
import { useAnimate, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation"
import { PlanetBody, Task } from "@/app/types";

export default function PlanetView() {
    const { tasks } = useTasks()
    const [scope, animate] = useAnimate()
    const router = useRouter()
    const tintRef = useRef<HTMLDivElement>(null)
    const reduce = useReducedMotion()

    const [hovered, setHovered] = useState<PlanetBody | null>(null)
    const [ballPoint, setBallPoint] = useState<{ x: number; y: number } | null>(null)
    const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const hoveredEl = useRef<HTMLElement | null>(null)
    const lineRef = useRef<SVGLineElement>(null)


    function handleHover(task: PlanetBody, el: HTMLElement) {
        setHovered(task)
        hoveredEl.current = el
        const r = el.getBoundingClientRect()
        setBallPoint({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    }
    function handleLeave() {
        setHovered(null)
        hoveredEl.current = null
    }

    async function descend() {
        if (!reduce) {
            animate(scope.current, { scale: 4, y: 30, filter: "blur(12px)", opacity: 0 }, { duration: 0.45, ease: "easeIn" })
        }
        await animate(tintRef.current, { opacity: 1 }, { duration: reduce ? 0.2 : 0.45, ease: "easeIn" })
        router.push("/tasks")
    }



    function orbitBand(endDateTime: string): "crashing" | "inner" | "mid" | "outer" | "belt" {
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        const end = new Date(endDateTime)
        end.setHours(0, 0, 0, 0)
        const days = Math.round((end.getTime() - startOfToday.getTime()) / 86_400_000)
        if (days < 0) return "crashing"
        if (days === 0) return "inner"
        if (days <= 7) return "mid"
        if (days <= 31) return "outer"
        return "belt"
    }

    const bodies = tasks
        .filter((t): t is Task & { endDateTime: string } => !t.completed && t.endDateTime !== null)
        .map((t): PlanetBody => ({
            id: t.id,
            band: orbitBand(t.endDateTime),
            color: t.category?.color ?? "#7C6CFF",
            priority: t.priority,
            name: t.name,
            description: t.description ?? null,
            due: t.endDateTime,
            category: t.category?.name ?? null
        }))

    useEffect(() => { router.prefetch("/tasks") }, [router])

    useEffect(() => {
        if (hovered && panelRef.current) {
            const r = panelRef.current.getBoundingClientRect()
            setAnchor({ x: r.left, y: r.top + r.height / 2 })
        }
    }, [hovered])

    useEffect(() => {
        if (!hovered) return
        let raf: number
        const tick = () => {
            const el = hoveredEl.current
            const line = lineRef.current
            if (el && line) {
                const r = el.getBoundingClientRect()
                line.setAttribute("x1", String(r.left + r.width / 2))
                line.setAttribute("y1", String(r.top + r.height / 2))
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [hovered])

    return (
        <div className="grid place-items-center h-screen pb-40">
            {hovered && (
                <div ref={panelRef} className="fixed top-4 right-4 z-50 w-64 pointer-events-none bg-black/80 text-white text-sm p-3 rounded-lg border border-white/10 backdrop-blur">
                    <div className="font-semibold">{hovered.name}</div>
                    {hovered.description && <div className="font-medium">{hovered.description}</div>}
                    <div className="opacity-70">Due {new Date(hovered.due).toLocaleDateString()}</div>
                    <div className="opacity-70">Priority: {hovered.priority}</div>
                    {hovered.category && <div className="opacity-70">{hovered.category}</div>}
                </div>
            )}

            {hovered && ballPoint && anchor && (
                <svg className="fixed inset-0 z-40 pointer-events-none w-full h-full">
                    <line ref={lineRef}
                    x1={ballPoint.x} y1={ballPoint.y}
                    x2={anchor.x - 140} y2={anchor.y}
                    stroke="white" strokeWidth={1} strokeOpacity={0.5} />

                    <line
                    x1={anchor.x - 140} y1={anchor.y}
                    x2={anchor.x} y2={anchor.y}
                    stroke="white" strokeWidth={1} strokeOpacity={0.5} />
                </svg>
            )}

            <div ref={tintRef} className="fixed inset-0 bg-black opacity-0 pointer-events-none z-50" />
            <div ref={scope} className="w-[80vmin] h-[80vmin] grid place-items-center perspective-[70vmin]">
                <Ring band="crashing" tasks={bodies} offset={0} onHover={handleHover} onLeave={handleLeave} onClick={() => descend()} />
                <Ring band="inner" tasks={bodies} offset={40} onHover={handleHover} onLeave={handleLeave} onClick={() => descend()} />
                <Ring band="mid" tasks={bodies} offset={80} onHover={handleHover} onLeave={handleLeave} onClick={() => descend()} />
                <Ring band="outer" tasks={bodies} offset={120} onHover={handleHover} onLeave={handleLeave} onClick={() => descend()} />
                <Ring band="belt" tasks={bodies} offset={160} onHover={handleHover} onLeave={handleLeave} onClick={() => descend()} />
                <div 
                    onClick={() => descend()}
                    className="
                        w-[15%] h-[15%] 
                        rounded-full
                        cursor-pointer
                        [grid-area:1/1]
                        bg-[radial-gradient(circle_at_35%_35%,#A99BFF_0%,#7C6CFF_45%,rgba(124,108,255,0.15)_100%)] 
                        shadow-[0_0_40px_rgba(124,108,255,0.7),0_0_80px_rgba(124,108,255,0.45),0_0_140px_rgba(124,108,255,0.25)] 
                    "
                ></div>
            </div>
        </div>
    )
}
