import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import isMSWCall from "../utils/is-msw-calls.ts";

async function transform(root: SgRoot<TSX>): Promise<string> {
  const rootNode = root.root();
  const edits: any[] = [];

  // 1. Transform MockedRequest<T> -> T
  const mockedRequests = rootNode.findAll({
    rule: {
      kind: "generic_type",
      pattern: "$BODY_TYPE",
      has: {
        kind: "type_identifier",
        pattern: "$NAME",
      },
    },
  });

  mockedRequests.forEach((mock) => {
    const name = mock.getMatch("NAME")?.text();
    if (name != "MockedRequest") return;
    const bodyType = mock.getMatch("BODY_TYPE");
    if (bodyType) {
      edits.push(mock.replace(bodyType.text()));
    }
  });

  // 2. Transform ResponseResolver types
  const responseResolvers = rootNode.findAll({
    rule: {
      kind: "generic_type",
      has: {
        kind: "type_identifier",
        pattern: "$NAME",
      },
    },
  });

  responseResolvers.forEach((resolver) => {
    const name = resolver.getMatch("NAME")?.text();
    if (name != "ResponseResolver") return;
    const typeArgs = resolver.find({
      rule: {
        kind: "type_arguments",
      },
    });

    if (typeArgs) {
      // Find all direct children of type_arguments
      const children = typeArgs.children();
      const argNodes = [];

      // Extract actual type arguments (skip commas)
      for (const child of children) {
        if (
          child.kind() !== "," &&
          child.kind() !== "<" &&
          child.kind() !== ">"
        ) {
          argNodes.push(child);
        }
      }

      if (argNodes.length >= 1) {
        const firstArg = argNodes[0];
        const thirdArg = argNodes.length > 2 ? argNodes[2] : null;

        // Check if first argument is MockedRequest
        const isMockedRequest = firstArg?.find({
          rule: {
            kind: "type_identifier",
            pattern: "$NAME",
            inside: {
              kind: "generic_type",
              pattern: "$BODY_TYPE",
            },
          },
        });

        let bodyType = "";

        if (isMockedRequest) {
          const mockName = isMockedRequest.getMatch("NAME")?.text();
          if (mockName != "MockedRequest") return;
          const body = isMockedRequest
            ?.getMatch("BODY_TYPE")
            ?.text()
            ?.replace("MockedRequest", "");
          bodyType = body?.substring(1, body.length - 1) ?? "";
        } else {
          bodyType = firstArg?.text() ?? "";
        }

        if (bodyType === "RestRequest") {
          bodyType = "DefaultBodyType";
        }

        let newArgs = "HttpRequestResolverExtras<PathParams>";
        newArgs += `, ${bodyType}`;

        if (thirdArg) {
          newArgs += `, ${thirdArg?.text() ?? ""}`;
        }

        edits.push(typeArgs.replace(`<${newArgs}>`));
      }
    }
  });

  // 3a. Transform RestHandler<T> -> HttpHandler
  const restHandlers = rootNode.findAll({
    rule: {
      kind: "generic_type",
      pattern: "$BODY",
      has: {
        kind: "type_identifier",
        pattern: "$NAME",
      },
    },
  });

  restHandlers.forEach((handler) => {
    const name = handler.getMatch("NAME")?.text();
    if (name != "RestHandler") return;
    let body = handler.getMatch("BODY")?.text() ?? "";
    body = body.trim().replace(name ?? "", "");
    const argsMatch = body.substring(1, body.length - 1);
    if (argsMatch) {
      const bodyType = argsMatch;

      // Find MSW calls in the same scope and add type arguments
      const parent = handler.parent()?.parent()?.parent();
      if (parent) {
        const mswCalls = parent
          .findAll({
            rule: {
              kind: "call_expression",
              has: {
                kind: "member_expression",
                pattern: "$OBJ.$METHOD",
              },
            },
          })
          .filter((call) => isMSWCall(call.text(), "msw", "http", rootNode));

        mswCalls.forEach((call) => {
          const memberExpr = call.find({
            rule: {
              kind: "member_expression",
            },
          });

          if (memberExpr) {
            const typeArgsString = `<any, ${bodyType}>`;
            edits.push(
              memberExpr.replace(`${memberExpr.text()}${typeArgsString}`),
            );
          }
        });
      }

      // Replace RestHandler<...> with HttpHandler
      edits.push(handler.replace("HttpHandler"));
    }
  });

  // 3b. Transform existing MSW calls with type arguments (swap order)
  const mswCallsWithTypes = rootNode
    .findAll({
      rule: {
        kind: "call_expression",
        has: {
          kind: "member_expression",
          pattern: "$OBJ.$METHOD",
        },
      },
    })
    .filter((call) => {
      const hasTypeArgs = call.find({
        rule: {
          kind: "type_arguments",
        },
      });
      return hasTypeArgs && isMSWCall(call.text(), "msw", "http", rootNode);
    });

  mswCallsWithTypes.forEach((call) => {
    const typeArgs = call.find({
      rule: {
        kind: "type_arguments",
      },
    });

    if (typeArgs) {
      const children = typeArgs.children();
      const argNodes = [];

      // Extract actual type arguments (skip commas and brackets)
      for (const child of children) {
        if (
          child.kind() !== "," &&
          child.kind() !== "<" &&
          child.kind() !== ">"
        ) {
          argNodes.push(child);
        }
      }

      if (argNodes.length === 1) {
        // http.get<ReqBodyType> -> http.get<any, ReqBodyType>
        const bodyType = argNodes[0]?.text() ?? "";
        edits.push(typeArgs.replace(`<any, ${bodyType}>`));
      } else if (argNodes.length === 2) {
        // http.get<ReqBodyType, PathParamsType> -> http.get<PathParamsType, ReqBodyType>
        const bodyType = argNodes[0]?.text() ?? "";
        const paramsType = argNodes[1]?.text() ?? "";
        edits.push(typeArgs.replace(`<${paramsType}, ${bodyType}>`));
      }
    }
  });

  // 4. Handle body casts in MSW callbacks
  const mswCalls = rootNode
    .findAll({
      rule: {
        kind: "call_expression",
        has: {
          kind: "member_expression",
          pattern: "$OBJ.$METHOD",
        },
      },
    })
    .filter((call) => isMSWCall(call.text(), "msw", "http", rootNode));

  mswCalls.forEach((call) => {
    const bodyCasts = call.findAll({
      rule: {
        kind: "as_expression",
        pattern: "$EXPR as $TYPE",
        has: {
          kind: "member_expression",
          pattern: "$OBJ.body",
        },
      },
    });

    bodyCasts.forEach((cast) => {
      const exprMatch = cast.getMatch("EXPR") ?? "";
      const typeMatch = cast.getMatch("TYPE") ?? "";

      if (exprMatch && typeMatch) {
        const castedProperty = exprMatch?.text() ?? "";
        const castedType = typeMatch?.text() ?? "";

        edits.push(cast.replace(castedProperty));

        // Update call expression type arguments
        const memberExpr = call.find({
          rule: {
            kind: "member_expression",
          },
        });

        if (memberExpr) {
          const existingTypeArgs = call.find({
            rule: {
              kind: "type_arguments",
            },
          });

          if (existingTypeArgs) {
            // Replace existing type arguments
            const currentArgs = existingTypeArgs?.text() ?? "";
            const args = currentArgs
              .slice(1, -1)
              .split(",")
              .map((arg) => arg.trim());

            if (args.length >= 2) {
              args[1] = castedType;
            } else {
              args.push(castedType);
            }

            edits.push(existingTypeArgs.replace(`<${args.join(", ")}>`));
          } else {
            // Add new type arguments
            edits.push(
              memberExpr.replace(`${memberExpr.text()}<any, ${castedType}>`),
            );
          }
        }
      }
    });
  });

  // Apply all edits
  if (edits.length > 0) {
    const newSource = rootNode.commitEdits(edits);
    return newSource;
  }

  return rootNode.text();
}

export default transform;
