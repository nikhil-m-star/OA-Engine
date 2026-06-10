import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Play, Code, Sparkles, Copy, X, Check } from "lucide-react";
import { ProblemData } from "@/app/types";

interface JSONInputProps {
  onRender: (data: ProblemData) => void;
  initialValue?: string;
}

const AI_PROMPT_TEXT = `Please convert the following LeetCode problem into a structured JSON object. The output must strictly follow the schema below, without any surrounding markdown commentary (just return the raw JSON block).

{
  "id": 1,
  "title": "Two Sum",
  "slug": "two-sum",
  "difficulty": "Easy",
  "tags": ["Array", "Hash Map"],
  "description": "<p>Given an array of integers <code>nums</code> and an integer <code>target</code>...</p>",
  "constraints": ["2 <= nums.length <= 10^4"],
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ],
  "follow_up": "Can you solve it in O(n) time complexity?",
  "companies": ["Google", "Meta"],
  "test_cases": [
    // Must contain a minimum of 30 diverse and comprehensive test cases
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]"
    }
  ],
  "starter_code": {
    "cpp": "class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        \\n    }\\n};"
  }
}

Problem to Convert:
[Paste your LeetCode problem here]`;

const DEFAULT_TEMPLATE: ProblemData = {
  id: 1,
  title: "Two Sum",
  slug: "two-sum",
  difficulty: "Easy",
  tags: ["Array", "Hash Map"],
  companies: ["Google", "Adobe"],
  description: "<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <i>indices of the two numbers such that they add up to <code>target</code></i>.</p><p>You may assume that each input would have <b><i>exactly</i> one solution</b>, and you may not use the <i>same</i> element twice.</p><p>You can return the answer in any order.</p>",
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists."
  ],
  examples: [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    },
    {
      "input": "nums = [3,2,4], target = 6",
      "output": "[1,2]",
      "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
    },
    {
      "input": "nums = [3,3], target = 6",
      "output": "[0,1]"
    }
  ],
  test_cases: [
    { "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]" },
    { "input": "nums = [3,2,4], target = 6", "output": "[1,2]" },
    { "input": "nums = [3,3], target = 6", "output": "[0,1]" }
  ],
  follow_up: "Can you solve it in O(n) time complexity?",
  starter_code: {
    cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};"
  }
};

