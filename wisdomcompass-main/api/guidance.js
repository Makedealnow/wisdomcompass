import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
function localFallback(situation){return `Situation:
${situation}

Decision Frame:
- Clarify the real decision.
- Separate facts from emotions, fear, anger, pride, and pressure.
- Consider family, finances, reputation, responsibility, and long-term consequences.
- Seek wise counsel before major decisions.

Wisdom Questions:
- What is true?
- Who is affected?
- What option best reflects wisdom, responsibility, courage, and integrity?
- What would this decision look like in one year?

Values Check:
Guided by timeless wisdom. Grounded in faith. Committed to God, Family, and Country.

Next Wise Step:
Write down the top two options, the cost of each, and one trusted person to ask for counsel before acting.

Disclaimer:
WisdomCompass provides informational decision guidance only. It is not legal, medical, mental health, financial, or emergency advice.`}
export default async function handler(req,res){if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"})}try{const situation=String(req.body?.situation||"").trim().slice(0,3000);if(!situation)return res.status(400).json({error:"Please describe your situation first."});if(!process.env.OPENAI_API_KEY)return res.status(200).json({guidance:localFallback(situation)});const response=await client.responses.create({model:"gpt-4.1-mini",max_output_tokens:900,input:`You are WisdomCompass, a practical decision-guidance assistant. Position the brand as a trusted decision-guidance media platform. Lead with practical wisdom, clarity, responsibility, family impact, integrity, courage, truth, and long-term consequences. The foundation is timeless Biblical principles, but do not make the answer feel like a Bible-search app or devotional. Do not quote long Bible passages. Do not command a final decision. If there is danger, abuse, self-harm, emergency, legal, medical, financial, or mental-health risk, tell the user to seek qualified local help or emergency services.

Return exactly these sections:
Situation:
Decision Frame:
Wisdom Questions:
Values Check:
Next Wise Step:
Disclaimer:

User situation: ${situation}`});return res.status(200).json({guidance:response.output_text||localFallback(situation)})}catch(error){console.error(error);return res.status(200).json({guidance:localFallback(String(req.body?.situation||""))})}}