const situationInput = document.getElementById("situation");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const resultBox = document.getElementById("result");
const saveBtn = document.getElementById("saveBtn");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const guidanceDisclaimer = document.getElementById("guidanceDisclaimer");
const guidanceTool = document.getElementById("guidanceTool");
const agreeDisclaimerBtn = document.getElementById("agreeDisclaimerBtn");

let latestGuidance = "";
let latestRenderedText = "";

const PASSAGES = {
  "Matthew 19:3-9": {
    title: "Matthew 19:3-9 — King James Version",
    text: `3 The Pharisees also came unto him, tempting him, and saying unto him, Is it lawful for a man to put away his wife for every cause?
4 And he answered and said unto them, Have ye not read, that he which made them at the beginning made them male and female,
5 And said, For this cause shall a man leave father and mother, and shall cleave to his wife: and they twain shall be one flesh?
6 Wherefore they are no more twain, but one flesh. What therefore God hath joined together, let not man put asunder.
7 They say unto him, Why did Moses then command to give a writing of divorcement, and to put her away?
8 He saith unto them, Moses because of the hardness of your hearts suffered you to put away your wives: but from the beginning it was not so.
9 And I say unto you, Whosoever shall put away his wife, except it be for fornication, and shall marry another, committeth adultery: and whoso marrieth her which is put away doth commit adultery.`
  },
  "Mark 10:2-12": {
    title: "Mark 10:2-12 — King James Version",
    text: `2 And the Pharisees came to him, and asked him, Is it lawful for a man to put away his wife? tempting him.
3 And he answered and said unto them, What did Moses command you?
4 And they said, Moses suffered to write a bill of divorcement, and to put her away.
5 And Jesus answered and said unto them, For the hardness of your heart he wrote you this precept.
6 But from the beginning of the creation God made them male and female.
7 For this cause shall a man leave his father and mother, and cleave to his wife;
8 And they twain shall be one flesh: so then they are no more twain, but one flesh.
9 What therefore God hath joined together, let not man put asunder.
10 And in the house his disciples asked him again of the same matter.
11 And he saith unto them, Whosoever shall put away his wife, and marry another, committeth adultery against her.
12 And if a woman shall put away her husband, and be married to another, she committeth adultery.`
  },
  "1 Corinthians 7:10-16": {
    title: "1 Corinthians 7:10-16 — King James Version",
    text: `10 And unto the married I command, yet not I, but the Lord, Let not the wife depart from her husband:
11 But and if she depart, let her remain unmarried or be reconciled to her husband: and let not the husband put away his wife.
12 But to the rest speak I, not the Lord: If any brother hath a wife that believeth not, and she be pleased to dwell with him, let him not put her away.
13 And the woman which hath an husband that believeth not, and if he be pleased to dwell with her, let her not leave him.
14 For the unbelieving husband is sanctified by the wife, and the unbelieving wife is sanctified by the husband: else were your children unclean; but now are they holy.
15 But if the unbelieving depart, let him depart. A brother or a sister is not under bondage in such cases: but God hath called us to peace.
16 For what knowest thou, O wife, whether thou shalt save thy husband? or how knowest thou, O man, whether thou shalt save thy wife?`
  },
  "Malachi 2:14-16": {
    title: "Malachi 2:14-16 — King James Version",
    text: `14 Yet ye say, Wherefore? Because the LORD hath been witness between thee and the wife of thy youth, against whom thou hast dealt treacherously: yet is she thy companion, and the wife of thy covenant.
15 And did not he make one? Yet had he the residue of the spirit. And wherefore one? That he might seek a godly seed. Therefore take heed to your spirit, and let none deal treacherously against the wife of his youth.
16 For the LORD, the God of Israel, saith that he hateth putting away: for one covereth violence with his garment, saith the LORD of hosts: therefore take heed to your spirit, that ye deal not treacherously.`
  },
  "Ephesians 5:21-33": {
    title: "Ephesians 5:21-33 — King James Version",
    text: `21 Submitting yourselves one to another in the fear of God.
22 Wives, submit yourselves unto your own husbands, as unto the Lord.
23 For the husband is the head of the wife, even as Christ is the head of the church: and he is the saviour of the body.
24 Therefore as the church is subject unto Christ, so let the wives be to their own husbands in every thing.
25 Husbands, love your wives, even as Christ also loved the church, and gave himself for it;
26 That he might sanctify and cleanse it with the washing of water by the word,
27 That he might present it to himself a glorious church, not having spot, or wrinkle, or any such thing; but that it should be holy and without blemish.
28 So ought men to love their wives as their own bodies. He that loveth his wife loveth himself.
29 For no man ever yet hated his own flesh; but nourisheth and cherisheth it, even as the Lord the church:
30 For we are members of his body, of his flesh, and of his bones.
31 For this cause shall a man leave his father and mother, and shall be joined unto his wife, and they two shall be one flesh.
32 This is a great mystery: but I speak concerning Christ and the church.
33 Nevertheless let every one of you in particular so love his wife even as himself; and the wife see that she reverence her husband.`
  },
  "Proverbs 15:1": { title: "Proverbs 15:1 — King James Version", text: `1 A soft answer turneth away wrath: but grievous words stir up anger.` },
  "Proverbs 11:14": { title: "Proverbs 11:14 — King James Version", text: `14 Where no counsel is, the people fall: but in the multitude of counsellors there is safety.` },
  "James 1:5": { title: "James 1:5 — King James Version", text: `5 If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.` },
  "Proverbs 3:5-6": { title: "Proverbs 3:5-6 — King James Version", text: `5 Trust in the LORD with all thine heart; and lean not unto thine own understanding.
6 In all thy ways acknowledge him, and he shall direct thy paths.` },
  "Colossians 3:23": { title: "Colossians 3:23 — King James Version", text: `23 And whatsoever ye do, do it heartily, as to the Lord, and not unto men;` },
  "Genesis 41:33-40": { title: "Genesis 41:33-40 — King James Version", text: `33 Now therefore let Pharaoh look out a man discreet and wise, and set him over the land of Egypt.
34 Let Pharaoh do this, and let him appoint officers over the land, and take up the fifth part of the land of Egypt in the seven plenteous years.
35 And let them gather all the food of those good years that come, and lay up corn under the hand of Pharaoh, and let them keep food in the cities.
36 And that food shall be for store to the land against the seven years of famine, which shall be in the land of Egypt; that the land perish not through the famine.
37 And the thing was good in the eyes of Pharaoh, and in the eyes of all his servants.
38 And Pharaoh said unto his servants, Can we find such a one as this is, a man in whom the Spirit of God is?
39 And Pharaoh said unto Joseph, Forasmuch as God hath shewed thee all this, there is none so discreet and wise as thou art:
40 Thou shalt be over my house, and according unto thy word shall all my people be ruled: only in the throne will I be greater than thou.` },
  "Daniel 1:8-20": { title: "Daniel 1:8-20 — King James Version", text: `8 But Daniel purposed in his heart that he would not defile himself with the portion of the king's meat, nor with the wine which he drank...
17 As for these four children, God gave them knowledge and skill in all learning and wisdom...
20 And in all matters of wisdom and understanding, that the king enquired of them, he found them ten times better than all the magicians and astrologers that were in all his realm.` },
  "Luke 14:28-30": { title: "Luke 14:28-30 — King James Version", text: `28 For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?
29 Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him,
30 Saying, This man began to build, and was not able to finish.` },
  "Proverbs 22:7": { title: "Proverbs 22:7 — King James Version", text: `7 The rich ruleth over the poor, and the borrower is servant to the lender.` },
  "Proverbs 21:5": { title: "Proverbs 21:5 — King James Version", text: `5 The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.` },
  "1 Timothy 6:6-10": { title: "1 Timothy 6:6-10 — King James Version", text: `6 But godliness with contentment is great gain.
7 For we brought nothing into this world, and it is certain we can carry nothing out.
8 And having food and raiment let us be therewith content.
9 But they that will be rich fall into temptation and a snare...
10 For the love of money is the root of all evil...` },
  "Psalm 90:12": { title: "Psalm 90:12 — King James Version", text: `12 So teach us to number our days, that we may apply our hearts unto wisdom.` },
  "Genesis 50:15-21": { title: "Genesis 50:15-21 — King James Version", text: `15 And when Joseph's brethren saw that their father was dead, they said, Joseph will peradventure hate us...
19 And Joseph said unto them, Fear not: for am I in the place of God?
20 But as for you, ye thought evil against me; but God meant it unto good...
21 Now therefore fear ye not: I will nourish you, and your little ones. And he comforted them, and spake kindly unto them.` },
  "Matthew 18:15-17": { title: "Matthew 18:15-17 — King James Version", text: `15 Moreover if thy brother shall trespass against thee, go and tell him his fault between thee and him alone...
16 But if he will not hear thee, then take with thee one or two more...
17 And if he shall neglect to hear them, tell it unto the church...` },
  "Romans 12:18": { title: "Romans 12:18 — King James Version", text: `18 If it be possible, as much as lieth in you, live peaceably with all men.` },
  "Galatians 5:22-23": { title: "Galatians 5:22-23 — King James Version", text: `22 But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,
23 Meekness, temperance: against such there is no law.` },
  "Psalm 119:105": { title: "Psalm 119:105 — King James Version", text: `105 Thy word is a lamp unto my feet, and a light unto my path.` }
};



