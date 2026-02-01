"use strict";

/**
 * raspi-watchdog.js
 * Professional MQTT watchdog:
 * - monitors a representative topic (e.g. zigbee2mqtt/bridge/state or ha/heartbeat)
 * - triggers a signed reboot request to a notebook agent
 * - ack + cooldown + exponential backoff + timeouts prevent reboot storms
 * 
 Es gibt 2 NodeJS-Dienste (Raspi + Notebook)

HMAC-signierte Requests (damit niemand im Netz rebooten kann)

Lockfile + Cooldown + Backoff gegen Reboot-Stürme

Eskalation: soft (wenn HA erreichbar) → VM reset (hart)

systemd Services inkl. Autostart & Auto-Restart

konfigurierbar über ENV-Datei (schön „admin-freundlich“)
 
✅ überwacht Heartbeat/Bridge-State
✅ sendet signierten Request
✅ wartet auf Ack
✅ Cooldown + Backoff + Timeout
✅ publiziert Status

Schlüssel erzeugen und bei beiden Teilnehmern anwenden...

openssl rand -hex 32
Das Ergebnis (64 Hex-Zeichen) ist das   HMAC_SECRET.


*/

const mqtt = require("mqtt");
const crypto = require("crypto");

// ---------- CONFIG (prefer ENV, defaults are safe-ish) ----------
const CFG = Object.freeze({
  brokerUrl: process.env.BROKER_URL || "mqtt://127.0.0.1",
  clientId:  process.env.CLIENT_ID  || "raspi-watchdog",

  watchTopic: process.env.WATCH_TOPIC || "zigbee2mqtt/bridge/state",
  treatOfflinePayloadAsFailure: (process.env.TREAT_OFFLINE_AS_FAILURE ?? "true") === "true",

  warnAfterMs:    Number(process.env.WARN_AFTER_MS    || 60_000),
  triggerAfterMs: Number(process.env.TRIGGER_AFTER_MS || 180_000),

  cooldownMs:     Number(process.env.COOLDOWN_MS      || (15 * 60_000)),
  backoffBaseMs:  Number(process.env.BACKOFF_BASE_MS  || (5  * 60_000)),
  backoffMaxMs:   Number(process.env.BACKOFF_MAX_MS   || (60 * 60_000)),

  ackTimeoutMs:   Number(process.env.ACK_TIMEOUT_MS   || (5  * 60_000)),

  qos: Number(process.env.QOS || 1),

  topics: {
    request:       process.env.TOPIC_REQUEST || "infra/ha/reboot/request",
    ack:           process.env.TOPIC_ACK     || "infra/ha/reboot/ack",
    status:        process.env.TOPIC_STATUS  || "infra/ha/reboot/status",
    watchdogLwt:   process.env.TOPIC_WD_LWT  || "infra/watchdog/lwt",
    watchdogState: process.env.TOPIC_WD_STATE|| "infra/watchdog/state",
  },

  hmacSecret: process.env.HMAC_SECRET || ""
});

if (!CFG.hmacSecret) {
  console.error("FATAL: HMAC_SECRET is not set. Refusing to start.");
  process.exit(2);
}

