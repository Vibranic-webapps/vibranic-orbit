export default function PlanetPage() {
    return (
        <div className="grid place-items-center h-screen">
            <div className="w-[80vmin] h-[80vmin] grid place-items-center perspective-[70vmin]">
                <div className="[grid-area:1/1] w-[40%] h-[40%] rounded-full border border-white/10 transform-[rotateX(55deg)]"></div>
                <div className="[grid-area:1/1] w-[55%] h-[55%] rounded-full border border-white/10 transform-[rotateX(55deg)]"></div>
                <div className="[grid-area:1/1] w-[70%] h-[70%] rounded-full border border-white/10 transform-[rotateX(55deg)]"></div>
                <div className="[grid-area:1/1] w-[85%] h-[85%] rounded-full border border-white/10 transform-[rotateX(55deg)]"></div>
                <div className="[grid-area:1/1] w-full h-full rounded-full border border-white/10 transform-[rotateX(55deg)]"></div>
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