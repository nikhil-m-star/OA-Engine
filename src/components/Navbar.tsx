"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, Terminal } from "lucide-react";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

interface NavbarProps {
  problemId?: number;
  problemTitle?: string;
  onReset?: () => void;
  hasProblem?: boolean;
}

export default function Navbar({ problemId, problemTitle, onReset, hasProblem = false }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="flex h-[50px] w-full items-center justify-between border-b border-[#282828] bg-[#1a1a1a] px-6 text-[#eff2f6f2] select-none shrink-0 z-30">
      {/* Left section: Logo & Nav Links */}
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-2 group">
          {/* Stylized OA logo */}
          <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-[#ffa116] font-extrabold text-black text-xs shadow-md transition-transform group-hover:scale-105">
            OA
          </div>
          <span className="font-bold text-sm tracking-wider text-white">OA Engine</span>
        </Link>

        {/* Navigation Menu */}
        <nav className="flex items-center space-x-4 text-xs font-semibold">
          <Link
            href="/workspace"
            className={`px-3 py-1.5 rounded-md transition-all ${
              pathname.startsWith("/workspace") ? "text-white bg-[#282828] shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Workspace
          </Link>
          <Link
            href="/problems"
            className={`px-3 py-1.5 rounded-md transition-all ${
              pathname === "/problems" ? "text-white bg-[#282828] shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Problems
          </Link>
          <Link
            href="/profile"
            className={`px-3 py-1.5 rounded-md transition-all ${
              pathname === "/profile" ? "text-white bg-[#282828] shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Profile
          </Link>
        </nav>
      </div>

      {/* Middle section: Active Problem Info */}
      <div className="hidden md:flex items-center space-x-2">
        {pathname.startsWith("/workspace") && hasProblem && problemTitle ? (
          <div className="flex items-center space-x-2 bg-[#282828] px-3.5 py-1.5 rounded-md border border-[#383838] text-xs font-semibold text-white shadow-inner">
            <Terminal size={12} className="text-[#ffa116]" />
            <span>{problemId ? `${problemId}. ` : ""}{problemTitle}</span>
          </div>
        ) : null}
      </div>

      {/* Right section: Reset controls & Clerk Session */}
      <div className="flex items-center space-x-4">
        {pathname.startsWith("/workspace") && hasProblem && onReset && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 font-semibold px-2.5 py-1.5 rounded-md hover:bg-red-500/10 transition-colors border border-red-500/20 shadow-sm"
            title="Clear and reset problem"
          >
            <RefreshCw size={12} className="animate-spin-hover" />
            <span>Reset Data</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-[#282828]" />

        {/* Clerk Authentication Integration */}
        <Show when="signed-out">
          <div className="flex items-center space-x-2 text-xs">
            <SignInButton mode="modal">
              <button className="px-3 py-1.5 rounded bg-[#2a2a2a] hover:bg-[#333] border border-[#3e3e3e] text-gray-300 font-semibold transition-all cursor-pointer">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-3 py-1.5 rounded bg-[#ffa116] hover:bg-[#ffa116]/90 active:bg-[#e68e0f] text-black font-bold transition-all shadow-sm cursor-pointer">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center space-x-3">
            <UserButton />
          </div>
        </Show>
      </div>
    </header>
  );
}
