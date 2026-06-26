import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOPICAL_GUIDE = `
WISDOMCOMPASS BIBLE SEARCH TOPICS

Marriage / Divorce / Separation:
Topics: marriage covenant, divorce, reconciliation, adultery, abandonment, hardness of heart, peace, protection, wise counsel, repentance, forgiveness, abuse/safety.
Primary passages: Matthew 19:3-9; Mark 10:2-12; 1 Corinthians 7:10-16; Malachi 2:14-16; Ephesians 5:21-33; Proverbs 15:1; Proverbs 11:14; James 1:5.
Related stories/passages: Jesus teaching on divorce; Abigail and Nabal (1 Samuel 25); Hosea and Gomer; Joseph forgiving his brothers (Genesis 50:15-21) when forgiveness is central.
Safety rule: If the user mentions abuse, danger, threats, violence, or being unsafe, include a clear next step to seek immediate safety and qualified local help. Do not tell them to remain in danger.

Career / Work / Job Offer:
Topics: calling, provision, integrity, diligence, wise counsel, family impact.
Passages/stories: Joseph in Egypt (Genesis 41); Daniel in Babylon (Daniel 1); Proverbs 3:5-6; Proverbs 11:14; Colossians 3:23; Proverbs 22:29.

Money / Debt / Mortgage / Business / Major Purchase:
Topics: stewardship, debt caution, counting cost, contentment, planning, avoiding greed or fear.
Passages/stories: Luke 14:28-30; Proverbs 22:7; Proverbs 21:5; 1 Timothy 6:6-10; Joseph preparing for famine (Genesis 41); Proverbs 15:22.

Retirement / Later Life Planning:
Topics: stewardship, purpose, provision, family responsibility, wisdom with age.
Passages/stories: Psalm 90:12; Proverbs 16:31; Genesis 41:34-36; 1 Timothy 5:8; Proverbs 21:5; Ecclesiastes 3:1; Moses' later calling.

Relationship Conflict / Forgiveness / Family:
Topics: forgiveness, truth, reconciliation, humility, boundaries, peace.
Passages/stories: Joseph forgiving brothers (Genesis 50:15-21); Matthew 18:15-17; Ephesians 4:31-32; Romans 12:18; Proverbs 15:1; James 1:19-20.

General Decision Wisdom:
Topics: prayer, wise counsel, patience, motives, fruit, obedience.
Passages/stories: Solomon asks for wisdom (1 Kings 3); James 1:5; Proverbs 3:5-6; Proverbs 11:14; Proverbs 15:22; Galatians 5:22-23; Psalm 119:105.
`;

function localFallback(situation) {
  const s = situation.toLowerCase();
  if (/(divorce|separat|marriage|married|husband|wife|spouse|adultery|affair|abuse|unsafe)/.test(s)) {
    return `Situation:\n${situation}\n\nBiblical Topics Found:\nmarriage covenant; divorce; reconciliation; truth; repentance; forgiveness; wise counsel; peace; safety\n\nBiblical Principle:\nBiblical wisdom treats marriage as a serious covenant before God while also calling people to truth, repentance, wise counsel, peace, and protection from danger. A divorce decision should not be made from anger, fear, pressure, or pride, and it should not ignore serious sin, abandonment, abuse, or safety concerns.\n\nRelated Biblical Story / Passage:\nJesus' teaching on marriage and divorce points people back to God's design for covenant faithfulness while also acknowledging human hardness of heart.\n\nAdditional Biblical Connections:\nAbigail and Nabal shows wisdom, courage, restraint, and protection in a deeply difficult household situation.\nHosea and Gomer illustrates covenant faithfulness and painful mercy, while also showing that broken relationships involve real sin and consequences.\n\nKing James Version Scripture References:\nMatthew 19:3-9; Mark 10:2-12; 1 Corinthians 7:10-16; Malachi 2:14-16; Ephesians 5:21-33; Proverbs 15:1; Proverbs 11:14; James 1:5\n\nPlain-Language Guidance:\nDo not use one verse as a shortcut. Search the full biblical witness on marriage, covenant, sin, repentance, safety, peace, and wise counsel. If there is danger or abuse, safety comes first. If there is no immediate danger, slow down and seek trusted pastoral and qualified counsel before making a life-changing decision.\n\nNext Wise Step:\nIf there is danger, get to safety and contact appropriate help immediately. If there is no immediate danger, read Matthew 19, 1 Corinthians 7, and Malachi 2; write down the real issues; seek trusted counsel; and avoid deciding from fear, anger, pride, or pressure.\n\nDisclaimer:\nWisdomCompass provides spiritual and biblical guidance only. It is not legal, medical, mental health, financial, or emergency advice. For urgent danger, abuse, self-harm, or emergency situations, contact emergency services, a qualified professional, or trusted local help immediately.`;
  }
  return `Situation:\n${situation}\n\nBiblical Topics Found:\nwisdom; prayer; counsel; patience; motives; fruit; obedience\n\nBiblical Principle:\nBiblical wisdom begins with humility before God, prayer, patience, wise counsel, examining motives, and considering the likely fruit of a decision.\n\nRelated Biblical Story / Passage:\nSolomon asked God for wisdom before leading others, showing that sound decisions begin with dependence on God rather than pride.\n\nKing James Version Scripture References:\nJames 1:5; Proverbs 3:5-6; Proverbs 11:14; Proverbs 15:22; Galatians 5:22-23; Psalm 119:105\n\nPlain-Language Guidance:\nSlow down and search Scripture for the specific topics involved in your decision. Ask what choice reflects wisdom, love, truth, patience, responsibility, and obedience to God.\n\nNext Wise Step:\nPray, read the listed scriptures, seek trusted counsel, and avoid making the decision from fear, anger, pride, or pressure.\n\nDisclaimer:\nWisdomCompass provides spiritual and biblical guidance only. It is not legal, medical, mental health, financial, or emergency advice.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const situation = String(req.body?.situation || "").trim().slice(0, 3000);
    if (!situation) return res.status(400).json({ error: "Please describe your situation first." });
    if (!process.env.OPENAI_API_KEY) return res.status(200).json({ guidance: localFallback(situation) });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `You are WisdomCompass, a biblical research and decision-guidance assistant. The Bible is the primary authority. Do not return the same generic answer for every question. First identify biblical topics from the user situation. Then search for relevant Bible passages, biblical stories, biblical principles, and cross-reference themes. Use the topical guide below as a reference aid, but choose the most relevant passages for the user's exact situation.\n\n${TOPICAL_GUIDE}\n\nReturn exactly these sections:\nSituation:\nBiblical Topics Found:\nBiblical Principle:\nRelated Biblical Story / Passage:\nAdditional Biblical Connections:\nKing James Version Scripture References:\nPlain-Language Guidance:\nNext Wise Step:\nDisclaimer:\n\nRules:\n- Give specific passages and stories, not generic wisdom verses only.\n- For divorce/marriage questions, include marriage/divorce passages such as Matthew 19, Mark 10, 1 Corinthians 7, Malachi 2, and related stories if relevant.\n- If abuse, danger, threats, or unsafe conditions are mentioned, say to seek immediate safety and qualified local help.\n- Do not give legal, medical, mental health, financial, or emergency advice.\n- Do not command the user to make a specific life decision. Help them search Scripture and take a wise next step.\n\nUser situation: ${situation}`,
      max_output_tokens: 1100
    });
    return res.status(200).json({ guidance: response.output_text || localFallback(situation) });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ guidance: localFallback(String(req.body?.situation || "")) });
  }
}
