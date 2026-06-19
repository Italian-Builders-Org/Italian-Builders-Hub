import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const source = "Community Form";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...dataRows] = rows.filter((item) =>
    item.some((cell) => cell.trim().length > 0),
  );
  return dataRows.map((cells) =>
    Object.fromEntries(
      headers.map((header, index) => [header, cells[index] ?? ""]),
    ),
  );
}

function text(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeXHandle(value) {
  const trimmed = text(value);
  if (!trimmed) return null;
  if (/^(non|no|-)/i.test(trimmed)) return null;

  const withoutAt = trimmed.replace(/^@+/, "");
  try {
    const url = new URL(
      withoutAt.startsWith("http") ? withoutAt : `https://${withoutAt}`,
    );
    if (
      url.hostname.includes("x.com") ||
      url.hostname.includes("twitter.com")
    ) {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }
  } catch {
    // Fall through to plain-handle cleanup.
  }

  return (
    withoutAt
      .split(/\s|\?/)[0]
      .replace(/[^\w.-]/g, "")
      .trim() || null
  );
}

function parseTimestamp(value) {
  const match = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/,
  );
  if (!match) return new Date().toISOString();
  const [, month, day, year, hour, minute, second] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(
    2,
    "0",
  )}:${minute}:${second}+02:00`;
}

function fallbackName(email, xHandle) {
  if (xHandle) return xHandle;
  return (
    email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .trim() || email
  );
}

function mapRow(row) {
  const email = text(row["Email Address"])?.toLowerCase();
  if (!email) return null;

  const xHandle = normalizeXHandle(row["Handle X / profilo principale"]);
  const submittedName = text(
    row["Nome e cognome da usare se apparirai nel sito/directory"],
  );
  const name =
    submittedName && !/^no$/i.test(submittedName)
      ? submittedName
      : fallbackName(email, xHandle);

  return {
    name,
    email,
    role:
      text(row["Quale ambito descrive meglio il tuo ruolo principale?"]) ||
      text(row["Quale descrizione ti rappresenta meglio oggi?"]) ||
      "Community member",
    building: text(row["Cosa stai costruendo oggi?"]),
    x_handle: xHandle,
    source,
    created_at: parseTimestamp(row.Timestamp ?? ""),
  };
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

loadEnvFile(".env.local");

const csvPath = process.argv[2];
const csv =
  csvPath && csvPath !== "-"
    ? readFileSync(csvPath, "utf8")
    : await readStdin();
const rows = parseCsv(csv).map(mapRow).filter(Boolean);

if (!rows.length) {
  throw new Error("No waitlist rows found in CSV input.");
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const emails = rows.map((row) => row.email);
const { data: existingRows, error: existingError } = await supabase
  .from("waitlist_signups")
  .select("email")
  .in("email", emails);
if (existingError) throw existingError;

const existingEmails = new Set((existingRows ?? []).map((row) => row.email));
const insertRows = rows.filter((row) => !existingEmails.has(row.email));
const updateRows = rows.filter((row) => existingEmails.has(row.email));

if (insertRows.length > 0) {
  const { error } = await supabase.from("waitlist_signups").insert(insertRows);
  if (error) throw error;
}

for (const row of updateRows) {
  const { error } = await supabase
    .from("waitlist_signups")
    .update({
      name: row.name,
      role: row.role,
      building: row.building,
      x_handle: row.x_handle,
      source: row.source,
    })
    .eq("email", row.email);
  if (error) throw error;
}

console.log(
  JSON.stringify(
    {
      source,
      read: rows.length,
      inserted: insertRows.length,
      updated: updateRows.length,
    },
    null,
    2,
  ),
);
