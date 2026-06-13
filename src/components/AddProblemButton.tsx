"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import AddProblemModal from "@/components/AddProblemModal";

interface AddProblemButtonProps {
  variant?: "card" | "inline";
}

export default function AddProblemButton({ variant = "inline" }: AddProblemButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "card") {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="group bg-[#0b0b0b] hover:bg-[#121212] rounded-3xl border border-[#111] p-6 flex flex-col justify-between h-[135px] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer text-left w-full active:scale-95"
        >
          <div className="flex items-center space-x-3 text-[#E8730C]">
            <Plus size={20} />
            <h3 className="text-lg font-extrabold text-white group-hover:text-[#E8730C] transition-colors">
              Add Problem
            </h3>
          </div>
          <div className="flex items-center text-xs font-bold text-[#E8730C] space-x-1">
            <span>Paste & Generate</span>
          </div>
        </button>
        <AddProblemModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1.5 px-6 py-2.5 bg-[#E8730C] hover:bg-[#F28B2D] text-black font-black text-sm rounded-full transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <Plus size={13} />
        <span>Add Problem</span>
      </button>
      <AddProblemModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
