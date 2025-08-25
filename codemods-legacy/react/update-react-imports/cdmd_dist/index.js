/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @format
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = transform;
function transform(file, api, options) {
  var _a;
  var j = api.jscodeshift;
  var printOptions =
    (options === null || options === void 0 ? void 0 : options.printOptions) ||
    {};
  var root = j(file.source);
  var destructureNamespaceImports =
    options === null || options === void 0
      ? void 0
      : options.destructureNamespaceImports;
  // https://github.com/facebook/jscodeshift/blob/master/recipes/retain-first-comment.md
  function getFirstNode() {
    return root.find(j.Program).get("body", 0).node;
  }
  // Save the comments attached to the first node
  var firstNode = getFirstNode();
  var comments = firstNode.comments;
  function isVariableDeclared(variable) {
    return (
      root
        .find(j.Identifier, {
          name: variable,
        })
        .filter(function (path) {
          return (
            path.parent.value.type !== "MemberExpression" &&
            path.parent.value.type !== "QualifiedTypeIdentifier" &&
            path.parent.value.type !== "JSXMemberExpression" &&
            path.parent.value.type !== "TSQualifiedName"
          );
        })
        .size() > 0
    );
  }
  // Get all paths that import from React
  var reactImportPaths = root
    .find(j.ImportDeclaration, {
      type: "ImportDeclaration",
    })
    .filter(function (path) {
      return (
        (path.value.source.type === "Literal" ||
          path.value.source.type === "StringLiteral") &&
        (path.value.source.value === "React" ||
          path.value.source.value === "react")
      );
    });
  // get all namespace/default React imports
  var reactPaths = reactImportPaths.filter(function (path) {
    return (
      path.value.specifiers.length > 0 &&
      path.value.importKind === "value" &&
      path.value.specifiers.some(function (specifier) {
        var _a;
        return (
          ((_a = specifier.local) === null || _a === void 0
            ? void 0
            : _a.name) === "React"
        );
      })
    );
  });
  if (reactPaths.size() > 1) {
    throw Error(
      "There should only be one React import. Please remove the duplicate import and try again.",
    );
  }
  if (reactPaths.size() === 0) {
    return null;
  }
  var reactPath = reactPaths.paths()[0];
  // Reuse the node so that we can preserve quoting style.
  var reactLiteral =
    reactPath === null || reactPath === void 0
      ? void 0
      : reactPath.value.source;
  var isDefaultOrNamespaceImport =
    (_a =
      reactPath === null || reactPath === void 0
        ? void 0
        : reactPath.value.specifiers) === null || _a === void 0
      ? void 0
      : _a.some(function (specifier) {
          var _a;
          return (
            (specifier.type === "ImportDefaultSpecifier" ||
              specifier.type === "ImportNamespaceSpecifier") &&
            ((_a = specifier.local) === null || _a === void 0
              ? void 0
              : _a.name) === "React"
          );
        });
  // Check to see if we should keep the React import
  var isReactImportUsed =
    root
      .find(j.Identifier, {
        name: "React",
      })
      .filter(function (path) {
        return path.parent.parent.value.type !== "ImportDeclaration";
      })
      .size() > 0;
  // local: imported
  var reactIdentifiers = {};
  var reactTypeIdentifiers = {};
  var canDestructureReactVariable = false;
  if (
    isReactImportUsed &&
    (isDefaultOrNamespaceImport || destructureNamespaceImports)
  ) {
    // Checks to see if the react variable is used itself (rather than used to access its properties)
    canDestructureReactVariable =
      root
        .find(j.Identifier, {
          name: "React",
        })
        .filter(function (path) {
          return path.parent.parent.value.type !== "ImportDeclaration";
        })
        .filter(function (path) {
          return (
            !(
              path.parent.value.type === "MemberExpression" &&
              path.parent.value.object.name === "React"
            ) &&
            !(
              path.parent.value.type === "QualifiedTypeIdentifier" &&
              path.parent.value.qualification.name === "React"
            ) &&
            !(
              path.parent.value.type === "JSXMemberExpression" &&
              path.parent.value.object.name === "React"
            ) &&
            !(
              path.parent.value.type === "TSQualifiedName" &&
              path.parent.value.left.name === "React"
            )
          );
        })
        .size() === 0;
    if (canDestructureReactVariable) {
      // Add React identifiers to separate object so we can destructure the imports
      // later if we can. If a type variable that we are trying to import has already
      // been declared, do not try to destructure imports
      // (ex. Element is declared and we are using React.Element)
      root
        .find(j.QualifiedTypeIdentifier, {
          qualification: {
            type: "Identifier",
            name: "React",
          },
        })
        .forEach(function (path) {
          var id = path.value.id.name;
          if (path.parent.parent.value.type === "TypeofTypeAnnotation") {
            // This is a typeof import so it isn't actually a type
            reactIdentifiers[id] = id;
            if (reactTypeIdentifiers[id]) {
              canDestructureReactVariable = false;
            }
          } else {
            reactTypeIdentifiers[id] = id;
            if (reactIdentifiers[id]) {
              canDestructureReactVariable = false;
            }
          }
          if (isVariableDeclared(id)) {
            canDestructureReactVariable = false;
          }
        });
      // Support TypeScript qualified names (React.MouseEvent etc)
      root
        .find(j.TSQualifiedName, {
          left: {
            type: "Identifier",
            name: "React",
          },
        })
        .forEach(function (path) {
          var right =
            "name" in path.value.right
              ? path.value.right.name
              : path.value.right.name;
          reactTypeIdentifiers[right] = right;
          if (reactIdentifiers[right] || isVariableDeclared(right)) {
            canDestructureReactVariable = false;
          }
        });
      // Add React identifiers to separate object so we can destructure the imports
      // later if we can. If a variable that we are trying to import has already
      // been declared, do not try to destructure imports
      // (ex. createElement is declared and we are using React.createElement)
      root
        .find(j.MemberExpression, {
          object: {
            type: "Identifier",
            name: "React",
          },
        })
        .forEach(function (path) {
          var property = path.value.property.name;
          reactIdentifiers[property] = property;
          if (isVariableDeclared(property) || reactTypeIdentifiers[property]) {
            canDestructureReactVariable = false;
          }
        });
      // Add React identifiers to separate object so we can destructure the imports
      // later if we can. If a JSX variable that we are trying to import has already
      // been declared, do not try to destructure imports
      // (ex. Fragment is declared and we are using React.Fragment)
      root
        .find(j.JSXMemberExpression, {
          object: {
            type: "JSXIdentifier",
            name: "React",
          },
        })
        .forEach(function (path) {
          var property = path.value.property.name;
          reactIdentifiers[property] = property;
          if (isVariableDeclared(property) || reactTypeIdentifiers[property]) {
            canDestructureReactVariable = false;
          }
        });
    }
  }
  if (canDestructureReactVariable) {
    // replace react identifiers
    root
      .find(j.QualifiedTypeIdentifier, {
        qualification: {
          type: "Identifier",
          name: "React",
        },
      })
      .forEach(function (path) {
        var id = path.value.id.name;
        j(path).replaceWith(j.identifier(id));
      });
    // Replace TypeScript qualified names
    root
      .find(j.TSQualifiedName, {
        left: {
          type: "Identifier",
          name: "React",
        },
      })
      .forEach(function (path) {
        var right =
          "name" in path.value.right
            ? path.value.right.name
            : path.value.right.name;
        j(path).replaceWith(j.identifier(right));
      });
    root
      .find(j.MemberExpression, {
        object: {
          type: "Identifier",
          name: "React",
        },
      })
      .forEach(function (path) {
        var property = path.value.property.name;
        j(path).replaceWith(j.identifier(property));
      });
    root
      .find(j.JSXMemberExpression, {
        object: {
          type: "JSXIdentifier",
          name: "React",
        },
      })
      .forEach(function (path) {
        var property = path.value.property.name;
        j(path).replaceWith(j.jsxIdentifier(property));
      });
    // Add exisiting React imports to map
    reactImportPaths.forEach(function (path) {
      var specifiers = path.value.specifiers;
      if (!specifiers) return;
      for (var i = 0; i < specifiers.length; i++) {
        var specifier = specifiers[i];
        // get all type and regular imports that are imported
        // from React
        if (specifier.type === "ImportSpecifier") {
          if (
            path.value.importKind === "type" ||
            specifier.importKind === "type"
          ) {
            if (specifier.local && specifier.imported) {
              reactTypeIdentifiers[specifier.local.name] =
                specifier.imported.name;
            }
          } else {
            if (specifier.local && specifier.imported) {
              reactIdentifiers[specifier.local.name] = specifier.imported.name;
            }
          }
        }
      }
    });
    var regularImports_1 = [];
    Object.keys(reactIdentifiers).forEach(function (local) {
      var imported = reactIdentifiers[local];
      regularImports_1.push(
        j.importSpecifier(j.identifier(imported), j.identifier(local)),
      );
    });
    var typeImports_1 = [];
    Object.keys(reactTypeIdentifiers).forEach(function (local) {
      var imported = reactTypeIdentifiers[local];
      typeImports_1.push(
        j.importSpecifier(j.identifier(imported), j.identifier(local)),
      );
    });
    if (regularImports_1.length > 0 && reactPath) {
      j(reactPath).insertAfter(
        j.importDeclaration(regularImports_1, reactLiteral),
      );
    }
    if (typeImports_1.length > 0 && reactPath) {
      j(reactPath).insertAfter(
        j.importDeclaration(typeImports_1, reactLiteral, "type"),
      );
    }
    // remove all old react imports
    reactImportPaths.forEach(function (path) {
      var _a;
      // This is for import type React from 'react' which shouldn't
      // be removed
      if (
        (_a = path.value.specifiers) === null || _a === void 0
          ? void 0
          : _a.some(function (specifier) {
              var _a;
              return (
                specifier.type === "ImportDefaultSpecifier" &&
                ((_a = specifier.local) === null || _a === void 0
                  ? void 0
                  : _a.name) === "React" &&
                (specifier.importKind === "type" ||
                  path.value.importKind === "type")
              );
            })
      ) {
        j(path).insertAfter(
          j.importDeclaration(
            [j.importDefaultSpecifier(j.identifier("React"))],
            reactLiteral,
            "type",
          ),
        );
      }
      j(path).remove();
    });
  } else {
    // Remove the import because it's not being used
    // If we should keep the React import, just convert
    // default imports to named imports
    var isImportRemoved = false;
    if (!reactPath) return null;
    var specifiers = reactPath.value.specifiers;
    if (!specifiers) return null;
    for (var i = 0; i < specifiers.length; i++) {
      var specifier = specifiers[i];
      if (!specifier) continue;
      if (specifier.type === "ImportNamespaceSpecifier") {
        if (!isReactImportUsed) {
          isImportRemoved = true;
          j(reactPath).remove();
        } else if (destructureNamespaceImports) {
          // If we can destructure namespace imports, handle it like default imports
          j(reactPath).insertAfter(
            j.importDeclaration(
              [j.importNamespaceSpecifier(j.identifier("React"))],
              reactLiteral,
            ),
          );
          isImportRemoved = true;
          j(reactPath).remove();
        }
      } else if (specifier.type === "ImportDefaultSpecifier") {
        if (isReactImportUsed) {
          j(reactPath).insertAfter(
            j.importDeclaration(
              [j.importNamespaceSpecifier(j.identifier("React"))],
              reactLiteral,
            ),
          );
        }
        if (specifiers.length > 1) {
          var typeImports = [];
          var regularImports = [];
          for (var x = 0; x < specifiers.length; x++) {
            var spec = specifiers[x];
            if (!spec) continue;
            if (spec.type !== "ImportDefaultSpecifier") {
              if (spec.importKind === "type") {
                typeImports.push(spec);
              } else {
                regularImports.push(spec);
              }
            }
          }
          if (regularImports.length > 0) {
            j(reactPath).insertAfter(
              j.importDeclaration(regularImports, reactLiteral),
            );
          }
          if (typeImports.length > 0) {
            j(reactPath).insertAfter(
              j.importDeclaration(typeImports, reactLiteral, "type"),
            );
          }
        }
        isImportRemoved = true;
        j(reactPath).remove();
      }
    }
    if (!isImportRemoved) {
      return null;
    }
  }
  // If the first node has been modified or deleted, reattach the comments
  var firstNode2 = getFirstNode();
  if (firstNode2 !== firstNode) {
    firstNode2.comments = comments;
  }
  return root.toSource(printOptions);
}
