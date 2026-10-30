#!/usr/bin/env node
/**
 * Prepare the LAN HTTPS dev certificate and keep next.config.ts origins in sync.
 *
 * Usage:
 *   node scripts/dev-cert.mjs [--self-test] [--force]
 *
 * - Resolves the active LAN IPv4 (default route interface, skipping virtual adapters).
 * - Reuses certificates/<ip>.pem when it matches the current IP; regenerates otherwise.
 * - Records the signed IP in certificates/.signed-ip for the reuse decision.
 * - Writes the current IP into allowedDevOrigins in next.config.ts.
 * - --self-test exercises the pure decision logic without mkcert or a real network.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const certificateDirectory = new URL("certificates/", root);
const certificateDirectoryPath = fileURLToPath(certificateDirectory);
const configPath = new URL("next.config.ts", root);
const signedIpFile = () => join(certificateDirectoryPath, ".signed-ip");

/** Resolve a site-local (LAN) IPv4 address, preferring the default-route interface. */
export function resolveLanIpv4(interfaces = networkInterfaces()) {
  const candidates = [];
  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family !== "IPv4" || address.internal || !address.cidr) continue;
      // Site-local private ranges only; skip link-local (169.254.x) and virtual adapters.
      const octets = address.address.split(".").map(Number);
      const siteLocal = octets[0] === 10
        || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
        || (octets[0] === 192 && octets[1] === 168);
      if (!siteLocal) continue;
      const virtual = /wsl|vmware|virtualbox|hyper-v|loopback|docker|vethernet/i.test(name);
      candidates.push({ name, address: address.address, cidr: address.cidr, virtual });
    }
  }
  const preferred = candidates.find(c => !c.virtual && /^wi-?fi|^wlan|ethernet|eth\d/i.test(c.name))
    ?? candidates.find(c => !c.virtual)
    ?? candidates[0];
  if (!preferred) throw new Error("No site-local IPv4 address found; connect to the LAN and retry.");
  return preferred.address;
}

/** Decide whether the existing certificate can be reused for the current IP. */
export function shouldReuseCertificate(currentIp, signedIp, hasCertificate) {
  return Boolean(hasCertificate) && signedIp === currentIp;
}

/** Read the IP recorded in certificates/.signed-ip, or null when absent/malformed. */
export function readSignedIp(filePath) {
  try {
    const value = readFileSync(filePath, "utf8").trim();
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

/** Patch allowedDevOrigins in next.config.ts to exactly [currentIp]. */
export function applyAllowedOrigin(configText, currentIp) {
  const pattern = /allowedDevOrigins:\s*\[[^\]]*\]/;
  const replacement = `allowedDevOrigins: ["${currentIp}"]`;
  assert.match(configText, pattern, "allowedDevOrigins not found in next.config.ts");
  return configText.replace(pattern, replacement);
}

function writeCertificate(ip, force) {
  const certificate = join(certificateDirectoryPath, "https-cert.pem");
  const key = join(certificateDirectoryPath, "https-key.pem");
  if (shouldReuseCertificate(ip, readSignedIp(signedIpFile()), existsSync(certificate) && existsSync(key)) && !force) {
    console.log(`Certificate for ${ip} already exists; reusing it.`);
    return { certificate, key, reused: true };
  }
  execFileSync("mkcert", ["-cert-file", "https-cert.pem", "-key-file", "https-key.pem", ip], { cwd: certificateDirectoryPath, stdio: "inherit" });
  writeFileSync(signedIpFile(), `${ip}\n`);
  console.log(`Generated certificate for ${ip}.`);
  return { certificate, key, reused: false };
}

function selfTest() {
  const ip = resolveLanIpv4({
    "Ethernet": [{ family: "IPv4", internal: false, address: "192.168.18.108", cidr: "192.168.18.108/24" }],
    "Loopback Pseudo-Interface 1": [{ family: "IPv4", internal: true, address: "127.0.0.1", cidr: "127.0.0.1/8" }],
    "vEthernet (WSL)": [{ family: "IPv4", internal: false, address: "172.27.144.1", cidr: "172.27.144.1/20" }],
  });
  assert.equal(ip, "192.168.18.108", "prefers physical LAN over virtual adapters");

  assert.equal(resolveLanIpv4({
    "Wi-Fi": [{ family: "IPv4", internal: false, address: "10.0.0.5", cidr: "10.0.0.5/24" }],
  }), "10.0.0.5", "accepts 10/8 ranges");

  assert.throws(() => resolveLanIpv4({
    "Loopback": [{ family: "IPv4", internal: true, address: "127.0.0.1", cidr: "127.0.0.1/8" }],
    "Autoconfiguration": [{ family: "IPv4", internal: false, address: "169.254.83.107", cidr: "169.254.83.107/16" }],
  }), /No site-local IPv4/, "throws when only loopback/link-local exist");

  assert.equal(shouldReuseCertificate("192.168.18.108", "192.168.18.108", true), true, "reuse on matching IP");
  assert.equal(shouldReuseCertificate("192.168.18.109", "192.168.18.108", true), false, "regenerate on stale IP");
  assert.equal(shouldReuseCertificate("192.168.18.108", null, false), false, "regenerate when missing");

  const directory = new URL("certificates/", root).pathname;
  assert.equal(readSignedIp(join(directory, ".signed-ip-missing-fixture")), null, "missing marker reads as null");

  assert.equal(
    applyAllowedOrigin('const c = { allowedDevOrigins: ["192.168.18.107"], experimental: {} };', "192.168.18.108"),
    'const c = { allowedDevOrigins: ["192.168.18.108"], experimental: {} };',
    "origin patch rewrites the list",
  );
  assert.throws(() => applyAllowedOrigin("const c = {};", "192.168.18.108"), /allowedDevOrigins not found/);

  console.log("check:dev-cert passed (pure decision logic, no mkcert required)");
}

if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  const ip = resolveLanIpv4();
  const original = readFileSync(configPath, "utf8");
  const patched = applyAllowedOrigin(original, ip);
  if (patched !== original) {
    writeFileSync(configPath, patched);
    console.log(`Updated allowedDevOrigins to ${ip}.`);
  }
  mkdirSync(certificateDirectoryPath, { recursive: true });
  const { certificate, key, reused } = writeCertificate(ip, process.argv.includes("--force"));
  console.log(`Start the HTTPS dev server with: npm run dev:https`);
  console.log(`  cert: ${certificate}`);
  console.log(`  key:  ${key}`);
  console.log(`  url:  https://${ip}:3000${reused ? "" : " (reinstall the phone CA only if the root certificate changed)"}`);
}
