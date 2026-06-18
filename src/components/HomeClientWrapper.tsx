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
  
  // Mouse coordinates to attract pulses
  const mouseRef = useRef({ x: 0, y: 0 });

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

  // 2D Vector Stream Canvas Renderer loop
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
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Data packets (pulses) traveling along the vector paths
    const numPackets = 12;
    const packets = Array.from({ length: numPackets }).map((_, i) => ({
      progress: (i / numPackets), // offset start points
      speed: 0.0025 + Math.random() * 0.0015,
      size: 3 + Math.random() * 3,
      lane: Math.floor(Math.random() * 3) - 1 // -1 (left), 0 (center), 1 (right)
    }));

    let time = 0;
    const render = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      const currentScroll = scrollProgress;

      // ----------------------------------------------------
      // GENERATE DYNAMIC 2D WINDING VECTOR PATH
      // ----------------------------------------------------
      const pathPoints: { x: number; y: number }[] = [];
      const numSegments = 280;

      const startX = width / 2;
      const startY = height * 0.46; // Center vertically on landing viewport

      // The loop spins when static. When scrolled, the spinning slows down.
      const spinAngle = time * 0.014 * (1 - currentScroll * 0.85);

      for (let i = 0; i < numSegments; i++) {
        const t = i / (numSegments - 1);
        let px = 0;
        let py = 0;

        if (t < 0.28) {
          // A. Landing Core: A nested spinning vector loop in the center
          const loopT = t / 0.28;
          const angle = loopT * Math.PI * 4 + spinAngle; // double loop
          
          // Shrink/unroll radius of loop slightly on scroll
          const r = 95 * (1 - currentScroll * 0.2); 
          px = startX + Math.cos(angle) * r;
          py = startY + Math.sin(angle) * r;
        } else {
          // B. Flowing Winding Data Bus: Sweeps down and guides the scroll path
          const pathT = (t - 0.28) / 0.72; // normalize to 0 to 1
          
          // Create a smooth serpentine winding curve
          const waveX = Math.sin(pathT * Math.PI * 3.5) * (width * 0.16) * (1 - pathT * 0.2);
          
          // py extends down the page based on segment t
          // Extends further down on desktop than mobile
          const pageReach = height * 1.5;
          const targetY = startY + pathT * pageReach;

          // Interpolate smooth transition between loop exit and serpentine curve
          const blendFactor = Math.min(1, pathT * 4); // fast blend
          
          // Starting point of serpentine curve aligns with loop exit
          const loopExitAngle = spinAngle;
          const loopExitX = startX + Math.cos(loopExitAngle) * 95;
          const loopExitY = startY + Math.sin(loopExitAngle) * 95;

          px = loopExitX * (1 - blendFactor) + (startX + waveX) * blendFactor;
          py = loopExitY * (1 - blendFactor) + targetY * blendFactor;
        }

        pathPoints.push({ x: px, y: py });
      }

      // Draw progress: Path draws itself forward as we scroll
      // Starts at showing the core loop (28% of path)
      // Reaches 100% drawn as scrollProgress reaches 1
      const drawLimit = Math.floor(numSegments * (0.28 + currentScroll * 0.72));

      // ----------------------------------------------------
      // DRAW NEON VECTOR LANES (NO DOTS, PURE SMOOTH PATHS)
      // ----------------------------------------------------
      const drawLane = (offset: number, opacityMultiplier: number, lineWidth: number, isCore: boolean) => {
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < drawLimit; i++) {
          const pt = pathPoints[i];
          if (!pt) continue;

          // Calculate offset direction (perpendicular vector)
          let dx = 0;
          let dy = 0;
          if (offset !== 0 && i < drawLimit - 1) {
            const nextPt = pathPoints[i + 1];
            const vx = nextPt.x - pt.x;
            const vy = nextPt.y - pt.y;
            const len = Math.sqrt(vx * vx + vy * vy);
            if (len > 0.1) {
              // Normal perpendicular vector
              dx = (-vy / len) * offset;
              dy = (vx / len) * offset;
            }
          }

          const targetX = pt.x + dx;
          const targetY = pt.y + dy;

          if (!started) {
            ctx.moveTo(targetX, targetY);
            started = true;
          } else {
            ctx.lineTo(targetX, targetY);
          }
        }

        ctx.lineWidth = lineWidth;
        if (isCore) {
          ctx.strokeStyle = `rgba(232, 115, 12, ${0.75 * opacityMultiplier})`; // core orange
        } else {
          ctx.strokeStyle = `rgba(232, 115, 12, ${0.08 * opacityMultiplier})`; // soft neon glow bloom
        }
        ctx.stroke();
      };

      // Draw 3 lanes (Left, Center, Right) to represent a multi-core data bus
      const lanes = [-14, 0, 14];
      lanes.forEach((laneOffset) => {
        const isCenter = laneOffset === 0;
        const widthScale = isCenter ? 1 : 0.6;
        
        // A. Neon Bloom/Glow Layer (Wide stroke)
        drawLane(laneOffset, widthScale, 6.0, false);
        // B. Sharp Core Layer (Thin stroke)
        drawLane(laneOffset, widthScale, 1.8, true);
      });

      // Draw a subtle white center highlight inside the main middle track to give it a hot neon wire appearance
      drawLane(0, 0.4, 0.6, false);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.stroke();

      // ----------------------------------------------------
      // DRAW DATA PACKETS / ENERGY PULSES (Winding vector lines)
      // ----------------------------------------------------
      packets.forEach((packet) => {
        // Progress packets along the path
        packet.progress += packet.speed;
        if (packet.progress > 1) {
          packet.progress = 0;
          packet.lane = Math.floor(Math.random() * 3) - 1;
        }

        // Limit packets to the currently drawn path progress
        const currentPathLimitT = 0.28 + currentScroll * 0.72;
        const activeT = packet.progress * currentPathLimitT;
        const segmentIndex = Math.floor(activeT * (numSegments - 1));

        const pt = pathPoints[segmentIndex];
        if (pt) {
          // Calculate perpendicular offset for lane
          let dx = 0;
          let dy = 0;
          if (packet.lane !== 0 && segmentIndex < numSegments - 1) {
            const nextPt = pathPoints[segmentIndex + 1];
            const vx = nextPt.x - pt.x;
            const vy = nextPt.y - pt.y;
            const len = Math.sqrt(vx * vx + vy * vy);
            if (len > 0.1) {
              dx = (-vy / len) * packet.lane * 14;
              dy = (vx / len) * packet.lane * 14;
            }
          }

          const px = pt.x + dx;
          const py = pt.y + dy;

          // Render glowing pulse dash (short line segment) instead of a simple dot
          // Calculate heading direction
          let headingX = 1;
          let headingY = 0;
          if (segmentIndex < numSegments - 1) {
            const nextPt = pathPoints[segmentIndex + 1];
            const vx = nextPt.x - pt.x;
            const vy = nextPt.y - pt.y;
            const len = Math.sqrt(vx * vx + vy * vy);
            if (len > 0.1) {
              headingX = vx / len;
              headingY = vy / len;
            }
          }

          // Draw a short trailing glow streak line for the packet (extremely premium)
          const streakLen = 14 + currentScroll * 15; // grows longer as you scroll
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - headingX * streakLen, py - headingY * streakLen);
          
          ctx.lineWidth = packet.size * 0.55;
          ctx.strokeStyle = `rgba(255, 160, 50, ${0.85 * (1 - currentScroll * 0.4)})`;
          ctx.stroke();

          // White core for packet
          ctx.lineWidth = packet.size * 0.2;
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * (1 - currentScroll * 0.4)})`;
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
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

      {/* 2D Vector Stream Canvas (scrolls with page, fades out slowly) */}
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
