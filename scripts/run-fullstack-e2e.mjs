import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const composeFile = resolve(root, "docker-compose.e2e.yml");
const projectName = `myskills-beta2-e2e-${process.pid}-${randomBytes(4).toString("hex")}`;
const webPort = "43100";
const baseURL = `http://127.0.0.1:${webPort}`;
const composeArgs = ["compose", "--project-name", projectName, "--file", composeFile];
const environment = {
  ...process.env,
  COMPOSE_PROGRESS: "plain",
  MYSKILLS_E2E_AUTH_SECRET: randomCredential(48),
  MYSKILLS_E2E_BASE_URL: baseURL,
  MYSKILLS_E2E_MINIO_ROOT_PASSWORD: randomCredential(24),
  MYSKILLS_E2E_MINIO_ROOT_USER: `e2e${randomBytes(6).toString("hex")}`,
  MYSKILLS_E2E_OWNER_EMAIL: "beta2-owner@example.test",
  MYSKILLS_E2E_OWNER_PASSWORD: randomCredential(24),
  MYSKILLS_E2E_POSTGRES_PASSWORD: randomCredential(24),
  MYSKILLS_E2E_WEB_PORT: webPort,
};

let teardownStarted = false;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    void teardown().finally(() => process.exit(signal === "SIGINT" ? 130 : 143));
  });
}

try {
  await run("docker", [...composeArgs, "config", "--quiet"]);
  await run("docker", [...composeArgs, "up", "--build", "--detach", "--wait", "--wait-timeout", "300"]);
  await run(resolve(root, "node_modules/.bin/playwright"), [
    "test",
    "--config",
    resolve(root, "apps/web/playwright.fullstack.config.ts"),
  ]);
} catch (error) {
  await run("docker", [...composeArgs, "ps"], { allowFailure: true });
  await run("docker", [...composeArgs, "logs", "--no-color", "--tail", "200"], { allowFailure: true });
  throw error;
} finally {
  await teardown();
}

async function teardown() {
  if (teardownStarted) {
    return;
  }
  teardownStarted = true;
  await run("docker", [...composeArgs, "down", "--volumes", "--remove-orphans", "--timeout", "10"], { allowFailure: true });
}

function randomCredential(bytes) {
  return randomBytes(bytes).toString("base64url");
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: root,
      env: environment,
      stdio: "inherit",
    });
    child.once("error", rejectPromise);
    child.once("exit", (code, signal) => {
      if (code === 0 || options.allowFailure) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`${command} exited with ${signal ? `signal ${signal}` : `code ${code}`}.`));
    });
  });
}
