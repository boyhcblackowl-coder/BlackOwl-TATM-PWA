(function liveDashboardModule(){
"use strict";
const C=window.BO_CONFIG;
const GSI_SCOPE="https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly";
const SHEET_RANGES={
 mart:["'00_CONFIG'!A1:C10","'02_FACT_HIRING'!A1:T2000","'03_EMPLOYER_BRANDING'!A1:P500","'04_PEOPLE_CULTURE'!A1:R300","'06_EXECUTIVE_SUMMARY'!A1:T50"],
 planner:["'Programs'!A1:T1000","'Program_Media'!A1:N1000"]
};
const labels=["Total MP Request","Fulfilled Request","Hiring GAP","Fulfillment Rate","Published Content","Total Reach","Total Engagement","Applications In","Activities Completed","Participation Rate","Activity Budget","Actual Cost"];
const state={token:"",expires:0,tokenClient:null,root:null,loaded:null,start:"",end:"",requested:false,slideIndex:0,slides:[],slideTimer:0,refreshTimer:0,blobs:[]};
const $=(s,root=document)=>root.querySelector(s);
const rowValue=(row,i)=>row&&row[i]!==undefined?row[i]:"";
function getDate(s){
 if(s===null||s===undefined||s==="")return "";
 let v=String(s).trim();
 if(/^\d{5}(\.\d+)?$/.test(v)){const d=new Date(Date.UTC(1899,11,30)+Math.round(Number(v)*86400000));return d.toISOString().slice(0,10);}
 if(/^\d{4}-\d{2}-\d{2}/.test(v))return v.slice(0,10);
 const slash=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
 if(slash)return `${slash[3]}-${slash[1].padStart(2,"0")}-${slash[2].padStart(2,"0")}`;
 const d=new Date(v);
 return isNaN(d.getTime())?"":d.toISOString().slice(0,10);
}
function number(v){
 if(typeof v==="number")return Number.isFinite(v)?v:0;
 const s=String(v||"").trim();
 if(!s)return 0;
 let x=s.replace(/Rp|\s|%/gi,"");
 if(/^\d{1,3}([.,]\d{3})+$/.test(x))x=x.replace(/[.,]/g,"");
 else if(x.includes(",")&&x.includes("."))x=x.replace(/,/g,"");
 else if(x.includes(",")&&/\d+,\d{1,2}$/.test(x)&&x.indexOf(",")===x.lastIndexOf(","))x=x.replace(",",".");
 else x=x.replace(/,/g,"");
 const n=Number(x);return Number.isFinite(n)?n:0;
}
function money(v){return "Rp "+Math.round(v).toLocaleString("id-ID");}
function count(v){return Math.round(v).toLocaleString("id-ID");}
function pct(v){return (Number(v)||0).toLocaleString("id-ID",{minimumFractionDigits:1,maximumFractionDigits:1})+"%";}
function inRange(value){
 const d=getDate(value);
 return !!d&&(!state.start||d>=state.start)&&(!state.end||d<=state.end);
}
function mapping(rows){
 const ret=new Map();
 for(const r of rows){for(const i of [0,2,4])if(typeof r[i]==="string"&&r[i].trim())ret.set(r[i].trim(),rowValue(r,i+1));}
 return ret;
}
function settingStatus(s,good=false){
 const root=state.root;
 if(!root||!root.isConnected)return;
 const x=$("#boLiveStatus",root);
 if(x){x.textContent=s;x.dataset.state=good?"ok":"notice";}
}
function fillKpis(values){
 const root=state.root;if(!root||!root.isConnected)return;
 root.querySelectorAll(".bo-kpi-card").forEach((card,i)=>{
   const text=card.querySelector("strong"),note=card.querySelector("small");
   if(text)text.textContent=values[i];
   if(note)note.textContent="Management Data Mart • Authorized live";
 });
}
function create(tag,cl,text){
 const node=document.createElement(tag);
 if(cl)node.className=cl;
 if(text!==undefined)node.textContent=String(text);
 return node;
}
function showPrograms(rows){
 const root=state.root;if(!root||!root.isConnected)return;
 const wrap=$(".bo-native-updates",root);
 if(!wrap)return;
 wrap.replaceChildren();
 const head=create("div","bo-native-updates-title");
 head.append(create("h3",null,"Update Program Terbaru"),create("span",null,`${rows.length} program aktif`));
 wrap.append(head);
 for(const p of rows.slice(0,5)){
   const r=create("div","bo-update-row");
   const line=create("div","bo-update-title");
   line.append(create("b",null,p.title||"Program"),create("span","bo-status",p.status||"Planning"));
   const meta=create("p",null,`${p.owner||"Tim"} • ${p.workstream||"TA & TM"} • ${Math.round(number(p.progress))}%`);
   const a=create("a",null,"Detail Program ↗");a.href=C.workspaceUrl+"?page=planner#planner";a.target="_blank";a.rel="noopener noreferrer";
   r.append(line,meta,a);wrap.append(r);
 }
}
function revokeBlobs(){
 for(const url of state.blobs)try{URL.revokeObjectURL(url);}catch(e){}
 state.blobs=[];
}
function slideshow(){
 const root=state.root;
 if(!root||!root.isConnected||!state.slides.length)return;
 const photo=$(".bo-native-photo",root);
 if(!photo)return;
 const p=state.slides[state.slideIndex];
 photo.replaceChildren();
 const overlay=create("div","bo-native-photo-inner");
 overlay.append(create("span","bo-mini-tag",`DOKUMENTASI KEGIATAN • ${state.slideIndex+1}/${state.slides.length}`));
 overlay.append(create("h3",null,p.title||"Kegiatan tim"));
 overlay.append(create("p",null,`${p.workstream||"Team"} • ${p.activityDate||"Dokumentasi Program"}`));
 const actions=create("div","bo-action-row");
 const view=create("a",null,"Lihat Foto ↗");view.href=p.url;view.target="_blank";view.rel="noopener noreferrer";
 const next=create("button","bo-spotlight-next","Foto berikutnya ›");
 next.type="button";next.addEventListener("click",()=>{
   state.slideIndex=(state.slideIndex+1)%state.slides.length;slideshow();
 });
 actions.append(view,next);overlay.append(actions);
 photo.append(overlay);
 if(p.blobUrl){
   photo.style.backgroundImage=`linear-gradient(0deg,rgba(6,7,8,.9),rgba(6,7,8,.05) 75%),url("${p.blobUrl}")`;
   photo.style.backgroundSize="cover";photo.style.backgroundPosition="center";
 }else{photo.style.backgroundImage="linear-gradient(135deg,#161a1d,#35312b)";}
}
async function loadPhotos(){
 const root=state.root;if(!root||!root.isConnected)return;
 revokeBlobs();
 const photos=state.slides.slice(0,10).filter(s=>s.fileId);
 for(const p of photos){
   if(!root.isConnected||!state.token)break;
   try{
     const res=await fetch("https://www.googleapis.com/drive/v3/files/"+encodeURIComponent(p.fileId)+"?alt=media",{headers:{Authorization:"Bearer "+state.token}});
     if(!res.ok)continue;
     const blob=await res.blob();
     if(!blob.type.startsWith("image/"))continue;
     const url=URL.createObjectURL(blob);
     state.blobs.push(url);
     p.blobUrl=url;
     if(root.isConnected&&state.slides[state.slideIndex]===p)slideshow();
   }catch(e){}
 }
}
function makeMedia(programs,media){
 const index=new Map(programs.map(p=>[p.id,p]));
 const out=[];
 for(const r of media.slice(1)){
   if(String(rowValue(r,2)).toLowerCase()!=="photo")continue;
   const p=index.get(String(rowValue(r,1)));
   if(!p)continue;
   out.push({
     title:p.title,workstream:p.workstream,
     activityDate:String(rowValue(r,11))||"",fileId:String(rowValue(r,4)),
     url:String(rowValue(r,6))||C.workspaceUrl,created:String(rowValue(r,13))
   });
 }
 out.sort((a,b)=>b.created.localeCompare(a.created));return out;
}
async function sheets(id,ranges){
 const qs=new URLSearchParams({valueRenderOption:"FORMATTED_VALUE"});
 for(const r of ranges)qs.append("ranges",r);
 const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values:batchGet?${qs.toString()}`;
 const res=await fetch(url,{headers:{Authorization:"Bearer "+state.token},cache:"no-store"});
 if(!res.ok){
   let msg="Google API "+res.status;
   try{const d=await res.json();msg=d.error&&d.error.message||msg;}catch(e){}
   throw new Error(msg);
 }
 const data=await res.json();
 return (data.valueRanges||[]).map(x=>x.values||[]);
}
function calculate(data,programData){
 const [conf,hiring,branding,culture,summary]=data;
 const m=mapping(summary);
 const sameDefault=state.start===getDate(rowValue(conf[5],1))&&state.end===getDate(rowValue(conf[6],1));
 const hi=hiring.slice(1).filter(r=>inRange(rowValue(r,14)));
 const eb=branding.slice(1).filter(r=>inRange(rowValue(r,1)));
 const pc=culture.slice(1).filter(r=>inRange(rowValue(r,1)));
 let req=hi.reduce((s,r)=>s+number(rowValue(r,4)),0);
 let filled=hi.reduce((s,r)=>s+number(rowValue(r,5)),0);
 let gap=req-filled;
 let rate=req?100*filled/req:0;
 let published=eb.filter(r=>String(rowValue(r,8)).toLowerCase()==="published").length;
 let reach=eb.reduce((s,r)=>s+number(rowValue(r,10)),0);
 let engagement=eb.reduce((s,r)=>s+number(rowValue(r,12)),0);
 let applications=eb.reduce((s,r)=>s+number(rowValue(r,13)),0);
 let completed=pc.filter(r=>String(rowValue(r,7)).toLowerCase()==="completed").length;
 const withRate=pc.filter(r=>String(rowValue(r,7)).toLowerCase()==="completed"&&rowValue(r,11)!=="");
 let participation=withRate.length?withRate.reduce((s,r)=>s+number(rowValue(r,11)),0)/withRate.length:0;
 let budget=pc.reduce((s,r)=>s+number(rowValue(r,12)),0);
 let cost=pc.reduce((s,r)=>s+number(rowValue(r,13)),0);
 if(sameDefault){
   req=number(m.get("Total Request QTY"));filled=number(m.get("Fulfilled QTY"));
   gap=number(m.get("GAP"));
   rate=number(m.get("Fulfillment Rate"));
   published=number(m.get("Content Published"));
   applications=number(m.get("Applications Generated"));
   completed=number(m.get("Activities Completed"));
   participation=number(m.get("Avg. Participation Rate"));
 }
 const metrics=[count(req),count(filled),count(gap),pct(rate),count(published),count(reach),count(engagement),count(applications),count(completed),pct(participation),money(budget),money(cost)];
 const programs=programData[0].slice(1).filter(r=>String(rowValue(r,18)).toLowerCase()!=="true").map(r=>({
   id:String(rowValue(r,0)),title:String(rowValue(r,1)),workstream:String(rowValue(r,2)),
   owner:String(rowValue(r,3)),status:String(rowValue(r,5)),progress:String(rowValue(r,8)),
   updated:String(rowValue(r,15))
 })).sort((a,b)=>b.updated.localeCompare(a.updated));
 return {metrics,programs,photos:makeMedia(programs,programData[1]),synced:String(rowValue(conf[7],1))};
}
async function load(){
 const root=state.root;if(!root||!root.isConnected)return;
 if(!state.token||Date.now()>state.expires){settingStatus("Sesi Google habis. Hubungkan Google kembali.");return;}
 settingStatus("Membaca spreadsheet live yang memiliki izin...",false);
 const btn=$("#boLiveConnect",root);if(btn)btn.disabled=true;
 try{
   const [a,b]=await Promise.all([sheets(C.dataMartSheetId,SHEET_RANGES.mart),sheets(C.plannerSheetId,SHEET_RANGES.planner)]);
   if(!root.isConnected)return;
   const conf=a[0];
   if(!state.requested){
     state.start=getDate(rowValue(conf[5],1))||"2026-01-01";
     state.end=getDate(rowValue(conf[6],1))||new Date().toISOString().slice(0,10);
     state.requested=true;
     $("#boStartDate",root).value=state.start;
     $("#boEndDate",root).value=state.end;
   }
   state.loaded={data:a,programs:b};
   const calc=calculate(a,b);
   fillKpis(calc.metrics);showPrograms(calc.programs);
   state.slides=calc.photos;state.slideIndex=0;
   if(calc.photos.length){slideshow();loadPhotos();}
   settingStatus(`Live dari Google Sheets • Sync sumber ${calc.synced||"terbaru"} • dibaca ${new Date().toLocaleTimeString("id-ID")}`,true);
   const status=$("#boLiveConnect",root);if(status)status.textContent="↻ Muat ulang";
 }catch(err){
   settingStatus("Gagal membaca data: "+(err&&err.message||String(err)));
 }finally{if(btn&&root.isConnected)btn.disabled=false;}
}
function applyPeriod(){
 const root=state.root;if(!root)return;
 const start=$("#boStartDate",root).value,end=$("#boEndDate",root).value;
 if(!start||!end||start>end){settingStatus("Tanggal awal harus sebelum tanggal akhir.");return;}
 state.start=start;state.end=end;state.requested=true;
 if(state.loaded){
   const calc=calculate(state.loaded.data,state.loaded.programs);
   fillKpis(calc.metrics);showPrograms(calc.programs);
   settingStatus("Filter "+start+" — "+end+" • data Google Sheets terbaru di sesi ini",true);
 }else if(state.token)load();
}
function connect(){
 if(state.token&&state.expires>Date.now()+45000){load();return;}
 if(!C.oauthClientId){settingStatus("OAuth Client ID belum dikonfigurasi. Buka panduan LIVE_DASHBOARD_SETUP.md.");return;}
 if(!(window.google&&google.accounts&&google.accounts.oauth2)){
   settingStatus("Google Identity Services masih dimuat. Coba lagi.");return;
 }
 try{
   if(!state.tokenClient){
     state.tokenClient=google.accounts.oauth2.initTokenClient({
       client_id:C.oauthClientId,scope:GSI_SCOPE,callback:function(response){
         if(response.error){settingStatus("Google OAuth: "+response.error);return;}
         state.token=response.access_token;state.expires=Date.now()+((Number(response.expires_in)||3600)*1000);
         load();
       }
     });
   }
   state.tokenClient.requestAccessToken({prompt:"consent"});
 }catch(err){settingStatus("Gagal membuka Google OAuth: "+(err.message||String(err)));}
}
function mount(){
 const root=document.getElementById("boNativeContent");
 if(!root||!root.isConnected||root.dataset.liveMounted)return;
 root.dataset.liveMounted="1";state.root=root;
 const tool=create("div","bo-live-toolbar");
 tool.innerHTML=`<div class="bo-live-title"><b>⟳ LIVE DATA CONNECTOR</b><small>Data dibaca langsung dari Google Sheets dengan izin akun Anda</small></div>
  <div class="bo-live-filters"><label>Dari<input id="boStartDate" type="date" aria-label="Dari tanggal"></label>
  <label>Sampai<input id="boEndDate" type="date" aria-label="Sampai tanggal"></label>
  <button id="boLiveApply" type="button">Terapkan periode</button>
  <button id="boLiveConnect" type="button">Hubungkan Google</button></div>
  <div id="boLiveStatus" class="bo-live-state" role="status"></div>`;
 root.prepend(tool);
 const start=$("#boStartDate",root),end=$("#boEndDate",root);
 start.value=state.start||"2026-01-01";
 end.value=state.end||new Date().toISOString().slice(0,10);
 $("#boLiveConnect",root).addEventListener("click",connect);
 $("#boLiveApply",root).addEventListener("click",applyPeriod);
 const status=$("#boLiveStatus",root);
 if(!C.oauthClientId){
   status.textContent="Perlu konfigurasi Google OAuth Client ID sekali oleh admin. Panduan ada di GitHub → LIVE_DASHBOARD_SETUP.md.";
   const link=create("a",null,"Buka panduan koneksi ↗");
   link.href="https://github.com/boyhcblackowl-coder/BlackOwl-TATM-PWA/blob/main/LIVE_DASHBOARD_SETUP.md";
   link.target="_blank";link.rel="noopener noreferrer";status.append(" ",link);
 }else if(state.token&&state.expires>Date.now()+45000){load();}
 else{status.textContent="Klik Hubungkan Google untuk membaca KPI dan Program Spotlight secara live.";}
 clearInterval(state.slideTimer);
 state.slideTimer=setInterval(()=>{if(state.root&&state.root.isConnected&&state.slides.length>1){state.slideIndex=(state.slideIndex+1)%state.slides.length;slideshow();}},7000);
 if(!state.refreshTimer)state.refreshTimer=setInterval(()=>{if(document.visibilityState==="visible"&&state.root&&state.root.isConnected&&state.token&&state.expires>Date.now()+45000)load();},120000);
}
window.BO_LIVE={mount,connect,refresh:load};
})();
