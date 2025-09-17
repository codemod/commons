import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import type { RuleConfig } from "@codemod.com/jssg-types/main";
import isMSWCall from "../utils/is-msw-calls.ts";

async function transform(root: SgRoot<TSX>): Promise<string> {
  const rootNode = root.root();

  const edits: any[] = [];

  const arrowFunctions = rootNode.findAll({
    rule: {
      any: [
        {
          kind: "arrow_function",
          pattern: "async $PARAMS => $BLOCK",
          inside: {
            kind: "arguments",
            inside: {
              kind: "call_expression",
              has: {
                kind: "member_expression",
                pattern: "$MEMBER",
              },
            },
          },
        },
        {
          kind: "arrow_function",
          pattern: "$PARAMS => $BLOCK",
          inside: {
            kind: "arguments",
            inside: {
              kind: "call_expression",
              has: {
                kind: "member_expression",
                pattern: "$MEMBER",
              },
            },
          },
        },
      ],
    },
  });

  let newImports = "";

  for (const arr of arrowFunctions) {
    if (
      !isMSWCall(
        arr.getMatch("MEMBER")?.text() ?? "",
        "msw",
        "http",
        rootNode,
      ) &&
      !isMSWCall(
        arr.getMatch("MEMBER")?.text() ?? "",
        "msw",
        "graphql",
        rootNode,
      )
    ) {
      continue;
    }
    const prms = arr.getMatch("PARAMS");
    const paramsText = prms?.text() ?? "";
    const params = paramsText.substring(1, paramsText.length - 1).split(",");
    const ctxParam = params[2];
    if (ctxParam) {
      const fetchs = arr.findAll({
        rule: {
          kind: "call_expression",
          pattern: `${ctxParam}.fetch($PARAM)`,
        },
      });
      if (fetchs.length) {
        const hasMswImport = rootNode.find({
          rule: {
            any: [
              {
                kind: "import_statement",
                pattern: 'import $IMPORTS from "msw"',
              },
              {
                kind: "import_statement",
                pattern: "import $IMPORTS from 'msw'",
              },
            ],
          },
        });

        if (hasMswImport) {
          const importMatch = hasMswImport.getMatch("IMPORTS");
          let importText = importMatch?.text() ?? "";
          if (
            importText[0] == "{" &&
            importText[importText.length - 1] == "}"
          ) {
            importText = `${importText.substring(
              0,
              importText.length - 1,
            )},·bypass}`;
          } else {
            importText += "{bypass}";
          }
          edits.push(hasMswImport.replace(`import ${importText} from "msw"`));
        } else {
          newImports = `import { bypass } from "msw"; \n`;
        }

        for (const f of fetchs) {
          const param = f.getMatch("PARAM")?.text() ?? "";
          const newFetch = `fetch(bypass(${param}))`;
          edits.push(f.replace(newFetch));
        }
      }
    }
  }

  let newSource = rootNode.text();
  if (edits.length) {
    newSource = rootNode.commitEdits(edits);
    newSource = `${newImports}${newSource}`;
  }

  return newSource;
}

export function getSelector(): RuleConfig<TSX> {
  return {
    rule: {
      any: [
        {
          kind: "arrow_function",
          pattern: "async $PARAMS => $BLOCK",
          inside: {
            kind: "arguments",
            inside: {
              kind: "call_expression",
              has: {
                kind: "member_expression",
                pattern: "$MEMBER",
              },
            },
          },
        },
        {
          kind: "arrow_function",
          pattern: "$PARAMS => $BLOCK",
          inside: {
            kind: "arguments",
            inside: {
              kind: "call_expression",
              has: {
                kind: "member_expression",
                pattern: "$MEMBER",
              },
            },
          },
        },
      ],
    },
  };
}

export default transform;
