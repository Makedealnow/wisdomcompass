import OpenAI from "openai";
import { readFileSync } from "node:fs";

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

Taxes / Government / Civic Duty:
Topics: rendering what is owed, honesty, conscience, submission to authority, God's claim above all, restitution.
Passages/stories: Matthew 22:21; Romans 13:6-7; Matthew 17:27; 1 Peter 2:13-17; Luke 19:8; Jesus and the tribute coin (Matthew 22); the temple tax coin from the fish (Matthew 17:24-27); Zacchaeus repaying fourfold (Luke 19).

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

Marriage / Choosing and Beginning Well:
Topics: covenant by design, choosing a spouse by character, readiness, wise counsel, one flesh, shared direction in faith.
Passages/stories: Genesis 2:24; Proverbs 18:22; Proverbs 31:10; Ecclesiastes 4:9-12; 1 Corinthians 13:4-7; Song of Solomon 8:7; Ephesians 5:21-33; Ruth and Boaz (Ruth 2-4); Isaac and Rebekah (Genesis 24). Use this topic when the question is about getting married, engagement, or choosing a spouse — not for divorce or marriage trouble.
`;

// ---- Local guidance engine (mirrors the on-page library in guidance.html) ----
// Used whenever no OPENAI_API_KEY is configured, and as the error fallback.
// Data and scoring are kept identical to the page so both paths answer alike.
const TOPIC_GUIDES = [
  {
    name: "Marriage — Choosing and Beginning Well",
    keywords: ["getting married", "get married", "should i marry", "marry my", "marry her", "marry him", "proposal", "propose to", "engaged", "engagement", "fiance", "fiancee", "wedding", "dating", "boyfriend", "girlfriend", "choose a spouse", "future wife", "future husband", "marriage"],
    themes: ["covenant by design", "choosing wisely", "one flesh", "love as Scripture defines it", "wise counsel and readiness"],
    principle: "Marriage in Scripture is not a contract to escape but a covenant to enter with open eyes. God designed it from the beginning — a man and a woman leaving, cleaving, and becoming one flesh — and calls finding a spouse a good thing and a favor from the Lord. The biblical emphasis at the threshold is character over chemistry: the kind of person someone is — virtue, honesty, faith, diligence, self-control — will matter every day for decades, long after the wedding day. Wise entry means counsel, honesty about faith, money, and family, and enough time to see who this person is under pressure — because you marry the person they are, not the person you hope they will become.",
    stories: [
      "Genesis 2 sets the pattern before there was a single wedding ceremony: the man leaves his father and mother, cleaves to his wife, and the two become one flesh. Marriage is presented as God's own design — a new household, a permanent bond, and a oneness meant to be protected from the very start.",
      "Ruth and Boaz (Ruth 2–4) is a study in choosing and being chosen well. Ruth's loyalty and diligence were known all over town; Boaz was a man of standing who acted honorably at every step — no games, no shortcuts, everything done openly at the city gate with witnesses. Their marriage began in redemption and became a link in the line of David.",
      "Isaac and Rebekah (Genesis 24) came together through prayer, counsel, and a servant watching for character. The sign Abraham's servant prayed for was not beauty first but kindness — Rebekah watered the camels of a stranger, work nobody required of her. Character shown to strangers is character you can trust at home."
    ],
    references: ["Genesis 2:24", "Proverbs 18:22", "Proverbs 31:10", "Ecclesiastes 4:9-12", "1 Corinthians 13:4-7", "Song of Solomon 8:7", "Ephesians 5:21-33", "Proverbs 11:14"],
    questions: ["Am I choosing this person's character as it is today — or a version of them I hope marriage will produce?", "Have we talked honestly about faith, money, children, family, and the hard years — or mostly about the wedding?", "What do the people who know me best, and know them, actually say — and have I let myself hear it?", "Are we pulling in the same direction in faith and life, or am I hoping one of us will change later?", "If a wise friend described my exact situation to me, what would I tell them?"],
    next: "Slow the decision down enough for counsel and honesty: talk through faith, money, family, and the future with open eyes, listen to the people who love you, and treat character — theirs and yours — as the main question."
  },
  {
    name: "Marriage, Divorce, Separation, Covenant",
    keywords: ["divorce", "divorced", "separate", "separation", "marriage", "married", "husband", "wife", "spouse", "adultery", "affair", "abuse", "unsafe", "separated", "cheating", "cheated", "unfaithful", "custody", "leaving my husband", "leaving my wife", "separating", "falling apart", "unhappy", "miserable"],
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
    keywords: ["mortgage", "house", "buy", "purchase", "debt", "loan", "money", "finance", "investment", "business", "price", "payment", "invest", "credit card", "budget", "afford", "bills", "save money", "savings account", "monthly payment"],
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
    keywords: ["lend", "lending", "loan", "borrow", "borrower", "co-sign", "cosign", "owes me", "pay me back", "lend money", "family member", "relative", "loan money", "borrow money", "lend my", "lending money"],
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
    keywords: ["afraid", "fear", "anxious", "anxiety", "worry", "worried", "scared", "panic", "terrified", "nervous", "overwhelmed", "sleepless", "fearful", "stress", "stressed"],
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
    keywords: ["grief", "grieving", "died", "death", "passed away", "funeral", "widow", "widower", "mourning", "miscarriage", "comfort", "sorrow", "loss", "my dad died", "my mom died", "my father died", "my mother died", "lost my father", "lost my mother", "lost my husband", "lost my wife", "lost my son", "lost my daughter", "lost my mom", "lost my dad", "loss of my husband", "loss of my wife", "death of", "terminal", "hospice", "cancer"],
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
    keywords: ["parenting", "discipline", "train up", "raising my", "raising our", "my child", "my children", "my kids", "teenager", "toddler", "homeschool", "prodigal", "rebellious", "pregnant", "pregnancy", "have a baby", "first child", "new baby", "child", "children", "kids"],
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
    name: "Taxes, Government, and Civic Duty",
    keywords: ["tax", "taxes", "taxpayer", "irs", "internal revenue", "pay taxes", "paying taxes", "file taxes", "tax return", "government", "authorities", "obey the law", "caesar", "render unto", "civic", "citizen", "tribute"],
    themes: ["rendering what is owed", "honesty", "conscience", "submission to authority", "God's claim above all"],
    principle: "Scripture answers the tax question directly. Jesus, handed the tribute question as a trap, answered: render unto Caesar the things that are Caesar's, and unto God the things that are God's — Caesar's claim is real but limited; God's is total. Jesus also paid the temple tax he was exempt from, 'lest we should offend them.' Paul treats paying taxes as a matter of conscience, not mere compliance: the authorities are God's servants for order, and the believer renders to all their dues — tribute, custom, respect, honor — honestly and without cheating. The biblical question is never really whether to render what is owed; it is whether we do it honestly, and whether we remember whose we ultimately are.",
    stories: [
      "When the Pharisees tried to trap Jesus with the tax question — either answer costs him — he asked for the coin, pointed to Caesar's image stamped on it, and split the claims cleanly: Caesar gets his coin back; God gets everything that bears God's image, which is you (Matthew 22).",
      "Jesus told Peter he was exempt from the temple tax — 'then are the children free' — and paid it anyway, with a coin from a fish's mouth, 'lest we should offend them' (Matthew 17). He paid what he did not strictly owe, for the sake of peace and witness.",
      "Zacchaeus was a chief tax collector who had grown rich cheating people on their taxes. Meeting Jesus did not make him argue about the rates; it made him give half his goods to the poor and repay everyone he had cheated fourfold (Luke 19). Honesty about money owed, in both directions, is what repentance looked like for the man closest to the tax system."
    ],
    references: ["Matthew 22:21", "Romans 13:6-7", "Matthew 17:27", "1 Peter 2:13-17", "Luke 19:8"],
    questions: ["Am I asking whether I owe this, or looking for permission not to pay what I know I owe?", "Is my return honest in every line — income, deductions, and the figures I hope no one checks?", "Do I render grudgingly and resentfully, or as a matter of conscience before God?", "Where the law allows a legitimate deduction or appeal, am I using it openly — and where I have underpaid or cheated, have I made it right?"],
    next: "Pay what is owed, file honestly, use legitimate deductions and appeals in the open, and make any past cheating right. If an amount or an assessment looks wrong, dispute it through the proper channels rather than quietly not paying."
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
  const words = lower.split(/[^a-z0-9-]+/);
  return guide.keywords.reduce((n, k) => {
    if (!lower.includes(k)) return n;
    if (k.includes(" ")) return n + 4;
    return n + (words.includes(k) ? 3 : 2);
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

// ---- Whole-Bible search (Milestone 2) ----
// Jeff's locked pipeline, with no AI and no internet material anywhere in the
// output: the question is prepared into concepts locally, the concepts are
// matched against Nave's topical index and a full-text scan of the whole KJV,
// and the matched material is compared (TSK cross-reference reinforcement) and
// assembled into the same answer shape the guide engine returns. The guides
// remain the fast path for questions they answer confidently (score >= 4);
// everything else is answered by this search instead of the old General
// Wisdom fallback. Data lives in ../data/ (public-domain KJV text, Nave's
// topics, TSK cross-references, and a concept index built from Nave's entry
// text) and is loaded lazily on the first search-path request, so guide-path
// requests never pay the parse/index cost.

function stem(w) {
  w = w.replace(/'s$/, "").replace(/'$/, "");
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s")) return w.slice(0, -1);
  return w;
}
const QUESTION_STOP = new Set(("should would could shall will what when where which who whom whose why how is are was were be been being " +
  "do does did done i me my we our you your he she it its they them their the a an and or but if then than to of in on at for with by from about into " +
  "not no bible scripture scriptures verse verses say says said tell tells god lord jesus christ let get stop being go going want wants need needs " +
  "make makes keep keeps help please really just can may might must am an's declare christian christians acceptable think thinks know").split(" "));
const SYNONYMS = {
  bankruptcy: ["debt", "debtor", "surety", "borrow", "insolvent"],
  bankrupt: ["debt", "debtor"],
  jealou: ["jealousy", "envy"],
  envy: ["jealousy"],
  cremation: ["burial"],
  cremate: ["burial"],
  dishonest: ["fraud", "deceit", "falsehood"],
  partner: ["companion", "fellowship"],
  busines: ["commerce", "trade", "merchandise"],
  stranger: ["foreigner", "alien", "sojourner"],
  kid: ["child", "children"],
  succes: ["prosperity", "riches"],
  coworker: ["companion", "fellowship"],
  boss: ["master", "ruler"],
  fired: ["dismiss", "servant"],
  drink: ["drunkenness", "wine"],
  drunk: ["drunkenness"],
  angry: ["anger"],
};
function conceptsOf(question) {
  const raw = String(question || "").toLowerCase().match(/[a-z0-9']+/g) || [];
  const seen = new Set();
  const concepts = [];
  for (const tok of raw) {
    if (tok.length < 3 || QUESTION_STOP.has(tok)) continue;
    const s = stem(tok);
    if (s.length < 3 || seen.has(s)) continue;
    seen.add(s);
    concepts.push({ stem: s, word: tok, direct: true });
    for (const syn of SYNONYMS[s] || []) {
      const ss = stem(syn);
      if (!seen.has(ss)) { seen.add(ss); concepts.push({ stem: ss, word: syn, direct: false }); }
    }
  }
  return concepts;
}

// Nave's prints some headings inverted ("Priest, High", "Dead, The"). Display
// names are de-inverted here, in the displayed text only; the underlying data
// and all matching keep the original headings.
function displayTopicName(name) {
  let depth = 0, idx = -1;
  for (let i = 0; i < name.length - 1; i++) {
    const ch = name[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0 && name[i + 1] === " ") { idx = i; break; }
  }
  if (idx < 0) return name;
  const head = name.slice(0, idx).trim();
  const tail = name.slice(idx + 2).trim();
  if (/^or\b/i.test(tail)) return name;               // "Chosen, Or Elected" reads best as printed
  if (tail.toLowerCase() === "the") return "The " + head; // "Lost, The" -> "The Lost"
  if (/^(of|to|the)\b/i.test(tail)) return head + " " + tail; // "Jesus, the Christ" -> "Jesus the Christ"; "Equality, of Men" -> "Equality of Men"
  return tail + " " + head;                            // "Priest, High" -> "High Priest"
}

// Curated bridges across gaps in Nave's see-also graph. Nave's files the
// Bible's debt-release teaching under "Sabbatic Year" (and its "Release"
// heading is an empty shell with no references), so Debt is bridged to the
// heading that actually carries Deuteronomy 15.
const TOPIC_BRIDGES = { "Debt": ["Sabbatic Year"] };

let SEARCH = null;
function loadSearch() {
  if (SEARCH) return SEARCH;
  const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
  const kjv = load("kjv.json");
  const topicsData = load("topics.json");
  const xref = load("xref.json");
  const entryIndex = load("entry-index.json");

  const topicNameWords = topicsData.topics.map((name) => {
    const words = name.toLowerCase().match(/[a-z']+/g) || [];
    return new Set(words.map(stem).filter((w) => w.length >= 3 && !["the", "of", "and"].includes(w)));
  });
  const topicByName = new Map(topicsData.topics.map((n, i) => [n, i]));

  const verseKeys = Object.keys(kjv);
  const ordinal = new Map(verseKeys.map((k, i) => [k, i]));
  const parsedVerse = verseKeys.map((k) => {
    const m = k.match(/^(.+?) (\d+):(\d+)$/);
    return { book: m[1], ch: +m[2], v: +m[3] };
  });
  const verseStemSets = verseKeys.map((k) => {
    const set = new Set();
    for (const tok of kjv[k].toLowerCase().match(/[a-z']+/g) || []) set.add(stem(tok));
    return set;
  });
  const xrefByVerse = new Map();
  xref.verses.forEach((v, i) => { if (xref.byVerse[i].length) xrefByVerse.set(v, xref.byVerse[i].map((j) => xref.refs[j])); });

  function parseRef(ref) {
    let m = ref.match(/^(.+?) (\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
    if (m) return { book: m[1], ch1: +m[2], v1: +m[3], ch2: m[4] ? +m[4] : +m[2], v2: m[5] ? +m[5] : +m[3], chapterOnly: false };
    m = ref.match(/^(.+?) (\d+)$/);
    if (m) return { book: m[1], ch1: +m[2], v1: 1, ch2: +m[2], v2: 999, chapterOnly: true };
    return null;
  }
  function expandRef(ref, cap = 8) {
    const p = parseRef(ref);
    if (!p) return { verses: [], truncated: false };
    const startKey = `${p.book} ${p.ch1}:${p.v1}`;
    const start = ordinal.get(startKey);
    if (start === undefined) return { verses: [], truncated: false };
    const out = [];
    for (let i = start; i < verseKeys.length && out.length < cap; i++) {
      const pv = parsedVerse[i];
      if (pv.book !== p.book || pv.ch > p.ch2 || (pv.ch === p.ch2 && pv.v > p.v2)) break;
      out.push(verseKeys[i]);
    }
    const last = out.length ? parsedVerse[ordinal.get(out[out.length - 1])] : null;
    const truncated = !last || last.ch < p.ch2 || (last.ch === p.ch2 && last.v < Math.min(p.v2, 900));
    return { verses: out, truncated };
  }
  const firstVerseOf = (ref) => { const p = parseRef(ref); return p ? `${p.book} ${p.ch1}:${p.v1}` : null; };

  // Passage text in the page library's own format (verse number + text, one
  // verse per line) for the passage panel.
  function panelPassageText(ref) {
    const { verses, truncated } = expandRef(ref);
    if (!verses.length) return null;
    const text = verses.map((v) => `${parsedVerse[ordinal.get(v)].v} ${kjv[v]}`).join("\n");
    return truncated ? text + " …" : text;
  }

  function searchAnswer(question) {
    const concepts = conceptsOf(question);
    // topic scoring
    const topicScore = new Map();
    const addScore = (ti, pts) => topicScore.set(ti, (topicScore.get(ti) || 0) + pts);
    for (const c of concepts) {
      const namePts = c.direct ? 12 : 9, entryPts = c.direct ? 4 : 3;
      topicsData.topics.forEach((_, ti) => {
        const words = topicNameWords[ti];
        if (words.has(c.stem)) addScore(ti, namePts);
        else if (c.stem.length >= 5) {
          for (const w of words) if (w.startsWith(c.stem) || c.stem.startsWith(w)) { addScore(ti, namePts - 4); break; }
        }
      });
      for (const ti of entryIndex[c.stem] || []) addScore(ti, entryPts);
    }
    let rankedTopics = [...topicScore.entries()].sort((a, b) => b[1] - a[1]);
    // seeAlso reinforcement from the top two topics
    for (const [ti] of rankedTopics.slice(0, 2)) {
      for (const name of topicsData.seeAlso[ti] || []) {
        const si = topicByName.get(name);
        if (si !== undefined) addScore(si, 4);
      }
    }
    rankedTopics = [...topicScore.entries()].sort((a, b) => b[1] - a[1]);
    const strong = rankedTopics.filter(([, s]) => s >= 9);
    let topTopics = (strong.length ? strong : rankedTopics.filter(([, s]) => s > 0)).slice(0, 3);
    // curated topic bridges (see TOPIC_BRIDGES note above)
    for (const [ti] of [...topTopics]) {
      for (const target of TOPIC_BRIDGES[topicsData.topics[ti]] || []) {
        const bi = topicByName.get(target);
        if (bi !== undefined && !topTopics.some(([t]) => t === bi) && topTopics.length < 4) topTopics.push([bi, 0]);
      }
    }

    // full-text scoring over the whole KJV
    const directStems = concepts.filter((c) => c.direct).map((c) => c.stem);
    const ftScore = new Map();
    verseStemSets.forEach((set, i) => {
      let distinct = 0, hits = 0;
      for (const s of directStems) if (set.has(s)) { distinct++; hits++; }
      if (distinct) ftScore.set(i, { distinct, hits });
    });
    const topVerses = [...ftScore.entries()]
      .sort((a, b) => b[1].distinct - a[1].distinct || b[1].hits - a[1].hits)
      .slice(0, 10);

    // candidate references with combined scores
    const cand = new Map();
    const addCand = (ref, pts) => cand.set(ref, (cand.get(ref) || 0) + pts);
    const topicWeight = [10, 7, 5, 5];
    topTopics.forEach(([ti], r) => {
      for (const ri of topicsData.byTopic[ti].slice(0, 80)) addCand(topicsData.refs[ri], topicWeight[r]);
    });
    for (const [vi, sc] of topVerses) addCand(verseKeys[vi], Math.min(4 + 2 * sc.distinct, 12));

    // comparison step: cross-reference reinforcement (TSK) among candidates
    const candFirstVerses = new Set([...cand.keys()].map(firstVerseOf).filter(Boolean));
    for (const ref of [...cand.keys()]) {
      const fv = firstVerseOf(ref);
      let boost = 0;
      for (const t of xrefByVerse.get(fv) || []) if (candFirstVerses.has(firstVerseOf(t))) boost++;
      if (boost) cand.set(ref, cand.get(ref) + Math.min(boost, 4));
    }
    const byScore = [...cand.entries()]
      .sort((a, b) => b[1] - a[1] || (ordinal.get(firstVerseOf(a[0])) ?? 0) - (ordinal.get(firstVerseOf(b[0])) ?? 0))
      .map(([ref]) => ref);
    // Diversity guarantee: Nave's lists each topic's most general passages
    // first — always carry the first two references of each top topic, then
    // fill remaining slots by score.
    const rankedRefs = [];
    for (const [ti] of topTopics) {
      for (const ri of topicsData.byTopic[ti].slice(0, 2)) {
        const r = topicsData.refs[ri];
        if (!rankedRefs.includes(r)) rankedRefs.push(r);
      }
    }
    for (const r of byScore) {
      if (rankedRefs.length >= 9) break;
      if (!rankedRefs.includes(r)) rankedRefs.push(r);
    }
    if (!rankedRefs.length) return null;

    // assemble the answer in the site's established shape
    // De-inversion can make two distinct Nave's headings display identically
    // (e.g. "Bush, Burning" alongside a literal "Burning Bush") — show each
    // displayed name once.
    const topicNames = [...new Set(topTopics.map(([ti]) => displayTopicName(topicsData.topics[ti])))];
    const themesLine = topicNames.length ? topicNames.join("; ") : "searched across the whole Bible";
    const passages = rankedRefs.slice(0, 3).map((ref) => {
      const { verses, truncated } = expandRef(ref);
      const text = verses.map((v) => kjv[v]).join(" ");
      return { ref, text: text + (truncated ? " …" : "") };
    });
    const panelPassages = {};
    for (const p of passages) {
      const t = panelPassageText(p.ref);
      if (t) panelPassages[p.ref] = { title: `${p.ref} — King James Version`, text: t };
    }
    const [firstRef, secondRef] = rankedRefs;
    const principle =
      `Scripture addresses ${topicNames.length ? topicNames.map((t) => t.toLowerCase()).join(", ") : "this question"} directly, ` +
      `and the passages gathered here come at it from law, wisdom, story, and the teaching of Jesus and the apostles. ` +
      `Read them together rather than one at a time: notice what God commends, what he warns against, and what his people did when they stood where you are standing. ` +
      `The pattern to weigh your decision against is in the whole set — the clearest passages first — not in any single verse pulled out of its context.`;
    const questions = [
      `Which of these passages describes a situation most like mine — and what did faithfulness look like there?`,
      `What do these passages show God commending, and what do they show him warning against?`,
      `If I took the plain teaching of ${firstRef} seriously, what would I do differently this week?`,
    ];
    const guidance =
      `Situation:\n${question}\n\n` +
      `Biblical Topics Found:\n${themesLine}\n\n` +
      `Biblical Principle:\n${principle}\n\n` +
      `Related Biblical Story / Passage:\n${passages.length ? `${passages[0].ref}\n${passages[0].text}` : ""}\n\n` +
      `Additional Biblical Connections:\n${passages.slice(1).map((p) => `${p.ref}\n${p.text}`).join("\n\n")}\n\n` +
      `King James Version Scripture References:\n${rankedRefs.join("; ")}\n\n` +
      `Reflection Questions:\n${questions.map((q) => "- " + q).join("\n")}\n\n` +
      `Plain-Language Guidance:\nSearch the Scriptures above before deciding. Notice the repeated biblical themes: ${topicNames.map((t) => t.toLowerCase()).join(", ")}. Do not treat one verse as a shortcut; compare the whole counsel of Scripture, seek wise counsel, and consider the fruit of each possible path.\n\n` +
      `Next Wise Step:\nRead the passages above in full — start with ${firstRef}${secondRef ? ` and ${secondRef}` : ""} — and pray through them before you decide. Then talk the decision over with a trusted believer who knows your situation, and take the step that best matches the pattern of Scripture you found.\n\n` +
      `Disclaimer:\nWisdomCompass provides spiritual and biblical guidance only. It is not legal, medical, mental health, financial, or emergency advice. For urgent danger, abuse, self-harm, or emergency situations, contact emergency services, a qualified professional, or trusted local help immediately.`;
    return { guidance, passages: panelPassages };
  }

  SEARCH = { searchAnswer };
  return SEARCH;
}

// The guides answer when they are confident (a phrase hit, or stacked word
// hits, per the score the guide engine already computes); a lone generic
// keyword no longer hijacks a question into a guide. Below the bar, the
// whole-Bible search above replaces the old General Wisdom fallback; the
// General guide is still the last resort if the search finds nothing.
const GUIDE_CONFIDENT = 4;
function answerFor(situation) {
  const lower = String(situation || "").toLowerCase();
  let bestScore = 0;
  for (const g of TOPIC_GUIDES) {
    if (g.name === "General Wisdom Decision") continue;
    const s = guideScore(g, lower);
    if (s > bestScore) bestScore = s;
  }
  if (bestScore >= GUIDE_CONFIDENT) return { guidance: localFallback(situation) };
  const r = loadSearch().searchAnswer(situation);
  if (!r) return { guidance: localFallback(situation) };
  return r;
}

// Live AI is OFF by Jeff's decision (Nov 4, 2026): the AI call never succeeded
// in production and only added a long timeout wait before the built-in library
// answered. Every request is served by the local guide engine below — instant
// and free. To re-enable AI later, set AI_ENABLED to true (a working, funded
// OPENAI_API_KEY must be present in the hosting environment).
const AI_ENABLED = false;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const situation = String(req.body?.situation || "").trim().slice(0, 3000);
    if (!situation) return res.status(400).json({ error: "Please describe your situation first." });
    if (!AI_ENABLED || !process.env.OPENAI_API_KEY) return res.status(200).json(answerFor(situation));

    const response = await Promise.race([
      client.responses.create({
      model: "gpt-4.1-mini",
      input: `You are WisdomCompass, a biblical research and decision-guidance assistant. The Bible is the primary authority. Do not return the same generic answer for every question. First identify biblical topics from the user situation. Then search for relevant Bible passages, biblical stories, biblical principles, and cross-reference themes. Use the topical guide below as a reference aid, but choose the most relevant passages for the user's exact situation.\n\n${TOPICAL_GUIDE}\n\nReturn exactly these sections. Use Bible references that can be connected to full passages and commentary links on the page:\nSituation:\nBiblical Topics Found:\nBiblical Principle:\nRelated Biblical Story / Passage:\nAdditional Biblical Connections:\nKing James Version Scripture References:\nPlain-Language Guidance:\nNext Wise Step:\nDisclaimer:\n\nRules:\n- Give specific passages and stories, not generic wisdom verses only.
- In "What the Bible Says About This Situation," summarize how ALL listed passages connect to the user situation, including similar circumstances, meanings, exceptions, qualifications, and alternative actions when Scripture provides them.\n- For divorce/marriage questions, include marriage/divorce passages such as Matthew 19, Mark 10, 1 Corinthians 7, Malachi 2, and related stories if relevant.\n- If abuse, danger, threats, or unsafe conditions are mentioned, say to seek immediate safety and qualified local help.\n- Do not give legal, medical, mental health, financial, or emergency advice.\n- Do not command the user to make a specific life decision. Help them search Scripture and take a wise next step.\n\nUser situation: ${situation}`,
      max_output_tokens: 1100
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("AI request timed out")), 8000))
    ]);
    return res.status(200).json({ guidance: response.output_text || localFallback(situation) });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ guidance: localFallback(String(req.body?.situation || "")) });
  }
}
