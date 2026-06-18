"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, CheckCircle2, Play, Terminal, Code2 } from "lucide-react";
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
  const [scrollProgress, setScrollProgress] = useState(0);

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

  // Scroll animations interpolation
  // Landing section fades out as we scroll down
  const landingOpacity = Math.max(0, 1 - scrollProgress * 2.2);
  const landingScale = Math.max(0.9, 1 - scrollProgress * 0.1);
  const landingTranslateY = -scrollProgress * 60;

  // Main homepage content (details/stats) fades and slides in
  const mainPageOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.5) * 2)); // starts at 50% scroll
  const mainPageTranslateY = Math.max(0, (1 - mainPageOpacity) * 50);

  // Mock UI Animations based on scroll
  // Phase 1 (Scroll 0% to 50%): IDE tilts and slides to the left
  const ideRotateX = Math.max(0, 12 - scrollProgress * 24); // 12deg to 0deg
  const ideRotateY = Math.min(0, -8 + scrollProgress * 16); // -8deg to 0deg
  const ideScale = 0.88 + Math.min(0.12, scrollProgress * 0.24); // zooms in slightly
  const ideTranslateX = -scrollProgress * 160; // slides left (on desktop)

  // Phase 2 (Scroll 20% to 70%): Output terminal fades in and slides from right
  const termOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.15) * 2));
  const termTranslateX = Math.max(0, 160 - (scrollProgress - 0.15) * 320); // slides from right

  // Phase 3 (Scroll 35% to 85%): Test cases running sequentially
  const testCase1Visible = scrollProgress > 0.35;
  const testCase2Visible = scrollProgress > 0.5;
  const testCase3Visible = scrollProgress > 0.65;

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none relative overflow-x-hidden scrollbar-thin pb-24 md:pb-0 scroll-smooth"
    >
      <Navbar />

      {/* Section 1: Intro Landing & Interactive Mock UI Showcase */}
      <div className="min-h-[145vh] w-full shrink-0 flex flex-col items-center relative z-10 pt-16 md:pt-28">
        
        {/* Landing Hero Header Text */}
        <div 
          className="text-center px-6 max-w-3xl space-y-4 transition-all duration-300"
          style={{
            opacity: landingOpacity,
            transform: `scale(${landingScale}) translateY(${landingTranslateY}px)`
          }}
        >
          <h1 className="text-6xl sm:text-8xl font-black tracking-wider text-white uppercase">
            OA Engine
          </h1>
          <p className="text-sm sm:text-base text-gray-400 font-medium tracking-wide max-w-xl mx-auto">
            A premium sandbox workspace for parsing and analyzing coding problems.
          </p>
          <div className="pt-2 flex items-center justify-center space-x-2 text-[10px] uppercase tracking-widest text-[#E8730C] font-black animate-pulse">
            <span>Scroll down to run code simulation</span>
            <ChevronDown size={12} className="text-[#E8730C]" />
          </div>
        </div>

        {/* ----------------------------------------------------
            INTERACTIVE MOCK UI SHOWCASE (ANIME FORWARD ON SCROLL)
            ---------------------------------------------------- */}
        <div className="w-full max-w-5xl px-6 mt-12 md:mt-16 flex flex-col md:flex-row items-center justify-center gap-6 relative">
          
          {/* WINDOW A: Mock Code Editor (IDE) */}
          <div
            className="w-full md:w-[54%] bg-[#080808] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-150 ease-out"
            style={{
              transform: `perspective(1000px) rotateX(${ideRotateX}deg) rotateY(${ideRotateY}deg) scale(${ideScale}) translateX(${typeof window !== "undefined" && window.innerWidth >= 768 ? ideTranslateX : 0}px)`,
              opacity: Math.max(0.2, 1 - scrollProgress * 0.4) // dims slightly as it moves left
            }}
          >
            {/* Window title bar */}
            <div className="bg-[#0f0f0f] px-4 py-3 flex items-center justify-between">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="text-[10px] font-mono text-gray-500 flex items-center space-x-1">
                <Code2 size={12} className="text-gray-600" />
                <span>solution.cpp</span>
              </div>
              <div className="w-10" />
            </div>

            {/* Code editor content */}
            <div className="p-5 font-mono text-[10px] sm:text-xs leading-relaxed text-[#c5c8c6] overflow-x-auto bg-[#050505]">
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">1</span>
                <span><span className="text-[#E8730C]">#include</span> <span className="text-green-500">&lt;iostream&gt;</span></span>
              </div>
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">2</span>
                <span><span className="text-[#E8730C]">#include</span> <span className="text-green-500">&lt;vector&gt;</span></span>
              </div>
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">3</span>
                <span />
              </div>
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">4</span>
                <span><span className="text-blue-400">int</span> <span className="text-yellow-400">findMaxSum</span>(<span className="text-purple-400">std</span>::<span className="text-purple-400">vector</span>&lt;<span className="text-blue-400">int</span>&gt;&amp; arr) &#123;</span>
              </div>
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">5</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">int</span> maxSum = <span className="text-red-400">0</span>, currentSum = <span className="text-red-400">0</span>;</span>
              </div>
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">6</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#E8730C]">for</span> (<span className="text-blue-400">int</span> num : arr) &#123;</span>
              </div>
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">7</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;currentSum = <span className="text-purple-400">std</span>::<span className="text-yellow-400">max</span>(num, currentSum + num);</span>
              </div>
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">8</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;maxSum = <span className="text-purple-400">std</span>::<span className="text-yellow-400">max</span>(maxSum, currentSum);</span>
              </div>
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">9</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;&#125;</span>
              </div>
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">10</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#E8730C]">return</span> maxSum;</span>
              </div>
              <div className="flex">
                <span className="text-gray-700 select-none text-right w-6 pr-3">11</span>
                <span>&#125;</span>
              </div>
            </div>
          </div>

          {/* WINDOW B: Mock Output Terminal (Appears on scroll) */}
          <div
            className="w-full md:w-[44%] bg-[#080808] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-150 ease-out"
            style={{
              opacity: termOpacity,
              transform: `translateX(${typeof window !== "undefined" && window.innerWidth >= 768 ? termTranslateX : 0}px)`,
              pointerEvents: termOpacity > 0.05 ? "auto" : "none"
            }}
          >
            {/* Title bar */}
            <div className="bg-[#0f0f0f] px-4 py-3 flex items-center justify-between">
              <div className="flex space-x-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Play size={8} className="text-zinc-400 fill-zinc-400" />
                </div>
                <span className="text-[10px] font-mono text-gray-500">Execution Panel</span>
              </div>
              <div className="text-[10px] font-mono text-[#E8730C] font-black uppercase tracking-wider flex items-center space-x-1">
                <Terminal size={12} />
                <span>Console</span>
              </div>
            </div>

            {/* Output Panel body */}
            <div className="p-5 font-mono text-[10px] sm:text-xs space-y-4 bg-[#050505] min-h-[195px] select-text">
              {/* Build status log */}
              <div className="space-y-1">
                <div className="text-gray-500">&gt; g++ -O3 solution.cpp -o main</div>
                <div className="text-green-500 font-bold">✓ Compilation Successful in 240ms</div>
                <div className="text-gray-500">&gt; ./main --run-all-tests</div>
              </div>

              {/* Dynamic scroll-linked test cases execution */}
              <div className="space-y-2 pt-1 border-t border-zinc-900">
                {testCase1Visible ? (
                  <div className="flex items-center justify-between animate-page-in">
                    <span className="text-gray-300">Test Case 1: Base Array</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-gray-500 text-[10px]">1.2ms</span>
                      <span className="text-[#00b8a3] font-black flex items-center space-x-0.5">
                        <CheckCircle2 size={12} /> <span>PASS</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600 italic select-none">Executing test cases...</div>
                )}

                {testCase2Visible && (
                  <div className="flex items-center justify-between animate-page-in">
                    <span className="text-gray-300">Test Case 2: Single Element</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-gray-500 text-[10px]">0.4ms</span>
                      <span className="text-[#00b8a3] font-black flex items-center space-x-0.5">
                        <CheckCircle2 size={12} /> <span>PASS</span>
                      </span>
                    </div>
                  </div>
                )}

                {testCase3Visible && (
                  <div className="flex items-center justify-between animate-page-in">
                    <span className="text-gray-300">Test Case 3: All Negative</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-gray-500 text-[10px]">0.8ms</span>
                      <span className="text-[#00b8a3] font-black flex items-center space-x-0.5">
                        <CheckCircle2 size={12} /> <span>PASS</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Final run performance analytics */}
              {testCase3Visible && (
                <div className="pt-2 mt-2 border-t border-zinc-900 text-white font-bold animate-page-in">
                  <span className="text-[#E8730C]">Engine Report:</span> 100% Tests Passed. <br />
                  <span className="text-gray-400 font-normal">Performance exceeds </span>
                  <span className="text-green-400">98.2%</span>
                  <span className="text-gray-400 font-normal"> of C++ submissions.</span>
                </div>
              )}
            </div>
          </div>

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
