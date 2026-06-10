export function splitTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let current = "";
  let bracketLevel = 0;
  let braceLevel = 0;
  let parenLevel = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "[") bracketLevel++;
    else if (char === "]") bracketLevel--;
    else if (char === "{") braceLevel++;
    else if (char === "}") braceLevel--;
    else if (char === "(") parenLevel++;
    else if (char === ")") parenLevel--;

    if (char === "," && bracketLevel === 0 && braceLevel === 0 && parenLevel === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts;
}

export function parseInputArgs(inputStr: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const parts = splitTopLevelCommas(inputStr);

  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx !== -1) {
      const key = part.substring(0, eqIdx).trim();
      const valStr = part.substring(eqIdx + 1).trim();
      
      let val: unknown;
      try {
        // Simple conversions to JSON format if needed
        // e.g. C++ string literals "abc" -> abc, or arrays with bracket matching
        val = JSON.parse(valStr);
      } catch {
        if (valStr.toLowerCase() === "true") {
          val = true;
        } else if (valStr.toLowerCase() === "false") {
          val = false;
        } else if (!isNaN(Number(valStr))) {
          val = Number(valStr);
        } else if (valStr.startsWith('"') && valStr.endsWith('"')) {
          val = valStr.substring(1, valStr.length - 1);
        } else if (valStr.startsWith("'") && valStr.endsWith("'")) {
          val = valStr.substring(1, valStr.length - 1);
        } else {
          val = valStr; // Fallback to raw string
        }
      }
      result[key] = val;
    }
  }

  return result;
}

