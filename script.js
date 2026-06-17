const situationInput=document.getElementById("situation");
const generateBtn=document.getElementById("generateBtn");
const clearBtn=document.getElementById("clearBtn");
const resultBox=document.getElementById("result");
const saveBtn=document.getElementById("saveBtn");
const historyList=document.getElementById("historyList");
const clearHistoryBtn=document.getElementById("clearHistoryBtn");
let latestGuidance="";
function fallbackGuidance(text){return `Situation:
${text}

Biblical Principle:
Biblical wisdom begins with humility, prayer, patience, wise counsel, and examining the fruit of a decision.

Related Biblical Story:
Solomon asked God for wisdom before leading others, showing that sound decisions begin with dependence on God rather than pride.

King James Version Scripture References:
James 1:5; Proverbs 3:5-6; Proverbs 11:14; Galatians 5:22-23

Plain-Language Guidance:
Slow down and identify the real issue. Ask what choice reflects wisdom, love, truth, patience, responsibility, and obedience to God.

Next Wise Step:
Pray, read the listed scriptures, seek trusted counsel, and avoid making the decision from fear, anger, pride, or pressure.

Disclaimer:
Wisdom provides spiritual and biblical guidance only. It is not legal, medical, mental health, financial, or emergency advice.`}
async function getGuidance(text){const response=await fetch("/api/guidance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({situation:text})});const data=await response.json();if(!response.ok){throw new Error(data.error||"Unable to generate guidance.")}return data.guidance}
function getHistory(){return JSON.parse(localStorage.getItem("wisdomHistory")||"[]")}
function setHistory(history){localStorage.setItem("wisdomHistory",JSON.stringify(history))}
function renderHistory(){if(!historyList)return;const history=getHistory();historyList.innerHTML="";if(!history.length){historyList.innerHTML='<p class="microcopy">No saved guidance yet.</p>';return}history.forEach((item)=>{const div=document.createElement("div");div.className="history-item";div.innerHTML=`<strong>${item.date}</strong><p>${item.preview}</p>`;historyList.appendChild(div)})}
if(generateBtn){generateBtn.addEventListener("click",async()=>{const text=situationInput.value.trim();if(!text){alert("Please describe your situation first.");return}generateBtn.disabled=true;generateBtn.textContent="Generating...";resultBox.textContent="Preparing biblical guidance...";resultBox.classList.remove("empty");try{latestGuidance=await getGuidance(text)}catch(error){console.warn(error);latestGuidance=fallbackGuidance(text)}resultBox.textContent=latestGuidance;saveBtn.disabled=false;generateBtn.disabled=false;generateBtn.textContent="Get Guidance"})}
if(clearBtn){clearBtn.addEventListener("click",()=>{situationInput.value="";latestGuidance="";resultBox.textContent="Your guidance will appear here.";resultBox.classList.add("empty");saveBtn.disabled=true})}
if(saveBtn){saveBtn.addEventListener("click",()=>{if(!latestGuidance)return;const history=getHistory();history.unshift({date:new Date().toLocaleString(),preview:latestGuidance.slice(0,260)+"..."});setHistory(history.slice(0,25));renderHistory();alert("Saved to history.")})}
if(clearHistoryBtn){clearHistoryBtn.addEventListener("click",()=>{setHistory([]);renderHistory()})}
renderHistory();