"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, CheckCircle2, Play, Terminal, Code2, Sparkles, AlertCircle, HelpCircle, Activity } from "lucide-react";
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
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !scrollTrackRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const trackOffsetTop = scrollTrackRef.current.offsetTop;
      const trackHeight = scrollTrackRef.current.clientHeight;
      const containerHeight = containerRef.current.clientHeight;

      const totalScrollable = trackHeight - containerHeight;
      if (totalScrollable <= 0) return;

      const relativeScroll = scrollTop - trackOffsetTop;
      const progress = Math.min(Math.max(relativeScroll / totalScrollable, 0), 1);
      setScrollProgress(progress);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Scroll animations interpolation
  // Main homepage content (details/stats) fades and slides in
  const mainPageOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.90) * 10)); // starts at 90% scroll
  const mainPageTranslateY = Math.max(0, (1 - mainPageOpacity) * 50);

  // Mock UI Animations based on scroll progress (0.00 to 1.00)
  // Overall workspace opacity & entry
  const workspaceOpacity = scrollProgress < 0.10 ? (scrollProgress / 0.10) : scrollProgress > 0.92 ? Math.max(0, 1 - (scrollProgress - 0.92) * 12.5) : 1;
  const workspaceScale = scrollProgress < 0.10 ? 0.92 + (scrollProgress / 0.10) * 0.08 : scrollProgress > 0.92 ? Math.max(0.92, 1 - (scrollProgress - 0.92) * 0.08) : 1;
  const workspaceRotateX = Math.max(0, 12 - scrollProgress * 120); // tilts flat by progress = 0.10
  const workspaceRotateY = Math.min(0, -8 + scrollProgress * 80); // tilts flat by progress = 0.10

  // Set up phase state for natural time progression
  const [simPhase, setSimPhase] = useState<number>(0);
  const [phaseTime, setPhaseTime] = useState<number>(0);

  // Update simPhase based on scroll progress with clean hysteresis bands
  useEffect(() => {
    if (scrollProgress < 0.12) {
      if (simPhase !== 0) setSimPhase(0);
    } else if (scrollProgress >= 0.15 && scrollProgress < 0.38) {
      if (simPhase !== 1) setSimPhase(1);
    } else if (scrollProgress >= 0.40 && scrollProgress < 0.62) {
      if (simPhase !== 2) setSimPhase(2);
    } else if (scrollProgress >= 0.65 && scrollProgress < 0.88) {
      if (simPhase !== 3) setSimPhase(3);
    } else if (scrollProgress >= 0.90) {
      if (simPhase !== 4) setSimPhase(4);
    }
  }, [scrollProgress, simPhase]);

  // RequestAnimationFrame timer to tick phaseTime naturally
  useEffect(() => {
    setPhaseTime(0);
  }, [simPhase]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const update = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      setPhaseTime(prev => prev + dt);
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const lerp = (start: number, end: number, t: number) => {
    const clampedT = Math.min(Math.max(t, 0), 1);
    const easedT = easeInOutCubic(clampedT);
    return start + (end - start) * easedT;
  };

  // Declare variables derived from phase and timer
  let cursorX = 40;
  let cursorY = 250;
  let isClicking = false;
  let activeLeftTab = "generator-json";
  let activeRightTab = "description";
  
  let isJsonClicked = false;
  let isJsonRendered = false;
  
  let isAiParsing = false;
  let isAiRendered = false;
  
  let testCase1Visible = false;
  let testCase2Visible = false;
  let testCase3Visible = false;
  
  let resultsVisible = false;

  if (simPhase === 0) {
    cursorX = 40;
    cursorY = 250;
    isClicking = false;
    activeLeftTab = "generator-json";
    activeRightTab = "description";
  } else if (simPhase === 1) {
    // Phase 1: Click Render JSON (2.0s total)
    if (phaseTime < 800) {
      cursorX = lerp(40, 30, phaseTime / 800);
      cursorY = lerp(250, 395, phaseTime / 800);
    } else if (phaseTime < 1000) {
      cursorX = 30;
      cursorY = 395;
      isClicking = true;
    } else if (phaseTime < 2000) {
      cursorX = lerp(30, 40, (phaseTime - 1000) / 1000);
      cursorY = lerp(395, 250, (phaseTime - 1000) / 1000);
    } else {
      cursorX = 40;
      cursorY = 250;
    }
    activeLeftTab = "generator-json";
    activeRightTab = "description";
    isJsonClicked = phaseTime >= 1000 && phaseTime < 2000;
    isJsonRendered = phaseTime >= 2000;
  } else if (simPhase === 2) {
    // Phase 2: Click AI Question subtab, then click Parse & Render (2.6s total)
    isJsonRendered = true;
    if (phaseTime < 600) {
      cursorX = lerp(40, 14, phaseTime / 600);
      cursorY = lerp(250, 60, phaseTime / 600);
    } else if (phaseTime < 800) {
      cursorX = 14;
      cursorY = 60;
      isClicking = true;
    } else if (phaseTime < 1400) {
      cursorX = lerp(14, 24, (phaseTime - 800) / 600);
      cursorY = lerp(60, 395, (phaseTime - 800) / 600);
    } else if (phaseTime < 1600) {
      cursorX = 24;
      cursorY = 395;
      isClicking = true;
    } else if (phaseTime < 2600) {
      cursorX = lerp(24, 40, (phaseTime - 1600) / 1000);
      cursorY = lerp(395, 250, (phaseTime - 1600) / 1000);
    } else {
      cursorX = 40;
      cursorY = 250;
    }

    activeLeftTab = phaseTime >= 600 ? "generator-ai" : "generator-json";
    activeRightTab = "description";
    isAiParsing = phaseTime >= 1600 && phaseTime < 2600;
    isAiRendered = phaseTime >= 2600;
  } else if (simPhase === 3) {
    // Phase 3: Click Code Editor tab, then click Run (3.4s total)
    isJsonRendered = true;
    isAiRendered = true;
    if (phaseTime < 600) {
      cursorX = lerp(40, 27, phaseTime / 600);
      cursorY = lerp(250, 15, phaseTime / 600);
    } else if (phaseTime < 800) {
      cursorX = 27;
      cursorY = 15;
      isClicking = true;
    } else if (phaseTime < 1400) {
      cursorX = lerp(27, 36, (phaseTime - 800) / 600);
      cursorY = lerp(15, 415, (phaseTime - 800) / 600);
    } else if (phaseTime < 1600) {
      cursorX = 36;
      cursorY = 415;
      isClicking = true;
    } else if (phaseTime < 2600) {
      cursorX = lerp(36, 40, (phaseTime - 1600) / 1000);
      cursorY = lerp(415, 250, (phaseTime - 1600) / 1000);
    } else {
      cursorX = 40;
      cursorY = 250;
    }

    activeLeftTab = phaseTime >= 600 ? "code-editor" : "generator-ai";
    activeRightTab = phaseTime >= 1600 ? "console" : "description";
    testCase1Visible = phaseTime >= 2200;
    testCase2Visible = phaseTime >= 2800;
    testCase3Visible = phaseTime >= 3400;
  } else if (simPhase === 4) {
    // Phase 4: Click Submit, show Result tab (1.8s total)
    isJsonRendered = true;
    isAiRendered = true;
    activeLeftTab = "code-editor";
    activeRightTab = "console";
    testCase1Visible = true;
    testCase2Visible = true;
    testCase3Visible = true;

    if (phaseTime < 600) {
      cursorX = lerp(40, 43, phaseTime / 600);
      cursorY = lerp(250, 415, phaseTime / 600);
    } else if (phaseTime < 800) {
      cursorX = 43;
      cursorY = 415;
      isClicking = true;
    } else if (phaseTime < 1800) {
      cursorX = lerp(43, 40, (phaseTime - 800) / 1000);
      cursorY = lerp(415, 250, (phaseTime - 800) / 1000);
    } else {
      cursorX = 40;
      cursorY = 250;
    }

    resultsVisible = phaseTime >= 800;
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none relative overflow-x-hidden scrollbar-thin pb-24 md:pb-0 scroll-smooth"
    >
      <Navbar />

      {/* Section 1: Hero Landing (Non-sticky, scrolls up naturally) */}
      <div className="h-[90vh] w-full shrink-0 flex flex-col items-center justify-center relative z-10 pt-16 text-center px-6 max-w-3xl mx-auto space-y-4">
        <h1 className="text-6xl sm:text-8xl font-black tracking-wider text-white uppercase leading-none">
          OA Engine
        </h1>
        <p className="text-sm sm:text-base text-gray-400 font-medium tracking-wide max-w-xl mx-auto">
          A premium sandbox workspace for parsing and analyzing coding problems.
        </p>
        <div className="pt-4 flex items-center justify-center space-x-2 text-[10px] uppercase tracking-widest text-[#E8730C] font-black animate-pulse cursor-default">
          <span>Scroll down to run code simulation</span>
          <ChevronDown size={12} className="text-[#E8730C]" />
        </div>
      </div>

      {/* Section 2: Pinned Scroll Track Section */}
      <div ref={scrollTrackRef} className="relative w-full h-[600vh] shrink-0">
        
        {/* Sticky viewport container */}
        <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center z-10">
          
          {/* ----------------------------------------------------
              INTERACTIVE MOCK UI SHOWCASE (ANIME FORWARD ON SCROLL)
              ---------------------------------------------------- */}
          <div 
            className="w-full max-w-5xl px-6 flex flex-col lg:flex-row items-stretch justify-center gap-6 relative transition-all duration-150 ease-out"
            style={{
              opacity: workspaceOpacity,
              transform: `perspective(1000px) rotateX(${workspaceRotateX}deg) rotateY(${workspaceRotateY}deg) scale(${workspaceScale})`,
              pointerEvents: workspaceOpacity > 0.05 ? "auto" : "none"
            }}
          >
            
            {/* WINDOW A: Left Workspace Panel (Generator or Code Editor) */}
            <div className="w-full lg:w-[48%] h-[440px] bg-[#080808] border border-white/[0.03] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative">
              
              {/* Window Tab Bar */}
              <div className="bg-[#0f0f0f] px-4 py-3 flex items-center justify-between border-b border-white/[0.03] shrink-0 font-sans">
                <div className="flex space-x-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                
                {/* Active tab tags */}
                <div className="flex space-x-4 text-[10px] font-bold uppercase tracking-wider">
                  <span className={`pb-1 transition-all ${activeLeftTab.startsWith("generator") ? "text-[#E8730C] border-b-2 border-[#E8730C]" : "text-gray-500"}`}>
                    Generator
                  </span>
                  <span className={`pb-1 transition-all ${
                    isClicking && cursorX === 27 && cursorY === 15 ? "scale-95 text-[#F28B2D]" : ""
                  } ${activeLeftTab === "code-editor" ? "text-[#E8730C] border-b-2 border-[#E8730C]" : "text-gray-500"}`}>
                    Code Editor
                  </span>
                </div>
                
                <div className="text-[10px] text-gray-500 shrink-0 font-sans">
                  {activeLeftTab === "code-editor" ? "solution.cpp" : "workspace.json"}
                </div>
              </div>

              {/* Subtab Bar for Generator */}
              {activeLeftTab.startsWith("generator") && (
                <div className="bg-[#030303] px-4 py-2 flex space-x-2 border-b border-white/[0.02] shrink-0 font-sans">
                  <span className={`px-2.5 py-1 rounded text-[9px] font-bold tracking-wider transition-all uppercase ${activeLeftTab === "generator-json" ? "bg-[#111111] text-[#E8730C]" : "text-gray-500"}`}>
                    JSON Parser
                  </span>
                  <span className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[9px] font-bold tracking-wider transition-all uppercase ${
                    isClicking && cursorX === 14 && cursorY === 60 ? "scale-95 bg-zinc-900" : ""
                  } ${activeLeftTab === "generator-ai" ? "bg-[#111111] text-[#E8730C]" : "text-gray-500"}`}>
                    <Sparkles size={8} fill={activeLeftTab === "generator-ai" ? "#E8730C" : "none"} />
                    <span>AI Question</span>
                  </span>
                </div>
              )}

              {/* Left Panel Body Content */}
              <div className="flex-grow p-4 sm:p-5 text-[10px] sm:text-xs leading-relaxed overflow-y-auto bg-[#050505] scrollbar-thin select-text">
                
                {/* 1. JSON Parser View */}
                {activeLeftTab === "generator-json" && (
                  <div className="h-full flex flex-col justify-between space-y-3 font-sans">
                    <div className="flex-grow bg-black p-3 rounded-lg border border-white/[0.02] text-gray-400 font-mono text-[9px] sm:text-[10px] overflow-hidden whitespace-pre">
                      {`{
  "id": 1,
  "title": "Two Sum",
  "difficulty": "Easy",
  "tags": ["Array", "Hash Map"],
  "description": "<p>Given an array of integers...</p>"
}`}
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="px-3 py-2 text-[9px] bg-zinc-900 text-zinc-400 rounded-md font-bold cursor-pointer">Format</div>
                      <div className={`flex-grow flex items-center justify-center space-x-1.5 px-3 py-2 text-[9px] font-black rounded-md transition-all ${
                        isJsonRendered 
                          ? "bg-green-950/40 text-green-400 border border-green-900/50" 
                          : isJsonClicked 
                            ? "bg-[#E8730C]/60 text-black animate-pulse" 
                            : "bg-[#E8730C] text-black"
                      } ${
                        isClicking && cursorX === 30 && cursorY === 395 ? "scale-95 bg-[#F28B2D]" : ""
                      }`}>
                        <Play size={10} fill={isJsonRendered ? "none" : "currentColor"} />
                        <span>{isJsonRendered ? "Success ✓" : isJsonClicked ? "Rendering..." : "Render JSON"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. AI Generator View */}
                {activeLeftTab === "generator-ai" && (
                  <div className="h-full flex flex-col justify-between space-y-3 font-sans">
                    <div className="flex-grow bg-black p-3 rounded-lg border border-white/[0.02] text-zinc-300 text-[10px] sm:text-xs overflow-hidden flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-zinc-650 block text-[8px] uppercase tracking-wider font-bold">Description Text</span>
                        <div className="text-white font-medium leading-relaxed italic">
                          "Generate a C++ problem for finding the maximum subarray sum in O(N)."
                        </div>
                      </div>
                      <div className="space-y-1 mt-2">
                        <span className="text-zinc-650 block text-[8px] uppercase tracking-wider font-bold">Companies</span>
                        <div className="text-zinc-400 font-bold">Google, Amazon</div>
                      </div>
                    </div>
                    
                    <div className={`w-full flex items-center justify-center space-x-1.5 px-3 py-2.5 text-[9px] font-black rounded-md transition-all shrink-0 ${
                      isAiRendered 
                        ? "bg-green-950/40 text-green-400 border border-green-900/50" 
                        : isAiParsing 
                          ? "bg-[#E8730C]/50 text-black" 
                          : "bg-[#E8730C] text-black"
                    } ${
                      isClicking && cursorX === 24 && cursorY === 395 ? "scale-95 bg-[#F28B2D]" : ""
                    }`}>
                      {isAiParsing ? (
                        <div className="w-2.5 h-2.5 border border-t-black border-r-transparent border-b-black border-l-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles size={10} fill={isAiRendered ? "none" : "currentColor"} />
                      )}
                      <span>{isAiRendered ? "Success ✓" : isAiParsing ? "AI Parsing Description..." : "Parse & Render"}</span>
                    </div>
                  </div>
                )}

                {/* 3. C++ Code Editor View */}
                {activeLeftTab === "code-editor" && (
                  <div className="space-y-0.5 font-mono text-[#c5c8c6]">
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">1</span><span><span className="text-purple-400">class</span> <span className="text-yellow-400">Solution</span> &#123;</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">2</span><span><span className="text-purple-400">public</span>:</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">3</span><span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">int</span> <span className="text-yellow-400">maxSubArray</span>(<span className="text-purple-400">vector</span>&lt;<span className="text-blue-400">int</span>&gt;&amp; nums) &#123;</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">4</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">int</span> maxSum = nums[<span className="text-red-400">0</span>];</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">5</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">int</span> currentSum = nums[<span className="text-red-400">0</span>];</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">6</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#E8730C]">for</span> (<span className="text-blue-400">int</span> i = <span className="text-red-400">1</span>; i &lt; nums.<span className="text-yellow-400">size</span>(); i++) &#123;</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">7</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;currentSum = <span className="text-yellow-400">max</span>(nums[i], currentSum + nums[i]);</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">8</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;maxSum = <span className="text-yellow-400">max</span>(maxSum, currentSum);</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">9</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#125;</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">10</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#E8730C]">return</span> maxSum;</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">11</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&#125;</span></div>
                    <div className="flex"><span className="text-gray-700 select-none text-right w-6 pr-3 font-sans">12</span><span>&#125;;</span></div>
                  </div>
                )}
              </div>

              {/* Code Editor Bottom Action Bar */}
              {activeLeftTab === "code-editor" && (
                <div className="bg-[#0f0f0f] px-4 py-2.5 flex items-center justify-between border-t border-white/[0.03] shrink-0 font-sans">
                  <span className="text-[9px] text-zinc-500 font-medium">solution.cpp • Saved</span>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 bg-zinc-900 text-zinc-300 rounded font-bold text-[9px] flex items-center space-x-1 transition-all ${
                      isClicking && cursorX === 36 && cursorY === 415 ? "bg-zinc-800 scale-95" : ""
                    }`}>
                      <Play size={8} className="fill-zinc-300 text-zinc-300" />
                      <span>Run</span>
                    </div>
                    <div className={`px-3 py-1 bg-[#E8730C] text-black rounded font-black text-[9px] flex items-center space-x-1 transition-all ${
                      isClicking && cursorX === 43 && cursorY === 415 ? "bg-[#F28B2D] scale-95" : ""
                    }`}>
                      <span>Submit</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WINDOW B: Right Output/Description/Console Panel */}
            <div className="w-full lg:w-[48%] h-[440px] flex flex-col overflow-hidden">
              
              {/* Tab Case A: Description Panel */}
              {activeRightTab === "description" ? (
                <div className="h-full bg-[#080808] border border-white/[0.03] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-sans">
                  {/* Title Bar */}
                  <div className="bg-[#0f0f0f] px-4 py-3 flex items-center justify-between border-b border-white/[0.03]">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>
                    <span className="text-[10px] text-[#E8730C] font-bold uppercase tracking-wider">Problem Description</span>
                    <span className="w-10" />
                  </div>

                  {/* Body Content */}
                  <div className="flex-grow p-4 sm:p-5 overflow-y-auto bg-[#050505] scrollbar-thin text-xs space-y-4">
                    {!isJsonRendered ? (
                      /* Empty State */
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-10">
                        <HelpCircle size={36} className="text-zinc-800 mb-3 animate-pulse" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Workspace Pending</span>
                        <p className="text-[10px] text-zinc-650 mt-1.5 max-w-[260px] leading-relaxed">
                          Pasting a structured JSON object or running the AI generator will render the question panel here.
                        </p>
                      </div>
                    ) : !isAiRendered ? (
                      /* Rendered Two Sum Description */
                      <div className="space-y-3 animate-page-in">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-base font-bold text-white leading-none">1. Two Sum</h3>
                          <span className="px-2 py-0.5 text-[8px] bg-green-500/10 text-[#00b8a3] rounded-full font-bold uppercase tracking-wider">Easy</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 rounded text-[8px] font-semibold">Array</span>
                          <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 rounded text-[8px] font-semibold">Hash Map</span>
                          <span className="px-2 py-0.5 bg-[#00b8a3]/10 text-[#00b8a3] rounded text-[8px] font-semibold">Google</span>
                          <span className="px-2 py-0.5 bg-[#00b8a3]/10 text-[#00b8a3] rounded text-[8px] font-semibold">Meta</span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-[11px] pt-1">
                          Given an array of integers <code className="bg-zinc-900 px-1 rounded text-[#E8730C] font-mono text-[10px]">nums</code> and an integer <code className="bg-zinc-900 px-1 rounded text-[#E8730C] font-mono text-[10px]">target</code>, return <i>indices of the two numbers such that they add up to <code>target</code></i>.
                        </p>
                        <div className="text-[10px] space-y-1 text-zinc-500 border-t border-zinc-900/80 pt-2.5">
                          <div className="font-bold text-zinc-400 uppercase tracking-widest text-[8px]">Constraints:</div>
                          <div className="font-mono text-[9px] text-zinc-400">• <code>2 &lt;= nums.length &lt;= 10^4</code></div>
                          <div className="font-mono text-[9px] text-zinc-400">• <code>-10^9 &lt;= nums[i] &lt;= 10^9</code></div>
                        </div>
                      </div>
                    ) : (
                      /* AI Rendered Max Subarray Description */
                      <div className="space-y-3 animate-page-in">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-base font-bold text-white leading-none">53. Maximum Subarray</h3>
                          <span className="px-2 py-0.5 text-[8px] bg-yellow-500/10 text-[#ffc01e] rounded-full font-bold uppercase tracking-wider">Medium</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 rounded text-[8px] font-semibold">Array</span>
                          <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 rounded text-[8px] font-semibold">Dynamic Programming</span>
                          <span className="px-2 py-0.5 bg-[#ffc01e]/10 text-[#ffc01e] rounded text-[8px] font-semibold">Amazon</span>
                          <span className="px-2 py-0.5 bg-[#ffc01e]/10 text-[#ffc01e] rounded text-[8px] font-semibold">Google</span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-[11px] pt-1">
                          Given an integer array <code className="bg-zinc-900 px-1 rounded text-[#E8730C] font-mono text-[10px]">nums</code>, find the subarray with the largest sum, and return <i>its sum</i>.
                        </p>
                        <div className="text-[10px] space-y-1 text-zinc-500 border-t border-zinc-900/80 pt-2.5">
                          <div className="font-bold text-zinc-400 uppercase tracking-widest text-[8px]">Constraints:</div>
                          <div className="font-mono text-[9px] text-zinc-400">• <code>1 &lt;= nums.length &lt;= 10^5</code></div>
                          <div className="font-mono text-[9px] text-zinc-400">• <code>-10^4 &lt;= nums[i] &lt;= 10^4</code></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Tab Case B: Console & Execution with Split Window results drawer (No SVG chart) */
                <div className="h-full bg-[#080808] border border-white/[0.03] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-sans">
                  
                  {/* Title Bar */}
                  <div className="bg-[#0f0f0f] px-4 py-3 flex items-center justify-between border-b border-white/[0.03] shrink-0">
                    <div className="flex space-x-1.5 shrink-0">
                      <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Play size={8} className="text-zinc-400 fill-zinc-400" />
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold">Execution Panel</span>
                    </div>

                    {/* Console Tab Selectors */}
                    <div className="flex space-x-4 text-[10px] font-bold uppercase tracking-wider">
                      <span className={`pb-0.5 transition-all ${!resultsVisible ? "text-[#E8730C] border-b-2 border-[#E8730C]" : "text-gray-500"}`}>
                        Testcase
                      </span>
                      <span className={`pb-0.5 transition-all ${resultsVisible ? "text-[#E8730C] border-b-2 border-[#E8730C]" : "text-gray-500"}`}>
                        Result
                      </span>
                    </div>

                    <div className="text-[10px] text-[#E8730C] font-black uppercase tracking-wider flex items-center space-x-1 shrink-0">
                      <Terminal size={12} />
                      <span>Console</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-grow p-4 sm:p-5 bg-[#050505] overflow-y-auto scrollbar-thin select-text">
                    {!resultsVisible ? (
                      /* 1. Testcase Logs View */
                      <div className="space-y-3 font-mono text-[9px] sm:text-xs">
                        <div className="space-y-0.5">
                          <div className="text-gray-500 font-sans">&gt; g++ -O3 solution.cpp -o main</div>
                          <div className="text-green-500 font-bold font-sans">✓ Compilation Successful in 185ms</div>
                          <div className="text-gray-500 font-sans">&gt; ./main --run-all-tests</div>
                        </div>

                        <div className="space-y-1.5 pt-1.5 border-t border-zinc-900 font-sans text-[10px] sm:text-xs">
                          {testCase1Visible ? (
                            <div className="flex items-center justify-between animate-page-in">
                              <span className="text-gray-300">Test Case 1: [2,-1,3,4,-1,2,1,-5,4]</span>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-gray-500 text-[9px]">0.1ms</span>
                                <span className="text-[#00b8a3] font-black flex items-center space-x-0.5">
                                  <CheckCircle2 size={11} /> <span>PASS</span>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-650 italic select-none">Executing test cases...</div>
                          )}

                          {testCase2Visible && (
                            <div className="flex items-center justify-between animate-page-in">
                              <span className="text-gray-300">Test Case 2: [1]</span>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-gray-500 text-[9px]">0.0ms</span>
                                <span className="text-[#00b8a3] font-black flex items-center space-x-0.5">
                                  <CheckCircle2 size={11} /> <span>PASS</span>
                                </span>
                              </div>
                            </div>
                          )}

                          {testCase3Visible && (
                            <div className="flex items-center justify-between animate-page-in">
                              <span className="text-gray-300">Test Case 3: [5,4,-1,7,8]</span>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-gray-500 text-[9px]">0.1ms</span>
                                <span className="text-[#00b8a3] font-black flex items-center space-x-0.5">
                                  <CheckCircle2 size={11} /> <span>PASS</span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* 2. Accepted Results Drawer (Accurate to App's CodeEditor.tsx) */
                      <div className="space-y-4 animate-page-in">
                        
                        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-900/80">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 size={16} className="text-[#00b8a3]" />
                            <span className="text-[#00b8a3] font-bold text-sm sm:text-base">Accepted</span>
                            
                            <div className="flex items-center space-x-2.5 text-[9px] sm:text-[10px] text-gray-400 bg-[#111111] px-2.5 py-1 rounded ml-2 font-bold font-sans">
                              <span>Runtime: 12 ms</span>
                              <span>Memory: 5.4 MB</span>
                            </div>
                          </div>
                        </div>

                        {/* Input, Output, Expected Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                          <div className="space-y-1">
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Input</span>
                            <div className="bg-black p-2.5 rounded text-zinc-300 font-mono text-[9px] sm:text-[10px] select-all max-h-[105px] overflow-y-auto whitespace-pre-wrap leading-relaxed scrollbar-thin">
                              nums = [2,-1,3,4,-1,2,1,-5,4]
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Output</span>
                            <div className="bg-black p-2.5 rounded text-[#00b8a3] font-mono text-[9px] sm:text-[10px] select-all max-h-[105px] overflow-y-auto whitespace-pre-wrap leading-relaxed font-bold scrollbar-thin">
                              6
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Expected</span>
                            <div className="bg-black p-2.5 rounded text-zinc-300 font-mono text-[9px] sm:text-[10px] select-all max-h-[105px] overflow-y-auto whitespace-pre-wrap leading-relaxed scrollbar-thin">
                              6
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Mouse pointer overlay - only shown on large screens for simulation realism */}
            <div 
              className="absolute pointer-events-none transition-all duration-75 hidden lg:block"
              style={{
                left: `${cursorX}%`,
                top: `${cursorY}px`,
                transform: `translate(-4px, -2px) ${isClicking ? 'scale(0.85)' : 'scale(1)'}`,
                zIndex: 9999,
              }}
            >
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">
                  <path 
                    d="M5.65376 12.3825L10.7485 14.1217L12.4878 19.2165C12.8711 20.3402 14.4348 20.3551 14.8394 19.2415L20.8921 2.59628C21.2427 1.63216 20.2381 0.627576 19.274 0.978168L2.62881 7.03088C1.51523 7.43547 1.53011 8.99912 2.65376 9.38249L5.65376 12.3825Z" 
                    fill="white" 
                    stroke="black" 
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                </svg>
                {isClicking && (
                  <span className="absolute w-10 h-10 -left-[14px] -top-[14px] rounded-full bg-[#E8730C]/40 border border-[#E8730C]/60 animate-ping opacity-75 pointer-events-none" />
                )}
              </div>
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
