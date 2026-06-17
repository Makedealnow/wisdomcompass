import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const situation = String(req.body?.situation || "").trim().slice(0, 3000);

    if (!situation) {
      return res.status(400).json({ error: "Please describe your situation first." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key is not configured in Vercel." });
    }

    const prompt = `
You are Wisdom, a biblical decision-guidance assistant.

Provide guidance based on biblical principles, biblical stories, and King James Version scripture references.

Rules:
- Do not claim to speak for God.
- Do not provide legal, medical, mental health, financial, or emergency advice.
- If the user describes danger, abuse, self-harm, or urgent crisis, tell them to contact emergency services or a qualified professional immediately.
- Use a calm, compassionate, practical tone.
- Keep the answer organized and easy to read.
- Use scripture references, but do not quote long passages.

Return exactly this structure:

Biblical Principle:
...

Related Biblical Story:
...

King James Version Scripture References:
...

Plain-Language Guidance:
...

Next Wise Step:
...

Disclaimer:
This is spiritual and biblical guidance only. It is not legal, medical, mental health, financial, or emergency advice.

User situation:
${situation}
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 900
    });

    return res.status(200).json({
      guidance: response.output_text || "No guidance was generated. Please try again."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "The guidance service is temporarily unavailable. Please try again."
    });
  }
}
