// Normalize and repair parameter/return types from C++ starter code templates
export function normalizeCppType(type: string, val: unknown): string {
  let clean = type.replace(/[&*]/g, "").trim().replace(/^const\s+/, "").trim();
  
  if (clean === "ListNode" || clean === "TreeNode") {
    return clean;
  }
  
  const valArr = val as any[];
  if (clean === "vector<vector>") {
    let innerType = "int";
    if (Array.isArray(valArr) && valArr.length > 0) {
      const row = valArr[0];
      if (Array.isArray(row) && row.length > 0) {
        const cell = row[0];
        if (typeof cell === "string") {
          innerType = "string";
        } else if (typeof cell === "boolean") {
          innerType = "bool";
        } else if (typeof cell === "number") {
          innerType = Number.isInteger(cell) ? "int" : "double";
        }
      }
    }
    return `vector<vector<${innerType}>>`;
  }
  
  if (clean === "vector") {
    let innerType = "int";
    if (Array.isArray(valArr) && valArr.length > 0) {
      const cell = valArr[0];
      if (Array.isArray(cell)) {
        let nestedType = "int";
        if (cell.length > 0) {
          const subCell = cell[0];
          if (typeof subCell === "string") nestedType = "string";
          else if (typeof subCell === "boolean") nestedType = "bool";
          else if (typeof subCell === "number") {
            nestedType = Number.isInteger(subCell) ? "int" : "double";
          }
        }
        return `vector<vector<${nestedType}>>`;
      } else {
        if (typeof cell === "string") {
          innerType = "string";
        } else if (typeof cell === "boolean") {
          innerType = "bool";
        } else if (typeof cell === "number") {
          innerType = Number.isInteger(cell) ? "int" : "double";
        }
      }
    }
    return `vector<${innerType}>`;
  }
  
  if (clean.includes("<>")) {
    clean = clean.replace("<>", "<int>");
  }
  
  return clean;
}

// Format JS values into C++ initializer syntax or basic literals
export function formatValueToCpp(val: unknown, type: string): string {
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
