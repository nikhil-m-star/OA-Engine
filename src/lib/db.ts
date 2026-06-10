import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

export const sql = neon(process.env.DATABASE_URL);

export async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS problems (
        id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) PRIMARY KEY,
        difficulty VARCHAR(50) NOT NULL,
        tags TEXT[] NOT NULL,
        description TEXT NOT NULL,
        constraints TEXT[] NOT NULL,
        examples JSONB NOT NULL,
        follow_up TEXT,
        starter_code JSONB NOT NULL,
        companies TEXT[] DEFAULT '{}',
        test_cases JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Auto-migration for existing tables
    await sql`
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS companies TEXT[] DEFAULT '{}';
    `;
    await sql`
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS test_cases JSONB DEFAULT '[]';
    `;
  } catch (err) {
    console.error("Failed to initialize Neon Postgres database:", err);
    throw err;
  }
}
