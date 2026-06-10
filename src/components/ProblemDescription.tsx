"use client";

import React, { useState } from "react";
import { ProblemData } from "@/app/types";
import { Tag, Briefcase, Edit2, X, Plus, Loader2, Lightbulb } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface ProblemDescriptionProps {
  problem: ProblemData;
  code?: string;
}

export default function ProblemDescription({ problem, code }: ProblemDescriptionProps) {
  const { user } = useUser();
  const emails = user?.emailAddresses.map(e => e.emailAddress.toLowerCase()) || [];
  const isAdmin = emails.includes("nikhilm9110@gmail.com");

  // Hint state
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  const [isEditingCompanies, setIsEditingCompanies] = useState(false);
  const [editedCompanies, setEditedCompanies] = useState<string[]>([]);
  const [newCompanyInput, setNewCompanyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setEditedCompanies([...(problem.companies || [])]);
    setNewCompanyInput("");
    setIsEditingCompanies(true);
  };

  const handleAddCompany = () => {
    const clean = newCompanyInput.trim();
    if (clean && !editedCompanies.includes(clean)) {
      setEditedCompanies([...editedCompanies, clean]);
    }
    setNewCompanyInput("");
  };

  const handleRemoveCompany = (company: string) => {
    setEditedCompanies(editedCompanies.filter(c => c !== company));
  };

  const handleSaveCompanies = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/problems/${problem.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companies: editedCompanies }),
      });
      if (res.ok) {
        problem.companies = editedCompanies;
        setIsEditingCompanies(false);
      } else {
        const json = await res.json();
        alert(`Failed to save companies: ${json.error}`);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getDifficultyStyles = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "easy":
        return { text: "text-[#00b8a3]", bg: "bg-[#00b8a3]/10" };
      case "medium":
        return { text: "text-[#ffc01e]", bg: "bg-[#ffc01e]/10" };
      case "hard":
        return { text: "text-[#ff375f]", bg: "bg-[#ff375f]/10" };
      default:
        return { text: "text-gray-400", bg: "bg-gray-400/10" };
    }
  };

  const diffStyle = getDifficultyStyles(problem.difficulty);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-[#eff2f6f2] overflow-y-auto scrollbar-thin select-text font-sans">
      {/* Tab Header */}
      <div className="flex items-center px-4 bg-[#050505] text-sm h-[40px] shrink-0">
        <div className="text-[#E8730C] font-bold h-full px-2 flex items-center select-none">
          Description
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 space-y-6">
        {/* Title & Metadata */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {problem.id}. {problem.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold rounded ${diffStyle.bg} ${diffStyle.text}`}>
              {problem.difficulty}
            </span>
          </div>
        </div>

        {/* Tags and Companies */}
        <div className="space-y-4">
          {problem.tags && problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {problem.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="flex items-center space-x-1 px-3 py-1 text-xs font-bold text-gray-300 bg-[#111111] rounded hover:bg-[#222] transition-colors cursor-pointer"
                >
                  <Tag size={12} className="text-gray-400" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          {isEditingCompanies ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase flex items-center space-x-1">
                  <Briefcase size={12} />
                  <span>Edit Companies</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveCompanies}
                    disabled={isSaving}
                    className="py-1 px-3 rounded bg-[#00b8a3] hover:bg-[#00b8a3]/90 text-black font-bold text-xs transition-all disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingCompanies(false)}
                    className="py-1 px-3 rounded bg-[#111111] text-gray-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {editedCompanies.map((company, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-bold text-gray-300 bg-[#E8730C]/10 rounded flex items-center space-x-1"
                  >
                    <span>{company}</span>
                    <button
                      onClick={() => handleRemoveCompany(company)}
                      className="text-red-400 hover:text-red-300 ml-1.5 cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newCompanyInput}
                  onChange={e => setNewCompanyInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCompany();
                    }
                  }}
                  placeholder="e.g. Google"
                  className="bg-black rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:ring-1 focus:ring-[#E8730C] outline-none"
                />
                <button
                  onClick={handleAddCompany}
                  className="p-2 rounded bg-[#111111] hover:bg-[#222] text-white transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-bold text-gray-500 uppercase flex items-center space-x-1.5 mr-1 select-none">
                <Briefcase size={12} className="text-gray-500" />
                <span>Companies:</span>
              </span>
              
              {problem.companies && problem.companies.length > 0 ? (
                problem.companies.map((company, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 text-xs font-bold text-gray-300 bg-[#E8730C]/15 rounded hover:bg-[#E8730C]/25 transition-all"
                  >
                    {company}
                  </span>
                ))
              ) : (
                <span className="text-gray-600 italic text-xs">None</span>
              )}

              {isAdmin && (
                <button
                  onClick={startEditing}
                  className="p-1.5 text-gray-500 hover:text-[#E8730C] transition-colors rounded hover:bg-[#111111] ml-2"
                  title="Edit companies"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* HTML Description */}
        <div 
          className="prose prose-invert max-w-none text-[15px] leading-relaxed text-gray-300 space-y-4 problem-description-html"
          dangerouslySetInnerHTML={{ __html: problem.description }}
        />

        {/* Examples Section */}
        {problem.examples && problem.examples.length > 0 && (
          <div className="space-y-4">
            {problem.examples.map((example, idx) => (
              <div key={idx} className="space-y-2">
                <span className="text-sm font-bold text-white">Example {idx + 1}</span>
                <div className="bg-[#111111] rounded-xl p-4 font-mono text-sm text-[#eff2f6f2] space-y-2 select-text overflow-x-auto leading-relaxed">
                  <div>
                    <span className="text-gray-400 font-bold select-none">Input: </span>
                    <span>{example.input}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold select-none">Output: </span>
                    <span className="text-[#E8730C] font-bold">{example.output}</span>
                  </div>
                  {example.explanation && (
                    <div className="whitespace-pre-line mt-1 text-[#c5c8c6]">
                      <span className="text-gray-400 font-bold select-none">Explanation: </span>
                      <span>{example.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {problem.constraints && problem.constraints.length > 0 && (
          <div className="space-y-3 pt-2">
            <span className="text-sm font-bold text-white">Constraints</span>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2 font-mono">
              {problem.constraints.map((constraint, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="bg-[#111111] px-2 py-0.5 rounded text-gray-200">
                    {constraint}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Hint */}
        {user && (
          <div className="pt-2 space-y-2">
            {!hint && !hintLoading && (
              <button
                onClick={async () => {
                  setHintLoading(true);
                  setHintError(null);
                  try {
                    const res = await fetch("/api/hint", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        problemTitle: problem.title,
                        problemDescription: problem.description,
                        userCode: code || "",
                        language: "cpp",
                      }),
                    });
                    const json = await res.json();
                    if (json.success) {
                      setHint(json.hint);
                    } else {
                      setHintError(json.error || "Failed to get hint.");
                    }
                  } catch {
                    setHintError("Network error.");
                  } finally {
                    setHintLoading(false);
                  }
                }}
                className="flex items-center space-x-1.5 text-xs font-bold text-[#E8730C] hover:text-[#F28B2D] transition-colors cursor-pointer"
              >
                <Lightbulb size={13} />
                <span>Get Hint</span>
              </button>
            )}
            {hintLoading && (
              <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                <Loader2 size={13} className="animate-spin text-[#E8730C]" />
                <span>Thinking...</span>
              </div>
            )}
            {hint && (
              <div className="border-l-2 border-[#E8730C] pl-3 text-sm text-gray-300 mt-2 flex items-start justify-between">
                <p className="leading-relaxed">{hint}</p>
                <button
                  onClick={() => { setHint(null); setHintError(null); }}
                  className="ml-2 text-gray-500 hover:text-white shrink-0 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {hintError && (
              <p className="text-xs text-red-400 font-medium">{hintError}</p>
            )}
          </div>
        )}

        {/* Follow-up */}
        {problem.follow_up && (
          <div className="p-4 bg-[#111111] rounded-xl text-sm leading-relaxed text-gray-300 mt-4">
            <span className="font-bold text-white block mb-1">Follow-up</span>
            <p className="italic">{problem.follow_up}</p>
          </div>
        )}
      </div>
    </div>
  );
}