const COMMENTARY = {
  "Matthew 19:3-9": {
    url: "https://biblehub.com/commentaries/matthew/19-3.htm",
    meaning: "Jesus answers a divorce question by returning to God's creation design for marriage, covenant union, and the seriousness of putting away a spouse.",
    concepts: ["marriage covenant", "hardness of heart", "faithfulness", "serious counsel before separation"],
    relation: "For a divorce question, this passage should be read first because Jesus directly addresses marriage and divorce rather than giving a generic wisdom principle."
  },
  "Mark 10:2-12": {
    url: "https://biblehub.com/commentaries/mark/10-2.htm",
    meaning: "Mark records Jesus pointing beyond legal loopholes to God's original intent for marriage and warning against casual divorce.",
    concepts: ["God's design", "covenant seriousness", "hardness of heart", "responsibility"],
    relation: "This helps the user slow down and examine whether the decision is being driven by faithfulness, truth, safety, repentance, or hardened conflict."
  },
  "1 Corinthians 7:10-16": {
    url: "https://biblehub.com/commentaries/1_corinthians/7-10.htm",
    meaning: "Paul gives pastoral instruction about separation, reconciliation, unbelieving spouses, abandonment, and peace.",
    concepts: ["reconciliation", "separation", "abandonment", "peace", "pastoral counsel"],
    relation: "This is especially relevant when the situation involves separation, an unbelieving spouse, abandonment, or whether peace remains possible."
  },
  "Malachi 2:14-16": {
    url: "https://biblehub.com/commentaries/malachi/2-14.htm",
    meaning: "Malachi rebukes treachery against the wife of one's covenant and warns against dealing faithlessly.",
    concepts: ["covenant", "faithfulness", "treachery", "spiritual accountability"],
    relation: "This passage helps frame divorce not merely as a preference decision, but as a covenant and faithfulness issue before God."
  },
  "Ephesians 5:21-33": {
    url: "https://biblehub.com/commentaries/ephesians/5-21.htm",
    meaning: "Paul describes marriage through mutual submission, sacrificial love, and the picture of Christ and the church.",
    concepts: ["sacrificial love", "humility", "mutual responsibility", "Christlike service"],
    relation: "This passage helps a person evaluate the health, duties, failures, and spiritual direction of a marriage relationship."
  },
  "Proverbs 15:1": {
    url: "https://biblehub.com/commentaries/proverbs/15-1.htm",
    meaning: "A gentle answer can de-escalate anger, while harsh speech intensifies conflict.",
    concepts: ["speech", "conflict", "anger", "peace-making"],
    relation: "This passage is useful when the decision is being shaped by arguments, resentment, or heated conflict."
  },
  "Proverbs 11:14": {
    url: "https://biblehub.com/commentaries/proverbs/11-14.htm",
    meaning: "Wise counsel protects people from falling into avoidable harm.",
    concepts: ["counsel", "safety", "humility", "decision-making"],
    relation: "This points the user away from deciding alone and toward trusted, qualified counsel."
  },
  "James 1:5": {
    url: "https://biblehub.com/commentaries/james/1-5.htm",
    meaning: "God invites those who lack wisdom to ask Him in faith.",
    concepts: ["prayer", "wisdom", "dependence on God", "humility"],
    relation: "This passage frames the whole decision process as seeking God's wisdom rather than reacting from pressure."
  },
  "Proverbs 3:5-6": {
    url: "https://biblehub.com/commentaries/proverbs/3-5.htm",
    meaning: "Trusting the Lord means refusing to rely only on one's limited understanding.",
    concepts: ["trust", "guidance", "surrender", "direction"],
    relation: "This helps the user examine whether the decision is being made in prayerful trust or self-reliance."
  },
  "Colossians 3:23": {
    url: "https://biblehub.com/commentaries/colossians/3-23.htm",
    meaning: "Work should be done sincerely as service to the Lord, not merely for human approval.",
    concepts: ["work", "integrity", "calling", "service"],
    relation: "This helps career decisions focus on integrity and faithfulness, not only salary or status."
  },
  "Genesis 41:33-40": {
    url: "https://biblehub.com/commentaries/genesis/41-33.htm",
    meaning: "Joseph recommends wise planning and stewardship before a coming crisis.",
    concepts: ["planning", "stewardship", "leadership", "preparation"],
    relation: "This passage helps financial, business, retirement, and planning decisions focus on foresight and responsibility."
  },
  "Daniel 1:8-20": {
    url: "https://biblehub.com/commentaries/daniel/1-8.htm",
    meaning: "Daniel resolves to remain faithful while serving in a foreign and pressured environment.",
    concepts: ["conviction", "integrity", "workplace pressure", "faithfulness"],
    relation: "This helps a job or career decision examine whether the opportunity compromises convictions."
  },
  "Luke 14:28-30": {
    url: "https://biblehub.com/commentaries/luke/14-28.htm",
    meaning: "Jesus uses the image of building a tower to teach counting the cost before beginning.",
    concepts: ["counting the cost", "planning", "prudence", "finishing well"],
    relation: "This is directly relevant to mortgages, business starts, debt, purchases, and major commitments."
  },
  "Proverbs 22:7": {
    url: "https://biblehub.com/commentaries/proverbs/22-7.htm",
    meaning: "Debt creates obligations and can limit freedom.",
    concepts: ["debt", "financial caution", "stewardship", "risk"],
    relation: "This helps the user weigh whether a purchase or loan will create unhealthy financial bondage."
  },
  "Proverbs 21:5": {
    url: "https://biblehub.com/commentaries/proverbs/21-5.htm",
    meaning: "Diligent planning tends toward provision, while haste tends toward lack.",
    concepts: ["planning", "patience", "diligence", "avoiding haste"],
    relation: "This warns against rushed decisions driven by emotion, sales pressure, or fear of missing out."
  },
  "1 Timothy 6:6-10": {
    url: "https://biblehub.com/commentaries/1_timothy/6-6.htm",
    meaning: "Paul warns that greed and discontent can lead people into spiritual danger.",
    concepts: ["contentment", "greed", "money", "temptation"],
    relation: "This helps financial decisions examine motives, not just numbers."
  },
  "Psalm 90:12": {
    url: "https://biblehub.com/commentaries/psalms/90-12.htm",
    meaning: "Moses asks God to teach us to number our days so we gain wisdom.",
    concepts: ["time", "mortality", "wisdom", "purpose"],
    relation: "This is useful for retirement and life-stage decisions because it frames time as stewardship before God."
  },
  "Genesis 50:15-21": {
    url: "https://biblehub.com/commentaries/genesis/50-15.htm",
    meaning: "Joseph forgives his brothers while acknowledging that real evil occurred and that God worked through it.",
    concepts: ["forgiveness", "providence", "truth", "mercy"],
    relation: "This helps relationship decisions distinguish forgiveness from denial and revenge from wisdom."
  },
  "Matthew 18:15-17": {
    url: "https://biblehub.com/commentaries/matthew/18-15.htm",
    meaning: "Jesus gives a process for addressing sin directly and with witnesses when needed.",
    concepts: ["confrontation", "reconciliation", "accountability", "church counsel"],
    relation: "This helps conflict decisions move from private frustration to a wise, accountable process."
  },
  "Romans 12:18": {
    url: "https://biblehub.com/commentaries/romans/12-18.htm",
    meaning: "Paul calls believers to pursue peace as far as it depends on them.",
    concepts: ["peace", "responsibility", "limits", "relationships"],
    relation: "This helps the user seek peace without pretending they control another person's choices."
  },
  "Galatians 5:22-23": {
    url: "https://biblehub.com/commentaries/galatians/5-22.htm",
    meaning: "The fruit of the Spirit shows the character that should mark a wise and godly path.",
    concepts: ["fruit", "character", "Spirit-led decisions", "self-control"],
    relation: "This helps test the likely fruit of a decision and the spirit in which it is being made."
  },
  "Psalm 119:105": {
    url: "https://biblehub.com/commentaries/psalms/119-105.htm",
    meaning: "God's word gives light for the next step, not always every future detail.",
    concepts: ["Scripture", "guidance", "obedience", "next step"],
    relation: "This helps the user focus on the next faithful step rather than demanding full certainty first."
  }
};

