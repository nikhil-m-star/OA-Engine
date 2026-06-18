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

interface RibbonPoint {
  x: number; // local x (-1.5 to 1.5)
  z: number; // local z depth (-0.5 to 0.5)
  ox: number; // original local x
  oz: number; // original local z
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

  // 3D Ribbon Canvas Renderer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // ----------------------------------------------------
    // INITIALIZE 3D VECTOR RIBBONS (No dots!)
    // ----------------------------------------------------
    const numRibbons = 8;
    const pointsPerRibbon = 35;
    const ribbons: RibbonPoint[][] = [];

    for (let r = 0; r < numRibbons; r++) {
      const ribbonPoints: RibbonPoint[] = [];
      // Z-depth spacing for each ribbon to separate them in 3D space
      const rz = ((r / (numRibbons - 1)) - 0.5) * 1.0; 
      
      for (let p = 0; p < pointsPerRibbon; p++) {
        // X-axis coordinate spanning from -1.6 to 1.6
        const rx = ((p / (pointsPerRibbon - 1)) - 0.5) * 3.2;
        ribbonPoints.push({
          x: rx, z: rz,
          ox: rx, oz: rz
        });
      }
      ribbons.push(ribbonPoints);
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

      // 3D Perspective Rotation Angles
      const mouseFactorX = mouseRef.current.active ? (mouseRef.current.x / width - 0.5) * 0.25 : 0;
      const mouseFactorY = mouseRef.current.active ? (mouseRef.current.y / height - 0.5) * 0.12 : 0;

      const angleY = time * 0.0015 + mouseFactorX;
      // Tilts from a 3D landscape view (0.48 rad) to flat horizontal on scroll
      const angleX = 0.48 - currentScroll * 0.45 + mouseFactorY;

      // Camera config
      const cameraDistance = 2.3;
      const focalLength = Math.min(width, height) * 0.75;

      // Wave configurations
      // Waves flatten out as the user scrolls (symbolizes organized data)
      const baseAmplitude = 0.25 * (1 - currentScroll * 0.96);
      const waveFreqX = 1.9;
      const waveFreqZ = 1.5;

      // Project all ribbons
      interface ProjectedRibbonPoint {
        x: number;
        y: number;
        z: number;
        visible: boolean;
        alpha: number;
      }
      
      const projectedRibbons: ProjectedRibbonPoint[][] = [];
      const ribbonAverageDepths: { index: number; avgZ: number }[] = [];

      for (let r = 0; r < numRibbons; r++) {
        const ribbon = ribbons[r];
        const projectedRibbon: ProjectedRibbonPoint[] = [];
        let totalZ = 0;
        let visibleCount = 0;

        for (let p = 0; p < pointsPerRibbon; p++) {
          const pt = ribbon[p];

          // 3D Wave heights
          const waveX = pt.ox * waveFreqX + time * 0.022 + r * 0.4;
          const waveZ = pt.oz * waveFreqZ + time * 0.014;
          const gy = Math.sin(waveX) * Math.cos(waveZ) * baseAmplitude;

          // 3D rotations
          // Rotate Y
          let x1 = pt.ox * Math.cos(angleY) - pt.oz * Math.sin(angleY);
          let z1 = pt.ox * Math.sin(angleY) + pt.oz * Math.cos(angleY);

          // Rotate X (tilt)
          let y2 = gy * Math.cos(angleX) - z1 * Math.sin(angleX);
          let z2 = gy * Math.sin(angleX) + z1 * Math.cos(angleX);

          const zProjected = cameraDistance - z2;

          if (zProjected > 0.05) {
            let projX = (x1 / zProjected) * focalLength + width / 2;
            let projY = (y2 / zProjected) * focalLength + height / 2;

            // Interactive Cursor Gravity (Bends ribbons towards cursor)
            if (mouseRef.current.active) {
              const dx = mouseRef.current.x - projX;
              const dy = mouseRef.current.y - projY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 150) {
                const force = (150 - dist) / 150;
                // Magnetically attract the line to the mouse
                projX += dx * force * 0.28 * (1 - currentScroll);
                projY += dy * force * 0.28 * (1 - currentScroll);
              }
            }

            // Depth opacity
            const zDepthFactor = Math.min(1, Math.max(0.15, (cameraDistance + 0.6 - zProjected) / 1.2));
            const opacity = zDepthFactor * 0.8;

            projectedRibbon.push({
              x: projX,
              y: projY,
              z: zProjected,
              visible: true,
              alpha: opacity
            });

            totalZ += zProjected;
            visibleCount++;
          } else {
            projectedRibbon.push({ x: 0, y: 0, z: zProjected, visible: false, alpha: 0 });
          }
        }

        projectedRibbons.push(projectedRibbon);
        ribbonAverageDepths.push({
          index: r,
          avgZ: visibleCount > 0 ? totalZ / visibleCount : 999
        });
      }

      // Sort ribbons by depth (Furthest first, back-to-front rendering)
      ribbonAverageDepths.sort((a, b) => b.avgZ - a.avgZ);

      // ----------------------------------------------------
      // RENDER SMOOTH GLOWING LINES (NO DOTS)
      // ----------------------------------------------------
      for (let k = 0; k < ribbonAverageDepths.length; k++) {
        const rIndex = ribbonAverageDepths[k].index;
        const pts = projectedRibbons[rIndex];
        
        // Ribbon styling
        // Core orange lines with wide, semi-transparent glows underneath
        const strokeAlpha = 0.55 - (rIndex * 0.04); // vary opacity across ribbons

        // A. Draw Outer Glow Bloom Line (width = 5)
        ctx.lineWidth = 5.0;
        ctx.strokeStyle = `rgba(232, 115, 12, ${strokeAlpha * 0.06})`;
        ctx.beginPath();
        let startedGlow = false;
        for (let p = 0; p < pointsPerRibbon; p++) {
          const pt = pts[p];
          if (pt && pt.visible) {
            if (!startedGlow) {
              ctx.moveTo(pt.x, pt.y);
              startedGlow = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        ctx.stroke();

        // B. Draw Sharp Glowing Core Line (width = 1.6)
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = `rgba(232, 115, 12, ${strokeAlpha * 0.75})`;
        ctx.beginPath();
        let startedCore = false;
        for (let p = 0; p < pointsPerRibbon; p++) {
          const pt = pts[p];
          if (pt && pt.visible) {
            if (!startedCore) {
              ctx.moveTo(pt.x, pt.y);
              startedCore = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        ctx.stroke();

        // C. Draw White Center Core for the top ribbons (simulates intense neon core)
        if (rIndex < 3) {
          ctx.lineWidth = 0.6;
          ctx.strokeStyle = `rgba(255, 255, 255, ${strokeAlpha * 0.5})`;
          ctx.beginPath();
          let startedWhite = false;
          for (let p = 0; p < pointsPerRibbon; p++) {
            const pt = pts[p];
            if (pt && pt.visible) {
              if (!startedWhite) {
                ctx.moveTo(pt.x, pt.y);
                startedWhite = true;
              } else {
                ctx.lineTo(pt.x, pt.y);
              }
            }
          }
          ctx.stroke();
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

      {/* 3D Flowing Vector Ribbons (fades cleanly on scroll) */}
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
