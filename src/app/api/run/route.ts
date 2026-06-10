import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { parseInputArgs } from "@/app/runner";

const LANGUAGE_IDS: Record<string, number> = {
  cpp: 75, // C++ (GCC 13.2.0)
  python: 92, // Python (3.11.2)
  javascript: 93 // JavaScript (Node.js 18.15.0)
};

// Helper to run local child process command as a promise (development C++ fallback)
function runCommand(cmd: string, cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
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

// Format JS values into C++ initializer syntax or basic literals
function formatValueToCpp(val: unknown, type: string): string {
  const cleanType = type.replace(/[&*]/g, "").trim();

  if (cleanType === "ListNode") {
    const listVals = Array.isArray(val) ? val : [];
    const valString = listVals.map(v => String(v)).join(", ");
    return `createList({${valString}})`;
  }

  if (cleanType === "TreeNode") {
    const treeVals = Array.isArray(val) ? val : [];
    const stringVals = treeVals.map(v => v === null ? "\"null\"" : `"${v}"`).join(", ");
    return `createTree({${stringVals}})`;
  }

  if (Array.isArray(val)) {
    return "{" + val.map(item => formatValueToCpp(item, cleanType.replace("vector<", "").replace(">", ""))).join(", ") + "}";
  }

  if (typeof val === "string") {
    return `"${val}"`;
  }

  if (typeof val === "boolean") {
    return val ? "true" : "false";
  }

  if (val === null || val === undefined) {
    return "nullptr";
  }

  return String(val);
}

// Generate full runnable source code for C++
function generateCppSource(userCode: string, methodName: string, returnType: string, cppArgsDeclarations: string, argsValuesPassed: string[], cppPrintResult: string): string {
  return `
#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <map>
#include <set>
#include <unordered_set>
#include <stack>
#include <queue>
#include <algorithm>
#include <sstream>
#include <cmath>

using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

ListNode* createList(const vector<int>& vals) {
    if (vals.empty()) return nullptr;
    ListNode* head = new ListNode(vals[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < vals.size(); i++) {
        curr->next = new ListNode(vals[i]);
        curr = curr->next;
    }
    return head;
}

TreeNode* createTree(const vector<string>& vals) {
    if (vals.empty() || vals[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(stoi(vals[0]));
    vector<TreeNode*> q = {root};
    size_t valIdx = 1;
    size_t qIdx = 0;
    while (qIdx < q.size() && valIdx < vals.size()) {
        TreeNode* curr = q[qIdx++];
        if (curr == nullptr) continue;
        
        if (valIdx < vals.size() && vals[valIdx] != "null") {
            curr->left = new TreeNode(stoi(vals[valIdx]));
            q.push_back(curr->left);
        }
        valIdx++;
        
        if (valIdx < vals.size() && vals[valIdx] != "null") {
            curr->right = new TreeNode(stoi(vals[valIdx]));
            q.push_back(curr->right);
        }
        valIdx++;
    }
    return root;
}

template <typename T>
void printVector(const vector<T>& vec) {
    cout << "[";
    for (size_t i = 0; i < vec.size(); i++) {
        cout << vec[i] << (i + 1 < vec.size() ? "," : "");
    }
    cout << "]";
}

template <typename T>
void printMatrix(const vector<vector<T>>& mat) {
    cout << "[";
    for (size_t i = 0; i < mat.size(); i++) {
        printVector(mat[i]);
        cout << (i + 1 < mat.size() ? "," : "");
    }
    cout << "]";
}

void printList(ListNode* head) {
    cout << "[";
    ListNode* curr = head;
    while (curr != nullptr) {
        cout << curr->val << (curr->next != nullptr ? "," : "");
        curr = curr->next;
    }
    cout << "]";
}

void printTree(TreeNode* root) {
    if (root == nullptr) {
        cout << "[]";
        return;
    }
    cout << "[";
    vector<TreeNode*> q = {root};
    vector<string> result;
    size_t qIdx = 0;
    
    while (qIdx < q.size()) {
        TreeNode* curr = q[qIdx++];
        if (curr != nullptr) {
            result.push_back(to_string(curr->val));
            q.push_back(curr->left);
            q.push_back(curr->right);
        } else {
            result.push_back("null");
        }
    }
    
    while (!result.empty() && result.back() == "null") {
        result.pop_back();
    }
    
    for (size_t i = 0; i < result.size(); i++) {
        cout << result[i] << (i + 1 < result.size() ? "," : "");
    }
    cout << "]";
}

// USER SOLUTION CODE
${userCode}

int main() {
    Solution solver;
${cppArgsDeclarations}
    #if ${returnType === "void" ? "1" : "0"}
    solver.${methodName}(${argsValuesPassed.join(", ")});
    cout << "Accepted (void function)";
    #else
    auto result = solver.${methodName}(${argsValuesPassed.join(", ")});
    ${cppPrintResult}
    #endif
    return 0;
}
`;
}

// Generate full runnable source code for Python
function generatePythonSource(userCode: string, methodName: string, returnType: string, params: { name: string; type: string }[], argsMap: Record<string, any>): string {
  let declarations = "";
  const passedArgs: string[] = [];

  params.forEach(param => {
    const val = argsMap[param.name];
    const cleanType = param.type.replace(/[&*]/g, "").trim();

    if (cleanType === "ListNode") {
      declarations += `    ${param.name} = createList(json.loads(${JSON.stringify(JSON.stringify(val))}))\n`;
    } else if (cleanType === "TreeNode") {
      declarations += `    ${param.name} = createTree(json.loads(${JSON.stringify(JSON.stringify(val))}))\n`;
    } else {
      declarations += `    ${param.name} = json.loads(${JSON.stringify(JSON.stringify(val))})\n`;
    }
    passedArgs.push(param.name);
  });

  const cleanReturnType = returnType.replace(/[&*]/g, "").trim();
  let printResult = "";
  if (cleanReturnType === "ListNode") {
    printResult = "print(json.dumps(listToArray(result)))";
  } else if (cleanReturnType === "TreeNode") {
    printResult = "print(json.dumps(treeToArray(result)))";
  } else {
    printResult = "print(json.dumps(result))";
  }

  return `
import json
import sys

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def createList(vals):
    if not vals: return None
    head = ListNode(vals[0])
    curr = head
    for v in vals[1:]:
        curr.next = ListNode(v)
        curr = curr.next
    return head

def listToArray(head):
    res = []
    curr = head
    while curr:
        res.append(curr.val)
        curr = curr.next
    return res

def createTree(vals):
    if not vals or vals[0] is None or vals[0] == "null": return None
    try:
        root = TreeNode(int(vals[0]))
    except:
        return None
    q = [root]
    idx = 1
    qIdx = 0
    while qIdx < len(q) and idx < len(vals):
        curr = q[qIdx]
        qIdx += 1
        if curr is None: continue
        
        if idx < len(vals) and vals[idx] is not None and vals[idx] != "null":
            curr.left = TreeNode(int(vals[idx]))
            q.append(curr.left)
        idx += 1
        
        if idx < len(vals) and vals[idx] is not None and vals[idx] != "null":
            curr.right = TreeNode(int(vals[idx]))
            q.append(curr.right)
        idx += 1
    return root

def treeToArray(root):
    if not root: return []
    res = []
    q = [root]
    while q:
        curr = q.pop(0)
        if curr:
            res.append(curr.val)
            q.append(curr.left)
            q.append(curr.right)
        else:
            res.append(None)
    while res and res[-1] is None:
        res.pop()
    return res

# USER SOLUTION CODE
${userCode}

# DRIVER CODE
try:
${declarations}
    solver = Solution()
    result = solver.${methodName}(${passedArgs.join(", ")})
    ${printResult}
except Exception as e:
    print(f"Runtime Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
}

// Generate full runnable source code for JavaScript
function generateJavaScriptSource(userCode: string, methodName: string, returnType: string, params: { name: string; type: string }[], argsMap: Record<string, any>): string {
  let declarations = "";
  const passedArgs: string[] = [];

  params.forEach(param => {
    const val = argsMap[param.name];
    const cleanType = param.type.replace(/[&*]/g, "").trim();

    if (cleanType === "ListNode") {
      declarations += `    const ${param.name} = createList(JSON.parse(${JSON.stringify(JSON.stringify(val))}));\n`;
    } else if (cleanType === "TreeNode") {
      declarations += `    const ${param.name} = createTree(JSON.parse(${JSON.stringify(JSON.stringify(val))}));\n`;
    } else {
      declarations += `    const ${param.name} = JSON.parse(${JSON.stringify(JSON.stringify(val))});\n`;
    }
    passedArgs.push(param.name);
  });

  const cleanReturnType = returnType.replace(/[&*]/g, "").trim();
  let printResult = "";
  if (cleanReturnType === "ListNode") {
    printResult = "console.log(JSON.stringify(listToArray(result)));";
  } else if (cleanReturnType === "TreeNode") {
    printResult = "console.log(JSON.stringify(treeToArray(result)));";
  } else {
    printResult = "console.log(JSON.stringify(result));";
  }

  return `
class ListNode {
    constructor(val, next) {
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
    }
}

class TreeNode {
    constructor(val, left, right) {
        this.val = (val === undefined ? 0 : val);
        this.left = (left === undefined ? null : left);
        this.right = (right === undefined ? null : right);
    }
}

function createList(vals) {
    if (!vals || vals.length === 0) return null;
    const head = new ListNode(vals[0]);
    let curr = head;
    for (let i = 1; i < vals.length; i++) {
        curr.next = new ListNode(vals[i]);
        curr = curr.next;
    }
    return head;
}

function listToArray(head) {
    const res = [];
    let curr = head;
    while (curr) {
        res.push(curr.val);
        curr = curr.next;
    }
    return res;
}

function createTree(vals) {
    if (!vals || vals.length === 0 || vals[0] === null || vals[0] === "null") return null;
    const root = new TreeNode(parseInt(vals[0]));
    const q = [root];
    let idx = 1;
    let qIdx = 0;
    while (qIdx < q.length && idx < vals.length) {
        const curr = q[qIdx++];
        if (curr === null) continue;
        
        if (idx < vals.length && vals[idx] !== null && vals[idx] !== "null") {
            curr.left = new TreeNode(parseInt(vals[idx]));
            q.push(curr.left);
        }
        idx++;
        
        if (idx < vals.length && vals[idx] !== null && vals[idx] !== "null") {
            curr.right = new TreeNode(parseInt(vals[idx]));
            q.push(curr.right);
        }
        idx++;
    }
    return root;
}

function treeToArray(root) {
    if (!root) return [];
    const res = [];
    const q = [root];
    while (q.length > 0) {
        const curr = q.shift();
        if (curr) {
            res.push(curr.val);
            q.push(curr.left);
            q.push(curr.right);
        } else {
            res.push(null);
        }
    }
    while (res.length > 0 && res[res.length - 1] === null) {
        res.pop();
    }
    return res;
}

// USER SOLUTION CODE
${userCode}

// DRIVER CODE
try {
${declarations}
    const solver = new Solution();
    const result = solver.${methodName}(${passedArgs.join(", ")});
    ${printResult}
} catch (e) {
    console.error("Runtime Error: " + e.message);
    process.exit(1);
}
`;
}

// Call Judge0 remote API using base64 encoded transmission
async function executeOnJudge0(sourceCode: string, language: string, rapidApiKey: string, judge0Url: string) {
  const langId = LANGUAGE_IDS[language] || 75;
  const payload = {
    source_code: Buffer.from(sourceCode).toString("base64"),
    language_id: langId,
    stdin: "" // Args are directly embedded inside driver codes
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
    // Standard self-hosted deployment
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

export async function POST(req: NextRequest) {
  let tempDir = "";
  let sourceFilePath = "";
  let binaryFilePath = "";

  try {
    const { code, input, starterCode, language = "cpp" } = await req.json();

    if (!code || !starterCode) {
      return NextResponse.json({ success: false, error: "Missing required template run fields." }, { status: 400 });
    }

    // 1. Extract method signature details from C++ starter code template
    const signatureRegex = /([a-zA-Z0-9_<>&*:]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/;
    const match = starterCode.match(signatureRegex);
    
    if (!match) {
      return NextResponse.json({ success: false, error: "Could not locate standard LeetCode function signature." });
    }

    const returnType = match[1].trim();
    const methodName = match[2].trim();
    const paramsStr = match[3].trim();

    // Extract names and types of function parameters
    const params = paramsStr.split(",").map((p: string) => {
      const parts = p.trim().split(/\s+/);
      const name = parts[parts.length - 1].replace(/[&*]/g, "");
      const type = parts.slice(0, parts.length - 1).join(" ");
      return { name, type };
    }).filter((p: { name: string; type: string }) => p.name);

    // 2. Parse input arguments from custom testcase input string
    const argsMap = parseInputArgs(input);

    // 3. Generate language specific source code
    let fullSourceCode = "";
    if (language === "cpp") {
      let cppArgsDeclarations = "";
      const argsValuesPassed: string[] = [];

      params.forEach((param: { name: string; type: string }) => {
        const val = argsMap[param.name];
        const cppVal = formatValueToCpp(val, param.type);
        const cleanType = param.type.replace(/[&*]/g, "").trim();
        
        if (cleanType === "ListNode" || cleanType === "TreeNode") {
          cppArgsDeclarations += `    ${cleanType}* ${param.name} = ${cppVal};\n`;
        } else {
          cppArgsDeclarations += `    ${param.type} ${param.name} = ${cppVal};\n`;
        }
        argsValuesPassed.push(param.name);
      });

      let cppPrintResult = "";
      const cleanReturnType = returnType.replace(/[&*]/g, "").trim();

      if (cleanReturnType.startsWith("vector<vector<")) {
        cppPrintResult = `printMatrix(result);`;
      } else if (cleanReturnType.startsWith("vector<")) {
        cppPrintResult = `printVector(result);`;
      } else if (cleanReturnType === "ListNode") {
        cppPrintResult = `printList(result);`;
      } else if (cleanReturnType === "TreeNode") {
        cppPrintResult = `printTree(result);`;
      } else if (cleanReturnType === "bool") {
        cppPrintResult = `cout << (result ? "true" : "false");`;
      } else if (cleanReturnType === "string") {
        cppPrintResult = `cout << "\\"" << result << "\\"";`;
      } else {
        cppPrintResult = `cout << result;`;
      }

      fullSourceCode = generateCppSource(code, methodName, returnType, cppArgsDeclarations, argsValuesPassed, cppPrintResult);
    } else if (language === "python") {
      fullSourceCode = generatePythonSource(code, methodName, returnType, params, argsMap);
    } else if (language === "javascript") {
      fullSourceCode = generateJavaScriptSource(code, methodName, returnType, params, argsMap);
    } else {
      return NextResponse.json({ success: false, error: `Unsupported execution language: ${language}` });
    }

    // 4. Remote Execution via Judge0 (Preferred & Required for Vercel)
    const rapidApiKey = process.env.RAPIDAPI_KEY || "";
    const judge0Url = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";

    if (rapidApiKey || process.env.JUDGE0_API_URL) {
      try {
        const result = await executeOnJudge0(fullSourceCode, language, rapidApiKey, judge0Url);
        const statusId = result.status?.id;
        const stdout = result.stdout ? Buffer.from(result.stdout, "base64").toString("utf8") : "";
        const stderr = result.stderr ? Buffer.from(result.stderr, "base64").toString("utf8") : "";
        const compileOutput = result.compile_output ? Buffer.from(result.compile_output, "base64").toString("utf8") : "";

        if (statusId === 3) {
          // Accepted
          return NextResponse.json({
            success: true,
            output: stdout.trim(),
            runtime: `${parseFloat(result.time || "0") * 1000} ms`,
            memory: `${(parseFloat(result.memory || "0") / 1024).toFixed(2)} MB`
          });
        } else if (statusId === 6) {
          // Compilation Error
          return NextResponse.json({
            success: false,
            error: `Compile Error:\n${compileOutput || stderr}`
          });
        } else {
          // Other execution errors (WA handled front-end)
          return NextResponse.json({
            success: false,
            error: `Execution Error (${result.status?.description || "NZEC"}):\n${stderr || stdout || compileOutput || "Process exited with non-zero status."}`
          });
        }
      } catch (judgeErr) {
        console.error("Judge0 submission failed, attempting local fallback if applicable", judgeErr);
      }
    }

    // 5. Local Fallback C++ execution (Development only, if no keys present)
    if (language === "cpp") {
      const workspaceRoot = process.cwd();
      tempDir = path.join(workspaceRoot, "temp_compile");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const fileId = Date.now() + "_" + Math.floor(Math.random() * 1000);
      sourceFilePath = path.join(tempDir, `sol_${fileId}.cpp`);
      binaryFilePath = path.join(tempDir, `bin_${fileId}`);

      fs.writeFileSync(sourceFilePath, fullSourceCode);

      const compileCmd = `g++ -std=c++17 "${sourceFilePath}" -o "${binaryFilePath}"`;
      const compileRes = await runCommand(compileCmd, tempDir);

      if (compileRes.code !== 0) {
        cleanupFiles(sourceFilePath, binaryFilePath);
        return NextResponse.json({
          success: false,
          error: `Compile Error:\n${compileRes.stderr || compileRes.stdout}`
        });
      }

      const runRes = await runCommand(`"${binaryFilePath}"`, tempDir);
      cleanupFiles(sourceFilePath, binaryFilePath);

      if (runRes.code !== 0) {
        return NextResponse.json({
          success: false,
          error: `Runtime Error:\n${runRes.stderr || "Process exited with non-zero exit code."}`
        });
      }

      return NextResponse.json({
        success: true,
        output: runRes.stdout.trim()
      });
    }

    return NextResponse.json({
      success: false,
      error: "Execution Failed: Judge0 configuration is missing. Please add RAPIDAPI_KEY to your .env.local file to compile and execute code on the cloud."
    });

  } catch (err) {
    cleanupFiles(sourceFilePath, binaryFilePath);
    return NextResponse.json({
      success: false,
      error: `Execution Thread Failed:\n${err instanceof Error ? err.message : String(err)}`
    }, { status: 500 });
  }
}

function cleanupFiles(src: string, bin: string) {
  try {
    if (src && fs.existsSync(src)) fs.unlinkSync(src);
    if (bin && fs.existsSync(bin)) fs.unlinkSync(bin);
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}