function commentaryForRef(ref) {
  return COMMENTARY[ref] || {
    url: "https://biblehub.com/commentaries/",
    meaning: "Use the linked commentary and cross references to study the passage in context.",
    concepts: ["context", "biblical meaning", "cross references", "wise application"],
    relation: "Compare this passage with the user's situation carefully before applying it."
  };
}

function renderPassageBlock(ref) {
  const passage = PASSAGES[ref];
  if (!passage) return "";
  const c = commentaryForRef(ref);
  const conceptList = c.concepts.map(item => `<li>${escapeHTML(item)}</li>`).join("");
  return `<h4>${escapeHTML(passage.title)}</h4>
    <pre>${escapeHTML(passage.text)}</pre>
    <div class="commentary-panel simple-study-notes">
      <section class="study-note-block">
        <h5>Key Biblical Concepts</h5>
        <ul>${conceptList}</ul>
      </section>
      <section class="study-note-block">
        <h5>Meaning of the Passage</h5>
        <p>${escapeHTML(c.meaning)}</p>
      </section>
      <section class="study-note-block">
        <h5>How This Relates to Your Situation</h5>
        <p>${escapeHTML(c.relation)}</p>
      </section>
    </div>`;
}

const TOPIC_GUIDES = [
  {
    name: "Marriage, Divorce, Separation, Covenant",
    keywords: ["divorce", "divorced", "separate", "separation", "marriage", "married", "husband", "wife", "spouse", "adultery", "affair", "abuse", "unsafe"],
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
    keywords: ["job", "offer", "career", "boss", "work", "promotion", "quit", "resign", "salary", "relocate", "employment"],
    themes: ["calling", "provision", "wise counsel", "diligence", "stewardship", "family impact"],
    principle: "Biblical wisdom considers provision, integrity, diligence, wise counsel, family responsibility, and whether a choice draws you toward faithfulness rather than only toward money or status.",
    stories: ["Joseph's work in Egypt shows faithfulness, preparation, and wise stewardship under pressure.", "Daniel's service in Babylon shows integrity while working inside a difficult system."],
    references: ["Proverbs 3:5-6", "Proverbs 11:14", "Colossians 3:23", "Genesis 41:33-40", "Daniel 1:8-20"],
    questions: ["Does this opportunity strengthen or weaken your integrity?", "How will it affect your family, responsibilities, and spiritual life?", "Have you sought counsel from people who know your situation?"],
    next: "List the tradeoffs clearly, pray for wisdom, seek counsel, and compare the offer against faithfulness, responsibility, and long-term fruit."
  },
  {
    name: "Money, Debt, Mortgage, Major Purchase",
    keywords: ["mortgage", "house", "buy", "purchase", "debt", "loan", "money", "finance", "investment", "business", "price", "payment"],
    themes: ["stewardship", "debt caution", "contentment", "counting the cost", "wise planning"],
    principle: "Biblical wisdom calls for stewardship, counting the cost, avoiding presumption, and refusing to let fear, greed, or pressure control financial decisions.",
    stories: ["Jesus' teaching about counting the cost warns against beginning what you cannot finish.", "Joseph's preparation before famine shows planning, saving, and stewardship."],
    references: ["Luke 14:28-30", "Proverbs 22:7", "Proverbs 21:5", "1 Timothy 6:6-10", "Genesis 41:33-40", "Proverbs 11:14"],
    questions: ["Have you counted the full cost, not just the monthly payment?", "Is pressure or fear driving the decision?", "What counsel have you received from people who understand the financial risk?"],
    next: "Slow down, calculate the full cost, compare obligations, seek wise counsel, and do not move forward just because of pressure or excitement."
  },
  {
    name: "Retirement, Later Life, Planning",
    keywords: ["retire", "retirement", "pension", "social security", "older", "later life", "quit working"],
    themes: ["stewardship", "purpose", "provision", "family responsibility", "wisdom with age"],
    principle: "Biblical wisdom treats later-life decisions as stewardship decisions, not merely comfort decisions. Retirement planning should consider provision, purpose, family responsibilities, generosity, and faithful use of remaining years.",
    stories: ["Joseph's preparation for famine shows wise planning before a future season arrives.", "Moses' later years show that age does not remove purpose or calling."],
    references: ["Psalm 90:12", "Genesis 41:33-40", "1 Timothy 6:6-10", "Proverbs 21:5"],
    questions: ["Is this decision financially responsible?", "What purpose and service remain after retirement?", "Have you considered family, health, and long-term provision?"],
    next: "Count the cost, seek counsel, pray for wisdom, and make a plan that balances provision, purpose, and responsibility."
  },
  {
    name: "Relationship Conflict, Forgiveness, Family",
    keywords: ["relationship", "family", "forgive", "forgiveness", "conflict", "argue", "anger", "parent", "child", "friend", "betrayal"],
    themes: ["forgiveness", "truth", "reconciliation", "humility", "boundaries", "peace"],
    principle: "Biblical wisdom calls for humility, truth, forgiveness, repentance, and peacemaking, while not pretending that sin, harm, or repeated betrayal should be ignored.",
    stories: ["Joseph forgiving his brothers shows mercy without denying real wrongdoing.", "Jacob and Esau's reunion shows humility and reconciliation after long conflict."],
    references: ["Genesis 50:15-21", "Matthew 18:15-17", "Ephesians 5:21-33", "Romans 12:18", "Proverbs 15:1", "James 1:5"],
    questions: ["What truth needs to be spoken plainly?", "What repentance or change is needed?", "Are you confusing forgiveness with pretending nothing happened?"],
    next: "Pray, slow your speech, seek peace where possible, and get wise counsel if the conflict is serious or recurring."
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

function showGuidanceTool() {
  if (guidanceDisclaimer) guidanceDisclaimer.style.display = "none";
  if (guidanceTool) guidanceTool.classList.remove("guidance-tool-hidden");
  if (situationInput) situationInput.focus();
}

if (agreeDisclaimerBtn) {
  agreeDisclaimerBtn.addEventListener("click", () => {
    sessionStorage.setItem("wisdomDisclaimerAccepted", "yes");
    showGuidanceTool();
  });
}

if (guidanceDisclaimer && guidanceTool && sessionStorage.getItem("wisdomDisclaimerAccepted") === "yes") {
  showGuidanceTool();
}

function selectGuide(text) {
  const lower = text.toLowerCase();
  let best = TOPIC_GUIDES[TOPIC_GUIDES.length - 1];
  let bestScore = -1;
  for (const guide of TOPIC_GUIDES) {
    const score = guide.keywords.reduce((n, k) => n + (lower.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { best = guide; bestScore = score; }
  }
  return best;
}

function fallbackGuidance(text) {
  const guide = selectGuide(text);
  return `Situation:\n${text}\n\nBiblical Topics Found:\n${guide.themes.join("; ")}\n\nBiblical Principle:\n${guide.principle}\n\nRelated Biblical Story / Passage:\n${guide.stories[0]}\n\nAdditional Biblical Connections:\n${guide.stories.slice(1).join("\n")}\n\nKing James Version Scripture References:\n${guide.references.join("; ")}\n\nReflection Questions:\n${guide.questions.map(q => "- " + q).join("\n")}\n\nPlain-Language Guidance:\nSearch the Scriptures above before deciding. Notice the repeated biblical themes: ${guide.themes.join(", ")}. Do not treat one verse as a shortcut; compare the whole counsel of Scripture, seek wise counsel, and consider the fruit of each possible path.\n\nNext Wise Step:\n${guide.next}\n\nDisclaimer:\nWisdomCompass provides spiritual and biblical guidance only. It is not legal, medical, mental health, financial, or emergency advice. For urgent danger, abuse, self-harm, or emergency situations, contact emergency services, a qualified professional, or trusted local help immediately.`;
}

async function getGuidance(text) {
  const response = await fetch("/api/guidance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ situation: text })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to generate guidance.");
  return data.guidance;
}

function escapeHTML(value) {
  return String(value || "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[ch]));
}

function referencesForText(guidance, userText) {
  const guide = selectGuide(userText || guidance || "");
  const found = [];
  Object.keys(PASSAGES).forEach(ref => {
    if (guidance && guidance.includes(ref)) found.push(ref);
  });
  guide.references.forEach(ref => { if (PASSAGES[ref] && !found.includes(ref)) found.push(ref); });
  return found.slice(0, 10);
}

function guidanceToHTML(guidance, userText) {
  const refs = referencesForText(guidance, userText);
  const firstRef = refs[0];
  const passage = firstRef ? PASSAGES[firstRef] : null;
  const buttons = refs.map((ref, idx) => `<button type="button" class="passage-link ${idx === 0 ? "selected" : ""}" data-ref="${escapeHTML(ref)}">${escapeHTML(ref)}</button>`).join("");
  const passageHTML = passage ? `
    <div class="passage-reader" id="passageReader">
      <div class="passage-header">
        <h3>Full KJV Passage to Read First</h3>
        <p class="microcopy">Click another reference below to display the full KJV passage and simple study notes here without leaving the page.</p>
      </div>
      <div class="passage-display" id="passageDisplay">
        ${renderPassageBlock(firstRef)}
      </div>
      <div class="passage-links" id="passageLinks">${buttons}</div>
    </div>` : "";
  return `${passageHTML}<div class="guidance-text"><h3>Biblical Guidance</h3><pre>${escapeHTML(guidance)}</pre></div>`;
}

function attachPassageHandlers() {
  const display = document.getElementById("passageDisplay");
  if (!display) return;
  document.querySelectorAll(".passage-link").forEach(btn => {
    btn.addEventListener("click", () => {
      const ref = btn.getAttribute("data-ref");
      const passage = PASSAGES[ref];
      if (!passage) return;
      document.querySelectorAll(".passage-link").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      display.innerHTML = renderPassageBlock(ref);
      display.scrollTop = 0;
    });
  });
}

function getHistory() { return JSON.parse(localStorage.getItem("wisdomHistory") || "[]"); }
function setHistory(history) { localStorage.setItem("wisdomHistory", JSON.stringify(history)); }
function renderHistory() {
  if (!historyList) return;
  const history = getHistory();
  historyList.innerHTML = "";
  if (!history.length) { historyList.innerHTML = '<p class="microcopy">No saved guidance yet.</p>'; return; }
  history.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<strong>${escapeHTML(item.date)}</strong><p>${escapeHTML(item.preview)}</p>`;
    historyList.appendChild(div);
  });
}

if (generateBtn) {
  generateBtn.addEventListener("click", async () => {
    const text = situationInput.value.trim();
    if (!text) { alert("Please describe your situation first."); return; }
    generateBtn.disabled = true;
    generateBtn.textContent = "Searching Scripture...";
    resultBox.innerHTML = "<strong>Searching biblical topics, related passages, stories, and principles...</strong>";
    resultBox.classList.remove("empty");
    resultBox.classList.add("active-result");
    try { latestGuidance = await getGuidance(text); }
    catch (error) { console.warn(error); latestGuidance = fallbackGuidance(text); }
    latestRenderedText = latestGuidance;
    resultBox.innerHTML = guidanceToHTML(latestGuidance, text);
    resultBox.scrollTop = 0;
    attachPassageHandlers();
    saveBtn.disabled = false;
    generateBtn.disabled = false;
    generateBtn.textContent = "Get Free Biblical Guidance";
  });
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    situationInput.value = "";
    latestGuidance = "";
    latestRenderedText = "";
    resultBox.textContent = "Your biblical topic search and guidance will appear here on this same page.";
    resultBox.classList.add("empty");
    resultBox.classList.remove("active-result");
    saveBtn.disabled = true;
  });
}
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    if (!latestGuidance) return;
    const history = getHistory();
    history.unshift({ date: new Date().toLocaleString(), preview: latestGuidance.slice(0, 260) + "..." });
    setHistory(history.slice(0, 25));
    renderHistory();
    alert("Saved to history.");
  });
}
if (clearHistoryBtn) { clearHistoryBtn.addEventListener("click", () => { setHistory([]); renderHistory(); }); }
renderHistory();
