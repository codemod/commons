import type { SgRoot } from "codemod:ast-grep";
import type JS from "codemod:ast-grep/langs/javascript";
import type TS from "codemod:ast-grep/langs/typescript";

interface Edit {
  startPos: number;
  endPos: number;
  insertedText: string;
}

interface MethodCall {
  method: string;
  args: string;
}

interface ParsedMethodChain {
  base: string;
  methodCalls: MethodCall[];
}

interface TransformResult {
  needsTransform: boolean;
  methods: MethodCall[];
}

const UTILITY_TYPE_MAPPINGS = {
  ZodError: "$ZodError",
  ZodIssue: "$ZodIssue",
  ZodType: "$ZodType",
  ZodIssueBase: "$ZodIssueBase",
  ZodInvalidTypeIssue: "$ZodIssueInvalidType",
  ZodInvalidEnumValueIssue: "$ZodIssueInvalidValue",
  ZodTooSmallIssue: "$ZodIssueInvalidValue",
  ZodTooBigIssue: "$ZodIssueInvalidValue",
  ParseStatus: "$ParseStatus",
  ParseContext: "$ParseContext",
  ZodEffects: "$ZodPipe",
} as const;

async function transform(root: SgRoot<TS>): Promise<string> {
  const rootNode = root.root();
  
  const editsA = transformUtilityTypeReferences(root);
  const editsB = transformImportStatements(root);
  const editsC = transformDescribeMethods(root);
  const editsD = transformNonemptyMethods(root);
  const editsE = transformRegexMethods(root);
  const editsF = transformOrChains(root);
  const editsG = transformErrorMethods(root);
  const editsH = transformRefineMethods(root);
  const editsI = transformValidationMessages(root);
  const editsJ = transformMethodChainOrdering(root);

  const allEdits = [
    ...editsA,
    ...editsB,
    ...editsC,
    ...editsD,
    ...editsE,
    ...editsF,
    ...editsG,
    ...editsH,
    ...editsI,
    ...editsJ,
  ];

  if (allEdits.length > 0) {
    return rootNode.commitEdits(allEdits);
  }

  return rootNode.text();
}

function transformUtilityTypeReferences(root: SgRoot<TS>): Edit[] {
  const edits: Edit[] = [];
  const rootNode = root.root();

  const utilityDecls = rootNode.findAll({
    rule: {
      any: [{ kind: "identifier" }, { kind: "type_identifier" }],
      regex:
        "ZodError|ZodIssue|ZodType|ZodIssueBase|ZodInvalidTypeIssue|ZodInvalidEnumValueIssue|ZodTooSmallIssue|ZodTooSmallIssue|ZodTooBigIssue|ParseStatus|ParseContext|ZodEffects",
    },
  });

  for (const utilityDecl of utilityDecls) {
    const text = utilityDecl.text();
    const replacement = UTILITY_TYPE_MAPPINGS[text as keyof typeof UTILITY_TYPE_MAPPINGS] || `$${text}`;
    
    edits.push({
      startPos: utilityDecl.range().start.index,
      endPos: utilityDecl.range().end.index,
      insertedText: replacement,
    });
  }

  return edits;
}

function transformImportStatements(root: SgRoot<TS>): Edit[] {
  const edits: Edit[] = [];
  const rootNode = root.root();

  edits.push(...transformNamedImports(rootNode));
  
  edits.push(...transformDefaultImports(rootNode));

  return edits;
}

function transformNamedImports(rootNode: any): Edit[] {
  const edits: Edit[] = [];

  const zodeImports = rootNode.findAll({
    rule: {
      kind: "import_statement",
      has: {
        kind: "named_imports",
        pattern: "$MODULEIMPORT",
        stopBy: "end",
      },
      all: [
        {
          has: {
            field: "source",
            kind: "string",
            has: {
              kind: "string_fragment",
              regex: "^zod$",
            },
          },
        },
        {
          has: {
            kind: "import_clause",
            has: {
              kind: "named_imports",
            },
          },
        },
      ],
    },
  });

  for (const zodeImport of zodeImports) {
    const moduleImport = zodeImport.getMatch("MODULEIMPORT")?.text();
    if (!moduleImport) continue;

    const { coreImports, utilityImports } = categorizeImports(moduleImport);
    const newImportStatement = buildNewImportStatement(coreImports, utilityImports);

    edits.push({
      startPos: zodeImport.range().start.index,
      endPos: zodeImport.range().end.index,
      insertedText: newImportStatement,
    });
  }

  return edits;
}

