"use client";

import { useEffect, useRef, useState } from "react";
import { useTasks } from "@/app/hooks/useTasks";
import Ring from "@/app/components/orbit/Ring"
import { useAnimate, useReducedMotion, motion } from "motion/react";
import { useRouter } from "next/navigation"
import { PlanetBody, Task } from "@/app/types";
import { DynamicIcon, type IconName } from "lucide-react/dynamic"
import { ChevronDown, ArrowUpRight, Circle, MousePointer2, HelpCircle, Target, X } from "lucide-react"

export default function PlanetView() {
    const { tasks } = useTasks()
    const [scope, animate] = useAnimate()
    const router = useRouter()
    const tintRef = useRef<HTMLDivElement>(null)
    const reduce = useReducedMotion()

    const [hovered, setHovered] = useState<PlanetBody | null>(null)
    const [ballPoint, setBallPoint] = useState<{ x: number; y: number } | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const hoveredEl = useRef<HTMLElement | null>(null)
    const [showIntro, setShowIntro] = useState(false)
    const [now, setNow] = useState(0)

    useEffect(() => {
        const update = () => setNow(Date.now())
        const raf = requestAnimationFrame(update)
        const id = setInterval(update, 60_000)
        return () => { cancelAnimationFrame(raf); clearInterval(id) }
    }, [])
    const [showLegend, setShowLegend] = useState(true)

    useEffect(() => {
        if (localStorage.getItem("orbit-legend-hidden")) {
            const id = requestAnimationFrame(() => setShowLegend(false))
            return () => cancelAnimationFrame(id)
        }
    }, [])

    function hideLegend() {
        localStorage.setItem("orbit-legend-hidden", "1")
        setShowLegend(false)
    }
    function revealLegend() {
        localStorage.removeItem("orbit-legend-hidden")
        setShowLegend(true)
    }


    useEffect(() => {
        if (!localStorage.getItem("orbit-intro-seen")) {
            const id = requestAnimationFrame(() => setShowIntro(true))
            return () => cancelAnimationFrame(id)
        }
    }, [])

    function dismissIntro() {
        localStorage.setItem("orbit-intro-seen", "1")
        setShowIntro(false)
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const PRIORITY_BAND = {
        EXTRA_SMALL: "belt",
        SMALL: "outer",
        MEDIUM: "mid",
        LARGE: "inner",
        EXTRA_LARGE: "crashing",
    } as const

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
            animate(scope.current, { scale: 4, y: 250, filter: "blur(12px)", opacity: 0 }, { duration: 0.45, ease: "easeIn" })
        }
        await animate(tintRef.current, { opacity: 1 }, { duration: reduce ? 0.2 : 0.45, ease: "easeIn" })
        router.push("/tasks")
    }
    
    const bodies = tasks
    .filter((t): t is Task & { endDateTime: string } => {
        if (t.completed || t.endDateTime === null ) return false

        const midnight = new Date(t.endDateTime);
        midnight.setHours(0, 0, 0, 0);
        return midnight.getTime() === startOfToday.getTime()

    })
    .map((t): PlanetBody => {
        const seed = t.id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

        const hoursLeft = (new Date(t.endDateTime).getTime() - now) / 3_600_000
        const overdue = hoursLeft <= 0
        const urgency = overdue ? 0 : Math.max(0, Math.min(1, 1 - hoursLeft / 6))

        return {
            id: t.id,
            band: PRIORITY_BAND[t.priority],
            color: t.category?.color ?? "#7C6CFF",
            priority: t.priority,
            size: 3.5 + (seed % 3),
            icon: t.category?.icon ?? null,
            name: t.name,
            description: t.description ?? null,
            due: t.endDateTime,
            category: t.category?.name ?? null,
            urgency,
            overdue,
        }
        })

    useEffect(() => { router.prefetch("/tasks") }, [router])

    useEffect(() => {
        if (!hovered) return
        let raf: number
        const tick = () => {
            const el = hoveredEl.current
            const panel = panelRef.current
            if (el && panel) {
                const r = el.getBoundingClientRect()
                const cx = r.left + r.width / 2
                const cy = r.top + r.height / 2
                const ex = (r.width / 2) * 0.7
                const ey = (r.height / 2) * 0.7

                const margin = 12
                const w = panel.offsetWidth
                let left = cx + ex + 8
                if (left + w > window.innerWidth - margin) {
                    left = cx - ex - 8 - w
                }
                panel.style.left = `${left}px`
                panel.style.top  = `${cy - ey - 45}px`
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [hovered])

    return (
        <div className="grid place-items-center h-screen pb-40">
            {showLegend && (
                <div className="fixed bottom-16 right-4 z-40 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 select-none">
                    <button
                        onClick={hideLegend}
                        aria-label="Hide priority legend"
                        className="absolute top-1 right-1 grid place-items-center h-5 w-5 rounded-full
                                text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={12} />
                    </button>
                    <svg width="60" height="46" viewBox="0 0 60 46" className="shrink-0">
                        <defs>
                            <radialGradient id="miniPlanet" cx="38%" cy="35%" r="65%">
                                <stop offset="0%" stopColor="#C9C0FF" />
                                <stop offset="45%" stopColor="#7C6CFF" />
                                <stop offset="100%" stopColor="#3B327A" />
                            </radialGradient>
                            <filter id="miniGlow" x="-80%" y="-80%" width="260%" height="260%">
                                <feGaussianBlur stdDeviation="2.2" />
                            </filter>
                        </defs>

                        <ellipse cx="30" cy="23" rx="26" ry="14"  fill="none" stroke="white" strokeOpacity="0.12" />
                        <ellipse cx="30" cy="23" rx="16" ry="8.5" fill="none" stroke="white" strokeOpacity="0.22" />

                        <circle cx="50" cy="31" r="2"   fill="white"   fillOpacity="0.4" />
                        <circle cx="38" cy="16" r="2.5" fill="#A99BFF" />

                        <circle cx="30" cy="23" r="6" fill="#7C6CFF" filter="url(#miniGlow)" opacity="0.85" />
                        <circle cx="30" cy="23" r="5" fill="url(#miniPlanet)" />
                    </svg>
                    <div className="text-[11px] leading-tight">
                        <div className="font-medium text-white/80">Priority</div>
                        <div className="text-white/45">inner = urgent · outer = minor</div>
                    </div>
                </div>
            )}
            {!showLegend && (
                <button
                    onClick={revealLegend}
                    aria-label="Show priority legend"
                    className="fixed bottom-16 right-4 z-40 grid place-items-center h-9 w-9 rounded-full
                            border border-white/15 bg-white/5 backdrop-blur-md
                            text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <Target size={16} />
                </button>
            )}
            <button
                onClick={() => setShowIntro(true)}
                aria-label="How it works"
                className="fixed bottom-4 right-4 z-40 grid place-items-center h-9 w-9 rounded-full
                        border border-white/15 bg-white/5 backdrop-blur-md
                        text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
                <HelpCircle size={18} />
            </button>

            {showIntro && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-60 grid place-items-center bg-black/60 backdrop-blur-sm p-6"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-6 text-white shadow-2xl"
                    >
                        <h2 className="text-xl font-semibold text-center">Welcome to Vibranic-Orbit</h2>
                        <p className="mt-1 text-sm text-white/60 text-center">Here&apos;s how it works</p>

                        <ul className="mt-4 space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <Circle size={18} className="mt-0.5 shrink-0 text-white/70" />
                                <span>Each <span className="font-medium">orbiting body</span> is a task due today.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <MousePointer2 size={18} className="mt-0.5 shrink-0 text-white/70" />
                                <span><span className="font-medium">Hover</span> a task to preview it, <span className="font-medium">click</span> to open it.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ChevronDown size={18} className="mt-0.5 shrink-0 text-white/70" />
                                <span><span className="font-medium">Click the planet</span> to dive into all your tasks.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Target size={18} className="mt-0.5 shrink-0 text-white/70" />
                                <span>The <span className="font-medium">Closer a task orbits</span>, the higher its priority. Small ones drift to the outer belt.</span>
                            </li>
                        </ul>

                        <button
                            onClick={dismissIntro}
                            className="mt-6 w-full rounded-lg border border-white/15 bg-white/10 hover:bg-white/15 py-2 text-sm font-medium transition-colors"
                        >
                            Got it
                        </button>
                    </motion.div>
                </motion.div>
            )}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none select-none">
                <h1 className="text-white/90 text-lg font-semibold tracking-wide">
                    {new Date().toLocaleDateString('en-GB', { weekday: "long", month: "long", day: "numeric" })}
                </h1>

                <p className="text-white/50 text-sm">
                    {bodies.length > 0
                        ? `${bodies.length} ${bodies.length === 1 ? "task" : "tasks"} in orbit · hover to preview`
                        : "Nothing in orbit today"}
                </p>
            </div>
            {hovered && ballPoint && (
                <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{
                        left: ballPoint.x,
                        top: ballPoint.y,
                        background: `linear-gradient(160deg, ${hovered.color}2e 0%, transparent 70%), rgba(255,255,255,0.04)`,
                    }}
                    className="fixed z-50 pointer-events-none -translate-y-1/2 max-w-62.5 wrap-break-words
                            rounded-xl border border-white/15 backdrop-blur-md
                            px-3 py-2 text-white"
                >
                    <span
                        className="absolute top-2 right-2 grid place-items-center h-7.5 w-7.5 rounded-full shrink-0"
                        style={{
                            background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${hovered.color} 85%, white) 0%, ${hovered.color} 45%, color-mix(in srgb, ${hovered.color}, black 45%) 100%)`,
                            boxShadow: `0 0 6px ${hovered.color}`,
                        }}
                    >
                        {hovered.icon && (
                            <DynamicIcon
                                name={hovered.icon as IconName}
                                size={14.5}
                                style={{ color: `color-mix(in srgb, ${hovered.color}, black 55%)` }}
                            />
                        )}
                    </span>
                    <div className="pr-9 text-sm font-semibold leading-tight">{hovered.name}</div>
                    {hovered.description && (
                        <div className="mt-0.5 pr-9 text-xs text-white/70">
                            {hovered.description.length > 105
                                ? hovered.description.slice(0, 105).trimEnd() + "…"
                                : hovered.description}
                        </div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                        <span className={`flex items-center gap-1 ${hovered.overdue ? "text-red-400" : "text-white/70"}`}>
                            {hovered.overdue ? "Overdue" : "Due"} {new Date(hovered.due).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>

                        <span className="flex items-center gap-1 text-white/45">
                            Open <ArrowUpRight size={12} />
                        </span>
                    </div>
                </motion.div>
            )}

            <div ref={tintRef} className="fixed inset-0 bg-black opacity-0 pointer-events-none z-50" />
            <div ref={scope} className="w-[80vmin] h-[80vmin] grid place-items-center perspective-[70vmin]">
                <Ring band="crashing" tasks={bodies} offset={0} paused={!!hovered} onHover={handleHover} onLeave={handleLeave} onClick={() => descend()} />
                <Ring band="inner" tasks={bodies} offset={40} paused={!!hovered} onHover={handleHover} onLeave={handleLeave} onClick={() => descend()} />
                <Ring band="mid" tasks={bodies} offset={80} paused={!!hovered} onHover={handleHover} onLeave={handleLeave} onClick={() => descend()} />
                <Ring band="outer" tasks={bodies} offset={120} paused={!!hovered} onHover={handleHover} onLeave={handleLeave} onClick={() => descend()} />
                <Ring band="belt" tasks={bodies} offset={160} paused={!!hovered} onHover={handleHover} onLeave={handleLeave} onClick={() => descend()} />
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
                >
                </div>
                <ChevronDown
                    size={22}
                    className="[grid-area:1/1] translate-y-[-7vmin] animate-bounce text-white/70 pointer-events-none select-none"
                />
            </div>
        </div>
    )
}
