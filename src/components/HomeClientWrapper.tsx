"use client";

import React from "react";
import Navbar from "@/components/Navbar";

export default function HomeClientWrapper() {
  return (
    <div className="min-h-screen bg-black text-[#eff2f6f2] flex flex-col font-sans select-none relative overflow-x-hidden">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <div className="space-y-4">
          <h1 className="text-6xl sm:text-8xl font-black tracking-wider text-white uppercase leading-none">
            OA Engine
          </h1>
          <p className="text-sm sm:text-base text-gray-400 font-medium tracking-wide max-w-xl mx-auto">
            A premium sandbox workspace for parsing and analyzing coding problems.
          </p>
        </div>
      </main>
    </div>
  );
}
