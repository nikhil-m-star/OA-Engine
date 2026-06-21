import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { auth, currentUser } from "@clerk/nextjs/server";
import DeleteProblemButton from "@/components/DeleteProblemButton";
import AddProblemButton from "@/components/AddProblemButton";

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
      const emails = user?.emailAddresses.map((email) => email.emailAddress.toLowerCase()) || [];
      isAdmin = emails.includes("nikhilm9110@gmail.com");
    }
  } catch (authErr) {
    console.error("Clerk auth failed on server:", authErr);
  }

  try {
    const rows = await db.problem.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        tags: true,
        companies: true,
      },
      orderBy: [
        { id: "asc" },
        { created_at: "desc" },
      ],
    });

    problems = rows;
  } catch (err) {
    console.error("Error loading problems:", err);
    error = err instanceof Error ? err.message : String(err);
  }

  const getDiffColor = (diff?: string | null) => {
    if (!diff) return "text-gray-400";
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
    <div className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none scrollbar-thin pb-24 md:pb-0">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-5 animate-page-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white tracking-tight">Problems</h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500 font-medium">{problems.length} problems</span>
            {isAdmin && <AddProblemButton variant="inline" />}
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-red-950/40 text-red-400 rounded-2xl font-mono text-xs">
            <h3 className="font-bold">Database Error</h3>
            <p className="mt-1">{error}</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
            <HelpCircle size={40} className="text-gray-700" />
            <p className="text-gray-500 text-sm">No problems yet</p>
            {isAdmin && <AddProblemButton variant="inline" />}
          </div>
        ) : (
          <div className="space-y-1">
            {problems.map((problem, index) => {
              const tags = Array.isArray(problem.tags) ? problem.tags : [];
              const companies = Array.isArray(problem.companies) ? problem.companies : [];

              return (
                <Link
                  key={problem.slug}
                  href={`/workspace?problem=${problem.slug}`}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group cursor-pointer ${
                    index % 2 === 0 ? "bg-transparent" : "bg-[#0a0a0a]"
                  } hover:bg-[#111111] hover:scale-[1.01] active:scale-98`}
                >
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    <span className="text-gray-600 text-sm font-medium w-8 shrink-0 tabular-nums">{problem.id}</span>
                    <span className="text-white text-[15px] font-medium group-hover:text-[#E8730C] transition-colors truncate">
                      {problem.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 ml-4">
                    <div className="hidden lg:flex items-center space-x-1.5">
                      {companies.length > 0 ? (
                        companies.slice(0, 2).map((company, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 text-[11px] text-gray-400 bg-white/[0.03] border border-white/[0.04] rounded-full font-medium"
                          >
                            {company}
                          </span>
                        ))
                      ) : null}
                      {companies.length > 2 && (
                        <span className="text-[10px] text-gray-500 font-bold select-none">+{companies.length - 2}</span>
                      )}
                    </div>

                    <div className="hidden md:flex items-center space-x-1.5">
                      {tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 text-[11px] text-gray-400 bg-white/[0.03] border border-white/[0.04] rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {tags.length > 2 && (
                        <span className="text-[10px] text-gray-500 font-bold select-none">+{tags.length - 2}</span>
                      )}
                    </div>

                    <span className={`text-sm font-medium w-16 text-right ${getDiffColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>

                    {isAdmin && (
                      <div className="flex items-center">
                        <DeleteProblemButton slug={problem.slug} title={problem.title} />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
