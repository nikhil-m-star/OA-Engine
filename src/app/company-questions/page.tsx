"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { parseCompanyCSV, CompanyQuestion } from "@/lib/parseCompanyCSV";
import Navbar from "@/components/Navbar";
import { Search, Loader2, ExternalLink, ChevronUp, ChevronDown, ArrowUpDown, AlertCircle, RefreshCw } from "lucide-react";

import COMPANIES from "@/lib/companies.json";

const RECENCIES = [
  { id: "30days", label: "30 Days" },
  { id: "3months", label: "3 Months" },
  { id: "6months", label: "6 Months" },
  { id: "1year", label: "1 Year" },
  { id: "alltime", label: "All Time" },
];

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

export default function CompanyQuestionsPage() {
  // Filter & Sorting State
  const [selectedCompany, setSelectedCompany] = useState("google");
  const [selectedRecency, setSelectedRecency] = useState("30days");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [sortBy, setSortBy] = useState<"frequency" | "acceptance" | "id">("frequency");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetching & Cache State
  const [questions, setQuestions] = useState<CompanyQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache Map stored in ref to prevent re-fetching
  const cacheRef = useRef<Map<string, CompanyQuestion[]>>(new Map());

  // Dynamic fetch triggered on company or recency changes
  useEffect(() => {
    let isMounted = true;
    
    async function loadQuestions() {
      setIsLoading(true);
      setError(null);

      const cacheKey = `${selectedCompany}-${selectedRecency}`;
      if (cacheRef.current.has(cacheKey)) {
        setQuestions(cacheRef.current.get(cacheKey) || []);
        setIsLoading(false);
        return;
      }

      try {
        const data = await parseCompanyCSV(selectedCompany, selectedRecency);
        if (isMounted) {
          cacheRef.current.set(cacheKey, data);
          setQuestions(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error fetching company CSV:", err);
          setError(
            err?.message || "Failed to fetch or parse questions for this company. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [selectedCompany, selectedRecency]);

  // Handle manual column sort triggers
  const handleSort = (field: "frequency" | "acceptance" | "id") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "id" ? "asc" : "desc"); // Default to ascending for ID, descending for rates
    }
  };

  // Perform in-memory filtering and sorting using useMemo
  const processedQuestions = useMemo(() => {
    // 1. Filter
    const filtered = questions.filter((q) => {
      // Difficulty match
      if (selectedDifficulty !== "All" && q.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) {
        return false;
      }
      // Search Title match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        if (!q.title.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });

    // 2. Sort
    return [...filtered].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];

      if (valA === valB) return 0;

      if (sortOrder === "asc") {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [questions, selectedDifficulty, searchQuery, sortBy, sortOrder]);

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "easy":
        return "text-[#00b8a3] bg-[#00b8a3]/10";
      case "medium":
        return "text-[#ffc01e] bg-[#ffc01e]/10";
      case "hard":
        return "text-[#ff375f] bg-[#ff375f]/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const currentCompanyName = COMPANIES.find(c => c.id === selectedCompany)?.name || selectedCompany;

  return (
    <div className="h-screen overflow-y-auto bg-black text-[#eff2f6f2] flex flex-col font-sans select-none scrollbar-thin">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-6 animate-page-in">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Company Questions</h1>
          </div>
        </div>

        {/* Filters Controls Panel */}
        <div className="bg-[#0a0a0a] border border-[#111111] rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Company selection */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full bg-black border border-[#222] text-white rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#E8730C] transition-colors cursor-pointer"
              >
                {COMPANIES.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Recency selection */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Timeframe</label>
              <select
                value={selectedRecency}
                onChange={(e) => setSelectedRecency(e.target.value)}
                className="w-full bg-black border border-[#222] text-white rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#E8730C] transition-colors cursor-pointer"
              >
                {RECENCIES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty selection */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-black border border-[#222] text-white rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#E8730C] transition-colors cursor-pointer"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Search filter input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Search</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-[#222] text-white rounded-lg pl-9 pr-3 py-2 text-sm font-semibold placeholder-gray-600 focus:outline-none focus:border-[#E8730C] transition-colors"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Table Content & States */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-[#0a0a0a] border border-red-900/30 rounded-xl space-y-4 text-center">
            <AlertCircle size={36} className="text-red-500" />
            <div className="space-y-1 max-w-md">
              <h3 className="font-bold text-white text-base">Error Loading Data</h3>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
            <button
              onClick={() => {
                // Clear cache key to force refetch
                const cacheKey = `${selectedCompany}-${selectedRecency}`;
                cacheRef.current.delete(cacheKey);
                // Trigger state change or effect reload
                setSelectedCompany((prev) => prev);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#111] hover:bg-[#222] border border-[#333] hover:border-gray-500 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry Fetch</span>
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 size={32} className="text-[#E8730C] animate-spin" />
            <div className="text-center space-y-1">
              <span className="text-sm text-gray-300 font-bold block">Fetching {currentCompanyName} CSV</span>
              <span className="text-xs text-gray-500 font-medium">Parsing data line-by-line...</span>
            </div>
          </div>
        ) : processedQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center bg-[#0a0a0a] border border-[#111] rounded-xl space-y-3">
            {questions.length === 0 ? (
              <span className="text-gray-500 text-sm font-bold">
                No questions recorded for {currentCompanyName} in this timeframe.
              </span>
            ) : (
              <>
                <span className="text-gray-500 text-sm font-bold">No questions found matching your filter criteria</span>
                <button 
                  onClick={() => {
                    setSelectedDifficulty("All");
                    setSearchQuery("");
                  }}
                  className="text-xs text-[#E8730C] hover:underline font-bold"
                >
                  Reset filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Meta status bar */}
            <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-1">
              <span>Showing {processedQuestions.length} of {questions.length} questions</span>
            </div>

            {/* Questions Table */}
            <div className="overflow-x-auto rounded-xl border border-[#111111] bg-[#0a0a0a] scrollbar-thin">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="border-b border-[#111111] text-xs font-bold text-gray-400 uppercase select-none">
                    {/* ID Header */}
                    <th className="px-5 py-4 w-20">
                      <button
                        onClick={() => handleSort("id")}
                        className="flex items-center space-x-1 hover:text-white transition-colors focus:outline-none"
                      >
                        <span>#</span>
                        {sortBy === "id" ? (
                          sortOrder === "asc" ? <ChevronUp size={12} className="text-[#E8730C]" /> : <ChevronDown size={12} className="text-[#E8730C]" />
                        ) : (
                          <ArrowUpDown size={10} className="text-gray-600" />
                        )}
                      </button>
                    </th>

                    {/* Title Header */}
                    <th className="px-5 py-4">Title</th>

                    {/* Difficulty Header */}
                    <th className="px-5 py-4 w-28">Difficulty</th>

                    {/* Acceptance Header */}
                    <th className="px-5 py-4 w-36">
                      <button
                        onClick={() => handleSort("acceptance")}
                        className="flex items-center space-x-1 hover:text-white transition-colors focus:outline-none"
                      >
                        <span>Acceptance</span>
                        {sortBy === "acceptance" ? (
                          sortOrder === "asc" ? <ChevronUp size={12} className="text-[#E8730C]" /> : <ChevronDown size={12} className="text-[#E8730C]" />
                        ) : (
                          <ArrowUpDown size={10} className="text-gray-600" />
                        )}
                      </button>
                    </th>

                    {/* Frequency Header */}
                    <th className="px-5 py-4 w-36">
                      <button
                        onClick={() => handleSort("frequency")}
                        className="flex items-center space-x-1 hover:text-white transition-colors focus:outline-none"
                      >
                        <span>Frequency</span>
                        {sortBy === "frequency" ? (
                          sortOrder === "asc" ? <ChevronUp size={12} className="text-[#E8730C]" /> : <ChevronDown size={12} className="text-[#E8730C]" />
                        ) : (
                          <ArrowUpDown size={10} className="text-gray-600" />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111] text-[14px]">
                  {processedQuestions.map((question) => (
                    <tr
                      key={question.id}
                      className="hover:bg-[#111111]/60 transition-colors group"
                    >
                      {/* ID Cell */}
                      <td className="px-5 py-3.5 text-gray-500 font-semibold font-mono tabular-nums">
                        {question.id}
                      </td>

                      {/* Title Cell */}
                      <td className="px-5 py-3.5 select-text">
                        <a
                          href={question.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium hover:text-[#E8730C] transition-colors flex items-center space-x-1.5 inline-flex"
                        >
                          <span className="truncate">{question.title}</span>
                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 text-gray-500 transition-opacity" />
                        </a>
                      </td>

                      {/* Difficulty Cell */}
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                      </td>

                      {/* Acceptance Cell */}
                      <td className="px-5 py-3.5 text-gray-300 font-semibold font-mono tabular-nums">
                        {question.acceptance.toFixed(1)}%
                      </td>

                      {/* Frequency Cell */}
                      <td className="px-5 py-3.5 text-gray-300 font-semibold font-mono tabular-nums">
                        {question.frequency.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
