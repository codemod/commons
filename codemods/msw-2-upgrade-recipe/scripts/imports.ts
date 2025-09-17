import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import getImportAlias from "../utils/get-import-alias.ts";

interface ImportSpecifier {
  imported: string;
  alias?: string;
}

function parseImportSpecifiers(importsText: string): ImportSpecifier[] {
  const specifiers: ImportSpecifier[] = [];

  // Remove any braces if present and trim
  const cleanText = importsText.replace(/[{}]/g, "").trim();

  // Split by comma and trim whitespace
  const parts = cleanText
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p);

  for (const part of parts) {
    if (part.includes(" as ")) {
      // Handle "rest as caller" case
      const [imported, alias] = part.split(" as ").map((s) => s.trim());
      specifiers.push({ imported: imported ?? "", alias: alias ?? "" });
    } else {
      // Handle simple "RestHandler" case
      specifiers.push({ imported: part ?? "" });
    }
  }

  return specifiers;
}

async function transform(root: SgRoot<TSX>): Promise<string> {
  const rootNode = root.root();

  const httpExists = rootNode.findAll({
    rule: {
      any: [
        {
          kind: "import_statement",
          has: {
            kind: "import_clause",
            has: {
              kind: "named_imports",
              has: {
                kind: "import_specifier",
                has: {
                  kind: "identifier",
                  pattern: "http",
                },
              },
            },
          },
        },
        {
          kind: "import_statement",
          has: {
            kind: "import_clause",
            has: {
              kind: "identifier",
              pattern: "http",
            },
          },
        },
      ],
    },
  });

  const edits: any[] = [];

  const mswImports = rootNode.findAll({
    rule: {
      any: [
        {
          kind: "import_statement",
          has: {
            pattern: `'msw'`,
          },
        },
        {
          kind: "import_statement",
          has: {
            pattern: `"msw"`,
          },
        },
      ],
    },
  });
  if (mswImports.length) {
    const httpModule = httpExists.length ? "httpMsw" : "http";
    const alias = getImportAlias("msw", "rest", rootNode);

    mswImports.forEach((imp) => {
      const namedImports = imp.find({
        rule: {
          kind: "import_clause",
          has: {
            kind: "named_imports",
            pattern: "$IMPORTS",
          },
        },
      });

      if (namedImports) {
        const importsMatch = namedImports.getMatch("IMPORTS");
        if (!importsMatch) return;
        const importsText = importsMatch.text();
        const importSpecifiers = parseImportSpecifiers(importsText);
        const mswSpecifiers = [];
        const browserSpecifiers = [];

        for (const spec of importSpecifiers) {
          if (spec.imported === "setupWorker") {
            browserSpecifiers.push(spec);
          } else {
            // Transform rest -> http and RestHandler -> HttpHandler
            if (spec.imported === "rest") {
              mswSpecifiers.push({
                ...spec,
                imported: "http",
                alias:
                  alias != "rest" && httpModule != "httpMsw"
                    ? alias
                    : httpModule,
              });
            } else if (spec.imported === "RestHandler") {
              mswSpecifiers.push({ ...spec, imported: "HttpHandler" });
              const type_identifier = rootNode.findAll({
                rule: {
                  kind: "type_identifier",
                },
              });
              for (const identifier of type_identifier) {
                if (identifier.text() == "RestHandler") {
                  edits.push(identifier.replace("HttpHandler"));
                }
              }
            } else {
              mswSpecifiers.push(spec);
            }
          }
        }

        let newImports = "";

        if (mswSpecifiers.length > 0) {
          const mswImportsStr = mswSpecifiers
            .map((spec) =>
              spec.alias && spec.alias !== spec.imported
                ? `${spec.imported} as ${spec.alias}`
                : spec.imported,
            )
            .join(", ");
          newImports += `import { ${mswImportsStr} } from "msw";`;
        }

        if (browserSpecifiers.length > 0) {
          const browserImportsStr = browserSpecifiers
            .map((spec) =>
              spec.alias && spec.alias !== spec.imported
                ? `${spec.imported} as ${spec.alias}`
                : spec.imported,
            )
            .join(", ");
          if (newImports) newImports += "\n";
          newImports += `import { ${browserImportsStr} } from "msw/browser";`;
        }

        if (newImports) {
          edits.push(imp.replace(newImports));
        }
      }
    });

    const aliasText = alias ? alias : "rest";

    const memberExpressions = rootNode.findAll({
      rule: {
        kind: "member_expression",
        pattern: `${aliasText}.$METHOD`,
      },
    });

    memberExpressions.forEach((expression) => {
      const edited = expression
        .text()
        .replace(
          `${aliasText}.`,
          `${
            aliasText == "rest" || aliasText == "httpMsw"
              ? httpModule
              : aliasText
          }.`,
        );
      edits.push(expression.replace(edited));
    });
  }

  const newSource = rootNode.commitEdits(edits);
  return newSource;
}

export default transform;
