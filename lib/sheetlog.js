// Anonymous question-log writer for WisdomCompass (Google Sheets append).
//
// The log is enabled ONLY when all three environment variables are present
// in the hosting environment:
//   WC_QUESTION_LOG_SHEET_ID        — the "WisdomCompass Question Log" sheet
//   WC_GOOGLE_SERVICE_ACCOUNT_EMAIL — a Google service account the sheet is
//                                     shared with (Editor)
//   WC_GOOGLE_PRIVATE_KEY           — that account's private key (PEM; the
//                                     hosting panel's \n escapes are fine)
// With any of them missing, every export here is a silent no-op, so the
// site behaves identically with logging off. Nothing is ever written to
// the repo, and no request metadata (IP, user agent) is ever recorded —
// only the rows the callers build.

const SHEET_ID = process.env.WC_QUESTION_LOG_SHEET_ID || "";
const CLIENT_EMAIL = process.env.WC_GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
const PRIVATE_KEY = (process.env.WC_GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

export const logConfigured = Boolean(SHEET_ID && CLIENT_EMAIL && PRIVATE_KEY);

let tokenCache = { token: "", exp: 0 };
const b64url = (data) =>
  Buffer.from(data).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function accessToken() {
  const { createSign } = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.token && tokenCache.exp > now + 60) return tokenCache.token;
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = b64url(signer.sign(PRIVATE_KEY));
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }),
  });
  if (!resp.ok) throw new Error(`token request failed: ${resp.status}`);
  const data = await resp.json();
  tokenCache = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return tokenCache.token;
}

async function appendRow(tab, values) {
  const token = await accessToken();
  const range = encodeURIComponent(`${tab}!A:Z`);
  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [values] }),
    }
  );
  if (!resp.ok) throw new Error(`sheet append failed: ${resp.status}`);
}

// Each function starts its append and swallows every failure, and returns
// the append's promise. Callers hand that promise to Vercel's waitUntil:
// on a serverless host the process can freeze the moment the response is
// sent, which silently kills a bare fire-and-forget append (confirmed in
// production, Nov 4, 2026 — answers carried a logId but no row landed).
// waitUntil keeps the function alive until the append settles WITHOUT
// delaying the answer, and a logging failure still never surfaces.
export function logQuestion(values) {
  if (!logConfigured) return Promise.resolve();
  return appendRow("Questions", values).catch(() => {});
}

export function logFeedback(values) {
  if (!logConfigured) return Promise.resolve();
  return appendRow("Feedback", values).catch(() => {});
}
