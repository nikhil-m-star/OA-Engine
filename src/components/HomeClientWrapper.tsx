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

export default function HomeClientWrapper({ stats, isAdmin }: HomeClientWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Mouse coordinates for spotlight
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

  // 3D Perspective Grid Renderer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

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
    window.addEventListener("mouseleave", onMouseLeave);

    // Grid details
    const gridCols = 25; // number of longitudinal lines
    const gridRows = 20; // number of latitudinal lines

    let time = 0;
    const render = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      const currentScroll = scrollProgress;

      // Smooth mouse coordinate tracking
      if (!mouseRef.current.active) {
        // Default target center on landing if mouse not active
        mouseRef.current.targetX = width / 2;
        mouseRef.current.targetY = height / 2;
      }
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      // 3D Perspective parameters
      const cameraDistance = 2.0;
      const focalLength = Math.min(width, height) * 0.8;
      
      // Auto-rotation around Y (slow, premium drift)
      const yaw = time * 0.0006;
      // Tilt transitions from 3D horizon (0.45 rad) to a flat view on scroll
      const pitch = 0.45 - currentScroll * 0.42;

      // Define grid coordinates and project them
      // Floor grid at height Y = -0.5
      const projectedGrid: { x: number; y: number; z: number; visible: boolean; alpha: number }[][] = [];

      for (let r = 0; r < gridRows; r++) {
        const rowPoints: { x: number; y: number; z: number; visible: boolean; alpha: number }[] = [];
        const gz = ((r / (gridRows - 1)) - 0.5) * 2.5; // Z depth

        for (let c = 0; c < gridCols; c++) {
          const gx = ((c / (gridCols - 1)) - 0.5) * 3.5; // X span
          const gy = 0.45; // floor grid height offset

          // Apply Y-axis rotation (yaw)
          let x1 = gx * Math.cos(yaw) - gz * Math.sin(yaw);
          let z1 = gx * Math.sin(yaw) + gz * Math.cos(yaw);

          // Apply X-axis rotation (pitch tilt)
          let y2 = gy * Math.cos(pitch) - z1 * Math.sin(pitch);
          let z2 = gy * Math.sin(pitch) + z1 * Math.cos(pitch);

          const zProjected = cameraDistance - z2;

          if (zProjected > 0.1) {
            const projX = (x1 / zProjected) * focalLength + width / 2;
            const projY = (y2 / zProjected) * focalLength + height / 2;

            // Fade out lines in the extreme distance (zProjected high) or very close (zProjected low)
            const edgeFade = Math.sin((r / (gridRows - 1)) * Math.PI); // 0 at edges, 1 in center
            const opacity = Math.max(0.1, edgeFade * 0.7);

            rowPoints.push({
              x: projX,
              y: projY,
              z: zProjected,
              visible: projX >= -100 && projX <= width + 100 && projY >= -100 && projY <= height + 100,
              alpha: opacity
            });
          } else {
            rowPoints.push({ x: 0, y: 0, z: zProjected, visible: false, alpha: 0 });
          }
        }
        projectedGrid.push(rowPoints);
      }

      // ----------------------------------------------------
      // DRAW GRADIENT SPOTLIGHT (INTERACTIVE GLOW)
      // ----------------------------------------------------
      // Creates a glowing back-light centered at the cursor
      const glowRadius = 320;
      const spotlight = ctx.createRadialGradient(
        mouseRef.current.x,
        mouseRef.current.y,
        0,
        mouseRef.current.x,
        mouseRef.current.y,
        glowRadius
      );
      
      // Soft signature orange spotlight glow
      spotlight.addColorStop(0, `rgba(232, 115, 12, ${0.14 * (1 - currentScroll)})`);
      spotlight.addColorStop(0.5, `rgba(232, 115, 12, ${0.03 * (1 - currentScroll)})`);
      spotlight.addColorStop(1, "rgba(0, 0, 0, 0)");
      
      ctx.fillStyle = spotlight;
      ctx.beginPath();
      ctx.arc(mouseRef.current.x, mouseRef.current.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // ----------------------------------------------------
      // DRAW 3D PERSPECTIVE GRID LINES
      // ----------------------------------------------------
      ctx.lineWidth = 0.65;

      // A. Draw Longitudinal lines (connections along Z-axis)
      for (let c = 0; c < gridCols; c++) {
        ctx.beginPath();
        let started = false;
        let prevAlpha = 0;

        for (let r = 0; r < gridRows; r++) {
          const pt = projectedGrid[r][c];
          if (pt && pt.visible) {
            // Local illumination factor: lines glow brighter when near the cursor spotlight
            const dx = pt.x - mouseRef.current.x;
            const dy = pt.y - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const illumination = dist < 220 ? (1 - dist / 220) * 1.5 : 0;

            const finalAlpha = pt.alpha * 0.08 * (1 + illumination) * (1 - currentScroll * 0.3);

            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              // Create dynamic gradient color on each segment to make intersection glowing look extremely smooth
              const grad = ctx.createLinearGradient(
                projectedGrid[r - 1][c].x,
                projectedGrid[r - 1][c].y,
                pt.x,
                pt.y
              );
              grad.addColorStop(0, `rgba(232, 115, 12, ${prevAlpha})`);
              grad.addColorStop(1, `rgba(232, 115, 12, ${finalAlpha})`);
              
              ctx.strokeStyle = grad;
              ctx.lineTo(pt.x, pt.y);
              ctx.stroke();
              
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y);
            }
            prevAlpha = finalAlpha;
          } else {
            started = false;
          }
        }
      }

      // B. Draw Latitudinal lines (connections along X-axis)
      for (let r = 0; r < gridRows; r++) {
        ctx.beginPath();
        let started = false;
        let prevAlpha = 0;

        for (let c = 0; c < gridCols; c++) {
          const pt = projectedGrid[r][c];
          if (pt && pt.visible) {
            const dx = pt.x - mouseRef.current.x;
            const dy = pt.y - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const illumination = dist < 220 ? (1 - dist / 220) * 1.5 : 0;

            const finalAlpha = pt.alpha * 0.08 * (1 + illumination) * (1 - currentScroll * 0.3);

            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              const grad = ctx.createLinearGradient(
                projectedGrid[r][c - 1].x,
                projectedGrid[r][c - 1].y,
                pt.x,
                pt.y
              );
              grad.addColorStop(0, `rgba(232, 115, 12, ${prevAlpha})`);
              grad.addColorStop(1, `rgba(232, 115, 12, ${finalAlpha})`);
              
              ctx.strokeStyle = grad;
              ctx.lineTo(pt.x, pt.y);
              ctx.stroke();
              
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y);
            }
            prevAlpha = finalAlpha;
          } else {
            started = false;
          }
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

      {/* Vercel-Style 3D Perspective Grid Background (fades cleanly on scroll) */}
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
