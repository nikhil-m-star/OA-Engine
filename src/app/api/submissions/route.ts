import { NextRequest, NextResponse } from "next/server";
import { getSql, initDb } from "@/lib/db";
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

    await initDb();
    const sql = getSql();

    await sql`
      INSERT INTO submissions (user_id, problem_slug, language, status, runtime_ms)
      VALUES (${userId}, ${problemSlug}, ${language}, ${status}, ${runtimeMs ?? null})
    `;

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

    await initDb();
    const sql = getSql();

    const rows = await sql`
      SELECT s.id, s.problem_slug, s.language, s.status, s.runtime_ms, s.submitted_at,
             p.title as problem_title
      FROM submissions s
      LEFT JOIN problems p ON s.problem_slug = p.slug
      WHERE s.user_id = ${userId}
      ORDER BY s.submitted_at DESC
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: `Failed to fetch submissions: ${err instanceof Error ? err.message : String(err)}`
    }, { status: 500 });
  }
}
