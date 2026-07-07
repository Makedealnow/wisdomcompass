const situationInput=document.getElementById("situation");const generateBtn=document.getElementById("generateBtn");const clearBtn=document.getElementById("clearBtn");const resultBox=document.getElementById("result");const saveBtn=document.getElementById("saveBtn");const historyList=document.getElementById("historyList");const clearHistoryBtn=document.getElementById("clearHistoryBtn");const guidanceDisclaimer=document.getElementById("guidanceDisclaimer");const guidanceTool=document.getElementById("guidanceTool");const agreeDisclaimerBtn=document.getElementById("agreeDisclaimerBtn");let latestGuidance="";
function showGuidanceTool(){if(guidanceDisclaimer)guidanceDisclaimer.style.display="none";if(guidanceTool)guidanceTool.classList.remove("guidance-tool-hidden");if(situationInput)situationInput.focus()}if(agreeDisclaimerBtn){agreeDisclaimerBtn.addEventListener("click",()=>{sessionStorage.setItem("wisdomDisclaimerAccepted","yes");showGuidanceTool()})}if(guidanceDisclaimer&&guidanceTool&&sessionStorage.getItem("wisdomDisclaimerAccepted")==="yes")showGuidanceTool();
function escapeHTML(v){return String(v||"").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",""":"&quot;"}[ch]))}
function localGuidance(text){return `Situation:
${text}

Decision Frame:
- Slow down before acting.
- Separate facts from emotions and pressure.
- Identify who will be affected: you, family, work, finances, reputation, and faith.
- Compare short-term relief with long-term consequences.
- Seek trusted counsel before major decisions.

Wisdom Questions:
- What is true, not just urgent?
- What option protects responsibility, family, and integrity?
- What are the risks if this goes wrong?
- What would you advise someone you love to do?
- Are you deciding from wisdom, or from fear, anger, pride, or pressure?

Values Check:
Guided by timeless wisdom. Grounded in faith. Committed to God, Family, and Country.

Next Wise Step:
Write down the top two options, the cost of each option, the people affected, and one trusted person you should ask for counsel before moving forward.

Disclaimer:
WisdomCompass provides informational decision guidance only. It is not legal, medical, mental health, financial, or emergency advice.`}
async function getGuidance(text){try{const r=await fetch('/api/guidance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({situation:text})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to generate guidance.');return d.guidance||localGuidance(text)}catch(e){console.warn(e);return localGuidance(text)}}
function guidanceToHTML(g){return `<div class="guidance-text decision-output"><h3>Decision Guidance</h3><pre>${escapeHTML(g)}</pre></div>`}
function getHistory(){return JSON.parse(localStorage.getItem('wisdomHistory')||'[]')}function setHistory(h){localStorage.setItem('wisdomHistory',JSON.stringify(h))}function renderHistory(){if(!historyList)return;const h=getHistory();historyList.innerHTML='';if(!h.length){historyList.innerHTML='<p class="microcopy">No saved guidance yet.</p>';return}h.forEach(item=>{const div=document.createElement('div');div.className='history-item';div.innerHTML=`<strong>${escapeHTML(item.date)}</strong><p>${escapeHTML(item.preview)}</p>`;historyList.appendChild(div)})}
if(generateBtn){generateBtn.addEventListener('click',async()=>{const text=situationInput.value.trim();if(!text){alert('Please describe your situation first.');return}generateBtn.disabled=true;generateBtn.textContent='Thinking clearly...';resultBox.classList.remove('empty');resultBox.textContent='Building your decision guidance...';latestGuidance=await getGuidance(text);resultBox.innerHTML=guidanceToHTML(latestGuidance);if(saveBtn)saveBtn.disabled=false;generateBtn.disabled=false;generateBtn.textContent='Get Decision Guidance'})}if(clearBtn){clearBtn.addEventListener('click',()=>{situationInput.value='';latestGuidance='';resultBox.classList.add('empty');resultBox.textContent='Your decision guidance will appear here on this same page.';if(saveBtn)saveBtn.disabled=true})}if(saveBtn){saveBtn.addEventListener('click',()=>{if(!latestGuidance)return;const h=getHistory();h.unshift({date:new Date().toLocaleString(),preview:latestGuidance.slice(0,260)+'...'});setHistory(h.slice(0,10));renderHistory()})}if(clearHistoryBtn){clearHistoryBtn.addEventListener('click',()=>{setHistory([]);renderHistory()})}renderHistory();