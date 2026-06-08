const BAND_SIZE = {
    crashing: 40,
    inner:    58,
    mid:      75,
    outer:    92,
    belt:     110,
}


export default function Ring({ band, tasks, offset }: { band: keyof typeof BAND_SIZE; tasks: { id: string; band: string, color: string }[]; offset: number }) {
    const size = BAND_SIZE[band]
    const ringTasks = tasks.filter((t) => t.band === band)
    return (
        <div 
            className="[grid-area:1/1] relative rounded-full border border-white/10 transform-3d transform-[rotateX(55deg)]" 
            style={{ width: `${size}%`, height: `${size}%` }}
        >
            {ringTasks.map((task, index) => {
                const angle = (index / tasks.length) * 360 + offset
                const rad = angle * (Math.PI / 180)
                const left = 50 + 50 * Math.cos(rad)
                const top  = 50 + 50 * Math.sin(rad)
                return (
                        <div
                        key={task.id}
                        className="absolute w-[8%] h-[8%] rounded-full 
                            bg-[radial-gradient(circle_at_35%_35%,color-mix(in_srgb,var(--c)_85%,white)_0%,var(--c)_45%,transparent_100%)]
                            shadow-[0_0_12px_var(--c),0_0_24px_color-mix(in_srgb,var(--c)_50%,transparent)]
                            transform-[translate(-50%,-50%)_rotateX(-55deg)]"
                            style={{ top: `${top}%`, left: `${left}%`, ["--c" as string]: task.color } as React.CSSProperties}
                        />
                    )
            })}
        </div>
    )
}