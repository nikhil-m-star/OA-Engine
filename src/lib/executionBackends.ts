import { exec } from "child_process";

export const LANGUAGE_IDS: Record<string, number> = {
  cpp: 75, // C++ (GCC 13.2.0)
};

export const WANDBOX_COMPILERS: Record<string, string> = {
  cpp: "gcc-head",
};

// Helper to run local child process command as a promise (development C++ fallback)
export function runCommand(cmd: string, cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        code: error ? error.code || 1 : 0
      });
    });
  });
}

// Call Judge0 remote API using base64 encoded transmission
export async function executeOnJudge0(sourceCode: string, language: string, rapidApiKey: string, judge0Url: string) {
  const langId = LANGUAGE_IDS[language] || 75;
  const payload = {
    source_code: Buffer.from(sourceCode).toString("base64"),
    language_id: langId,
    stdin: ""
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  let submitUrl = "";
  if (judge0Url.includes("rapidapi")) {
    headers["X-RapidAPI-Host"] = judge0Url.replace("https://", "").replace("http://", "").split("/")[0];
    headers["X-RapidAPI-Key"] = rapidApiKey;
    submitUrl = `${judge0Url}/submissions?base64_encoded=true&wait=true`;
  } else {
    submitUrl = `${judge0Url}/submissions?base64_encoded=true&wait=true`;
  }

  const response = await fetch(submitUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Judge0 API responded with status ${response.status}: ${text}`);
  }

  return await response.json();
}

// Call Wandbox free keyless compile API
export async function executeOnWandbox(sourceCode: string, language: string) {
  const compiler = WANDBOX_COMPILERS[language] || "gcc-13.2.0";
  const response = await fetch("https://wandbox.org/api/compile.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      compiler,
      code: sourceCode
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Wandbox API responded with status ${response.status}: ${text}`);
  }

  return await response.json();
}

// Call Piston free keyless execution API
export async function executeOnPiston(sourceCode: string, language: string) {
  const response = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      language: "cpp",
      version: "*",
      files: [
        {
          name: "main.cpp",
          content: sourceCode
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Piston API responded with status ${response.status}: ${text}`);
  }

  return await response.json();
}

export function evaluateBatchResults(stdout: string, testCases: { input: string; output: string }[]) {
  const splits = stdout.split("CASE_OUT:");
  const actualOutputs = splits.slice(1).map(s => s.trim());

  if (actualOutputs.length < testCases.length) {
    return {
      success: false,
      status: "Runtime Error" as const,
      error: `Runtime Error: Process exited early. Only ${actualOutputs.length} of ${testCases.length} test cases ran.`,
      passed: actualOutputs.length,
      total: testCases.length
    };
  }

  for (let i = 0; i < testCases.length; i++) {
    const actual = actualOutputs[i];
    const expected = testCases[i].output;

    const cleanActual = actual.replace(/\s+/g, "").toLowerCase();
    const cleanExpected = expected.replace(/\s+/g, "").toLowerCase();

    if (cleanActual !== cleanExpected) {
      return {
        success: false,
        status: "Wrong Answer" as const,
        passed: i,
        total: testCases.length,
        failed_case: {
          input: testCases[i].input,
          expected: expected,
          actual: actual
        }
      };
    }
  }

  return {
    success: true,
    status: "Accepted" as const,
    passed: testCases.length,
    total: testCases.length,
    output: `All ${testCases.length} test cases passed!`
  };
}
