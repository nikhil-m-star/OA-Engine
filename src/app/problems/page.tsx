import React from "react";
import Link from "next/link";
import { sql, initDb } from "@/lib/db";
import { Play, Tag, HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { auth, currentUser } from "@clerk/nextjs/server";
import DeleteProblemButton from "@/components/DeleteProblemButton";
import AddProblemButton from "@/components/AddProblemButton";

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
    const { userId } = await auth();
    if (userId) {
      const user = await currentUser();
      const emails = user?.emailAddresses.map(e => e.emailAddress.toLowerCase()) || [];
      isAdmin = emails.includes("nikhilm9110@gmail.com");
    }
  } catch (authErr) {
    console.error("Clerk auth failed on server:", authErr);
  }

  try {
    await initDb();
    
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
    <div className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none scrollbar-thin">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6 animate-page-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider">Problems</h1>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-400 bg-[#0a0a0a] px-4 py-2 rounded-lg font-bold">
              <span className="text-[#E8730C]">{problems.length}</span>
              <span>Total</span>
            </div>
            <AddProblemButton variant="inline" />
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-red-950/40 text-red-400 rounded-lg font-mono text-xs">
            <h3 className="font-bold">Database Error</h3>
            <p className="mt-1">{error}</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-[#0a0a0a] rounded-2xl">
            <HelpCircle size={44} className="text-gray-600 animate-bounce" />
            <h3 className="text-white font-bold text-base">No Saved Problems</h3>
            <Link
              href="/workspace"
              className="px-5 py-2.5 bg-[#E8730C] hover:bg-[#F28B2D] text-black font-extrabold text-xs rounded transition-all cursor-pointer"
            >
              Add Problem
            </Link>
          </div>
        ) : (
          <div className="bg-[#0a0a0a] rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm select-text">
              <thead>
                <tr className="bg-[#050505] text-gray-400 font-bold uppercase tracking-wider text-xs">
                  <th className="py-4 px-6 w-20">ID</th>
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6 w-28">Difficulty</th>
                  <th className="py-4 px-6 hidden md:table-cell">Tags</th>
                  <th className="py-4 px-6 hidden lg:table-cell">Companies</th>
                  <th className="py-4 px-6 w-24 text-center">Action</th>
                  {isAdmin && <th className="py-4 px-6 w-20 text-center">Admin</th>}
                </tr>
              </thead>
              <tbody className="font-bold">
                {problems.map((problem) => (
                  <tr 
                    key={problem.slug} 
                    className="hover:bg-[#121212] transition-colors group"
                  >
                    <td className="py-4.5 px-6 text-gray-500 font-mono">{problem.id}</td>
                    <td className="py-4.5 px-6">
                      <Link 
                        href={`/workspace?problem=${problem.slug}`}
                        className="text-white hover:text-[#E8730C] transition-colors text-base"
                      >
                        {problem.title}
                      </Link>
                    </td>
                    <td className="py-4.5 px-6">
                      <span className={`${getDiffColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {problem.tags.map((tag, idx) => (
                          <span 
                            key={idx}
                            className="flex items-center space-x-1 px-2.5 py-0.5 text-xs bg-[#111111] text-gray-300 rounded"
                          >
                            <Tag size={10} className="text-gray-500" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4.5 px-6 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {problem.companies && problem.companies.length > 0 ? (
                          problem.companies.map((company, idx) => (
                            <span 
                              key={idx}
                              className="px-2.5 py-0.5 text-xs bg-[#E8730C]/10 text-gray-300 rounded font-bold"
                            >
                              {company}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-600 text-xs italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4.5 px-6 text-center">
                      <Link
                        href={`/workspace?problem=${problem.slug}`}
                        className="inline-flex items-center justify-center w-8 h-8 bg-[#111111] group-hover:bg-[#E8730C] rounded text-gray-400 group-hover:text-black transition-all"
                        title="Solve Problem"
                      >
                        <Play size={13} fill="currentColor" className="ml-0.5" />
                      </Link>
                    </td>
                    {isAdmin && (
                      <td className="py-4.5 px-6 text-center">
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
