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
    const params = paramsText.substring(1, paramsText.length - 1);
    const paramsArray = params.split(",") as string[];
    let reqName = paramsArray[0];
    reqName = reqName?.replace(/[{}]/g, "") ?? "";
    reqName = reqName.trim();
    // fix url
    if (!reqName) return;
    const reqUrl = rootNode.findAll({
      rule: {
        kind: "member_expression",
        pattern: `${reqName}.url`,
      },
    });
    reqUrl.forEach((url) => {
      const newUrl = `new URL(${reqName}.url)`;
      edits.push(url.replace(newUrl));
    });
    // fix params
    const paramsFind = rootNode.findAll({
      rule: {
        kind: "member_expression",
        pattern: `${reqName}.params`,
      },
    });
    paramsFind.forEach((param) => {
      const newParam = `params`;
      edits.push(param.replace(newParam));
    });
    let asyncParam = false;
    // fix body
    const bodiesFind = rootNode.findAll({
      rule: {
        kind: "member_expression",
        pattern: `${reqName}.body`,
      },
    });
    bodiesFind.forEach((param) => {
      asyncParam = true;
      edits.push(param.replace("await request.clone().json()"));
    });
    // fix cookies
    const cookiesFind = rootNode.findAll({
      rule: {
        kind: "member_expression",
        pattern: `${reqName}.cookies`,
      },
    });
    cookiesFind.forEach((cookie) => {
      const newCookie = `cookies`;
      edits.push(cookie.replace(newCookie));
    });
    const reqObject = rootNode.findAll({
      rule: {
        kind: "lexical_declaration",
        pattern: "$TYPE",
        has: {
          kind: "variable_declarator",
          pattern: `$VARS=`,
          has: {
            kind: "identifier",
            pattern: `${reqName}`,
          },
        },
      },
    });
    reqObject.forEach((req) => {
      const vars = req.getMatch("VARS")?.text() ?? "";
      if (vars[0] != "{" || vars[vars.length - 1] != "}") return;
      const reqType = req.getMatch("TYPE")?.text() ?? "";
      const reqTypeArray = reqType.split(" ") as string[];
      const reqTypeFirst = reqTypeArray[0];
      const finalVars: string[] = [];
      const varsArray = vars
        .substring(1, vars.length - 1)
        .split(",") as string[];
      let extra = "";
      varsArray.forEach((variable) => {
        const newVariable = variable.replaceAll(" ", "");
        const variableArray = newVariable.split(":");
        if (!["cookies", "params", "body"].includes(variableArray[0] ?? "")) {
          if (variableArray[0] == "body") {
            asyncParam = true;
            extra = `${reqTypeFirst} body = await ${reqName}.clone().json();`;
          }
          finalVars.push(
            `${variableArray[0]}${
              variableArray.length > 1 ? `: ${variableArray[1]}` : ""
            }`,
          );
        }
        if (variableArray[0] == "body") {
          asyncParam = true;
          extra = `${reqTypeFirst} body = await ${reqName}.clone().json();`;
        }
      });
      if (finalVars.length) {
        edits.push(
          req.replace(
            `${extra}\n ${reqTypeFirst} {${finalVars.join(",")}} = ${reqName};`,
          ),
        );
      } else {
        edits.push(req.replace(""));
      }
      if (asyncParam) {
        edits.push(prms?.replace(`async ${paramsText}`) ?? "");
      }
    });
  });

  let newSource = rootNode.text();
  if (edits.length) {
    newSource = rootNode.commitEdits(edits);
  }

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
