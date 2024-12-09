import { describe, it } from "vitest";
import jscodeshift, { type API } from "jscodeshift";
import transform from "../src/index.js";
import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const buildApi = (parser: string | undefined): API => ({
  j: parser ? jscodeshift.withParser(parser) : jscodeshift,
  jscodeshift: parser ? jscodeshift.withParser(parser) : jscodeshift,
  stats: () => {},
  report: () => {},
});

describe("react/update-react-imports", () => {
  it("transforms default import to named imports", async () => {
    const INPUT = await readFile(
      join(__dirname, "..", "__testfixtures__/default-import.input.tsx"),
      "utf-8"
    );
    const OUTPUT = await readFile(
      join(__dirname, "..", "__testfixtures__/default-import.output.tsx"),
      "utf-8"
    );

    const actualOutput = transform(
      {
        path: "test.tsx",
        source: INPUT,
      },
      buildApi("tsx"),
      {}
    );


    assert.strictEqual(actualOutput?.trim(), OUTPUT.trim());
  });

  it("transforms namespace import to named imports", async () => {
    const INPUT = await readFile(
      join(__dirname, "..", "__testfixtures__/namespace-import.input.tsx"),
      "utf-8"
    );
    const OUTPUT = await readFile(
      join(__dirname, "..", "__testfixtures__/namespace-import.output.tsx"),
      "utf-8"
    );

    const actualOutput = transform(
      {
        path: "test.tsx",
        source: INPUT,
      },
      buildApi("tsx"),
      { destructureNamespaceImports: true }
    );

    assert.strictEqual(actualOutput?.trim(), OUTPUT.trim());
  });

  it("handles type imports correctly", async () => {
    const INPUT = await readFile(
      join(__dirname, "..", "__testfixtures__/type-import.input.tsx"),
      "utf-8"
    );
    const OUTPUT = await readFile(
      join(__dirname, "..", "__testfixtures__/type-import.output.tsx"),
      "utf-8"
    );

    const actualOutput = transform(
      {
        path: "test.tsx",
        source: INPUT,
      },
      buildApi("tsx"),
      {}
    );

    assert.strictEqual(actualOutput?.trim(), OUTPUT.trim());
  });

  it("preserves comments", async () => {
    const INPUT = await readFile(
      join(__dirname, "..", "__testfixtures__/preserve-comments.input.tsx"),
      "utf-8"
    );
    const OUTPUT = await readFile(
      join(__dirname, "..", "__testfixtures__/preserve-comments.output.tsx"),
      "utf-8"
    );

    const actualOutput = transform(
      {
        path: "test.tsx",
        source: INPUT,
      },
      buildApi("tsx"),
      {}
    );

    assert.strictEqual(actualOutput?.trim(), OUTPUT.trim());
  });
});
