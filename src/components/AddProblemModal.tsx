"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";

interface AddProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AI_PROMPT_TEXT = `Please convert the following LeetCode problem into a structured JSON object. The output must strictly follow the schema below, without any surrounding markdown commentary (just return the raw JSON block).

{
  "id": 1, // integer problem ID (use the original LeetCode problem number if available, e.g. 15 for 3Sum)
  "title": "Two Sum", // problem title
  "slug": "two-sum", // url-friendly lowercase slug, e.g., 'two-sum'
  "difficulty": "Easy", // exactly: 'Easy', 'Medium', or 'Hard'
  "tags": ["Array", "Hash Map"], // tags as strings
  "description": "<p>Given an array of integers...</p>", // HTML-styled description. Use simple tags: <p>, <code>, <b>, <i>, <ul>, <li>. Replace math symbols or variable references with <code>var</code> where appropriate.
  "constraints": ["2 <= nums.length <= 10^4"], // array of constraints as strings
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]." // explanation is optional
    }
  ],
  "follow_up": "Can you solve it in O(n) time complexity?", // follow-up string or omit if not present
  "companies": ["Google", "Meta"], // array of company names (strings) where this question was asked. Return an empty array [] if no company associations are mentioned.
  "test_cases": [
    // MUST contain a minimum of 30 diverse and comprehensive test cases for verifying code correctness.
    // VERIFY ALL TEST CASES CAREFULLY! Make sure the expected output accurately corresponds to the input for every single testcase.
    // Cover boundary values, small lists, large lists, negative numbers, zeros, duplicates, etc.
    // Follow the input/output formatting of the examples exactly. Generates at least 30 test cases!
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

const DEFAULT_TEMPLATE = {
  id: 1,
  title: "Two Sum",
  slug: "two-sum",
  difficulty: "Easy",
  tags: ["Array", "Hash Map"],
  companies: ["Google", "Adobe"],
  description: "<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <i>indices of the two numbers such that they add up to <code>target</code></i>.</p>",
  constraints: [
    "2 <= nums.length <= 10^4",
    "Only one valid answer exists."
  ],
  examples: [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ],
  test_cases: [
    { "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]" }
  ],
  starter_code: {
    "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
    "python": "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass",
    "javascript": "class Solution {\n    twoSum(nums, target) {\n        \n    }\n}",
    "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}"
  }
};

export default function AddProblemModal({ isOpen, onClose }: AddProblemModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ai" | "json">("ai");
  const [rawText, setRawText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [companiesInput, setCompaniesInput] = useState("");
  const [step, setStep] = useState<"input" | "verifying" | "verified" | "generating" | "done" | "error">("input");
  const [verifyResult, setVerifyResult] = useState<{
    isDuplicate: boolean;
    duplicateReason: string;
    isLegit: boolean;
    legitimacyReason: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setRawText("");
    setJsonText("");
    setCompaniesInput("");
    setStep("input");
    setVerifyResult(null);
    setErrorMsg("");
    setSuccessMsg("");
    setShowPromptModal(false);
    setCopiedPrompt(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEXT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Step 1: Verify the problem text (AI tab)
  const handleVerify = async () => {
    if (!rawText.trim()) return;

    setStep("verifying");
    setErrorMsg("");
    setVerifyResult(null);

    try {
      const lines = rawText.trim().split("\n").filter((l) => l.trim());
      const roughTitle = lines[0]?.replace(/^\d+\.\s*/, "").trim() || "";
      const roughSlug = roughTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80);

      const res = await fetch("/api/problems/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: roughTitle,
          slug: roughSlug,
          rawText: rawText.trim(),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Verification failed.");
      }

      setVerifyResult(json);
      setStep("verified");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  };

  // Step 2: Generate and save the problem (AI tab)
  const handleGenerate = async () => {
    setStep("generating");
    setErrorMsg("");

    try {
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText.trim() }),
      });

      const genJson = await genRes.json();

      if (!genJson.success) {
        throw new Error(genJson.error || "AI generation failed.");
      }

      const problemData = genJson.data;

      const userCompanies = companiesInput
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      const aiCompanies = Array.isArray(problemData.companies) ? problemData.companies : [];
      problemData.companies = Array.from(new Set([...aiCompanies, ...userCompanies]));

      const saveRes = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(problemData),
      });

      const saveJson = await saveRes.json();

      if (!saveJson.success) {
        throw new Error(saveJson.error || "Failed to save problem.");
      }

      setSuccessMsg(`"${problemData.title}" added successfully.`);
      setStep("done");

      setTimeout(() => {
        router.refresh();
      }, 800);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  };

  // Direct JSON save handler
  const handleSaveJson = async () => {
    if (!jsonText.trim()) return;

    setStep("generating"); // Reuse loader animation
    setErrorMsg("");

    try {
      const parsed = JSON.parse(jsonText);

      // Validate schema
      const requiredKeys = ["id", "title", "slug", "difficulty", "tags", "description", "constraints", "examples", "starter_code"];
      for (const key of requiredKeys) {
        if (!(key in parsed)) {
          throw new Error(`Missing required field: "${key}"`);
        }
      }

      if (!parsed.test_cases || !Array.isArray(parsed.test_cases)) {
        parsed.test_cases = [];
      }

      if (!parsed.companies || !Array.isArray(parsed.companies)) {
        parsed.companies = [];
      }

      // Check for duplicates
      const res = await fetch("/api/problems/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsed.title,
          slug: parsed.slug,
          rawText: "manual json save check",
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Verification failed.");
      }
      if (json.isDuplicate) {
        throw new Error(json.duplicateReason || `Duplicate: "${parsed.title}" already exists.`);
      }

      // Save problem
      const saveRes = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const saveJson = await saveRes.json();

      if (!saveJson.success) {
        throw new Error(saveJson.error || "Failed to save problem.");
      }

      setSuccessMsg(`"${parsed.title}" added successfully.`);
      setStep("done");

      setTimeout(() => {
        router.refresh();
      }, 800);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  };

  const isBlocked = verifyResult && (verifyResult.isDuplicate || !verifyResult.isLegit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-page-in">
      <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-base font-bold text-white">Add Problem</h2>
          <div className="flex items-center space-x-3">
            {activeTab === "json" && step === "input" && (
              <button
                onClick={() => setShowPromptModal(true)}
                className="flex items-center space-x-1.5 text-xs text-[#E8730C] hover:text-[#F28B2D] transition-colors font-medium cursor-pointer"
              >
                <Sparkles size={12} fill="#E8730C" className="animate-pulse" />
                <span>AI Prompt Helper</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 text-gray-500 hover:text-white transition-colors rounded hover:bg-[#111111]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        {step === "input" && (
          <div className="flex bg-[#030303] px-6 py-1.5 space-x-2 shrink-0 border-b border-white/[0.02]">
            <button
              type="button"
              onClick={() => {
                setActiveTab("ai");
                resetState();
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ai"
                  ? "bg-[#111111] text-[#E8730C]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Sparkles size={11} fill={activeTab === "ai" ? "#E8730C" : "none"} className={activeTab === "ai" ? "text-[#E8730C]" : ""} />
              <span>AI Auto-Parse</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("json");
                resetState();
                setActiveTab("json");
              }}
              className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                activeTab === "json"
                  ? "bg-[#111111] text-[#E8730C]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>Paste JSON</span>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
          
          {/* AI TAB - Inputs */}
          {activeTab === "ai" && (step === "input" || step === "verifying") && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                  Problem Text
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  disabled={step === "verifying"}
                  placeholder="Paste the full problem description here (title, description, examples, constraints, starter code)..."
                  className="w-full h-[200px] bg-black text-[#eff2f6f2] rounded-lg p-4 outline-none focus:ring-1 focus:ring-[#E8730C] font-mono text-xs leading-relaxed resize-none overflow-y-auto scrollbar-thin disabled:opacity-50"
                  spellCheck="false"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                  Companies (optional)
                </label>
                <input
                  type="text"
                  value={companiesInput}
                  onChange={(e) => setCompaniesInput(e.target.value)}
                  disabled={step === "verifying"}
                  placeholder="e.g. Google, Meta, Amazon"
                  className="w-full bg-black text-white rounded-lg px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-[#E8730C] font-sans text-xs disabled:opacity-50"
                />
              </div>
            </>
          )}

          {/* JSON TAB - Inputs */}
          {activeTab === "json" && step === "input" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  JSON Data
                </label>
                <button
                  type="button"
                  onClick={() => setJsonText(JSON.stringify(DEFAULT_TEMPLATE, null, 2))}
                  className="text-[9px] font-bold text-[#E8730C] hover:text-[#F28B2D] uppercase tracking-wider transition-colors"
                >
                  Load Demo Template
                </button>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Paste the fully formatted problem JSON object here..."
                className="w-full h-[260px] bg-black text-[#eff2f6f2] rounded-lg p-4 outline-none focus:ring-1 focus:ring-[#E8730C] font-mono text-xs leading-relaxed resize-none overflow-y-auto scrollbar-thin"
                spellCheck="false"
              />
            </div>
          )}

          {/* Verifying State */}
          {step === "verifying" && (
            <div className="flex items-center space-x-2.5 p-3 bg-black rounded-lg text-gray-400 text-xs font-bold">
              <Loader2 size={14} className="animate-spin text-[#E8730C] shrink-0" />
              <span>Checking for duplicates & verifying legitimacy...</span>
            </div>
          )}

          {/* Verified Result */}
          {step === "verified" && verifyResult && (
            <div className="space-y-3">
              <div
                className={`flex items-start space-x-2.5 p-3 rounded-lg text-xs font-bold ${
                  verifyResult.isDuplicate
                    ? "bg-red-950/30 text-red-400"
                    : "bg-green-950/30 text-green-400"
                }`}
              >
                {verifyResult.isDuplicate ? (
                  <Copy size={14} className="shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                )}
                <span>
                  {verifyResult.isDuplicate
                    ? verifyResult.duplicateReason
                    : "No duplicate found."}
                </span>
              </div>

              <div
                className={`flex items-start space-x-2.5 p-3 rounded-lg text-xs font-bold ${
                  verifyResult.isLegit
                    ? "bg-green-950/30 text-green-400"
                    : "bg-red-950/30 text-red-400"
                }`}
              >
                {verifyResult.isLegit ? (
                  <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                )}
                <span>
                  {verifyResult.isLegit
                    ? `Verified as legit: ${verifyResult.legitimacyReason}`
                    : `Not a valid problem: ${verifyResult.legitimacyReason}`}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preview</span>
                <div className="bg-black rounded-lg p-3 text-xs text-gray-400 font-mono max-h-[100px] overflow-y-auto scrollbar-thin whitespace-pre-wrap">
                  {rawText.slice(0, 500)}{rawText.length > 500 ? "..." : ""}
                </div>
              </div>
            </div>
          )}

          {/* Generating State */}
          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 text-gray-400">
              <Loader2 size={28} className="animate-spin text-[#E8730C]" />
              <span className="text-sm font-bold">Processing and saving problem workspace...</span>
              <span className="text-xs text-gray-600">Please wait a few seconds</span>
            </div>
          )}

          {/* Done State */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <CheckCircle2 size={36} className="text-green-400" />
              <span className="text-sm font-bold text-green-400">{successMsg}</span>
            </div>
          )}

          {/* Error State */}
          {step === "error" && (
            <div className="space-y-3">
              <div className="flex items-start space-x-2.5 p-4 bg-red-950/30 rounded-lg text-red-400 text-xs font-bold">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div className="whitespace-pre-wrap break-all">{errorMsg}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2.5 px-6 py-4 bg-[#050505] shrink-0 border-t border-white/[0.02]">
          {step === "input" && activeTab === "ai" && (
            <button
              onClick={handleVerify}
              disabled={!rawText.trim()}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-[#E8730C] hover:bg-[#F28B2D] disabled:bg-[#E8730C]/30 disabled:text-black/50 text-black font-extrabold rounded-md text-xs transition-all disabled:cursor-not-allowed cursor-pointer"
            >
              <ShieldCheck size={13} />
              <span>Verify & Check</span>
            </button>
          )}

          {step === "input" && activeTab === "json" && (
            <button
              onClick={handleSaveJson}
              disabled={!jsonText.trim()}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-[#E8730C] hover:bg-[#F28B2D] disabled:bg-[#E8730C]/30 disabled:text-black/50 text-black font-extrabold rounded-md text-xs transition-all disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 size={13} />
              <span>Verify & Save</span>
            </button>
          )}

          {step === "verifying" && (
            <button
              disabled
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-[#E8730C]/30 text-black/50 font-extrabold rounded-md text-xs cursor-not-allowed"
            >
              <Loader2 size={13} className="animate-spin" />
              <span>Verifying...</span>
            </button>
          )}

          {step === "verified" && (
            <>
              <button
                onClick={() => { setStep("input"); setVerifyResult(null); }}
                className="px-4 py-2.5 bg-[#111111] hover:bg-[#222] text-gray-300 font-bold rounded-md text-xs transition-all cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={handleGenerate}
                disabled={!!isBlocked}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-[#E8730C] hover:bg-[#F28B2D] disabled:bg-[#E8730C]/30 disabled:text-black/50 text-black font-extrabold rounded-md text-xs transition-all disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles size={13} />
                <span>{isBlocked ? "Blocked" : "Generate & Add"}</span>
              </button>
            </>
          )}

          {step === "generating" && (
            <button
              disabled
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-[#E8730C]/30 text-black/50 font-extrabold rounded-md text-xs cursor-not-allowed"
            >
              <Loader2 size={13} className="animate-spin" />
              <span>Saving...</span>
            </button>
          )}

          {step === "done" && (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 bg-[#E8730C] hover:bg-[#F28B2D] text-black font-extrabold rounded-md text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          )}

          {step === "error" && (
            <>
              <button
                onClick={() => { setStep("input"); setErrorMsg(""); }}
                className="px-4 py-2.5 bg-[#111111] hover:bg-[#222] text-gray-300 font-bold rounded-md text-xs transition-all cursor-pointer"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Prompt Modal Glassmorphic Overlay */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#222] rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-zoom-in">
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
