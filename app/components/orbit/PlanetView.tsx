"use client";

import { useEffect } from "react";
import { useTasks } from "@/app/hooks/useTasks";
import Ring from "@/app/components/orbit/Ring"
import { useAnimate, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation"
import { useRef } from "react"

export default function PlanetView() {
    const { tasks } = useTasks()
    const [scope, animate] = useAnimate()
    const router = useRouter()
    const tintRef = useRef(null)
    const reduce = useReducedMotion()

    async function descend() {
        if (!reduce) {
            animate(scope.current, { 
                scale: 4, 
                y: 30, 
                filter: "blur(12px)", 
                opacity: 0 
            }, { duration: 0.45, ease: "easeIn" })
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

        if (days < 0)   return "crashing"
        if (days === 0) return "inner"
        if (days <= 7)  return "mid"
        if (days <= 31) return "outer"
        return "belt"
    }

    const bodies = tasks
        .filter((t) => !t.completed)
        .map((t) => ({
            id: t.id,
            band: orbitBand(t.endDateTime),
            color: t.category?.color ?? "#7C6CFF",
            priority: t.priority,
    }))

    useEffect(() => { router.prefetch("/tasks") }, [router])

    return (
        <div className="grid place-items-center h-screen pb-40">
            <div ref={tintRef} className="fixed inset-0 bg-black opacity-0 pointer-events-none z-50" />
            <div ref={scope} className="w-[80vmin] h-[80vmin] grid place-items-center perspective-[70vmin]">
                <Ring band="crashing" tasks={bodies} offset={0} />
                <Ring band="inner" tasks={bodies} offset={40} />
                <Ring band="mid" tasks={bodies} offset={80} />
                <Ring band="outer" tasks={bodies} offset={120} />
                <Ring band="belt" tasks={bodies} offset={160} />
                <button onClick={descend} className="absolute top-4 left-4 z-50 text-white">Descend</button>
                <div className="
                    w-[14%] h-[14%] 
                    rounded-full 
                    bg-[radial-gradient(circle_at_35%_35%,#A99BFF_0%,#7C6CFF_45%,rgba(124,108,255,0.15)_100%)] 
                    shadow-[0_0_40px_rgba(124,108,255,0.7),0_0_80px_rgba(124,108,255,0.45),0_0_140px_rgba(124,108,255,0.25)]
                    [grid-area:1/1]
                "></div>
            </div>
        </div>
    )
}