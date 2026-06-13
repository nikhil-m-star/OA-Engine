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
    <div className="w-full shrink-0 z-50 pointer-events-none md:mt-2">
      <header className="pointer-events-auto mx-auto flex h-[58px] items-center justify-between bg-black/90 backdrop-blur-md px-4 md:px-6 text-[#eff2f6f2] select-none border border-[#1a1a1a] shadow-2xl transition-all duration-300
        fixed bottom-4 left-4 right-4 z-50 rounded-full max-w-[calc(100%-2rem)]
        md:relative md:bottom-auto md:left-auto md:right-auto md:max-w-5xl md:rounded-full md:h-[60px]">
        
        {/* Left section: Logo & Nav Links */}
        <div className="flex items-center space-x-2 md:space-x-6">
          <Link href="/" className="hidden md:flex items-center space-x-2 group">
            {/* Stylized OA logo */}
            <img
              src="/logo.png"
              alt="OA Engine Logo"
              className="h-6 w-6 rounded object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-extrabold text-sm tracking-wider text-white">OA Engine</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="flex items-center space-x-1 text-[11px] md:text-sm font-bold">
            <Link
              href="/workspace"
              className={`px-3 py-2 rounded-full transition-all duration-200 active:scale-95 ${
                pathname.startsWith("/workspace") 
                  ? "text-[#E8730C] bg-[#111111] border border-[#222]" 
                  : "text-gray-400 hover:text-white hover:bg-[#111111]/40"
              }`}
            >
              Workspace
            </Link>
            <Link
              href="/problems"
              className={`px-3 py-2 rounded-full transition-all duration-200 active:scale-95 ${
                pathname === "/problems" 
                  ? "text-[#E8730C] bg-[#111111] border border-[#222]" 
                  : "text-gray-400 hover:text-white hover:bg-[#111111]/40"
              }`}
            >
              Problems
            </Link>
            <Link
              href="/profile"
              className={`px-3 py-2 rounded-full transition-all duration-200 active:scale-95 ${
                pathname === "/profile" 
                  ? "text-[#E8730C] bg-[#111111] border border-[#222]" 
                  : "text-gray-400 hover:text-white hover:bg-[#111111]/40"
              }`}
            >
              Profile
            </Link>
            <Link
              href="/company-questions"
              className={`px-3 py-2 rounded-full transition-all duration-200 active:scale-95 ${
                pathname === "/company-questions" 
                  ? "text-[#E8730C] bg-[#111111] border border-[#222]" 
                  : "text-gray-400 hover:text-white hover:bg-[#111111]/40"
              }`}
            >
              Company Qs
            </Link>
          </nav>
        </div>

        {/* Middle section: Active Problem Info */}
        <div className="hidden lg:flex items-center space-x-2">
          {pathname.startsWith("/workspace") && hasProblem && problemTitle ? (
            <div className="flex items-center space-x-2 bg-[#111111] px-4 py-1.5 rounded-full text-xs font-bold text-white border border-[#222]">
              <Terminal size={12} className="text-[#E8730C]" />
              <span>{problemId ? `${problemId}. ` : ""}{problemTitle}</span>
            </div>
          ) : null}
        </div>

        {/* Right section: Reset controls & Clerk Session */}
        <div className="flex items-center space-x-2 md:space-x-4">
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
