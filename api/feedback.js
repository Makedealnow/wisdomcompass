// Satisfaction thumbs for a WisdomCompass answer: POST { logId, helpful,
// hoping? } — one anonymous record per tap, attached to the question's log
// record by its per-question logId (never to a visitor). A thumbs-down may
// arrive twice for the same question: first the tap itself, then the
// optional "What were you hoping for?" text; the weekly digest prefers the
// record that carries the text. With the question log unconfigured this
// endpoint accepts and quietly discards, so the thumbs never error.
import { logFeedback } from "../lib/sheetlog.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const logId = String(req.body?.logId || "").trim().slice(0, 64);
  const helpful = req.body?.helpful;
  if (!logId || (helpful !== true && helpful !== false)) {
    return res.status(400).json({ error: "Invalid feedback." });
  }
  const hoping = String(req.body?.hoping || "").trim().slice(0, 1000);
  try {
    logFeedback([new Date().toISOString(), logId, helpful ? "yes" : "no", hoping]);
  } catch {
    /* feedback must never surface an error to the visitor */
  }
  return res.status(200).json({ ok: true });
}
