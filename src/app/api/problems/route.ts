import { NextRequest, NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

// GET handler: Lists all problems sorted by ID
export async function GET() {
  try {
    await initDb();
    
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
    await initDb();
    
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

    // Duplicate detection (skip if workspace overwrite mode)
    if (!allowOverwrite) {
      const existing = await sql`
        SELECT id, title, slug FROM problems WHERE slug = ${problem.slug} LIMIT 1
      `;
      if (existing.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Duplicate: "${existing[0].title}" already exists with slug "${problem.slug}".`,
          isDuplicate: true,
        }, { status: 409 });
      }
    }

    // Upsert into database
    await sql`
      INSERT INTO problems (
        id, title, slug, difficulty, tags, description, constraints, examples, follow_up, starter_code, companies, test_cases
      ) VALUES (
        ${problem.id}, ${problem.title}, ${problem.slug}, ${problem.difficulty}, ${problem.tags}, ${problem.description}, ${problem.constraints}, ${JSON.stringify(problem.examples)}, ${problem.follow_up || null}, ${JSON.stringify(problem.starter_code)}, ${problem.companies || []}, ${JSON.stringify(problem.test_cases || [])}
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

    return NextResponse.json({ success: true, data: problem });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to save problem: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}

