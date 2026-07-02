"use client"
import { useAnimate } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export default function AscentShell({ children }: { children: React.ReactNode }) {
    const [scope] = useAnimate()
    const tintRef = useRef(null)
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true))
        return () => cancelAnimationFrame(id)
    }, [])
    useEffect(() => { router.prefetch("/") }, [router])

    return (
        <>
            <div ref={scope}>{children}</div>
            {mounted && createPortal(
                <div ref={tintRef} className="fixed inset-0 bg-black opacity-0 pointer-events-none z-60" />,
                document.body,
            )}
        </>
    )
}
