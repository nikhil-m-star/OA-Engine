"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { ShieldAlert, Mail, Calendar, User, Award, ExternalLink, Cpu, BookOpen, Layers } from "lucide-react";
import Navbar from "@/components/Navbar";

interface ProblemSummary {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  companies?: string[];
}

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/problems");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            setProblems(json);
          } else if (json && Array.isArray(json.data)) {
            setProblems(json.data);
          }
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setIsLoadingStats(false);
      }
    }

    if (isSignedIn) {
      fetchStats();
    }
  }, [isSignedIn]);

  // Calculate difficulty distribution
  const totalCount = problems.length;
  const easyProblems = problems.filter((p) => p.difficulty.toLowerCase() === "easy");
  const mediumProblems = problems.filter((p) => p.difficulty.toLowerCase() === "medium");
  const hardProblems = problems.filter((p) => p.difficulty.toLowerCase() === "hard");

  const easyCount = easyProblems.length;
  const mediumCount = mediumProblems.length;
  const hardCount = hardProblems.length;

  // Render sign in prompt if not logged in
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-200 flex flex-col font-sans select-none">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#282828] border border-[#383838] rounded-2xl p-8 text-center shadow-2xl space-y-6">
            <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 text-[#ffa116] rounded-full border border-amber-500/20">
              <ShieldAlert size={36} />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Authentication Required</h1>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sign in to view your OA Engine profile dashboard, track system statistics, and review problems available in the PostgreSQL database.
              </p>
            </div>
            <div className="pt-2">
              <SignInButton mode="modal">
                <button className="w-full py-2.5 rounded bg-[#ffa116] hover:bg-[#ffa116]/90 active:bg-[#e68e0f] text-black font-bold text-sm transition-all shadow-md cursor-pointer">
                  Sign In / Sign Up
                </button>
              </SignInButton>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 flex flex-col font-sans select-none">
      <Navbar />
      
      <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Loading skeleton */}
        {!isLoaded || (isSignedIn && isLoadingStats) ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-t-[#ffa116] border-r-transparent border-b-[#ffa116] border-l-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500 font-mono">Loading Profile Statistics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: User Identity Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#282828] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl relative overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ffa116] to-amber-600" />
                
                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                  <div className="relative">
                    {user?.imageUrl ? (
                      <img 
                        src={user.imageUrl} 
                        alt="Profile Avatar" 
                        className="w-20 h-20 rounded-full border-2 border-[#3e3e3e] shadow-md object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#3e3e3e] flex items-center justify-center text-gray-400 border-2 border-[#4e4e4e] shadow-md">
                        <User size={36} />
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 bg-[#00b8a3] text-black font-extrabold text-[8px] px-1.5 py-0.5 rounded-full border-2 border-[#282828] select-none uppercase tracking-wider">
                      Online
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {user?.fullName || user?.username || "OA Developer"}
                    </h2>
                    <p className="text-xs text-[#ffa116] font-semibold font-mono">
                      @{user?.username || user?.primaryEmailAddress?.emailAddress.split("@")[0] || "user"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#383838] mt-6 pt-6 space-y-4 text-xs select-text">
                  <div className="flex items-center justify-between text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Mail size={13} className="text-gray-500" />
                      <span>Email</span>
                    </div>
                    <span className="font-medium text-white max-w-[150px] truncate" title={user?.primaryEmailAddress?.emailAddress}>
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Calendar size={13} className="text-gray-500" />
                      <span>Joined</span>
                    </div>
                    <span className="font-medium text-white">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Award size={13} className="text-gray-500" />
                      <span>Workspace Rank</span>
                    </div>
                    <span className="font-semibold text-white bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono text-[10px]">
                      Master
                    </span>
                  </div>
                </div>
              </div>

              {/* Extra Stats Card */}
              <div className="bg-[#282828] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Developer Runtime</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-3">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Engine URL</div>
                    <div className="text-xs font-bold text-white mt-1 select-all truncate">
                      Vercel Live
                    </div>
                  </div>
                  <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-3">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Client Engine</div>
                    <div className="text-xs font-bold text-white mt-1">
                      Monaco JS
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Columns: LeetCode-style Stats & Explorer */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* LeetCode-style stats panel */}
              <div className="bg-[#282828] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-[#383838] pb-3">
                  <h3 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
                    <Layers size={14} className="text-[#ffa116]" />
                    <span>Database Progress Stats</span>
                  </h3>
                  <span className="text-[10px] text-gray-500 font-mono">Auto-synced with Neon Postgres</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Left Circle ring */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center p-2">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Underlay circle */}
                        <circle 
                          cx="50" cy="50" r="40" 
                          fill="transparent" 
                          stroke="#3e3e3e" 
                          strokeWidth="8"
                        />
                        {/* Dynamic Overlay circle */}
                        <circle 
                          cx="50" cy="50" r="40" 
                          fill="transparent" 
                          stroke="#ffa116" 
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * (totalCount > 0 ? 1 : 0))}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center text-center">
                        <span className="text-2xl font-black text-white leading-none">{totalCount}</span>
                        <span className="text-[9px] text-gray-500 font-semibold uppercase mt-1">Problems</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Progress bars */}
                  <div className="md:col-span-2 space-y-4">
                    {/* Easy */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-[#00b8a3]">Easy</span>
                        <span className="text-gray-400 font-mono">{easyCount} problems</span>
                      </div>
                      <div className="w-full bg-[#1e1e1e] h-2 rounded-full overflow-hidden border border-[#333]">
                        <div 
                          className="bg-[#00b8a3] h-full rounded-full transition-all duration-1000"
                          style={{ width: `${totalCount > 0 ? (easyCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Medium */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-[#ffc01e]">Medium</span>
                        <span className="text-gray-400 font-mono">{mediumCount} problems</span>
                      </div>
                      <div className="w-full bg-[#1e1e1e] h-2 rounded-full overflow-hidden border border-[#333]">
                        <div 
                          className="bg-[#ffc01e] h-full rounded-full transition-all duration-1000"
                          style={{ width: `${totalCount > 0 ? (mediumCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Hard */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-[#ff375f]">Hard</span>
                        <span className="text-gray-400 font-mono">{hardCount} problems</span>
                      </div>
                      <div className="w-full bg-[#1e1e1e] h-2 rounded-full overflow-hidden border border-[#333]">
                        <div 
                          className="bg-[#ff375f] h-full rounded-full transition-all duration-1000"
                          style={{ width: `${totalCount > 0 ? (hardCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem Database List component */}
              <div className="bg-[#282828] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#383838] pb-3">
                  <h3 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
                    <BookOpen size={14} className="text-[#ffa116]" />
                    <span>Problem Database Explorer</span>
                  </h3>
                  <Link href="/problems" className="text-xs text-[#ffa116] hover:underline flex items-center space-x-0.5">
                    <span>View All</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>

                {problems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs italic">
                    No problems stored in the system yet. Let's add one in the Workspace Editor!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin select-text">
                    {problems.slice(0, 10).map((problem) => (
                      <Link
                        key={problem.slug}
                        href={`/?problem=${problem.slug}`}
                        className="flex items-center justify-between bg-[#1e1e1e] hover:bg-[#202020] border border-[#2d2d2d] rounded-xl p-3.5 transition-colors group cursor-pointer"
                      >
                        <div className="space-y-1 pr-2">
                          <div className="text-xs font-bold text-white group-hover:text-[#ffa116] transition-colors truncate max-w-[180px]">
                            {problem.title}
                          </div>
                          <div className="flex items-center space-x-1.5 text-[9px] text-gray-500">
                            <span className="font-mono">#{problem.id}</span>
                            <span>•</span>
                            <span className={
                              problem.difficulty.toLowerCase() === "easy" ? "text-[#00b8a3] font-semibold" :
                              problem.difficulty.toLowerCase() === "medium" ? "text-[#ffc01e] font-semibold" : "text-[#ff375f] font-semibold"
                            }>
                              {problem.difficulty}
                            </span>
                          </div>
                        </div>
                        <ExternalLink size={12} className="text-gray-600 group-hover:text-white transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}
