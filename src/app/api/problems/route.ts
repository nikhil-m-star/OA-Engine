import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminUser } from "@/lib/auth";
import { sanitizeProblemDescription } from "@/lib/sanitizeProblem";

// GET handler: Lists all problems sorted by ID
export async function GET() {
  try {
    // Select summary details for lists
    const problems = await db.problem.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        tags: true,
        companies: true,
      },
      orderBy: [
        { id: "asc" },
        { created_at: "desc" },
      ],
    });
    
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
    const existing = await db.problem.findUnique({
      where: { slug: problem.slug },
      select: { id: true, title: true, slug: true },
    });

    if (existing) {
      if (!allowOverwrite) {
        return NextResponse.json({
          success: false,
          error: `Duplicate: "${existing.title}" already exists with slug "${problem.slug}".`,
          isDuplicate: true,
        }, { status: 409 });
      }
      finalId = existing.id;
    } else {
      const agg = await db.problem.aggregate({
        _max: { id: true },
      });
      finalId = (agg._max.id ?? 0) + 1;
    }

    const savedProblem = {
      ...problem,
      id: finalId,
      description: sanitizedDescription,
    };

    const prismaData = {
      id: savedProblem.id,
      title: savedProblem.title,
      difficulty: savedProblem.difficulty,
      tags: savedProblem.tags,
      description: savedProblem.description,
      constraints: savedProblem.constraints,
      examples: savedProblem.examples,
      follow_up: savedProblem.follow_up || null,
      starter_code: savedProblem.starter_code,
      companies: savedProblem.companies || [],
      test_cases: savedProblem.test_cases || [],
    };

    // Upsert into database
    await db.problem.upsert({
      where: { slug: savedProblem.slug },
      update: prismaData,
      create: {
        ...prismaData,
        slug: savedProblem.slug,
      },
    });

    return NextResponse.json({ success: true, data: savedProblem });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to save problem: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}