function transformDefaultImports(rootNode: any): Edit[] {
  const edits: Edit[] = [];

  const defaultImports = rootNode.findAll({
    rule: {
      kind: "import_statement",
      has: {
        kind: "import_clause",
        pattern: "$DEFAULT_IMPORT",
        stopBy: "end",
      },
      all: [
        {
          has: {
            field: "source",
            kind: "string",
            has: {
              kind: "string_fragment",
              regex: "^zod$",
            },
          },
        },
        {
          not: {
            has: {
              kind: "named_imports",
            },
          },
        },
      ],
    },
  });

  for (const defaultImport of defaultImports) {
    const defaultImportText = defaultImport.getMatch("DEFAULT_IMPORT")?.text();

    if (defaultImportText === "z") {
      edits.push({
        startPos: defaultImport.range().start.index,
        endPos: defaultImport.range().end.index,
        insertedText: `import { z } from "zod/v4";`,
      });
    }
  }

  return edits;
}

function categorizeImports(moduleImport: string): { coreImports: string[]; utilityImports: string[] } {
  const importText = moduleImport.replace(/[{}]/g, "").trim();
  const imports = importText.split(",").map((imp) => imp.trim());

  const coreImports: string[] = [];
  const utilityImports: string[] = [];

  for (const imp of imports) {
    const parts = imp.split(" as ");
    const importName = parts[0].trim();
    const alias = parts[1]?.trim();

    if (importName === "z") {
      coreImports.push(alias ? `z as ${alias}` : "z");
    } else if (UTILITY_TYPE_MAPPINGS[importName as keyof typeof UTILITY_TYPE_MAPPINGS]) {
      const mappedName = UTILITY_TYPE_MAPPINGS[importName as keyof typeof UTILITY_TYPE_MAPPINGS];
      utilityImports.push(alias ? `${mappedName} as ${alias}` : mappedName);
    } else {
      utilityImports.push(alias ? `${importName} as ${alias}` : importName);
    }
  }

  return { coreImports, utilityImports };
}

function buildNewImportStatement(coreImports: string[], utilityImports: string[]): string {
  const newImports: string[] = [];

  if (coreImports.length > 0) {
    newImports.push(`import { ${coreImports.join(", ")} } from "zod/v4";`);
  }

  if (utilityImports.length > 0) {
    newImports.push(`import { ${utilityImports.join(", ")} } from "zod/v4/core";`);
  }

  return newImports.join("\n");
}

function transformDescribeMethods(root: SgRoot<TS>): Edit[] {
  const edits: Edit[] = [];
  const rootNode = root.root();

  const describeDecls = rootNode.findAll({
    rule: {
      any: [
        { pattern: "$OBJ.describe($DESCRIBESTRING)" },
        { pattern: "describe($DESCRIBESTRING)" },
      ],
    },
    constraints: {
      DESCRIBESTRING: {
        kind: "string",
      },
    },
  });

  for (const describeDecl of describeDecls) {
    const describeString = describeDecl.getMatch("DESCRIBESTRING")?.text();
    const describeObject = describeDecl.getMatch("OBJ")?.text();
    
    const replacement = describeObject
      ? `${describeObject}.meta({description: ${describeString}})`
      : `meta({description: ${describeString}})`;

    edits.push({
      startPos: describeDecl.range().start.index,
      endPos: describeDecl.range().end.index,
      insertedText: replacement,
    });
  }

  return edits;
}

