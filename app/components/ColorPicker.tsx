"use client";
import { useRef, useState } from "react";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function hexToHsv(hex: string) {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    if ([r, g, b].some(Number.isNaN)) return { h: 0, s: 0, v: 0.5 };
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let hue = 0;
    if (d) {
        if (max === r) hue = ((g - b) / d) % 6;
        else if (max === g) hue = (b - r) / d + 2;
        else hue = (r - g) / d + 4;
        hue *= 60;
        if (hue < 0) hue += 360;
    }
    return { h: hue, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex(h: number, s: number, v: number) {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
}

interface ColorPickerProps {
    value: string;
    onChange: (hex: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
    const [hsv, setHsv] = useState(() => hexToHsv(value));
    const svRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const dragging = useRef<null | "sv" | "hue">(null);

    const emit = (next: { h: number; s: number; v: number }) => {
        setHsv(next);
        onChange(hsvToHex(next.h, next.s, next.v));
    };

    const handleSv = (clientX: number, clientY: number) => {
        const r = svRef.current!.getBoundingClientRect();
        emit({ ...hsv, s: clamp01((clientX - r.left) / r.width), v: 1 - clamp01((clientY - r.top) / r.height) });
    };
    const handleHue = (clientX: number) => {
        const r = hueRef.current!.getBoundingClientRect();
        emit({ ...hsv, h: clamp01((clientX - r.left) / r.width) * 360 });
    };

    const onMove = (e: React.PointerEvent) => {
        if (dragging.current === "sv") handleSv(e.clientX, e.clientY);
        else if (dragging.current === "hue") handleHue(e.clientX);
    };
    const endDrag = () => { dragging.current = null; };

    const hueColor = hsvToHex(hsv.h, 1, 1);
    const current = hsvToHex(hsv.h, hsv.s, hsv.v);

    return (
        <div className="flex flex-col gap-3">
            <div ref={svRef} className="relative h-32 w-full cursor-crosshair rounded-lg touch-none"
                style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})` }}
                onPointerDown={(e) => { dragging.current = "sv"; e.currentTarget.setPointerCapture(e.pointerId); handleSv(e.clientX, e.clientY); }}
                onPointerMove={onMove} onPointerUp={endDrag}>
                <span className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                    style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: current }} />
            </div>

            <div ref={hueRef} className="relative h-3 w-full cursor-pointer rounded-full touch-none"
                style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
                onPointerDown={(e) => { dragging.current = "hue"; e.currentTarget.setPointerCapture(e.pointerId); handleHue(e.clientX); }}
                onPointerMove={onMove} onPointerUp={endDrag}>
                <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                    style={{ left: `${(hsv.h / 360) * 100}%`, background: hueColor }} />
            </div>

            <div className="flex items-center gap-2">
                <span className="h-7 w-7 shrink-0 rounded-md border border-white/15" style={{ background: current }} />
                <input
                    value={current}
                    onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{6}$/.test(v)) emit(hexToHsv(v)); else onChange(v); }}
                    className="w-28 rounded border border-white/10 bg-white/5 px-2 py-1 text-sm tabular-nums text-white/90 focus:outline-none focus:border-(--vibranic)" />
            </div>
        </div>
    );
}
