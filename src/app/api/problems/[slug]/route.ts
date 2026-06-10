import { NextRequest, NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await initDb();
    
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing problem slug." }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, title, slug, difficulty, tags, description, constraints, examples, follow_up, starter_code, companies 
      FROM problems 
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: `Problem "${slug}" not found.` }, { status: 404 });
    }

    const problem = rows[0];

    // Note: Neon serverless automatically parses JSONB fields. 
    // We check if it is still a string in case of configuration variances, and parse if necessary.
    let examples = problem.examples;
    if (typeof examples === "string") {
      examples = JSON.parse(examples);
    }
    
    let starterCode = problem.starter_code;
    if (typeof starterCode === "string") {
      starterCode = JSON.parse(starterCode);
    }

    const formattedProblem = {
      ...problem,
      examples,
      starter_code: starterCode
    };

    return NextResponse.json({ success: true, data: formattedProblem });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to fetch problem details: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}
