import { createHash, randomBytes } from "node:crypto";

export const SESSION_TOKEN_BYTES = 32;
export const API_TOKEN_BYTES = 32;

export function createSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token: string): string {
  // Tokens contain 256 bits of CSPRNG entropy; this is an indexed lookup digest, not password hashing.
  // codeql[js/insufficient-password-hash]
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createApiToken(): string {
  return `aiss_${randomBytes(API_TOKEN_BYTES).toString("base64url")}`;
}

export function hashApiToken(token: string): string {
  // Tokens contain 256 bits of CSPRNG entropy; this is an indexed lookup digest, not password hashing.
  // codeql[js/insufficient-password-hash]
  return createHash("sha256").update(token, "utf8").digest("hex");
}