function transformNonemptyMethods(root: SgRoot<TS>): Edit[] {
  const edits: Edit[] = [];
  const rootNode = root.root();

  const nonemptyDecls = rootNode.findAll({
    rule: {
      pattern: "$ARRAY.nonempty($$$ARGS)",
    },
  });

  for (const decl of nonemptyDecls) {
    const array = decl.getMatch("ARRAY")?.text();
    const args = decl.getMultipleMatches("ARGS");

    if (!array) continue;

    const messageArg = buildMessageArg(args);
    const replacement = messageArg 
      ? `${array}.min(1, ${messageArg})` 
      : `${array}.min(1)`;

    edits.push({
      startPos: decl.range().start.index,
      endPos: decl.range().end.index,
      insertedText: replacement,
    });
  }

  return edits;
}

function buildMessageArg(args: any[] | undefined): string {
  if (!args || args.length === 0) return "";
  
  const argText = args[0].text();
  return argText.startsWith("{") ? argText : `{ message: ${argText} }`;
}

function transformRegexMethods(root: SgRoot<TS>): Edit[] {
  const edits: Edit[] = [];
  const rootNode = root.root();

  const regexDecls = rootNode.findAll({
    rule: {
      pattern: "$BASE.regex($PATTERN, $MESSAGE)",
    },
    constraints: {
      MESSAGE: {
        kind: "string",
      },
    },
  });

  for (const decl of regexDecls) {
    const base = decl.getMatch("BASE")?.text();
    const pattern = decl.getMatch("PATTERN")?.text();
    const message = decl.getMatch("MESSAGE")?.text();

    if (base && pattern && message) {
      edits.push({
        startPos: decl.range().start.index,
        endPos: decl.range().end.index,
        insertedText: `${base}.regex(${pattern}, { message: ${message} })`,
      });
    }
  }

  return edits;
}

function transformOrChains(root: SgRoot<TS>): Edit[] {
  const edits: Edit[] = [];
  const rootNode = root.root();

  const orChainDecls = rootNode.findAll({
    rule: {
      kind: "call_expression",
      has: {
        field: "function",
        kind: "member_expression",
        has: {
          field: "property",
          kind: "property_identifier",
          regex: "^or$",
        },
      },
    },
  });

  const processedOrPositions = new Set<number>();

  for (const orChainDecl of orChainDecls) {
    if (processedOrPositions.has(orChainDecl.range().start.index)) continue;

    const orChainText = orChainDecl.text();
    if (!orChainText.includes('.or(') || orChainText.includes('import')) {
      continue;
    }

    const chainInfo = extractOrChain(rootNode, orChainDecl);
    if (!chainInfo) continue;

    const { chainStart, chainEnd, allArgs } = chainInfo;
    
    if (allArgs.length >= 2 && !allArgs.some(arg => arg.includes('import'))) {
      processedOrPositions.add(orChainDecl.range().start.index);
      
      const unionText = `z.union([\n  ${allArgs.join(",\n  ")}\n])`;
      edits.push({
        startPos: chainStart,
        endPos: chainEnd,
        insertedText: unionText,
      });
    }
  }

  return edits;
}

function extractOrChain(rootNode: any, orChainDecl: any) {
  const fullText = rootNode.text();
  const startPos = orChainDecl.range().start.index;

  const chainStart = findChainStart(fullText, startPos);
  const { chainEnd, chainText } = findChainEnd(fullText, orChainDecl.range().end.index);
  
  const actualChainText = fullText.substring(chainStart, chainEnd);
  
  if (!actualChainText.includes('.or(') || actualChainText.includes('import') || actualChainText.includes('from')) {
    return null;
  }
  
  const allArgs = parseOrChainArgs(actualChainText);
  
  return allArgs.length >= 2 ? { chainStart, chainEnd, allArgs } : null;
}

