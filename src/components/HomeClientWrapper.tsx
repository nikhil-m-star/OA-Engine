"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  return (
    <div className="min-h-screen bg-black text-[#eff2f6f2] flex flex-col font-sans select-none relative overflow-x-hidden pb-12">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto space-y-12 py-16">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-6xl sm:text-8xl font-black tracking-wider text-white uppercase leading-none">
            OA Engine
          </h1>
          <p className="text-sm sm:text-base text-gray-400 font-medium tracking-wide max-w-xl mx-auto">
            A premium sandbox workspace for parsing and analyzing coding problems.
          </p>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto pt-2">
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

        {/* Database Statistics Panel */}
        <div className="relative bg-[#0d0d0d] rounded-3xl p-6 sm:p-8 w-full max-w-2xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/[0.02]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-900">
            <div className="space-y-1 pt-4 md:pt-0 hover:scale-[1.05] transition-transform duration-300 cursor-default">
              <div className="text-4xl sm:text-5xl font-black text-white leading-none">
                {stats.total}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Total Problems
              </div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0 hover:scale-[1.05] transition-transform duration-300 cursor-default flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#00b8a3] leading-none">
                {stats.easy}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Easy
              </div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0 hover:scale-[1.05] transition-transform duration-300 cursor-default flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#ffc01e] leading-none">
                {stats.medium}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Medium
              </div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0 hover:scale-[1.05] transition-transform duration-300 cursor-default flex flex-col justify-center">
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
              className="px-6 py-3 bg-[#0d0d0d] hover:bg-[#111111] text-gray-300 hover:text-[#E8730C] rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-md border border-white/[0.02]"
            >
              Add New Problem
            </Link>
          </div>
        )}
      </main>

      {/* Bottom footer metadata */}
      <footer className="w-full max-w-4xl mx-auto px-6 pt-8 flex flex-col md:flex-row items-center justify-between text-gray-600 text-[10px] font-mono uppercase tracking-wider border-t border-zinc-900">
        <div>OA Engine © {new Date().getFullYear()}</div>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <span className="hover:text-[#E8730C] transition-colors cursor-default">Terminals Secured</span>
          <span className="hover:text-[#E8730C] transition-colors cursor-default">Sandboxed Execution v1.0</span>
        </div>
      </footer>
    </div>
  );
}
