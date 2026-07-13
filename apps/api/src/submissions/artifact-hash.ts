import { createHash } from "node:crypto";
import type { ArtifactPayload } from "./types.js";

export function artifactPayloadSha256(payload: ArtifactPayload): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

