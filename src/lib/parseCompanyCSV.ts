export interface CompanyQuestion {
  id: number;
  title: string;
  acceptance: number; // as percentage, e.g., 57.5
  difficulty: string; // e.g., "Easy" | "Medium" | "Hard"
  frequency: number;  // as percentage, e.g., 100.0
  link: string;       // URL to problem
  recency: string;    // recency key: "30days" | "3months" | etc.
}

const recencyFileMap: Record<string, string> = {
  "30days": "thirty-days.csv",
  "3months": "three-months.csv",
  "6months": "six-months.csv",
  "1year": "more-than-six-months.csv",
  "alltime": "all.csv",
};

/**
 * Fetches and parses a company CSV file from the raw GitHub repository.
 * 
 * @param company The company folder name (e.g., "google")
 * @param recency The recency selection ("30days" | "3months" | "6months" | "1year" | "alltime")
 * @returns A promise resolving to an array of parsed CompanyQuestion objects.
 */
export async function parseCompanyCSV(company: string, recency: string): Promise<CompanyQuestion[]> {
  const fileName = recencyFileMap[recency];
  if (!fileName) {
    throw new Error(`Unsupported recency period: ${recency}`);
  }

  const normalizedCompany = company.toLowerCase().trim();
  const url = `https://raw.githubusercontent.com/snehasishroy/leetcode-companywise-interview-questions/master/${normalizedCompany}/${fileName}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${company} (${recency}): ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.split(/\r?\n/);
  const questions: CompanyQuestion[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by commas
    const parts = line.split(",");

    // Skip the header row if it contains 'ID' or 'URL'
    if (i === 0 || parts[0].toUpperCase() === "ID" || parts[1]?.toUpperCase() === "URL") {
      continue;
    }

    // A valid line must have at least 6 components: ID, URL, Title, Difficulty, Acceptance %, Frequency %
    // If the title contains commas, parts.length will be > 6
    if (parts.length < 6) {
      continue;
    }

    const id = parseInt(parts[0].trim(), 10);
    const link = parts[1].trim();
    
    // Extract fields from the end of the array to robustly handle commas in Title
    const frequencyStr = parts[parts.length - 1].trim();
    const acceptanceStr = parts[parts.length - 2].trim();
    const difficulty = parts[parts.length - 3].trim();

    // The Title occupies everything between URL (index 1) and Difficulty (index parts.length - 3)
    let title = parts.slice(2, parts.length - 3).join(",").trim();

    // Clean up title quotes if any (Gnu/RFC CSV wraps field in double quotes if it contains commas)
    if (title.startsWith('"') && title.endsWith('"')) {
      title = title.slice(1, -1).trim();
    }

    // Convert percentages to numbers
    const frequency = parseFloat(frequencyStr.replace("%", "")) || 0;
    const acceptance = parseFloat(acceptanceStr.replace("%", "")) || 0;

    // Graceful check for NaN on ID
    if (isNaN(id)) {
      continue;
    }

    questions.push({
      id,
      title,
      acceptance,
      difficulty,
      frequency,
      link,
      recency,
    });
  }

  return questions;
}
