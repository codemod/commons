import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import type { SgNode } from "@codemod.com/jssg-types/main";

const print_handler = (root: SgNode<TSX, "program">): any[] => {
  const edits: any[] = [];

  const printHandlers = root.findAll({
    rule: {
      kind: "expression_statement",
      has: {
        kind: "call_expression",
        has: {
          kind: "member_expression",
          pattern: "$WORKER.printHandlers",
        },
      },
    },
  });

  printHandlers.forEach((print) => {
    const printText = (print?.text() ?? "").replace(
      "printHandlers()",
      `forEach((handler) => {
        console.log(handler.info.header);
      })`,
    );
    edits.push(print.replace(printText));
  });

  return edits;
};

async function transform(root: SgRoot<TSX>): Promise<string> {
  const rootNode = root.root();

  let edits: any[] = [];

  edits = edits.concat(print_handler(rootNode));

  const newSource = rootNode.commitEdits(edits);
  return newSource;
}

export default transform;
