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
    references: ["Proverbs 3:5-6", "Proverbs 11:14", "Colossians 3:23", "Proverbs 22:29", "Genesis 41:33-40", "Daniel 1:8-20"],
    questions: ["Does this opportunity strengthen or weaken your integrity?", "How will it affect your family, responsibilities, and spiritual life?", "Have you sought counsel from people who know your situation?"],
    next: "List the tradeoffs clearly, pray for wisdom, seek counsel, and compare the offer against faithfulness, responsibility, and long-term fruit."
  },
  {
    name: "Money, Debt, Mortgage, Major Purchase",
    keywords: ["mortgage", "house", "buy", "purchase", "debt", "loan", "money", "finance", "investment", "business", "price", "payment"],
    themes: ["stewardship", "debt caution", "contentment", "counting the cost", "wise planning"],
    principle: "Biblical wisdom calls for stewardship, counting the cost, avoiding presumption, and refusing to let fear, greed, or pressure control financial decisions.",
    stories: ["Jesus' teaching about counting the cost warns against beginning what you cannot finish.", "Joseph's preparation before famine shows planning, saving, and stewardship."],
    references: ["Luke 14:28-30", "Proverbs 22:7", "Proverbs 21:5", "1 Timothy 6:6-10", "Genesis 41:34-36", "Proverbs 15:22"],
    questions: ["Have you counted the full cost, not just the monthly payment?", "Is pressure or fear driving the decision?", "What counsel have you received from people who understand the financial risk?"],
    next: "Slow down, calculate the full cost, compare obligations, seek wise counsel, and do not move forward just because of pressure or excitement."
  },
  {
    name: "Retirement, Later Life, Planning",
    keywords: ["retire", "retirement", "pension", "social security", "older", "later life", "quit working"],
    themes: ["stewardship", "purpose", "provision", "family responsibility", "wisdom with age"],
    principle: "Biblical wisdom treats later-life decisions as stewardship decisions, not merely comfort decisions. Retirement planning should consider provision, purpose, family responsibilities, generosity, and faithful use of remaining years.",
    stories: ["Joseph's preparation for famine shows wise planning before a future season arrives.", "Moses' later years show that age does not remove purpose or calling."],
    references: ["Psalm 90:12", "Proverbs 16:31", "Genesis 41:34-36", "1 Timothy 5:8", "Proverbs 21:5", "Ecclesiastes 3:1"],
    questions: ["Is this decision financially responsible?", "What purpose and service remain after retirement?", "Have you considered family, health, and long-term provision?"],
    next: "Count the cost, seek counsel, pray for wisdom, and make a plan that balances provision, purpose, and responsibility."
  },
  {
    name: "Relationship Conflict, Forgiveness, Family",
    keywords: ["relationship", "family", "forgive", "forgiveness", "conflict", "argue", "anger", "parent", "child", "friend", "betrayal"],
    themes: ["forgiveness", "truth", "reconciliation", "humility", "boundaries", "peace"],
    principle: "Biblical wisdom calls for humility, truth, forgiveness, repentance, and peacemaking, while not pretending that sin, harm, or repeated betrayal should be ignored.",
    stories: ["Joseph forgiving his brothers shows mercy without denying real wrongdoing.", "Jacob and Esau's reunion shows humility and reconciliation after long conflict."],
    references: ["Genesis 50:15-21", "Matthew 18:15-17", "Ephesians 4:31-32", "Romans 12:18", "Proverbs 15:1", "James 1:19-20"],
    questions: ["What truth needs to be spoken plainly?", "What repentance or change is needed?", "Are you confusing forgiveness with pretending nothing happened?"],
    next: "Pray, slow your speech, seek peace where possible, and get wise counsel if the conflict is serious or recurring."
  },
  {
    name: "General Wisdom Decision",
    keywords: [],
    themes: ["wisdom", "prayer", "counsel", "fruit", "patience", "obedience"],
    principle: "Biblical wisdom begins with humility before God, prayer, patience, wise counsel, examining motives, and looking at the likely fruit of a decision.",
    stories: ["Solomon asked God for wisdom before leading others, showing that sound decisions begin with dependence on God rather than pride."],
    references: ["James 1:5", "Proverbs 3:5-6", "Proverbs 11:14", "Proverbs 15:22", "Galatians 5:22-23", "Psalm 119:105"],
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
    div.innerHTML = `<strong>${item.date}</strong><p>${item.preview}</p>`;
    historyList.appendChild(div);
  });
}

if (generateBtn) {
  generateBtn.addEventListener("click", async () => {
    const text = situationInput.value.trim();
    if (!text) { alert("Please describe your situation first."); return; }
    generateBtn.disabled = true;
    generateBtn.textContent = "Searching Scripture...";
    resultBox.textContent = "Searching biblical topics, related passages, stories, and principles...";
    resultBox.classList.remove("empty");
    resultBox.classList.add("active-result");
    try { latestGuidance = await getGuidance(text); }
    catch (error) { console.warn(error); latestGuidance = fallbackGuidance(text); }
    resultBox.textContent = latestGuidance;
    saveBtn.disabled = false;
    generateBtn.disabled = false;
    generateBtn.textContent = "Get Guidance";
    resultBox.focus?.();
  });
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    situationInput.value = "";
    latestGuidance = "";
    resultBox.textContent = "Your guidance will appear here.";
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
