"use client"
import { useAnimate, useReducedMotion } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export default function AscentShell({ children }: { children: React.ReactNode }) {
    const [scope, animate] = useAnimate()
    const tintRef = useRef(null)
    const router = useRouter()
    const reduce = useReducedMotion()
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])
    useEffect(() => { router.prefetch("/") }, [router])

    async function ascend() {
        if (!reduce) {
            animate(scope.current, { 
                scale: 0.4, 
                y: 30, filter: "blur(12px)", 
                opacity: 0 
            }, { duration: 0.45, ease: "easeIn" })
        }
        await animate(tintRef.current, { opacity: 1 }, { duration: reduce ? 0.2 : 0.45, ease: "easeIn" })
        router.push("/")
    }

    return (
        <>
            <button
                onClick={ascend}
                title="Back to Orbit"
                aria-label="Back to Orbit"
                className="group fixed top-4 left-[max(1rem,calc((100vw_-_90rem)/2_+_1rem))] z-50 flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-1.5 pl-2 pr-4 text-white backdrop-blur-md transition-all cursor-pointer
                    hover:border-(--vibranic) hover:bg-[color-mix(in_srgb,var(--vibranic)_15%,transparent)] hover:shadow-[0_0_20px_-4px_var(--vibranic)]"
            >
                {/* mini orbit: ringed planet with a circling satellite */}
                <span className="relative grid h-8 w-8 place-items-center">
                    <span className="absolute inset-0.5 rounded-full border"
                        style={{ borderColor: "color-mix(in srgb, var(--vibranic) 45%, transparent)" }} />
                    <span className="h-2.5 w-2.5 rounded-full"
                        style={{ background: "var(--vibranic)", boxShadow: "0 0 8px var(--vibranic)" }} />
                    <span className={`absolute inset-0.5 ${reduce ? "" : "animate-[spin_6s_linear_infinite]"}`}>
                        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_white]" />
                    </span>
                </span>
                <span className="text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                    Orbit
                </span>
            </button>
            <div ref={scope}>{children}</div>
            {mounted && createPortal(
                <div ref={tintRef} className="fixed inset-0 bg-black opacity-0 pointer-events-none z-[60]" />,
                document.body,
            )}
        </>
    )
}
