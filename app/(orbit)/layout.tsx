import { SpaceBackground } from '@/app/components/orbit/SpaceBackground'

export default function OrbitLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-(--void)">
            <SpaceBackground />
            <main className="relative z-10">{children}</main>
        </div>
    )
}
