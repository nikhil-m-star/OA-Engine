import { NextRequest, NextResponse } from "next/server";
import { getSql, initDb } from "@/lib/db";
import { isAdminUser } from "@/lib/auth";
import { sanitizeProblemDescription } from "@/lib/sanitizeProblem";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

interface ProblemRow {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  description: string;
  constraints: string[];
  examples: unknown;
  follow_up?: string | null;
  starter_code: unknown;
  companies?: string[];
  test_cases?: unknown;
}

// GET problem details (including test cases)
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await initDb();
    const sql = getSql();
    
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing problem slug." }, { status: 400 });
    }

    const rows = await sql<ProblemRow>`
      SELECT id, title, slug, difficulty, tags, description, constraints, examples, follow_up, starter_code, companies, test_cases 
      FROM problems 
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: `Problem "${slug}" not found.` }, { status: 404 });
    }

    const problem = rows[0];

    let examples = problem.examples;
    if (typeof examples === "string") {
      examples = JSON.parse(examples);
    }
    
    let starterCode = problem.starter_code;
    if (typeof starterCode === "string") {
      starterCode = JSON.parse(starterCode);
    }

    let testCases = problem.test_cases;
    if (typeof testCases === "string") {
      testCases = JSON.parse(testCases);
    }

    const formattedProblem = {
      ...problem,
      description: sanitizeProblemDescription(problem.description),
      examples,
      starter_code: starterCode,
      test_cases: testCases || []
    };

    return NextResponse.json({ success: true, data: formattedProblem });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to fetch problem details: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}

// PUT: Updates companies list (Admin only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await isAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    await initDb();
    const sql = getSql();
    
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing problem slug." }, { status: 400 });
    }

    const { companies } = await req.json();
    if (!Array.isArray(companies)) {
      return NextResponse.json({ success: false, error: "Invalid companies format. Array required." }, { status: 400 });
    }

    await sql`
      UPDATE problems 
      SET companies = ${companies} 
      WHERE slug = ${slug}
    `;

    return NextResponse.json({ success: true, message: "Companies updated successfully." });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to update companies: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}

// DELETE: Removes a problem from the database (Admin only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await isAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    await initDb();
    const sql = getSql();
    
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing problem slug." }, { status: 400 });
    }

    await sql`
      DELETE FROM problems 
      WHERE slug = ${slug}
    `;

    return NextResponse.json({ success: true, message: `Problem "${slug}" deleted successfully.` });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to delete problem: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}
