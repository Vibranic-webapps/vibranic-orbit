import Ring from "@/app/components/orbit/Ring"

export default function PlanetPage() {
    const tasks = [
        { id: "a", band: "inner", color: "#34D399" },
        { id: "b", band: "mid",   color: "#F59E0B" },
        { id: "c", band: "mid",   color: "#60A5FA" },
        { id: "d", band: "outer", color: "#F472B6" },
        { id: "e", band: "belt",  color: "#A78BFA" },
    ]
    return (
        <div className="grid place-items-center h-screen pb-40">
            <div className="w-[80vmin] h-[80vmin] grid place-items-center perspective-[70vmin]">
                <Ring band="crashing" tasks={tasks} offset={0} />
                <Ring band="inner"    tasks={tasks} offset={40} />
                <Ring band="mid"      tasks={tasks} offset={80} />
                <Ring band="outer"    tasks={tasks} offset={120} />
                <Ring band="belt"     tasks={tasks} offset={160} />

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