export default function JSONInput({ onRender, initialValue }: JSONInputProps) {
  const [activeSubTab, setActiveSubTab] = useState<"json" | "ai">("json");
  const [jsonText, setJsonText] = useState(
    initialValue || JSON.stringify(DEFAULT_TEMPLATE, null, 2)
  );
  const [rawText, setRawText] = useState("");
  const [companiesInput, setCompaniesInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      setError(`Format Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleLoadDemo = () => {
    setJsonText(JSON.stringify(DEFAULT_TEMPLATE, null, 2));
    setRawText("");
    setCompaniesInput("");
    setError(null);
    setSuccess(false);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEXT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const validateAndRender = (text: string) => {
    if (!text.trim()) {
      throw new Error("JSON input cannot be empty.");
    }

    const parsed = JSON.parse(text);

    // Initialize or validate companies array
    if (!parsed.companies) {
      parsed.companies = [];
    } else if (!Array.isArray(parsed.companies)) {
      throw new Error('Field "companies" must be an array of strings.');
    }

    // Initialize or validate test_cases array
    if (!parsed.test_cases) {
      parsed.test_cases = [];
    } else if (!Array.isArray(parsed.test_cases)) {
      throw new Error('Field "test_cases" must be an array.');
    } else {
      parsed.test_cases.forEach((tc: unknown, idx: number) => {
        if (!tc || typeof tc !== "object") {
          throw new Error(`Test case ${idx + 1} must be an object.`);
        }
        const caseObj = tc as Record<string, unknown>;
        if (!("input" in caseObj) || !("output" in caseObj)) {
          throw new Error(`Test case ${idx + 1} is missing "input" or "output" fields.`);
        }
      });
    }

    // Validate required keys
    const requiredKeys = ["id", "title", "slug", "difficulty", "tags", "description", "constraints", "examples", "starter_code"];
    for (const key of requiredKeys) {
      if (!(key in parsed)) {
        throw new Error(`Missing required field: "${key}"`);
      }
    }

    // Validate examples structure
    if (!Array.isArray(parsed.examples)) {
      throw new Error('Field "examples" must be an array.');
    }
    parsed.examples.forEach((exampleObj: unknown, idx: number) => {
      if (!exampleObj || typeof exampleObj !== "object") {
        throw new Error(`Example ${idx + 1} must be an object.`);
      }
      const example = exampleObj as Record<string, unknown>;
      if (!("input" in example) || !("output" in example)) {
        throw new Error(`Example ${idx + 1} is missing "input" or "output" fields.`);
      }
    });

    // Validate starter code
    if (!parsed.starter_code || typeof parsed.starter_code !== "object" || !parsed.starter_code.cpp) {
      throw new Error('Field "starter_code" must be an object containing "cpp" starter code.');
    }

    // Validated successfully
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onRender(parsed as ProblemData);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      validateAndRender(jsonText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON syntax.");
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setError(null);
    setIsGenerating(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: rawText }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `NIM API Generation failed with status ${response.status}`);
      }

      const parsedData = result.data;

      // Extract and merge user-entered companies
      const userCompanies = companiesInput
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const aiCompanies = Array.isArray(parsedData.companies) ? parsedData.companies : [];
      const mergedCompanies = Array.from(
        new Set([...aiCompanies, ...userCompanies])
      );

      parsedData.companies = mergedCompanies;

      if (!parsedData.test_cases) {
        parsedData.test_cases = [];
      }

      // Validate schema format before rendering
      const requiredKeys = ["id", "title", "slug", "difficulty", "tags", "description", "constraints", "examples", "starter_code"];
      for (const key of requiredKeys) {
        if (!(key in parsedData)) {
          throw new Error(`AI generated JSON is missing required field: "${key}"`);
        }
      }

      // Success, write it to JSON tab and render
      setJsonText(JSON.stringify(parsedData, null, 2));
      setActiveSubTab("json"); // Switch back to JSON tab so they can see the generated output
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        onRender(parsedData as ProblemData);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected parsing error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#282828] text-gray-200 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3e3e3e] bg-[#2d2d2d] shrink-0">
        <div className="flex items-center space-x-2">
          <Code size={16} className="text-[#ffa116]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300">Workspace Generator</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPromptModal(true)}
            className="flex items-center space-x-1 text-xs text-[#ffa116] hover:text-[#ffb84d] transition-colors font-medium cursor-pointer"
          >
            <Sparkles size={12} fill="#ffa116" className="animate-pulse" />
            <span>AI Prompt Helper</span>
          </button>
          <button
            onClick={handleLoadDemo}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Reset Demo
          </button>
        </div>
      </div>

      {/* Sub Tabs Selection */}
      <div className="flex bg-[#222] border-b border-[#3e3e3e] px-4 py-1.5 space-x-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("json");
            setError(null);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === "json"
              ? "bg-[#2d2d2d] text-white border border-[#3e3e3e]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Paste JSON
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("ai");
            setError(null);
          }}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === "ai"
              ? "bg-[#2d2d2d] text-white border border-[#3e3e3e]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Sparkles size={11} fill={activeSubTab === "ai" ? "#ffa116" : "none"} className={activeSubTab === "ai" ? "text-[#ffa116]" : ""} />
          <span>AI Generator</span>
        </button>
      </div>

      {/* Editor Body */}
      {activeSubTab === "json" ? (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
          <div className="flex-1 relative flex flex-col font-mono text-sm">
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste your LeetCode problem JSON here..."
              className="flex-1 w-full bg-[#1e1e1e] text-[#c5c8c6] border border-[#3e3e3e] rounded-lg p-3 outline-none focus:border-[#ffa116] font-mono text-xs leading-relaxed resize-none overflow-y-auto scrollbar-thin shadow-inner"
              spellCheck="false"
            />
          </div>

          {/* Feedback / Errors */}
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-400 text-xs">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div className="break-all font-mono whitespace-pre-wrap">{error}</div>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-950/40 border border-green-500/30 rounded-lg text-green-400 text-xs">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>Success! Loaded workspace.</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={handleFormat}
              className="px-3 py-2 text-xs bg-[#3a3a3a] hover:bg-[#484848] active:bg-[#2e2e2e] text-white rounded-md font-semibold transition-all border border-[#4d4d4d]"
            >
              Format JSON
            </button>
            
            <button
              type="submit"
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#ffa116] hover:bg-[#ffa116]/90 active:bg-[#e68e0f] text-black font-bold rounded-md text-xs transition-all shadow-md cursor-pointer"
            >
              <Play size={13} fill="black" />
              <span>Render Problem</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleAiSubmit} className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
          <div className="flex-1 relative flex flex-col font-mono text-sm min-h-0">
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (error) setError(null);
              }}
              disabled={isGenerating}
              placeholder="Paste raw LeetCode description text here..."
              className="flex-1 w-full bg-[#1e1e1e] text-[#c5c8c6] border border-[#3e3e3e] rounded-lg p-3 outline-none focus:border-[#ffa116] font-sans text-xs leading-relaxed resize-none overflow-y-auto scrollbar-thin shadow-inner disabled:opacity-50"
              spellCheck="false"
            />
          </div>

          {/* Companies Input Field */}
          <div className="space-y-1.5 shrink-0">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Companies (optional, comma-separated)
            </label>
            <input
              type="text"
              value={companiesInput}
              onChange={(e) => setCompaniesInput(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g. Google, Meta, Microsoft"
              className="w-full bg-[#1e1e1e] text-white border border-[#3e3e3e] rounded-lg px-3 py-2.5 outline-none focus:border-[#ffa116] font-sans text-xs shadow-inner disabled:opacity-50"
            />
          </div>

          {/* Feedback / Errors */}
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-400 text-xs">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div className="break-all font-mono whitespace-pre-wrap">{error}</div>
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center space-x-2.5 p-3 bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg text-gray-400 text-xs font-medium">
              <div className="w-3.5 h-3.5 border-2 border-t-[#ffa116] border-r-transparent border-b-[#ffa116] border-l-transparent rounded-full animate-spin shrink-0" />
              <span>AI is parsing description...</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-950/40 border border-green-500/30 rounded-lg text-green-400 text-xs font-medium">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span>Problem loaded.</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="submit"
              disabled={isGenerating || !rawText.trim()}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#ffa116] hover:bg-[#ffa116]/90 active:bg-[#e68e0f] disabled:bg-[#ffa116]/40 disabled:text-black/50 text-black font-bold rounded-md text-xs transition-all shadow-md disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles size={13} fill="currentColor" />
              <span>{isGenerating ? "NIM AI Parsing..." : "Parse & Render Problem"}</span>
            </button>
          </div>
        </form>
      )}

      {/* AI Prompt Modal Glassmorphic Overlay */}
      {showPromptModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#2d2d2d] border border-[#444] rounded-xl shadow-2xl w-full max-w-md max-h-[85%] flex flex-col overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3e3e3e] bg-[#222]">
              <div className="flex items-center space-x-2 text-white font-semibold text-xs">
                <Sparkles size={14} className="text-[#ffa116]" fill="#ffa116" />
                <span>AI Prompt Generator Helper</span>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs scrollbar-thin">
              <p className="text-gray-300 leading-relaxed font-sans">
                Use this prompt template to convert any LeetCode problem copy-paste into the required JSON schema.
              </p>

              <div className="relative bg-[#1e1e1e] p-3 rounded-lg border border-[#3e3e3e] font-mono text-[10px] text-gray-400 select-all max-h-[220px] overflow-y-auto scrollbar-thin">
                <pre className="whitespace-pre-wrap leading-relaxed select-text">
                  {AI_PROMPT_TEXT}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#202020] border-t border-[#3e3e3e] flex items-center justify-end space-x-2 shrink-0">
              <button
                onClick={handleCopyPrompt}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#ffa116] hover:bg-[#ffa116]/95 active:bg-[#e68e0f] text-black font-bold rounded-md text-xs transition-all shadow-md cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <Check size={13} className="text-black" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-black" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-3 py-2 text-xs bg-[#3a3a3a] hover:bg-[#484848] text-white rounded-md font-semibold transition-all border border-[#4d4d4d]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
