import { describe, it } from 'vitest';
import jscodeshift, { type API } from 'jscodeshift';
import transform from '../src/index.cjs';
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const buildApi = (parser: string | undefined): API => ({
  j: parser ? jscodeshift.withParser(parser) : jscodeshift,
  jscodeshift: parser ? jscodeshift.withParser(parser) : jscodeshift,
  stats: () => {
    console.error(
      'The stats function was called, which is not supported on purpose',
    );
  },
  report: () => {
    console.error(
      'The report function was called, which is not supported on purpose',
    );
  },
});

describe('create-element-to-jsx', () => {
  it('test #1', async () => {
    const INPUT = await readFile(join(__dirname, '..', '__testfixtures__/fixture1.input.jsx'), 'utf-8');
    const OUTPUT = await readFile(join(__dirname, '..', '__testfixtures__/fixture1.output.jsx'), 'utf-8');

    const actualOutput = transform({
        path: 'index.jsx',
        source: INPUT,
      },
      buildApi('jsx'), {}
    );

    assert.strictEqual(
      actualOutput?.trim(),
      OUTPUT.trim(),
    );
  });

  it('test #2', async () => {
    const INPUT = await readFile(join(__dirname, '..', '__testfixtures__/fixture2.input.jsx'), 'utf-8');
    const OUTPUT = await readFile(join(__dirname, '..', '__testfixtures__/fixture2.output.jsx'), 'utf-8');

    const actualOutput = transform({
        path: 'index.jsx',
        source: INPUT,
      },
      buildApi('jsx'), {}
    );

    assert.strictEqual(
      actualOutput?.trim(),
      OUTPUT.trim(),
    );
  });

  it("handles spread props", async () => {
    const INPUT = await readFile(
      join(__dirname, "..", "__testfixtures__/fixture3.input.jsx"),
      "utf-8",
    );
    const OUTPUT = await readFile(
      join(__dirname, "..", "__testfixtures__/fixture3.output.jsx"),
      "utf-8",
    );

    const actualOutput = transform({
        path: 'index.jsx',
        source: INPUT,
      },
      buildApi('jsx'), {}
    );


    assert.strictEqual(actualOutput?.trim(), OUTPUT.trim());
  })
});
