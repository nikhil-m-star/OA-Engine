"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { RefreshCw, Terminal, Code2, Database, User, Briefcase } from "lucide-react";

interface NavbarProps {
  problemId?: number;
  problemTitle?: string;
  onReset?: () => void;
  hasProblem?: boolean;
}

export default function Navbar({ problemId, problemTitle, onReset, hasProblem = false }: NavbarProps) {
  const pathname = usePathname();

  return (
    <div className="w-full shrink-0 z-50 pointer-events-none md:mt-2">
      <header className="pointer-events-auto mx-auto flex h-[65px] items-center justify-between bg-black/90 backdrop-blur-md px-4 md:px-6 text-[#eff2f6f2] select-none border border-[#1a1a1a] shadow-2xl transition-all duration-300
        fixed bottom-4 left-4 right-4 z-50 rounded-full max-w-[calc(100%-2rem)]
        md:relative md:bottom-auto md:left-auto md:right-auto md:max-w-5xl md:rounded-full md:h-[60px]">
        
        {/* Left section: Logo */}
        <div className="hidden md:flex md:flex-1 items-center justify-start">
          <Link href="/" className="flex items-center space-x-2 group">
            {/* Stylized OA logo */}
            <img
              src="/logo.png"
              alt="OA Engine Logo"
              className="h-6 w-6 rounded object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-extrabold text-sm tracking-wider text-white">OA Engine</span>
          </Link>
        </div>

        {/* Middle section: Navigation Links & Active Problem */}
        <div className="flex items-center justify-around md:justify-center md:flex-grow lg:flex-1 w-full md:w-auto">
          <nav className="flex items-center space-x-0.5 md:space-x-1.5 text-[9px] md:text-xs font-bold w-full md:w-auto justify-around md:justify-center">
            <Link
              href="/workspace"
              className={`px-2 py-1 md:px-4 md:py-2 rounded-full transition-all duration-300 active:scale-95 hover:scale-[1.05] flex flex-col md:flex-row items-center justify-center space-y-0.5 md:space-y-0 md:space-x-1.5 ${
                pathname.startsWith("/workspace") 
                  ? "text-[#E8730C] bg-[#E8730C]/10 border border-[#E8730C]/20 shadow-[0_0_12px_rgba(232,115,12,0.15)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Code2 size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-black whitespace-nowrap">Workspace</span>
            </Link>
            <Link
              href="/problems"
              className={`px-2 py-1 md:px-4 md:py-2 rounded-full transition-all duration-300 active:scale-95 hover:scale-[1.05] flex flex-col md:flex-row items-center justify-center space-y-0.5 md:space-y-0 md:space-x-1.5 ${
                pathname === "/problems" 
                  ? "text-[#E8730C] bg-[#E8730C]/10 border border-[#E8730C]/20 shadow-[0_0_12px_rgba(232,115,12,0.15)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Database size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-black whitespace-nowrap">Problems</span>
            </Link>
            <Link
              href="/profile"
              className={`px-2 py-1 md:px-4 md:py-2 rounded-full transition-all duration-300 active:scale-95 hover:scale-[1.05] flex flex-col md:flex-row items-center justify-center space-y-0.5 md:space-y-0 md:space-x-1.5 ${
                pathname === "/profile" 
                  ? "text-[#E8730C] bg-[#E8730C]/10 border border-[#E8730C]/20 shadow-[0_0_12px_rgba(232,115,12,0.15)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <User size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-black whitespace-nowrap">Profile</span>
            </Link>
            <Link
              href="/company-questions"
              className={`px-2 py-1 md:px-4 md:py-2 rounded-full transition-all duration-300 active:scale-95 hover:scale-[1.05] flex flex-col md:flex-row items-center justify-center space-y-0.5 md:space-y-0 md:space-x-1.5 ${
                pathname === "/company-questions" 
                  ? "text-[#E8730C] bg-[#E8730C]/10 border border-[#E8730C]/20 shadow-[0_0_12px_rgba(232,115,12,0.15)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Briefcase size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-black whitespace-nowrap">Company Qs</span>
            </Link>
          </nav>

          {/* Active Problem Info badge next to Nav links on desktop */}
          {pathname.startsWith("/workspace") && hasProblem && problemTitle && (
            <div className="hidden lg:flex items-center space-x-2 bg-[#111111] px-4 py-1.5 rounded-full text-xs font-bold text-white border border-[#222] ml-4">
              <Terminal size={12} className="text-[#E8730C]" />
              <span>{problemId ? `${problemId}. ` : ""}{problemTitle}</span>
            </div>
          )}
        </div>

        {/* Right section: Reset controls & Clerk Session */}
        <div className="flex items-center justify-end md:flex-1 space-x-2 md:space-x-4">
          {pathname.startsWith("/workspace") && hasProblem && onReset && (
            <button
              onClick={onReset}
              className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 rounded-full bg-[#1a0c0c]/40 hover:bg-[#1a0c0c] border border-red-950/50 transition-all duration-200 active:scale-95"
              title="Reset problem"
            >
              <RefreshCw size={12} className="animate-spin-hover" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Clerk Authentication Integration */}
          <Show when="signed-out">
            <div className="flex items-center space-x-1.5 text-xs">
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 rounded-full bg-[#111111] hover:bg-[#222] border border-[#222] text-gray-300 font-bold transition-all duration-200 active:scale-95 cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden sm:block px-3 py-1.5 rounded-full bg-[#E8730C] hover:bg-[#F28B2D] text-black font-extrabold transition-all duration-200 active:scale-95 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center space-x-3 scale-95 md:scale-100">
              <UserButton />
            </div>
          </Show>
        </div>
      </header>
    </div>
  );
}
