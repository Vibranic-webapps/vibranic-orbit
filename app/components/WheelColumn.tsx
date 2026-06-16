"use client";
import { useCallback, useEffect, useRef } from "react";

const ITEM_H = 34;
const VISIBLE = 5;

interface WheelColumnProps {
    values: number[];
    value: number;
    onChange: (v: number) => void;
    isDisabled?: (v: number) => boolean;
    ariaLabel: string;
    label?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const clampIdx = (i: number, len: number) => Math.max(0, Math.min(len - 1, i));

export default function WheelColumn({ values, value, onChange, isDisabled, ariaLabel, label }: WheelColumnProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isScrolling = useRef(false);
    const programmatic = useRef(false);
    const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);

    const latest = useRef({ value, values, isDisabled, onChange });
    useEffect(() => {
        latest.current = { value, values, isDisabled, onChange };
    });

    const height = ITEM_H * VISIBLE;
    const spacer = (height - ITEM_H) / 2;

    const scrollToIndex = useCallback((idx: number, smooth = false) => {
        const el = ref.current;
        if (!el) return;
        programmatic.current = true;
        el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? "smooth" : "auto" });
    }, []);

    const settle = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        isScrolling.current = false;

        if (programmatic.current) { programmatic.current = false; return; }

        const { value, values, isDisabled, onChange } = latest.current;
        let idx = clampIdx(Math.round(el.scrollTop / ITEM_H), values.length);

        if (isDisabled?.(values[idx])) {
            let up = idx;
            while (up < values.length && isDisabled(values[up])) up++;
            let down = idx;
            while (down >= 0 && isDisabled(values[down])) down--;
            const upOk = up < values.length;
            const downOk = down >= 0;
            idx = upOk && (!downOk || up - idx <= idx - down) ? up : (downOk ? down : idx);
        }

        if (Math.abs(el.scrollTop - idx * ITEM_H) > 1) scrollToIndex(idx, true);
        if (values[idx] !== value) onChange(values[idx]);
    }, [scrollToIndex]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const hasScrollEnd = "onscrollend" in el;

        const handleScroll = () => {
            isScrolling.current = true;
            if (!hasScrollEnd) {
                if (fallback.current) clearTimeout(fallback.current);
                fallback.current = setTimeout(settle, 120);
            }
        };

        el.addEventListener("scroll", handleScroll, { passive: true });
        if (hasScrollEnd) el.addEventListener("scrollend", settle);
        return () => {
            el.removeEventListener("scroll", handleScroll);
            if (hasScrollEnd) el.removeEventListener("scrollend", settle);
        };
    }, [settle]);

    useEffect(() => {
        if (isScrolling.current) return;
        const el = ref.current;
        if (!el) return;
        const idx = values.indexOf(value);
        if (idx < 0) return;
        if (Math.abs(el.scrollTop - idx * ITEM_H) > 1) scrollToIndex(idx);
    }, [value, values, scrollToIndex]);

    return (
        <div className="flex flex-col items-center gap-1">
            {label && <span className="text-[11px] uppercase tracking-wide text-white/40">{label}</span>}
            <div className="relative w-16 mt-2" style={{ height }}>
                <div
                    className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-md bg-white/5 border border-white/10"
                    style={{ height: ITEM_H }}
                />
                <div
                    ref={ref}
                    role="listbox"
                    aria-label={ariaLabel}
                    className="h-full overflow-y-auto snap-y snap-mandatory text-center [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none" }}
                >
                    <div style={{ height: spacer }} />
                    {values.map((v) => {
                        const disabled = isDisabled?.(v) ?? false;
                        const selected = v === value;
                        return (
                            <div
                                key={v}
                                role="option"
                                aria-selected={selected}
                                onClick={() => { if (!disabled) { scrollToIndex(values.indexOf(v), true); onChange(v); } }}
                                className={`snap-center snap-always flex items-center justify-center cursor-pointer transition-colors ${
                                    disabled ? "text-white/20" : selected ? "text-white font-semibold" : "text-white/40"
                                }`}
                                style={{ height: ITEM_H }}
                            >
                                {pad(v)}
                            </div>
                        );
                    })}
                    <div style={{ height: spacer }} />
                </div>
            </div>
        </div>
    );
}
