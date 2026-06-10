"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { ShieldAlert, Mail, Calendar, User, Award, ExternalLink, Layers, BookOpen } from "lucide-react";
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

  const totalCount = problems.length;
  const easyCount = problems.filter((p) => p.difficulty.toLowerCase() === "easy").length;
  const mediumCount = problems.filter((p) => p.difficulty.toLowerCase() === "medium").length;
  const hardCount = problems.filter((p) => p.difficulty.toLowerCase() === "hard").length;

  if (isLoaded && !isSignedIn) {
    return (
      <div className="h-screen bg-black text-[#eff2f6f2] flex flex-col font-sans select-none">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0a0a0a] rounded-2xl p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center p-4 bg-red-500/10 text-red-500 rounded-full">
              <ShieldAlert size={36} />
            </div>
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">Authentication Required</h1>
            <div className="pt-2">
              <SignInButton mode="modal">
                <button className="w-full py-3 rounded bg-[#E8730C] hover:bg-[#F28B2D] text-black font-extrabold text-sm transition-all cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none scrollbar-thin">
      <Navbar />
      
      <main className="flex-grow max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6 animate-page-in">
        {!isLoaded || (isSignedIn && isLoadingStats) ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-7 h-7 border-2 border-t-[#E8730C] border-r-transparent border-b-[#E8730C] border-l-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500 font-bold">Loading Stats...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Profile Avatar Details */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#0a0a0a] rounded-2xl p-6 relative overflow-hidden">
                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                  <div className="relative">
                    {user?.imageUrl ? (
                      <img 
                        src={user.imageUrl} 
                        alt="Avatar" 
                        className="w-24 h-24 rounded-full object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#111111] flex items-center justify-center text-gray-400 border border-[#222]">
                        <User size={40} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white tracking-tight">
                      {user?.fullName || user?.username || "Developer"}
                    </h2>
                    <p className="text-sm text-[#E8730C] font-bold font-mono">
                      @{user?.username || user?.primaryEmailAddress?.emailAddress.split("@")[0] || "user"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 space-y-4 text-sm select-text">
                  <div className="flex items-center justify-between text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Mail size={14} className="text-gray-500" />
                      <span>Email</span>
                    </div>
                    <span className="font-bold text-white max-w-[160px] truncate" title={user?.primaryEmailAddress?.emailAddress}>
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-gray-500" />
                      <span>Joined</span>
                    </div>
                    <span className="font-bold text-white">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Award size={14} className="text-gray-500" />
                      <span>Rank</span>
                    </div>
                    <span className="font-extrabold text-white bg-amber-500/10 px-2.5 py-0.5 rounded font-mono text-xs">
                      Master
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Columns: Stats & explorer */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* LeetCode stats ring and progress bars */}
              <div className="bg-[#0a0a0a] rounded-2xl p-6 space-y-6">
                <div className="flex items-center space-x-2 pb-3">
                  <Layers size={16} className="text-[#E8730C]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Progress Stats</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Left Circle ring */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center p-2">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle 
                          cx="50" cy="50" r="40" 
                          fill="transparent" 
                          stroke="#111111" 
                          strokeWidth="8"
                        />
                        <circle 
                          cx="50" cy="50" r="40" 
                          fill="transparent" 
                          stroke="#E8730C" 
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * (totalCount > 0 ? 1 : 0))}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center text-center">
                        <span className="text-3xl font-black text-white leading-none">{totalCount}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">Problems</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Progress bars */}
                  <div className="md:col-span-2 space-y-4">
                    {/* Easy */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#00b8a3]">Easy</span>
                        <span className="text-gray-400 font-mono">{easyCount}</span>
                      </div>
                      <div className="w-full bg-[#111111] h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#00b8a3] h-full rounded-full transition-all duration-1000"
                          style={{ width: `${totalCount > 0 ? (easyCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Medium */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#ffc01e]">Medium</span>
                        <span className="text-gray-400 font-mono">{mediumCount}</span>
                      </div>
                      <div className="w-full bg-[#111111] h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#ffc01e] h-full rounded-full transition-all duration-1000"
                          style={{ width: `${totalCount > 0 ? (mediumCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Hard */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#ff375f]">Hard</span>
                        <span className="text-gray-400 font-mono">{hardCount}</span>
                      </div>
                      <div className="w-full bg-[#111111] h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#ff375f] h-full rounded-full transition-all duration-1000"
                          style={{ width: `${totalCount > 0 ? (hardCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explorer database cards list */}
              <div className="bg-[#0a0a0a] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center space-x-2">
                    <BookOpen size={16} className="text-[#E8730C]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Explorer</h3>
                  </div>
                  <Link href="/problems" className="text-xs text-[#E8730C] hover:underline font-bold flex items-center space-x-0.5">
                    <span>View All</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>

                {problems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs italic">
                    No problems stored.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin select-text">
                    {problems.slice(0, 10).map((problem) => (
                      <Link
                        key={problem.slug}
                        href={`/workspace?problem=${problem.slug}`}
                        className="flex items-center justify-between bg-black hover:bg-[#121212] rounded-xl p-4 transition-colors group cursor-pointer"
                      >
                        <div className="space-y-1 pr-2">
                          <div className="text-sm font-bold text-white group-hover:text-[#E8730C] transition-colors truncate max-w-[180px]">
                            {problem.title}
                          </div>
                          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                            <span className="font-mono">#{problem.id}</span>
                            <span>•</span>
                            <span className={
                              problem.difficulty.toLowerCase() === "easy" ? "text-[#00b8a3]" :
                              problem.difficulty.toLowerCase() === "medium" ? "text-[#ffc01e]" : "text-[#ff375f]"
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
