import { NextRequest, NextResponse } from "next/server";
import { getSql, initDb } from "@/lib/db";
import { isAdminUser } from "@/lib/auth";
import { sanitizeProblemDescription } from "@/lib/sanitizeProblem";

interface ExistingProblemRow {
  id: number;
  title: string;
  slug: string;
}

// GET handler: Lists all problems sorted by ID
export async function GET() {
  try {
    await initDb();
    const sql = getSql();
    
    // Select summary details for lists
    const problems = await sql`
      SELECT id, title, slug, difficulty, tags, companies 
      FROM problems 
      ORDER BY id ASC, created_at DESC
    `;
    
    return NextResponse.json({ success: true, data: problems });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to fetch problems: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}

// POST handler: Inserts a problem into the database with duplicate detection
export async function POST(req: NextRequest) {
  try {
    const admin = await isAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    await initDb();
    const sql = getSql();
    
    const body = await req.json();
    const problem = body;
    const allowOverwrite = body.allowOverwrite === true;

    // Validate request schema
    const requiredKeys = ["id", "title", "slug", "difficulty", "tags", "description", "constraints", "examples", "starter_code"];
    for (const key of requiredKeys) {
      if (!(key in problem)) {
        return NextResponse.json({ success: false, error: `Missing required field: "${key}"` }, { status: 400 });
      }
    }

    const sanitizedDescription = sanitizeProblemDescription(problem.description);
    if (!sanitizedDescription) {
      return NextResponse.json({ success: false, error: "Problem description cannot be empty." }, { status: 400 });
    }

    // Determine ID to assign
    let finalId = problem.id;
    const existing = await sql<ExistingProblemRow>`
      SELECT id, title, slug FROM problems WHERE slug = ${problem.slug} LIMIT 1
    `;

    if (existing.length > 0) {
      if (!allowOverwrite) {
        return NextResponse.json({
          success: false,
          error: `Duplicate: "${existing[0].title}" already exists with slug "${problem.slug}".`,
          isDuplicate: true,
        }, { status: 409 });
      }
      finalId = existing[0].id;
    } else {
      const maxRow = await sql<{ next_id: number }>`
        SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM problems
      `;
      finalId = maxRow[0].next_id;
    }

    const savedProblem = {
      ...problem,
      id: finalId,
      description: sanitizedDescription,
    };

    // Upsert into database
    await sql`
      INSERT INTO problems (
        id, title, slug, difficulty, tags, description, constraints, examples, follow_up, starter_code, companies, test_cases
      ) VALUES (
        ${savedProblem.id}, ${savedProblem.title}, ${savedProblem.slug}, ${savedProblem.difficulty}, ${savedProblem.tags}, ${savedProblem.description}, ${savedProblem.constraints}, ${JSON.stringify(savedProblem.examples)}, ${savedProblem.follow_up || null}, ${JSON.stringify(savedProblem.starter_code)}, ${savedProblem.companies || []}, ${JSON.stringify(savedProblem.test_cases || [])}
      )
      ON CONFLICT (slug)
      DO UPDATE SET
        id = EXCLUDED.id,
        title = EXCLUDED.title,
        difficulty = EXCLUDED.difficulty,
        tags = EXCLUDED.tags,
        description = EXCLUDED.description,
        constraints = EXCLUDED.constraints,
        examples = EXCLUDED.examples,
        follow_up = EXCLUDED.follow_up,
        starter_code = EXCLUDED.starter_code,
        companies = EXCLUDED.companies,
        test_cases = EXCLUDED.test_cases;
    `;

    return NextResponse.json({ success: true, data: savedProblem });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to save problem: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}
