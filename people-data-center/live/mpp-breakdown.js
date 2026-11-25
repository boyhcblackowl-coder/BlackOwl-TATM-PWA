(()=>{
'use strict';
/* Aggregated MPP breakdown uses active, deduplicated roster supplied by the authenticated PWA.
 * Employee rows and identifiers are never stored in this frontend module or on GitHub. */
const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString('id-ID');
const clean=x=>String(x??'').trim();
const norm=x=>clean(x).normalize('NFKD').toUpperCase().replace(/[^A-Z0-9]/g,'');
const esc=x=>clean(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let records=[],admin=false;
function groups(rows){
 const units=new Map();
 for(const r of rows){
  const unit=clean(r.unit)||'Belum diisi',dept=clean(r.department)||'Belum diisi',pos=clean(r.position)||'Belum diisi';
  if(!units.has(unit))units.set(unit,{name:unit,count:0,depts:new Map()});
  const u=units.get(unit);u.count++;
  if(!u.depts.has(dept))u.depts.set(dept,{name:dept,count:0,positions:new Map()});
  const d=u.depts.get(dept);d.count++;d.positions.set(pos,(d.positions.get(pos)||0)+1);
 }
 return [...units.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'id'));
}
function filtered(){
 const unit=$('mppUnit')?.value||'',q=norm($('mppQuery')?.value||'');
 return records.filter(r=>(!unit||(clean(r.unit)||'Belum diisi')===unit)&&(!q||norm([r.unit,r.department,r.position].join(' ')).includes(q)));
}
function render(){
 if(!$('mppSummary'))return;
 const totalUnits=groups(records),select=$('mppUnit'),chosen=select.value;
 select.innerHTML='<option value="">Semua outlet / unit</option>'+totalUnits.map(u=>'<option value="'+esc(u.name)+'">'+esc(u.name)+'</option>').join('');
 select.value=totalUnits.some(u=>u.name===chosen)?chosen:'';
 const rows=filtered(),unitGroups=groups(rows);
 const depts=unitGroups.reduce((n,u)=>n+u.depts.size,0),positions=unitGroups.reduce((n,u)=>n+[...u.depts.values()].reduce((k,d)=>k+d.positions.size,0),0);
 $('mppSummary').innerHTML=[
  [rows.length,'Actual karyawan aktif'],
  [unitGroups.length,'Unit / outlet pada filter'],
  [depts,'Kelompok departemen'],
  [positions,'Kelompok posisi']
 ].map(([num,label])=>'<div class="card mpp-stat"><b>'+fmt(num)+'</b><small>'+esc(label)+'</small></div>').join('');
 $('mppCards').innerHTML=totalUnits.map(u=>{
  const top=[...u.depts.values()].sort((a,b)=>b.count-a.count).slice(0,2).map(d=>d.name).join(' • ');
  return '<button type="button" class="mpp-choice'+(select.value===u.name?' selected':'')+'" data-unit="'+esc(u.name)+'"><span>'+esc(u.name)+'</span><b>'+fmt(u.count)+'</b><small>'+esc(top||'Belum ada departemen')+'</small></button>';
 }).join('')||'<div class="empty">Belum ada karyawan aktif dari data roster Excel.</div>';
 $('mppDescription').textContent=fmt(rows.length)+' karyawan aktif unik • '+fmt(unitGroups.length)+' outlet/unit • Target MPP belum tersedia';
 $('mppDetails').innerHTML=unitGroups.map((u,i)=>{
   let table='<div class="table-wrap"><table class="data-table mpp-table"><thead><tr><th>Departemen</th><th>Posisi / Jabatan</th><th>Actual Aktif</th><th>Target MPP</th><th>Selisih</th></tr></thead><tbody>';
   const deptArr=[...u.depts.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'id'));
   for(const d of deptArr){
    table+='<tr class="mpp-dept"><td colspan="2">'+esc(d.name)+'</td><td><strong>'+fmt(d.count)+'</strong></td><td>—</td><td>—</td></tr>';
    for(const [pos,count] of [...d.positions.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'id'))){
     table+='<tr class="mpp-position" data-role="'+esc(pos)+'" data-unit="'+esc(u.name)+'" title="Lihat nama karyawan"><td>'+esc(d.name)+'</td><td><span class="mpp-role">'+esc(pos)+'</span></td><td><strong>'+fmt(count)+'</strong></td><td class="mpp-unset">Belum ditetapkan</td><td class="mpp-unset">—</td></tr>';
    }
   }
   table+='</tbody></table></div>';
   return '<details class="mpp-group" '+(select.value||i===0?'open':'')+'><summary><span><b>'+esc(u.name)+'</b><small>'+fmt(u.depts.size)+' departemen • '+fmt(u.count)+' karyawan aktif</small></span><span class="mpp-sum">'+fmt(u.count)+' Actual ⌄</span></summary>'+table+'</details>';
 }).join('')||'<div class="empty">Tidak ada hasil. Ganti outlet atau kata kunci pencarian.</div>';
 $('mppExport').hidden=!admin;
 $('mppTemplate').hidden=!admin;
}

