import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const [key, ...value] = line.split("=");
    env[key.trim()] = value.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const fileEnv = loadEnvFile(envPath);
const env = { ...fileEnv, ...process.env };

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
  "WHATSAPP_WORKER_URL",
  "WORKER_API_KEY",
  "CRON_SECRET",
  "NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
  "RECAPTCHA_SECRET_KEY",
];

const optional = ["NEXT_PUBLIC_META_APP_ID", "META_APP_SECRET", "META_CONFIG_ID"];

function hasValue(key) {
  return typeof env[key] === "string" && env[key].trim().length > 0;
}

function printStatus(label, ok, detail = "") {
  const marker = ok ? "OK" : "FAIL";
  console.log(`${marker} ${label}${detail ? ` - ${detail}` : ""}`);
}

async function checkUrl(label, url, headers = {}) {
  if (!url) {
    printStatus(label, false, "missing URL");
    return false;
  }

  try {
    const response = await fetch(url, { headers, redirect: "manual" });
    const ok = response.status >= 200 && response.status < 500;
    printStatus(label, ok, `HTTP ${response.status}`);
    return ok;
  } catch (error) {
    printStatus(label, false, error.message);
    return false;
  }
}

let failed = false;

console.log("Production preflight");
console.log(`Environment file: ${fs.existsSync(envPath) ? ".env.local found" : ".env.local missing"}`);

for (const key of required) {
  const ok = hasValue(key);
  printStatus(`required env ${key}`, ok);
  failed ||= !ok;
}

for (const key of optional) {
  printStatus(`optional env ${key}`, hasValue(key));
}

if (hasValue("NEXT_PUBLIC_RECAPTCHA_SITE_KEY") && env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY.includes("6LeIxAcT")) {
  printStatus("production reCAPTCHA site key", false, "Google test key is configured");
  failed = true;
}

if (hasValue("SUPABASE_URL") && hasValue("NEXT_PUBLIC_SUPABASE_URL")) {
  const same = env.SUPABASE_URL === env.NEXT_PUBLIC_SUPABASE_URL;
  printStatus("Supabase URL consistency", same);
  failed ||= !same;
}

if (hasValue("SUPABASE_URL") && hasValue("SUPABASE_SERVICE_ROLE_KEY")) {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await supabase.from("platform_settings").select("id").limit(1);
    printStatus("Supabase service-role connectivity", !error, error?.message);
    failed ||= Boolean(error);
  } catch (error) {
    printStatus("Supabase service-role connectivity", false, error.message);
    failed = true;
  }
}

if (hasValue("NEXT_PUBLIC_APP_URL")) {
  await checkUrl("app public URL", env.NEXT_PUBLIC_APP_URL);
}

if (hasValue("WHATSAPP_WORKER_URL")) {
  const workerUrl = new URL("/api/status", env.WHATSAPP_WORKER_URL).toString();
  const headers = hasValue("WORKER_API_KEY") ? { "x-api-key": env.WORKER_API_KEY } : {};
  await checkUrl("WhatsApp worker status", workerUrl, headers);
}

if (failed) {
  console.error("Preflight failed. Fix the failed items before going online.");
  process.exit(1);
}

console.log("Preflight passed.");
