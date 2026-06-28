import { ProblemData } from "@/app/types";

export const AI_PROMPT_TEXT = `Please convert the following LeetCode problem into a structured JSON object. The output must strictly follow the schema below, without any surrounding markdown commentary (just return the raw JSON block).

{
  "id": 1, // integer problem ID (use the original LeetCode problem number if available, e.g. 15 for 3Sum)
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
  "companies": ["Google", "Meta"], // array of company names (strings) where this question was asked. Return an empty array [] if no company associations are mentioned.
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
    "cpp": "class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        \\n    }\\n};"
  }
}`;

export const DEFAULT_TEMPLATE: ProblemData = {
  id: 1,
  title: "Two Sum",
  slug: "two-sum",
  difficulty: "Easy",
  tags: ["Array", "Hash Map"],
  companies: ["Google", "Adobe"],
  description: "<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <i>indices of the two numbers such that they add up to <code>target</code></i>.</p>",
  constraints: [
    "2 <= nums.length <= 10^4",
    "Only one valid answer exists."
  ],
  examples: [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ],
  test_cases: [
    { "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]" }
  ],
  starter_code: {
    "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};"
  }
};
