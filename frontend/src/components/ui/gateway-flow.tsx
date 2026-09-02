"use client";

import React, { useEffect, useRef } from "react";

export interface GatewayFlowProps {
  mode?: "light" | "dark" | "auto";
  speed?: number;
  size?: number;
  density?: number;
  strokeWidth?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function GatewayFlow({
  mode = "light",
  speed = 1,
  size = 1,
  density = 1,
  strokeWidth = 1.2,
  opacity = 1,
  className = "",
  style,
}: GatewayFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let time = 0;

    let explosions: Array<{ x: number; y: number; radius: number; life: number }> = [];

    const handleResize = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleClick = (e: MouseEvent) => {
      explosions.push({ x: e.clientX, y: e.clientY, radius: 0, life: 1 });
    };
    window.addEventListener("click", handleClick);

    // Initialize flowing paths
    const numPaths = Math.round(70 * density);
    const paths: Array<{
      isLeft: boolean;
      startY: number;
      speedMult: number;
      particles: Array<{ t: number; speed: number; particleSize: number }>;
    }> = [];

    for (let i = 0; i < numPaths; i++) {
      const isLeft = i % 2 === 0;
      paths.push({
        isLeft,
        startY: (i / numPaths) * height * 1.4 - height * 0.2,
        speedMult: 0.8 + Math.random() * 0.5,
        particles: [
          {
            t: Math.random(),
            speed: (0.0016 + Math.random() * 0.0022) * speed,
            particleSize: (2.5 + Math.random() * 2) * size,
          },
          {
            t: (Math.random() + 0.5) % 1,
            speed: (0.0014 + Math.random() * 0.0018) * speed,
            particleSize: (2 + Math.random() * 1.5) * size,
          },
        ],
      });
    }

    function getBezierPoint(
      t: number,
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number }
    ) {
      const u = 1 - t;
      return {
        x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
        y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
      };
    }

    const isLight = mode !== "dark";
    const particleColor = isLight ? "rgba(0, 35, 111, 0.92)" : "rgba(255, 255, 255, 0.95)";
    const glowColor = isLight ? "rgba(0, 35, 111, 0.5)" : "rgba(255, 255, 255, 0.6)";

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      time += 0.02 * speed;
      const centerX = width / 2;
      const centerY = height / 2;

      // Handle click shockwaves
      explosions.forEach((exp) => {
        exp.radius += 14;
        exp.life -= 0.02;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isLight
          ? `rgba(0, 35, 111, ${exp.life * 0.35})`
          : `rgba(255, 255, 255, ${exp.life * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      explosions = explosions.filter((exp) => exp.life > 0);

      // Render smooth converging bezier conduits
      paths.forEach((path) => {
        const p0 = { x: path.isLeft ? 0 : width, y: path.startY };
        const p1 = {
          x: path.isLeft ? centerX * 0.45 : width - centerX * 0.45,
          y: path.startY,
        };
        const p2 = {
          x: path.isLeft ? centerX * 0.82 : width - centerX * 0.82,
          y: centerY,
        };
        const p3 = { x: centerX, y: centerY };

        // Linear gradient along curve: high opacity in stream, fading gracefully at focal center
        const grad = ctx.createLinearGradient(p0.x, p0.y, p3.x, p3.y);
        if (isLight) {
          grad.addColorStop(0, "rgba(0, 35, 111, 0.12)");
          grad.addColorStop(0.35, "rgba(0, 35, 111, 0.35)");
          grad.addColorStop(0.75, "rgba(0, 35, 111, 0.22)");
          grad.addColorStop(1, "rgba(0, 35, 111, 0.0)"); // Smooth zero-opacity fade to prevent bunching
        } else {
          grad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
          grad.addColorStop(0.35, "rgba(255, 255, 255, 0.40)");
          grad.addColorStop(0.75, "rgba(255, 255, 255, 0.22)");
          grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
        }

        // Draw animated streaming dashed line
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = strokeWidth;
        ctx.setLineDash([3, 7]);
        ctx.lineDashOffset = -time * 18 * path.speedMult;
        ctx.stroke();
        ctx.setLineDash([]);

        // Flowing particles along the full curve into center
        path.particles.forEach((p) => {
          p.t += p.speed;
          if (p.t > 0.95) {
            // Smooth loop when reaching near center
            p.t = 0;
            path.startY += (Math.random() - 0.5) * 10;
          }

          let pos = getBezierPoint(p.t, p0, p1, p2, p3);

          // Shockwave displacement
          let dxTotal = 0;
          let dyTotal = 0;
          explosions.forEach((exp) => {
            const dx = pos.x - exp.x;
            const dy = pos.y - exp.y;
            const dist = Math.hypot(dx, dy);
            if (dist < exp.radius + 100 && dist > exp.radius - 100) {
              const force = (1 - Math.abs(dist - exp.radius) / 100) * exp.life;
              dxTotal += (dx / dist) * force * 50;
              dyTotal += (dy / dist) * force * 50;
            }
          });

          pos.x += dxTotal;
          pos.y += dyTotal;

          // Particle opacity fades smoothly as it enters center (t > 0.75)
          const alpha = p.t > 0.75 ? Math.max(0, (0.95 - p.t) / 0.2) : 1;

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, (p.particleSize * alpha) / 2, 0, Math.PI * 2);
          ctx.fillStyle = isLight
            ? `rgba(0, 35, 111, ${0.9 * alpha})`
            : `rgba(255, 255, 255, ${0.95 * alpha})`;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 5 * alpha;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      });

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, speed, density, strokeWidth, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${className}`}
      style={{
        display: "block",
        opacity,
        background: "transparent",
        ...style,
      }}
    />
  );
}
