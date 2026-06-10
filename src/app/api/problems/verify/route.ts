import { NextRequest, NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { title, slug, rawText } = await req.json();

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { success: false, error: "Input text cannot be empty." },
        { status: 400 }
      );
    }

    // --- Step 1: Duplicate check against DB ---
    await initDb();

    let isDuplicate = false;
    let duplicateReason = "";

    if (slug) {
      const bySlug = await sql`
        SELECT id, title, slug FROM problems WHERE slug = ${slug} LIMIT 1
      `;
      if (bySlug.length > 0) {
        isDuplicate = true;
        duplicateReason = `Problem "${bySlug[0].title}" already exists with slug "${slug}".`;
      }
    }

    if (!isDuplicate && title) {
      const normalizedTitle = title.trim().toLowerCase();
      const byTitle = await sql`
        SELECT id, title, slug FROM problems WHERE LOWER(TRIM(title)) = ${normalizedTitle} LIMIT 1
      `;
      if (byTitle.length > 0) {
        isDuplicate = true;
        duplicateReason = `Problem "${byTitle[0].title}" (slug: ${byTitle[0].slug}) already exists with the same title.`;
      }
    }

    // --- Step 2: AI legitimacy check using fast model ---
    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json(
        { success: false, error: "NVIDIA API key is missing." },
        { status: 500 }
      );
    }

    const verifyPrompt = `You are a coding problem verification assistant. Analyze the following text and determine if it is a legitimate coding/algorithm problem (like those found on LeetCode, HackerRank, Codeforces, etc.).

A LEGITIMATE problem must have:
- A clear problem statement describing what to compute/solve
- Input/output format or examples
- It should be an actual algorithmic/data structure/coding challenge

NOT legitimate:
- Random text, essays, articles, or spam
- Math-only problems with no coding aspect
- Incomplete fragments that don't describe a solvable problem
- Homework questions that aren't algorithmic challenges

Respond with ONLY a JSON object (no markdown, no extra text):
{"isLegit": true/false, "reason": "brief explanation"}`;

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta/llama-3.1-8b-instruct",
          messages: [
            { role: "system", content: verifyPrompt },
            {
              role: "user",
              content: `Verify this text:\n\n${rawText.slice(0, 2000)}`,
            },
          ],
          temperature: 0.0,
          max_tokens: 200,
        }),
      }
    );

    let isLegit = true;
    let legitimacyReason = "Verification passed.";

    if (response.ok) {
      const result = await response.json();
      let content = result.choices?.[0]?.message?.content || "";
      content = content.trim();

      // Strip markdown wrapping if present
      if (content.startsWith("```")) {
        content = content.replace(/^```[a-zA-Z]*\n/, "");
        content = content.replace(/\n```$/, "");
        content = content.trim();
      }

      try {
        const parsed = JSON.parse(content);
        isLegit = parsed.isLegit === true;
        legitimacyReason = parsed.reason || "No reason provided.";
      } catch {
        // If AI response is unparseable, default to legit (don't block user)
        isLegit = true;
        legitimacyReason = "AI verification returned non-JSON; defaulting to approved.";
      }
    } else {
      // If AI call fails, don't block — just warn
      isLegit = true;
      legitimacyReason = "AI verification unavailable; skipping check.";
    }

    return NextResponse.json({
      success: true,
      isDuplicate,
      duplicateReason,
      isLegit,
      legitimacyReason,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: `Verification failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
