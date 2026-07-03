import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminUser } from "@/lib/auth";
import { sanitizeProblemDescription } from "@/lib/sanitizeProblem";
import { auth } from "@clerk/nextjs/server";

// GET handler: Lists all problems sorted by ID (public + private to the user)
export async function GET() {
  try {
    const { userId } = await auth();

    const problems = await db.problem.findMany({
      where: {
        OR: [
          { created_by: null },
          ...(userId ? [{ created_by: userId }] : [])
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        tags: true,
        companies: true,
        created_by: true,
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized: Authentication required." }, { status: 401 });
    }

    const admin = await isAdminUser();

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

    // Determine slug and created_by values
    let targetSlug = problem.slug;
    let createdBy: string | null = null; // Admin-created is public

    if (!admin) {
      createdBy = userId;
      // Enforce user-specific slug suffix to prevent clashing
      const suffix = `-${userId}`;
      if (!targetSlug.endsWith(suffix)) {
        targetSlug = `${targetSlug}${suffix}`;
      }
    }

    // Determine ID to assign
    let finalId = problem.id;
    const existing = await db.problem.findUnique({
      where: { slug: targetSlug },
      select: { id: true, title: true, slug: true, created_by: true },
    });

    if (existing) {
      // If it exists, but belongs to someone else
      if (existing.created_by !== null && existing.created_by !== userId && !admin) {
        return NextResponse.json({ success: false, error: "Forbidden: You do not own this problem." }, { status: 403 });
      }

      if (!allowOverwrite) {
        return NextResponse.json({
          success: false,
          error: `Duplicate: "${existing.title}" already exists with slug "${targetSlug}".`,
          isDuplicate: true,
        }, { status: 409 });
      }
      finalId = existing.id;
    } else {
      const agg = await db.problem.aggregate({
        where: {
          OR: [
            { created_by: null },
            { created_by: userId }
          ]
        },
        _max: { id: true },
      });
      finalId = (agg._max.id ?? 0) + 1;
    }

    const savedProblem = {
      ...problem,
      slug: targetSlug,
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
      created_by: createdBy,
    };

    // Upsert into database
    await db.problem.upsert({
      where: { slug: targetSlug },
      update: prismaData,
      create: {
        ...prismaData,
        slug: targetSlug,
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
