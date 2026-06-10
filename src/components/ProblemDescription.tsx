"use client";

import React, { useState } from "react";
import { ProblemData } from "@/app/types";
import { Tag, ThumbsUp, ThumbsDown, Star, Briefcase } from "lucide-react";

interface ProblemDescriptionProps {
  problem: ProblemData;
}

export default function ProblemDescription({ problem }: ProblemDescriptionProps) {
  const [liked, setLiked] = useState<boolean | null>(null);
  const [starred, setStarred] = useState(false);
  const [likesCount, setLikesCount] = useState(1432);
  const [dislikesCount, setDislikesCount] = useState(87);

  // Difficulty badge colors
  const getDifficultyStyles = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "easy":
        return { text: "text-[#00b8a3]", bg: "bg-[#00b8a3]/10" };
      case "medium":
        return { text: "text-[#ffc01e]", bg: "bg-[#ffc01e]/10" };
      case "hard":
        return { text: "text-[#ff375f]", bg: "bg-[#ff375f]/10" };
      default:
        return { text: "text-gray-400", bg: "bg-gray-400/10" };
    }
  };

  const diffStyle = getDifficultyStyles(problem.difficulty);

  const handleLike = () => {
    if (liked === true) {
      setLiked(null);
      setLikesCount(prev => prev - 1);
    } else {
      if (liked === false) setDislikesCount(prev => prev - 1);
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const handleDislike = () => {
    if (liked === false) {
      setLiked(null);
      setDislikesCount(prev => prev - 1);
    } else {
      if (liked === true) setLikesCount(prev => prev - 1);
      setLiked(false);
      setDislikesCount(prev => prev + 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#282828] text-gray-200 overflow-y-auto scrollbar-thin select-text">
      {/* Tab Header */}
      <div className="flex items-center px-4 border-b border-[#3e3e3e] bg-[#2d2d2d] text-xs h-[37px] shrink-0">
        <div className="text-white font-semibold border-b-2 border-[#ffa116] h-full px-2 flex items-center select-none">
          Problem Description
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 space-y-6">
        {/* Title & Metadata */}
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {problem.id}. {problem.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {/* Difficulty Badge */}
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${diffStyle.bg} ${diffStyle.text}`}>
              {problem.difficulty}
            </span>

            {/* Mock stats to look exactly like LeetCode */}
            <div className="flex items-center space-x-1 text-xs text-gray-400 bg-[#3a3a3a]/30 px-2 py-0.5 rounded border border-[#3e3e3e]">
              <button onClick={handleLike} className={`hover:text-white transition-colors p-1 ${liked === true ? "text-green-400" : ""}`}>
                <ThumbsUp size={13} />
              </button>
              <span className="px-1">{likesCount}</span>
              <div className="h-3 w-[1px] bg-gray-600" />
              <button onClick={handleDislike} className={`hover:text-white transition-colors p-1 ${liked === false ? "text-red-400" : ""}`}>
                <ThumbsDown size={13} />
              </button>
              <span className="px-1">{dislikesCount}</span>
            </div>

            <button 
              onClick={() => setStarred(!starred)} 
              className={`text-xs text-gray-400 bg-[#3a3a3a]/30 p-1.5 rounded border border-[#3e3e3e] hover:text-white transition-colors ${starred ? "text-[#ffa116]" : ""}`}
            >
              <Star size={13} fill={starred ? "#ffa116" : "none"} />
            </button>
          </div>
        </div>

        {/* Tags and Companies */}
        <div className="space-y-3">
          {problem.tags && problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 py-0.5">
              {problem.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-gray-300 bg-[#3a3a3a] rounded-full border border-[#444] hover:bg-[#484848] transition-colors cursor-pointer"
                >
                  <Tag size={10} className="text-gray-400" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          {problem.companies && problem.companies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 border-t border-[#3a3a3a]/40">
              <span className="text-[10px] font-bold text-gray-500 uppercase select-none mr-1.5 flex items-center space-x-1">
                <Briefcase size={10} className="text-gray-500" />
                <span>Companies:</span>
              </span>
              {problem.companies.map((company, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-0.5 text-[10px] font-bold text-gray-300 bg-[#ffa116]/10 border border-[#ffa116]/25 rounded hover:bg-[#ffa116]/20 transition-all cursor-default select-none shadow-sm"
                >
                  {company}
                </span>
              ))}
            </div>
          )}
        </div>

        <hr className="border-[#3e3e3e]" />

        {/* HTML Description */}
        <div 
          className="prose prose-invert max-w-none text-sm leading-relaxed text-gray-300 space-y-4 problem-description-html"
          dangerouslySetInnerHTML={{ __html: problem.description }}
        />

        {/* Examples Section */}
        {problem.examples && problem.examples.length > 0 && (
          <div className="space-y-4">
            {problem.examples.map((example, idx) => (
              <div key={idx} className="space-y-2">
                <span className="text-sm font-semibold text-white">Example {idx + 1}:</span>
                <div className="bg-[#3a3a3a] rounded-lg p-4 font-mono text-xs text-white font-bold border border-[#4d4d4d] space-y-2 select-text overflow-x-auto leading-relaxed shadow-md">
                  <div>
                    <span className="text-gray-300 font-bold select-none">Input: </span>
                    <span className="text-white font-bold">{example.input}</span>
                  </div>
                  <div>
                    <span className="text-gray-300 font-bold select-none">Output: </span>
                    <span className="text-[#00b8a3] font-bold">{example.output}</span>
                  </div>
                  {example.explanation && (
                    <div className="whitespace-pre-line mt-1">
                      <span className="text-gray-300 font-bold select-none">Explanation: </span>
                      <span className="text-white font-bold">{example.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {problem.constraints && problem.constraints.length > 0 && (
          <div className="space-y-3 pt-2">
            <span className="text-sm font-bold text-white">Constraints:</span>
            <ul className="list-disc pl-5 text-xs text-gray-300 space-y-2 font-mono">
              {problem.constraints.map((constraint, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="bg-[#2d2d2d] px-1.5 py-0.5 rounded text-gray-200 border border-[#3e3e3e]">
                    {constraint}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up */}
        {problem.follow_up && (
          <div className="p-4 bg-[#3a3a3a]/20 border border-[#3e3e3e] rounded-lg text-xs leading-relaxed text-gray-300 mt-4 shadow-sm">
            <span className="font-bold text-white block mb-1">Follow-up:</span>
            <p className="italic text-gray-300">{problem.follow_up}</p>
          </div>
        )}
      </div>
    </div>
  );
}
