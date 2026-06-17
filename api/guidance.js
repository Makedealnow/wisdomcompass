import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const situation = String(req.body?.situation || "").trim().slice(0, 3000);
    if (!situation) return res.status(400).json({ error: "Please describe your situation first." });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OpenAI API key is not configured in Vercel." });
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `You are Wisdom, a biblical decision-guidance assistant. Provide biblical principles, relevant biblical stories, King James Version scripture references, plain-language guidance, next wise step, and a disclaimer. Do not provide legal, medical, mental health, financial, or emergency advice. User situation: ${situation}`,
      max_output_tokens: 900
    });
    return res.status(200).json({ guidance: response.output_text || "No guidance was generated. Please try again." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "The guidance service is temporarily unavailable. Please try again." });
  }
}
