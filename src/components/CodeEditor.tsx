"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Settings, RotateCcw, ChevronUp, ChevronDown, CheckCircle2, PlayCircle, Loader2, AlertCircle, XCircle } from "lucide-react";
import { ProblemData } from "@/app/types";

interface CodeEditorProps {
  problem: ProblemData;
  code: string;
  onChange: (value: string) => void;
}

interface RunResult {
  success: boolean;
  status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Compile Error" | "";
  output?: string;
  expected?: string;
  error?: string;
  runtime?: string;
  memory?: string;
  input: string;
}

function getStarterCode(problem: ProblemData) {
  return problem.starter_code.cpp || "";
}

export default function CodeEditor({ problem, code, onChange }: CodeEditorProps) {
  const language = "cpp";
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-reset run state, update custom input when problem changes
  useEffect(() => {
    setHasRun(false);
    setIsRunning(false);
    setIsConsoleOpen(false);
    setRunResult(null);
    
    const firstExample = problem.examples[0];
    setCustomInput(firstExample ? firstExample.input : "");
  }, [problem.id, problem.examples]);

  // Load starter code template when switching problem
  useEffect(() => {
    const starter = getStarterCode(problem);

    onChange(starter);
    setRunResult(null);
    setHasRun(false);
  }, [problem, onChange]);

  const handleResetCode = () => {
    if (window.confirm(`Are you sure you want to reset your code to the C++ starter template?`)) {
      onChange(getStarterCode(problem));
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setIsConsoleOpen(true);
    setConsoleTab("result");
    
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          input: customInput,
          starterCode: problem.starter_code.cpp,
          language,
        }),
      });

      const result = await response.json();
      
      let expectedOutput = "";
      const matchingExample = problem.examples.find(
        ex => ex.input.trim() === customInput.trim()
      );
      if (matchingExample) {
        expectedOutput = matchingExample.output;
      } else if (problem.examples.length > 0) {
        expectedOutput = problem.examples[0].output;
      }

      let status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Compile Error" = "Accepted";
      let formattedOutput = "";
      
      if (!result.success) {
        status = result.error?.includes("Compile Error:") ? "Compile Error" : "Runtime Error";
      } else {
        formattedOutput = String(result.output);

        if (expectedOutput) {
          const cleanOutput = formattedOutput.replace(/\s+/g, "").toLowerCase();
          const cleanExpected = expectedOutput.replace(/\s+/g, "").toLowerCase();
          if (cleanOutput !== cleanExpected) {
            status = "Wrong Answer";
          }
        }
      }

      setRunResult({
        success: result.success,
        status,
        output: formattedOutput,
        expected: expectedOutput || undefined,
        error: result.error,
        runtime: result.runtime || `${Math.floor(Math.random() * 5) + 1} ms`,
        memory: result.memory || `${(Math.random() * 1.5 + 4).toFixed(1)} MB`,
        input: customInput
      });
    } catch (err) {
      setRunResult({
        success: false,
        status: "Runtime Error",
        error: err instanceof Error ? err.message : String(err),
        input: customInput
      });
    } finally {
      setIsRunning(false);
      setHasRun(true);
    }
  };

  const handleSubmitCode = async () => {
    setIsRunning(true);
    setIsConsoleOpen(true);
    setConsoleTab("result");
    
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          input: "",
          starterCode: problem.starter_code.cpp,
          language,
          testCases: problem.test_cases || []
        }),
      });

      const result = await response.json();
      
      let status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Compile Error" = "Accepted";
      let errorDetails = result.error || "";
      let outputDetails = result.output || "";
      let inputDetails = "Batch Submission";
      let expectedDetails = "";

      if (!result.success) {
        if (result.status === "Wrong Answer") {
          status = "Wrong Answer";
          inputDetails = result.failed_case?.input || "";
          expectedDetails = result.failed_case?.expected || "";
          outputDetails = result.failed_case?.actual || "";
          errorDetails = `Wrong Answer on testcase ${result.passed + 1} / ${result.total}:\n\nInput:\n${inputDetails}\n\nExpected:\n${expectedDetails}\n\nGot:\n${outputDetails}`;
        } else if (result.error?.includes("Compile Error:")) {
          status = "Compile Error";
        } else {
          status = "Runtime Error";
        }
      } else {
        outputDetails = `Accepted: All ${result.passed} / ${result.total} test cases passed!`;

        // Record submission (non-blocking)
        fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problemSlug: problem.slug,
            language,
            status: "Accepted",
            runtimeMs: parseFloat(result.runtime ?? "0"),
          }),
        }).catch(() => {});
      }

      setRunResult({
        success: result.success,
        status,
        output: outputDetails,
        expected: expectedDetails || undefined,
        error: errorDetails,
        runtime: result.runtime || `${Math.floor(Math.random() * 20) + 10} ms`,
        memory: result.memory || `${(Math.random() * 2 + 5).toFixed(1)} MB`,
        input: inputDetails
      });
    } catch (err) {
      setRunResult({
        success: false,
        status: "Runtime Error",
        error: err instanceof Error ? err.message : String(err),
        input: "Batch Submission"
      });
    } finally {
      setIsRunning(false);
      setHasRun(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-[#eff2f6f2] relative overflow-hidden select-none font-sans text-sm">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 bg-[#050505] h-[40px] shrink-0">
        <div className="flex items-center space-x-2 select-none">
          <span className="bg-[#111111] text-[#eff2f6f2] font-black px-4 py-1.5 rounded-full border border-[#222] text-xs">
            C++ (GCC 13)
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleResetCode} 
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors font-bold text-xs"
            title="Reset code"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800" 
              title="Settings"
            >
              <Settings size={14} />
            </button>
            
            {showSettings && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0a0a0a] border border-zinc-800 rounded-lg shadow-xl p-3 z-30">
                <div className="text-xs font-bold text-gray-400 mb-2">Font Size</div>
                <div className="grid grid-cols-5 gap-1 bg-zinc-900 rounded p-1">
                  {[12, 14, 16, 18, 20].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setFontSize(size);
                        setShowSettings(false);
                      }}
                      className={`text-xs py-1.5 rounded transition-colors text-center ${
                        fontSize === size 
                          ? "bg-[#E8730C] text-white font-bold" 
                          : "text-gray-400 hover:text-white hover:bg-zinc-800"
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Editor Workspace */}
      <div className="flex-1 w-full relative">
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          theme="vs-dark"
          value={code}
          onChange={(val) => onChange(val || "")}
          options={{
            fontSize: fontSize,
            fontWeight: "bold",
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            fontFamily: "var(--font-geist-mono), monospace",
            lineNumbers: "on",
            renderLineHighlight: "all",
          }}
        />

        {/* Collapsible Console / Run Drawer */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-[#0a0a0a] transition-all duration-300 ease-in-out z-10 flex flex-col shadow-2xl ${
            isConsoleOpen ? "h-[280px]" : "h-0"
          }`}
        >
          {isConsoleOpen && (
            <>
              {/* Drawer Header Tabs */}
              <div className="flex items-center justify-between px-4 bg-[#050505] h-[40px] shrink-0">
                <div className="flex items-center space-x-4 h-full text-xs font-bold">
                  <button 
                    onClick={() => setConsoleTab("testcase")}
                    className={`h-full px-1.5 transition-colors ${
                      consoleTab === "testcase" ? "text-[#E8730C]" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Testcase
                  </button>
                  <button 
                    onClick={() => setConsoleTab("result")}
                    className={`h-full px-1.5 transition-colors ${
                      consoleTab === "result" ? "text-[#E8730C]" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Result
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsConsoleOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-4 font-mono text-sm overflow-y-auto scrollbar-thin select-text">
                {consoleTab === "testcase" ? (
                  <div className="space-y-2 h-full flex flex-col">
                    <div className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Input</div>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="e.g. nums = [2,7,11,15], target = 9"
                      className="flex-1 w-full bg-black rounded p-3 text-gray-200 font-mono text-xs leading-relaxed outline-none focus:ring-1 focus:ring-[#E8730C] resize-none border-none"
                      spellCheck="false"
                    />
                  </div>
                ) : (
                  <div className="h-full">
                    {isRunning ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-2.5 text-gray-400">
                        <Loader2 className="animate-spin text-[#E8730C]" size={24} />
                        <span className="font-bold text-xs">Compiling & Running...</span>
                      </div>
                    ) : hasRun && runResult ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2">
                          <div className="flex items-center space-x-2">
                            {runResult.status === "Accepted" ? (
                              <>
                                <CheckCircle2 size={16} className="text-[#00b8a3]" />
                                <span className="text-[#00b8a3] font-bold text-base">Accepted</span>
                              </>
                            ) : runResult.status === "Wrong Answer" ? (
                              <>
                                <XCircle size={16} className="text-[#ff375f]" />
                                <span className="text-[#ff375f] font-bold text-base">Wrong Answer</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={16} className="text-[#ff375f]" />
                                <span className="text-[#ff375f] font-bold text-base">{runResult.status}</span>
                              </>
                            )}
                            
                            {runResult.success && (
                              <div className="flex items-center space-x-2.5 text-xs text-gray-400 bg-[#111111] px-3 py-1 rounded ml-2 font-bold">
                                <span>Runtime: {runResult.runtime}</span>
                                <span>Memory: {runResult.memory}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {!runResult.success ? (
                          <div className="space-y-1">
                            <span className="text-[10px] text-red-400 font-bold block uppercase tracking-wider">Error Details</span>
                            <pre className="bg-red-950/20 text-red-300 p-4 rounded leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[175px] font-mono text-xs">
                              {runResult.error}
                            </pre>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Input</span>
                              <div className="bg-black p-3 rounded text-gray-200 overflow-x-auto select-all max-h-[110px] whitespace-pre-wrap leading-relaxed font-mono text-xs">
                                {runResult.input}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Output</span>
                              <div className={`bg-black p-3 rounded overflow-x-auto select-all max-h-[110px] whitespace-pre-wrap leading-relaxed font-mono text-xs font-bold ${
                                runResult.status === "Accepted" ? "text-[#00b8a3]" : "text-[#ff375f]"
                              }`}>
                                {runResult.output}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Expected</span>
                              <div className="bg-black p-3 rounded text-gray-200 overflow-x-auto select-all max-h-[110px] whitespace-pre-wrap leading-relaxed font-mono text-xs">
                                {runResult.expected || "N/A"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-2 text-gray-400 text-center py-6">
                        <PlayCircle size={32} className="text-gray-500" />
                        <span className="font-bold text-xs">Run code to view results.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Editor Footer */}
      <div className="flex items-center justify-between px-4 bg-[#050505] h-[58px] md:h-[50px] shrink-0 z-20">
        <button
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          className="flex items-center space-x-1.5 px-4.5 py-2 rounded-full bg-[#111111] hover:bg-[#222] border border-[#222] text-sm font-bold text-gray-300 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <span>Console</span>
          {isConsoleOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center space-x-2 px-5 py-2 rounded-full bg-[#111111] hover:bg-[#222] border border-[#222] active:bg-[#000] disabled:opacity-50 text-sm font-bold text-white transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Play size={11} fill="white" />
            <span>Run</span>
          </button>
          
          <button
            onClick={handleSubmitCode}
            disabled={isRunning || !problem.test_cases || problem.test_cases.length === 0}
            className="px-6 py-2 rounded-full bg-[#00b8a3] hover:bg-[#00c9b2] active:bg-[#009c8a] disabled:opacity-50 text-sm font-black text-black transition-all duration-200 active:scale-95 cursor-pointer flex items-center space-x-1"
          >
            {isRunning ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
            <span>Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
