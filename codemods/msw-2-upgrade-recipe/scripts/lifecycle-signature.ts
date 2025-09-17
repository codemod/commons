import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import type { SgNode } from "@codemod.com/jssg-types/main";

const lifecycle_events = (root: SgNode<TSX, "program">): any[] => {
  const edits: any[] = [];

  const events = root.findAll({
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
                pattern: "$SERVER.events.on",
              },
              inside: {
                kind: "expression_statement",
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
                pattern: "$SERVER.events.on",
              },
              inside: {
                kind: "expression_statement",
              },
            },
          },
        },
      ],
    },
  });

  events.forEach((event) => {
    const typeMatch = event.getMatch("PARAMS");
    const block = event.getMatch("BLOCK");
    if (!typeMatch) return;
    const typeText = typeMatch.text();
    const blockText = block?.text() ?? "";
    const params = typeText
      .substring(1, typeText.length - 1)
      .split(",") as string[];
    const final: string[] = [];
    params.forEach((param) => {
      final.push(param == "req" ? "request" : param);
    });
    let eventNew = event
      .text()
      .replace(blockText, `{\n  let req = request; ${blockText.substring(1)}`);
    eventNew = eventNew.replace(typeText, `({${final.join(",")}})`);
    edits.push(event.replace(eventNew));
  });

  return edits;
};

async function transform(root: SgRoot<TSX>): Promise<string> {
  const rootNode = root.root();

  let edits: any[] = [];

  edits = edits.concat(lifecycle_events(rootNode));

  const newSource = rootNode.commitEdits(edits);
  return newSource;
}

export default transform;
