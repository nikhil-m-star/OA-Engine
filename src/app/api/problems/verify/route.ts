import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized: Authentication required." }, { status: 401 });
    }

    const admin = await isAdminUser();

    const { title, slug, rawText } = await req.json();

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { success: false, error: "Input text cannot be empty." },
        { status: 400 }
      );
    }

    // Determine target slug for duplicate checks (appends suffix for non-admins)
    let targetSlug = slug;
    if (!admin && slug) {
      const suffix = `-${userId}`;
      if (!targetSlug.endsWith(suffix)) {
        targetSlug = `${targetSlug}${suffix}`;
      }
    }

    // --- Step 1: Duplicate check against DB ---
    let isDuplicate = false;
    let duplicateReason = "";

    if (targetSlug) {
      const bySlug = await db.problem.findUnique({
        where: { slug: targetSlug },
        select: { id: true, title: true, slug: true, created_by: true },
      });
      // A duplicate is only a duplicate if it's either a public problem OR created by this same user.
      if (bySlug && (bySlug.created_by === null || bySlug.created_by === userId)) {
        isDuplicate = true;
        duplicateReason = `Problem "${bySlug.title}" already exists with slug "${targetSlug}".`;
      }
    }

    if (!isDuplicate && title) {
      const normalizedTitle = title.trim().toLowerCase();
      const byTitle = await db.problem.findFirst({
        where: {
          title: {
            equals: normalizedTitle,
            mode: "insensitive",
          },
          OR: [
            { created_by: null },
            { created_by: userId }
          ]
        },
        select: { id: true, title: true, slug: true },
      });
      if (byTitle) {
        isDuplicate = true;
        duplicateReason = `Problem "${byTitle.title}" (slug: ${byTitle.slug}) already exists with the same title.`;
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
- Verify that it is possible to create verifiable test cases for this

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
