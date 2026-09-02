"use client";

import React, { useEffect, useRef } from "react";

export interface ParticleDriftProps {
  mode?: "dark" | "light" | "auto";
  speed?: number;
  size?: number;
  gap?: number;
  length?: number;
  density?: number;
  strokeWidth?: number;
  opacity?: number;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function ParticleDrift({
  mode = "light",
  speed = 0.7,
  size = 0.95,
  length = 1.1,
  density = 0.85,
  strokeWidth = 0.95,
  opacity = 0.58,
  interactive = true,
  className = "",
  style,
}: ParticleDriftProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isLight = mode !== "dark";
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*()<>{}".split("");
    let mouse = { x: -1000, y: -1000 };

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

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Balanced Node & Laser Beam Counts for Elegant Ambient Drift
    const nodeCount = Math.round(80 * density);
    const beamCount = Math.round(22 * density);

    let nodes = Array.from({ length: nodeCount }).map((_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: ((Math.random() * 0.3) + 0.1) * speed,
      char: chars[Math.floor(Math.random() * chars.length)],
      baseSize: (10.5 + Math.random() * 2) * size,
      isNexus: idx % 7 === 0, // ~14% active blue nexus points
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    let beams = Array.from({ length: beamCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: (Math.random() * 110 + 60) * length,
      speed: ((Math.random() * 3.0) + 1.5) * speed,
      opacity: Math.random() * 0.2 + 0.35, // Average ~0.45
    }));

    const linkDistance = 125 * length;

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const heroCenterY = height * 0.32;

      // 1. Moderate, Balanced Upward Laser Beams
      beams.forEach((b) => {
        b.y -= b.speed;
        if (b.y + b.length < 0) {
          b.y = height + 100;
          b.x = Math.random() * width;
        }

        const distFromHero = Math.hypot(b.x - centerX, b.y - heroCenterY);
        const heroZoneFactor = distFromHero < 300 ? Math.max(0.25, (distFromHero / 300) ** 1.3) : 1;

        const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.length);
        if (isLight) {
          g.addColorStop(0, `rgba(2, 132, 199, ${b.opacity * 0.7 * heroZoneFactor})`);
          g.addColorStop(0.35, `rgba(56, 189, 248, ${b.opacity * 0.4 * heroZoneFactor})`);
          g.addColorStop(1, "transparent");
        } else {
          g.addColorStop(0, `rgba(56, 189, 248, ${b.opacity * heroZoneFactor})`);
          g.addColorStop(1, "transparent");
        }

        ctx.strokeStyle = g;
        ctx.lineWidth = 1.05 * strokeWidth;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y + b.length);
        ctx.stroke();
      });

      // 2. Balanced Geometric Constellation Mesh Web
      ctx.font = `600 ${Math.round(10.5 * size)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          if (d < linkDistance) {
            const midX = (n1.x + n2.x) / 2;
            const midY = (n1.y + n2.y) / 2;
            const distFromHero = Math.hypot(midX - centerX, midY - heroCenterY);
            const heroZoneFactor = distFromHero < 300 ? Math.max(0.22, (distFromHero / 300) ** 1.3) : 1;

            const isNexusLink = n1.isNexus || n2.isNexus;
            const lineAlpha = (isNexusLink ? 0.28 : 0.15) * (1 - d / linkDistance) * heroZoneFactor;

            ctx.lineWidth = (isNexusLink ? 0.7 : 0.45) * strokeWidth;
            ctx.strokeStyle = isNexusLink
              ? `rgba(2, 132, 199, ${lineAlpha})`
              : `rgba(25, 45, 90, ${lineAlpha})`;

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // 3. ASCII Character Nodes (Subtle Blue Nexus + Slate-Navy Base)
      nodes.forEach((n) => {
        n.y -= n.vy;
        if (n.y < -20) {
          n.y = height + 20;
          n.x = Math.random() * width;
        }

        n.pulsePhase += 0.03;
        const pulse = Math.sin(n.pulsePhase) * 0.12 + 0.88;

        const distFromHero = Math.hypot(n.x - centerX, n.y - heroCenterY);
        const heroZoneFactor = distFromHero < 300 ? Math.max(0.22, (distFromHero / 300) ** 1.35) : 1;

        const distFromMouse = Math.hypot(mouse.x - n.x, mouse.y - n.y);

        if (distFromMouse < 150 || Math.random() > 0.99) {
          n.char = chars[Math.floor(Math.random() * chars.length)];
        }

        // Interactive mouse connection
        if (distFromMouse < 150 && interactive) {
          const mouseAlpha = 0.55 * (1 - distFromMouse / 150);
          ctx.strokeStyle = `rgba(2, 132, 199, ${mouseAlpha})`;
          ctx.lineWidth = 0.85 * strokeWidth;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        if (distFromMouse < 150 && interactive) {
          ctx.fillStyle = "#0284c7";
          ctx.shadowColor = "rgba(56, 189, 248, 0.6)";
          ctx.shadowBlur = 5;
        } else if (n.isNexus) {
          // Balanced Blue Nexus Node
          ctx.fillStyle = `rgba(2, 132, 199, ${0.55 * pulse * heroZoneFactor})`;
          ctx.shadowColor = `rgba(56, 189, 248, ${0.35 * heroZoneFactor})`;
          ctx.shadowBlur = 4;
        } else {
          // Balanced Slate-Navy Base Node
          ctx.fillStyle = `rgba(25, 45, 90, ${0.28 * heroZoneFactor})`;
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }

        ctx.fillText(n.char, n.x, n.y);
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, speed, size, length, density, strokeWidth, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        display: "block",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -10,
        opacity,
        background: "transparent",
        ...style,
      }}
    />
  );
}
