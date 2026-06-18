"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Terminal } from "lucide-react";
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

interface Point3D {
  x: number;
  y: number;
  z: number;
  ox: number; // original coordinates
  oy: number;
  oz: number;
}

export default function HomeClientWrapper({ stats, isAdmin }: HomeClientWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Mouse interaction states
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isDown: false, lastX: 0, lastY: 0 });
  const rotationRef = useRef({ x: 0, y: 0, velX: 0.002, velY: 0.002 });

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const height = window.innerHeight;
      
      // Calculate scroll progress from 0 to 1 over the first viewport height
      const progress = Math.min(Math.max(scrollTop / height, 0), 1);
      setScrollProgress(progress);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    
    // Also listen on window in case page scrolls standard
    window.addEventListener("scroll", handleScroll);

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 3D Canvas Renderer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initialize 3D particles on a sphere
    const points: Point3D[] = [];
    const numPoints = 200;
    
    // Golden ratio sphere distribution
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      const x = Math.cos(theta) * Math.sin(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(phi);
      points.push({ x, y, z, ox: x, oy: y, oz: z });
    }

    // Precalculate connections (distances < 0.28 in 3D unit space)
    const connections: [number, number][] = [];
    for (let i = 0; i < numPoints; i++) {
      for (let j = i + 1; j < numPoints; j++) {
        const dx = points[i].ox - points[j].ox;
        const dy = points[i].oy - points[j].oy;
        const dz = points[i].oz - points[j].oz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.28) {
          connections.push([i, j]);
        }
      }
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse handlers
    const onMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = (e.clientY / window.innerHeight) * 2 - 1;

      if (mouseRef.current.isDown) {
        const deltaX = e.clientX - mouseRef.current.lastX;
        const deltaY = e.clientY - mouseRef.current.lastY;
        rotationRef.current.velY += deltaX * 0.002;
        rotationRef.current.velX += deltaY * 0.002;
        mouseRef.current.lastX = e.clientX;
        mouseRef.current.lastY = e.clientY;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const onMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    // Simulation loop variables
    let time = 0;
    const render = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      // Current scroll state from our state/ref
      // Using a local cached scroll progress from state
      const currentScroll = scrollProgress;

      // Damp mouse tracking
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Update rotation angles with drift velocity and mouse offsets
      rotationRef.current.velX *= 0.95; // friction
      rotationRef.current.velY *= 0.95;
      
      const autoRotateSpeed = 0.005 + currentScroll * 0.02; // spin faster as we scroll
      rotationRef.current.x += rotationRef.current.velX + autoRotateSpeed * 0.4;
      rotationRef.current.y += rotationRef.current.velY + autoRotateSpeed;

      const rx = rotationRef.current.x + mouseRef.current.y * 0.3;
      const ry = rotationRef.current.y + mouseRef.current.x * 0.3;

      // Camera config
      // Fly through: camera moves from distance 3.0 to 0.1
      // When it goes past 1.0, we enter inside the sphere.
      const disperse = 1 + currentScroll * 5.0; // expand sphere radius
      const cameraDistance = 3.0 - currentScroll * 2.85; 
      const focalLength = Math.min(width, height) * 0.55;

      const projectedPoints: { x: number; y: number; z: number; visible: boolean; alpha: number }[] = [];

      // Rotate and project points
      for (let i = 0; i < numPoints; i++) {
        const p = points[i];

        // 3D rotations
        // Rotate Y
        let x1 = p.ox * Math.cos(ry) - p.oz * Math.sin(ry);
        let z1 = p.ox * Math.sin(ry) + p.oz * Math.cos(ry);

        // Rotate X
        let y2 = p.oy * Math.cos(rx) - z1 * Math.sin(rx);
        let z2 = p.oy * Math.sin(rx) + z1 * Math.cos(rx);

        // Apply scale/dispersion
        const rx_scaled = x1 * disperse;
        const ry_scaled = y2 * disperse;
        const rz_scaled = z2 * disperse;

        const zProjected = cameraDistance - rz_scaled;

        if (zProjected > 0.08) {
          const projX = (rx_scaled / zProjected) * focalLength + width / 2;
          const projY = (ry_scaled / zProjected) * focalLength + height / 2;
          
          // Calculate brightness based on distance and scroll
          // Particles passing close to camera fade out to avoid harsh clipping
          let opacity = 0.85;
          if (zProjected < 0.5) {
            opacity = Math.max(0, (zProjected - 0.08) / 0.42) * 0.85;
          }
          
          // Overall fade as scroll completes to keep background clean
          opacity *= (1 - currentScroll * 0.4);

          projectedPoints.push({
            x: projX,
            y: projY,
            z: zProjected,
            visible: projX >= 0 && projX <= width && projY >= 0 && projY <= height,
            alpha: opacity
          });
        } else {
          projectedPoints.push({ x: 0, y: 0, z: zProjected, visible: false, alpha: 0 });
        }
      }

      // Draw connection lines (only visible in early scroll stage)
      const lineAlphaFactor = Math.max(0, 1 - currentScroll * 2.5); // completely fade lines by 40% scroll
      if (lineAlphaFactor > 0.01) {
        ctx.lineWidth = 0.55;
        for (let k = 0; k < connections.length; k++) {
          const [i, j] = connections[k];
          const p1 = projectedPoints[i];
          const p2 = projectedPoints[j];

          if (p1 && p2 && p1.visible && p2.visible && p1.z > 0 && p2.z > 0) {
            const avgAlpha = (p1.alpha + p2.alpha) / 2 * lineAlphaFactor * 0.15;
            ctx.strokeStyle = `rgba(232, 115, 12, ${avgAlpha})`; // signature orange #E8730C
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (let i = 0; i < numPoints; i++) {
        const p = projectedPoints[i];
        if (p && p.visible) {
          // Point size based on proximity to camera
          const size = Math.max(0.5, (1.8 / p.z));
          
          // Blend particle color from signature orange to white
          ctx.fillStyle = `rgba(232, 115, 12, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();

          // Small white core for closer particles to give a premium glow
          if (p.z < 1.8 && p.alpha > 0.1) {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
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
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [scrollProgress]);

  // Interpolations for scroll transitions
  const landingOpacity = Math.max(0, 1 - scrollProgress * 1.8);
  const landingScale = Math.max(0.85, 1 - scrollProgress * 0.15);
  const landingTranslateY = -scrollProgress * 80; // slide up slightly

  const mainPageOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.25) * 1.33)); // starts fading in after 25% scroll
  const mainPageTranslateY = Math.max(0, (1 - mainPageOpacity) * 40); // slide up as it fades in

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none relative overflow-x-hidden scrollbar-thin pb-24 md:pb-0 scroll-smooth"
    >
      <Navbar />

      {/* Interactive 3D Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
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
