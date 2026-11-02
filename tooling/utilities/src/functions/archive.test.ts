import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buffer } from "node:stream/consumers";
import * as tarStream from "tar-stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { untar } from "./archive.js";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "commons-untar-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function writeArchive(
  path: string,
  entries: (tarStream.Headers & { body?: string })[],
) {
  const pack = tarStream.pack();
  const contents = buffer(pack);
  for (const { body, ...header } of entries) {
    pack.entry(header, body ?? "");
  }
  pack.finalize();
  await writeFile(path, new Uint8Array(await contents));
}

describe("untar", () => {
  it("extracts a tiny archive into a newly created target directory", async () => {
    const source = join(root, "fixture.tar");
    const target = join(root, "target");
    await writeArchive(source, [
      { name: "hello.txt", body: "hello" },
      { name: "nested/message.txt", body: "nested" },
    ]);

    await untar(source, target);

    expect(await readFile(join(target, "hello.txt"), "utf8")).toBe("hello");
    expect(await readFile(join(target, "nested/message.txt"), "utf8")).toBe(
      "nested",
    );
  });

  it.each(["link", "symlink"] as const)(
    "does not create a drive-relative %s outside the target directory",
    async (type) => {
      const source = join(root, "crafted.tar");
      const target = join(root, "target");
      const outside = join(root, "outside.txt");
      await writeFile(outside, "untouched");
      await writeArchive(source, [
        { name: "escape", type, linkname: "C:../outside.txt" },
      ]);

      await untar(source, target);

      expect(await readdir(target)).not.toContain("escape");
      expect(await readFile(outside, "utf8")).toBe("untouched");
    },
  );
});
