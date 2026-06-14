import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Play, Code, Sparkles, Copy, X, Check } from "lucide-react";
import { ProblemData } from "@/app/types";

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
    // Generates a MINIMUM of 30 diverse and comprehensive test cases to verify code correctness.
    // VERIFY ALL TEST CASES CAREFULLY! Make sure the expected output accurately corresponds to the input for every single testcase.
    // Cover edge cases, boundaries, negative numbers, large/small inputs, and zeros.
    // Follow the input/output formatting of the examples exactly.
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]"
    }
  ],
  "starter_code": {
    "cpp": "class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        \\n    }\\n};",
    "python": "class Solution:\\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\\n        pass",
    "javascript": "class Solution {\\n    twoSum(nums, target) {\\n        \\n    }\\n}",
    "java": "class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        \\n    }\\n}"
  }
}`;

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

interface JSONInputProps {
  onRender: (data: ProblemData) => void;
  initialValue?: string;
}

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

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEXT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

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

  const validateAndRender = (text: string) => {
    if (!text.trim()) {
      throw new Error("JSON input cannot be empty.");
    }

    const parsed = JSON.parse(text);

    if (!parsed.companies) {
      parsed.companies = [];
    } else if (!Array.isArray(parsed.companies)) {
      throw new Error('Field "companies" must be an array of strings.');
    }

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

    const requiredKeys = ["id", "title", "slug", "difficulty", "tags", "description", "constraints", "examples", "starter_code"];
    for (const key of requiredKeys) {
      if (!(key in parsed)) {
        throw new Error(`Missing required field: "${key}"`);
      }
    }

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

    if (!parsed.starter_code || typeof parsed.starter_code !== "object" || !parsed.starter_code.cpp) {
      throw new Error('Field "starter_code" must be an object containing "cpp" starter code.');
    }

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
        throw new Error(result.error || `Generation failed with status ${response.status}`);
      }

      const parsedData = result.data;

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

      const requiredKeys = ["id", "title", "slug", "difficulty", "tags", "description", "constraints", "examples", "starter_code"];
      for (const key of requiredKeys) {
        if (!(key in parsedData)) {
          throw new Error(`AI generated JSON is missing required field: "${key}"`);
        }
      }

      setJsonText(JSON.stringify(parsedData, null, 2));
      setActiveSubTab("json");
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
    <div className="flex flex-col h-full bg-[#0a0a0a] text-[#eff2f6f2] relative font-sans text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#050505] shrink-0">
        <div className="flex items-center space-x-2">
          <Code size={16} className="text-[#E8730C]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">Generator</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPromptModal(true)}
            className="flex items-center space-x-1 text-xs text-[#E8730C] hover:text-[#F28B2D] transition-colors font-medium cursor-pointer"
          >
            <Sparkles size={12} fill="#E8730C" className="animate-pulse" />
            <span>AI Prompt Helper</span>
          </button>
          <button
            onClick={handleLoadDemo}
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            Reset Demo
          </button>
        </div>
      </div>

      {/* Sub Tabs Selection */}
      <div className="flex bg-[#030303] px-4 py-1.5 space-x-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("json");
            setError(null);
          }}
          className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "json"
              ? "bg-[#111111] text-[#E8730C]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          JSON
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("ai");
            setError(null);
          }}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "ai"
              ? "bg-[#111111] text-[#E8730C]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Sparkles size={11} fill={activeSubTab === "ai" ? "#E8730C" : "none"} className={activeSubTab === "ai" ? "text-[#E8730C]" : ""} />
          <span>AI</span>
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
              placeholder="Paste problem JSON here..."
              className="flex-1 w-full bg-black text-[#eff2f6f2] rounded-lg p-4 outline-none focus:ring-1 focus:ring-[#E8730C] font-mono text-xs leading-relaxed resize-none overflow-y-auto scrollbar-thin"
              spellCheck="false"
            />
          </div>

          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-950/40 rounded-lg text-red-400 text-xs">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <div className="break-all font-mono whitespace-pre-wrap">{error}</div>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-950/40 rounded-lg text-green-400 text-xs">
              <CheckCircle2 size={15} className="flex-shrink-0" />
              <span>Loaded successfully.</span>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1.5">
            <button
              type="button"
              onClick={handleFormat}
              className="px-4 py-2.5 text-xs bg-[#111111] hover:bg-[#222] text-white rounded-md font-bold transition-all"
            >
              Format
            </button>
            
            <button
              type="submit"
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#E8730C] hover:bg-[#F28B2D] text-black font-extrabold rounded-md text-xs transition-all cursor-pointer"
            >
              <Play size={13} fill="black" />
              <span>Render</span>
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
              placeholder="Paste raw description text here..."
              className="flex-1 w-full bg-black text-[#eff2f6f2] rounded-lg p-4 outline-none focus:ring-1 focus:ring-[#E8730C] font-sans text-xs leading-relaxed resize-none overflow-y-auto scrollbar-thin disabled:opacity-50"
              spellCheck="false"
            />
          </div>

          <div className="space-y-1 shrink-0">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
              Companies (optional)
            </label>
            <input
              type="text"
              value={companiesInput}
              onChange={(e) => setCompaniesInput(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g. Google, Meta"
              className="w-full bg-black text-white rounded-lg px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-[#E8730C] font-sans text-xs disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-950/40 rounded-lg text-red-400 text-xs">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <div className="break-all font-mono whitespace-pre-wrap">{error}</div>
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center space-x-2.5 p-3 bg-black rounded-lg text-gray-400 text-xs font-bold">
              <div className="w-3.5 h-3.5 border-2 border-t-[#E8730C] border-r-transparent border-b-[#E8730C] border-l-transparent rounded-full animate-spin shrink-0" />
              <span>AI parsing description...</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-950/40 rounded-lg text-green-400 text-xs font-bold">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span>Loaded successfully.</span>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1.5">
            <button
              type="submit"
              disabled={isGenerating || !rawText.trim()}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#E8730C] hover:bg-[#F28B2D] disabled:bg-[#E8730C]/40 disabled:text-black/50 text-black font-extrabold rounded-md text-xs transition-all disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles size={13} fill="currentColor" />
              <span>{isGenerating ? "Parsing..." : "Parse & Render"}</span>
            </button>
          </div>
        </form>
      )}

      {/* AI Prompt Modal Glassmorphic Overlay */}
      {showPromptModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#222] rounded-xl shadow-2xl w-full max-w-md max-h-[85%] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222] bg-black">
              <div className="flex items-center space-x-2 text-white font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} className="text-[#E8730C]" fill="#E8730C" />
                <span>AI Prompt Helper</span>
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
              <p className="text-gray-400 leading-relaxed font-sans font-medium">
                Use this prompt template in your AI assistant (e.g. Claude, ChatGPT) to convert any LeetCode problem copy-paste into the exact JSON format required by this workspace.
              </p>

              <div className="relative bg-black p-3 rounded-lg border border-[#222] font-mono text-[10px] text-gray-400 select-all max-h-[220px] overflow-y-auto scrollbar-thin">
                <pre className="whitespace-pre-wrap leading-relaxed select-text">
                  {AI_PROMPT_TEXT}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-black border-t border-[#222] flex items-center justify-end space-x-2 shrink-0">
              <button
                onClick={handleCopyPrompt}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#E8730C] hover:bg-[#F28B2D] text-black font-extrabold rounded-md text-xs transition-all shadow-md cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <Check size={13} className="text-black font-bold" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-black font-bold" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-3 py-2 text-xs bg-[#111] hover:bg-[#222] text-white rounded-md font-bold transition-all"
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
