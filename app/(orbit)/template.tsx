"use client"
import { motion, useReducedMotion } from "motion/react"

export default function Template({ children }: { children: React.ReactNode }) {
    const reduce = useReducedMotion()
    return (
        <>
            <motion.div
                className="min-h-screen"
                initial={reduce ? { opacity: 0 } : { scale: 1.25, opacity: 0, filter: "blur(8px)" }}
                animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                {children}
            </motion.div>

            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="fixed inset-0 bg-black pointer-events-none z-50"
            />
        </>
    )
}
