import React from "react";
import Link from "next/link";
import { getSql, initDb } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import Navbar from "@/components/Navbar";
import { 
  Terminal, 
  Database, 
  User, 
  ArrowRight, 
  Code2, 
  Sparkles, 
  ChevronRight, 
  BarChart3, 
  ShieldAlert, 
  Activity, 
  Layout, 
  Plus 
} from "lucide-react";
import AddProblemButton from "@/components/AddProblemButton";

export const dynamic = "force-dynamic";

interface StatsRow {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

export default async function HomePage() {
  let stats = { total: 0, easy: 0, medium: 0, hard: 0 };
  let isAdmin = false;
  let userName = "";

  try {
    const { userId } = await auth();
    if (userId) {
      const user = await currentUser();
      if (user) {
        const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase()) || [];
        isAdmin = emails.includes("nikhilm9110@gmail.com");
        userName = user.fullName || user.username || "Developer";
      }
    }
  } catch (authErr) {
    console.error("Clerk auth failed on server:", authErr);
  }

  try {
    await initDb();
    const sql = getSql();
    
    const rows = await sql<StatsRow>`
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
    <div className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none relative overflow-x-hidden scrollbar-thin">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-24 flex flex-col justify-center space-y-16 sm:space-y-24 z-10 animate-page-in">
        
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

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/workspace" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#E8730C] hover:bg-[#F28B2D] text-black font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
            >
              <span>Open Workspace</span>
              <ArrowRight size={14} strokeWidth={3} />
            </Link>
            <Link 
              href="/problems" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-gray-300 hover:text-white font-extrabold text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-2 backdrop-blur-md"
            >
              <span>Browse Problems</span>
            </Link>
          </div>
        </div>

        {/* Database Statistics Panel */}
        <div className="relative bg-[#0a0a0a] border border-white/[0.04] rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-white/[0.04]">
            <div className="space-y-1 pt-4 md:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-white leading-none">
                {stats.total}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Total Problems
              </div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-[#00b8a3] leading-none">
                {stats.easy}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Easy
              </div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-[#ffc01e] leading-none">
                {stats.medium}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Medium
              </div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-[#ff375f] leading-none">
                {stats.hard}
              </div>
              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest pt-1">
                Hard
              </div>
            </div>
          </div>
        </div>

        {/* Action Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
          
          {/* Card 1: Workspace */}
          <Link
            href="/workspace"
            className="group relative bg-white/[0.01] hover:bg-white/[0.025] border border-white/[0.03] hover:border-[#E8730C]/20 rounded-2xl p-6 flex flex-col justify-between h-[210px] transition-all duration-300 transform hover:-translate-y-1 shadow-md backdrop-blur-sm overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity">
              <Code2 size={120} className="text-[#E8730C]" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-[#E8730C]">
                <div className="p-2 rounded-lg bg-[#E8730C]/10 border border-[#E8730C]/20">
                  <Terminal size={18} />
                </div>
                <h3 className="text-base font-extrabold text-white group-hover:text-[#E8730C] transition-colors">
                  Workspace
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Write solutions in an interactive Monaco editor, run code against 30+ parsed test cases, and analyze execution times.
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-[#E8730C] space-x-1 pt-4">
              <span>Open IDE Workspace</span>
              <ChevronRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Problems Database */}
          <Link
            href="/problems"
            className="group relative bg-white/[0.01] hover:bg-white/[0.025] border border-white/[0.03] hover:border-[#E8730C]/20 rounded-2xl p-6 flex flex-col justify-between h-[210px] transition-all duration-300 transform hover:-translate-y-1 shadow-md backdrop-blur-sm overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity">
              <Database size={120} className="text-[#E8730C]" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-[#E8730C]">
                <div className="p-2 rounded-lg bg-[#E8730C]/10 border border-[#E8730C]/20">
                  <Database size={18} />
                </div>
                <h3 className="text-base font-extrabold text-white group-hover:text-[#E8730C] transition-colors">
                  Problems DB
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Explore the parsed database of technical assessment questions. Search by tags, companies, or difficulty levels.
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-[#E8730C] space-x-1 pt-4">
              <span>Browse Database</span>
              <ChevronRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Profile & Admin */}
          <Link
            href="/profile"
            className="group relative bg-white/[0.01] hover:bg-white/[0.025] border border-white/[0.03] hover:border-[#E8730C]/20 rounded-2xl p-6 flex flex-col justify-between h-[210px] transition-all duration-300 transform hover:-translate-y-1 shadow-md backdrop-blur-sm overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity">
              <User size={120} className="text-[#E8730C]" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-[#E8730C]">
                <div className="p-2 rounded-lg bg-[#E8730C]/10 border border-[#E8730C]/20 flex items-center justify-center">
                  <User size={18} />
                </div>
                <h3 className="text-base font-extrabold text-white group-hover:text-[#E8730C] transition-colors flex items-center space-x-2">
                  <span>Profile</span>
                  {isAdmin && (
                    <span className="bg-red-500/10 text-red-400 text-[8px] px-1.5 py-0.5 rounded font-mono font-black uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Review your recent submission history, success rates, speed analyses, and overall preparation diagnostics.
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-[#E8730C] space-x-1 pt-4">
              <span>{userName ? "View Diagnostics" : "Authenticate Account"}</span>
              <ChevronRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4 (Conditional): Add Problem Button */}
          {isAdmin && (
            <div className="md:col-span-3 flex justify-center pt-2">
              <AddProblemButton variant="card" />
            </div>
          )}

        </div>

        {/* Bottom footer metadata */}
        <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between text-gray-600 text-[10px] font-mono uppercase tracking-wider">
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
