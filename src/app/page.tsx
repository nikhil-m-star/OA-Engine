import React from "react";
import { getSql, initDb } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import HomeClientWrapper from "@/components/HomeClientWrapper";

export const dynamic = "force-dynamic";

interface StatsRow {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

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
    await initDb();
    const sql = getSql();
    
    const rows = await sql<StatsRow>`
      SELECT 
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN LOWER(difficulty) = 'easy' THEN 1 ELSE 0 END), 0)::int as easy,
        COALESCE(SUM(CASE WHEN LOWER(difficulty) = 'medium' THEN 1 ELSE 0 END), 0)::int as medium,
        COALESCE(SUM(CASE WHEN LOWER(difficulty) = 'hard' THEN 1 ELSE 0 END), 0)::int as hard
      FROM problems;
    `;
    
    if (rows && rows.length > 0) {
      stats = {
        total: rows[0].total || 0,
        easy: rows[0].easy || 0,
        medium: rows[0].medium || 0,
        hard: rows[0].hard || 0,
      };
    }
  } catch (err) {
    console.error("Error loading problem stats:", err);
  }

  return <HomeClientWrapper stats={stats} isAdmin={isAdmin} />;
}

