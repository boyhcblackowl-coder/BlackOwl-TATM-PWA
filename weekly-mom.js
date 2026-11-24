(function weeklyMomClient(){
"use strict";
const config=window.BO_CONFIG;
const state={items:[],accessToken:"",expires:0,oauthClient:null,selected:"",term:"",month:"all",busy:false,readAt:""};
const spreadsheetId=config.plannerSheetId;
const taskUrl=config.asanaMomUrl;
const $=(s,root=document)=>root.querySelector(s);
const element=(tag,klass,text)=>{
 const n=document.createElement(tag);if(klass)n.className=klass;if(text!==undefined)n.textContent=String(text);return n;
};
const dateLabel=value=>{
 if(!value)return "Tanpa tanggal";
 const d=new Date(String(value).slice(0,10)+"T12:00:00+07:00");
 return isNaN(d.getTime())?String(value):d.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Jakarta"});
};
const root=()=>$("#momNative");
function setStatus(message,ok=false){
 const r=root();if(!r)return;
 const el=$("#momStatus",r);if(el){el.textContent=message;el.dataset.ok=ok?"true":"false";}
}
function renderList(){
 const r=root();if(!r)return;
 const list=$("#momList",r),search=state.term.toLowerCase().trim();
 const filtered=state.items.filter(x=>{
  return (state.month==="all"||String(x.date).slice(0,7)===state.month) &&
   (!search||[x.title,x.content,x.author,x.date].join(" ").toLowerCase().includes(search));
 });
 $("#momCount",r).textContent=filtered.length+" notulen";
 list.replaceChildren();
 if(!filtered.length){list.append(element("p","mom-empty","Tidak ditemukan notulen untuk pencarian atau periode tersebut."));return;}
 if(!filtered.some(x=>x.id===state.selected))state.selected=filtered[0].id;
 for(const note of filtered){
  const btn=element("button","mom-list-item"+(note.id===state.selected?" active":""));
  btn.type="button";
  const small=element("span","mom-date",dateLabel(note.date));
  const title=element("b","",note.title||"Weekly MoM");
  const excerpt=element("span","mom-excerpt",note.content.replace(/\s+/g," ").slice(0,110));
  btn.append(small,title,excerpt);
  btn.addEventListener("click",()=>{state.selected=note.id;renderList();renderDetail();});
  list.append(btn);
 }
}
function renderDetail(){
 const r=root();if(!r)return;
 const target=$("#momDetail",r);
 target.replaceChildren();
 const note=state.items.find(x=>x.id===state.selected);
 if(!note){target.append(element("div","mom-empty","Pilih tanggal notulen untuk membaca isinya."));return;}
 const h=element("div","mom-document-head");
 h.append(element("div","mom-document-date",dateLabel(note.date)),element("h2","",note.title||"Weekly Meeting TA & TM"),element("div","mom-author","Disusun oleh "+(note.author||"Tim TA & TM")));
 const body=element("article","mom-document-body");
 const rows=note.content.replace(/\r\n?/g,"\n").split("\n"),buffer=[];
 const section=/^(?:Talent Acquisition|Talent Management|People Development|Employee Engagement|Employer Branding|Recruitment|Training|Organization Development|People Culture|Hiring Operational|Hiring Back Office|Action Plan|Others|Next Action|Next Steps|Follow Up|People Engagement)\s*:\s*(.*)$/i;
 const flush=()=>{if(!buffer.length)return;body.append(element("p","mom-note-paragraph",buffer.join("\n")));buffer.length=0;};
 for(const raw of rows){
  const trimmed=raw.trim();
  if(!trimmed){flush();continue;}
  const match=trimmed.match(section);
  if(match){flush();body.append(element("h3","mom-section-title",match[0].replace(/\s*:\s*$/,"")));if(match[1])buffer.push(match[1]);}
  else buffer.push(raw);
 }
 flush();target.append(h,body);
 const end=element("div","mom-document-footer");
 const link=element("a","","Buka task sumber di Asana ↗");link.href=taskUrl;link.target="_blank";link.rel="noopener noreferrer";end.append(link);target.append(end);
}
function populateMonth(){
 const r=root();if(!r)return;
 const select=$("#momMonth",r);
 const distinct=[...new Set(state.items.map(x=>String(x.date).slice(0,7)))].filter(x=>/^\d{4}-\d{2}$/.test(x)).sort().reverse();
 select.replaceChildren();
 const all=element("option","","Semua bulan");all.value="all";select.append(all);
 for(const m of distinct){const o=element("option","",m);o.value=m;select.append(o);}
 if(!distinct.includes(state.month))state.month="all";
 select.value=state.month;
}
function parseRows(matrix){
 const rows=(matrix||[]).slice(1);
 return rows.map(x=>({
   id:String(x[0]||""),
   date:String(x[1]||"").slice(0,10),
   created:String(x[2]||""),
   author:String(x[3]||""),
   title:String(x[4]||""),
   content:String(x[5]||""),
   url:String(x[6]||taskUrl),
   updated:String(x[7]||"")
 })).filter(x=>x.id&&x.content).sort((a,b)=>b.date.localeCompare(a.date)||b.created.localeCompare(a.created));
}
async function fetchMom(){
 const r=root();if(!r||state.busy)return;
 if(!state.accessToken||state.expires<Date.now()+30000){setStatus("Hubungkan akun Google terlebih dahulu.");return;}
 state.busy=true;setStatus("Membaca notulen dari spreadsheet privat...");
 try{
  const range="'Weekly_MoM'!A1:H500";
  const url="https://sheets.googleapis.com/v4/spreadsheets/"+encodeURIComponent(spreadsheetId)+"/values/"+encodeURIComponent(range);
  const response=await fetch(url,{headers:{"Authorization":"Bearer "+state.accessToken},cache:"no-store"});
  if(!response.ok){
   let msg="HTTP "+response.status;
   try{const detail=await response.json();msg=detail.error?.message||msg;}catch(e){}
   throw new Error(msg);
  }
  const data=await response.json();
  if(!r.isConnected)return;
  state.items=parseRows(data.values||[]);
  state.readAt=new Date().toLocaleString("id-ID",{timeZone:"Asia/Jakarta"});
  state.selected=state.items.find(x=>x.id===state.selected)?.id||state.items[0]?.id||"";
  populateMonth();renderList();renderDetail();
  const lastSync=state.items[0]?.updated||"belum tercatat";
  setStatus(state.items.length+" notulen terbaca • Cache Asana terakhir disinkronkan "+lastSync+" • Dibaca "+state.readAt,true);
  const btn=$("#momConnect",r);if(btn)btn.textContent="↻ Refresh MoM";
 }catch(e){setStatus("Gagal membaca Weekly MoM: "+(e.message||e));}
 finally{state.busy=false;}
}
function connect(){
 if(state.accessToken&&state.expires>Date.now()+30000){fetchMom();return;}
 if(!config.oauthClientId){setStatus("OAuth Client ID belum dikonfigurasi.");return;}
 if(!window.google?.accounts?.oauth2){setStatus("Google Identity Services belum siap. Coba ulangi.");return;}
 if(!state.oauthClient){
  state.oauthClient=google.accounts.oauth2.initTokenClient({
   client_id:config.oauthClientId,
   scope:"https://www.googleapis.com/auth/spreadsheets.readonly",
   callback:result=>{
    if(result.error){setStatus("Google OAuth: "+result.error);return;}
    state.accessToken=result.access_token;
    state.expires=Date.now()+((Number(result.expires_in)||3600)*1000);
    fetchMom();
   }
  });
 }
 try{state.oauthClient.requestAccessToken({prompt:""});}
 catch(e){setStatus("Tidak dapat membuka Google OAuth: "+(e.message||e));}
}
function mount(){
 const r=root();if(!r||r.dataset.momMounted)return;
 r.dataset.momMounted="true";
 $("#momSearch",r).addEventListener("input",e=>{state.term=e.target.value;renderList();renderDetail();});
 $("#momMonth",r).addEventListener("change",e=>{state.month=e.target.value;renderList();renderDetail();});
 $("#momConnect",r).addEventListener("click",connect);
 if(state.accessToken&&state.expires>Date.now()+30000)fetchMom();
 else setStatus("Klik Hubungkan Google untuk menampilkan seluruh notulen Weekly MoM langsung di PWA.");
}
window.BO_MOM={mount,connect,refresh:fetchMom};
})();
