/*NOTEBOOK: notebook-reboot-agent.js (Eskalation + Lock + HMAC + VirtualBox)

✅ prüft HMAC (Security)
✅ ack sofort
✅ Lockfile schützt vor Parallel-Reboots
✅ versucht „soft“ nur wenn HA erreichbar ist (optional, ohne SSH-Zwang)
✅ reset der VM homeAssistant (VirtualBox)

Soft-Strategie hier: HTTP check auf HA (Port 8123).
Wenn erreichbar → (optional) SSH-„ha core restart“ (falls du willst).
Wenn nicht erreichbar → direkt VM reset.








*/ 

"use strict";

/**
 * notebook-reboot-agent.js
 * - receives reboot requests via MQTT
 * - verifies HMAC signature
 * - ack immediately
 * - lockfile prevents parallel reboot sequences
 * - escalation:
 *    1) if HA web reachable -> optional soft action (hook point)
 *    2) otherwise (or soft fails) -> VirtualBox reset of VM "homeAssistant"
 */

const mqtt = require("mqtt");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { execFile } = require("child_process");

// ---------- CONFIG ----------
const CFG = Object.freeze({
  brokerUrl: process.env.BROKER_URL || "mqtt://<BROKER-IP-ODER-RASPI>",
  clientId:  process.env.CLIENT_ID  || "notebook-reboot-agent",
  qos: Number(process.env.QOS || 1),

  topics: {
    request: process.env.TOPIC_REQUEST || "infra/ha/reboot/request",
    ack:     process.env.TOPIC_ACK     || "infra/ha/reboot/ack",
    status:  process.env.TOPIC_STATUS  || "infra/ha/reboot/status",
  },

  hmacSecret: process.env.HMAC_SECRET || "",

  vmName: process.env.VM_NAME || "homeAssistant",

  lockFile: process.env.LOCK_FILE || path.join(process.cwd(), "reboot-agent.lock"),
  lockMaxAgeMs: Number(process.env.LOCK_MAX_AGE_MS || (20 * 60_000)),

  // HA reachability check
  haHost: process.env.HA_HOST || "192.168.1.50", // <- set to your HA IP
  haPort: Number(process.env.HA_PORT || 8123),
  haReachTimeoutMs: Number(process.env.HA_REACH_TIMEOUT_MS || 2500),

  // Optional SSH soft action
  sshEnabled: (process.env.HA_SSH_ENABLED ?? "false") === "true",
  sshUser: process.env.HA_SSH_USER || "root",
  sshTimeoutMs: Number(process.env.HA_SSH_TIMEOUT_MS || 10_000),
});

if (!CFG.hmacSecret) {
  console.error("FATAL: HMAC_SECRET is not set. Refusing to start.");
  process.exit(2);
}

// ---------- UTIL ----------
function unixTs() { return Math.floor(Date.now() / 1000); }

function stableJson(obj) {
  const keys = Object.keys(obj).sort();
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return JSON.stringify(out);
}

function signHmac(secret, msg) {
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

function execCmd(file, args, { timeoutMs = 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) {
        return reject({
          message: err.message,
          code: err.code,
          signal: err.signal,
          stdout: String(stdout || ""),
          stderr: String(stderr || "")
        });
      }
      resolve({ stdout: String(stdout || ""), stderr: String(stderr || "") });
    });
  });
}

class Lock {
  constructor(lockFile, maxAgeMs) {
    this.lockFile = lockFile;
    this.maxAgeMs = maxAgeMs;
  }
  isLocked() {
    if (!fs.existsSync(this.lockFile)) return false;
    try {
      const st = fs.statSync(this.lockFile);
      const age = Date.now() - st.mtimeMs;
      if (age > this.maxAgeMs) {
        fs.unlinkSync(this.lockFile);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }
  acquire(obj) {
    fs.writeFileSync(this.lockFile, JSON.stringify({ ...obj, acquiredAt: new Date().toISOString() }, null, 2));
  }
  release() {
    try { fs.unlinkSync(this.lockFile); } catch {}
  }
}

function checkHaReachable(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const req = http.request(
      { host, port, path: "/", method: "GET", timeout: timeoutMs },
      (res) => {
        // Any HTTP response means: something is answering
        res.resume();
        resolve(true);
      }
    );
    req.on("timeout", () => { req.destroy(); resolve(false); });
    req.on("error", () => resolve(false));
    req.end();
  });
}

class RebootAgent {
  constructor(cfg) {
    this.cfg = cfg;
    this.lock = new Lock(cfg.lockFile, cfg.lockMaxAgeMs);
  }

