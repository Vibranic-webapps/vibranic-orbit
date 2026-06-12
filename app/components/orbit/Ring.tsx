import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { PlanetBody } from "@/app/types";

const BAND_SIZE = { crashing: 40, inner: 55, mid: 70, outer: 85, belt: 100 }
const BAND_DURATION = { crashing: 50, inner: 70, mid: 110, outer: 170, belt: 240 }
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
            className="[grid-area:1/1] pointer-events-none relative rounded-full border border-white/10 transform-3d transform-[rotateX(40deg)]"
            style={{ width: `${size}%`, height: `${size}%` }}
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
                            className="absolute rounded-full pointer-events-auto bg-[radial-gradient(circle_at_35%_35%,color-mix(in_srgb,var(--c)_85%,white)_0%,var(--c)_45%,color-mix(in_srgb,var(--c),black_45%)_100%)] shadow-[0_0_12px_var(--c),0_0_24px_color-mix(in_srgb,var(--c)_50%,transparent)] transform-[translate(-50%,-50%)]"
                            style={{
                                width: `${task.size}vmin`,
                                height: `${task.size}vmin`,
                                top: `${top}%`, left: `${left}%`,
                                ["--c" as string]: task.color
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