export function transpileCppToJs(userCode: string): string {
  let jsCode = userCode;

  // 1. Remove public/private/protected
  jsCode = jsCode.replace(/\b(public|private|protected)\s*:/g, "");

  // 2. Remove standard includes or using namespaces
  jsCode = jsCode.replace(/#include\s*<[^>]+>/g, "");
  jsCode = jsCode.replace(/using\s+namespace\s+[a-zA-Z0-9_]+;/g, "");

  // 3. Transpile C++ function signatures to JS methods inside class
  // e.g., vector<int> twoSum(vector<int>& nums, int target) { -> twoSum(nums, target) {
  // Let's match: returnType name(params) {
  jsCode = jsCode.replace(/([a-zA-Z0-9_<>&*:]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, (match, type, name, params) => {
    // If the name is "Solution" (constructor) or standard JS keywords, handle carefully
    if (name === "Solution") {
      return "constructor() {";
    }
    const jsParams = params.split(",").map((p: string) => {
      const parts = p.trim().split(/\s+/);
      const lastWord = parts[parts.length - 1];
      // strip references & pointers
      return lastWord.replace(/[&*]/g, "");
    }).join(", ");

    return `${name}(${jsParams}) {`;
  });

  // 4. Handle variable declarations inside code
  // pointer arrows to dot notation (e.g., curr->next -> curr.next)
  jsCode = jsCode.replace(/->/g, ".");

  // Vector constructors with size and initial value (e.g., vector<int> res(n, 0); -> let res = Array(n).fill(0);)
  jsCode = jsCode.replace(/\bvector\s*<[^>]+>\s+([a-zA-Z0-9_]+)\s*\(([^,)]+)\s*,\s*([^)]+)\)\s*;/g, "let $1 = Array($2).fill($3);");
  // Vector constructors with size only (e.g., vector<int> res(n); -> let res = Array(n).fill(0);)
  jsCode = jsCode.replace(/\bvector\s*<[^>]+>\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*;/g, "let $1 = Array($2).fill(0);");

  // C-style arrays: int arr[10]; -> let arr = Array(10).fill(0);
  jsCode = jsCode.replace(/\b(?:int|double|float|bool|char)\s+([a-zA-Z0-9_]+)\s*\[([^\]]+)\]\s*;/g, "let $1 = Array($2).fill(0);");

  // General C++ variable declarations: Type* name = value; or Type name = value;
  // Exclude keywords like return, class, struct, const, new, case, delete, default, else
  jsCode = jsCode.replace(/\b(?!return\b|class\b|struct\b|public\b|private\b|const\b|new\b|case\b|delete\b|default\b|else\b)([a-zA-Z0-9_<>*&]+)\s+([a-zA-Z0-9_]+)\s*(=|;)/g, (match, type, name, suffix) => {
    if (suffix === ";") {
      if (type.includes("vector")) {
        return `let ${name} = [];`;
      } else if (type.includes("map")) {
        return `let ${name} = {};`;
      } else if (type.includes("set")) {
        return `let ${name} = new Set();`;
      } else if (type.includes("stack") || type.includes("queue")) {
        return `let ${name} = [];`;
      }
      return `let ${name};`;
    }
    return `let ${name} ${suffix}`;
  });

  // Strip pointer symbols on inline multiple declarations: let curr = head, *prev = nullptr; -> let curr = head, prev = nullptr;
  jsCode = jsCode.replace(/,\s*\*\s*([a-zA-Z0-9_]+)/g, ", $1");

  // 5. C++ specific operations and STL methods mapping
  // size() -> length
  jsCode = jsCode.replace(/\.size\(\)/g, ".length");
  // push_back() -> push()
  jsCode = jsCode.replace(/\.push_back\(/g, ".push(");
  // empty() -> length === 0
  jsCode = jsCode.replace(/\.empty\(\)/g, ".length === 0");

  // Map/Object lookups
  // count() -> is key in object
  jsCode = jsCode.replace(/\.count\(([^)]+)\)/g, "[$1] !== undefined");
  // find(x) != end() -> is key in object
  jsCode = jsCode.replace(/\.find\(([^)]+)\)\s*!=\s*[a-zA-Z0-9_]+\.end\(\)/g, "[$1] !== undefined");

  // Set lookup
  jsCode = jsCode.replace(/\.insert\(([^)]+)\)/g, ".add($1)");

  // Stack/Queue mappings
  jsCode = jsCode.replace(/\.push\(([^)]+)\)/g, ".push($1)");
  jsCode = jsCode.replace(/\.pop\(\)/g, ".pop()");
  jsCode = jsCode.replace(/\.top\(\)/g, "[${name}.length - 1]");
  jsCode = jsCode.replace(/\.front\(\)/g, "[0]");

  // Integer Division assignments
  // e.g. x /= 10; -> x = Math.trunc(x / 10);
  jsCode = jsCode.replace(/([a-zA-Z0-9_]+)\s*\/=\s*([^;]+);/g, "$1 = Math.trunc($1 / ($2));");

  // 6. C++ Standard Library functions
  jsCode = jsCode.replace(/\bmin\(/g, "Math.min(");
  jsCode = jsCode.replace(/\bmax\(/g, "Math.max(");
  jsCode = jsCode.replace(/\babs\(/g, "Math.abs(");
  jsCode = jsCode.replace(/\bsqrt\(/g, "Math.sqrt(");
  jsCode = jsCode.replace(/\bpow\(/g, "Math.pow(");

  // NULL -> null
  jsCode = jsCode.replace(/\b(NULL|nullptr)\b/g, "null");

  // 7. C++ curly brace return expressions like `return {a, b};` -> `return [a, b];`
  jsCode = jsCode.replace(/return\s*\{([^}]+)\}\s*;/g, "return [$1];");

  return jsCode;
}

export function runCode(
  userCode: string,
  inputStr: string,
  starterCode: string
): { success: boolean; output?: unknown; error?: string } {
  try {
    // 1. Extract method name and parameters from starter code signature
    const signatureRegex = /([a-zA-Z0-9_<>&*:]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/;
    const match = starterCode.match(signatureRegex);
    
    if (!match) {
      return { success: false, error: "Could not find function signature in starter code template." };
    }

    const methodName = match[2];
    const paramsStr = match[3];

    // Extract argument names
    const paramNames = paramsStr
      .split(",")
      .map(p => {
        const parts = p.trim().split(/\s+/);
        const lastWord = parts[parts.length - 1];
        return lastWord.replace(/[&*]/g, "");
      })
      .filter(Boolean);

    // 2. Parse input arguments from string (e.g. "nums = [2,7,11,15], target = 9")
    const argsMap = parseInputArgs(inputStr);

    // Extract values in the order defined by the function signature
    const argsValues = paramNames.map(name => {
      if (!(name in argsMap)) {
        throw new Error(`Input is missing value for argument: "${name}"`);
      }
      return argsMap[name];
    });

    // 3. Transpile C++ code to JS
    const transpiledJs = transpileCppToJs(userCode);

    // 4. Create execution script
    // We construct a function body that declares the Solution class and returns the result of calling the method
    const executionScript = `
      class ListNode {
        constructor(val, next = null) {
          this.val = val;
          this.next = next;
        }
      }
      class TreeNode {
        constructor(val, left = null, right = null) {
          this.val = val;
          this.left = left;
          this.right = right;
        }
      }
      ${transpiledJs}
      try {
        const instance = new Solution();
        if (typeof instance.${methodName} !== 'function') {
          throw new Error('Method "${methodName}" not found in class Solution.');
        }
        return instance.${methodName}(...arguments);
      } catch (err) {
        throw err;
      }
    `;

    // 5. Evaluate code using safe Function constructor
    const evaluator = new Function(...paramNames, executionScript);
    const result = evaluator(...argsValues);

    return { success: true, output: result };
  } catch (err) {
    // Collect full error details
    const stackTrace = err instanceof Error ? err.stack || err.message : String(err);
    
    // Attempt to transpile user code again to display in details block
    let debugJs = "";
    try {
      debugJs = transpileCppToJs(userCode);
    } catch {
      debugJs = "(Failed during transpilation)";
    }

    const fullDetails = `${stackTrace}\n\n[Transpiled Execution Code]:\n${debugJs}`;
    return { success: false, error: fullDetails };
  }
}
