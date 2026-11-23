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
 {id:"home",name:"Home",symbol:"⌂"},{id:"overview",name:"Live Dashboard",symbol:"▦"},{id:"projecthub",name:"Project Team TA & TM",symbol:"◫"},
 {id:"recruitment",name:"Talent Acquisition",symbol:"♧"},{id:"branding",name:"Employer Branding",symbol:"◈"},
 {id:"culture",name:"People Culture",symbol:"♡"},{id:"planner",name:"Program Planner & Notes",symbol:"▤"},
 {id:"weeklymom",name:"Weekly MoM",symbol:"☷"},{id:"workspace",name:"Original Workspace",symbol:"↗"}
 ];
 const routes=new Set(nav.map(n=>n.id));
 const $=sel=>document.querySelector(sel);
 const content=$("#content");
 let page="projecthub", search="", category="Semua kategori", installPrompt=null, toastTimer=null;
 const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const href=(url,label,cls="button primary")=>`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
 const appUrl=id=>{const u=new URL(C.workspaceUrl);u.searchParams.set("page",id);u.hash=id;return u.toString();};
 const routeFromLocation=()=>{const p=new URLSearchParams(location.search).get("page")||location.hash.slice(1);return routes.has(p)?p:"projecthub";};
 function toast(txt){const t=$("#toast");t.textContent=txt;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3500);}
 function go(to,replace=false){
   page=routes.has(to)?to:"projecthub";
   const u=new URL(location.href);u.searchParams.set("page",page);u.hash=page;
   (replace?history.replaceState:history.pushState).call(history,{page},"",u.toString());
   render();window.scrollTo(0,0);hideDrawer();
 }
 function renderNav(){
   const n=nav.map(x=>`<button type="button" data-route="${x.id}" class="nav-link ${page===x.id?"active":""}" ${page===x.id?'aria-current="page"':""}><span class="symbol" aria-hidden="true">${x.symbol}</span><span>${esc(x.name)}</span></button>`).join("");
   $("#sideMenu").innerHTML=n;$("#drawerMenu").innerHTML=n;
   const bottom=[["overview","Live","▦"],["projecthub","Projects","◫"],["recruitment","Hiring","♧"],["planner","Planner","▤"]];
   $("#bottomNav").innerHTML=bottom.map(x=>`<button class="bottom-item ${page===x[0]?"active":""}" data-route="${x[0]}"><span class="b-icon">${x[2]}</span>${x[1]}</button>`).join("")+'<button class="bottom-item" id="bottomMore"><span class="b-icon">☷</span>More</button>';
   $("#breadcrumb").textContent="Workspace / "+(nav.find(x=>x.id===page)?.name||"Project Hub");
   document.title=(nav.find(x=>x.id===page)?.name||"Workspace")+" | Black Owl TA & TM";
 }
 const head=(title,sub,tag)=>`<div class="section-cap">BLACK OWL • ${esc(tag)}</div><div class="page-heading"><div><h1 class="page-title">${esc(title)}</h1><p class="page-copy">${esc(sub)}</p></div><span class="tag">● Team Workspace</span></div>`;

 function overviewWidget(compact=false){
   const rep=C.looker.recruitment;
   return `<section class="live-overview ${compact?'compact':''}" id="liveOverview">
      <div class="live-top"><div><div class="section-cap">LIVE DATA • LOOKER STUDIO</div>
      <h2>Dashboard Overview</h2><p>Melihat report aktual TA & TM dalam PWA. Data dan refresh tetap mengikuti Looker Studio.</p></div>
      <span class="live-pill"><i></i> Sumber: Looker Studio</span></div>
      <div class="live-controls"><div class="live-tabs" role="group" aria-label="Pilih dashboard">
        <button type="button" class="live-tab active" data-live-report="recruitment">Talent Acquisition</button>
        <button type="button" class="live-tab" data-live-report="branding">Employer Branding</button>
        <button type="button" class="live-tab" data-live-report="culture">People Culture</button></div>
        <div class="live-actions"><button type="button" class="button light small" id="refreshLiveFrame">↻ Refresh</button>
        <a class="button primary small" id="liveReportLink" href="${esc(rep.view)}" target="_blank" rel="noopener noreferrer">Buka Report ↗</a></div></div>
      <div class="live-frame-scroll"><iframe id="liveReportFrame" title="TA & TM Live Dashboard" src="${esc(rep.embed)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
      <div class="live-caption">Jika iframe tidak muncul karena izin akun Google atau pembatasan cookies, gunakan “Buka Report”. Angka mengikuti sumber data dan jadwal refresh Looker Studio.</div>
   </section>`;
 }
 function setLiveReport(mode){
   const shell=document.getElementById("liveOverview");if(!shell)return;
   const rep=C.looker[mode];if(!rep)return;
   const frame=shell.querySelector("#liveReportFrame");
   frame.src=rep.embed;
   frame.title=mode==="recruitment"?"Talent Acquisition":mode==="branding"?"Employer Branding":"People Culture";
   const a=shell.querySelector("#liveReportLink");a.href=rep.view;
   shell.querySelectorAll("[data-live-report]").forEach(x=>x.classList.toggle("active",x.dataset.liveReport===mode));
 }
 function overview(){
   content.innerHTML=head("Live Dashboard","Seluruh data Recruitment, Employer Branding, dan People Culture langsung dalam satu workspace.","DATA ANALYTICS")+overviewWidget(false);
 }

 function home(){
   const cards=[["◫","Project Team TA & TM","10 shortcut project digital.","projecthub"],["♧","Talent Acquisition","Dashboard fulfillment dan hiring.","recruitment"],["▤","Program Planner","Rencana dan progres program.","planner"],["☷","Weekly MoM","Arsip meeting dan follow-up.","weeklymom"]];
   content.innerHTML=`<section class="hero"><div class="section-cap">THE DIGITAL WORKSPACE OF TA & TM</div><div class="hero-text"><h1>All your projects.<br>One powerful workspace.</h1><p>Akses cepat sistem, data, dashboard, dan program kerja tim Black Owl dalam satu aplikasi — tanpa login tambahan.</p><div class="hero-actions"><button class="button primary" data-route="projecthub">Explore Projects ↗</button>${href(appUrl("overview"),"Live Dashboard","button secondary")}</div></div></section><div class="block-title"><div><h2>Everything in one place</h2><p>Tool utama untuk pekerjaan tim setiap hari.</p></div></div><section class="module-grid">${cards.map(c=>`<button class="module-card" data-route="${c[3]}" style="text-align:left;color:inherit"><span class="mod-icon">${c[0]}</span><h3>${esc(c[1])}</h3><p>${esc(c[2])}</p><span class="mod-foot">Open module ↗</span></button>`).join("")}</section><div class="info-band">PWA ini tidak mempunyai login tersendiri. Dokumen dan aplikasi internal tetap mengikuti izin akun Google atau Asana masing-masing.</div>`;
   content.querySelector(".hero").insertAdjacentHTML("afterend",overviewWidget(true));
 }
 function projectCard(p){return `<article class="project-card"><div class="project-head"><div class="project-icon">${p.icon}</div><span class="project-type">${esc(p.kind)}</span></div><h3>${esc(p.name)}</h3><div class="project-meta">${esc(p.cat)}</div><p>${esc(p.desc)}</p><div class="project-actions">${href(p.url,"Buka Project","button primary small")}<button class="copy-btn" data-copy="${p.id}" aria-label="Salin link ${esc(p.name)}">⧉ Salin link</button></div></article>`;}
 function filterProjects(){
   const v=projects.filter(p=>(category==="Semua kategori"||category===p.cat)&&(!search||[p.name,p.cat,p.kind,p.desc].join(" ").toLowerCase().includes(search.toLowerCase())));
   $("#projectGrid").innerHTML=v.length?v.map(projectCard).join(""):'<div class="empty-card">Tidak ada project sesuai pencarian Anda.</div>';
   $("#filterCount").textContent=`${v.length} / ${projects.length} project`;
 }
 function projecthub(){
   const cats=["Semua kategori",...new Set(projects.map(p=>p.cat))];
   content.innerHTML=head("Project Team TA & TM","Akses seluruh sistem dan project digital tim, dalam satu tempat.","PROJECT DIRECTORY")+`<section class="hero"><div class="section-cap">ONE LINK. ALL PROJECTS.</div><div class="hero-text"><h1>Build smarter.<br>Work together.</h1><p>10 digital tools untuk recruitment, employee experience, people development, engagement, dan internal operations.</p><div class="hero-actions">${href(appUrl("overview"),"Open Live Dashboard")}<button class="button secondary" data-route="home">Workspace Home</button></div></div></section><div class="block-title"><div><h2>All Projects</h2><p>Langsung buka tools tanpa mencari link di chat.</p></div><span class="tag">${projects.length} Shortcuts</span></div><div class="filterbar"><label class="search-wrap"><span>⌕</span><input id="projectSearch" type="search" placeholder="Cari project, platform atau fungsi..." value="${esc(search)}"></label><select id="categoryFilter">${cats.map(c=>`<option value="${esc(c)}" ${c===category?"selected":""}>${esc(c)}</option>`).join("")}</select><span id="filterCount"></span></div><section id="projectGrid" class="project-grid"></section><div class="info-band">🔐 <b>Keamanan:</b> daftar shortcut ini dapat dibuka tanpa login PWA. Konten dokumen, dashboard, dan Asana tetap mengikuti izin masing-masing sistem.</div>`;
   $("#projectSearch").addEventListener("input",e=>{search=e.target.value;filterProjects();});
   $("#categoryFilter").addEventListener("change",e=>{category=e.target.value;filterProjects();});
   filterProjects();
   content.querySelector(".hero").insertAdjacentHTML("afterend",overviewWidget(true));
 }
 function analytics(route){
   const labels={recruitment:["Talent Acquisition Dashboard","Manpower request, fulfillment, hiring trend dan cost center.","Hiring & Workforce"],branding:["Employer Branding Performance","Published content, reach, engagement, dan application in.","Brand & Content"],culture:["People Culture Dashboard","Activity, participation, budget, dan actual cost kegiatan.","People & Culture"]};
   const l=labels[route], rep=C.looker[route];
   content.innerHTML=head(l[0],l[1],"LOOKER STUDIO")+`<div class="embed-card"><div class="embed-bar"><b>${l[2]}</b><div class="embed-actions">${href(rep.view,"Buka Report","button primary small")}<button id="refreshReport" class="button light small">↻ Refresh</button></div></div><div class="embed-shell"><iframe id="lookerFrame" title="${esc(l[0])}" src="${esc(rep.embed)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><div class="embed-note">Jika report tidak tampil karena akses akun Google atau batasan iframe, klik “Buka Report” di atas. Filter periode mengikuti Looker Studio.</div></div>`;
   $("#refreshReport").addEventListener("click",()=>{$("#lookerFrame").src=rep.embed;toast("Memuat ulang Looker Studio...");});
 }
 function launch(route){
   const x={planner:["▤","Program Planner & Notes","Kelola rencana, PIC, status, program, quick notepad, foto dan video dokumentasi.",appUrl("planner"),"Buka Program Planner"],weeklymom:["☷","Weekly MoM","Baca notulen meeting mingguan, topik rapat dan tindak lanjut.",appUrl("weeklymom"),"Buka Weekly MoM"],workspace:["↗","Original TA & TM Workspace","Buka dashboard live dan seluruh modul Google Apps Script existing.",appUrl("projecthub"),"Buka Workspace"]}[route];
   content.innerHTML=head(x[1],x[2],"TEAM OPERATIONS")+`<section class="launch-card"><div class="launch-icon">${x[0]}</div><div class="section-cap" style="margin-top:18px">BLACK OWL INTERNAL TOOLS</div><h2>Your tools stay connected.</h2><p>${esc(x[2])}</p><div class="hero-actions">${href(x[3],x[4])}${route==="weeklymom"?href(C.asanaMomUrl,"Task Asana","button light"):""}<button class="button flat" data-route="projecthub">Kembali ke Project Hub</button></div><div class="launch-meta">Akses data dan penyimpanan tetap menggunakan backend existing serta hak akses Google/Asana.</div></section>`;
 }
 function render(){renderNav();if(page==="home")home();else if(page==="overview")overview();else if(page==="projecthub")projecthub();else if(["recruitment","branding","culture"].includes(page))analytics(page);else launch(page);}
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
