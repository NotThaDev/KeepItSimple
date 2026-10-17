"use client";

import { useEffect, useRef } from "react";

const SYMBOLS = ["$", "€", "£", "¥", "₿", "₹", "¢", "₩"];
const CELL = 28;

export function MoneyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let cells: { symbol: string; phase: number; speed: number }[] = [];
    let cols = 0;
    let frame = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas!.getBoundingClientRect();
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL);
      const rows = Math.ceil(height / CELL);
      cells = Array.from({ length: cols * rows }, () => ({
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
      }));
    }

    function draw(time: number) {
      const { width, height } = canvas!.getBoundingClientRect();
      const color = getComputedStyle(canvas!).color;
      ctx!.clearRect(0, 0, width, height);
      ctx!.fillStyle = color;
      ctx!.font = `14px ui-monospace, monospace`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      const t = time / 1000;
      cells.forEach((cell, i) => {
        const wave = Math.sin(t * cell.speed + cell.phase);
        // Swap the glyph while it is invisible so the change is not seen.
        if (!reduceMotion && wave < -0.98) {
          cell.symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        }
        ctx!.globalAlpha = 0.08 + 0.22 * (wave + 1) * 0.5;
        const x = (i % cols) * CELL + CELL / 2;
        const y = Math.floor(i / cols) * CELL + CELL / 2;
        ctx!.fillText(cell.symbol, x, y);
      });
      if (!reduceMotion) frame = requestAnimationFrame(draw);
    }

    // Fires once on observe, so this also does the first draw.
    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(0);
    });
    observer.observe(canvas);
    if (!reduceMotion) frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full text-muted-foreground [mask-image:radial-gradient(ellipse_at_center,transparent_25%,black_75%)]"
    />
  );
}
