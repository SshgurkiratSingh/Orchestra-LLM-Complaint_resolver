"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Start loading bar on route change
    setVisible(true);
    setProgress(0);

    // Trickle: quickly to 30%, then slow crawl to 85%
    let current = 0;
    const trickle = () => {
      current += current < 30 ? 10 : current < 60 ? 4 : current < 85 ? 1.5 : 0;
      if (current > 85) current = 85;
      setProgress(current);
      if (current < 85) {
        timerRef.current = setTimeout(() => {
          rafRef.current = requestAnimationFrame(trickle);
        }, current < 30 ? 80 : 200);
      }
    };
    rafRef.current = requestAnimationFrame(trickle);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Complete on cleanup (route settled)
      setProgress(100);
      timerRef.current = setTimeout(() => setVisible(false), 400);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, #4f46e5, #818cf8, #6366f1)",
        boxShadow: "0 0 10px #6366f1, 0 0 4px #818cf8",
        opacity: progress >= 100 ? 0 : 1,
        transition: progress >= 100
          ? "width 0.1s ease-out, opacity 0.3s ease 0.1s"
          : "width 0.3s ease-out",
      }}
    >
      {/* Glowing tip */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[6px] w-[60px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at right, #a5b4fc 0%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />
    </div>
  );
}
