"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Stats {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

interface HomeClientWrapperProps {
  stats: Stats;
  isAdmin: boolean;
}

interface GridPoint {
  r: number; // row index
  c: number; // col index
  gx: number; // grid x (-1 to 1)
  gz: number; // grid z (-1 to 1)
}

export default function HomeClientWrapper({ stats, isAdmin }: HomeClientWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Mouse interaction states
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false });

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const height = window.innerHeight;
      
      const progress = Math.min(Math.max(scrollTop / height, 0), 1);
      setScrollProgress(progress);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    
    window.addEventListener("scroll", handleScroll);

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 3D Grid Canvas Renderer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // ----------------------------------------------------
    // INITIALIZE GRID (3D Plane mesh)
    // ----------------------------------------------------
    const cols = 28;
    const rows = 20;
    const gridPoints: GridPoint[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Normalize grid coordinates to -1.3 to 1.3
        const gx = ((c / (cols - 1)) - 0.5) * 2.6;
        const gz = ((r / (rows - 1)) - 0.5) * 2.0;
        gridPoints.push({ r, c, gx, gz });
      }
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.active = true;
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    let time = 0;
    const render = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      const currentScroll = scrollProgress;

      // Smooth mouse coordinate dampening
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      // 3D Camera Angles
      // Base auto rotation + slight mouse follow
      const mouseFactorX = mouseRef.current.active ? (mouseRef.current.x / width - 0.5) * 0.35 : 0;
      const mouseFactorY = mouseRef.current.active ? (mouseRef.current.y / height - 0.5) * 0.15 : 0;

      const angleY = time * 0.0018 + mouseFactorX;
      // Tilt starts at 0.58 rad (33 degrees) and flattens down to 0.05 (flat horizontal plane) on scroll
      const angleX = 0.55 - currentScroll * 0.52 + mouseFactorY;

      // Camera config
      const cameraDistance = 2.4;
      const focalLength = Math.min(width, height) * 0.72;

      // Wave physics
      // Wave amplitude flattens out as user scrolls (calming wave field)
      const amplitude = 0.22 * (1 - currentScroll * 0.95);
      const waveFreqX = 2.2;
      const waveFreqZ = 1.8;

      const projected: { x: number; y: number; z: number; visible: boolean; alpha: number }[] = [];

      // Project grid points
      for (let i = 0; i < gridPoints.length; i++) {
        const p = gridPoints[i];

        // 3D mathematical sine waves rippling across the grid
        const waveX = p.gx * waveFreqX + time * 0.024;
        const waveZ = p.gz * waveFreqZ + time * 0.016;
        let gy = Math.sin(waveX) * Math.cos(waveZ) * amplitude;

        // 3D rotations
        // Rotate Y
        let x1 = p.gx * Math.cos(angleY) - p.gz * Math.sin(angleY);
        let z1 = p.gx * Math.sin(angleY) + p.gz * Math.cos(angleY);

        // Rotate X (tilted plane projection)
        let y2 = gy * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = gy * Math.sin(angleX) + z1 * Math.cos(angleX);

        const zProjected = cameraDistance - z2;

        if (zProjected > 0.1) {
          let projX = (x1 / zProjected) * focalLength + width / 2;
          let projY = (y2 / zProjected) * focalLength + height / 2;

          // Interactive cursor ripple
          if (mouseRef.current.active) {
            const dx = projX - mouseRef.current.x;
            const dy = projY - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 140) {
              const force = (140 - dist) / 140;
              // Concentric ripple displacement based on sine wave
              const ripple = Math.sin(dist * 0.07 - time * 0.12) * 0.05 * force;
              projY += (ripple * focalLength) / zProjected;
            }
          }

          // Depth-based opacity (further points fade out slightly)
          const zDepthFactor = Math.min(1, Math.max(0.2, (cameraDistance + 1.2 - zProjected) / 2.4));
          const opacity = zDepthFactor * 0.7;

          projected.push({
            x: projX,
            y: projY,
            z: zProjected,
            visible: projX >= -50 && projX <= width + 50 && projY >= -50 && projY <= height + 50,
            alpha: opacity
          });
        } else {
          projected.push({ x: 0, y: 0, z: zProjected, visible: false, alpha: 0 });
        }
      }

      // ----------------------------------------------------
      // DRAW CONNECTING MESH LINES
      // ----------------------------------------------------
      ctx.lineWidth = 0.55;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const pCurrent = projected[idx];

          if (!pCurrent || !pCurrent.visible) continue;

          // 1. Draw horizontal connections to the right (c + 1)
          if (c < cols - 1) {
            const idxRight = idx + 1;
            const pRight = projected[idxRight];
            if (pRight && pRight.visible) {
              const avgAlpha = (pCurrent.alpha + pRight.alpha) / 2 * 0.18;
              ctx.strokeStyle = `rgba(232, 115, 12, ${avgAlpha})`; // signature orange
              ctx.beginPath();
              ctx.moveTo(pCurrent.x, pCurrent.y);
              ctx.lineTo(pRight.x, pRight.y);
              ctx.stroke();
            }
          }

          // 2. Draw vertical connections to the next row (r + 1)
          if (r < rows - 1) {
            const idxDown = idx + cols;
            const pDown = projected[idxDown];
            if (pDown && pDown.visible) {
              const avgAlpha = (pCurrent.alpha + pCurrent.alpha) / 2 * 0.18;
              ctx.strokeStyle = `rgba(232, 115, 12, ${avgAlpha})`;
              ctx.beginPath();
              ctx.moveTo(pCurrent.x, pCurrent.y);
              ctx.lineTo(pDown.x, pDown.y);
              ctx.stroke();
            }
          }
        }
      }

      // ----------------------------------------------------
      // DRAW GRID NODES (shining radial glows)
      // ----------------------------------------------------
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        if (p && p.visible) {
          // Point size based on depth
          const size = Math.max(0.4, 1.2 / p.z);

          // Render radial glowing neon dots
          const gradRadius = size * 2.8;
          const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gradRadius);
          
          radGrad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha * 0.95})`);
          radGrad.addColorStop(0.25, `rgba(232, 115, 12, ${p.alpha * 0.8})`);
          radGrad.addColorStop(1, `rgba(232, 115, 12, 0)`);
          
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, gradRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [scrollProgress]);

  // Interpolations for scroll transitions
  const landingOpacity = Math.max(0, 1 - scrollProgress * 1.8);
  const landingScale = Math.max(0.85, 1 - scrollProgress * 0.15);
  const landingTranslateY = -scrollProgress * 80;

  const mainPageOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.25) * 1.33));
  const mainPageTranslateY = Math.max(0, (1 - mainPageOpacity) * 40);

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none relative overflow-x-hidden scrollbar-thin pb-24 md:pb-0 scroll-smooth"
    >
      <Navbar />

      {/* 3D Flowing Wave Grid Canvas (fades cleanly on scroll) */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
        style={{
          opacity: Math.max(0, 1 - scrollProgress * 1.5),
          transition: "opacity 0.15s ease-out"
        }}
      />

      {/* Section 1: Intro / Fullscreen Hero 3D Showcase */}
      <div 
        className="h-screen w-full shrink-0 flex flex-col items-center justify-center text-center px-6 relative z-10 pointer-events-none"
        style={{
          opacity: landingOpacity,
          transform: `scale(${landingScale}) translateY(${landingTranslateY}px)`,
          transition: "transform 0.1s ease-out, opacity 0.1s ease-out"
        }}
      >
        <div className="max-w-2xl space-y-4">
          <h1 className="text-6xl sm:text-8xl font-black tracking-wider text-white uppercase select-none">
            OA Engine
          </h1>
          <p className="text-sm sm:text-base text-gray-400 font-medium tracking-wide">
            A premium sandbox workspace for parsing and analyzing coding problems.
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 flex flex-col items-center space-y-2 text-[10px] uppercase tracking-widest text-[#E8730C] font-black animate-bounce">
          <span>Scroll to Launch</span>
          <ChevronDown size={14} className="text-[#E8730C]" />
        </div>
      </div>

      {/* Section 2: Rest of Homepage Contents (Fades & slides in on scroll) */}
      <main 
        className="w-full max-w-5xl mx-auto px-6 py-12 md:py-24 flex flex-col justify-center space-y-16 sm:space-y-24 z-10"
        style={{
          opacity: mainPageOpacity,
          transform: `translateY(${mainPageTranslateY}px)`,
          pointerEvents: mainPageOpacity > 0.05 ? "auto" : "none",
          transition: "transform 0.1s ease-out, opacity 0.1s ease-out"
        }}
      >
        {/* Hero Banner Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[0.95] text-white">
            Supercharge your <br className="hidden sm:inline" />
            <span className="text-[#E8730C]">
              Online Assessments
            </span>.
          </h1>

          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto font-medium leading-relaxed">
            The ultimate developer workspace to parse raw coding problems, run solution code against dozens of structured test cases, and analyze performance instantly.
          </p>

          {/* Action Row (Borderless, Gradient-Free) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/workspace" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#E8730C] hover:bg-[#F28B2D] text-black font-black text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 transform active:scale-95 shadow-md"
            >
              <span>Open Workspace</span>
              <ArrowRight size={14} strokeWidth={3} />
            </Link>
            <Link 
              href="/problems" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#111111] hover:bg-[#1a1a1a] text-gray-300 hover:text-white font-black text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95 shadow-xl"
            >
              <span>Browse Problems</span>
            </Link>
          </div>
        </div>

        {/* Database Statistics Panel (Borderless, Gradient-Free) */}
        <div className="relative bg-[#0d0d0d] rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto w-full shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-900">
            <div className="space-y-1 pt-4 md:pt-0 hover:scale-[1.05] transition-transform duration-300 cursor-default">
              <div className="text-4xl sm:text-5xl font-black text-white leading-none">
                {stats.total}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Total Problems
              </div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0 hover:scale-[1.05] transition-transform duration-300 cursor-default">
              <div className="text-2xl sm:text-3xl font-bold text-[#00b8a3] leading-none">
                {stats.easy}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Easy
              </div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0 hover:scale-[1.05] transition-transform duration-300 cursor-default">
              <div className="text-2xl sm:text-3xl font-bold text-[#ffc01e] leading-none">
                {stats.medium}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Medium
              </div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0 hover:scale-[1.05] transition-transform duration-300 cursor-default">
              <div className="text-2xl sm:text-3xl font-bold text-[#ff375f] leading-none">
                {stats.hard}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Hard
              </div>
            </div>
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="flex justify-center pt-2">
            <Link
              href="/workspace?add=true"
              className="px-6 py-3 bg-[#0d0d0d] hover:bg-[#111111] text-gray-300 hover:text-[#E8730C] rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-md"
            >
              Add New Problem
            </Link>
          </div>
        )}

        {/* Bottom footer metadata (Borderless) */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-gray-600 text-[10px] font-mono uppercase tracking-wider">
          <div>OA Engine © {new Date().getFullYear()}</div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="hover:text-[#E8730C] transition-colors cursor-default">Terminals Secured</span>
            <span className="hover:text-[#E8730C] transition-colors cursor-default">Sandboxed Execution v1.0</span>
          </div>
        </div>
      </main>
    </div>
  );
}
