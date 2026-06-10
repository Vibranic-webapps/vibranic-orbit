"use client"
import { useAnimate, useReducedMotion } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

export default function AscentShell({ children }: { children: React.ReactNode }) {
    const [scope, animate] = useAnimate()
    const tintRef = useRef(null)
    const router = useRouter()
    const reduce = useReducedMotion()

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
            <button onClick={ascend} className="fixed top-4 left-4 z-50 text-white">↑ Orbit</button>
            <div ref={scope}>{children}</div>
            <div ref={tintRef} className="fixed inset-0 bg-black opacity-0 pointer-events-none z-50" />
        </>
    )
}
