"use client";

import React from "react";
import Link from "next/link";
import { RefreshCw, Database } from "lucide-react";

interface NavbarProps {
  problemId?: number;
  problemTitle?: string;
  onReset?: () => void;
  hasProblem: boolean;
}

export default function Navbar({ problemId, problemTitle, onReset, hasProblem }: NavbarProps) {
  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-[#282828] bg-[#1a1a1a] px-4 text-[#eff2f6f2] select-none">
      {/* Left section: Logo & Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {/* Custom LeetCode-like logo */}
          <div className="relative flex h-5 w-5 items-center justify-center rounded bg-[#ffa116] font-bold text-black text-[11px] shadow">
            L
          </div>
          <span className="font-semibold text-xs tracking-wider text-white">LeetCode OA Engine</span>
        </div>
      </div>

      {/* Middle section: Active Problem Info */}
      <div className="flex items-center space-x-2">
        {hasProblem && problemTitle ? (
          <div className="flex items-center space-x-2 bg-[#282828] px-3.5 py-1 rounded-md border border-[#383838] text-xs font-semibold text-white shadow-inner">
            <span>{problemId ? `${problemId}. ` : ""}{problemTitle}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-500 font-mono">Workspace Standby</span>
        )}
      </div>

      {/* Right section: Navigation & Reset controls */}
      <div className="flex items-center space-x-3">
        <Link
          href="/problems"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#282828] hover:bg-[#383838] text-xs font-semibold text-gray-200 border border-[#383838] transition-all cursor-pointer shadow-sm"
        >
          <Database size={13} className="text-[#ffa116]" />
          <span>Problems DB</span>
        </Link>

        {hasProblem && onReset && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 font-semibold px-3.5 py-1.5 rounded-md hover:bg-red-500/10 transition-colors border border-red-500/20 shadow-sm"
            title="Clear and reset problem"
          >
            <RefreshCw size={12} className="animate-spin-hover" />
            <span>Reset Data</span>
          </button>
        )}
      </div>
    </header>
  );
}
