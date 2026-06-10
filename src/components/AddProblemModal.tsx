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
} from "lucide-react";

interface AddProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddProblemModal({ isOpen, onClose }: AddProblemModalProps) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
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

  if (!isOpen) return null;

  const resetState = () => {
    setRawText("");
    setCompaniesInput("");
    setStep("input");
    setVerifyResult(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Step 1: Verify the problem text
  const handleVerify = async () => {
    if (!rawText.trim()) return;

    setStep("verifying");
    setErrorMsg("");
    setVerifyResult(null);

    try {
      // Extract a rough title/slug from the text for duplicate checking
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

  // Step 2: Generate and save the problem (only if verified)
  const handleGenerate = async () => {
    setStep("generating");
    setErrorMsg("");

    try {
      // Call the AI generate endpoint
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

      // Merge user-provided companies
      const userCompanies = companiesInput
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      const aiCompanies = Array.isArray(problemData.companies) ? problemData.companies : [];
      problemData.companies = Array.from(new Set([...aiCompanies, ...userCompanies]));

      // Save to database
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

      // Refresh page data after a short delay
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
      <div className="bg-[#0a0a0a] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-base font-bold text-white">Add Problem</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-500 hover:text-white transition-colors rounded hover:bg-[#111111]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 scrollbar-thin">
          {/* Input Step */}
          {(step === "input" || step === "verifying") && (
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
              {/* Duplicate check */}
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

              {/* Legitimacy check */}
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

              {/* Preview of raw text */}
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
              <span className="text-sm font-bold">AI is parsing & generating test cases...</span>
              <span className="text-xs text-gray-600">This may take 10–20 seconds</span>
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
        <div className="flex items-center justify-end space-x-2.5 px-6 py-4 bg-[#050505] shrink-0">
          {step === "input" && (
            <button
              onClick={handleVerify}
              disabled={!rawText.trim()}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-[#E8730C] hover:bg-[#F28B2D] disabled:bg-[#E8730C]/30 disabled:text-black/50 text-black font-extrabold rounded-md text-xs transition-all disabled:cursor-not-allowed cursor-pointer"
            >
              <ShieldCheck size={13} />
              <span>Verify & Check</span>
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
              <span>Generating...</span>
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
    </div>
  );
}
