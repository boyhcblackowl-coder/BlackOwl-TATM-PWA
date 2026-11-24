(function plannerNativeApp(){
"use strict";
const CFG=window.BO_CONFIG;
const spreadsheetId=CFG.plannerSheetId;
const SCOPES="https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email";
const state={token:"",until:0,client:null,email:"",programs:[],quickNotes:[],media:[],root:null,tab:"programs",view:"list",query:"",status:"all",workstream:"all",notesWorkstream:"General",noteDirty:false,loading:false,saving:false,mediaURLs:[],refreshHandle:null};
const commonWorkstreams=["General","Recruitment Operational","Recruitment Back Office","Training & Development","Organization Development","Employer Branding","Employee Engagement"];
const $=(selector,base=document)=>base.querySelector(selector);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const el=(tag,klass,content)=>{const n=document.createElement(tag);if(klass)n.className=klass;if(content!==undefined)n.textContent=String(content);return n;};
const now=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date());
const isActive=()=>Boolean(state.root&&state.root.isConnected);
function readStatus(value,good=false){
 if(!isActive())return;
 const status=$("#plannerLiveStatus",state.root);
 if(status){status.textContent=value;status.dataset.ok=String(good);}
}
function tokenValid(){return Boolean(state.token&&state.until>Date.now()+30000);}
async function api(range,method="GET",values=null,append=false){
 if(!tokenValid())throw Error("Sesi Google berakhir. Hubungkan Google kembali.");
 const encoded=encodeURIComponent(range);
 const base=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encoded}`;
 const url=base+(append?":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS":method==="PUT"?"?valueInputOption=RAW":"");
 const options={method,headers:{Authorization:"Bearer "+state.token},cache:"no-store"};
 if(values){options.headers["Content-Type"]="application/json;charset=UTF-8";options.body=JSON.stringify({majorDimension:"ROWS",values});}
 const resp=await fetch(url,options);
 if(!resp.ok){
   let message="Google Sheets HTTP "+resp.status;
   try{const data=await resp.json();message=data.error?.message||message;}catch(e){}
   throw Error(message);
 }
 return resp.json();
}
async function readIdentity(){
 try{
  const r=await fetch("https://www.googleapis.com/oauth2/v3/userinfo",{headers:{Authorization:"Bearer "+state.token}});
  if(r.ok){const x=await r.json();state.email=String(x.email||"").toLowerCase();}
 }catch(e){state.email="";}
}
function connect(){
 if(tokenValid()){refresh();return;}
 if(!CFG.oauthClientId){readStatus("OAuth Client ID belum dikonfigurasi di GitHub.");return;}
 if(!window.google?.accounts?.oauth2){readStatus("Layanan Google sedang dimuat. Klik Hubungkan Google kembali.");return;}
 try{
   if(!state.client){
     state.client=google.accounts.oauth2.initTokenClient({
       client_id:CFG.oauthClientId,scope:SCOPES,callback:async result=>{
         if(result.error){readStatus("Google OAuth: "+result.error);return;}
         state.token=result.access_token;
         state.until=Date.now()+(Number(result.expires_in)||3600)*1000;
         state.email="";
         await readIdentity();
         await refresh();
       }
     });
   }
   state.client.requestAccessToken({prompt:"consent"});
 }catch(e){readStatus("Autentikasi gagal: "+(e.message||e));}
}
function toProgram(row,i){
 const get=j=>String(row[j]??"");
 return {row:i+2,id:get(0),title:get(1),workstream:get(2),owner:get(3),priority:get(4),status:get(5),
 startDate:get(6),dueDate:get(7),progress:Number(get(8))||0,objective:get(9),planDetails:get(10),
 nextSteps:get(11),resources:get(12),notes:get(13),createdAt:get(14),updatedAt:get(15),
 createdBy:get(16),updatedBy:get(17),archived:get(18).toLowerCase()==="true",version:Number(get(19))||0};
}
function toNote(row,i){return {row:i+2,workstream:String(row[0]||""),content:String(row[1]||""),updatedAt:String(row[2]||""),updatedBy:String(row[3]||""),version:Number(row[4])||0};}
function toMedia(row){
 return {id:String(row[0]||""),programId:String(row[1]||""),type:String(row[2]||""),source:String(row[3]||""),
 fileId:String(row[4]||""),name:String(row[5]||""),url:String(row[6]||""),mimeType:String(row[7]||""),
 caption:String(row[9]||""),category:String(row[10]||""),activityDate:String(row[11]||"")};
}
async function refresh(){
 if(!tokenValid()){readStatus("Klik Hubungkan Google agar program dan notes tampil live.");return;}
 if(state.loading||state.saving)return;
 state.loading=true;readStatus("Membaca Programs, Quick Notes, dan dokumentasi dari Google Sheets...");
 try{
   const [p,n,m]=await Promise.all([
     api("'Programs'!A1:T1000"),api("'Quick_Notes'!A1:E1000"),api("'Program_Media'!A1:N1000")
   ]);
   if(!isActive())return;
   state.programs=(p.values||[]).slice(1).map((row,i)=>toProgram(row,i)).filter(p=>p.id);
   state.quickNotes=(n.values||[]).slice(1).map((row,i)=>toNote(row,i)).filter(n=>n.workstream);
   state.media=(m.values||[]).slice(1).map(toMedia).filter(m=>m.id&&m.programId);
   renderSummary();renderMain();
   const stamp=new Date().toLocaleTimeString("id-ID",{timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit"});
   readStatus(`${state.programs.filter(p=>!p.archived).length} program • ${state.quickNotes.length} catatan • ${state.media.length} media • Update ${stamp}${state.email?" • "+state.email:""}`,true);
   const button=$("#plannerConnect",state.root);if(button)button.textContent="↻ Refresh Live";
 }catch(e){readStatus("Gagal membaca spreadsheet: "+(e.message||e));}
 finally{state.loading=false;}
}
function dashboardStats(){
 const programs=state.programs.filter(p=>!p.archived);
 const planning=programs.filter(p=>/idea|planning/i.test(p.status)).length;
 const running=programs.filter(p=>/progress|running|ongoing|berjalan/i.test(p.status)).length;
 const delayed=programs.filter(p=>p.dueDate&&p.dueDate<new Date().toISOString().slice(0,10)&&!/completed|done|cancel/i.test(p.status)).length;
 return [{label:"Total program",value:programs.length},{label:"Idea & Planning",value:planning},{label:"Sedang berjalan",value:running},{label:"Lewat target",value:delayed}];
}
function renderSummary(){
 const r=state.root;if(!r)return;
 const target=$("#plannerStats",r);if(!target)return;
 target.replaceChildren();
 for(const info of dashboardStats()){
   const card=el("div","planner-stat");
   card.append(el("strong",null,info.value),el("span",null,info.label));
   target.append(card);
 }
}
function uniqueWorkstreams(){
 return [...new Set([...commonWorkstreams,...state.programs.map(p=>p.workstream).filter(Boolean),...state.quickNotes.map(n=>n.workstream)])];
}
function clearPreviews(){
 for(const u of state.mediaURLs){try{URL.revokeObjectURL(u);}catch(e){}}
 state.mediaURLs=[];
}
function renderMain(){
 const r=state.root;if(!r||!r.isConnected)return;
 const active=state.tab==="notes";
 $("#plannerTabPrograms",r).classList.toggle("active",!active);
 $("#plannerTabNotes",r).classList.toggle("active",active);
 $("#plannerProgramSection",r).hidden=active;
 $("#plannerNotesSection",r).hidden=!active;
 if(active)renderNotes();else renderPrograms();
}
function programCard(p){
 const attached=state.media.filter(m=>m.programId===p.id);
 const due=p.dueDate||"—";
 return `<article class="planner-program-card" data-program-id="${esc(p.id)}">
 <div class="planner-program-heading"><span class="planner-pill">${esc(p.status||"Planning")}</span><span class="planner-priority">${esc(p.priority||"Medium")}</span></div>
 <h3>${esc(p.title||"Untitled")}</h3><p class="planner-workstream">${esc(p.workstream||"TA & TM")}</p>
 <p class="planner-card-brief">${esc(p.objective||p.planDetails||"Belum ada brief program").slice(0,160)}</p>
 <div class="planner-program-meta"><span>👤 ${esc(p.owner||"PIC belum diisi")}</span><span>◎ Target: ${esc(due)}</span><span>▧ ${attached.length} media</span></div>
 <div class="planner-meter"><i style="width:${Math.max(0,Math.min(100,p.progress))}%"></i></div>
 <div class="planner-card-footer"><span>Progress ${Math.round(p.progress)}%</span><button type="button" data-action="details" data-id="${esc(p.id)}">Detail & Edit ↗</button></div>
 </article>`;
}
function filteredPrograms(){
 const q=state.query.toLowerCase(),filter=state.status;
 return state.programs.filter(p=>!p.archived&&(filter==="all"||p.status===filter)&&
 (state.workstream==="all"||p.workstream===state.workstream)&&
 (!q||[p.title,p.owner,p.workstream,p.objective,p.planDetails,p.nextSteps,p.notes].join(" ").toLowerCase().includes(q)));
}
function renderPrograms(){
 const r=state.root;if(!r||!r.isConnected)return;
 const target=$("#plannerProgramsContent",r),items=filteredPrograms();
 const select=$("#plannerWorkstreamFilter",r),current=state.workstream;
 const available=uniqueWorkstreams().filter(w=>w!=="General");
 select.innerHTML='<option value="all">Semua workstream</option>'+available.map(w=>`<option value="${esc(w)}"${w===current?" selected":""}>${esc(w)}</option>`).join("");
 const statuses=[...new Set(state.programs.map(p=>p.status).filter(Boolean))];
 $("#plannerStatusFilter",r).innerHTML='<option value="all">Semua status</option>'+statuses.map(s=>`<option value="${esc(s)}"${s===state.status?" selected":""}>${esc(s)}</option>`).join("");
 $("#plannerResultCount",r).textContent=`${items.length} program`;
 if(!items.length){target.innerHTML='<div class="planner-empty">Belum ada program sesuai filter ini.</div>';return;}
 const sorted=items.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
 if(state.view==="board"){
   target.className="planner-board";
   const groups=[...new Set(sorted.map(p=>p.status||"Planning"))];
   target.innerHTML=groups.map(status=>`<div class="planner-board-column"><h3>${esc(status)} <span>${sorted.filter(p=>(p.status||"Planning")===status).length}</span></h3>${sorted.filter(p=>(p.status||"Planning")===status).map(programCard).join("")}</div>`).join("");
 }else{
   target.className="planner-list";
   target.innerHTML=sorted.map(programCard).join("");
 }
 $("#plannerViewList",r).classList.toggle("active",state.view==="list");
 $("#plannerViewBoard",r).classList.toggle("active",state.view==="board");
}
function noteFor(workstream){return state.quickNotes.find(n=>n.workstream===workstream);}
function renderNotes(){
 const r=state.root;if(!r||!r.isConnected)return;
 const select=$("#plannerNotesWorkstream",r);
 select.innerHTML=uniqueWorkstreams().map(w=>`<option value="${esc(w)}"${state.notesWorkstream===w?" selected":""}>${esc(w==="General"?"Catatan Umum":w)}</option>`).join("");
 const record=noteFor(state.notesWorkstream);
 $("#plannerQuickNote",r).value=record?.content||"";
 $("#plannerNoteMeta",r).textContent=record?`Terakhir diperbarui: ${record.updatedAt||"—"} • ${record.updatedBy||"Tim"} • Versi ${record.version}`:"Belum ada catatan. Tulis dan simpan agar dapat dibaca seluruh tim.";
 state.noteDirty=false;
}
function fieldsFrom(form){
 const fields={};
 new FormData(form).forEach((value,key)=>fields[key]=String(value).trim());
 fields.progress=Math.max(0,Math.min(100,Number(fields.progress)||0));
 return fields;
}
function closeModal(){
 const popup=$("#plannerModal",state.root||document);
 if(popup)popup.hidden=true;
 const body=document.body;body.classList.remove("planner-lock-scroll");
 clearPreviews();
}
function showModal(id){
 const r=state.root;if(!r)return;
 const p=state.programs.find(x=>x.id===id);
 const popup=$("#plannerModal",r);
 const form=$("#plannerForm",r);
 const title=$("#plannerFormHeading",r);
 title.textContent=p?"Detail & Edit Program":"Buat Program Baru";
 form.reset();
 const val=(key)=>p?p[key]||"":"";
 for(const field of form.elements){
   if(!field.name)continue;
   const key=field.name;
   field.value=key==="progress"?String(p?.progress||0):val(key);
 }
 $("#plannerProgressValue",r).textContent=(p?.progress||0)+"%";
 $("#plannerFormId",r).value=p?.id||"";
 const options=uniqueWorkstreams().filter(w=>w!=="General");
 const select=$("#plannerFormWorkstream",r);
 select.innerHTML=options.map(w=>`<option value="${esc(w)}"${w===(p?.workstream||"Training & Development")?" selected":""}>${esc(w)}</option>`).join("");
 for(const key of ["status","priority"]){
   const elSelect=form.elements.namedItem(key);
   if(p&&![...elSelect.options].some(o=>o.value===p[key])){
     const option=document.createElement("option");option.value=p[key];option.textContent=p[key];elSelect.append(option);
   }
   elSelect.value=p?.[key]||(key==="status"?"Planning":"Medium");
 }
 renderMedia(p);
 popup.hidden=false;document.body.classList.add("planner-lock-scroll");
 const first=form.querySelector('[name="title"]');if(first)first.focus();
}
async function fetchPhoto(fileId,img){
 if(!fileId||!tokenValid())return;
 try{
   const response=await fetch("https://www.googleapis.com/drive/v3/files/"+encodeURIComponent(fileId)+"?alt=media",{headers:{Authorization:"Bearer "+state.token}});
   if(!response.ok)return;
   const blob=await response.blob();if(!blob.type.startsWith("image/")||blob.size>15000000)return;
   if(!img.isConnected)return;
   const url=URL.createObjectURL(blob);state.mediaURLs.push(url);img.src=url;
 }catch(e){}
}
function renderMedia(p){
 const r=state.root;if(!r)return;
 const media=$("#plannerFormMedia",r);media.replaceChildren();
 if(!p){media.append(el("p","planner-note-small","Simpan program terlebih dahulu untuk menambahkan dokumentasi."));return;}
 const items=state.media.filter(m=>m.programId===p.id);
 if(!items.length){media.append(el("p","planner-note-small","Belum ada foto atau video pada program ini."));}
 for(const m of items){
   const item=el("div","planner-media-item");
   if(m.type.toLowerCase()==="photo"){
     const img=el("img","planner-media-image");img.alt=m.caption||m.name||"Foto kegiatan";img.loading="lazy";
     item.append(img);fetchPhoto(m.fileId,img);
   }else item.append(el("div","planner-media-video","▶ Video"));
   const info=el("div","planner-media-info");
   const text=el("b","",m.caption||m.name||"Dokumentasi");
   const subtitle=el("span","",`${m.category||m.type} • ${m.activityDate||""}`);
   const link=el("a","","Lihat di Drive ↗");
   const destination=new URL(m.url||"https://drive.google.com");
   link.href=destination.protocol==="https:"&&destination.hostname==="drive.google.com"?destination.href:"https://drive.google.com";
   link.target="_blank";link.rel="noopener noreferrer";
   info.append(text,subtitle,link);item.append(info);media.append(item);
 }
}
async function saveProgram(e){
 e.preventDefault();if(state.saving)return;
 if(!tokenValid())return readStatus("Hubungkan Google sebelum menyimpan.");
 if(!state.email)return readStatus("Email akun belum terbaca. Hubungkan ulang Google dan izinkan profil email.");
 const r=state.root;if(!r)return;
 const form=$("#plannerForm",r);
 const values=fieldsFrom(form),id=$("#plannerFormId",r).value;
 if(!values.title)return readStatus("Nama program wajib diisi.");
 if(values.startDate&&values.dueDate&&values.startDate>values.dueDate)return readStatus("Tanggal mulai tidak boleh melewati target selesai.");
 state.saving=true;const btn=$("#plannerSubmit",r);btn.disabled=true;btn.textContent="Menyimpan...";
 try{
   const existing=id?state.programs.find(p=>p.id===id):null;
   if(id&&!existing)throw Error("Program tidak ditemukan. Refresh data terlebih dahulu.");
   const stamp=now(),row=existing?existing.row:0;
   if(existing){
     const response=await api(`'Programs'!A${row}:T${row}`);
     const current=response.values?.[0]||[];
     if(String(current[0]||"")!==existing.id||Number(current[19]||0)!==existing.version)throw Error("Data program diperbarui anggota tim lain. Klik Refresh Live lalu edit kembali.");
   }
   const generatedId=existing?.id||(crypto.randomUUID?crypto.randomUUID():String(Date.now()));
   const updated=[
     generatedId,values.title,values.workstream||"Training & Development",values.owner,values.priority,values.status,
     values.startDate,values.dueDate,values.progress,values.objective,values.planDetails,values.nextSteps,
     values.resources,values.notes,existing?.createdAt||stamp,stamp,existing?.createdBy||state.email,state.email,
     existing?.archived?"TRUE":"FALSE",existing?existing.version+1:1
   ];
   if(existing){await api(`'Programs'!A${row}:T${row}`,"PUT",[updated]);}
   else{await api("'Programs'!A1:T1000","POST",[updated],true);}
   closeModal();state.saving=false;
   await refresh();readStatus(`Program "${values.title}" berhasil ${existing?"diperbarui":"ditambahkan"} oleh ${state.email}.`,true);
 }catch(err){readStatus("Gagal menyimpan program: "+(err.message||err));}
 finally{state.saving=false;btn.disabled=false;btn.textContent="Simpan Program";}
}
async function saveNote(){
 const r=state.root;if(!r||state.saving)return;
 if(!tokenValid())return readStatus("Hubungkan Google sebelum menyimpan notepad.");
 if(!state.email)return readStatus("Email akun belum terbaca. Hubungkan ulang Google dan izinkan profil email.");
 const content=$("#plannerQuickNote",r).value,workstream=state.notesWorkstream,existing=noteFor(workstream);
 state.saving=true;
 try{
   if(existing){
     const last=await api(`'Quick_Notes'!A${existing.row}:E${existing.row}`);
     const data=last.values?.[0]||[];
     if(data[0]!==existing.workstream||Number(data[4]||0)!==existing.version)throw Error("Catatan telah diubah anggota tim lain. Refresh Live sebelum menyimpan lagi.");
     await api(`'Quick_Notes'!A${existing.row}:E${existing.row}`,"PUT",[[workstream,content,now(),state.email,existing.version+1]]);
   }else{
     await api("'Quick_Notes'!A1:E1000","POST",[[workstream,content,now(),state.email,1]],true);
   }
   state.noteDirty=false;state.saving=false;
   await refresh();
   readStatus("Quick Notepad "+workstream+" berhasil disimpan untuk tim.",true);
 }catch(e){readStatus("Gagal menyimpan catatan: "+(e.message||e));}
 finally{state.saving=false;}
}
function setup(){
 const r=state.root;if(!r)return;
 r.addEventListener("click",e=>{
   const btn=e.target.closest("[data-action]");if(!btn)return;
   const action=btn.dataset.action;
   if(action==="new")showModal(null);
   if(action==="details")showModal(btn.dataset.id);
   if(action==="close-modal")closeModal();
   if(action==="notes"){state.tab="notes";renderMain();}
   if(action==="programs"){state.tab="programs";renderMain();}
   if(action==="refresh")refresh();
   if(action==="connect")connect();
   if(action==="save-notes")saveNote();
   if(action==="list"){state.view="list";renderPrograms();}
   if(action==="board"){state.view="board";renderPrograms();}
   if(action==="open-original")window.open(C.workspaceUrl+"?page=planner#planner","_blank","noopener,noreferrer");
 });
 const modal=$("#plannerModal",r);
 modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});
 $("#plannerForm",r).addEventListener("submit",saveProgram);
 $("#plannerForm",r).elements.namedItem("progress").addEventListener("input",e=>{$("#plannerProgressValue",r).textContent=e.target.value+"%";});
 $("#plannerSearch",r).addEventListener("input",e=>{state.query=e.target.value;renderPrograms();});
 $("#plannerStatusFilter",r).addEventListener("change",e=>{state.status=e.target.value;renderPrograms();});
 $("#plannerWorkstreamFilter",r).addEventListener("change",e=>{state.workstream=e.target.value;renderPrograms();});
 $("#plannerNotesWorkstream",r).addEventListener("change",e=>{
   if(state.noteDirty&&!confirm("Catatan belum disimpan. Pindah workstream dan abaikan perubahan?")){e.target.value=state.notesWorkstream;return;}
   state.notesWorkstream=e.target.value;renderNotes();
 });
 $("#plannerQuickNote",r).addEventListener("input",()=>{state.noteDirty=true;});
 window.addEventListener("keydown",e=>{if(e.key==="Escape"&&isActive()&&!$("#plannerModal",r).hidden)closeModal();});
}
function mount(){
 const r=$("#plannerNative");if(!r||r.dataset.plannerMounted)return;
 r.dataset.plannerMounted="true";state.root=r;
 setup();renderSummary();renderMain();
 if(tokenValid())refresh();
 else readStatus("Klik Hubungkan Google untuk menampilkan program dan notes secara live.");
}
window.BO_PLANNER={mount,connect,refresh};
})();
