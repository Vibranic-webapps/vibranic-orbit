"use client";
import { useTasks } from "@/app/hooks/useTasks";
import Ring from "@/app/components/orbit/Ring"

export default function PlanetView() {
    const { tasks } = useTasks()

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

    return (
        <div className="grid place-items-center h-screen pb-40">
            <div className="w-[80vmin] h-[80vmin] grid place-items-center perspective-[70vmin]">
                <Ring band="crashing" tasks={bodies} offset={0} />
                <Ring band="inner" tasks={bodies} offset={40} />
                <Ring band="mid" tasks={bodies} offset={80} />
                <Ring band="outer" tasks={bodies} offset={120} />
                <Ring band="belt" tasks={bodies} offset={160} />

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