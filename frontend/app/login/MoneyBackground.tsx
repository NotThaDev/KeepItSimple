"use client";

import { useEffect, useRef } from "react";

const SYMBOLS = ["$", "€", "£", "¥", "₿", "₹", "¢", "₩"];
const CELL = 28;
const RING_SPEED = 700; // px per second
const RING_WIDTH = 60;
// Brand sweep: indigo → violet → pink as the ring travels outwards.
const HUE_START = 240;
const HUE_RANGE = 90;

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

export function MoneyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const area = canvas?.parentElement;
    if (!canvas || !ctx || !area) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let symbols: string[] = [];
    let cols = 0;
    let width = 0;
    let height = 0;
    let ripples: { x: number; y: number; start: number }[] = [];
    let frame = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      ({ width, height } = canvas!.getBoundingClientRect());
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL);
      symbols = Array.from(
        { length: cols * Math.ceil(height / CELL) },
        randomSymbol,
      );
      // The animation loop redraws on its next frame anyway.
      if (reduceMotion) draw(0);
    }

    function draw(now: number) {
      const t = now / 1000;
      const maxRadius = Math.hypot(width, height);
      ripples = ripples.filter(
        (r) =>
          ((now - r.start) / 1000) * RING_SPEED < maxRadius + RING_WIDTH * 3,
      );
      const idleColor = getComputedStyle(canvas!).color;
      ctx!.clearRect(0, 0, width, height);
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      symbols.forEach((_, i) => {
        const x = (i % cols) * CELL + CELL / 2;
        const y = Math.floor(i / cols) * CELL + CELL / 2;

        // Ambient flow: overlapping travelling waves sweep brightness across the grid.
        const flow = reduceMotion
          ? 0
          : (Math.sin(x * 0.011 + t * 0.7) +
              Math.sin(y * 0.014 - t * 0.5) +
              Math.sin((x + y) * 0.007 + t * 0.35) +
              3) /
            6;
        // Only the crests of the flow pick up colour.
        let intensity = Math.max(0, (flow - 0.6) / 0.4) * 0.55;
        let hue =
          HUE_START + HUE_RANGE * (0.5 + 0.5 * Math.sin(t * 0.25 + x * 0.004));

        for (const ripple of ripples) {
          const radius = ((now - ripple.start) / 1000) * RING_SPEED;
          const offset =
            (Math.hypot(x - ripple.x, y - ripple.y) - radius) / RING_WIDTH;
          const strength =
            Math.exp(-offset * offset) * Math.max(0, 1 - radius / maxRadius);
          if (strength > intensity) {
            intensity = strength;
            hue = HUE_START + HUE_RANGE * Math.min(1, radius / maxRadius);
          }
        }
        // Rings reshuffle the symbols they pass over; the flow does it rarely.
        if (
          (intensity > 0.9 && Math.random() < 0.15) ||
          (!reduceMotion && Math.random() < 0.0008)
        )
          symbols[i] = randomSymbol();

        ctx!.globalAlpha = 0.15 + 0.15 * flow + 0.7 * intensity;
        ctx!.fillStyle = intensity > 0.02 ? `hsl(${hue} 85% 60%)` : idleColor;
        ctx!.font = `${14 * (1 + 0.5 * intensity)}px ui-monospace, monospace`;
        ctx!.fillText(symbols[i], x, y);
      });

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    }

    function onPointerDown(event: PointerEvent) {
      if (reduceMotion) return;
      if ((event.target as Element).closest("input, button, a, label")) return;
      const rect = canvas!.getBoundingClientRect();
      ripples.push({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        start: performance.now(),
      });
    }

    // Fires once on observe, which sizes the grid before the first frame.
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (!reduceMotion) frame = requestAnimationFrame(draw);
    area.addEventListener("pointerdown", onPointerDown);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      area.removeEventListener("pointerdown", onPointerDown);
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