function findChainStart(fullText: string, startPos: number): number {
  let chainStart = startPos;
  let searchPos = startPos - 1;

  while (searchPos >= 0) {
    const char = fullText[searchPos];
    if (["\n", ";", "=", "(", "{", ",", "const ", "let ", "var "].some(boundary => 
      fullText.substring(Math.max(0, searchPos - 5), searchPos + 1).includes(boundary)
    )) {
      chainStart = searchPos + 1;
      break;
    }
    searchPos--;
  }

  while (chainStart < fullText.length && /\s/.test(fullText[chainStart])) {
    chainStart++;
  }

  return chainStart;
}

function findChainEnd(fullText: string, initialEnd: number) {
  let chainEnd = initialEnd;
  let searchEndPos = chainEnd;

  while (searchEndPos < fullText.length) {
    const remaining = fullText.substring(searchEndPos);
    const nextOrMatch = remaining.match(/^\s*\.or\s*\([^)]+\)/);
    if (nextOrMatch) {
      chainEnd = searchEndPos + nextOrMatch[0].length;
      searchEndPos = chainEnd;
    } else {
      break;
    }
  }

  const chainText = fullText.substring(0, chainEnd).trim();
  return { chainEnd, chainText };
}

function parseOrChainArgs(chainText: string): string[] {
  const allArgs: string[] = [];
  const parts = chainText.split(/\.or\s*\(/);

  if (parts.length >= 2) {
    allArgs.push(parts[0].trim());

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const arg = extractArgFromPart(part);
      if (arg) {
        allArgs.push(arg);
      }
    }
  }

  return allArgs;
}

function extractArgFromPart(part: string): string | null {
  let parenCount = 1;
  let argEnd = 0;

  for (let j = 0; j < part.length; j++) {
    if (part[j] === "(") parenCount++;
    else if (part[j] === ")") {
      parenCount--;
      if (parenCount === 0) {
        argEnd = j;
        break;
      }
    }
  }

  return argEnd > 0 ? part.substring(0, argEnd).trim() : null;
}

function transformErrorMethods(root: SgRoot<TS>): Edit[] {
  const edits: Edit[] = [];
  const rootNode = root.root();

  const errorMethodDecls = rootNode.findAll({
    rule: {
      any: [
        { pattern: "$ERROR.formErrors" },
        { pattern: "$ERROR.fieldErrors" },
      ],
    },
  });

  for (const decl of errorMethodDecls) {
    const error = decl.getMatch("ERROR")?.text();
    const fullText = decl.text();

    if (!error) continue;

    const replacement = fullText.includes(".formErrors") 
      ? `${error}.format()` 
      : `${error}.flatten()`;

    edits.push({
      startPos: decl.range().start.index,
      endPos: decl.range().end.index,
      insertedText: replacement,
    });
  }

  return edits;
}

