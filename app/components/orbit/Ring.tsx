import { Priority } from "@/app/types";

const BAND_SIZE = {
    crashing: 40,
    inner:    55,
    mid:      70,
    outer:    85,
    belt:     100,
}

const BAND_DURATION = { crashing: 50, inner: 70, mid: 110, outer: 170, belt: 240 }

const PRIORITY_SIZE = { high: 5, medium: 3.5, low: 2.5 }

export default function Ring({ band, tasks, offset, }: { band: keyof typeof BAND_SIZE; tasks: { id: string; band: string, color: string, priority: Priority }[]; offset: number }) {
    const size = BAND_SIZE[band]
    const ringTasks = tasks.filter((t) => t.band === band)
    return (
        <div 
            className="[grid-area:1/1] relative rounded-full border border-white/10 transform-3d transform-[rotateX(40deg)]" 
            style={{ width: `${size}%`, height: `${size}%` }}
        >
            <div className="absolute inset-0 transform-3d" style={{ animation: `orbit-spin ${BAND_DURATION[band]}s linear infinite` }}>
                {ringTasks.map((task, index) => {
                    const angle = (index / ringTasks.length) * 360 + offset
                    const rad = angle * (Math.PI / 180)
                    const left = 50 + 50 * Math.cos(rad)
                    const top  = 50 + 50 * Math.sin(rad)
                    return (
                        <div
                        key={task.id}
                        className="absolute rounded-full 
                            bg-[radial-gradient(circle_at_35%_35%,color-mix(in_srgb,var(--c)_85%,white)_0%,var(--c)_45%,color-mix(in_srgb,var(--c),black_45%)_100%)]
                            shadow-[0_0_12px_var(--c),0_0_24px_color-mix(in_srgb,var(--c)_50%,transparent)]
                            transform-[translate(-50%,-50%)]
                        "
                            style={{ 
                                width: `${PRIORITY_SIZE[task.priority]}vmin`, 
                                height: `${PRIORITY_SIZE[task.priority]}vmin`, 
                                top: `${top}%`, left: `${left}%`, 
                                ["--c" as string]: task.color 
                            } as React.CSSProperties}
                        />
                    )
                })}
            </div>
        </div>
    )
}