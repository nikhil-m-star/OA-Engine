import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Per-userId rate limiter: 3 req/min
const hintRateLimit = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit per userId
    const now = Date.now();
    const entry = hintRateLimit.get(userId);
    if (entry && now < entry.resetAt) {
      if (entry.count >= 3) {
        return NextResponse.json({ success: false, error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
      }
      entry.count++;
    } else {
      hintRateLimit.set(userId, { count: 1, resetAt: now + 60000 });
    }

    const { problemTitle, problemDescription, userCode, language } = await req.json();

    if (!problemTitle || !problemDescription) {
      return NextResponse.json({ success: false, error: "Missing problem info." }, { status: 400 });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json({ success: false, error: "NVIDIA API key is missing." }, { status: 500 });
    }

    // Strip HTML tags from description
    const cleanDescription = problemDescription.replace(/<[^>]*>/g, "");

    const systemPrompt = "You are a coding interview coach. Give a concise, Socratic hint in 2-3 sentences that nudges the user toward the solution without revealing code or the direct answer.";

    const userContent = `Problem: ${problemTitle}\n\nDescription: ${cleanDescription.slice(0, 1000)}\n\nLanguage: ${language || "C++"}\n\nUser's current code (first 800 chars):\n${(userCode || "").slice(0, 800)}`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 350,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ success: false, error: `AI API error: ${response.status}` }, { status: 502 });
    }

    const result = await response.json();
    const hint = result.choices?.[0]?.message?.content?.trim() || "No hint generated.";

    return NextResponse.json({ success: true, hint });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: `Hint generation failed: ${err instanceof Error ? err.message : String(err)}`
    }, { status: 500 });
  }
}
