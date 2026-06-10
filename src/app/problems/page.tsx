import React from "react";
import Link from "next/link";
import { sql, initDb } from "@/lib/db";
import { Play, Tag, HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { currentUser } from "@clerk/nextjs/server";
import DeleteProblemButton from "@/components/DeleteProblemButton";

// Force dynamic rendering to query Neon Postgres directly on every load
export const dynamic = "force-dynamic";

interface ProblemSummary {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  companies?: string[];
}

export default async function ProblemsPage() {
  let problems: ProblemSummary[] = [];
  let error: string | null = null;
  let isAdmin = false;

  try {
    const user = await currentUser();
    const emails = user?.emailAddresses.map(e => e.emailAddress.toLowerCase()) || [];
    isAdmin = emails.includes("nikhilm9110@gmail.com");
  } catch (authErr) {
    console.error("Clerk auth failed on server:", authErr);
  }

  try {
    await initDb();
    
    // Fetch summary rows
    const rows = await sql`
      SELECT id, title, slug, difficulty, tags, companies 
      FROM problems 
      ORDER BY id ASC, created_at DESC
    `;
    
    problems = rows as ProblemSummary[];
  } catch (err) {
    console.error("Error loading problems:", err);
    error = err instanceof Error ? err.message : String(err);
  }

  // Difficulty colors helper
  const getDiffColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "easy":
        return "text-[#00b8a3]";
      case "medium":
        return "text-[#ffc01e]";
      case "hard":
        return "text-[#ff375f]";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 flex flex-col font-sans select-none">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2d2d2d] pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Database Problems</h1>
            <p className="text-xs text-gray-500 font-mono">Select a problem to solve in the C++ workspace</p>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-400 bg-[#282828] border border-[#3e3e3e] px-3 py-1.5 rounded-lg">
            <span className="font-semibold text-[#ffa116]">{problems.length}</span>
            <span>problems stored on Neon Postgres</span>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg font-mono text-xs space-y-2">
            <h3 className="font-bold">Database Query Failure</h3>
            <p>{error}</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-[#282828] border border-[#2d2d2d] rounded-xl">
            <HelpCircle size={40} className="text-gray-600 animate-bounce" />
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-white font-semibold text-sm">No Saved Problems Found</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your Neon database is currently empty. Go to the Workspace Editor to paste problem JSON or parse a problem description using NIM AI!
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-[#ffa116] hover:bg-[#ffa116]/90 text-black font-bold text-xs rounded-md shadow-md transition-all cursor-pointer"
            >
              Parse Problem Now
            </Link>
          </div>
        ) : (
          <div className="bg-[#282828] border border-[#2d2d2d] rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs select-text">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#202020] text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-6 w-16">ID</th>
                  <th className="py-3.5 px-6">Title</th>
                  <th className="py-3.5 px-6 w-24">Difficulty</th>
                  <th className="py-3.5 px-6 hidden md:table-cell">Tags</th>
                  <th className="py-3.5 px-6 hidden lg:table-cell">Companies</th>
                  <th className="py-3.5 px-6 w-20 text-center">Action</th>
                  {isAdmin && <th className="py-3.5 px-6 w-16 text-center">Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d] font-medium">
                {problems.map((problem) => (
                  <tr 
                    key={problem.slug} 
                    className="hover:bg-[#323232] transition-colors group"
                  >
                    <td className="py-4 px-6 text-gray-500 font-mono">{problem.id}</td>
                    <td className="py-4 px-6">
                      <Link 
                        href={`/?problem=${problem.slug}`}
                        className="text-white font-semibold hover:text-[#ffa116] transition-colors text-sm"
                      >
                        {problem.title}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-semibold ${getDiffColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {problem.tags.map((tag, idx) => (
                          <span 
                            key={idx}
                            className="flex items-center space-x-0.5 px-2 py-0.5 text-[10px] bg-[#3a3a3a] text-gray-300 rounded-full border border-[#444]"
                          >
                            <Tag size={8} className="text-gray-400" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {problem.companies && problem.companies.length > 0 ? (
                          problem.companies.map((company, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-0.5 text-[10px] font-bold bg-[#ffa116]/10 text-gray-300 rounded border border-[#ffa116]/20"
                            >
                              {company}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-600 text-[10px] italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link
                        href={`/?problem=${problem.slug}`}
                        className="inline-flex items-center justify-center w-7 h-7 bg-[#3a3a3a] group-hover:bg-[#ffa116] rounded-full text-gray-400 group-hover:text-black transition-all shadow"
                        title="Solve Problem"
                      >
                        <Play size={11} fill="currentColor" className="ml-0.5" />
                      </Link>
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-6 text-center">
                        <DeleteProblemButton slug={problem.slug} title={problem.title} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