function transformRefineMethods(root: SgRoot<TS>): Edit[] {
  const edits: Edit[] = [];
  const rootNode = root.root();

  const refineDecls = rootNode.findAll({
    rule: {
      any: [
        { pattern: "$$$BEFORE.refine($FUNCTION)" },
        { pattern: "refine($FUNCTION)" },
      ],
    },
    constraints: {
      FUNCTION: {
        any: [{ kind: "function_expression" }, { kind: "arrow_function" }],
      },
    },
  });

  for (const refineDecl of refineDecls) {
    const refineFunctionInside = refineDecl.getMatch("FUNCTION")?.text();
    const refineCallText = refineDecl.text();
    const hasSecondArg = refineCallText.match(/\.refine\s*\([^,]+,\s*\{/);

    if (!hasSecondArg && refineFunctionInside) {
      const beforeNodes = refineDecl.getMultipleMatches("BEFORE");
      const replacement = buildRefineReplacement(beforeNodes, refineFunctionInside);

      edits.push({
        startPos: refineDecl.range().start.index,
        endPos: refineDecl.range().end.index,
        insertedText: replacement,
      });
    }
  }

  return edits;
}

function buildRefineReplacement(beforeNodes: any[] | undefined, refineFunctionInside: string): string {
  if (beforeNodes && beforeNodes.length > 0) {
    const argBeforeRefine = beforeNodes.map((node) => node.text()).join(".");
    return `${argBeforeRefine}.refine(${refineFunctionInside}, { message: "" })`;
  } else {
    return `refine(${refineFunctionInside}, { message: "" })`;
  }
}

function transformValidationMessages(root: SgRoot<TS>): Edit[] {
  const edits: Edit[] = [];
  const rootNode = root.root();

  const allMethodCalls = rootNode.findAll({
    rule: {
      kind: "call_expression",
      has: {
        kind: "member_expression",
        has: {
          field: "property",
          regex: "^(min|max|length|email)$",
        },
      },
    },
  });

  for (const call of allMethodCalls) {
    const edit = transformValidationMessageCall(call);
    if (edit) {
      edits.push(edit);
    }
  }

  return edits;
}

function transformValidationMessageCall(call: any): Edit | null {
  const callText = call.text();
  const methodMatch = callText.match(/\.(min|max|length|email)\s*\(([^)]*)\)/);
  
  if (!methodMatch) return null;

  const method = methodMatch[1];
  const argsText = methodMatch[2];

  if (method === "email" && argsText && !argsText.trim().startsWith("{")) {
    if (argsText.match(/^['"`]/)) {
      const newText = callText.replace(
        /\.email\s*\([^)]+\)/,
        `.email({ message: ${argsText} })`
      );
      return {
        startPos: call.range().start.index,
        endPos: call.range().end.index,
        insertedText: newText,
      };
    }
  } else if (["min", "max", "length"].includes(method)) {
    const argsMatch = argsText.match(/^\s*([^,]+)\s*,\s*(.+)\s*$/);
    if (argsMatch) {
      const firstArg = argsMatch[1];
      const secondArg = argsMatch[2].trim();

      if (secondArg.match(/^['"`]/) && !secondArg.startsWith("{")) {
        const newText = callText.replace(
          new RegExp(`\\.${method}\\s*\\([^)]+\\)`),
          `.${method}(${firstArg}, { message: ${secondArg} })`
        );
        return {
          startPos: call.range().start.index,
          endPos: call.range().end.index,
          insertedText: newText,
        };
      }
    }
  }

  return null;
}

function transformMethodChainOrdering(root: SgRoot<TS>): Edit[] {
  const edits: Edit[] = [];
  const rootNode = root.root();

  const methodChainDecls = rootNode.findAll({
    rule: {
      kind: "call_expression",
      pattern: "$CHAIN",
      has: {
        kind: "member_expression",
        pattern: "$BASE.$METHOD",
      },
    },
  });

  const processedChains = new Set<number>();

  for (const chainDecl of methodChainDecls) {
    const chainText = chainDecl.text();

    if (processedChains.has(chainDecl.range().start.index)) continue;
    if (!chainText.match(/\.(optional|nullable|default|catch|min|max)\s*\(/)) continue;

    const fullChain = findFullMethodChain(chainDecl);
    if (processedChains.has(fullChain.range().start.index)) continue;

    processedChains.add(fullChain.range().start.index);

    const edit = transformSingleMethodChain(fullChain);
    if (edit) {
      edits.push(edit);
    }
  }

  return edits;
}

function findFullMethodChain(chainDecl: any): any {
  let currentNode = chainDecl;
  let rootChain = chainDecl;

  while (currentNode.parent()) {
    const parent = currentNode.parent();
    if (parent && parent.kind() === "member_expression") {
      const grandparent = parent.parent();
      if (grandparent && grandparent.kind() === "call_expression") {
        rootChain = grandparent;
        currentNode = grandparent;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  let fullChain = rootChain;
  let searchNode = rootChain;

  while (true) {
    const memberExpression = searchNode.find({
      rule: {
        kind: "member_expression",
        pattern: "$OBJ.$PROP",
      },
    });

    if (memberExpression) {
      const obj = memberExpression.getMatch("OBJ");
      if (obj && obj.kind() === "call_expression") {
        const objText = obj.text();
        if (objText.match(/\.(optional|nullable|default|catch|min|max)\s*\(/)) {
          fullChain = searchNode;
        }
        searchNode = obj;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return fullChain;
}

function transformSingleMethodChain(fullChain: any): Edit | null {
  const fullChainText = fullChain.text();
  const parseResult = parseMethodChain(fullChainText);

  if (!parseResult) return null;

  const { base, methodCalls } = parseResult;
  const transformResult = transformMethodChain(methodCalls);

  if (!transformResult.needsTransform) return null;

  let newChain = base;
  for (const call of transformResult.methods) {
    newChain += `.${call.method}(${call.args})`;
  }

  return {
    startPos: fullChain.range().start.index,
    endPos: fullChain.range().end.index,
    insertedText: newChain,
  };
}

function parseMethodChain(chainText: string): ParsedMethodChain | null {
  const methods: MethodCall[] = [];
  let currentText = chainText;

  const baseMatch = currentText.match(/^(z\.\w+\([^)]*\))/);
  if (!baseMatch) return null;

  const base = baseMatch[1];
  currentText = currentText.substring(base.length);

  while (currentText.length > 0) {
    const methodMatch = currentText.match(/^\.(\w+)\s*\(([^)]*)\)/);
    if (!methodMatch) break;

    methods.push({
      method: methodMatch[1],
      args: methodMatch[2],
    });

    currentText = currentText.substring(methodMatch[0].length);
  }

  return { base, methodCalls: methods };
}

function transformMethodChain(methodCalls: MethodCall[]): TransformResult {
  const result: TransformResult = {
    needsTransform: false,
    methods: [],
  };

  const hasDefault = methodCalls.some((m) => m.method === "default");
  const hasCatch = methodCalls.some((m) => m.method === "catch");
  const hasOptional = methodCalls.some((m) => m.method === "optional");
  const hasNullable = methodCalls.some((m) => m.method === "nullable");

  const needsOptional = (hasDefault || hasCatch) && !hasOptional;
  const hasOrderingIssue = checkOrderingIssues(methodCalls, hasOptional, hasNullable, hasDefault, hasCatch);

  if (needsOptional || hasOrderingIssue) {
    result.needsTransform = true;
    result.methods = reorderMethodCalls(methodCalls, needsOptional);
  } else {
    result.methods = methodCalls;
  }

  return result;
}

function checkOrderingIssues(
  methodCalls: MethodCall[],
  hasOptional: boolean,
  hasNullable: boolean,
  hasDefault: boolean,
  hasCatch: boolean
): boolean {
  let defaultIndex = -1;
  let catchIndex = -1;
  let optionalIndex = -1;
  let nullableIndex = -1;

  methodCalls.forEach((m, i) => {
    if (m.method === "default") defaultIndex = i;
    if (m.method === "catch") catchIndex = i;
    if (m.method === "optional") optionalIndex = i;
    if (m.method === "nullable") nullableIndex = i;
  });

  return (
    (hasOptional && hasNullable && optionalIndex < nullableIndex) ||
    (hasOptional && hasDefault && optionalIndex > defaultIndex) ||
    (hasOptional && hasCatch && optionalIndex > catchIndex) ||
    (hasNullable && hasDefault && nullableIndex > defaultIndex) ||
    (hasNullable && hasCatch && nullableIndex > catchIndex)
  );
}

function reorderMethodCalls(methodCalls: MethodCall[], needsOptional: boolean): MethodCall[] {
  const orderSensitive = {
    nullable: [] as MethodCall[],
    optional: [] as MethodCall[],
    default: [] as MethodCall[],
    catch: [] as MethodCall[],
  };
  const other: MethodCall[] = [];

  for (const call of methodCalls) {
    if (call.method in orderSensitive) {
      orderSensitive[call.method as keyof typeof orderSensitive].push(call);
    } else {
      other.push(call);
    }
  }

  if (needsOptional) {
    orderSensitive.optional.push({ method: "optional", args: "" });
  }

  return [
    ...other,
    ...orderSensitive.nullable,
    ...orderSensitive.optional,
    ...orderSensitive.default,
    ...orderSensitive.catch,
  ];
}

export default transform;