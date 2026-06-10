import React from "react";
import Link from "next/link";
import { sql, initDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import Navbar from "@/components/Navbar";
import { Terminal, Database, User, ArrowRight, ShieldCheck, Sparkles, BookOpen, Layers } from "lucide-react";

// Force dynamic rendering to query database on every load
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stats = { total: 0, easy: 0, medium: 0, hard: 0 };
  let isAdmin = false;
  let userName = "";
  let userEmail = "";

  try {
    const user = await currentUser();
    if (user) {
      const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase()) || [];
      isAdmin = emails.includes("nikhilm9110@gmail.com");
      userName = user.fullName || user.username || "Developer";
      userEmail = user.primaryEmailAddress?.emailAddress || "";
    }
  } catch (authErr) {
    console.error("Clerk auth failed on server:", authErr);
  }

  try {
    await initDb();
    
    // Fetch statistics with SQL aggregation
    const rows = await sql`
      SELECT 
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN LOWER(difficulty) = 'easy' THEN 1 ELSE 0 END), 0)::int as easy,
        COALESCE(SUM(CASE WHEN LOWER(difficulty) = 'medium' THEN 1 ELSE 0 END), 0)::int as medium,
        COALESCE(SUM(CASE WHEN LOWER(difficulty) = 'hard' THEN 1 ELSE 0 END), 0)::int as hard
      FROM problems;
    `;
    
    if (rows && rows.length > 0) {
      stats = {
        total: rows[0].total || 0,
        easy: rows[0].easy || 0,
        medium: rows[0].medium || 0,
        hard: rows[0].hard || 0,
      };
    }
  } catch (err) {
    console.error("Error loading problem stats:", err);
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#1a1a1a] text-gray-200 flex flex-col font-sans select-none scrollbar-thin">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 md:py-16 flex flex-col justify-center space-y-12">
        
        {/* Sleek, Dark Hero Banner */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-[#ffa116] border border-amber-500/25 px-3 py-1 rounded-full text-xs font-semibold select-none">
            <Sparkles size={12} className="animate-pulse" />
            <span>LeetCode OA Simulation Environment</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            OA <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffa116] to-[#ffc01e]">Engine</span>
          </h1>
          
          <p className="text-sm text-gray-400 leading-relaxed font-medium">
            Generate test cases, render descriptions, write clean solutions, and simulate online assessment runs inside a premium workspace.
          </p>
        </div>

        {/* Dynamic Database Statistics Panel */}
        <div className="bg-[#282828] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl max-w-3xl mx-auto w-full relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center md:justify-start space-x-1.5">
                <Layers size={12} className="text-[#ffa116]" />
                <span>Live Database Stats</span>
              </h3>
              <p className="text-[10px] text-gray-500">
                Problems synchronized across all active coding sessions
              </p>
            </div>

            {/* Stats Breakdown */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="text-center px-4">
                <div className="text-3xl font-black text-white font-mono leading-none">{stats.total}</div>
                <div className="text-[9px] text-gray-500 uppercase font-bold mt-1">Total Problems</div>
              </div>
              <div className="h-8 w-[1px] bg-[#3e3e3e] hidden sm:block" />
              <div className="text-center px-4">
                <div className="text-xl font-bold text-[#00b8a3] font-mono leading-none">{stats.easy}</div>
                <div className="text-[9px] text-gray-500 uppercase font-bold mt-1">Easy</div>
              </div>
              <div className="text-center px-4">
                <div className="text-xl font-bold text-[#ffc01e] font-mono leading-none">{stats.medium}</div>
                <div className="text-[9px] text-gray-500 uppercase font-bold mt-1">Medium</div>
              </div>
              <div className="text-center px-4">
                <div className="text-xl font-bold text-[#ff375f] font-mono leading-none">{stats.hard}</div>
                <div className="text-[9px] text-gray-500 uppercase font-bold mt-1">Hard</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
          
          {/* Card 1: Workspace Editor */}
          <Link
            href="/workspace"
            className="group relative bg-[#282828] hover:bg-[#2e2e2e] border border-[#2d2d2d] hover:border-[#ffa116]/30 rounded-2xl p-6 flex flex-col justify-between h-[180px] shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 bg-amber-500/10 text-[#ffa116] rounded-xl flex items-center justify-center border border-amber-500/20">
                <Terminal size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white group-hover:text-[#ffa116] transition-colors">
                  Workspace
                </h3>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Paste JSON or parse problems using AI. Write, test, and run code.
                </p>
              </div>
            </div>
            <div className="flex items-center text-[10px] font-bold text-[#ffa116] mt-4 space-x-1">
              <span>Enter Workspace</span>
              <ArrowRight size={10} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Problems DB */}
          <Link
            href="/problems"
            className="group relative bg-[#282828] hover:bg-[#2e2e2e] border border-[#2d2d2d] hover:border-[#ffa116]/30 rounded-2xl p-6 flex flex-col justify-between h-[180px] shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 bg-amber-500/10 text-[#ffa116] rounded-xl flex items-center justify-center border border-amber-500/20">
                <Database size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white group-hover:text-[#ffa116] transition-colors">
                  Problems DB
                </h3>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Explore stored problems, difficulty metrics, tag parameters, and companies.
                </p>
              </div>
            </div>
            <div className="flex items-center text-[10px] font-bold text-[#ffa116] mt-4 space-x-1">
              <span>Browse DB</span>
              <ArrowRight size={10} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Profile & Admin */}
          <Link
            href="/profile"
            className="group relative bg-[#282828] hover:bg-[#2e2e2e] border border-[#2d2d2d] hover:border-[#ffa116]/30 rounded-2xl p-6 flex flex-col justify-between h-[180px] shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 bg-amber-500/10 text-[#ffa116] rounded-xl flex items-center justify-center border border-amber-500/20">
                <User size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white group-hover:text-[#ffa116] transition-colors flex items-center space-x-1.5">
                  <span>Profile Stats</span>
                  {isAdmin && (
                    <span className="bg-red-500/10 text-red-400 text-[8px] px-1.5 py-0.5 rounded border border-red-500/20 font-mono tracking-wider font-extrabold uppercase">
                      Admin
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-gray-400 leading-normal">
                  {userName ? `Welcome back, ${userName}. View stats and verify settings.` : "Sign in to track progress and unlock saving features."}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[10px] font-bold text-[#ffa116] mt-4 space-x-1">
              <span>{userName ? "View Dashboard" : "Sign In / Join"}</span>
              <ArrowRight size={10} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>

        {/* Footer Area */}
        <div className="text-center pt-8 border-t border-[#232323] max-w-md mx-auto">
          <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">
            OA Engine © {new Date().getFullYear()} • Minimalist Prep Environment
          </p>
        </div>

      </main>
    </div>
  );
}
