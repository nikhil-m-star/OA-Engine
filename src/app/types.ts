export interface ExampleData {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemData {
  id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  tags: string[];
  description: string;
  constraints: string[];
  examples: ExampleData[];
  follow_up?: string;
  companies?: string[];
  starter_code: {
    cpp: string;
    [key: string]: string;
  };
}

export interface SavedProblemState {
  problem: ProblemData;
  savedAt: number;
}
