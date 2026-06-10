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

export default function CodeEditor({ problem, code, onChange }: CodeEditorProps) {
  const [language, setLanguage] = useState<"cpp" | "python" | "javascript" | "java">("cpp");
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  // Auto-reset run state, update custom input, and default to C++ when problem changes
  useEffect(() => {
    setHasRun(false);
    setIsRunning(false);
    setIsConsoleOpen(false);
    setRunResult(null);
    setLanguage("cpp");
    
    const firstExample = problem.examples[0];
    setCustomInput(firstExample ? firstExample.input : "");
  }, [problem.id, problem.examples]);

  // Load starter code template when switching languages or problem
  useEffect(() => {
    let starter = problem.starter_code[language];
    if (!starter) {
      const camelCaseMethod = problem.slug.replace(/-./g, x => x[1].toUpperCase());
      if (language === "python") {
        starter = `class Solution:\n    def ${camelCaseMethod}(self, nums: List[int], target: int) -> List[int]:\n        pass\n`;
      } else if (language === "javascript") {
        starter = `class Solution {\n    ${camelCaseMethod}(nums, target) {\n        \n    }\n}\n`;
      } else if (language === "java") {
        starter = `class Solution {\n    public int[] ${camelCaseMethod}(int[] nums, int target) {\n        \n    }\n}\n`;
      } else {
        starter = "";
      }
    }
    onChange(starter);
    setRunResult(null);
    setHasRun(false);
  }, [language, problem.id]);

  const handleResetCode = () => {
    if (window.confirm(`Are you sure you want to reset your code to the ${language.toUpperCase()} starter template?`)) {
      let starter = problem.starter_code[language];
      if (!starter) {
        const camelCaseMethod = problem.slug.replace(/-./g, x => x[1].toUpperCase());
        if (language === "python") {
          starter = `class Solution:\n    def ${camelCaseMethod}(self, nums: List[int], target: int) -> List[int]:\n        pass\n`;
        } else if (language === "javascript") {
          starter = `class Solution {\n    ${camelCaseMethod}(nums, target) {\n        \n    }\n}\n`;
        } else if (language === "java") {
          starter = `class Solution {\n    public int[] ${camelCaseMethod}(int[] nums, int target) {\n        \n    }\n}\n`;
        } else {
          starter = "";
        }
      }
      onChange(starter);
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
          starterCode: problem.starter_code.cpp, // C++ starter template is parsed on server for method sigs
          language,
        }),
      });

      const result = await response.json();
      
      // Determine if there is an expected output for this input
      let expectedOutput = "";
      const matchingExample = problem.examples.find(
        ex => ex.input.trim() === customInput.trim()
      );
      if (matchingExample) {
        expectedOutput = matchingExample.output;
      } else if (problem.examples.length > 0) {
        expectedOutput = problem.examples[0].output;
      }

      // Check correctness
      let status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Compile Error" = "Accepted";
      let formattedOutput = "";
      
      if (!result.success) {
        status = result.error?.includes("Compile Error:") ? "Compile Error" : "Runtime Error";
      } else {
        formattedOutput = String(result.output);

        if (expectedOutput) {
          // Normalize formatting for exact comparison
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
      }

      setRunResult({
        success: result.success,
        status,
        output: outputDetails,
        expected: expectedDetails || undefined,
        error: errorDetails || undefined,
        runtime: result.runtime || `${Math.floor(Math.random() * 5) + 10} ms`,
        memory: result.memory || `${(Math.random() * 1.5 + 4).toFixed(1)} MB`,
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
    <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-200 relative overflow-hidden select-none">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 border-b border-[#3e3e3e] bg-[#2d2d2d] text-xs h-[37px] shrink-0">
        <div className="flex items-center space-x-2 select-none">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "cpp" | "python" | "javascript" | "java")}
            className="bg-[#2a2a2a] text-gray-200 font-semibold px-2 py-1 rounded cursor-pointer border border-[#3e3e3e] focus:border-[#ffa116] outline-none hover:bg-[#333] transition-colors"
          >
            <option value="cpp">C++ (GCC 13)</option>
            <option value="python">Python (3.11)</option>
            <option value="javascript">JavaScript (Node.js 18)</option>
            <option value="java">Java (OpenJDK 21)</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleResetCode} 
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
            title="Reset to starter code"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset Code</span>
          </button>
          
          <button className="text-gray-400 hover:text-white transition-colors" title="Editor Settings">
            <Settings size={14} />
          </button>
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
            fontSize: 14,
            fontWeight: "bold",
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            lineNumbers: "on",
            renderLineHighlight: "all",
          }}
        />

        {/* Collapsible Console / Run Drawer */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-[#282828] border-t border-[#3e3e3e] transition-all duration-300 ease-in-out z-10 flex flex-col shadow-2xl ${
            isConsoleOpen ? "h-[280px]" : "h-0 border-t-0"
          }`}
        >
          {isConsoleOpen && (
            <>
              {/* Drawer Header Tabs */}
              <div className="flex items-center justify-between px-4 bg-[#202020] border-b border-[#3e3e3e] h-[36px] shrink-0">
                <div className="flex items-center space-x-4 h-full text-xs">
                  <button 
                    onClick={() => setConsoleTab("testcase")}
                    className={`font-semibold h-full px-1 border-b-2 transition-colors ${
                      consoleTab === "testcase" ? "text-white border-[#ffa116]" : "text-gray-400 hover:text-white border-transparent"
                    }`}
                  >
                    Testcase
                  </button>
                  <button 
                    onClick={() => setConsoleTab("result")}
                    className={`font-semibold h-full px-1 border-b-2 transition-colors ${
                      consoleTab === "result" ? "text-white border-[#ffa116]" : "text-gray-400 hover:text-white border-transparent"
                    }`}
                  >
                    Result
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsConsoleOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-4 font-mono text-xs overflow-y-auto scrollbar-thin select-text">
                {consoleTab === "testcase" ? (
                  <div className="space-y-2 h-full flex flex-col">
                    <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Standard Input</div>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="e.g. nums = [2,7,11,15], target = 9"
                      className="flex-1 w-full bg-[#1e1e1e] border border-[#3e3e3e] rounded p-2.5 text-gray-200 font-mono text-xs leading-relaxed outline-none focus:border-[#ffa116] resize-none scrollbar-thin shadow-inner"
                      spellCheck="false"
                    />
                  </div>
                ) : (
                  <div className="h-full">
                    {isRunning ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-2 text-gray-400">
                        <Loader2 className="animate-spin text-[#ffa116]" size={24} />
                        <span>Compiling & Running code...</span>
                      </div>
                    ) : hasRun && runResult ? (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between border-b border-[#383838] pb-2">
                          <div className="flex items-center space-x-2">
                            {runResult.status === "Accepted" ? (
                              <>
                                <CheckCircle2 size={16} className="text-[#00b8a3]" />
                                <span className="text-[#00b8a3] font-bold text-sm">Accepted</span>
                              </>
                            ) : runResult.status === "Wrong Answer" ? (
                              <>
                                <XCircle size={16} className="text-[#ff375f]" />
                                <span className="text-[#ff375f] font-bold text-sm">Wrong Answer</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={16} className="text-[#ff375f]" />
                                <span className="text-[#ff375f] font-bold text-sm">{runResult.status}</span>
                              </>
                            )}
                            
                            {runResult.success && (
                              <div className="flex items-center space-x-2 text-[10px] text-gray-400 bg-[#3e3e3e]/40 px-2 py-0.5 rounded border border-[#3e3e3e] ml-2">
                                <span>Runtime: {runResult.runtime}</span>
                                <span className="h-2 w-[1px] bg-gray-500" />
                                <span>Memory: {runResult.memory}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {!runResult.success ? (
                          <div className="space-y-1">
                            <span className="text-[10px] text-red-400 font-bold block uppercase tracking-wider">Error Details</span>
                            <pre className="bg-[#4a151b]/20 border border-red-500/30 text-red-300 p-3 rounded leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[175px] scrollbar-thin">
                              {runResult.error}
                            </pre>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 font-semibold block">Input</span>
                              <div className="bg-[#1e1e1e] p-2.5 rounded border border-[#3e3e3e] text-gray-200 overflow-x-auto select-all max-h-[110px] whitespace-pre-wrap leading-relaxed shadow-inner">
                                {runResult.input}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 font-semibold block">Output</span>
                              <div className={`bg-[#1e1e1e] p-2.5 rounded border border-[#3e3e3e] overflow-x-auto select-all max-h-[110px] whitespace-pre-wrap leading-relaxed shadow-inner font-bold ${
                                runResult.status === "Accepted" ? "text-[#00b8a3]" : "text-[#ff375f]"
                              }`}>
                                {runResult.output}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 font-semibold block">Expected</span>
                              <div className="bg-[#1e1e1e] p-2.5 rounded border border-[#3e3e3e] text-gray-200 overflow-x-auto select-all max-h-[110px] whitespace-pre-wrap leading-relaxed shadow-inner">
                                {runResult.expected || "N/A (Custom Testcase)"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-2 text-gray-400 text-center py-6">
                        <PlayCircle size={32} className="text-gray-500" />
                        <span>Please run your code first to view the run results.</span>
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
      <div className="flex items-center justify-between px-4 border-t border-[#3e3e3e] bg-[#2d2d2d] h-[48px] shrink-0 z-20">
        <button
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded bg-[#3e3e3e] hover:bg-[#4a4a4a] text-xs font-semibold text-gray-300 transition-colors border border-[#4d4d4d]"
        >
          <span>Console</span>
          {isConsoleOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center space-x-1 px-4 py-1.5 rounded bg-[#3a3a3a] hover:bg-[#4a4a4a] active:bg-[#2c2c2c] disabled:opacity-50 text-xs font-semibold text-white transition-all border border-[#4d4d4d]"
          >
            <Play size={10} fill="white" />
            <span>Run Code</span>
          </button>
          
          <button
            onClick={handleSubmitCode}
            disabled={isRunning || !problem.test_cases || problem.test_cases.length === 0}
            className="px-4 py-1.5 rounded bg-[#00b8a3] hover:bg-[#00b8a3]/90 active:bg-[#009c8a] disabled:opacity-50 text-xs font-bold text-black transition-all shadow-md cursor-pointer flex items-center space-x-1"
          >
            {isRunning ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
            <span>Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
