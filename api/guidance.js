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

Lending / Borrowing / Family Money:
Topics: generosity with wisdom, mercy, clear expectations, protecting the relationship, stewardship.
Passages/stories: Luke 6:34-35; Psalm 37:21; Deuteronomy 15:7-8; Proverbs 22:7; Proverbs 19:17; Matthew 5:42; Psalm 112:5; Nehemiah 5 (lending among brothers); 2 Kings 4 (the widow's debt).

Fear / Anxiety / Worry:
Topics: trust, peace, God's presence, prayer, one day at a time, courage.
Passages/stories: Philippians 4:6-7; Isaiah 41:10; Psalm 56:3-4; 2 Timothy 1:7; Joshua 1:9; Matthew 6:33-34; Jehoshaphat (2 Chronicles 20); Jesus in Gethsemane.

Grief / Loss / Comfort:
Topics: God's nearness in sorrow, honest lament, hope, comfort that becomes comfort for others.
Passages/stories: Psalm 34:18; John 11:33-35 (Jesus wept); 2 Corinthians 1:3-4; Revelation 21:4; Matthew 5:4; Job's friends sitting in silence (Job 2:13).

Parenting / Raising Children:
Topics: training with patience, instruction woven into daily life, discipline without provoking, children as a heritage, the long view.
Passages/stories: Proverbs 22:6; Deuteronomy 6:6-7; Ephesians 6:4; Psalm 127:3; Proverbs 29:17; Eli's sons (1 Samuel 2-3); Lois and Eunice (2 Timothy 1:5); the prodigal's father (Luke 15).
`;

// ---- Local guidance engine (mirrors the on-page library in guidance.html) ----
// Used whenever no OPENAI_API_KEY is configured, and as the error fallback.
// Data and scoring are kept identical to the page so both paths answer alike.
const TOPIC_GUIDES = [
  {
    name: "Marriage, Divorce, Separation, Covenant",
    keywords: ["divorce", "divorced", "separate", "separation", "marriage", "married", "husband", "wife", "spouse", "adultery", "affair", "abuse", "unsafe", "separated", "cheating", "cheated", "unfaithful", "custody", "leaving my husband", "leaving my wife"],
    themes: ["marriage covenant", "truth", "repentance", "forgiveness", "wise counsel", "peace", "safety", "hardness of heart"],
    principle: "Biblical wisdom treats marriage as a serious covenant before God, while also calling people to truth, repentance, peace, wise counsel, and protection from danger. A decision about divorce should not be made from anger, fear, pressure, or pride, and it should not ignore serious sin, abandonment, abuse, or safety concerns.",
    stories: [
      "Jesus' teaching on marriage and divorce points people back to God's design for covenant faithfulness while also acknowledging human hardness of heart.",
      "Abigail and Nabal shows wisdom, courage, restraint, and protection in a deeply difficult household situation.",
      "Hosea and Gomer illustrates covenant faithfulness and painful mercy, while also showing that broken relationships involve real sin and consequences."
    ],
    references: ["Matthew 19:3-9", "Mark 10:2-12", "1 Corinthians 7:10-16", "Malachi 2:14-16", "Ephesians 5:21-33", "Proverbs 15:1", "Proverbs 11:14", "James 1:5"],
    questions: ["Is there immediate danger or abuse that requires safety and outside help?", "Has there been adultery, abandonment, repeated betrayal, or refusal to repent?", "Have you sought wise, godly, qualified counsel rather than deciding alone?", "Are you seeking truth and protection, or reacting from anger and pressure?"],
    next: "If there is danger, get to safety and contact appropriate help immediately. If there is no immediate danger, slow down, pray, read the listed passages, seek trusted pastoral and qualified professional counsel, and avoid making a final decision in isolation."
  },
  {
    name: "Career, Job Offer, Work",
    keywords: ["job", "offer", "career", "boss", "work", "promotion", "quit", "resign", "salary", "relocate", "employment", "fired", "laid off", "layoff", "promoted", "quit my job", "offer letter", "new job", "job offer", "coworker", "workplace"],
    themes: ["calling", "provision", "wise counsel", "diligence", "stewardship", "family impact"],
    principle: "Biblical wisdom considers provision, integrity, diligence, wise counsel, family responsibility, and whether a choice draws you toward faithfulness rather than only toward money or status.",
    stories: ["Joseph's work in Egypt shows faithfulness, preparation, and wise stewardship under pressure.", "Daniel's service in Babylon shows integrity while working inside a difficult system."],
    references: ["Proverbs 3:5-6", "Proverbs 11:14", "Colossians 3:23", "Genesis 41:33-40", "Daniel 1:8-20"],
    questions: ["Does this opportunity strengthen or weaken your integrity?", "How will it affect your family, responsibilities, and spiritual life?", "Have you sought counsel from people who know your situation?"],
    next: "List the tradeoffs clearly, pray for wisdom, seek counsel, and compare the offer against faithfulness, responsibility, and long-term fruit."
  },
  {
    name: "Money, Debt, Mortgage, Major Purchase",
    keywords: ["mortgage", "house", "buy", "purchase", "debt", "loan", "money", "finance", "investment", "business", "price", "payment", "credit card", "budget", "afford", "bills", "save money", "savings account", "monthly payment"],
    themes: ["stewardship", "debt caution", "contentment", "counting the cost", "wise planning"],
    principle: "Biblical wisdom calls for stewardship, counting the cost, avoiding presumption, and refusing to let fear, greed, or pressure control financial decisions.",
    stories: ["Jesus' teaching about counting the cost warns against beginning what you cannot finish.", "Joseph's preparation before famine shows planning, saving, and stewardship."],
    references: ["Luke 14:28-30", "Proverbs 22:7", "Proverbs 21:5", "1 Timothy 6:6-10", "Genesis 41:33-40", "Proverbs 11:14"],
    questions: ["Have you counted the full cost, not just the monthly payment?", "Is pressure or fear driving the decision?", "What counsel have you received from people who understand the financial risk?"],
    next: "Slow down, calculate the full cost, compare obligations, seek wise counsel, and do not move forward just because of pressure or excitement."
  },
  {
    name: "Retirement, Later Life, Planning",
    keywords: ["retire", "retirement", "pension", "social security", "older", "later life", "quit working", "401k", "retiring", "fixed income", "medicare"],
    themes: ["stewardship", "purpose", "provision", "family responsibility", "wisdom with age"],
    principle: "Biblical wisdom treats later-life decisions as stewardship decisions, not merely comfort decisions. Retirement planning should consider provision, purpose, family responsibilities, generosity, and faithful use of remaining years.",
    stories: ["Joseph's preparation for famine shows wise planning before a future season arrives.", "Moses' later years show that age does not remove purpose or calling."],
    references: ["Psalm 90:12", "Genesis 41:33-40", "1 Timothy 6:6-10", "Proverbs 21:5"],
    questions: ["Is this decision financially responsible?", "What purpose and service remain after retirement?", "Have you considered family, health, and long-term provision?"],
    next: "Count the cost, seek counsel, pray for wisdom, and make a plan that balances provision, purpose, and responsibility."
  },
  {
    name: "Relationship Conflict, Forgiveness, Family",
    keywords: ["relationship", "family", "forgive", "forgiveness", "conflict", "argue", "anger", "parent", "child", "friend", "betrayal", "argument", "apologize", "boundary", "boundaries", "mother-in-law", "father-in-law", "sibling", "neighbor", "bitter", "resent"],
    themes: ["forgiveness", "truth", "reconciliation", "humility", "boundaries", "peace"],
    principle: "Biblical wisdom calls for humility, truth, forgiveness, repentance, and peacemaking, while not pretending that sin, harm, or repeated betrayal should be ignored.",
    stories: ["Joseph forgiving his brothers shows mercy without denying real wrongdoing.", "Jacob and Esau's reunion shows humility and reconciliation after long conflict."],
    references: ["Genesis 50:15-21", "Matthew 18:15-17", "Ephesians 5:21-33", "Romans 12:18", "Proverbs 15:1", "James 1:5"],
    questions: ["What truth needs to be spoken plainly?", "What repentance or change is needed?", "Are you confusing forgiveness with pretending nothing happened?"],
    next: "Pray, slow your speech, seek peace where possible, and get wise counsel if the conflict is serious or recurring."
  },
  {
    name: "Lending, Borrowing, and Family Money",
    keywords: ["lend", "lending", "loan", "borrow", "borrower", "co-sign", "cosign", "owes me", "pay me back", "lend money", "family member", "relative", "loan money", "borrow money"],
    themes: ["generosity with wisdom", "mercy", "clear expectations", "protecting the relationship", "stewardship"],
    principle: "Biblical wisdom holds generosity and caution together. Scripture commends lending to a brother in need and even giving without demanding return, and it also warns plainly that borrowing creates bondage and that unpaid debts poison relationships. The wise pattern is to decide beforehand whether this is a loan you will enforce or a gift you can release, to lend only what your own household can carry, and to put expectations in the open before money changes hands — because unclear money between family members is how small loans become lasting wounds.",
    stories: [
      "Nehemiah confronted the nobles of Judah for charging their own brothers interest and taking their fields as pledges (Nehemiah 5). He did not treat lending among family as a mere business matter: he called it back to mercy, made the leaders restore what they had taken, and the people kept their word — the relationships of the whole community were repaired.",
      "The widow in 2 Kings 4 came to Elisha crushed by a creditor coming for her sons. The way out began with what she already had in the house and ended with the debt paid and enough left to live on — a picture of God opening a path out of debt bondage rather than deeper into it.",
      "Jesus taught his followers to lend expecting nothing back (Luke 6:35) — not as carelessness, but as a heart free enough that the loan cannot own the relationship."
    ],
    references: ["Luke 6:34-35", "Psalm 37:21", "Deuteronomy 15:7-8", "Proverbs 22:7", "Proverbs 19:17", "Matthew 5:42", "Psalm 112:5", "Proverbs 11:14"],
    questions: ["Could you give this amount as a gift and never mention it again? If not, is it wise to call it a loan?", "What exactly are the terms — amount, purpose, and when it comes back — and are they written down where both of you can see them?", "What will this do to the relationship if it is never repaid?", "Is this loan helping the person change the pattern, or funding the pattern that put them here?", "What does your own household need first, before this money leaves it?"],
    next: "Decide in advance whether it is a gift or a loan, lend only what your household can carry, write the terms down together, and get wise counsel before money changes hands."
  },
  {
    name: "Fear, Anxiety, and Worry",
    keywords: ["afraid", "fear", "anxious", "anxiety", "worry", "worried", "scared", "panic", "terrified", "nervous", "overwhelmed", "sleepless", "fearful"],
    themes: ["trust", "peace", "God's presence", "prayer", "one day at a time", "courage"],
    principle: "Scripture never treats fear as a small thing or answers it with a slogan. Again and again the pattern is presence before outcome: God says 'fear not' not because the danger is imaginary, but because the person facing it is not alone. The biblical way through anxiety is to bring the fear honestly to God in prayer, take the next faithful step in front of you, and leave tomorrow's weight with tomorrow.",
    stories: [
      "David wrote Psalm 56 in a season when he had been seized by enemies: 'What time I am afraid, I will trust in thee.' His trust was not denial — he named the danger and chose where to put his weight.",
      "When Jehoshaphat faced an army he could not beat, he prayed one of the most honest prayers in Scripture: 'We do not know what to do, but our eyes are on you' (2 Chronicles 20). Judah's part was to stand and trust while God fought the battle.",
      "Jesus in Gethsemane was 'sorrowful and very heavy' before the cross. He prayed honestly, asked for the cup to pass, and then submitted to the Father's will — proof that anguish and faith are not opposites."
    ],
    references: ["Philippians 4:6-7", "Isaiah 41:10", "Psalm 56:3-4", "2 Timothy 1:7", "Joshua 1:9", "Matthew 6:33-34", "James 1:5"],
    questions: ["What exactly am I afraid will happen — and what has God actually promised, versus what I am imagining?", "Is this fear pointing at a real step I should take, or asking me to carry a tomorrow that has not come?", "Who knows I am carrying this? Fear grows in the dark — who can stand with me?", "What is the next faithful step — just the next one — in front of me today?"],
    next: "Name the fear plainly, bring it to God in prayer, tell one trusted person, and take only the next faithful step today."
  },
  {
    name: "Grief, Loss, and Comfort",
    keywords: ["grief", "grieving", "died", "death", "passed away", "lost my", "loss of", "funeral", "widow", "widower", "mourning", "miscarriage", "my dad died", "my mom died", "my father died", "my mother died", "lost my father", "lost my mother", "lost my husband", "lost my wife", "lost my son", "lost my daughter", "death of", "terminal", "hospice", "cancer"],
    themes: ["God's nearness in sorrow", "honest lament", "hope", "comfort that becomes comfort for others", "presence over explanations"],
    principle: "The Bible does not rush grief or scold it. God is described as near to the brokenhearted, Jesus wept at his friend's grave even knowing resurrection was minutes away, and a large share of the Psalms are laments — honest sorrow prayed out loud. The biblical pattern is to grieve truthfully, grieve in God's presence and in the company of people who will sit with you, and let hope be an anchor rather than a demand to feel better.",
    stories: [
      "Jesus stood at the tomb of Lazarus and wept (John 11), though he was about to raise him. The shortest verse in the Bible gives grieving people permanent permission: tears are not a failure of faith.",
      "Job's friends did their best work in the seven days they sat with him in silence (Job 2:13). Their speeches made things worse; their presence had made things bearable. Grief usually needs presence more than explanations.",
      "David poured out laments that swing between anguish and trust, sometimes in the same psalm. Scripture kept those prayers in the book — evidence that God would rather hear honest sorrow than polite silence."
    ],
    references: ["Psalm 34:18", "John 11:33-35", "2 Corinthians 1:3-4", "Revelation 21:4", "Matthew 5:4", "Psalm 119:105"],
    questions: ["Am I letting myself grieve honestly, or performing strength for other people?", "Who will simply sit with me in this — and have I let them?", "What decisions can wait until the fog lifts, and which truly cannot?", "Where is God in this, as I actually experience it — and can I pray that honestly?"],
    next: "Slow every non-essential decision down, stay close to people who will sit with you, and bring the sorrow to God honestly rather than carrying it alone."
  },
  {
    name: "Parenting and Raising Children",
    keywords: ["parenting", "discipline", "train up", "raising my", "raising our", "my child", "my children", "my kids", "teenager", "toddler", "homeschool", "prodigal", "rebellious"],
    themes: ["training with patience", "instruction woven into daily life", "discipline without provoking", "children as a heritage", "the long view"],
    principle: "Scripture treats children as a heritage and a trust, not a project to control. The pattern is training woven into ordinary life — teaching on the road, at the table, at bedtime — with discipline that is firm, consistent, and careful never to provoke a child to despair. Parents aim at the heart over the long years, remembering that the same God who entrusts children to parents also gives parents grace for the many days they get it wrong.",
    stories: [
      "Eli the priest was a sincere man whose sons grew corrupt while he restrained them too little (1 Samuel 2–3) — a sobering picture of how avoiding hard correction is itself a decision, with consequences for the whole household.",
      "Timothy's faith was kindled at home by his grandmother Lois and his mother Eunice (2 Timothy 1:5) — quiet, ordinary faithfulness across two generations shaping the life of a young leader.",
      "The father in Jesus' parable of the prodigal son (Luke 15) neither chased the boy nor locked the door. He watched the road, ran to meet him, and restored him before the apology was finished — strength and mercy in the same man."
    ],
    references: ["Proverbs 22:6", "Deuteronomy 6:6-7", "Ephesians 6:4", "Psalm 127:3", "Proverbs 29:17", "Proverbs 15:1"],
    questions: ["Am I aiming at my child's heart and character, or only at quiet behavior in the moment?", "Is my discipline consistent and calm — or driven by my embarrassment and temper?", "What am I modeling daily that my child will copy far more than what I say?", "Where do I need counsel from parents further down this road?"],
    next: "Slow down, aim at the heart rather than the moment, keep discipline firm and calm, and seek counsel from parents whose grown children you respect."
  },
  {
    name: "General Wisdom Decision",
    keywords: [],
    themes: ["wisdom", "prayer", "counsel", "fruit", "patience", "obedience"],
    principle: "Biblical wisdom begins with humility before God, prayer, patience, wise counsel, examining motives, and looking at the likely fruit of a decision.",
    stories: ["Solomon asked God for wisdom before leading others, showing that sound decisions begin with dependence on God rather than pride."],
    references: ["James 1:5", "Proverbs 3:5-6", "Proverbs 11:14", "Galatians 5:22-23", "Psalm 119:105"],
    questions: ["What motive is driving this decision?", "What counsel have you sought?", "What fruit will this likely produce?"],
    next: "Pray, read the listed scriptures, seek trusted counsel, and avoid deciding from fear, anger, pride, or pressure."
  }
];

function guideScore(guide, lower) {
  return guide.keywords.reduce((n, k) => {
    if (!lower.includes(k)) return n;
    return n + (k.includes(" ") ? 4 : (k.length >= 6 ? 2 : 1));
  }, 0);
}
function selectGuide(text) {
  const lower = String(text || "").toLowerCase();
  const general = TOPIC_GUIDES[TOPIC_GUIDES.length - 1];
  let best = general, bestScore = 0;
  for (const guide of TOPIC_GUIDES) {
    if (guide === general) continue;
    const score = guideScore(guide, lower);
    if (score > bestScore) { best = guide; bestScore = score; }
  }
  return bestScore >= 2 ? best : general;
}

function localFallback(situation) {
  const guide = selectGuide(situation);
  return `Situation:\n${situation}\n\nBiblical Topics Found:\n${guide.themes.join("; ")}\n\nBiblical Principle:\n${guide.principle}\n\nRelated Biblical Story / Passage:\n${guide.stories[0]}\n\nAdditional Biblical Connections:\n${guide.stories.slice(1).join("\n")}\n\nKing James Version Scripture References:\n${guide.references.join("; ")}\n\nReflection Questions:\n${guide.questions.map(q => "- " + q).join("\n")}\n\nPlain-Language Guidance:\nSearch the Scriptures above before deciding. Notice the repeated biblical themes: ${guide.themes.join(", ")}. Do not treat one verse as a shortcut; compare the whole counsel of Scripture, seek wise counsel, and consider the fruit of each possible path.\n\nNext Wise Step:\n${guide.next}\n\nDisclaimer:\nWisdomCompass provides spiritual and biblical guidance only. It is not legal, medical, mental health, financial, or emergency advice. For urgent danger, abuse, self-harm, or emergency situations, contact emergency services, a qualified professional, or trusted local help immediately.`;
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
      input: `You are WisdomCompass, a biblical research and decision-guidance assistant. The Bible is the primary authority. Do not return the same generic answer for every question. First identify biblical topics from the user situation. Then search for relevant Bible passages, biblical stories, biblical principles, and cross-reference themes. Use the topical guide below as a reference aid, but choose the most relevant passages for the user's exact situation.\n\n${TOPICAL_GUIDE}\n\nReturn exactly these sections. Use Bible references that can be connected to full passages and commentary links on the page:\nSituation:\nBiblical Topics Found:\nBiblical Principle:\nRelated Biblical Story / Passage:\nAdditional Biblical Connections:\nKing James Version Scripture References:\nPlain-Language Guidance:\nNext Wise Step:\nDisclaimer:\n\nRules:\n- Give specific passages and stories, not generic wisdom verses only.
- In "What the Bible Says About This Situation," summarize how ALL listed passages connect to the user situation, including similar circumstances, meanings, exceptions, qualifications, and alternative actions when Scripture provides them.\n- For divorce/marriage questions, include marriage/divorce passages such as Matthew 19, Mark 10, 1 Corinthians 7, Malachi 2, and related stories if relevant.\n- If abuse, danger, threats, or unsafe conditions are mentioned, say to seek immediate safety and qualified local help.\n- Do not give legal, medical, mental health, financial, or emergency advice.\n- Do not command the user to make a specific life decision. Help them search Scripture and take a wise next step.\n\nUser situation: ${situation}`,
      max_output_tokens: 1100
    });
    return res.status(200).json({ guidance: response.output_text || localFallback(situation) });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ guidance: localFallback(String(req.body?.situation || "")) });
  }
}
