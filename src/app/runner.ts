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
