export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const query = String(req.body?.query || "").trim();
  if (!query) return res.status(400).json({ error: "Search query is required." });
  return res.status(200).json({
    result: `WisdomCompass searches biblical topics, related passages, stories, and principles. For best results, use the Get Guidance page and describe the decision in a full sentence. Query received: ${query}`
  });
}
