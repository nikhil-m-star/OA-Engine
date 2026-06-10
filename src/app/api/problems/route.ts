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

// POST handler: Upserts a problem into the database
export async function POST(req: NextRequest) {
  try {
    await initDb();
    
    const problem = await req.json();

    // Validate request schema
    const requiredKeys = ["id", "title", "slug", "difficulty", "tags", "description", "constraints", "examples", "starter_code"];
    for (const key of requiredKeys) {
      if (!(key in problem)) {
        return NextResponse.json({ success: false, error: `Missing required field: "${key}"` }, { status: 400 });
      }
    }

    // Upsert into database
    await sql`
      INSERT INTO problems (
        id, title, slug, difficulty, tags, description, constraints, examples, follow_up, starter_code, companies
      ) VALUES (
        ${problem.id}, ${problem.title}, ${problem.slug}, ${problem.difficulty}, ${problem.tags}, ${problem.description}, ${problem.constraints}, ${JSON.stringify(problem.examples)}, ${problem.follow_up || null}, ${JSON.stringify(problem.starter_code)}, ${problem.companies || []}
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
        companies = EXCLUDED.companies;
    `;

    return NextResponse.json({ success: true, data: problem });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to save problem: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}
