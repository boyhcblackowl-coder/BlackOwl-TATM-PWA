(function appClient(){
 "use strict";
 const C=window.BO_CONFIG;
 const projects=[
 {id:"inspire1",name:"INSPIRE V1",kind:"Portal",cat:"Portal & Experience",icon:"🦉",desc:"HCGA & Legal Center dan informasi internal Black Owl.",url:"https://sites.google.com/view/hcgalegalcenter/home?authuser=0"},
 {id:"inspire2",name:"INSPIRE V2",kind:"PWA",cat:"Portal & Experience",icon:"✦",desc:"Digital home of sOWLdiers — layanan dan pengalaman karyawan.",url:"https://boyhcblackowl-coder.github.io/INSPIRE2.1.2/install-check.html"},
 {id:"offering",name:"Offering Letter Digital",kind:"Google Sheets",cat:"Recruitment Tools",icon:"📄",desc:"Workflow dan monitoring Offering Letter kandidat.",url:"https://docs.google.com/spreadsheets/d/1j8eIr5G3bW1W7_xTUxq0KEX4yhCOO_wUFnObhu2fDuA/edit?gid=1418015777#gid=1418015777"},
 {id:"application",name:"Application Form Digital",kind:"Web App",cat:"Recruitment Tools",icon:"📝",desc:"Formulir lamaran kerja digital Black Owl.",url:"https://script.google.com/macros/s/AKfycbx5kojDi0m8Z4af_AzxGo3XbYVx6m3IpeEcmU3CEuEygWh6gCBmsBRoMKun-ba-qBlU/exec"},
 {id:"pipeline",name:"Hiring Pipeline",kind:"Google Sheets",cat:"Recruitment Tools",icon:"📊",desc:"Screening, shortlist, interview, offer dan talent pool.",url:"https://docs.google.com/spreadsheets/d/1Hj3XCzkTFBVyytNatspzmkwLAbumg7fG3Qrizor6VtY/edit?gid=141634643#gid=141634643"},
 {id:"voting",name:"Digital Voting",kind:"Web App",cat:"People & Engagement",icon:"🗳️",desc:"Voting online untuk event dan aktivitas internal.",url:"https://script.google.com/macros/s/AKfycbwJYwsFTDbi0GfPL2CtRj2xFjxsDD5lCdr1eoinoQTE7HcOTmnUf8P3_0wT6YRCQwCKmQ/exec"},
 {id:"ttt",name:"TTT Dashboard — Looker",kind:"Looker Studio",cat:"Reporting & MPP",icon:"🎓",desc:"Monitoring Train The Trainer dan performa training.",url:"https://datastudio.google.com/u/0/reporting/57696b48-62b6-4cb4-ab6e-f731b917d5b8/page/p_c7gp3l7kxd/edit"},
 {id:"mpp",name:"Data MPP All Outlet",kind:"Google Drive",cat:"Reporting & MPP",icon:"👥",desc:"Folder manpower planning Black Owl seluruh outlet.",url:"https://drive.google.com/drive/u/0/folders/11pkwPAq83hZ72hh97uuR-tUD0Ha3J_-0"},
 {id:"memo",name:"Automate Internal Memo",kind:"Google Sheets",cat:"Office Automation",icon:"📋",desc:"Tracker nomor surat dan internal memo.",url:"https://docs.google.com/spreadsheets/d/1RARhvcWpCX43W7ca7EQpCa7V-sy2JxpCnNsYBRz5Xuk/edit?usp=sharing"},
 {id:"talent",name:"Black Owl Talent Hub",kind:"Web App",cat:"Recruitment Tools",icon:"🎯",desc:"Talent sourcing dan workflow rekrutmen tim TA & TM.",url:"https://script.google.com/macros/s/AKfycbxgVwR8Trri5Fg_MEyoPzKAzHhMsOxX_vl0eciyylm2PS460aJv2gGTIYgcxH1widHNlw/exec"}
 ];
 const nav=[
 {id:"overview",name:"Main Dashboard",symbol:"▦"},{id:"projecthub",name:"Project Team TA & TM",symbol:"◫"},
 {id:"recruitment",name:"Talent Acquisition",symbol:"♧"},{id:"branding",name:"Employer Branding",symbol:"◈"},
 {id:"culture",name:"People Culture",symbol:"♡"},{id:"planner",name:"Program Planner & Notes",symbol:"▤"},
 {id:"weeklymom",name:"Weekly MoM",symbol:"☷"},{id:"workspace",name:"Original Workspace",symbol:"↗"}
 ];
 const routes=new Set(nav.map(n=>n.id));
 const $=sel=>document.querySelector(sel);
 const content=$("#content");
 let page="overview", search="", installPrompt=null, toastTimer=null;
 const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const href=(url,label,cls="button primary")=>`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
 const appUrl=id=>{const u=new URL(C.workspaceUrl);u.searchParams.set("page",id);u.hash=id;return u.toString();};
 const routeFromLocation=()=>{const p=new URLSearchParams(location.search).get("page")||location.hash.slice(1);return p==="home"?"overview":routes.has(p)?p:"overview";};
 function toast(txt){const t=$("#toast");t.textContent=txt;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3500);}
 function go(to,replace=false){
   page=to==="home"?"overview":routes.has(to)?to:"overview";
   const u=new URL(location.href);u.searchParams.set("page",page);u.hash=page;
   (replace?history.replaceState:history.pushState).call(history,{page},"",u.toString());
   render();window.scrollTo(0,0);hideDrawer();
 }
 function renderNav(){
   const n=nav.map(x=>`<button type="button" data-route="${x.id}" class="nav-link ${page===x.id?"active":""}" ${page===x.id?'aria-current="page"':""}><span class="symbol" aria-hidden="true">${x.symbol}</span><span>${esc(x.name)}</span></button>`).join("");
   $("#sideMenu").innerHTML=n;$("#drawerMenu").innerHTML=n;
   const bottom=[["overview","Main Dashboard","▦"],["projecthub","Projects","◫"],["recruitment","Hiring","♧"],["planner","Planner","▤"]];
   $("#bottomNav").innerHTML=bottom.map(x=>`<button class="bottom-item ${page===x[0]?"active":""}" data-route="${x[0]}"><span class="b-icon">${x[2]}</span>${x[1]}</button>`).join("")+'<button class="bottom-item" id="bottomMore"><span class="b-icon">☷</span>More</button>';
   $("#breadcrumb").textContent="Workspace / "+(nav.find(x=>x.id===page)?.name||"Project Hub");
   document.title=(nav.find(x=>x.id===page)?.name||"Workspace")+" | Black Owl TA & TM";
 }
 const head=(title,sub,tag)=>`<div class="section-cap">BLACK OWL • ${esc(tag)}</div><div class="page-heading"><div><h1 class="page-title">${esc(title)}</h1><p class="page-copy">${esc(sub)}</p></div><span class="tag">● Team Workspace</span></div>`;

 function overviewWidget(compact=false){
 const src=appUrl("overview");
 const purl=appUrl("planner");
 const kpis=[
   "Total MP Request","Fulfilled Request","Hiring GAP","Fulfillment Rate",
   "Published Content","Total Reach","Total Engagement","Applications In",
   "Activities Completed","Participation Rate","Activity Budget","Actual Cost"
 ];
 return `<section class="bo-view ${compact?"compact":""}" id="liveOverview">
   <div class="bo-view-head"><div><div class="section-cap">BLACK OWL • MANAGEMENT OVERVIEW</div><h2>TA & TM — Dashboard Overview</h2>
   <p>Ringkasan kerja tim, dokumentasi kegiatan dan monitoring KPI.</p></div>
   <span class="bo-view-status">● Sumber Data Internal</span></div>
   <div class="bo-view-tabs"><div class="live-tabs" role="group" aria-label="Pilih dashboard">
     <button type="button" class="live-tab active" data-live-report="original" aria-pressed="true">Overview Lengkap</button>
     <button type="button" class="live-tab" data-live-report="recruitment" aria-pressed="false">Talent Acquisition</button>
     <button type="button" class="live-tab" data-live-report="branding" aria-pressed="false">Employer Branding</button>
     <button type="button" class="live-tab" data-live-report="culture" aria-pressed="false">People Culture</button>
   </div><a class="button primary small" id="liveReportLink" href="${esc(src)}" target="_blank" rel="noopener noreferrer">Buka Data Live ↗</a></div>
   <div id="boNativeContent" class="bo-native-content">
      <div class="bo-native-columns">
        <article class="bo-native-spotlight">
           <div class="bo-native-photo"><div class="bo-native-photo-inner"><span class="bo-photo-mark">◉</span>
             <span class="bo-mini-tag">PROGRAM SPOTLIGHT</span><h3>Dokumentasi kegiatan tim</h3>
             <p>Foto dan video asli tetap tersimpan di Program Planner. Untuk melihat galeri terbaru secara live, buka dashboard internal.</p>
             <div class="bo-action-row"><a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Lihat Spotlight Live ↗</a>
             <a href="${esc(purl)}" target="_blank" rel="noopener noreferrer">Program Planner ↗</a></div></div></div>
        </article>
        <article class="bo-native-updates"><div class="bo-native-updates-title"><h3>Update Program Terbaru</h3><span>Source: Program Planner</span></div>
          <div class="bo-update-row"><b>Progress dan status program</b><p>Daftar program terbaru terbaca langsung di Workspace internal.</p>
          <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Buka update program ↗</a></div>
          <div class="bo-update-row"><b>Foto dan dokumentasi</b><p>Galeri mengikuti file yang di-upload anggota tim.</p>
          <a href="${esc(purl)}" target="_blank" rel="noopener noreferrer">Lihat dokumentasi ↗</a></div>
          <div class="bo-update-row"><b>Notepad dan planning tim</b><p>Catatan dan rencana kerja tetap tersedia di Program Planner.</p>
          <a href="${esc(purl)}" target="_blank" rel="noopener noreferrer">Lihat planning ↗</a></div>
        </article>
      </div>
      <div class="bo-period-info"><span>▦ Filter Periode • Tersedia di dashboard asli</span><a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Atur tanggal & refresh KPI ↗</a></div>
      <div class="bo-kpi-grid">${kpis.map(name=>`<article class="bo-kpi-card"><span>${esc(name)}</span><strong>—</strong><small>Angka live tersedia di dashboard asli</small></article>`).join("")}</div>
   </div>
   <div class="bo-looker-content" id="boLookerContent" hidden>
     <div class="bo-looker-controls"><b>Report Looker Studio</b><button type="button" class="button light small" id="refreshLiveFrame">↻ Refresh report</button></div>
     <div class="live-frame-scroll"><iframe id="liveReportFrame" title="Looker Studio" src="about:blank" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
     <div class="live-caption">Report mengambil data sesuai koneksi, izin akun, dan kebijakan refresh Looker Studio. Jika embed ditolak, klik Buka Report.</div>
   </div>
 </section>`;
}

function setLiveReport(mode){
 const shell=document.getElementById("liveOverview");if(!shell)return;
 const isOriginal=mode==="original";
 const data=isOriginal?{view:appUrl("overview")}:C.looker[mode];
 if(!data)return;
 const native=shell.querySelector("#boNativeContent"), loooker=shell.querySelector("#boLookerContent");
 native.hidden=!isOriginal;loooker.hidden=isOriginal;
 shell.querySelectorAll("[data-live-report]").forEach(btn=>{
   btn.classList.toggle("active",btn.dataset.liveReport===mode);
   btn.setAttribute("aria-pressed",String(btn.dataset.liveReport===mode));
 });
 const a=shell.querySelector("#liveReportLink");a.href=data.view;
 a.textContent=isOriginal?"Buka Data Live ↗":"Buka Report ↗";
 if(!isOriginal){
   const frame=shell.querySelector("#liveReportFrame");
   frame.src=data.embed;
   frame.title=mode==="recruitment"?"Talent Acquisition":mode==="branding"?"Employer Branding":"People Culture";
 }
}

function overview(){
 content.innerHTML=head("Main Dashboard","Program Spotlight, update kegiatan, filter periode dan 12 KPI dalam satu workspace.","TA & TM OVERVIEW")+overviewWidget(false);
}

 function projectCard(p){return `<article class="project-card"><div class="project-head"><div class="project-icon">${p.icon}</div><span class="project-type">${esc(p.kind)}</span></div><h3>${esc(p.name)}</h3><div class="project-meta">${esc(p.cat)}</div><p>${esc(p.desc)}</p><div class="project-actions">${href(p.url,"Buka Project","button primary small")}<button class="copy-btn" data-copy="${p.id}" aria-label="Salin link ${esc(p.name)}">⧉ Salin link</button></div></article>`;}
 function filterProjects(){
   const visible=projects.filter(p=>!search||[p.name,p.cat,p.kind,p.desc].join(" ").toLowerCase().includes(search.toLowerCase()));
   $("#projectGrid").innerHTML=visible.length?visible.map(projectCard).join(""):'<div class="empty-card">Tidak ada project yang cocok dengan pencarian.</div>';
   $("#filterCount").textContent=visible.length+" dari "+projects.length+" project";
 }
 function projecthub(){
   content.innerHTML=head("All Projects","Akses seluruh project dan tools digital TA & TM dalam satu tempat.","PROJECT TEAM TA & TM")+
    `<div class="filterbar"><label class="search-wrap"><span>⌕</span><input id="projectSearch" type="search" placeholder="Cari nama project..." value="${esc(search)}" aria-label="Cari project"></label><span id="filterCount"></span></div><section id="projectGrid" class="project-grid" aria-label="All Projects"></section>`;
   $("#projectSearch").addEventListener("input",e=>{search=e.target.value;filterProjects();});
   filterProjects();
 }
 function analytics(route){
   const labels={recruitment:["Talent Acquisition Dashboard","Manpower request, fulfillment, hiring trend dan cost center.","Hiring & Workforce"],branding:["Employer Branding Performance","Published content, reach, engagement, dan application in.","Brand & Content"],culture:["People Culture Dashboard","Activity, participation, budget, dan actual cost kegiatan.","People & Culture"]};
   const l=labels[route], rep=C.looker[route];
   content.innerHTML=head(l[0],l[1],"LOOKER STUDIO")+`<div class="embed-card"><div class="embed-bar"><b>${l[2]}</b><div class="embed-actions">${href(rep.view,"Buka Report","button primary small")}<button id="refreshReport" class="button light small">↻ Refresh</button></div></div><div class="embed-shell"><iframe id="lookerFrame" title="${esc(l[0])}" src="${esc(rep.embed)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><div class="embed-note">Jika report tidak tampil karena akses akun Google atau batasan iframe, klik “Buka Report” di atas. Filter periode mengikuti Looker Studio.</div></div>`;
   $("#refreshReport").addEventListener("click",()=>{$("#lookerFrame").src=rep.embed;toast("Memuat ulang Looker Studio...");});
 }

 function weeklyMom(){
   content.innerHTML=head("Weekly MoM","Arsip lengkap meeting mingguan TA & TM, langsung di PWA dengan akses Google yang diizinkan.","ASANA WEEKLY MEETING")+ `
    <section id="momNative" class="mom-native" aria-label="Weekly MoM Notulen">
      <div class="mom-topbar">
        <div><span class="mom-eyebrow">BLACK OWL • TA & TM DEPARTMENT</span>
        <h2>Minutes of Meeting</h2><p>Notulen Asana diarsipkan ke spreadsheet privat agar bisa dibaca dan dicari dalam satu workspace.</p></div>
        <div class="mom-top-actions">
          <button id="momConnect" class="button primary" type="button">Hubungkan Google</button>
          <a class="button secondary" href="${esc(C.asanaMomUrl)}" target="_blank" rel="noopener noreferrer">Buka Asana ↗</a>
        </div>
      </div>
      <div id="momStatus" class="mom-status" role="status">Menghubungkan notulen...</div>
      <div class="mom-toolbar">
        <label class="mom-search">⌕ <input id="momSearch" type="search" placeholder="Cari topik, tindak lanjut, atau PIC..." aria-label="Cari notulen"></label>
        <select id="momMonth" aria-label="Filter bulan notulen"><option value="all">Semua bulan</option></select>
        <span id="momCount">— notulen</span>
      </div>
      <div class="mom-layout">
        <nav id="momList" class="mom-list" aria-label="Riwayat meeting"><p class="mom-empty">Hubungkan Google untuk memuat riwayat notulen.</p></nav>
        <section id="momDetail" class="mom-detail" aria-label="Isi notulen"><p class="mom-empty">Pilih tanggal meeting dari daftar di samping.</p></section>
      </div>
      <p class="mom-disclaimer">Sumber: komentar task Asana • Ditampilkan dari tab privat Weekly_MoM di Program Planner • Catatan baru mengikuti jadwal sinkronisasi yang diaktifkan administrator.</p>
    </section>`;
 }


 function plannerNativePage(){
   content.innerHTML=head("Program Planner & Notes","Catat, susun, dan monitor program kerja TA & TM langsung di PWA.","PLAN • ORGANIZE • EXECUTE")+
   `<section id="plannerNative" class="planner-native" aria-label="Program Planner and Notes">
     <div class="planner-hero">
       <div><span class="planner-eyebrow">BLACK OWL • TEAM WORKSPACE</span><h2>From ideas to programs.</h2>
         <p>Program kerja, PIC, status, progres, dokumentasi kegiatan dan Quick Notepad — semua membaca database Google Sheets yang sama.</p>
       </div>
       <div class="planner-hero-actions">
         <button type="button" class="planner-btn gold" data-action="new">+ Program Baru</button>
         <button type="button" id="plannerConnect" class="planner-btn outline" data-action="connect">Hubungkan Google</button>
         <button type="button" class="planner-btn ghost" data-action="open-original">Buka Workspace Asli ↗</button>
       </div>
     </div>
     <div id="plannerLiveStatus" class="planner-live-status" role="status"></div>
     <div id="plannerStats" class="planner-stats" aria-label="Program statistics"></div>
     <div class="planner-tabs">
       <button id="plannerTabPrograms" class="active" type="button" data-action="programs">▤ Program Planner</button>
       <button id="plannerTabNotes" type="button" data-action="notes">✎ Quick Notepad</button>
     </div>
     <section id="plannerProgramSection">
       <div class="planner-controls">
         <label class="planner-search">⌕ <input id="plannerSearch" type="search" placeholder="Cari program, PIC, atau catatan..." aria-label="Cari program"></label>
         <select id="plannerWorkstreamFilter" aria-label="Filter workstream"><option value="all">Semua workstream</option></select>
         <select id="plannerStatusFilter" aria-label="Filter status"><option value="all">Semua status</option></select>
         <div class="planner-switch"><button class="active" type="button" id="plannerViewList" data-action="list">List</button><button type="button" id="plannerViewBoard" data-action="board">Board</button></div>
       </div>
       <div id="plannerResultCount" class="planner-count">0 program</div>
       <div id="plannerProgramsContent" class="planner-list"><div class="planner-empty">Klik Hubungkan Google untuk memuat program terbaru.</div></div>
     </section>
     <section id="plannerNotesSection" hidden>
       <div class="planner-notepad">
         <div class="planner-notes-head"><div><span class="planner-eyebrow">QUICK NOTEPAD • TEAM SCRATCHPAD</span>
         <h2>Tulis ide langsung di sini</h2><p>Simpan catatan bersama berdasarkan workstream, dengan riwayat pembaruan versi.</p></div>
         <div class="planner-notes-actions"><select id="plannerNotesWorkstream" aria-label="Pilih workstream"></select><button type="button" class="planner-btn gold" data-action="save-notes">Simpan Catatan</button></div></div>
         <textarea id="plannerQuickNote" rows="13" aria-label="Quick Notepad" placeholder="Tuliskan program berikutnya, agenda weekly meeting, atau tindak lanjut tim..."></textarea>
         <div id="plannerNoteMeta" class="planner-notes-meta">Hubungkan Google untuk memuat catatan.</div>
       </div>
     </section>
     <div id="plannerModal" class="planner-modal" role="dialog" aria-modal="true" aria-labelledby="plannerFormHeading" hidden>
       <div class="planner-modal-panel">
         <div class="planner-modal-head"><div><span class="planner-eyebrow">BLACK OWL • PROGRAM EDITOR</span>
           <h2 id="plannerFormHeading">Detail & Edit Program</h2>
           <p>Perubahan tersimpan ke spreadsheet Program Planner dan tersedia untuk tim yang memiliki izin.</p></div>
           <button type="button" class="planner-modal-close" data-action="close-modal" aria-label="Tutup">✕</button>
         </div>
         <form id="plannerForm">
           <input type="hidden" name="id" id="plannerFormId">
           <div class="planner-form-grid">
             <label class="planner-span-2">Nama program / kegiatan *<input required type="text" name="title" maxlength="180" placeholder="Contoh: Training Operational by HCGA & Legal"></label>
             <label>Workstream<select id="plannerFormWorkstream" name="workstream"></select></label>
             <label>PIC / penanggung jawab<input name="owner" maxlength="120" placeholder="PIC tim"></label>
             <label>Status<select name="status"><option value="Idea">Idea</option><option value="Planning">Planning</option><option value="In Progress">In Progress</option><option value="On Hold">On Hold</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></label>
             <label>Prioritas<select name="priority"><option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option></select></label>
             <label>Tanggal mulai<input type="date" name="startDate"></label>
             <label>Target selesai<input type="date" name="dueDate"></label>
             <label class="planner-span-2">Progress program — <span id="plannerProgressValue">0%</span><input type="range" name="progress" min="0" max="100" step="5" value="0"></label>
             <div class="planner-form-section planner-span-2">PROGRAM BRIEF & ACTION PLAN</div>
             <label class="planner-span-2">Tujuan & hasil yang diharapkan<textarea name="objective" rows="3"></textarea></label>
             <label class="planner-span-2">Detail pelaksanaan / program brief<textarea name="planDetails" rows="4"></textarea></label>
             <label class="planner-span-2">Next steps & tindak lanjut<textarea name="nextSteps" rows="3"></textarea></label>
             <label class="planner-span-2">Resources / approval yang dibutuhkan<textarea name="resources" rows="2"></textarea></label>
             <label class="planner-span-2">Catatan tambahan<textarea name="notes" rows="3"></textarea></label>
           </div>
           <div class="planner-form-section">DOKUMENTASI PROGRAM • FOTO & VIDEO</div>
           <div id="plannerFormMedia" class="planner-media-list"></div>
           <div class="planner-media-hint">Untuk upload foto/video baru, gunakan menu Program Planner pada Workspace Asli. Foto/video yang sudah tersimpan di Drive dapat dilihat langsung di sini.</div>
           <div class="planner-modal-footer"><button type="button" class="planner-btn ghost" data-action="open-original">Upload Media via Workspace Asli ↗</button><button type="button" class="planner-btn outline" data-action="close-modal">Batal</button><button id="plannerSubmit" type="submit" class="planner-btn gold">Simpan Program</button></div>
         </form>
       </div>
     </div>
   </section>`;
 }

 function launch(route){
   const x={planner:["▤","Program Planner & Notes","Kelola rencana, PIC, status, program, quick notepad, foto dan video dokumentasi.",appUrl("planner"),"Buka Program Planner"],weeklymom:["☷","Weekly MoM","Baca notulen meeting mingguan, topik rapat dan tindak lanjut.",appUrl("weeklymom"),"Buka Weekly MoM"],workspace:["↗","Original TA & TM Workspace","Buka dashboard live dan seluruh modul Google Apps Script existing.",appUrl("projecthub"),"Buka Workspace"]}[route];
   content.innerHTML=head(x[1],x[2],"TEAM OPERATIONS")+`<section class="launch-card"><div class="launch-icon">${x[0]}</div><div class="section-cap" style="margin-top:18px">BLACK OWL INTERNAL TOOLS</div><h2>Your tools stay connected.</h2><p>${esc(x[2])}</p><div class="hero-actions">${href(x[3],x[4])}${route==="weeklymom"?href(C.asanaMomUrl,"Task Asana","button light"):""}<button class="button flat" data-route="projecthub">Kembali ke Project Hub</button></div><div class="launch-meta">Akses data dan penyimpanan tetap menggunakan backend existing serta hak akses Google/Asana.</div></section>`;
 }
 function render(){renderNav();if(page==="overview")overview();else if(page==="projecthub")projecthub();else if(page==="weeklymom")weeklyMom();else if(page==="planner")plannerNativePage();else if(["recruitment","branding","culture"].includes(page))analytics(page);else launch(page);if(window.BO_LIVE)window.BO_LIVE.mount();if(window.BO_MOM)window.BO_MOM.mount();if(window.BO_PLANNER)window.BO_PLANNER.mount();}
 function showDrawer(){$("#mobileDrawer").hidden=false;$("#mobileBackdrop").hidden=false;}
 function hideDrawer(){$("#mobileDrawer").hidden=true;$("#mobileBackdrop").hidden=true;}

 function initTeamChat(){
   const launcher=document.getElementById("chatLauncher");
   const panel=document.getElementById("chatPanel");
   const close=document.getElementById("chatClose");
   const frame=document.getElementById("chatFrame");
   const blank=document.getElementById("chatNotConfigured");
   const open=document.getElementById("chatOpen");
   const status=document.getElementById("chatStatus");
   const url=String(C.chatUrl||"").trim();
   let enabled=false;
   try{
     const u=new URL(url);
     enabled=(u.protocol==="https:"&&u.hostname==="script.google.com"&&/\/exec$/.test(u.pathname));
   }catch(e){}
   if(enabled){
     frame.src=url;frame.hidden=false;blank.hidden=true;
     open.href=url;open.hidden=false;
     status.textContent="Team Chat • Google Sheets";
   }else{
     frame.hidden=true;blank.hidden=false;open.hidden=true;
     status.textContent="Perlu aktivasi backend";
   }
   function toggle(openIt){
     panel.hidden=!openIt;
     launcher.setAttribute("aria-expanded",String(openIt));
     if(openIt)close.focus();else launcher.focus();
   }
   launcher.addEventListener("click",()=>toggle(panel.hidden));
   close.addEventListener("click",()=>toggle(false));
   document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)toggle(false);});
 }

 function boot(){
  $("#app").hidden=false;$("#bottomNav").hidden=false;
  page=routeFromLocation();go(page,true);
  $("#moreBtn").addEventListener("click",showDrawer);
  $("#closeDrawer").addEventListener("click",hideDrawer);
  $("#mobileBackdrop").addEventListener("click",hideDrawer);
  document.addEventListener("click",async e=>{
    if(e.target.id==="bottomMore"){showDrawer();return;}
    const switcher=e.target.closest("[data-live-report]");
    if(switcher){setLiveReport(switcher.dataset.liveReport);return;}
    if(e.target.closest("#refreshLiveFrame")){
      const f=document.getElementById("liveReportFrame");
      if(f){f.src=f.src;toast("Memuat ulang dashboard...");}return;
    }
    const r=e.target.closest("[data-route]");if(r){go(r.dataset.route);return;}
    const c=e.target.closest("[data-copy]");
    if(c){const p=projects.find(x=>x.id===c.dataset.copy);if(!p)return;try{await navigator.clipboard.writeText(p.url);toast("Link "+p.name+" berhasil disalin");}catch(err){toast("Salin link dari tombol Buka Project");}}
  });
  window.addEventListener("popstate",()=>{page=routeFromLocation();render();});
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("#installBtn").hidden=false;});
  window.addEventListener("appinstalled",()=>{installPrompt=null;$("#installBtn").hidden=true;toast("TA & TM Workspace berhasil diinstal");});
  $("#installBtn").hidden=window.matchMedia("(display-mode: standalone)").matches;
  $("#installBtn").addEventListener("click",async()=>{if(!installPrompt){toast("Buka menu Chrome → Install app / Add to Home screen");return;}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("#installBtn").hidden=true;});
  initTeamChat();
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js",{scope:"./"}).catch(console.warn);
  $("#splash").hidden=true;
 }
 window.addEventListener("DOMContentLoaded",boot);
})();