/* Main Dashboard: summary by department only, using the same deduplicated active roster as Breakdown MPP. */
function renderSummary(){
 const select=$('mppOverviewUnit');if(!select)return;
 const allUnits=groups(records),selected=select.value;
 select.innerHTML='<option value="">Semua Outlet / Unit</option>'+allUnits.map(u=>'<option value="'+esc(u.name)+'">'+esc(u.name)+'</option>').join('');
 select.value=allUnits.some(u=>u.name===selected)?selected:'';
 const filteredRows=records.filter(r=>!select.value||(clean(r.unit)||'Belum diisi')===select.value);
 const deptCounts=new Map();
 for(const r of filteredRows){const dept=clean(r.department)||'Belum diisi';deptCounts.set(dept,(deptCounts.get(dept)||0)+1);}
 const depts=[...deptCounts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'id'));
 const activeTotal=filteredRows.length,allDepartmentCount=depts.length;
 const deptMissing=deptCounts.get('Belum diisi')||0;
 $('mppOverviewStats').innerHTML=
   '<div><small>Actual Karyawan Aktif</small><strong>'+fmt(activeTotal)+'</strong></div>'+
   '<div><small>Jumlah Departemen</small><strong>'+fmt(allDepartmentCount)+'</strong></div>'+
   '<div><small>Outlet / Unit</small><strong>'+fmt(select.value?1:allUnits.length)+'</strong></div>'+
   (deptMissing?'<div><small>Departemen Belum Diisi</small><strong>'+fmt(deptMissing)+'</strong></div>':'');
 const top=depts.slice(0,10);
 const otherCount=depts.slice(10).reduce((n,[,v])=>n+v,0);
 const items=otherCount?[...top,['Departemen lainnya ('+(depts.length-10)+')',otherCount]]:top;
 $('mppOverviewDepartments').innerHTML=items.length?items.map(([name,count])=>{
  const percent=activeTotal?(100*count/activeTotal):0;
  return '<div class="mpp-overview-item"><div class="mpp-overview-row"><span title="'+esc(name)+'">'+esc(name)+'</span><span><strong>'+fmt(count)+'</strong> <small>('+percent.toLocaleString('id-ID',{maximumFractionDigits:1})+'%)</small></span></div><div class="mpp-overview-track"><span style="width:'+Math.max(1,percent).toFixed(1)+'%"></span></div></div>';
 }).join(''):'<div class="empty">Data karyawan aktif belum tersedia untuk outlet ini.</div>';
}

function download(template){
 if(!admin)return;
 const groupsFiltered=groups(filtered()),lines=[['Unit / Outlet','Departemen','Posisi','Actual Aktif','Target MPP','Selisih (Target - Actual)']];
 for(const u of groupsFiltered){for(const d of u.depts.values()){for(const [pos,n] of d.positions){lines.push([u.name,d.name,pos,n,'','']);}}}
 if(lines.length===1)return;
 const q=v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const csv='\ufeff'+lines.map(r=>r.map(q).join(',')).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
 const anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download=(template?'Template_Target_MPP_':'Breakdown_Actual_Manpower_')+new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'})+'.csv';document.body.append(anchor);anchor.click();setTimeout(()=>{URL.revokeObjectURL(anchor.href);anchor.remove()},500);
}
function begin(){
 $('mppUnit')?.addEventListener('change',render);
 $('mppQuery')?.addEventListener('input',render);
 $('mppReset')?.addEventListener('click',()=>{$('mppUnit').value='';$('mppQuery').value='';render();});
 $('mppOverviewUnit')?.addEventListener('change',renderSummary);
 $('mppOverviewOpen')?.addEventListener('click',()=>{const chosen=$('mppOverviewUnit')?.value||'';document.querySelector('button[data-view="mpp"]')?.click();if($('mppUnit')){$('mppUnit').value=chosen;render();}});
 $('mppExport')?.addEventListener('click',()=>download(false));
 $('mppTemplate')?.addEventListener('click',()=>download(true));
 $('mppCards')?.addEventListener('click',e=>{
  const b=e.target.closest('[data-unit]');if(!b)return;
  $('mppUnit').value=$('mppUnit').value===b.dataset.unit?'':b.dataset.unit;render();
  $('mppDetails').scrollIntoView({behavior:'smooth',block:'start'});
 });
 $('mppDetails')?.addEventListener('click',e=>{
  const row=e.target.closest('tr[data-role]');if(!row)return;
  const nav=document.querySelector('button[data-view="directory"]:not([data-default-scope])');
  if(!nav)return;nav.click();
  const activeTab=document.querySelector('#scopeSwitcher2 button[data-scope="overall"]');if(activeTab)activeTab.click();
  const unit=$('filterUnit'),search=$('searchName');
  if(unit)unit.value=row.dataset.unit;
  if(search){search.value=row.dataset.role;search.dispatchEvent(new Event('input',{bubbles:true}));}
 });
}
window.PDC_MPP={render(data,canEdit){records=Array.isArray(data)?data:[];admin=Boolean(canEdit);render();renderSummary();}};
begin();
})();