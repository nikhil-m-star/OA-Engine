"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import JSONInput from "@/components/JSONInput";
import ProblemDescription from "@/components/ProblemDescription";
import { ProblemData } from "@/app/types";
import { Code, BookOpen, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-black text-gray-400 font-mono text-xs">
      <div className="w-6 h-6 border-2 border-t-[#E8730C] border-r-transparent border-b-[#E8730C] border-l-transparent rounded-full animate-spin mb-2" />
      <span>Loading Workspace...</span>
    </div>
  )
});

export default function WorkspacePage() {
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "json">("json");
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [mobileTab, setMobileTab] = useState<"docs" | "editor">("docs");

  // Check query parameter on mount
  useEffect(() => {
    async function loadWorkspace() {
      try {
        const params = new URLSearchParams(window.location.search);
        const problemSlug = params.get("problem");

        if (problemSlug) {
          const res = await fetch(`/api/problems/${problemSlug}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              setProblem(json.data);
              setCode(json.data.starter_code.cpp || "");
              setActiveTab("description");
              setMobileTab("editor"); // Auto-switch to editor when a problem is selected
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Error reading initial workspace state:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkspace();
  }, []);

  const handleRenderProblem = async (data: ProblemData) => {
    setProblem(data);
    setCode(data.starter_code.cpp || "");
    setActiveTab("description");
    setMobileTab("editor"); // Switch to editor view on mobile after rendering

    // Post to Neon DB in the background
    try {
      const response = await fetch("/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, allowOverwrite: true }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        console.error("Failed to store problem on Neon DB:", errJson.error);
      }
    } catch (err) {
      console.error("Failed to POST problem to Neon DB:", err);
    }
  };

  const handleResetData = () => {
    setProblem(null);
    setCode("");
    setActiveTab("json");
    setMobileTab("docs");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/workspace");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-gray-400 font-sans text-sm">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-7 h-7 border-2 border-t-[#E8730C] border-r-transparent border-b-[#E8730C] border-l-transparent rounded-full animate-spin" />
          <span>Loading Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black select-none text-gray-200 font-sans pb-1 md:pb-0">
      {/* Top Navbar */}
      <Navbar
        problemId={problem?.id}
        problemTitle={problem?.title}
        onReset={handleResetData}
        hasProblem={!!problem}
      />

      {/* Mobile Tab Swapper */}
      <div className="flex md:hidden bg-[#050505] p-1.5 rounded-full mx-3 my-2 border border-[#111111] space-x-1 shrink-0">
        <button
          onClick={() => setMobileTab("docs")}
          className={`flex-1 text-center py-2.5 text-xs font-black rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
            mobileTab === "docs" ? "bg-[#E8730C] text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          Description & Input
        </button>
        <button
          onClick={() => setMobileTab("editor")}
          className={`flex-1 text-center py-2.5 text-xs font-black rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
            mobileTab === "editor" ? "bg-[#E8730C] text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          Code Editor
        </button>
      </div>

      {/* Main Split Layout Workspace */}
      <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden p-2 gap-2 bg-black pb-24 md:pb-2">
        
        {/* LEFT PANEL: JSON Input Panel & Problem View (40% width) */}
        <div className={`w-full md:w-[40%] md:min-w-[320px] flex flex-col h-full bg-gradient-to-b from-[#0a0a0a] to-[#040404] rounded-2xl border border-white/[0.04] shadow-[0_4px_30px_rgba(0,0,0,0.5)] overflow-hidden ${
          mobileTab === "docs" ? "flex" : "hidden md:flex"
        }`}>
          
          {/* Main Left Tabs (Description vs JSON Input) */}
          <div className="flex items-center bg-[#050505] h-[40px] shrink-0 text-sm px-3 space-x-1 select-none">
            <button
              onClick={() => {
                if (problem) setActiveTab("description");
              }}
              disabled={!problem}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full transition-all duration-300 font-bold cursor-pointer hover:scale-[1.02] active:scale-95 ${
                activeTab === "description"
                  ? "bg-[#E8730C]/10 text-[#E8730C] border border-[#E8730C]/20 shadow-[0_0_12px_rgba(232,115,12,0.15)]"
                  : "text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
              }`}
            >
              <BookOpen size={14} />
              <span>Description</span>
            </button>

            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full transition-all duration-300 font-bold cursor-pointer hover:scale-[1.02] active:scale-95 ${
                activeTab === "json"
                  ? "bg-[#E8730C]/10 text-[#E8730C] border border-[#E8730C]/20 shadow-[0_0_12px_rgba(232,115,12,0.15)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Code size={14} />
              <span>JSON Input</span>
            </button>
          </div>

          {/* Left Panel Body Content */}
          <div className="flex-1 overflow-hidden relative bg-transparent">
            {activeTab === "description" && problem ? (
              <ProblemDescription problem={problem} code={code} />
            ) : (
              <JSONInput
                onRender={handleRenderProblem}
                initialValue={problem ? JSON.stringify(problem, null, 2) : undefined}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Code Editor & Simulation Output (60% width) */}
        <div className={`w-full md:w-[60%] flex flex-col h-full bg-gradient-to-b from-[#0a0a0a] to-[#040404] rounded-2xl border border-white/[0.04] shadow-[0_4px_30px_rgba(0,0,0,0.5)] overflow-hidden ${
          mobileTab === "editor" ? "flex" : "hidden md:flex"
        }`}>
          {problem ? (
            <CodeEditor
              problem={problem}
              code={code}
              onChange={setCode}
            />
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-transparent text-gray-400 font-sans space-y-4">
              <div className="p-4 bg-[#111111] rounded-2xl text-[#E8730C] border border-[#222]">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold text-base">No Problem Loaded</h3>
                <p className="text-xs text-gray-500">Provide a JSON problem structure in JSON Input tab to get started.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );

}
