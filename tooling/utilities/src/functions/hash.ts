import { createHash } from "node:crypto";

export const buildHash = (data: string) =>
  createHash("ripemd160").update(data).digest("base64url");

export const buildCodemodMetadataHash = (name: string) =>
  createHash("ripemd160").update("README.md").update(name).digest("base64url");

// taken from https://stackoverflow.com/a/63361543
export const streamToString = async (stream: NodeJS.ReadableStream) => {
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    if (chunk instanceof Buffer) {
      chunks.push(new Uint8Array(chunk.buffer));
      continue;
    }

    chunks.push(new Uint8Array(Buffer.from(chunk)));
  }

  return Buffer.concat(chunks).toString("utf-8");
};
