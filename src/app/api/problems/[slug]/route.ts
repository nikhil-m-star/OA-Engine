import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminUser } from "@/lib/auth";
import { sanitizeProblemDescription } from "@/lib/sanitizeProblem";
import { auth } from "@clerk/nextjs/server";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

// GET problem details (including test cases) - checks visibility
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing problem slug." }, { status: 400 });
    }

    const { userId } = await auth();

    const problem = await db.problem.findUnique({
      where: { slug },
    });

    if (!problem) {
      return NextResponse.json({ success: false, error: `Problem "${slug}" not found.` }, { status: 404 });
    }

    // Enforce private visibility: must be public OR owned by the current user
    if (problem.created_by !== null && problem.created_by !== userId) {
      return NextResponse.json({ success: false, error: `Problem "${slug}" not found.` }, { status: 404 });
    }

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

// PUT: Updates companies list (Admin or Owner only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing problem slug." }, { status: 400 });
    }

    const { userId } = await auth();
    const admin = await isAdminUser();

    const problem = await db.problem.findUnique({
      where: { slug },
      select: { created_by: true }
    });

    if (!problem) {
      return NextResponse.json({ success: false, error: `Problem "${slug}" not found.` }, { status: 404 });
    }

    const isOwner = problem.created_by !== null && problem.created_by === userId;
    if (!admin && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin or owner authorization required." }, { status: 403 });
    }

    const { companies } = await req.json();
    if (!Array.isArray(companies)) {
      return NextResponse.json({ success: false, error: "Invalid companies format. Array required." }, { status: 400 });
    }

    await db.problem.update({
      where: { slug },
      data: { companies },
    });

    return NextResponse.json({ success: true, message: "Companies updated successfully." });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to update companies: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}

// DELETE: Removes a problem from the database (Admin or Owner only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing problem slug." }, { status: 400 });
    }

    const { userId } = await auth();
    const admin = await isAdminUser();

    const problem = await db.problem.findUnique({
      where: { slug },
      select: { created_by: true }
    });

    if (!problem) {
      return NextResponse.json({ success: false, error: `Problem "${slug}" not found.` }, { status: 404 });
    }

    const isOwner = problem.created_by !== null && problem.created_by === userId;
    if (!admin && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin or owner authorization required." }, { status: 403 });
    }

    await db.problem.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true, message: `Problem "${slug}" deleted successfully.` });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to delete problem: ${err instanceof Error ? err.message : String(err)}` 
    }, { status: 500 });
  }
}
