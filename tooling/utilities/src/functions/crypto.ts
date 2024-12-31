import crypto from "node:crypto";

// low-level methods (first tier)

export type KeyIvPair = Readonly<{
  key: Buffer;
  iv: Buffer;
}>;

export const encryptWithIv = (
  algorithm: crypto.CipherGCMTypes,
  { key, iv }: KeyIvPair,
  data: Buffer,
) => {
  const cipher = crypto.createCipheriv(
    algorithm,
    key as unknown as crypto.CipherKey,
    iv as unknown as crypto.BinaryLike
  );

  const encrypted = cipher.update(data as unknown as crypto.BinaryLike);
  const final = cipher.final();
  const authTag = cipher.getAuthTag();

  return Buffer.concat([encrypted, final, authTag] as unknown as Uint8Array[]);
};

export const decryptWithIv = (
  algorithm: crypto.CipherGCMTypes,
  { key, iv }: KeyIvPair,
  data: Buffer,
) => {
  // Split the auth tag from the encrypted data (last 16 bytes)
  const authTag = data.slice(-16);
  const encryptedData = data.slice(0, -16);

  const decipher = crypto.createDecipheriv(
    algorithm,
    key as unknown as crypto.CipherKey,
    iv as unknown as crypto.BinaryLike
  );

  decipher.setAuthTag(new Uint8Array(authTag.buffer));
  const decrypted = decipher.update(new Uint8Array(encryptedData.buffer));
  const final = decipher.final();

  return Buffer.concat([decrypted, final] as unknown as Uint8Array[]);
};
