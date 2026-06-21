import React from "react";
import { db } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import HomeClientWrapper from "@/components/HomeClientWrapper";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stats = { total: 0, easy: 0, medium: 0, hard: 0 };
  let isAdmin = false;

  try {
    const { userId } = await auth();
    if (userId) {
      const user = await currentUser();
      if (user) {
        const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase()) || [];
        isAdmin = emails.includes("nikhilm9110@gmail.com");
      }
    }
  } catch (authErr) {
    console.error("Clerk auth failed on server:", authErr);
  }

  try {
    const total = await db.problem.count();
    const easy = await db.problem.count({
      where: { difficulty: { equals: "easy", mode: "insensitive" } },
    });
    const medium = await db.problem.count({
      where: { difficulty: { equals: "medium", mode: "insensitive" } },
    });
    const hard = await db.problem.count({
      where: { difficulty: { equals: "hard", mode: "insensitive" } },
    });

    stats = { total, easy, medium, hard };
  } catch (err) {
    console.error("Error loading problem stats:", err);
  }

  return <HomeClientWrapper stats={stats} isAdmin={isAdmin} />;
}


