'use client'

function mulberry32(seed: number) {
    return function () {
        seed |= 0
        seed = (seed + 0x6D2B79F5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function starShadows(count: number, seed: number): string {
    const rand = mulberry32(seed)
    const stars: string[] = []

    for (let i = 0; i < count; i++) {
        const x = Math.round(rand() * 2000)
        const y = Math.round(rand() * 2000)
        stars.push(`${x}px ${y}px #fff`)
    }

    return stars.join(', ')
}

const FAR_STARS = starShadows(200, 1)
const NEAR_STARS = starShadows(80, 2)

export function SpaceBackground() {
    return (
        <div className="absolute inset-0" aria-hidden="true">
            <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(120% 120% at 50% 45%, var(--space) 0%, var(--void) 70%)',}}
            />
            <div
            className="absolute inset-0"
            style={{ opacity: 0.4 }}
            >
                <div
                    style={{
                    width: '1px',
                    height: '1px',
                    background: 'transparent',
                    boxShadow: FAR_STARS,
                    }}
                />
            </div>
            <div
            className="absolute inset-0"
            style={{
                background: 'radial-gradient(70% 50% at 32% 28%, var(--nebula-violet) 0%, transparent 72%)',
                mixBlendMode: 'screen',
                opacity: 0.22,
            }}
            />
            <div
            className="absolute inset-0"
            style={{
                background: 'radial-gradient(45% 38% at 42% 36%, var(--nebula-blue) 0%, transparent 65%)',
                mixBlendMode: 'screen',
                opacity: 0.4,
            }}
            />
            <div
            className="absolute inset-0"
            style={{
                background: 'radial-gradient(28% 22% at 36% 30%, var(--nebula-violet) 0%, transparent 55%)',
                mixBlendMode: 'screen',
                opacity: 0.55,
            }}
            />
            <div
            className="absolute inset-0"
            style={{ opacity: 0.85 }}
            >
                <div
                    style={{
                    width: '2px',
                    height: '2px',
                    background: 'transparent',
                    boxShadow: NEAR_STARS,
                    }}
                />
            </div>
            <div
            className="absolute inset-0"
            style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                opacity: 0.04,
                mixBlendMode: 'overlay',
            }}
            />

        </div>
    )
}
