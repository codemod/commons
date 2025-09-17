import type TSX from "codemod:ast-grep/langs/tsx";
import type { SgNode } from "@codemod.com/jssg-types/main";
import getImportAlias from "./get-import-alias.ts";

const isMSWCall = (
  text: any,
  moduleName: string,
  importName: string,
  root: SgNode<TSX, "program">,
): boolean => {
  const httpAlias = getImportAlias(moduleName, importName, root) || importName;
  const graphqlAlias =
    getImportAlias(moduleName, importName, root) || "graphql";

  const httpMethods = [
    "all",
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "head",
    "options",
  ];
  const graphqlMethods = ["query", "mutation"];

  return (
    httpMethods.some((method) => text.includes(`${httpAlias}.${method}`)) ||
    graphqlMethods.some((method) => text.includes(`${graphqlAlias}.${method}`))
  );
};

export default isMSWCall;
