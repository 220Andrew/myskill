import test from "node:test";
import assert from "node:assert/strict";
import {
  generateTotpCode,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "@myskills-app/auth";
import { AuthService } from "../src/auth/service.js";
import { MemoryAuthStore } from "../src/auth/memory-auth-store.js";

const PASSWORD = "correct horse battery staple";

test("password changes roll back with credential revocation and audit only after commit", async () => {
  const store = new FailingCredentialRevocationStore();
  const service = new AuthService(store);
  store.addUser({
    id: "password-atomic",
    email: "password-atomic@example.com",
    status: "active",
    emailVerifiedAt: new Date(),
    roles: ["user"],
    passwordHash: await hashPassword(PASSWORD),
  });
  const login = await passwordLogin(service, "password-atomic@example.com");
  const apiToken = await service.createApiToken(login.user, { name: "Password atomic", scopes: ["profile:read"] });

  store.failNextCredentialRevocation();
  await assert.rejects(service.changePassword(login.user, {
    currentPassword: PASSWORD,
    password: "new correct horse battery staple",
  }), /Injected credential revocation failure/);

  const unchanged = await store.findUserByEmailWithPassword("password-atomic@example.com");
  assert.equal(await verifyPassword(unchanged?.passwordHash ?? "", PASSWORD), true);
  assert.ok(await service.authenticateRequest(`Bearer ${login.token}`));
  assert.ok(await service.authenticateRequest(`Bearer ${apiToken.token}`));
  assert.equal(await auditCount(store, "account.password.change"), 0);

  await service.changePassword(login.user, {
    currentPassword: PASSWORD,
    password: "new correct horse battery staple",
  });
  assert.equal(await service.authenticateRequest(`Bearer ${login.token}`), null);
  assert.equal(await service.authenticateRequest(`Bearer ${apiToken.token}`), null);
  assert.equal(await auditCount(store, "account.password.change"), 1);
});

test("email confirmation rolls back token, email, and credentials together", async () => {
  const store = new FailingCredentialRevocationStore();
  const service = new AuthService(store);
  const user = store.addUser({
    id: "email-atomic",
    email: "email-before@example.com",
    status: "active",
    emailVerifiedAt: new Date(),
    roles: ["user"],
    passwordHash: await hashPassword(PASSWORD),
  });
  const login = await passwordLogin(service, user.email);
  const apiToken = await service.createApiToken(login.user, { name: "Email atomic", scopes: ["profile:read"] });
  const rawToken = "e".repeat(43);
  await store.createAuthActionToken({
    userId: user.id,
    purpose: "email_change",
    tokenHash: hashSessionToken(rawToken),
    sentToNormalizedEmail: "email-after@example.com",
    expiresAt: new Date(Date.now() + 60_000),
  });

  store.failNextCredentialRevocation();
  await assert.rejects(service.confirmEmailChange({ token: rawToken }), /Injected credential revocation failure/);
  assert.ok(await store.findUserByEmailWithPassword("email-before@example.com"));
  assert.equal(await store.findUserByEmailWithPassword("email-after@example.com"), null);
  assert.ok(await service.authenticateRequest(`Bearer ${login.token}`));
  assert.ok(await service.authenticateRequest(`Bearer ${apiToken.token}`));
  assert.equal(await auditCount(store, "account.email_change.confirm"), 0);

  assert.deepEqual(await service.confirmEmailChange({ token: rawToken }), { status: "changed" });
  assert.ok(await store.findUserByEmailWithPassword("email-after@example.com"));
  assert.equal(await service.authenticateRequest(`Bearer ${login.token}`), null);
  assert.equal(await service.authenticateRequest(`Bearer ${apiToken.token}`), null);
  assert.equal(await auditCount(store, "account.email_change.confirm"), 1);
});

test("MFA removal rolls back factors, recovery codes, and credentials together", async () => {
  const store = new FailingCredentialRevocationStore();
  const service = new AuthService(store);
  store.addUser({
    id: "mfa-atomic",
    email: "mfa-atomic@example.com",
    status: "active",
    emailVerifiedAt: new Date(),
    roles: ["maintainer"],
    passwordHash: await hashPassword(PASSWORD),
  });
  const setup = await passwordLogin(service, "mfa-atomic@example.com");
  const enrollment = await service.startTotpEnrollment(setup.user, { password: PASSWORD });
  const confirmation = await service.confirmTotpEnrollment(setup.user, {
    factorId: enrollment.factorId,
    code: generateTotpCode(enrollment.secret),
  });
  const challenge = await service.login({ email: "mfa-atomic@example.com", password: PASSWORD });
  assert.equal(challenge.mfaRequired, true);
  if (!challenge.mfaRequired) throw new Error("Expected MFA challenge.");
  const verified = await service.verifyMfaChallenge({
    challengeToken: challenge.challengeToken,
    recoveryCode: confirmation.recoveryCodes[0],
  });
  const reviewToken = await service.createApiToken(verified.user, {
    name: "MFA atomic",
    scopes: ["review:read", "review:write"],
  });
  const recoveryCount = await store.countUnusedMfaRecoveryCodes(verified.user.id);

  store.failNextCredentialRevocation();
  await assert.rejects(service.disableTotpMfa(verified.user, { password: PASSWORD }), /Injected credential revocation failure/);
  assert.equal((await service.getMfaStatus(verified.user)).totpEnabled, true);
  assert.equal(await store.countUnusedMfaRecoveryCodes(verified.user.id), recoveryCount);
  assert.ok(await service.authenticateRequest(`Bearer ${verified.token}`));
  assert.ok(await service.authenticateRequest(`Bearer ${reviewToken.token}`));
  assert.equal(await auditCount(store, "account.mfa.disable"), 0);

  await service.disableTotpMfa(verified.user, { password: PASSWORD });
  assert.equal((await service.getMfaStatus(verified.user)).totpEnabled, false);
  assert.equal(await store.countUnusedMfaRecoveryCodes(verified.user.id), 0);
  assert.equal(await service.authenticateRequest(`Bearer ${verified.token}`), null);
  assert.equal(await service.authenticateRequest(`Bearer ${reviewToken.token}`), null);
  assert.equal(await auditCount(store, "account.mfa.disable"), 1);
});

class FailingCredentialRevocationStore extends MemoryAuthStore {
  private failNext = false;

  failNextCredentialRevocation(): void {
    this.failNext = true;
  }

  override async revokeUserCredentials(userId: string): Promise<void> {
    await super.revokeUserCredentials(userId);
    if (this.failNext) {
      this.failNext = false;
      throw new Error("Injected credential revocation failure.");
    }
  }
}

async function passwordLogin(service: AuthService, email: string) {
  const login = await service.login({ email, password: PASSWORD });
  assert.equal(login.mfaRequired, false);
  if (login.mfaRequired) throw new Error("Unexpected MFA challenge.");
  return login;
}

async function auditCount(store: MemoryAuthStore, action: string): Promise<number> {
  return (await store.listAuditEvents({ limit: 100 })).filter((event) => event.action === action).length;
}