// ---------- UTIL ----------
function nowMs() { return Date.now(); }
function unixTs() { return Math.floor(Date.now() / 1000); }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function requestId(prefix="ha-reboot") {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

function stableJson(obj) {
  // stable-ish stringify (sorted keys shallow)
  const keys = Object.keys(obj).sort();
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return JSON.stringify(out);
}

function signHmac(secret, msg) {
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

class Backoff {
  constructor(baseMs, maxMs) {
    this.baseMs = baseMs;
    this.maxMs = maxMs;
    this.failCount = 0;
  }
  markFail() { this.failCount++; }
  markSuccess() { this.failCount = 0; }
  nextDelayMs() {
    const pow = Math.max(0, this.failCount - 1);
    return clamp(this.baseMs * Math.pow(2, pow), this.baseMs, this.maxMs);
  }
}

class Watchdog {
  constructor(cfg) {
    this.cfg = cfg;
    this.lastSeenMs = 0;
    this.lastPayload = null;

    this.pending = null; // { requestId, sentAtMs }
    this.nextAllowedActionMs = 0;

    this.backoff = new Backoff(cfg.backoffBaseMs, cfg.backoffMaxMs);
  }

  start() {
    this.client = mqtt.connect(this.cfg.brokerUrl, {
      clientId: this.cfg.clientId,
      will: { topic: this.cfg.topics.watchdogLwt, payload: "offline", qos: this.cfg.qos, retain: true }
    });

    this.client.on("connect", () => this.onConnect());
    this.client.on("message", (t, m) => this.onMessage(t, m));
    this.client.on("error", (e) => this.log("MQTT error:", e?.message || e));
  }

  onConnect() {
    this.log("connected");
    this.pub(this.cfg.topics.watchdogLwt, "online", { retain: true });

    this.client.subscribe([this.cfg.watchTopic, this.cfg.topics.ack, this.cfg.topics.status], { qos: this.cfg.qos });

    // Start "seen now" after reboot to avoid immediate trigger.
    this.lastSeenMs = nowMs();

    setInterval(() => this.tick(), 2000);
    setInterval(() => this.publishState(), 10_000);
  }

  onMessage(topic, msg) {
    const text = msg.toString();

    if (topic === this.cfg.watchTopic) {
      this.lastSeenMs = nowMs();
      this.lastPayload = text;

      if (this.cfg.treatOfflinePayloadAsFailure && text.trim().toLowerCase() === "offline") {
        this.log(`watchTopic payload OFFLINE → accelerate trigger`);
        this.lastSeenMs = nowMs() - this.cfg.triggerAfterMs - 1;
      }
      return;
    }

    if (topic === this.cfg.topics.ack) {
      this.handleAck(text);
      return;
    }

    if (topic === this.cfg.topics.status) {
      this.handleStatus(text);
      return;
    }
  }

  tick() {
    const now = nowMs();
    const missingMs = now - this.lastSeenMs;

    // pending request: wait for ack or timeout
    if (this.pending) {
      const age = now - this.pending.sentAtMs;
      if (age > this.cfg.ackTimeoutMs) {
        this.log(`ack timeout for ${this.pending.requestId}`);
        this.pending = null;

        this.backoff.markFail();
        const extra = this.backoff.nextDelayMs();
        this.nextAllowedActionMs = now + extra;
        this.log(`backoff: next action in ${Math.round(extra/1000)}s`);
      }
      return;
    }

    // cooldown guard
    if (now < this.nextAllowedActionMs) return;

    // trigger if missing too long
    if (missingMs > this.cfg.triggerAfterMs) {
      this.sendRebootRequest(missingMs);
    } else if (missingMs > this.cfg.warnAfterMs) {
      // optional: soft warning (no spam)
    }
  }

  sendRebootRequest(missingMs) {
    const rid = requestId();
    const base = {
      requestId: rid,
      ts: unixTs(),
      reason: "watch_missing",
      watchTopic: this.cfg.watchTopic,
      lastPayload: this.lastPayload,
      missingForSec: Math.round(missingMs / 1000),
      severity: 2
    };

    // Sign base payload deterministically
    const data = stableJson(base);
    const sig = signHmac(this.cfg.hmacSecret, data);

    const envelope = {
      ...base,
      hmac: sig
    };

    this.pub(this.cfg.topics.request, JSON.stringify(envelope));

    this.pending = { requestId: rid, sentAtMs: nowMs() };

    // cooldown immediately
    this.nextAllowedActionMs = nowMs() + this.cfg.cooldownMs;

    this.log(`sent reboot request ${rid} (missing ${envelope.missingForSec}s)`);
  }

  handleAck(text) {
    const ack = safeParse(text);
    if (!ack || !ack.requestId) return;
    if (!this.pending || ack.requestId !== this.pending.requestId) return;

    this.log(`ack for ${ack.requestId}: ${ack.state || "ok"}`);
    this.pending = null;
    this.backoff.markSuccess();
  }

  handleStatus(text) {
    const st = safeParse(text);
    if (!st || !st.requestId) return;
    // if you want: filter by last pending id
    this.log(`status[${st.requestId}]: ${st.state}${st.detail ? " | " + st.detail : ""}`);
  }

  publishState() {
    const missingMs = nowMs() - this.lastSeenMs;
    const state = {
      ts: unixTs(),
      watchTopic: this.cfg.watchTopic,
      missingForSec: Math.round(missingMs / 1000),
      pendingRequestId: this.pending?.requestId || null,
      nextAllowedActionInSec: Math.max(0, Math.round((this.nextAllowedActionMs - nowMs()) / 1000))
    };
    this.pub(this.cfg.topics.watchdogState, JSON.stringify(state), { retain: false });
  }

  pub(topic, payload, opt = {}) {
    this.client.publish(topic, payload, { qos: this.cfg.qos, ...opt });
  }

  log(...args) {
    console.log(new Date().toISOString(), "[WATCHDOG]", ...args);
  }
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

new Watchdog(CFG).start();
