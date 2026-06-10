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
    <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e1e] text-gray-400 font-mono text-xs">
      <div className="w-5 h-5 border-2 border-t-[#ffa116] border-r-transparent border-b-[#ffa116] border-l-transparent rounded-full animate-spin mb-2" />
      <span>Loading Monaco Workspace...</span>
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
      <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-gray-400 font-mono text-xs">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-6 h-6 border-2 border-t-[#ffa116] border-r-transparent border-b-[#ffa116] border-l-transparent rounded-full animate-spin" />
          <span>Loading Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1a1a1a] select-none text-gray-200">
      {/* Top Navbar */}
      <Navbar
        problemId={problem?.id}
        problemTitle={problem?.title}
        onReset={handleResetData}
        hasProblem={!!problem}
      />

      {/* Main Split Layout Workspace */}
      <div className="flex-1 flex w-full overflow-hidden p-1.5 gap-1.5 bg-[#1a1a1a]">
        
        {/* LEFT PANEL: JSON Input Panel & Problem View (40% width) */}
        <div className="w-[40%] min-w-[320px] flex flex-col h-full bg-[#282828] rounded-lg border border-[#383838] overflow-hidden">
          
          {/* Main Left Tabs (Description vs JSON Input) */}
          <div className="flex items-center bg-[#2d2d2d] border-b border-[#3e3e3e] h-[37px] shrink-0 text-xs px-2 space-x-1 select-none">
            <button
              onClick={() => {
                if (problem) setActiveTab("description");
              }}
              disabled={!problem}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded transition-all font-semibold ${
                activeTab === "description"
                  ? "bg-[#3e3e3e] text-white"
                  : "text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
              }`}
            >
              <BookOpen size={13} />
              <span>Description</span>
            </button>

            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded transition-all font-semibold cursor-pointer ${
                activeTab === "json"
                  ? "bg-[#3e3e3e] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Code size={13} />
              <span>JSON Input</span>
            </button>
          </div>

          {/* Left Panel Body Content */}
          <div className="flex-1 overflow-hidden relative">
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
        <div className="w-[60%] flex flex-col h-full bg-[#282828] rounded-lg border border-[#383838] overflow-hidden">
          {problem ? (
            <CodeEditor
              problem={problem}
              code={code}
              onChange={setCode}
            />
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-[#1e1e1e] text-gray-400 font-sans space-y-3">
              <div className="p-3 bg-[#2d2d2d] rounded-full border border-[#3e3e3e] text-[#ffa116]">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-semibold text-xs">No Problem Rendered</h3>
                <p className="text-[10px] text-gray-500">
                  Paste problem JSON or generate using NIM AI on the left panel.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
