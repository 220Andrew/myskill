import { createRequire } from "node:module";

interface PackageMetadata {
  version?: unknown;
}

const require = createRequire(import.meta.url);
const metadata = require("../../../package.json") as PackageMetadata;

if (typeof metadata.version !== "string" || !metadata.version.trim()) {
  throw new Error("Root package version metadata is required.");
}

export const API_VERSION = metadata.version;
