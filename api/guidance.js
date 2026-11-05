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
  "make makes keep keeps help please really just can may might must am an's declare christian christians acceptable think thinks know all that thinking every month months week weeks ago day days").split(" "));
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
  anxiou: ["anxiety", "care", "fear"],
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

  function searchAnswer(question, opts = {}) {
    const concepts = opts.concepts || conceptsOf(question);
    let topTopics = null;
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
        topicsData.topics.forEach((_, ti) => {
          const words = topicNameWords[ti];
          if (words.has(c.stem)) { addScore(ti, namePts); nameExact.add(ti); }
          else if (c.stem.length >= 5) {
            for (const w of words) if (w.startsWith(c.stem) || c.stem.startsWith(w)) { addScore(ti, namePts - 4); break; }
          }
        });
        // Entry-index points come from Nave's entry text, where giant
        // topics (Jesus, Paul) are mentioned under hundreds of words.
        // Capped at two concepts per topic so sheer size can't stack its
        // way onto the podium.
        for (const ti of entryIndex[c.stem] || []) {
          const n = eiHits.get(ti) || 0;
          if (n < 2) { addScore(ti, entryPts); eiHits.set(ti, n + 1); }
        }
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
      // One extra slot at most: a topic the question matches by exact name
      // shouldn't be cut just for landing fourth or fifth — prefer an
      // exact-name match (e.g. "Surety (Guarantee)" via a synonym) over a
      // merely high score.
      if (topTopics.length < 4) {
        const extra = resolvedPool.slice(3, 5);
        const pick = extra.find(([ti, s]) => nameExact.has(ti) && s >= 9) || extra.find(([, s]) => s >= 12);
        if (pick) topTopics.push(pick);
      }
      // curated topic bridges (see TOPIC_BRIDGES note above)
      for (const [ti] of [...topTopics]) {
        for (const target of TOPIC_BRIDGES[topicsData.topics[ti]] || []) {
          const bi = topicByName.get(target);
          if (bi !== undefined && !topTopics.some(([t]) => t === bi) && topTopics.length < 4) topTopics.push([bi, 0]);
        }
      }
    }

    // full-text scoring over the whole KJV. The normal pass scans the
    // question's own stems; a relaxed pass also lets the synonym stems join
    // the scan (broader concepts). A forced-topic pass skips the scan.
    const scanStems = opts.forceTopic ? [] : opts.relaxed
      ? concepts.map((c) => c.stem)
      : concepts.filter((c) => c.direct).map((c) => c.stem);
    const ftScore = new Map();
    verseStemSets.forEach((set, i) => {
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
    const topicWeight = [10, 7, 5, 5];
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
        const set = verseStemSets[ordinal.get(v)];
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
      for (const ri of topicsData.byTopic[ti].slice(0, 120)) {
        const ref = topicsData.refs[ri];
        let e = topicPts.get(ref);
        if (!e) { e = { weights: [], bonus: textBonus(ref) }; topicPts.set(ref, e); }
        e.weights.push(topicWeight[r]);
      }
    });
    for (const [ref, e] of topicPts) addCand(ref, Math.max(...e.weights) + 2 * (e.weights.length - 1) + e.bonus);
    for (const [vi, sc] of topVerses) addCand(verseKeys[vi], Math.min(4 + 2 * sc.distinct, 12));

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
    for (const ref of [...cand.keys()]) {
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
      if (connected.size) cand.set(ref, cand.get(ref) + Math.min(connected.size, 4));
    }
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
    const byScore = [...cand.entries()].sort((x, y) => byScoreCmp(x[0], y[0])).map(([ref]) => ref);
    // The answer is led by score: the nine strongest candidates, in score
    // order. Representation guarantee: every top topic must appear at
    // least once — if a topic's references all fell below the cut, its
    // best-scoring reference swaps in for the lowest-scoring entry that
    // isn't another topic's sole representative.
    let rankedRefs = byScore.slice(0, 9);
    const protectedRefs = new Set();
    for (const [ti] of topTopics) {
      const trefs = new Set(topicsData.byTopic[ti].slice(0, 120).map((ri) => topicsData.refs[ri]));
      if (rankedRefs.some((r) => trefs.has(r))) {
        for (const r of rankedRefs) if (trefs.has(r)) { protectedRefs.add(r); break; }
        continue;
      }
      const best = byScore.find((r) => trefs.has(r));
      if (!best) continue;
      for (let i = rankedRefs.length - 1; i >= 0; i--) {
        if (!protectedRefs.has(rankedRefs[i])) { rankedRefs[i] = best; break; }
      }
      protectedRefs.add(best);
    }
    rankedRefs = [...new Set(rankedRefs)].sort(byScoreCmp);
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
    return { guidance, passages: panelPassages, meta: { topics: topicNames, leadRef: rankedRefs[0] || null } };
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
  function answerSearch(question) {
    let r = searchAnswer(question);
    if (r) return { answer: r, level: 1 };
    const concepts = conceptsOf(question);
    if (concepts.length > 1) {
      const weakest = concepts.reduce((a, b) => (conceptWeight(b) < conceptWeight(a) ? b : a));
      r = searchAnswer(question, { concepts: concepts.filter((c) => c !== weakest), relaxed: true });
      if (r) return { answer: r, level: 2 };
    }
    if (concepts.length) {
      r = searchAnswer(question, { relaxed: true });
      if (r) return { answer: r, level: 3 };
    }
    return { answer: searchAnswer(question, { forceTopic: "Wisdom" }), level: 4 };
  }

  SEARCH = { searchAnswer: answerSearch, conceptsOf };
  return SEARCH;
}

// Every question is answered by the whole-Bible search — no guide layer,
// no threshold, no composed answers (Jeff's decision, Nov 4, 2026). The
// search's own fallback chain (relaxed retry, then the WISDOM topic through
// the same machinery) lives inside answerSearch above, which also reports
// which step answered (the level) for the anonymous question log.
// (The old AI path — TOPICAL_GUIDE, the OpenAI client, and the AI_ENABLED
// branch — was removed in the question-log build, Nov 4, 2026: AI was off
// by Jeff's decision, and the dead code only obscured the live search.)
function answerFor(situation) {
  const { answer } = loadSearch().searchAnswer(situation);
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
const SENSITIVE_RE = /\b(grief|grieving|died|death|funeral|abuse|abusive|suicid\w*|self-harm|crisis|miscarriage|widow\w*)\b/;
function categoryOf(question) {
  const q = String(question || "").toLowerCase();
  let cat = "Other";
  for (const [name, re] of CATEGORY_RULES) if (re.test(q)) { cat = name; break; }
  if (SENSITIVE_RE.test(q)) cat += " (sensitive — no offers)";
  return cat;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const situation = String(req.body?.situation || "").trim().slice(0, 3000);
    if (!situation) return res.status(400).json({ error: "Please describe your situation first." });
    const search = loadSearch();
    const { answer, level } = search.searchAnswer(situation);
    if (!answer) return res.status(500).json({ error: "Something went wrong. Please try again." });
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
      String(level),
      categoryOf(situation),
    ]);
    try {
      waitUntil(pendingLog);
    } catch { /* non-Vercel run: the append still proceeds on its own */ }
    return res.status(200).json({ guidance: answer.guidance, passages: answer.passages, logId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
