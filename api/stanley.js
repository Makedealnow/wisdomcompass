// Anonymous events for the homepage's Charles Stanley recommendation:
// POST { event: "click" } when a visitor follows the In Touch link, and
// POST { event: "rating", value: "up" | "down" } if they later answer
// the return-visit "Was it worth your time?" prompt. One anonymous
// record per event — never attached to a visitor, no identity, no
// request metadata. The counts exist so the owner can judge whether
// featuring an outside message like this is worth doing again. With
// the log unconfigured this endpoint accepts and quietly discards, so
// the homepage never errors.
import { logStanley } from "../lib/sheetlog.js";
import { waitUntil } from "@vercel/functions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  // sendBeacon delivers the JSON as the raw body on some browsers and a
  // pre-parsed object on others; accept either.
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  const event = String(body?.event || "").trim();
  const value = String(body?.value || "").trim();
  if (event !== "click" && event !== "rating") {
    return res.status(400).json({ error: "Invalid event." });
  }
  if (event === "rating" && value !== "up" && value !== "down") {
    return res.status(400).json({ error: "Invalid rating." });
  }
  // Same waitUntil pattern as the question log: the response returns at
  // once, the host keeps the function alive until the append settles,
  // and a logging failure never surfaces to the visitor.
  const pendingLog = logStanley([
    new Date().toISOString(),
    event,
    event === "rating" ? value : "",
  ]);
  try {
    waitUntil(pendingLog);
  } catch {
    /* non-Vercel run: the append still proceeds on its own */
  }
  return res.status(200).json({ ok: true });
}
