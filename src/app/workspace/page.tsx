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

    // Post to Neon DB in the background
    try {
      const response = await fetch("/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
    <div className="flex flex-col h-screen overflow-hidden bg-black select-none text-gray-200 font-sans">
      {/* Top Navbar */}
      <Navbar
        problemId={problem?.id}
        problemTitle={problem?.title}
        onReset={handleResetData}
        hasProblem={!!problem}
      />

      {/* Main Split Layout Workspace */}
      <div className="flex-1 flex w-full overflow-hidden p-2 gap-2 bg-black">
        
        {/* LEFT PANEL: JSON Input Panel & Problem View (40% width) */}
        <div className="w-[40%] min-w-[320px] flex flex-col h-full bg-[#0a0a0a] rounded-xl overflow-hidden">
          
          {/* Main Left Tabs (Description vs JSON Input) */}
          <div className="flex items-center bg-[#050505] h-[40px] shrink-0 text-sm px-3 space-x-1 select-none">
            <button
              onClick={() => {
                if (problem) setActiveTab("description");
              }}
              disabled={!problem}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded transition-all font-bold ${
                activeTab === "description"
                  ? "bg-[#111111] text-[#E8730C]"
                  : "text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
              }`}
            >
              <BookOpen size={14} />
              <span>Description</span>
            </button>

            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded transition-all font-bold cursor-pointer ${
                activeTab === "json"
                  ? "bg-[#111111] text-[#E8730C]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Code size={14} />
              <span>JSON Input</span>
            </button>
          </div>

          {/* Left Panel Body Content */}
          <div className="flex-1 overflow-hidden relative bg-[#0a0a0a]">
            {activeTab === "description" && problem ? (
              <ProblemDescription problem={problem} />
            ) : (
              <JSONInput
                onRender={handleRenderProblem}
                initialValue={problem ? JSON.stringify(problem, null, 2) : undefined}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Code Editor & Simulation Output (60% width) */}
        <div className="w-[60%] flex flex-col h-full bg-[#0a0a0a] rounded-xl overflow-hidden">
          {problem ? (
            <CodeEditor
              problem={problem}
              code={code}
              onChange={setCode}
            />
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-[#0a0a0a] text-gray-400 font-sans space-y-4">
              <div className="p-3.5 bg-[#111111] rounded-full text-[#E8730C]">
                <AlertTriangle size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm">No Problem Loaded</h3>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
