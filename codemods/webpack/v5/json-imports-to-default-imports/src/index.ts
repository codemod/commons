export default function transform(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let dirtyFlag = false;

  // Determine the original quote style
  const originalQuoteStyle = file.source.includes("'") ? 'single' : 'double';

  // Find all import declarations
  root.find(j.ImportDeclaration).forEach((path) => {
    const importPath = path.node.source.value;

    // Check if the import is from a JSON file
    if (importPath.endsWith('.json')) {
      const specifiers = path.node.specifiers;

      // Check if there are named imports
      if (
        specifiers.some((specifier) =>
          j.ImportSpecifier.check(specifier),
        )
      ) {
        // Determine the default import identifier
        const importBaseName = importPath.split('/').pop().replace('.json', '');
        const defaultImportName =
          importBaseName === 'package' ? 'pkg' : importBaseName;
        const defaultImportIdentifier = j.identifier(defaultImportName);

        // Create a new default import declaration with the original quote style
        const newImportDeclaration = j.importDeclaration(
          [j.importDefaultSpecifier(defaultImportIdentifier)],
          j.literal(importPath),
        );

        // Replace the old import declaration with the new one
        j(path).replaceWith(newImportDeclaration);

        // Replace all references to the named imports with properties on the default import
        specifiers.forEach((specifier) => {
          if (j.ImportSpecifier.check(specifier)) {
            const localName = specifier.local.name;
            const importedName = specifier.imported.name;

            root
              .find(j.Identifier, { name: localName })
              .filter((idPath) => {
                // Exclude identifiers used in import declarations
                const parent = idPath.parent.node;
                return (
                  !j.ImportDeclaration.check(parent) &&
                  !j.ImportSpecifier.check(parent) &&
                  !j.ImportDefaultSpecifier.check(parent) &&
                  !j.ImportNamespaceSpecifier.check(parent)
                );
              })
              .forEach((identifierPath) => {
                const parent = identifierPath.parent.node;

                if (
                  j.MemberExpression.check(parent) &&
                  parent.object === identifierPath.node
                ) {
                  j(identifierPath).replaceWith(
                    j.memberExpression(
                      defaultImportIdentifier,
                      j.identifier(importedName)
                    )
                  );
                } else {
                  j(identifierPath).replaceWith(
                    j.memberExpression(
                      defaultImportIdentifier,
                      j.identifier(importedName)
                    )
                  );
                }
              });
          }
        });

        dirtyFlag = true;
      }
    }
  });

return dirtyFlag
? root.toSource({ quote: originalQuoteStyle })
: undefined;
}
