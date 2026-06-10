import { neon } from "@neondatabase/serverless";

type SqlQuery = <T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T[]>;

let sqlClient: SqlQuery | null = null;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is missing.");
  }

  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL) as unknown as SqlQuery;
  }

  return sqlClient;
}

// Global cache to prevent running DDL checks on every request
let initializedPromise: Promise<void> | null = null;

export async function initDb() {
  if (initializedPromise) {
    return initializedPromise;
  }

  initializedPromise = (async () => {
    try {
      const sql = getSql();

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
      initializedPromise = null; // Allow retry on next request if initialization failed
      throw err;
    }
  })();

  return initializedPromise;
}
