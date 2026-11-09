import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { logQuestion } from "../lib/sheetlog.js";
import { waitUntil } from "@vercel/functions";

// (TOPICAL_GUIDE — the reference text for the old, disabled AI path — was
// removed in the question-log build, Nov 4, 2026, together with the AI
// branch itself. The whole-Bible search below is the only answering path.)


// ---- Whole-Bible search (Milestone 2; sole answering path since Milestone 3) ----
// Jeff's locked pipeline, with no AI and no internet material anywhere in the
// output: the question is prepared into concepts locally, the concepts are
// matched against Nave's topical index and a full-text scan of the whole KJV,
// and the matched material is compared (TSK cross-reference reinforcement) and
// assembled into the site's established answer shape. EVERY question is
// answered by this search, freshly, for that question — there are no
// pre-written guide answers (Jeff's decision, Nov 4, 2026: the guides "got
// in there by mistake"). Data lives in ../data/ (public-domain KJV text,
// Nave's topics, TSK cross-references, and a concept index built from Nave's
// entry text) and is loaded lazily on the first request.
//
// Nov 8, 2026 upgrade (Jeff approved): the default Bible text is now the
// Berean Standard Bible (BSB — modern English, dedicated to the public
// domain Apr 30, 2023; data/bsb.json, keyed exactly like kjv.json, with
// the KJV text standing in for the 16 verse numbers the BSB leaves
// blank). The full-text scan runs over the chosen translation's own
// words, so modern questions meet modern vocabulary ("Be anxious for
// nothing" — Philippians 4:6 in the BSB — is findable by the word
// "anxious" itself). body.translation = "kjv" still serves the King
// James text end to end. When GEMINI_API_KEY is set, a Gemini reader
// step (Nov 8, 2026; free tier only — this site carries no paid
// services) reads the search's own candidate passages, chooses the one
// that most directly answers the question, and explains it in plain
// language; the explanation is fenced by validation, and any failure
// falls back to this template assembly unchanged. Crisis answers never
// leave the site.

function stem(w) {
  w = w.replace(/'s$/, "").replace(/'$/, "");
  let s = w;
  if (s.length > 4 && s.endsWith("ies")) s = s.slice(0, -3) + "y";
  else if (s.length > 5 && s.endsWith("ing")) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith("ed")) s = s.slice(0, -2);
  else if (s.length > 4 && s.endsWith("es")) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s")) s = s.slice(0, -1);
  // Word-family unifications (Nov 5, 2026 fix pass): a heading and the
  // question word for it must stem identically or the heading can never
  // match exactly — "forgiveness" stemmed to "forgivenes" while "forgive"
  // stayed "forgive", which hid the whole Forgiveness heading (all three
  // classic texts) from forgiveness questions. Same split for
  // grief/grieving and anxious/anxiety.
  if (s.startsWith("forgiv")) return "forgiv";
  if (s.startsWith("griev") || s.startsWith("grief")) return "griev";
  if (s.startsWith("anxi")) return "anxiety";
  return s;
}
const QUESTION_STOP = new Set(("should would could shall will what when where which who whom whose why how is are was were be been being " +
  "do does did done i me my we our you your he she it its they them their the a an and or but if then than to of in on at for with by from about into " +
  "not no bible scripture scriptures verse verses say says said tell tells god lord jesus christ let get stop being go going want wants need needs " +
  "make makes keep keeps help please really just can may might must am an's declare christian christians acceptable think thinks know all that thinking every month months week weeks ago day days " +
  "i'm can't don't time lately huge").split(" "));
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
  bos: ["master", "ruler"],
  fir: ["dismiss", "servant"],
  drink: ["drunkenness", "wine"],
  drunk: ["drunkenness"],
  angry: ["anger"],
  // Milestone 3 tuning (keys are question-word STEMS, as conceptsOf looks
  // them up after stemming — "boss" and "fired" above were dead keys for
  // that reason; the stems are "bos" and "fir"):
  tax: ["tribute", "caesar", "render"],
  marri: ["marriage"],
  cry: ["weeping", "wept", "mourning", "sorrow", "comfort", "tears"],
  died: ["death", "mourning"],
  anxiety: ["care", "fear"],
  worry: ["anxiety", "care"],
  worri: ["anxiety", "care"],
  sunday: ["sabbath"],
  sign: ["surety"],
  lent: ["lend", "loan", "borrow"],
  loan: ["lend"],
  retire: ["rest", "age"],
  retirement: ["rest", "age"],
  gossip: ["talebearer", "slander"],
  homeschool: ["education", "instruction", "teach", "train"],
  burn: ["weary", "rest"],
  // Nov 5, 2026 fix pass — pastoral-vocabulary bridges the audit found
  // missing (keys are stems, as above):
  griev: ["mourning", "sorrow", "comfort", "tears"],
  decide: ["counsel", "wisdom", "seek"],
  decision: ["counsel", "wisdom", "seek"],
  exhaust: ["weary", "rest"],
  honesty: ["truth", "integrity"],
};
// Phrase-level bridges (Nov 5, 2026 fix pass): some needs are carried by a
// phrase, not a word — "far from God" leaves only the junk concepts
// feel/far once "god" is stop-worded, and "should I buy…" is a counsel
// question wearing an object word ("boat" -> the Ship heading). A matched
// rule injects concepts in conceptsOf and, in the search, inserts its
// topics alongside the scored ones and boosts its curated references.
const PHRASE_RULES = [
  {
    re: /\bfar from god\b|\bfeel(?:ing)?\s+(?:so\s+)?(?:far|distant)\b|\bdistant from god\b|\bgod feels (?:far|distant|silent)\b/,
    concepts: ["presence", "seek", "return", "draw", "near"],
    topics: ["Hope"],
    boostRefs: { "Psalm 42:11": 6, "Isaiah 41:10": 6, "Deuteronomy 31:8": 4 },
  },
  {
    re: /\bshould i (?:buy|purchase|get)\b|\bis it (?:ok|okay|right|wise) to buy\b/,
    concepts: ["counsel", "cost"],
    topics: ["Counsel", "Frugality"],
    boostRefs: { "Luke 14:28": 6 },
  },
  {
    re: /\bcan'?t (?:sleep|fall asleep)\b|\bcannot sleep\b|\bsleepless\b/,
    concepts: ["sleep", "rest"],
    topics: ["Sleep"],
    boostRefs: {},
  },
];
function matchedPhraseRules(question) {
  const q = String(question || "").toLowerCase();
  return PHRASE_RULES.filter((r) => r.re.test(q));
}
// The entry index was built with the pre-unification stemmer, so a unified
// stem's entry hits live under the old key (Nov 5, 2026 fix pass).
const ENTRY_INDEX_ALIASES = { forgiv: ["forgivenes"] };

// Whole short words a truncated stem may legitimately be (see the guard
// in conceptsOf). Populated by loadSearch from the topic data itself.
let SHORT_STEM_OK = null;

