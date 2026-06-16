import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { PlanetBody } from "@/app/types";

const BAND_SIZE = { crashing: 40, inner: 55, mid: 70, outer: 85, belt: 100 }
const BAND_DURATION = { crashing: 50, inner: 70, mid: 110, outer: 170, belt: 240 }
const BAND_COLOR = { crashing: "#ef4444", inner: "#f97316", mid: "#8b5cf6", outer: "#3b82f6", belt: "#14b8a6" }
const BAND_GLOW = { crashing: 0.22, inner: 0.19, mid: 0.16, outer: 0.13, belt: 0.10 }
const SPEED_EASE = 3

export default function Ring({ band, tasks, offset, paused = false, onHover, onLeave, onClick }: {
    band: keyof typeof BAND_SIZE;
    tasks: PlanetBody[];
    offset: number;
    paused?: boolean;
    onHover: (task: PlanetBody, el: HTMLElement) => void;
    onLeave: () => void;
    onClick: (task: PlanetBody) => void;
}) {
    const size = BAND_SIZE[band]
    const ringTasks = tasks.filter((t) => t.band === band)
    const reduce = useReducedMotion()

    const spinnerRef = useRef<HTMLDivElement>(null)
    const angleRef = useRef(0)
    const speedRef = useRef(0)
    const pausedRef = useRef(paused)
    useEffect(() => { pausedRef.current = paused }, [paused])

    useEffect(() => {
        if (reduce) return
        const nominal = 360 / BAND_DURATION[band]
        let raf = 0
        let last = performance.now()
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            const target = pausedRef.current ? 0 : nominal
            speedRef.current += (target - speedRef.current) * (1 - Math.exp(-SPEED_EASE * dt))
            angleRef.current = (angleRef.current + speedRef.current * dt) % 360
            const el = spinnerRef.current
            if (el) el.style.transform = `rotateZ(${angleRef.current}deg)`
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [band, reduce])

    return (
        <div
            className={`[grid-area:1/1] pointer-events-none relative rounded-full border transform-3d transform-[rotateX(40deg)]`}
            style={{ 
                width: `${size}%`, height: `${size}%`, 
                borderColor: `color-mix(in srgb, ${BAND_COLOR[band]} ${BAND_GLOW[band] * 100}%, transparent)`,
                boxShadow: `0 0 16px -6px color-mix(in srgb, ${BAND_COLOR[band]} ${BAND_GLOW[band] * 70}%, transparent)`
            }}
        >
            <div ref={spinnerRef} className="orbit-spinner absolute inset-0 transform-3d">
                {ringTasks.map((task, index) => {
                    const angle = (index / ringTasks.length) * 360 + offset
                    const rad = angle * (Math.PI / 180)
                    const left = 50 + 50 * Math.cos(rad)
                    const top = 50 + 50 * Math.sin(rad)
                    return (
                        <div
                            key={task.id}
                            onClick={() => onClick(task)}
                            className="
                                absolute
                                rounded-full
                                pointer-events-auto
                                cursor-pointer
                                bg-[radial-gradient(circle_at_35%_35%,color-mix(in_srgb,var(--c)_85%,white)_0%,var(--c)_45%,color-mix(in_srgb,var(--c),black_45%)_100%)] 
                                shadow-[0_0_12px_var(--c),0_0_24px_color-mix(in_srgb,var(--c)_50%,transparent)] transform-[translate(-50%,-50%)]
                            "
                            style={{
                                width: `${task.size}vmin`,
                                height: `${task.size}vmin`,
                                top: `${top}%`, left: `${left}%`,
                                ["--c" as string]: task.color,
                                opacity: task.overdue ? 0.5 : 1,
                                filter: task.overdue ? "saturate(0.35) brightness(0.85)" : undefined,
                                animation: (!reduce && !task.overdue && task.urgency > 0.1)
                                    ? `urgency-pulse ${(2.4 - task.urgency * 1.6).toFixed(2)}s ease-in-out infinite`
                                    : undefined,
                            } as React.CSSProperties}
                            onMouseEnter={(e) => onHover(task, e.currentTarget)}
                            onMouseLeave={onLeave}
                        />
                    )
                })}
            </div>
        </div>
    )
}
