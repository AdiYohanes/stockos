// Run: node scripts/check-smtp-readiness.mjs [--self-test]; never loads .env files.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function selfTest() {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !key.toUpperCase().startsWith("STOCKOS_SMTP_") && !/^NEXT_PUBLIC_.*SMTP/i.test(key)));
  const valid = Object.fromEntries(Object.entries({
    HOST: "smtp.example.test", PORT: "465", USER: "private-user-canary",
    PASSWORD: "private-password-canary", SENDER_EMAIL: "sender@example.test",
    SENDER_NAME: "Private Sender Canary", TEST_RECIPIENT: "owner@example.test",
    ALLOWED_RECIPIENT: "owner@example.test",
  }).map(([key, value]) => [`STOCKOS_SMTP_${key}`, value]));
  const blocked = "BLOCKED: missing SMTP configuration.\n";
  const preflight = "PREFLIGHT_ONLY: configuration valid; no connections made.\nBLOCKED: external delivery proof not performed.\n";
  function check(config, status, stdout, stderr = "", args = []) {
    const result = spawnSync(process.execPath, [process.argv[1], ...args], {
      env: { ...env, ...config }, encoding: "utf8", timeout: 5000,
    });
    assert.equal(result.error, undefined, "CLI must finish without subprocess errors");
    assert.equal(result.status, status, "CLI exit code");
    assert.equal(result.stdout, stdout, "CLI stdout must be fixed and redacted");
    assert.equal(result.stderr, stderr, "CLI stderr must be fixed and redacted");
  }
  check({}, 2, blocked);
  check(valid, 2, preflight);
  check({ ...valid, STOCKOS_SMTP_PORT: "587" }, 2, preflight);
  for (const key of Object.keys(valid)) check({ ...valid, [key]: "" }, 2, blocked);
  const invalid = [
    ["HOST", "https://smtp.example.test"], ["HOST", "bad..example.test"],
    ["HOST", "-smtp.example.test"], ["HOST", "x".repeat(254)],
    ["PORT", "0"], ["PORT", "65536"], ["PORT", "25"], ["PORT", "465junk"],
    ["PORT", "0465"], ["PORT", " 465"], ["USER", "secret\ncanary"],
    ["PASSWORD", "secret\rcanary"], ["PASSWORD", "x".repeat(4097)],
    ["SENDER_NAME", "secret\u007fcanary"], ["SENDER_NAME", "secret canary"],
    ["SENDER_EMAIL", "Name <sender@example.test>"], ["SENDER_EMAIL", "a..b@example.test"],
    ["TEST_RECIPIENT", "other@example.test"], ["TEST_RECIPIENT", "owner@example.test,other@example.test"],
    ["ALLOWED_RECIPIENT", "*@example.test"], ["ALLOWED_RECIPIENT", "owner@example.test\nsecret"],
  ];
  for (const [key, value] of invalid) {
    check({ ...valid, [`STOCKOS_SMTP_${key}`]: value }, 1, "", "INVALID: SMTP configuration rejected.\n");
  }
  for (const key of ["NEXT_PUBLIC_SMTP_PASSWORD", "NEXT_PUBLIC_STOCKOS_SMTP_USER"]) {
    check({ ...valid, [key]: "public-secret-canary" }, 1, "", "INVALID: SMTP configuration rejected.\n");
    check({ [key]: "" }, 1, "", "INVALID: SMTP configuration rejected.\n");
  }
  check(valid, 1, "", "INVALID: SMTP configuration rejected.\n", ["--send"]);
  console.log("SELF_TEST_OK: CLI assertions only; no delivery proof.");
}

function preflight() {
  // 465 requires implicit TLS; 587 requires STARTTLS before auth. No delivery code exists.
  // One exact bare mailbox allowed; local part remains case-sensitive (no wildcard/list).
  const names = ["HOST", "PORT", "USER", "PASSWORD", "SENDER_EMAIL", "SENDER_NAME", "TEST_RECIPIENT", "ALLOWED_RECIPIENT"];
  if (Object.keys(process.env).some((key) => /^NEXT_PUBLIC_.*SMTP/i.test(key))) throw new Error();
  const values = names.map((name) => process.env[`STOCKOS_SMTP_${name}`] ?? "");
  if (values.some((value) => value.length > 4096 || /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(value))) throw new Error();
  const [host, port, user, password, sender, senderName, recipient, allowed] = values;
  const hostname = (value) => value.length <= 253 && value.split(".").every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
  const mailbox = (value) => {
    const parts = value.split("@");
    return value.length <= 254 && parts.length === 2 && parts[0].length <= 64 &&
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i.test(parts[0]) &&
      parts[1].includes(".") && hostname(parts[1]);
  };
  // Validate present fields before missing-field handling so unsafe partial config fails closed.
  if ((host && !hostname(host)) || (port && !["465", "587"].includes(port)) ||
      (user && (!user.trim() || user.length > 320)) || (password && !password.trim()) ||
      (senderName && (!senderName.trim() || senderName.length > 128)) ||
      [sender, recipient, allowed].some((value) => value && !mailbox(value)) ||
      (recipient && allowed && recipient !== allowed)) throw new Error();
  if (values.some((value) => !value)) {
    console.log("BLOCKED: missing SMTP configuration.");
  } else {
    console.log("PREFLIGHT_ONLY: configuration valid; no connections made.");
    console.log("BLOCKED: external delivery proof not performed.");
  }
  process.exitCode = 2;
}

const selfTesting = process.argv.length === 3 && process.argv[2] === "--self-test";
try {
  if (selfTesting) selfTest();
  else {
    if (process.argv.length !== 2) throw new Error();
    preflight();
  }
} catch {
  console.error(selfTesting ? "INVALID: self-test failed." : "INVALID: SMTP configuration rejected.");
  process.exitCode = 1;
}