// The curated comfort set for crisis answers (P0, Nov 5, 2026 fix pass).
// Every reference was verified against the site's own kjv.json before use.
const COMFORT_REFS = ["Psalm 34:18", "Psalm 42:11", "Deuteronomy 31:8", "Matthew 11:28-30", "Romans 8:38-39"];
// Crisis phrasing — self-harm ideation as people actually type it. The
// stock SENSITIVE_RE catches "suicid…"/"self-harm"; these phrases are the
// gap the audit found ("I feel like giving up on life" matched nothing).
const CRISIS_RE = /\b(suicid\w*|self-harm|giving up|give up on life|end my life|hurt myself|can't go on|no reason to live|tired of living)\b/;
function isCrisis(question) {
  return CRISIS_RE.test(String(question || "").toLowerCase());
}

function conceptsOf(question) {
  const raw = String(question || "").toLowerCase().match(/[a-z0-9']+/g) || [];
  const seen = new Set();
  const concepts = [];
  for (const tok of raw) {
    if (tok.length < 3 || QUESTION_STOP.has(tok)) continue;
    const s = stem(tok);
    if (s.length < 3 || seen.has(s)) continue;
    // A stem that collapsed to <=3 chars by truncating a longer word
    // (this->thi, facing->fac, giving->giv, caring->car) is noise, not a
    // concept — "car" alone pulled Matthew 13:22 into a parents answer.
    // Nov 8, 2026: the same truncation also ate real words that stand as
    // headings in their own right — "taxes" -> "tax" never reached the
    // search at all, so a taxes question was answered from "government"
    // alone. A truncated stem survives when it is a whole word in a
    // Nave's heading or a synonym key (SHORT_STEM_OK, built in
    // loadSearch; "car" is struck from it by hand — its only heading is
    // the place name Beth-Car, and the "caring" artifact above is the
    // very case this guard exists for).
    if (s.length <= 3 && s !== tok && !(SHORT_STEM_OK && SHORT_STEM_OK.has(s))) continue;
    seen.add(s);
    concepts.push({ stem: s, word: tok, direct: true });
    for (const syn of SYNONYMS[s] || []) {
      const ss = stem(syn);
      if (!seen.has(ss)) { seen.add(ss); concepts.push({ stem: ss, word: syn, direct: false }); }
    }
  }
  for (const rule of matchedPhraseRules(question)) {
    for (const w of rule.concepts) {
      const ss = stem(w);
      if (!seen.has(ss)) { seen.add(ss); concepts.push({ stem: ss, word: w, direct: false }); }
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
// heading that actually carries Deuteronomy 15. Nov 5, 2026 fix pass:
// Borrowing carries Proverbs 22:7 + Psalm 37:21 (Debt itself carries
// Romans 13:8); Grief's own refs are about grieving God, so it bridges to
// Mourning; "Decision" is a 233-ref perseverance bucket while the counsel
// texts sit in the 12-ref "Counsel" heading; Anxiety is an empty shell
// whose swap target (Care) carries Matthew 6 + Philippians 4, and Peace
// carries the peace-of-God texts; Marriage's husband/wife teaching sits
// under the "Husband"/"Wife" headings (Ephesians 5:25, 1 Peter 3:7).
const TOPIC_BRIDGES = {
  "Debt": ["Borrowing", "Sabbatic Year"],
  "Grief": ["Mourning"],
  "Decision": ["Counsel"],
  "Anxiety": ["Peace", "Care"],
  "Rest": ["Sabbath"],
  "Marriage": ["Husband", "Wife"],
};
// Topic-name literal collisions (Nov 5, 2026 fix pass): the concept on the
// right must not name-match the heading on the left — "burned out" matched
// "Burning Bush" on the word "burn" and put Exodus 3 in a rest answer.
// (A question actually about the burning bush still matches via "bush".)
// Nov 8, 2026: the Nov 5 entry never actually fired — Nave's data carries
// BOTH "Burning Bush" and the inverted "Bush, Burning", and the inverted
// heading is the one the burnout question matched. The map is keyed by the
// DATA names below. Same collision family, same remedy: micro-headings
// that merely contain a common noun ("Conscience Money", "Sin Money",
// "Money Changers" on any money question; "Beaten Work"/"Works" on any
// job question; "Son-In-Law" on any son question) must not name-match on
// that noun — each remains reachable through its distinctive word
// ("conscience", "changers", "beaten", "law") and through the entry index.
const NAME_MATCH_BLOCK = {
  "Burning Bush": new Set(["burn"]),
  "Bush, Burning": new Set(["burn"]),
  "Burning": new Set(["burn"]),
  "Conscience Money": new Set(["money"]),
  "Sin Money": new Set(["money"]),
  "Money Changers": new Set(["money"]),
  "Beaten Work": new Set(["work"]),
  "Works": new Set(["work"]),
  "Sabbath Day\u2019 S Journey": new Set(["sabbath", "sunday"]),
  "Son-In-Law": new Set(["son"]),
  "Walking": new Set(["walk"]),
};

let SEARCH = null;
function loadSearch() {
  if (SEARCH) return SEARCH;
  const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
  const kjvText = load("kjv.json");
  const bsbRaw = load("bsb.json");
  const topicsData = load("topics.json");
  const xref = load("xref.json");
  const entryIndex = load("entry-index.json");

  const topicNameWords = topicsData.topics.map((name) => {
    const words = name.toLowerCase().match(/[a-z']+/g) || [];
    return new Set(words.map(stem).filter((w) => w.length >= 3 && !["the", "of", "and"].includes(w)));
  });
  const topicByName = new Map(topicsData.topics.map((n, i) => [n, i]));
  if (!SHORT_STEM_OK) {
    SHORT_STEM_OK = new Set(Object.keys(SYNONYMS));
    for (const name of topicsData.topics) {
      for (const w of name.toLowerCase().match(/[a-z']+/g) || []) if (w.length === 3) SHORT_STEM_OK.add(w);
    }
    SHORT_STEM_OK.delete("car"); // place name Beth-Car only — see conceptsOf
  }

  // Curated reference supplements (Nov 5, 2026 fix pass). The audit found
  // the classic teaching texts for several pastoral topics are simply not
  // in Nave's lists at all (James 1:19, Proverbs 15:1, Ephesians 4:32,
  // Colossians 3:13, Mark 2:27, Mark 10:9, Psalm 34:18, Matthew 5:4,
  // Revelation 21:4, John 11:35, Psalm 42:11, Isaiah 41:10,
  // Deuteronomy 31:8, Romans 15:13, John 14:27, Isaiah 26:3 are covered by
  // no Nave's reference) or sit hundreds of entries deep in a neighbouring
  // heading (1 Timothy 5:8 at position 228 of "Children"). These are
  // prepended to the heading that should carry them, in memory only — the
  // data files are untouched. Every reference was verified against
  // kjv.json before being added.
  const CURATED_TOPIC_REFS = {
    "Comfort": ["Psalm 34:18", "Psalm 42:11", "Deuteronomy 31:8", "Matthew 11:28-30", "Romans 8:38-39"],
    "Mourning": ["Psalm 34:18", "Matthew 5:4", "Revelation 21:4", "John 11:35"],
    "Peace": ["John 14:27", "Isaiah 26:3", "Philippians 4:7"],
    "Hope": ["Psalm 42:11", "Isaiah 41:10", "Deuteronomy 31:8", "Romans 15:13"],
    "Rest": ["Matthew 11:28-30", "Exodus 18:11-23"],
    "Counsel": ["Proverbs 3:5-6", "James 1:5", "Luke 14:28"],
    "Anger": ["James 1:19-20", "Ephesians 4:26", "Proverbs 15:1"],
    "Parents": ["1 Timothy 5:8", "Exodus 20:12"],
    "Sabbath": ["Mark 2:27", "Exodus 20:8-11"],
    "Lending": ["Psalm 37:26"],
    "Forgiveness": ["Ephesians 4:32", "Colossians 3:13"],
    "Marriage": ["Mark 10:9", "Ephesians 5:25", "1 Peter 3:7"],
    "Debt": ["Romans 13:8", "Proverbs 22:7", "Psalm 37:21"],
    "Honesty": ["Proverbs 11:1", "Proverbs 12:22"],
    "Care": ["Matthew 6:25-34", "Philippians 4:6", "Philippians 4:7", "Psalm 55:22", "1 Peter 5:7"],
    "Prodigal Son": ["Luke 15:11-32"],
  };
  const curatedByTopic = new Map(Object.entries(CURATED_TOPIC_REFS).map(([n, rs]) => [n, new Set(rs)]));
  const refIndexByRef = new Map(topicsData.refs.map((r, i) => [r, i]));
  for (const [name, extraRefs] of Object.entries(CURATED_TOPIC_REFS)) {
    const ti = topicByName.get(name);
    if (ti === undefined) continue;
    const add = [];
    for (const ref of extraRefs) {
      let ri = refIndexByRef.get(ref);
      if (ri === undefined) {
        ri = topicsData.refs.length;
        topicsData.refs.push(ref);
        refIndexByRef.set(ref, ri);
      }
      if (!add.includes(ri)) add.push(ri);
    }
    if (add.length) topicsData.byTopic[ti] = [...add, ...topicsData.byTopic[ti].filter((ri) => !add.includes(ri))];
  }

  const verseKeys = Object.keys(kjvText);
  const ordinal = new Map(verseKeys.map((k, i) => [k, i]));
  const parsedVerse = verseKeys.map((k) => {
    const m = k.match(/^(.+?) (\d+):(\d+)$/);
    return { book: m[1], ch: +m[2], v: +m[3] };
  });
  // Per-translation text sources (Nov 8, 2026). bsb.json is keyed exactly
  // like kjv.json and already carries the KJV text at the BSB's 16 blank
  // verse numbers; the merge below is a second belt on that suspender, so
  // a key missing from bsb.json could never render blank either. Verse
  // keys, order and versification are shared — only the words differ —
  // and each source carries its own stem sets, because the full-text scan
  // must run over the words the visitor will actually read.
  const bsbText = {};
  for (const k of verseKeys) bsbText[k] = (bsbRaw[k] && bsbRaw[k].trim()) ? bsbRaw[k] : kjvText[k];
  const stemSetsOf = (textMap) => verseKeys.map((k) => {
    const set = new Set();
    for (const tok of textMap[k].toLowerCase().match(/[a-z']+/g) || []) set.add(stem(tok));
    return set;
  });
  const SOURCES = {
    bsb: { id: "bsb", name: "Berean Standard Bible", text: bsbText, stemSets: stemSetsOf(bsbText) },
    kjv: { id: "kjv", name: "King James Version", text: kjvText, stemSets: stemSetsOf(kjvText) },
  };
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
  function panelPassageText(ref, lead = false, src = SOURCES.bsb) {
    const { verses, truncated } = expandRef(ref, 40);
    if (!verses.length) return null;
    const fmt = (arr) => arr.map((v) => `${parsedVerse[ordinal.get(v)].v} ${src.text[v]}`).join("\n");
    // Long ranges show head + closing verses, same as the answer body;
    // the lead passage of a long range gets a wider head (Nov 5, 2026
    // fix pass).
    if (verses.length > 8) {
      const headN = lead && verses.length > 15 ? 12 : 5;
      return fmt(verses.slice(0, headN)) + "\n…\n" + fmt(verses.slice(-3));
    }
    return truncated ? fmt(verses) + " …" : fmt(verses);
  }

  // ---- Passage completion (Nov 8, 2026) ----
  // The search sometimes surfaces a lone verse that by itself does not
  // contain the teaching it was matched for: Mark 10:2 is only the
  // Pharisees' question (Jesus' answer is vv. 3-12), and Matthew 5:31
  // only quotes the received saying (the teaching is v. 32). Handed to
  // any reader as fragments, the answer they belong to is cut off.
  // No data file here encodes pericope boundaries — Nave's itself cites
  // "Mark 10:2" alone — so completion pairs a generic text trigger with
  // hand-verified targets, the same pattern as CURATED_TOPIC_REFS:
  //   * Trigger (generic, on the verse's own text in the chosen
  //     translation): the verse quotes a received saying without the
  //     teacher's response ("It has also been said…", with no "But I
  //     tell you"), or it frames a question posed TO a teacher
  //     (narration of the asking plus the question itself). A verse
  //     that states its content whole — Isaiah 50:1 (oracle statement),
  //     Jeremiah 3:8 (complete clause), Luke 14:28 (a rhetorical
  //     question that IS the teaching, with no asker framing) — never
  //     triggers and always stands as-is.
  //   * Target: COMPLETION_RANGES where one is verified; otherwise the
  //     generic adjacent-citation merge — when the topical index cites
  //     the immediately following verse(s) under the same topics that
  //     produced this candidate, the split citation is one passage and
  //     is merged (this alone carries Matthew 5:31 -> 5:31-32, both
  //     cited under Divorce). Targets are verified against the data at
  //     apply time: a range that does not expand cleanly is not used.
  const COMPLETION_RANGES = {
    "Mark 10:2": "Mark 10:2-12",
    "Matthew 5:31": "Matthew 5:31-32",
    "Matthew 19:3": "Matthew 19:3-12",
  };
  function verseIsFragment(text) {
    const t = String(text || "");
    if (/(it (has|hath) (also |now )?been said|you have heard that it was said)/i.test(t) && !/but i (tell|say) you/i.test(t)) return true;
    if (/\?[\u201D"]?\s*(they|he|she|the disciples)\s+(inquired|asked|said)/i.test(t)) return true;
    if (/(came|went|approached|come)\b[^.]{0,70}\b(test|ask|inquir|question)/i.test(t) && t.includes("?")) return true;
    return false;
  }
  function completeRef(ref, src, topTopicRefSets) {
    const p = parseRef(ref);
    if (!p || p.chapterOnly || p.ch1 !== p.ch2 || p.v1 !== p.v2) return ref;
    if (!verseIsFragment(src.text[`${p.book} ${p.ch1}:${p.v1}`])) return ref;
    const target = COMPLETION_RANGES[ref];
    if (target && expandRef(target).verses.length) return target;
    let end = p.v1;
    while (end - p.v1 < 11) {
      const nextRef = `${p.book} ${p.ch1}:${end + 1}`;
      if (!topTopicRefSets.some((s) => s.has(nextRef))) break;
      end++;
    }
    return end > p.v1 ? `${p.book} ${p.ch1}:${p.v1}-${end}` : ref;
  }

  function searchAnswer(question, opts = {}) {
    const src = SOURCES[opts.translation === "kjv" ? "kjv" : "bsb"];
    const concepts = opts.concepts || conceptsOf(question);
    let topTopics = null;
    let nameDirectCount = new Map(); // filled by the topic-scoring pass below
    if (opts.forceTopic) {
      // Forced-topic pass (the WISDOM last resort): the named topic carries
      // the answer on its own; no concept scoring and no full-text scan.
      const fi = topicByName.get(opts.forceTopic);
      topTopics = fi !== undefined ? [[fi, 0]] : [];
    } else {
      // topic scoring
      const topicScore = new Map();
      const addScore = (ti, pts) => topicScore.set(ti, (topicScore.get(ti) || 0) + pts);
      const nameExact = new Set(); // topics matched by an exact name word
      const eiHits = new Map(); // entry-index points are capped per topic (below)
      for (const c of concepts) {
        const namePts = c.direct ? 12 : 9, entryPts = c.direct ? 4 : 3;
        topicsData.topics.forEach((tname, ti) => {
          if (NAME_MATCH_BLOCK[tname] && NAME_MATCH_BLOCK[tname].has(c.stem)) return;
          const words = topicNameWords[ti];
          if (words.has(c.stem)) { addScore(ti, namePts); nameExact.add(ti); if (c.direct) nameDirectCount.set(ti, (nameDirectCount.get(ti) || 0) + 1); }
          else if (c.stem.length >= 5) {
            for (const w of words) if (w.startsWith(c.stem) || c.stem.startsWith(w)) { addScore(ti, namePts - 4); break; }
          }
        });
        // Entry-index points come from Nave's entry text, where giant
        // topics (Jesus, Paul) are mentioned under hundreds of words.
        // Capped at two concepts per topic so sheer size can't stack its
        // way onto the podium.
        const eiKeys = ENTRY_INDEX_ALIASES[c.stem] ? [c.stem, ...ENTRY_INDEX_ALIASES[c.stem]] : [c.stem];
        for (const eiKey of eiKeys) {
          for (const ti of entryIndex[eiKey] || []) {
            if (NAME_MATCH_BLOCK[topicsData.topics[ti]] && NAME_MATCH_BLOCK[topicsData.topics[ti]].has(c.stem)) continue;
            const n = eiHits.get(ti) || 0;
            if (n < 2) { addScore(ti, entryPts); eiHits.set(ti, n + 1); }
          }
        }
      }
      // "Decision, Valley of" is Joel 3 eschatology, not counsel for a
      // personal decision — keep it out unless the question is actually
      // about the valley (Nov 5, 2026 fix pass).
      if (!concepts.some((c) => c.stem === "valley")) {
        const vi = topicByName.get("Decision, Valley of");
        if (vi !== undefined) topicScore.delete(vi);
      }
      // Nave's "Way" heading is Christ and the Christian life; in plain
      // speech "way" is usually an idiom ("a way out", "the way I feel").
      // Keep the heading only when the question carries the religious
      // sense on its face (Nov 8, 2026 — the debt question's "don't see a
      // way out" had been naming "Way" as a topic and pulling Acts 19:23
      // — "a stir about that way" — into a debtor's answer).
      if (!/\b(jesus|christ|the way|way of the lord|way of god|salvation|disciples|his ways|my ways)\b/i.test(String(question || ""))) {
        const wi = topicByName.get("Way");
        if (wi !== undefined) topicScore.delete(wi);
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
      const pool = strong.length ? strong : rankedTopics.filter(([, s]) => s > 0);
      // Nave's has cross-reference shells — headings with no references of
      // their own ("Anxiety", "Education", "Comfort"). A shell can't
      // contribute passages, so swap in its see-also targets where they
      // exist and drop shells that point nowhere. This runs over the whole
      // pool BEFORE the cut, so a shell near the top can't crowd out a
      // real topic just below it (e.g. "Poll Tax" ahead of "Tribute
      // (Taxes)").
      const resolvedPool = [];
      for (const [ti, sc] of pool) {
        if (topicsData.byTopic[ti].length) { resolvedPool.push([ti, sc]); continue; }
        for (const name of topicsData.seeAlso[ti] || []) {
          const si = topicByName.get(name);
          if (si !== undefined && topicsData.byTopic[si].length && !resolvedPool.some(([t]) => t === si) && !pool.some(([t]) => t === si)) resolvedPool.push([si, sc]);
        }
      }
      topTopics = resolvedPool.slice(0, 3);
      // Curated topic bridges run BEFORE the extra-slot fill (Nov 5, 2026
      // fix pass): the fill used to starve them - on the anxiety question
      // the slots filled with Rest/Sleep before the Anxiety -> Care
      // bridge could run, so Care's Matthew 6 / Philippians 4 texts never
      // became candidates at all. Sources are the chosen topics PLUS the
      // pre-resolution pool, so a bridge still fires when its source
      // heading was an empty shell swapped out during resolution
      // (Anxiety swaps to Care, leaving "Anxiety" out of topTopics - its
      // Peace bridge must still run).
      const bridgeSources = new Set(topTopics.map(([ti]) => topicsData.topics[ti]));
      for (const [ti] of pool) bridgeSources.add(topicsData.topics[ti]);
      for (const srcName of bridgeSources) {
        for (const target of TOPIC_BRIDGES[srcName] || []) {
          const bi = topicByName.get(target);
          if (bi !== undefined && !topTopics.some(([t]) => t === bi) && topTopics.length < 5) topTopics.push([bi, 0]);
        }
      }
      // Extra slots: a topic the question matches by exact name shouldn't
      // be crowded out by entry-index giants - fill up to five slots with
      // exact-name matches that scored as strong ("Honesty" itself landed
      // fifth behind Boss/Rulers/Works on an honesty question, so its own
      // classic texts never competed).
      for (const [ti, s] of resolvedPool.slice(3)) {
        if (topTopics.length >= 5) break;
        if (nameExact.has(ti) && s >= 9 && !topTopics.some(([t]) => t === ti)) topTopics.push([ti, s]);
      }
      if (topTopics.length < 4) {
        const pick = resolvedPool.slice(3).find(([ti, s]) => !topTopics.some(([t]) => t === ti) && s >= 12);
        if (pick) topTopics.push(pick);
      }
      // Phrase-rule topic insertions (see PHRASE_RULES note above): the
      // phrase, not any single word, carries the need.
      for (const rule of matchedPhraseRules(question)) {
        for (const target of rule.topics) {
          const bi = topicByName.get(target);
          if (bi === undefined || topTopics.some(([t]) => t === bi)) continue;
          if (topTopics.length < 5) { topTopics.push([bi, 0]); continue; }
          for (let i = topTopics.length - 1; i >= 0; i--) {
            if (!nameExact.has(topTopics[i][0])) { topTopics[i] = [bi, 0]; break; }
          }
        }
      }
    }

    // full-text scoring over the whole Bible in the chosen translation.
    // The normal pass scans the
    // question's own stems; a relaxed pass also lets the synonym stems join
    // the scan (broader concepts). A forced-topic pass skips the scan.
    const scanStems = opts.forceTopic ? [] : opts.relaxed
      ? concepts.map((c) => c.stem)
      : concepts.filter((c) => c.direct).map((c) => c.stem);
    const ftScore = new Map();
    src.stemSets.forEach((set, i) => {
      let distinct = 0, hits = 0;
      for (const s of scanStems) if (set.has(s)) { distinct++; hits++; }
      if (distinct) ftScore.set(i, { distinct, hits });
    });
    const topVerses = [...ftScore.entries()]
      .sort((a, b) => b[1].distinct - a[1].distinct || b[1].hits - a[1].hits)
      .slice(0, 10);

    // candidate references with combined scores
    const cand = new Map();
    const addCand = (ref, pts) => cand.set(ref, (cand.get(ref) || 0) + pts);
    const topicWeight = [10, 7, 5, 5, 4];
    // A topic reference also earns points for matching the question's own
    // concepts in its passage text — this is what lifts the verses that
    // actually speak to the question (Matthew 22:21 for taxes) above a big
    // topic's merely-first-listed references.
    const allStems = concepts.map((c) => c.stem);
    const textBonus = (ref) => {
      const { verses } = expandRef(ref);
      if (!verses.length) return 0;
      const hit = new Set();
      for (const v of verses) {
        const set = src.stemSets[ordinal.get(v)];
        for (const s of allStems) if (set.has(s)) hit.add(s);
      }
      return Math.min(2 * hit.size, 6);
    };
    // A reference listed under several top topics earns the weight of its
    // best topic plus a small recognition per extra topic — not the full
    // sum, which let multiply-listed passages (Esther 1, the genealogies)
    // outscore the passages the question is actually about.
    const topicPts = new Map();
    topTopics.forEach(([ti], r) => {
      const curated = curatedByTopic.get(topicsData.topics[ti]);
      const nameBonus = 3 * (nameDirectCount.get(ti) || 0);
      for (const ri of topicsData.byTopic[ti].slice(0, 120)) {
        const ref = topicsData.refs[ri];
        let e = topicPts.get(ref);
        if (!e) { e = { weights: [], bonus: textBonus(ref) }; topicPts.set(ref, e); }
        // Curated flagship references (see CURATED_TOPIC_REFS) carry the
        // top topic weight plus a flat bonus wherever their heading sits:
        // they are the heading's defining teaching texts, hand-verified,
        // and a heading buried at a low weight by entry-index noise
        // should not sink them (Nov 5, 2026 fix pass).
        if (curated && curated.has(ref)) {
          e.weights.push(10);
          if (!e.curated) { e.curated = true; e.bonus += 8; }
          // A heading the visitor named in their own words, with two or
          // more of its name words spoken ("prodigal son"), has told us
          // exactly which story they mean — its flagship text should
          // lead, not lose by a point to a same-words coincidence
          // (Nov 8, 2026: 2 Samuel 6:20 outscored Luke 15:11-32 by
          // 30-29 on the prodigal question under the BSB scan).
          if ((nameDirectCount.get(ti) || 0) >= 2 && !e.namedLift) { e.namedLift = true; e.bonus += 4; }
        } else {
          e.weights.push(topicWeight[r]);
        }
        // A heading the question names in its own words (Prodigal Son,
        // Debt, Honesty) gets a per-name lift for its references.
        if (!e.nameCounted) { e.nameCounted = true; e.bonus += nameBonus; }
      }
    });
    for (const [ref, e] of topicPts) addCand(ref, Math.max(...e.weights) + 2 * (e.weights.length - 1) + e.bonus);
    for (const [vi, sc] of topVerses) addCand(verseKeys[vi], Math.min(4 + 2 * sc.distinct, 12));
    const ftHitStems = new Map();
    for (const [vi, sc] of topVerses) ftHitStems.set(verseKeys[vi], sc.stems);

    // comparison step: cross-reference reinforcement (TSK) among candidates.
    // Ranges count whole: every verse a candidate covers is indexed, and a
    // cross-reference connects when it lands anywhere inside another
    // candidate's range. (First-verse-only matching missed real links —
    // e.g. the cross-references recorded at Matthew 17:25 for a candidate
    // listed as "Matthew 17:24-27".)
    const candVerses = new Map();
    const verseCoveredBy = new Map();
    for (const ref of cand.keys()) {
      const { verses } = expandRef(ref, 40);
      candVerses.set(ref, verses);
      for (const v of verses) {
        if (!verseCoveredBy.has(v)) verseCoveredBy.set(v, new Set());
        verseCoveredBy.get(v).add(ref);
      }
    }
    const connectedOut = new Map();
    for (const ref of cand.keys()) {
      const connected = new Set();
      // Connections are read from the records of the passage's first three
      // verses — its head is its identity. (Reading a whole chapter's
      // records lets long narrative and genealogy passages connect to
      // everything and crowd out the passages the question is about.)
      for (const v of (candVerses.get(ref) || []).slice(0, 3)) {
        for (const t of xrefByVerse.get(v) || []) {
          const tfv = firstVerseOf(t);
          const owners = tfv ? verseCoveredBy.get(tfv) : null;
          if (owners) for (const o of owners) if (o !== ref) connected.add(o);
        }
      }
      connectedOut.set(ref, connected);
    }
    // Reinforcement runs both ways (Nov 5, 2026 fix pass): a candidate
    // also earns credit for being pointed TO by other candidates
    // (in-degree). Without it, a heading's most-cross-referenced teaching
    // texts sat mid-list behind verses that merely mention the concept
    // word.
    const inDegree = new Map();
    for (const connected of connectedOut.values()) {
      for (const o of connected) inDegree.set(o, (inDegree.get(o) || 0) + 1);
    }
    for (const [ref, connected] of connectedOut) {
      const bonus = Math.min(connected.size, 4) + Math.min(inDegree.get(ref) || 0, 3);
      if (bonus) cand.set(ref, cand.get(ref) + bonus);
    }
    // Phrase-rule reference boosts (Nov 5, 2026 fix pass).
    for (const rule of matchedPhraseRules(question)) {
      for (const [ref, pts] of Object.entries(rule.boostRefs)) {
        if (cand.has(ref)) cand.set(ref, cand.get(ref) + pts);
      }
    }
    // When the question is about anxiety or worry, demote reverence-fear
    // texts - "fear the LORD" is worship vocabulary, not the feeling the
    // visitor brought (Nov 5, 2026 fix pass).
    if (concepts.some((c) => c.stem === "anxiety" || c.stem === "worri" || c.stem === "worry")) {
      for (const ref of cand.keys()) {
        const head = (candVerses.get(ref) || []).slice(0, 3).join(" ").toLowerCase();
        if (/fear (me|the lord|him|thee|god)\b/.test(head) || head.includes("learn to fear")) {
          cand.set(ref, cand.get(ref) - 12);
        }
      }
    }
    // Marriage questions carrying save/struggle/restore intent: demote
    // the divorce-law references below the covenant teaching - they answer
    // a different question than the one asked (Nov 5, 2026 fix pass).
    const qLower = String(question || "").toLowerCase();
    if (concepts.some((c) => c.stem === "marriage") && /\b(sav\w*|struggl\w*|restor\w*|fix\w*|troubl\w*|repair\w*|falling apart|heal\w*)\b/.test(qLower)) {
      const DIVORCE_LAW = ["Matthew 5:31", "Matthew 5:32", "Matthew 19:9", "Mark 10:11", "Mark 10:12", "Luke 16:18", "Deuteronomy 24:1", "Matthew 22:30", "Mark 12:25", "Luke 20:35"];
      for (const ref of cand.keys()) {
        if (DIVORCE_LAW.some((d) => ref === d || ref.startsWith(d + "-"))) cand.set(ref, cand.get(ref) - 9);
      }
    }
    // ---- Search-side widening for thin answers (Nov 8, 2026) ----
    // Some questions reach the ranking with a candidate set that is
    // empty of the thing the question is plainly about: "I lost my wife
    // last year and I can't sleep" ranked nine passages about the
    // sabbatic year (they matched the word "year") and nothing on grief
    // or sleep at all. When a plain-meaning theme below matches the
    // question AND none of the theme's anchor passages (its Nave's
    // headings' references plus their curated supplements) reached the
    // ranked set, the set is widened from the engine's own resources —
    // no outside call: the theme headings' references enter as new
    // candidates at a fixed competitive score (their curated flagship
    // texts higher), and a full-text scan over the theme's own stems
    // (grief -> sorrow, mourn, comfort, tear, weep; sleep -> sleep,
    // night, rest, watch) adds its strongest verses. The original
    // candidates stay in the set; the re-ranking below decides.
    const WIDEN_THEMES = [
      {
        name: "bereavement",
        test: (q, cs) => /\b(lost|losing|lose)\s+(my\s+|his\s+|her\s+|their\s+)?(wife|husband|spouse|mother|father|mom|dad|son|daughter|child|children|brother|sister)\b/.test(q)
          || cs.some((c) => ["died", "death", "dead", "grief", "griev", "mourn", "widow", "funeral"].includes(c.stem)),
        topics: ["Comfort", "Mourning"],
        stems: ["sorrow", "mourn", "comfort", "tear", "weep"],
      },
      {
        name: "sleeplessness",
        test: (q, cs) => cs.some((c) => c.stem === "sleep" || c.stem === "sleepless")
          && /(can'?t|cannot|trouble|hard|never|no)\b/.test(q),
        topics: ["Sleep"],
        stems: ["sleep", "night", "rest", "watch"],
      },
    ];
    const themeAnchorRefs = (theme) => {
      const s = new Set();
      for (const n of theme.topics) {
        const ti = topicByName.get(n);
        if (ti !== undefined) for (const ri of topicsData.byTopic[ti]) s.add(topicsData.refs[ri]);
        for (const r of CURATED_TOPIC_REFS[n] || []) s.add(r);
      }
      return s;
    };
    const widenWithThemes = (currentRanked) => {
      const matched = WIDEN_THEMES.filter((t) => t.test(qLower, concepts));
      let added = false;
      for (const theme of matched) {
        const anchors = themeAnchorRefs(theme);
        if (currentRanked.some((r) => anchors.has(r))) continue; // the theme already reached the answer
        for (const tname of theme.topics) {
          const ti = topicByName.get(tname);
          if (ti === undefined) continue;
          const curated = curatedByTopic.get(tname);
          for (const ri of topicsData.byTopic[ti].slice(0, 60)) {
            const ref = topicsData.refs[ri];
            if (!cand.has(ref)) { cand.set(ref, curated && curated.has(ref) ? 22 : 15); added = true; }
          }
        }
        const themeStems = theme.stems.map(stem);
        const hits = [];
        src.stemSets.forEach((set, i) => {
          let d = 0;
          for (const s of themeStems) if (set.has(s)) d++;
          if (d) hits.push([i, d]);
        });
        hits.sort((a, b) => b[1] - a[1]);
        for (const [vi, d] of hits.slice(0, 8)) {
          const ref = verseKeys[vi];
          if (!cand.has(ref)) { cand.set(ref, Math.min(4 + 2 * d, 12)); added = true; }
        }
      }
      return added;
    };

    // Score ties break toward the more focused reference (a single verse
    // before a long range) and then by canonical order — pure canonical
    // order systematically led answers with OT legal blocks over the
    // focused sayings the question is really about.
    const refSpan = (ref) => {
      const p = parseRef(ref);
      if (!p) return 500;
      return p.chapterOnly ? 500 : (p.ch2 - p.ch1) * 100 + (p.v2 - p.v1);
    };
    const byScoreCmp = (a, b) =>
      (cand.get(b) || 0) - (cand.get(a) || 0) ||
      refSpan(a) - refSpan(b) ||
      (ordinal.get(firstVerseOf(a)) ?? 0) - (ordinal.get(firstVerseOf(b)) ?? 0);
    const rankCandidates = () => {
    const byScore = [...cand.entries()].sort((x, y) => byScoreCmp(x[0], y[0])).map(([ref]) => ref);
    // The answer is led by score: the nine strongest candidates, in score
    // order. Representation guarantee: every top topic must appear at
    // least once — if a topic's references all fell below the cut, its
    // best-scoring reference swaps in for the lowest-scoring entry that
    // isn't another topic's sole representative.
    let rankedRefs = byScore.slice(0, 9);
    const protectedRefs = new Set();
    // Curated flagship references that made the cut are protected from
    // guarantee swaps (Nov 5, 2026 fix pass): Matthew 6:25-34 kept being
    // evicted from the anxiety answer by weaker headings' guarantees.
    for (const [ti] of topTopics) {
      const curated = curatedByTopic.get(topicsData.topics[ti]);
      if (!curated) continue;
      for (const r of rankedRefs) if (curated.has(r)) protectedRefs.add(r);
    }
    for (const [ti] of topTopics) {
      const trefs = new Set(topicsData.byTopic[ti].slice(0, 120).map((ri) => topicsData.refs[ri]));
      if (rankedRefs.some((r) => trefs.has(r))) {
        for (const r of rankedRefs) if (trefs.has(r)) { protectedRefs.add(r); break; }
        continue;
      }
      const best = byScore.find((r) => trefs.has(r));
      if (!best) continue;
      for (let i = rankedRefs.length - 1; i >= 0; i--) {
        if (!protectedRefs.has(rankedRefs[i])) {
          // Margin rule (Nov 5, 2026 fix pass): a topic whose best
          // reference is far below the cut does not evict a much stronger
          // passage - on the anxiety question this guarantee swapped out
          // Matthew 6:25-34 and Philippians 4:6 (25 each) for the Fear
          // and Joy headings' best (21).
          if ((cand.get(rankedRefs[i]) || 0) - (cand.get(best) || 0) > 6) break;
          rankedRefs[i] = best;
          break;
        }
      }
      protectedRefs.add(best);
    }
    rankedRefs = [...new Set(rankedRefs)].sort(byScoreCmp);
    // Cap the slots any single concept's full-text scan can fill (Nov 5,
    // 2026 fix pass): "silver" alone put six Genesis references from the
    // scan across a debt answer's top nine, crowding out the debt
    // headings' own texts. Topic-sourced references are exempt.
    {
      const stemCounts = new Map();
      const kept = [];
      for (const ref of rankedRefs) {
        if (topicPts.has(ref)) { kept.push(ref); continue; }
        const hits = ftHitStems.get(ref) || [];
        if (hits.some((s) => (stemCounts.get(s) || 0) >= 3)) continue;
        for (const s of hits) stemCounts.set(s, (stemCounts.get(s) || 0) + 1);
        kept.push(ref);
      }
      rankedRefs = kept.slice(0, 9);
    }
    return rankedRefs;
    };
    let rankedRefs = rankCandidates();
    // Widening (see WIDEN_THEMES above): if a plain-meaning theme never
    // reached the ranked set, add its candidates and rank once more.
    if (!opts.forceTopic && widenWithThemes(rankedRefs)) rankedRefs = rankCandidates();
    // Passage completion (see completeRef above): fragments that do not
    // contain their own teaching are completed to the passage they
    // belong to, then de-duplicated — a completed range may duplicate
    // a candidate already in the set.
    {
      const topTopicRefSets = topTopics.map(([ti]) => new Set(topicsData.byTopic[ti].map((ri) => topicsData.refs[ri])));
      rankedRefs = [...new Set(rankedRefs.map((ref) => completeRef(ref, src, topTopicRefSets)))];
    }
    if (!rankedRefs.length) return null;

    // Crisis phrasing gets a care-first assembly (P0, Nov 5, 2026 fix
    // pass): the curated comfort set leads, in its own order, ahead of
    // whatever the search ranked, and the displayed topics reflect that.
    const crisis = isCrisis(question);
    let crisisTopics = null;
    if (crisis) {
      const comfort = COMFORT_REFS.filter((r) => expandRef(r).verses.length);
      rankedRefs = [...comfort, ...rankedRefs.filter((r) => !comfort.includes(r))].slice(0, 9);
      crisisTopics = ["Comfort", "Hope"];
    }

    // The full text of each ranked passage in the chosen translation,
    // as handed to the Gemini reader step (server-side only — see
    // parts.fullPassages below): every verse joined in order, no verse
    // numbers. Passages longer than twenty verses are handed as head +
    // closing verses, the same shape the answer body displays; the
    // reader may quote only what it is handed, and validation checks
    // its quotations against exactly these texts.
    const handedText = (ref) => {
      const { verses } = expandRef(ref, 40);
      if (!verses.length) return "";
      const join = (arr) => arr.map((v) => src.text[v]).join(" ");
      if (verses.length > 20) return join(verses.slice(0, 12)) + " … " + join(verses.slice(-3));
      return join(verses);
    };

    // assemble the answer in the site's established shape
    // De-inversion can make two distinct Nave's headings display identically
    // (e.g. "Bush, Burning" alongside a literal "Burning Bush") — show each
    // displayed name once.
    // Display filter (Nov 8, 2026): name only the topics that actually
    // contributed a passage to this answer. Scoring can lift a heading
    // into the top set on entry-index noise alone ("Industry" on a
    // Sundays question, "Punishment" on a burnout question); naming it
    // in the answer claims a relevance it never earned. If nothing in
    // the top set contributed (a pure full-text answer), the top set is
    // named as before. Crisis topics are set by the care assembly above
    // and are exempt.
    let displayTopics = topTopics;
    if (!crisisTopics) {
      const contributing = topTopics.filter(([ti]) => {
        const trefs = new Set(topicsData.byTopic[ti].slice(0, 120).map((ri) => topicsData.refs[ri]));
        return rankedRefs.some((r) => trefs.has(r));
      });
      if (contributing.length) displayTopics = contributing;
    }
    const topicNames = crisisTopics || [...new Set(displayTopics.map(([ti]) => displayTopicName(topicsData.topics[ti])))];
    const themesLine = topicNames.length ? topicNames.join("; ") : "searched across the whole Bible";
    // The assembly is a function of the passage ORDER and an optional
    // reader explanation (Nov 8, 2026): the search calls it once with
    // its own ranking and no explanation (the template answer); the
    // handler may call it again through parts.rebuild with the
    // reader's chosen lead first and its validated explanation, which
    // is inserted directly after the lead passage and before the
    // supporting passages. With explanation null the output is the
    // template assembly exactly as before.
    const assembleAnswer = (orderedRefs, explanation) => {
    const passages = orderedRefs.slice(0, 3).map((ref, idx) => {
      // Ranges longer than the display cap show head + closing verses
      // (Nov 5, 2026 fix pass): the prodigal's homecoming (Luke 15:20-24)
      // sat past the old 8-verse cut. The lead passage of a long range
      // gets a wider head (12 verses), enough to reach the homecoming.
      // Both segments are verbatim Scripture in the chosen translation.
      const { verses, truncated } = expandRef(ref, 40);
      if (!verses.length) return { ref, text: "" };
      if (verses.length > 8) {
        const headN = idx === 0 && verses.length > 15 ? 12 : 5;
        const head = verses.slice(0, headN).map((v) => src.text[v]).join(" ");
        const tail = verses.slice(-3).map((v) => src.text[v]).join(" ");
        return { ref, text: head + " … " + tail };
      }
      const text = verses.map((v) => src.text[v]).join(" ");
      return { ref, text: text + (truncated ? " …" : "") };
    });
    // The panel carries every ranked reference, not just the three in
    // the answer body, so the page's passage reader can show any of them
    // in the chosen translation (Nov 8, 2026).
    const panelPassages = {};
    for (const ref of orderedRefs) {
      const t = panelPassageText(ref, ref === orderedRefs[0], src);
      if (t) panelPassages[ref] = { title: `${ref} — ${src.name}`, text: t };
    }
    const [firstRef, secondRef] = orderedRefs;
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
    if (crisis) {
      // The "what would I do differently this week" reflection is the
      // wrong shape for a crisis answer (P0, Nov 5, 2026 fix pass).
      questions[2] = "Who is one person who cares about you that you can tell honestly how you are feeling today?";
    }
    const plainGuidance = crisis
      ? `You do not have to carry this alone, and what you are feeling matters. If you might act on thoughts of harming yourself, please call or text 988 right now - the Suicide and Crisis Lifeline (US) is free, confidential, and answered around the clock by people who will listen. If you are in immediate danger, call 911. Then reach out today to one person who cares about you - a family member, a friend, a pastor, or a counselor - and tell them honestly how you are feeling. The passages above are God's own words for a broken heart: he is near to you, he will never leave you, and nothing can separate you from his love.`
      : `Search the Scriptures above before deciding. Notice the repeated biblical themes: ${topicNames.map((t) => t.toLowerCase()).join(", ")}. Do not treat one verse as a shortcut; compare the whole counsel of Scripture, seek wise counsel, and consider the fruit of each possible path.`;
    const nextStep = crisis
      ? `Read the passages above slowly - start with ${firstRef} - and let them say what they say: God is near, and he has not let go of you. Then make the call or send the message to the person you named above, today.`
      : `Read the passages above in full - start with ${firstRef}${secondRef ? ` and ${secondRef}` : ""} - and pray through them before you decide. Then talk the decision over with a trusted believer who knows your situation, and take the step that best matches the pattern of Scripture you found.`;
    const guidance =
      `Situation:\n${question}\n\n` +
      `Biblical Topics Found:\n${themesLine}\n\n` +
      `Biblical Principle:\n${principle}\n\n` +
      `Related Biblical Story / Passage:\n${passages.length ? `${passages[0].ref}\n${passages[0].text}` : ""}\n\n` +
      (explanation ? `Understanding the Lead Passage:\n${explanation}\n\n` : "") +
      `Additional Biblical Connections:\n${passages.slice(1).map((p) => `${p.ref}\n${p.text}`).join("\n\n")}\n\n` +
      `${src.name} Scripture References:\n${orderedRefs.join("; ")}\n\n` +
      `Reflection Questions:\n${questions.map((q) => "- " + q).join("\n")}\n\n` +
      `Plain-Language Guidance:\n${plainGuidance}\n\n` +
      `Next Wise Step:\n${nextStep}\n\n` +
      `Disclaimer:\nWisdomCompass provides spiritual and biblical guidance only. It is not legal, medical, mental health, financial, or emergency advice. For urgent danger, abuse, self-harm, or emergency situations, contact emergency services, a qualified professional, or trusted local help immediately.`;
    return { guidance, passages: panelPassages };
    };
    const built = assembleAnswer(rankedRefs, null);
    return {
      guidance: built.guidance,
      passages: built.passages,
      meta: { topics: topicNames, leadRef: rankedRefs[0] || null, refs: rankedRefs, translation: src.id },
      // Server-side only (the handler never serializes this): what the
      // Gemini reader step works from — the ranked references, their
      // full texts, whether this is a crisis answer, and the rebuild
      // entry point. The reader can only reorder the retrieved
      // references and add a validated explanation; the passage set,
      // the texts, the reflection questions and the disclaimer always
      // come from this search alone.
      parts: {
        crisis, topics: topicNames, refs: rankedRefs,
        fullPassages: rankedRefs.map((ref) => ({ ref, text: handedText(ref) })),
        rebuild: (orderedRefs, explanation) => assembleAnswer(orderedRefs, explanation),
      },
    };
  }

  // How much matching weight a concept carries: topics whose name or entry
  // text it hits. Used to find the weakest concept for a relaxed retry.
  function conceptWeight(c) {
    let w = (entryIndex[c.stem] || []).length;
    for (const words of topicNameWords) if (words.has(c.stem)) w += 25;
    return w;
  }

  // The answering entry point. Every question is answered by the search,
  // freshly, through this one path:
  //   1. normal pass;
  //   2. relaxed pass — the weakest concept dropped and synonym stems
  //      allowed into the full-text scan (broader concepts);
  //   3. last resort — the same assembly run against Nave's WISDOM topic,
  //      so even an unmatchable question gets a search-produced answer
  //      about seeking wisdom, never a stored composed answer.
  function answerSearch(question, translation) {
    let r = searchAnswer(question, { translation });
    if (r) return { answer: r, level: 1 };
    const concepts = conceptsOf(question);
    if (concepts.length > 1) {
      const weakest = concepts.reduce((a, b) => (conceptWeight(b) < conceptWeight(a) ? b : a));
      r = searchAnswer(question, { concepts: concepts.filter((c) => c !== weakest), relaxed: true, translation });
      if (r) return { answer: r, level: 2 };
    }
    if (concepts.length) {
      r = searchAnswer(question, { relaxed: true, translation });
      if (r) return { answer: r, level: 3 };
    }
    return { answer: searchAnswer(question, { forceTopic: "Wisdom", translation }), level: 4 };
  }

  SEARCH = { searchAnswer: answerSearch, conceptsOf };
  return SEARCH;
}

// Every question is answered by the whole-Bible search — no guide layer,
// no threshold (Jeff's decision, Nov 4, 2026). The search's own fallback
// chain (relaxed retry, then the WISDOM topic through the same machinery)
// lives inside answerSearch above, which also reports which step answered
// (the level) for the anonymous question log. The Gemini reader step
// lives in the handler below: it receives only what this search
// retrieved, may reorder those references by choosing the lead, and may
// add a validated explanation — it can never change the passage set,
// the texts, or the disclaimer — and without GEMINI_API_KEY the answers
// are exactly this search's template assembly, as they have been since
// Nov 4, 2026.
function answerFor(situation, translation) {
  const { answer } = loadSearch().searchAnswer(situation, translation);
  return answer ? { guidance: answer.guidance, passages: answer.passages } : answer;
}

// Broad internal category for the question log's demand map only — never
// shown on the site, never used to shape an answer or an offer. Sensitive
// areas are flagged exactly as Jeff's partner model requires.
const CATEGORY_RULES = [
  ["Money", /\b(debt|money|loan|loans|mortgage|tax|taxes|bankrupt\w*|borrow\w*|lend\w*|credit|bills?|financ\w*|budget|invest\w*|retire\w*|salary|wages?|rent|purchase|buying|sell\w*|price|costs?)\b/],
  ["Family & Marriage", /\b(marri\w*|husband|wife|spouse|divorc\w*|child|children|kids?|parent\w*|mother|father|family|son|daughter|baby|teen\w*|sibling|brother|sister)\b/],
  ["Work & Career", /\b(job|work|career|boss|coworker|co-worker|fired|hir\w+|business|employ\w*|office|promotion|quit|resign\w*)\b/],
  ["Health", /\b(health|sick\w*|illness|doctor|pain|cancer|disease|anxiet\w*|anxious|depress\w*|sleep|weight|diet|medical|hospital|surgery|diagnos\w*)\b/],
  ["Home", /\b(house|home|landlord|tenant|neighbor\w*|moving|apartment|property|renovat\w*)\b/],
];
const SENSITIVE_RE = /\b(grief|grieving|died|death|funeral|abuse|abusive|suicid\w*|self-harm|crisis|miscarriage|widow\w*|giving up|give up on life|end my life|hurt myself|can't go on|no reason to live|tired of living)\b/;
function categoryOf(question) {
  const q = String(question || "").toLowerCase();
  let cat = "Other";
  for (const [name, re] of CATEGORY_RULES) if (re.test(q)) { cat = name; break; }
  if (SENSITIVE_RE.test(q)) cat += " (sensitive — no offers)";
  return cat;
}


// ---- Gemini reader + explainer step (Nov 8, 2026) ----
// Jeff's standard, set Nov 8, 2026 after his own test of the site: for
// ANY question a visitor asks, the answer must (1) lead with the
// passage that truly answers it and (2) explain that passage in plain
// language — the scene, what it meant, the teaching, how it bears on
// the question, and the related passages read together. No preset
// questions or answers: the search above retrieves the candidates, and
// this step — exactly ONE Gemini call per question — reads them,
// chooses the lead by meaning and context (not shared wording), and
// writes the explanation from the provided passages only. It runs only
// on the Gemini API's free tier (this site carries no paid services),
// only when GEMINI_API_KEY is present, and never for crisis answers,
// which are assembled locally above and never leave the site. Every
// output is validated against the fences in validateReading; any
// failure — network, quota, timeout, malformed output, a lead outside
// the candidate set, an invented reference, an altered quote, a
// missing section — falls back silently to the search's own template
// assembly, unchanged. With no key set, nothing in this section runs.
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_TIMEOUT_MS = 8000;
const BIBLE_BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther",
  "Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
  "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation"];
const BOOK_ALT = [...BIBLE_BOOKS].sort((a, b) => b.length - a.length)
  .map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const REF_RE = new RegExp(`\\b(?:${BOOK_ALT})\\s+\\d+:\\d+(?:\\s*-\\s*(?:\\d+:)?\\d+)?`, "g");
const CHAPTER_REF_RE = new RegExp(`\\b(?:${BOOK_ALT})\\s+\\d+\\b(?!\\s*:)`, "g");

function parseRefSimple(ref) {
  let m = String(ref).match(/^(.+?) (\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
  if (m) return { book: m[1], ch1: +m[2], v1: +m[3], ch2: m[4] ? +m[4] : +m[2], v2: m[5] ? +m[5] : +m[3] };
  m = String(ref).match(/^(.+?) (\d+)$/);
  if (m) return { book: m[1], ch1: +m[2], v1: 1, ch2: +m[2], v2: 999 };
  return null;
}
// A cited reference is within bounds when its whole span sits inside one
// of the retrieved references' spans (same book).
function refCovered(cited, allowedRefs) {
  const c = parseRefSimple(cited);
  if (!c) return false;
  for (const a of allowedRefs) {
    const p = parseRefSimple(a);
    if (!p || p.book !== c.book) continue;
    const afterStart = c.ch1 > p.ch1 || (c.ch1 === p.ch1 && c.v1 >= p.v1);
    const beforeEnd = c.ch2 < p.ch2 || (c.ch2 === p.ch2 && c.v2 <= p.v2);
    if (afterStart && beforeEnd) return true;
  }
  return false;
}
const normalizeForQuote = (s) => String(s || "")
  .replace(/^\s*\d+\s+/gm, " ")           // verse numbers in the panel text
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();

// The five explanation sections, in order (Nov 8, 2026). The reader is
// instructed to head each section with exactly these words; validation
// requires all five, in this order, before an explanation may be used.
const READER_SECTIONS = ["The scene", "What it meant", "The teaching", "For your question", "Read together"];

// Returns { lead, explanation } or null. Null always means "use the
// template assembly" — this function never throws.
// Fences: the chosen lead must be one of the retrieved references;
// every reference the explanation names must be covered by the
// retrieved set; every quotation must appear verbatim (word for word,
// in the established normalized comparison) in the passage texts the
// reader was handed; all five sections present, in order; no links.
function validateReading(obj, allowedRefs, haystack) {
  if (!obj || typeof obj !== "object") return null;
  const lead = String(obj.lead || "").replace(/\s+/g, " ").trim();
  const explanation = String(obj.explanation || "").trim();
  if (!allowedRefs.includes(lead)) return null;
  if (explanation.length < 200 || explanation.length > 4500) return null;
  if (/https?:\/\//i.test(explanation)) return null;
  let pos = -1;
  for (const h of READER_SECTIONS) {
    const i = explanation.toLowerCase().indexOf(h.toLowerCase(), pos + 1);
    if (i < 0) return null;
    pos = i;
  }
  const cited = [...(explanation.match(REF_RE) || []), ...(explanation.match(CHAPTER_REF_RE) || [])];
  for (const c of cited) if (!refCovered(c.replace(/\s+/g, " "), allowedRefs)) return null;
  const hay = " " + normalizeForQuote(haystack) + " ";
  const quotes = explanation.match(/["\u201C]([^"\u201D]{10,})["\u201D]/g) || [];
  for (const q of quotes) {
    const inner = normalizeForQuote(q.slice(1, -1));
    if (inner && !hay.includes(" " + inner + " ") && !hay.includes(inner)) return null;
  }
  return { lead, explanation };
}

const READER_SYSTEM = `You are the explanation step for a Bible guidance tool. A visitor has asked a question, and a Bible search has already gathered the passages that may answer it. From the passages provided, choose the ONE that most directly answers the visitor's question — judge by what each passage actually is and means in context (direct teaching, story, wisdom, or metaphor), not by shared wording. Then write a plain-language explanation of the chosen passage in five sections, in this order, each section headed by exactly the words given, on its own line:
1. "The scene" — who is speaking or what is happening.
2. "What it meant" — what it meant in its setting.
3. "The teaching" — the teaching, point by point.
4. "For your question" — how it bears on the visitor's question.
5. "Read together" — the related passages from the provided set, read together.

Rules: use ONLY the passages provided; quote them exactly as given, word for word, and put quotation marks around every quotation; name no passage that was not provided; do not add advice beyond what the passages support; write plainly and warmly, in modern English, speaking to one person ("you"), with no church jargon.

Return ONLY a JSON object: {"lead": "<the reference of the chosen passage, exactly as provided>", "explanation": "<the five-section explanation>"}. No markdown, no text outside the JSON.`;

// Exactly ONE Gemini call. Returns { lead, explanation } or null —
// null on any failure (no key, network, quota, timeout, malformed
// output, or a fence rejection), and the caller falls back to the
// template assembly. This function never throws.
async function readWithGemini({ question, fullPassages }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !fullPassages || !fullPassages.length) return null;
  const refs = fullPassages.map((p) => p.ref);
  const material = fullPassages.map((p) => `${p.ref}\n${p.text}`).join("\n\n");
  const userPrompt =
    `Visitor's question:\n${question}\n\n` +
    `Passages the search retrieved (quote ONLY from these, word for word; name no others):\n${material}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: READER_SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 1800 },
        }),
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const text = (((data.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text || "").join("") || "";
    if (!text) return null;
    let obj;
    try { obj = JSON.parse(text); } catch { return null; }
    const haystack = fullPassages.map((p) => p.text).join("\n");
    return validateReading(obj, refs, haystack);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const situation = String(req.body?.situation || "").trim().slice(0, 3000);
    if (!situation) return res.status(400).json({ error: "Please describe your situation first." });
    // Bible text choice (Nov 8, 2026): the Berean Standard Bible is the
    // default; "kjv" serves the King James text end to end.
    const translation = String(req.body?.translation || "").toLowerCase() === "kjv" ? "kjv" : "bsb";
    const search = loadSearch();
    const { answer, level } = search.searchAnswer(situation, translation);
    if (!answer) return res.status(500).json({ error: "Something went wrong. Please try again." });
    // Reader + explainer step (see the Gemini section above): one call
    // for any non-crisis question, and only when the free-tier key is
    // in place. On success the answer is rebuilt with the reader's
    // chosen passage leading and its validated explanation in place;
    // any failure leaves the search's own assembly untouched. Crisis
    // answers never leave the site.
    let composed = false;
    if (process.env.GEMINI_API_KEY && answer.parts && !answer.parts.crisis) {
      const r = await readWithGemini({
        question: situation,
        fullPassages: answer.parts.fullPassages,
      }).catch(() => null);
      if (r) {
        const ordered = [r.lead, ...answer.parts.refs.filter((x) => x !== r.lead)];
        const rebuilt = answer.parts.rebuild(ordered, r.explanation);
        answer.guidance = rebuilt.guidance;
        answer.passages = rebuilt.passages;
        answer.meta = { ...answer.meta, leadRef: r.lead, refs: ordered };
        composed = true;
      }
    }
    // Anonymous question log (disclosed on the privacy page): one record
    // per answered question — the question, the concepts/topics/lead
    // passage the search used, and which fallback step answered. No
    // identity of any kind is recorded. The append's promise is handed to
    // waitUntil: the answer returns immediately, the host keeps the
    // function alive until the append settles, and a logging failure is
    // swallowed — it can never delay or break the answer. (A bare
    // fire-and-forget append was silently frozen by the host after the
    // response in production; waitUntil is the fix, Nov 4, 2026.) The
    // logId is a per-question record key (not a visitor identifier); the
    // optional satisfaction thumbs use it to attach to this question's
    // record.
    const logId = randomUUID();
    const pendingLog = logQuestion([
      new Date().toISOString(),
      logId,
      situation,
      search.conceptsOf(situation).map((c) => c.stem).join(", "),
      (answer.meta && answer.meta.topics ? answer.meta.topics : []).join("; "),
      (answer.meta && answer.meta.leadRef) || "",
      // Which path answered: the search fallback level, with a "g"
      // appended when the Gemini reader step voiced the answer.
      String(level) + (composed ? "g" : ""),
      categoryOf(situation),
    ]);
    try {
      waitUntil(pendingLog);
    } catch { /* non-Vercel run: the append still proceeds on its own */ }
    // refs carries the search's ranking explicitly, in order, so the
    // page's passage panel reads the ranking itself instead of
    // re-deriving it from the answer text (Nov 8, 2026 fix).
    return res.status(200).json({ guidance: answer.guidance, passages: answer.passages, logId, refs: (answer.meta && answer.meta.refs) || [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
