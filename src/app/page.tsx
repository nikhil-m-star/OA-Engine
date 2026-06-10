import React from "react";
import Link from "next/link";
import { sql, initDb } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import Navbar from "@/components/Navbar";
import { Terminal, Database, User, ArrowRight } from "lucide-react";
import AddProblemButton from "@/components/AddProblemButton";

export const dynamic = "force-dynamic";

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
    <div className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none scrollbar-thin">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col justify-center space-y-16 animate-page-in">
        
        {/* Sleek Minimal Header */}
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-[#E8730C] tracking-wider uppercase">
            OA Engine
          </h1>
        </div>

        {/* Dynamic Database Statistics Panel */}
        <div className="bg-[#0b0b0b] rounded-2xl p-8 max-w-2xl mx-auto w-full">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-4xl md:text-5xl font-black text-white font-mono leading-none">{stats.total}</div>
              <div className="text-xs text-gray-500 uppercase font-extrabold tracking-widest mt-1">Problems</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-bold text-[#00b8a3] font-mono leading-none">{stats.easy}</div>
              <div className="text-xs text-gray-500 uppercase font-extrabold tracking-widest mt-1">Easy</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-bold text-[#ffc01e] font-mono leading-none">{stats.medium}</div>
              <div className="text-xs text-gray-500 uppercase font-extrabold tracking-widest mt-1">Medium</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-bold text-[#ff375f] font-mono leading-none">{stats.hard}</div>
              <div className="text-xs text-gray-500 uppercase font-extrabold tracking-widest mt-1">Hard</div>
            </div>
          </div>
        </div>

        {/* Navigation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto w-full">
          
          {/* Card 1: Workspace Editor */}
          <Link
            href="/workspace"
            className="group bg-[#0b0b0b] hover:bg-[#121212] rounded-2xl p-6 flex flex-col justify-between h-[135px] transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center space-x-3 text-[#E8730C]">
              <Terminal size={20} />
              <h3 className="text-lg font-extrabold text-white group-hover:text-[#E8730C] transition-colors">
                Workspace
              </h3>
            </div>
            <div className="flex items-center text-xs font-bold text-[#E8730C] space-x-1">
              <span>Enter Workspace</span>
              <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Problems DB */}
          <Link
            href="/problems"
            className="group bg-[#0b0b0b] hover:bg-[#121212] rounded-2xl p-6 flex flex-col justify-between h-[135px] transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center space-x-3 text-[#E8730C]">
              <Database size={20} />
              <h3 className="text-lg font-extrabold text-white group-hover:text-[#E8730C] transition-colors">
                Problems DB
              </h3>
            </div>
            <div className="flex items-center text-xs font-bold text-[#E8730C] space-x-1">
              <span>Browse DB</span>
              <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Profile & Admin */}
          <Link
            href="/profile"
            className="group bg-[#0b0b0b] hover:bg-[#121212] rounded-2xl p-6 flex flex-col justify-between h-[135px] transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center space-x-3 text-[#E8730C]">
              <User size={20} />
              <h3 className="text-lg font-extrabold text-white group-hover:text-[#E8730C] transition-colors flex items-center space-x-2">
                <span>Profile</span>
                {isAdmin && (
                  <span className="bg-red-500/10 text-red-400 text-[9px] px-2 py-0.5 rounded font-mono font-extrabold uppercase">
                    Admin
                  </span>
                )}
              </h3>
            </div>
            <div className="flex items-center text-xs font-bold text-[#E8730C] space-x-1">
              <span>{userName ? "View Stats" : "Sign In"}</span>
              <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Add Problem */}
          <AddProblemButton variant="card" />

        </div>

        {/* Footer Area */}
        <div className="text-center pt-8 max-w-xs mx-auto">
          <p className="text-[10px] text-gray-700 font-mono uppercase tracking-widest">
            OA Engine © {new Date().getFullYear()}
          </p>
        </div>

      </main>
    </div>
  );
}
