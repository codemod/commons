import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import type { RuleConfig } from "@codemod.com/jssg-types/main";
import isMSWCall from "../utils/is-msw-calls.ts";

async function transform(root: SgRoot<TSX>): Promise<string> {
  const rootNode = root.root();

  const edits: any[] = [];

  // Helper function to check if call expression is MSW call

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

  arrowFunctions.forEach((arrowFun) => {
    if (
      !isMSWCall(
        arrowFun.getMatch("MEMBER")?.text() ?? "",
        "msw",
        "http",
        rootNode,
      ) &&
      !isMSWCall(
        arrowFun.getMatch("MEMBER")?.text() ?? "",
        "msw",
        "graphql",
        rootNode,
      )
    )
      return;
    const prms = arrowFun.getMatch("PARAMS");
    const paramsText = prms?.text() ?? "";
    let params = paramsText;
    if (params.includes("(") && params.includes(")")) {
      params = paramsText.substring(1, paramsText.length - 1);
    }
    const paramsArray = params.split(",") as string[];
    let reqName = paramsArray[0];
    reqName = reqName?.replace(/[{}]/g, "") ?? "";
    reqName = reqName.trim();
    const block = arrowFun.getMatch("BLOCK");
    const blockText = block?.text() ?? "";
    const newParams = [];
    if (reqName) {
      const haveReq =
        block?.findAll({
          rule: {
            kind: "identifier",
            pattern: reqName,
          },
        }) ?? [];
      if (haveReq.length) {
        newParams.push("request");
      }
    }
    const haveCookie =
      block?.findAll({
        rule: {
          kind: "identifier",
          pattern: "cookies",
        },
      }) ?? [];
    if (haveCookie.length) {
      newParams.push("cookies");
    }
    let newArrow = arrowFun.text();
    newArrow = newArrow.replace(
      paramsText,
      `(${newParams.length ? `{${newParams.join(", ")}}` : ""})`,
    );
    newArrow = newArrow.replace(
      blockText,
      `{${newParams.includes("request") ? `\n let ${reqName} = request;` : ""}${
        blockText[0] == "{" && blockText[blockText.length - 1]
          ? blockText.substring(1, blockText.length - 1)
          : blockText
      }}`,
    );
    edits.push(arrowFun.replace(newArrow));
  });

  const newSource = rootNode.commitEdits(edits);
  return newSource;
}

export function getSelector(): RuleConfig<TSX> {
  return {
    rule: {
      any: [
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
      ],
    },
  };
}

export default transform;
