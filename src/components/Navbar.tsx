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
    <header className="flex h-[55px] w-full items-center justify-between bg-black px-6 text-[#eff2f6f2] select-none shrink-0 z-30">
      {/* Left section: Logo & Nav Links */}
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center space-x-2.5 group">
          {/* Stylized OA logo */}
          <img
            src="/logo.png"
            alt="OA Engine Logo"
            className="h-7 w-7 rounded object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-extrabold text-base tracking-wider text-white">OA Engine</span>
        </Link>

        {/* Navigation Menu */}
        <nav className="flex items-center space-x-3 text-sm font-bold">
          <Link
            href="/workspace"
            className={`px-3.5 py-2 rounded transition-all ${
              pathname.startsWith("/workspace") ? "text-[#E8730C] bg-[#111111]" : "text-gray-400 hover:text-white"
            }`}
          >
            Workspace
          </Link>
          <Link
            href="/problems"
            className={`px-3.5 py-2 rounded transition-all ${
              pathname === "/problems" ? "text-[#E8730C] bg-[#111111]" : "text-gray-400 hover:text-white"
            }`}
          >
            Problems
          </Link>
          <Link
            href="/profile"
            className={`px-3.5 py-2 rounded transition-all ${
              pathname === "/profile" ? "text-[#E8730C] bg-[#111111]" : "text-gray-400 hover:text-white"
            }`}
          >
            Profile
          </Link>
        </nav>
      </div>

      {/* Middle section: Active Problem Info */}
      <div className="hidden md:flex items-center space-x-2">
        {pathname.startsWith("/workspace") && hasProblem && problemTitle ? (
          <div className="flex items-center space-x-2 bg-[#111111] px-4 py-2 rounded text-sm font-bold text-white">
            <Terminal size={14} className="text-[#E8730C]" />
            <span>{problemId ? `${problemId}. ` : ""}{problemTitle}</span>
          </div>
        ) : null}
      </div>

      {/* Right section: Reset controls & Clerk Session */}
      <div className="flex items-center space-x-5">
        {pathname.startsWith("/workspace") && hasProblem && onReset && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 text-sm text-red-400 hover:text-red-300 font-bold px-2 py-1 rounded transition-colors"
            title="Reset problem"
          >
            <RefreshCw size={14} className="animate-spin-hover" />
            <span>Reset</span>
          </button>
        )}

        {/* Clerk Authentication Integration */}
        <Show when="signed-out">
          <div className="flex items-center space-x-2.5 text-sm">
            <SignInButton mode="modal">
              <button className="px-3.5 py-2 rounded bg-[#111111] hover:bg-[#222] text-gray-300 font-bold transition-all cursor-pointer">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-3.5 py-2 rounded bg-[#E8730C] hover:bg-[#F28B2D] text-black font-extrabold transition-all cursor-pointer">
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
