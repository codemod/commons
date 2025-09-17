import type TSX from "codemod:ast-grep/langs/tsx";
import type { SgNode } from "@codemod.com/jssg-types/main";

const getImportAlias = (
  moduleName: string,
  importName: string,
  root: SgNode<TSX, "program">,
): string | null => {
  const importStmt = root.find({
    rule: {
      kind: "import_statement",
      has: {
        kind: "string",
        pattern: `"${moduleName}"`,
      },
    },
  });

  if (!importStmt) return null;

  const namedImport = importStmt.find({
    rule: {
      kind: "import_specifier",
      has: {
        kind: "identifier",
        pattern: importName,
      },
    },
  });

  const namedImportText = namedImport ? namedImport.text() : importName;
  const namedImportArray = namedImportText?.split(" ") as string[];
  const namedImportLast = namedImportArray?.[namedImportArray.length - 1] ?? "";

  return namedImportLast;
};

export default getImportAlias;
