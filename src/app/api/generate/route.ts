import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const admin = await isAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: "Input text cannot be empty." }, { status: 400 });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json({ success: false, error: "NVIDIA NIM API key is missing on the server." }, { status: 500 });
    }

    const systemPrompt = `You are an expert parsing assistant. You are given a copy-paste text of a LeetCode problem (including title, description, constraints, examples, and C++ starter code).
Your task is to parse this information and output a single, raw, valid JSON object that strictly adheres to the following schema:

{
  "id": 1, // integer problem ID
  "title": "Two Sum", // problem title
  "slug": "two-sum", // url-friendly lowercase slug, e.g., 'two-sum'
  "difficulty": "Easy", // exactly: 'Easy', 'Medium', or 'Hard'
  "tags": ["Array", "Hash Map"], // tags as strings
  "description": "<p>Given an array of integers...</p>", // HTML-styled description. Use simple tags: <p>, <code>, <b>, <i>, <ul>, <li>. Replace math symbols or variable references with <code>var</code> where appropriate.
  "constraints": ["2 <= nums.length <= 10^4"], // array of constraints as strings
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]." // explanation is optional
    }
  ],
  "follow_up": "Can you solve it in O(n) time complexity?", // follow-up string or omit if not present
  "companies": ["Google", "Meta"], // array of company names (strings) where this question was asked, extracted from any text headers, assessment titles, or standard company associations. Return an empty array [] if no company associations are mentioned.
  "test_cases": [
    // MUST contain a minimum of 30 diverse and comprehensive test cases for verifying code correctness.
    // VERIFY ALL TEST CASES CAREFULLY! Make sure the expected output accurately corresponds to the input for every single testcase.
    // Cover boundary values, small lists, large lists, negative numbers, zeros, duplicates, etc.
    // Follow the input/output formatting of the examples exactly. Generates at least 30 test cases!
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]"
    }
  ],
  "starter_code": {
    "cpp": "class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        \\n    }\\n};",
    "python": "class Solution:\\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\\n        pass",
    "javascript": "class Solution {\\n    twoSum(nums, target) {\\n        \\n    }\\n}"
  }
}

CRITICAL: You MUST generate at least 30 test cases in the "test_cases" array. Return ONLY the raw, valid JSON object. Do not wrap it in markdown code blocks like \`\`\`json ... \`\`\`, and do not add any surrounding text. The response must be directly parseable by JSON.parse().`;

    // Call Nvidia NIM endpoint (OpenAI-compatible)
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `The problem copy-paste text is:\n\n${text}` }
        ],
        temperature: 0.1,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        success: false, 
        error: `NVIDIA NIM API responded with status ${response.status}: ${errorText}` 
      }, { status: response.status });
    }

    const result = await response.json();
    let content = result.choices?.[0]?.message?.content || "";

    if (!content.trim()) {
      throw new Error("NVIDIA NIM returned an empty completion response.");
    }

    // Clean up response: if LLM wrapped it in markdown code blocks, strip them
    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```[a-zA-Z]*\n/, ""); // Strip starting ```json or ```
      content = content.replace(/\n```$/, ""); // Strip trailing ```
      content = content.trim();
    }

    // Double check that it parses successfully as JSON
    let parsedJson;
    try {
      parsedJson = JSON.parse(content);
    } catch (parseErr) {
      console.error("NIM output failed to parse as JSON. Raw output was:", content);
      const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      return NextResponse.json({
        success: false,
        error: `Model returned invalid JSON format: ${errMsg}\n\nRaw Output:\n${content}`
      });
    }

    return NextResponse.json({ success: true, data: parsedJson });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: `AI Generation Thread Failed: ${err instanceof Error ? err.message : String(err)}`
    }, { status: 500 });
  }
}