  start() {
    this.client = mqtt.connect(this.cfg.brokerUrl, { clientId: this.cfg.clientId });
    this.client.on("connect", () => this.onConnect());
    this.client.on("message", (t, m) => this.onMessage(t, m));
    this.client.on("error", (e) => this.log("MQTT error:", e?.message || e));
  }

  onConnect() {
    this.log("connected");
    this.client.subscribe(this.cfg.topics.request, { qos: this.cfg.qos });
  }

  publish(topic, obj) {
    this.client.publish(topic, JSON.stringify(obj), { qos: this.cfg.qos });
  }

  status(requestId, state, detail = "") {
    this.publish(this.cfg.topics.status, { requestId, ts: unixTs(), state, detail });
  }

  ack(requestId, state = "ack") {
    this.publish(this.cfg.topics.ack, { requestId, ts: unixTs(), state });
  }

  verifyHmac(req) {
    // Recreate base object without hmac and sign deterministically
    const { hmac, ...base } = req;
    if (!hmac) return false;
    const data = stableJson(base);
    const sig = signHmac(this.cfg.hmacSecret, data);
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(hmac, "hex"));
  }

  async onMessage(_topic, msg) {
    const req = safeParse(msg.toString()) || { raw: msg.toString() };
    const requestId = req.requestId || `unknown-${unixTs()}`;

    // Ack immediately so Raspi knows we received it.
    this.ack(requestId, "ack");

    // Security: verify signature
    const ok = this.verifyHmac(req);
    if (!ok) {
      this.status(requestId, "rejected", "invalid hmac signature");
      return;
    }

    // Lock to prevent parallel sequences
    if (this.lock.isLocked()) {
      this.status(requestId, "ignored_locked", "another reboot sequence is running");
      return;
    }

    this.lock.acquire({ requestId, reason: req.reason || "unknown" });

    try {
      await this.escalate(requestId, req);
    } finally {
      this.lock.release();
    }
  }

  async escalate(requestId, req) {
    this.status(requestId, "start", `reason=${req.reason} missing=${req.missingForSec}s`);

    const reachable = await checkHaReachable(this.cfg.haHost, this.cfg.haPort, this.cfg.haReachTimeoutMs);
    this.status(requestId, "ha_reach_check", reachable ? "reachable" : "not reachable");

    if (reachable && this.cfg.sshEnabled) {
      // Optional soft action: "ha core restart" via SSH to HA OS
      // If you don't want SSH, keep sshEnabled=false and it will skip.
      const softOk = await this.trySoftRestart(requestId);
      if (softOk) {
        this.status(requestId, "done", "soft restart triggered");
        return;
      }
      this.status(requestId, "soft_failed", "falling back to VM reset");
    } else {
      this.status(
        requestId,
        "soft_skipped",
        reachable ? "ssh disabled" : "ha not reachable"
      );
    }

    // Hard action: VM reset
    await this.resetVm(requestId);
    this.status(requestId, "done", `vm reset issued for ${this.cfg.vmName}`);
  }

  async trySoftRestart(requestId) {
    // ssh root@HA "ha core restart"
    const target = `${this.cfg.sshUser}@${this.cfg.haHost}`;
    this.status(requestId, "soft_try", `ssh ${target} 'ha core restart'`);

    try {
      await execCmd("ssh", ["-o", "ConnectTimeout=3", target, "ha core restart"], { timeoutMs: this.cfg.sshTimeoutMs });
      this.status(requestId, "soft_ok", "ha core restart executed");
      return true;
    } catch (e) {
      this.status(requestId, "soft_err", (e.stderr || e.message).trim().slice(0, 200));
      return false;
    }
  }

  async resetVm(requestId) {
    // VBoxManage controlvm "homeAssistant" reset
    this.status(requestId, "vm_reset", `VBoxManage controlvm "${this.cfg.vmName}" reset`);

    try {
      await execCmd("VBoxManage", ["controlvm", this.cfg.vmName, "reset"], { timeoutMs: 60_000 });
      return;
    } catch (e) {
      this.status(requestId, "vm_reset_failed", (e.stderr || e.message).trim().slice(0, 200));

      // fallback: poweroff + startvm headless
      this.status(requestId, "vm_poweroff", `VBoxManage controlvm "${this.cfg.vmName}" poweroff`);
      try { await execCmd("VBoxManage", ["controlvm", this.cfg.vmName, "poweroff"], { timeoutMs: 60_000 }); } catch {}

      this.status(requestId, "vm_start", `VBoxManage startvm "${this.cfg.vmName}" --type headless`);
      await execCmd("VBoxManage", ["startvm", this.cfg.vmName, "--type", "headless"], { timeoutMs: 60_000 });
    }
  }

  log(...args) {
    console.log(new Date().toISOString(), "[AGENT]", ...args);
  }
}

new RebootAgent(CFG).start();

