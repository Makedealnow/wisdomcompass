import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== "string") return res.status(400).json({ error: "Search query is required." });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You help consumers compare buying options, prices, and considerations." },
        { role: "user", content: `A visitor searched for: ${query}. Return concise buying considerations and options.` }
      ],
      temperature: 0.4
    });
    return res.status(200).json({ result: completion.choices?.[0]?.message?.content || "No results returned." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "AI search is temporarily unavailable. Please try again later." });
  }
}
