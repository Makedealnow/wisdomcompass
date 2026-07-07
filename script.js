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

function showGuidanceTool() {
  if (guidanceDisclaimer) guidanceDisclaimer.style.display = "none";
  if (guidanceTool) guidanceTool.classList.remove("guidance-tool-hidden");
  if (situationInput) situationInput.focus();
}

if (agreeDisclaimerBtn) {
  agreeDisclaimerBtn.addEventListener("click", function () {
    try { sessionStorage.setItem("wisdomDisclaimerAccepted", "yes"); } catch (e) {}
    showGuidanceTool();
  });
}

try {
  if (guidanceDisclaimer && guidanceTool && sessionStorage.getItem("wisdomDisclaimerAccepted") === "yes") {
    showGuidanceTool();
  }
} catch (e) {}

function escapeHTML(value) {
  return String(value || "").replace(/[&<>'"]/g, function (ch) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch];
  });
}

function localGuidance(text) {
  return `Situation:\n${text}\n\nDecision Frame:\n- Slow down before acting.\n- Separate facts from emotions and pressure.\n- Identify who will be affected: you, family, work, finances, reputation, and faith.\n- Compare short-term relief with long-term consequences.\n- Seek trusted counsel before major decisions.\n\nWisdom Questions:\n- What is true, not just urgent?\n- What option protects responsibility, family, and integrity?\n- What are the risks if this goes wrong?\n- What would you advise someone you love to do?\n- Are you deciding from wisdom, or from fear, anger, pride, or pressure?\n\nValues Check:\nGuided by timeless wisdom. Grounded in faith. Committed to God, Family, and Country.\n\nNext Wise Step:\nWrite down the top two options, the cost of each option, the people affected, and one trusted person you should ask for counsel before moving forward.\n\nDisclaimer:\nWisdomCompass provides informational decision guidance only. It is not legal, medical, mental health, financial, or emergency advice.`;
}

async function getGuidance(text) {
  try {
    const response = await fetch("/api/guidance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ situation: text })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to generate guidance.");
    return data.guidance || localGuidance(text);
  } catch (error) {
    console.warn(error);
    return localGuidance(text);
  }
}

function guidanceToHTML(guidance) {
  return `<div class="guidance-text decision-output"><h3>Decision Guidance</h3><pre>${escapeHTML(guidance)}</pre></div>`;
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem("wisdomHistory") || "[]"); }
  catch (e) { return []; }
}
function setHistory(history) {
  try { localStorage.setItem("wisdomHistory", JSON.stringify(history)); } catch (e) {}
}
function renderHistory() {
  if (!historyList) return;
  const history = getHistory();
  historyList.innerHTML = "";
  if (!history.length) {
    historyList.innerHTML = '<p class="microcopy">No saved guidance yet.</p>';
    return;
  }
  history.forEach(function (item) {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<strong>${escapeHTML(item.date)}</strong><p>${escapeHTML(item.preview)}</p>`;
    historyList.appendChild(div);
  });
}

if (generateBtn) {
  generateBtn.addEventListener("click", async function () {
    const text = situationInput ? situationInput.value.trim() : "";
    if (!text) { alert("Please describe your situation first."); return; }
    generateBtn.disabled = true;
    generateBtn.textContent = "Thinking clearly...";
    if (resultBox) {
      resultBox.classList.remove("empty");
      resultBox.textContent = "Building your decision guidance...";
    }
    latestGuidance = await getGuidance(text);
    if (resultBox) resultBox.innerHTML = guidanceToHTML(latestGuidance);
    if (saveBtn) saveBtn.disabled = false;
    generateBtn.disabled = false;
    generateBtn.textContent = "Get Decision Guidance";
  });
}
if (clearBtn) {
  clearBtn.addEventListener("click", function () {
    if (situationInput) situationInput.value = "";
    latestGuidance = "";
    if (resultBox) {
      resultBox.classList.add("empty");
      resultBox.textContent = "Your decision guidance will appear here on this same page.";
    }
    if (saveBtn) saveBtn.disabled = true;
  });
}
if (saveBtn) {
  saveBtn.addEventListener("click", function () {
    if (!latestGuidance) return;
    const history = getHistory();
    history.unshift({ date: new Date().toLocaleString(), preview: latestGuidance.slice(0, 260) + "..." });
    setHistory(history.slice(0, 10));
    renderHistory();
  });
}
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", function () {
    setHistory([]);
    renderHistory();
  });
}
renderHistory();
