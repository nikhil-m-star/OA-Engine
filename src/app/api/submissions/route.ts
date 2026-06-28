import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// POST: Record a submission
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { problemSlug, language, status, runtimeMs } = await req.json();

    if (!problemSlug || !language || !status) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    if (language !== "cpp") {
      return NextResponse.json({ success: false, error: "Unsupported language for submissions." }, { status: 400 });
    }

    await db.submission.create({
      data: {
        user_id: userId,
        problem_slug: problemSlug,
        language,
        status,
        runtime_ms: runtimeMs ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: `Failed to record submission: ${err instanceof Error ? err.message : String(err)}`
    }, { status: 500 });
  }
}

// GET: Fetch current user's submissions
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await db.submission.findMany({
      where: { user_id: userId },
      orderBy: { submitted_at: "desc" },
      include: {
        problem: {
          select: {
            title: true,
          },
        },
      },
    });

    const rows = submissions.map((s) => ({
      id: s.id,
      problem_slug: s.problem_slug,
      language: s.language,
      status: s.status,
      runtime_ms: s.runtime_ms,
      submitted_at: s.submitted_at,
      problem_title: s.problem?.title || null,
    }));

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: `Failed to fetch submissions: ${err instanceof Error ? err.message : String(err)}`
    }, { status: 500 });
  }
}

