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
    <div className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none relative overflow-x-hidden scrollbar-thin pb-24 md:pb-0">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-24 flex flex-col justify-center space-y-16 sm:space-y-24 z-10 animate-page-in">
        
        {/* Hero Banner Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[0.95] text-white">
            Supercharge your <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#E8730C] to-[#F28B2D] bg-clip-text text-transparent">
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
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#E8730C] to-[#F28B2D] hover:shadow-[0_0_25px_rgba(232,115,12,0.35)] text-black font-black text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95"
            >
              <span>Open Workspace</span>
              <ArrowRight size={14} strokeWidth={3} />
            </Link>
            <Link 
              href="/problems" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 hover:scale-[1.03] text-gray-300 hover:text-white font-black text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-md active:scale-95"
            >
              <span>Browse Problems</span>
            </Link>
          </div>
        </div>

        {/* Database Statistics Panel */}
        <div className="relative bg-gradient-to-b from-[#0a0a0a] to-[#040404] border border-white/[0.04] rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto w-full shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-white/[0.04]">
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
            <AddProblemButton variant="inline" />
          </div>
        )}

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
