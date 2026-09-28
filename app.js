const state={scenes:[],filter:"all",query:"",favorites:new Set(JSON.parse(localStorage.getItem("iphone18proFavorites")||"[]"))};
const $=s=>document.querySelector(s);
document.addEventListener("DOMContentLoaded",init);
async function init(){
  try{
    const r=await fetch("scenes.json"); if(!r.ok) throw Error("scenes.json 載入失敗");
    state.scenes=await r.json(); bindUI(); render();
  }catch(e){$("#sceneGrid").innerHTML=`<div class="error-card">⚠️ 無法載入場景資料。請確認 scenes.json 與網頁在同一資料夾。</div>`;}
}
function bindUI(){
  $("#searchInput").addEventListener("input",e=>{state.query=e.target.value.trim().toLowerCase();render()});
  document.querySelectorAll(".filter-chip").forEach(b=>b.addEventListener("click",()=>{
    state.filter=b.dataset.filter;document.querySelectorAll(".filter-chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");render();
  }));
  $("#sceneGrid").addEventListener("click",e=>{
    const f=e.target.closest("[data-favorite]"); if(f){e.stopPropagation();toggleFavorite(f.dataset.favorite);return}
    const c=e.target.closest("[data-scene]"); if(c) openModal(c.dataset.scene);
  });
  $("#closeModal").addEventListener("click",closeModal);
  $("#modalBackdrop").addEventListener("click",e=>{if(e.target===$("#modalBackdrop"))closeModal()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
}
function matches(s){
  const h=JSON.stringify(s).toLowerCase(), q=!state.query||h.includes(state.query);
  const f=state.filter==="all"||(state.filter==="common"&&s.common)||(state.filter==="favorites"&&state.favorites.has(s.title));
  return q&&f;
}
function render(){
  const a=state.scenes.filter(matches); $("#resultCount").textContent=`${a.length} 個場景`; $("#favoriteCount").textContent=state.favorites.size;
  $("#sceneGrid").innerHTML=a.length?a.map(s=>{
    const fav=state.favorites.has(s.title);
    return `<article class="scene-card" data-scene="${esc(s.title)}"><button class="favorite-btn ${fav?"is-favorite":""}" data-favorite="${esc(s.title)}" title="${fav?"取消最愛":"加入最愛"}">${fav?"★":"☆"}</button><div class="scene-title">${esc(s.title)}</div><div class="scene-subtitle">${esc((s.quick||[]).slice(0,3).join(" · "))}</div><button class="view-btn">查看拍攝建議 →</button></article>`
  }).join(""):`<div class="empty-card">🔎 找不到符合條件的場景。<br><span>可改用其他關鍵字，或查看「全部場景」。</span></div>`;
}
function toggleFavorite(t){
  state.favorites.has(t)?state.favorites.delete(t):state.favorites.add(t);
  localStorage.setItem("iphone18proFavorites",JSON.stringify([...state.favorites]));render();
}
function openModal(t){
  const s=state.scenes.find(x=>x.title===t);if(!s)return;
  const fav=state.favorites.has(t), quick=(s.quick||[]).map(x=>`<span class="quick-pill">${esc(x)}</span>`).join("");
  $("#modalContent").innerHTML=`<div class="detail-header"><div><h2>${esc(s.title)}</h2><p>現場快速設定＋完整參數說明</p></div><button class="detail-favorite ${fav?"is-favorite":""}" id="modalFavorite">${fav?"★ 我的最愛":"☆ 加入最愛"}</button></div>
  <section class="quick-panel"><div class="section-label">⚡ 一眼睇晒</div><div class="quick-pills">${quick||"<span class='quick-pill'>請參考下方完整設定</span>"}</div><button class="copy-btn" id="copySettings">📋 複製這個場景的快速設定</button></section>
  ${tableSection("🔴 必須部分",s.must,"真正影響這個場景成像的核心控制")}
  ${tableSection("🟢 選項",s.options,"按光線、構圖、後期及個人拍攝目的選擇")}
  <section class="detail-section"><h3>🎛️ Camera Control 操作順序</h3><div class="control-flow">${flow(s).map((x,i)=>`<span><b>${i+1}</b>${esc(x)}</span>`).join("")}</div></section>
  <section class="detail-section"><h3>⚠️ 注意事項</h3><ul class="notes">${(s.notes||[]).map(n=>`<li>${esc(n)}</li>`).join("")}</ul></section>`;
  $("#modalBackdrop").classList.add("open");document.body.classList.add("modal-open");
  $("#modalFavorite").onclick=()=>{toggleFavorite(t);openModal(t)};
  $("#copySettings").onclick=()=>copySettings(s);
}
function tableSection(title,rows,sub){
  if(!rows?.length)return"";
  return `<section class="detail-section"><div class="section-heading"><h3>${title}</h3><p>${sub}</p></div><div class="table-wrap"><table><thead><tr><th>🎛️ 參數</th><th>建議設定／選項</th><th>💡 調校原因</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0]||"")}</td><td><strong>${esc(r[1]||"")}</strong></td><td>${esc(r[2]||"")}</td></tr>`).join("")}</tbody></table></div></section>`;
}
function flow(s){
  const names=(s.must||[]).map(r=>r[0]||""), out=[];
  ["曝光","景深","變焦","對焦","夜間模式","風格","色調","快門"].forEach(k=>{const h=names.find(n=>n.includes(k));if(h)out.push(h.split("（")[0])});
  return (out.length?out:["Exposure","Focus","Composition"]).slice(0,4);
}
function copySettings(s){
  const text=[s.title,"","⚡ 一眼睇晒",...(s.quick||[]),"","🔴 必須部分",...(s.must||[]).map(r=>`${r[0]}：${r[1]}`),"","🟢 選項",...(s.options||[]).map(r=>`${r[0]}：${r[1]}`)].join("\n");
  navigator.clipboard?.writeText(text).then(()=>{const b=$("#copySettings");if(b){const old=b.textContent;b.textContent="✅ 已複製";setTimeout(()=>b.textContent=old,1400)}});
}
function closeModal(){$("#modalBackdrop").classList.remove("open");document.body.classList.remove("modal-open")}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
