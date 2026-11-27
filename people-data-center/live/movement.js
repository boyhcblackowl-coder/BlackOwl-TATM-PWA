(()=>{
'use strict';
/* Sensitive resignation files stay inside the Admin's browser until status-update calls.
 * No source workbook, reason, or blacklist flag is uploaded or cached by GitHub Pages. */
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x??'').normalize('NFKD').toUpperCase().replace(/[^A-Z0-9]/g,'');
const tidy=x=>String(x??'').trim();
const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'});
let roster=[],admin=false,staged=[],busy=false,reportDownloaded=false;
const appliedInSession=new Set();
function dateValue(v){
 const s=tidy(v);
 if(/^[0-9]{5}(?:\.[0-9]+)?$/.test(s)&&Number(s)>25000&&Number(s)<80000)return new Date(Date.UTC(1899,11,30)+Number(s)*86400000).toISOString().slice(0,10);
 if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
 const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
 if(m){const a=Number(m[1]),b=Number(m[2]);if(a>12&&b<=12)return m[3]+'-'+String(b).padStart(2,'0')+'-'+String(a).padStart(2,'0');
 if(b>12&&a<=12)return m[3]+'-'+String(a).padStart(2,'0')+'-'+String(b).padStart(2,'0');}
 return '';
}
function unitFrom(division,pt){
 const d=tidy(division).toUpperCase(),p=tidy(pt).toUpperCase();
 const found=d.match(/(?:^|[^A-Z0-9])(SCBD|BOSBY|BOMDN|BOGS|BOKG|BOI)(?:$|[^A-Z0-9])/);
 const key=found?.[1]||'';
 if(key==='BOI')return 'BO PIK';
 if(key==='BOKG')return 'BO Kelapa Gading';
 if(key==='BOGS')return 'BO Gading Serpong';
 if(key==='BOSBY')return 'BO Surabaya';
 if(key==='BOMDN')return 'BO Medan';
 if(key==='SCBD')return 'BO SCBD';
 if(p.includes('BERJAYA INDONESIA'))return 'BO PIK';
 if(p.includes('BERDUA INDONESIA'))return 'BO Kelapa Gading';
 if(p.includes('SERPONG ABADI'))return 'BO Gading Serpong';
 if(p.includes('BERLIMA INDONESIA'))return 'BO Surabaya';
 if(p.includes('MITRA DAMAI'))return 'BO Medan';
 if(p.includes('SINERGI CIPTA'))return 'BO SCBD';
 if(p.includes('MURINO BERSATU'))return 'Head Office';
 if(p.includes('TABLELINK DIGITAL'))return 'TDI';
 return '';
}
function csvRows(text){
 const str=String(text).replace(/^\uFEFF/,'');const first=str.split(/\r?\n/,1)[0]||'';
 const sep=[';',',','\t'].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
 let rows=[],row=[],cell='',quoted=false;
 for(let i=0;i<str.length;i++){const c=str[i];
  if(c==='"'){if(quoted&&str[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(c===sep&&!quoted){row.push(cell);cell='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&str[i+1]==='\n')i++;row.push(cell);if(row.some(v=>tidy(v)))rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 row.push(cell);if(row.some(v=>tidy(v)))rows.push(row);return rows;
}
function readSheet(rows,filename,sheet){
 const headerAt=rows.findIndex((row,i)=>i<12&&row.some(c=>['NAME','NAMAKARYAWAN','NAMALENGKAP'].includes(norm(c)))&&row.some(c=>['LASTDAY','TANGGALRESIGN','TANGGALKELUAR','TGLKELUAR'].includes(norm(c))));
 if(headerAt<0)throw Error('Header Name dan Last Day tidak ditemukan pada tab '+sheet+'.');
 const head=rows[headerAt].map(norm);
 const find=(aliases)=>head.findIndex(k=>aliases.includes(k));
 const ix={
  name:find(['NAME','NAMAKARYAWAN','NAMALENGKAP']),
  id:find(['EMPLOYEEID','EMPID','NIKKARYAWAN','NOMORINDUKKARYAWAN','NOINDUKKARYAWAN']),
  div:find(['DIVISION','DEPARTMENT','DEPARTEMEN']),
  pt:find(['OUTLET','PT','LEGALENTITY','NAMAPT']),
  pos:find(['POSITION','POSISI','JABATAN']),
  date:find(['LASTDAY','TANGGALRESIGN','TANGGALKELUAR','TGLKELUAR']),
  reason:find(['STATUS','REASON','ALASAN']),
  exit:find(['EXITINTERVIEW'])
 };
 const output=[];
 for(let i=headerAt+1;i<rows.length;i++){
  const cols=rows[i]||[],val=k=>ix[k]>=0?tidy(cols[ix[k]]):'';
  const name=val('name');if(!name)continue;
  const effectiveDate=dateValue(val('date'));
  output.push({file:filename,sheet,row:i+1,name,employeeId:val('id'),division:val('div'),pt:val('pt'),position:val('pos'),
   effectiveDate,reason:val('reason'),exit:val('exit'),unit:unitFrom(val('div'),val('pt')),
   checked:false,match:null,kind:'pending',message:''});
 }
 return output;
}
function matchesPosition(a,b){
 const tokens=x=>tidy(x).toUpperCase().match(/[A-Z0-9]+/g)?.sort().join('')||'';
 return !!a&&!!b&&(norm(a)===norm(b)||tokens(a)===tokens(b));
}
function classify(){
 const seen=new Set();
 for(const row of staged){
  row.match=null;row.kind='unmatched';row.message='Belum ada pasangan di database.';
  if(!row.effectiveDate){row.kind='review';row.message='Tanggal Last Day tidak terbaca.';row.checked=false;continue;}
  if(row.effectiveDate>today){row.kind='review';row.message='Last Day masih di masa depan; belum bisa diubah menjadi Tidak Aktif.';row.checked=false;continue;}
  const sameId=row.employeeId?roster.filter(r=>norm(r.employeeId)===norm(row.employeeId)):[];
  const sameName=roster.filter(r=>norm(r.name)===norm(row.name));
  let possible=row.employeeId?sameId:sameName.filter(r=>row.unit&&norm(r.unit)===norm(row.unit));
  if(row.employeeId&&sameId.length===1&&norm(sameId[0].name)!==norm(row.name)){row.kind='review';row.message='Employee ID cocok tetapi nama berbeda; periksa manual.';row.checked=false;continue;}
  if(possible.length!==1){
   if(possible.length>1){row.kind='review';row.message='Ada lebih dari satu record yang mungkin cocok.';}
   else if(sameName.length){row.kind='review';row.message='Nama ditemukan, tetapi outlet/unit atau Employee ID tidak cocok.';}
   row.checked=false;continue;
  }
  const match=possible[0];row.match=match;
  if(appliedInSession.has(match.uid)){row.kind='already';row.message='Status sudah diperbarui dalam sesi ini; muat ulang dashboard.';row.checked=false;continue;}
  const st=norm(match.status);
  if(['RESIGN','RESIGNED','NONAKTIF','TIDAKAKTIF','INACTIVE','TERMINATED','PHK'].includes(st)){
   row.kind='already';row.message='Record ini sudah berstatus tidak aktif.';row.checked=false;continue;
  }
  if(!row.unit||norm(row.unit)!==norm(match.unit)){row.kind='review';row.message='Outlet/unit tidak dapat diverifikasi.';row.checked=false;continue;}
  if(!row.employeeId&&norm(row.name).length<9){row.kind='review';row.message='Nama terlalu singkat; tambahkan Employee ID untuk keamanan.';row.checked=false;continue;}
  if(!matchesPosition(row.position,match.position)){row.kind='review';row.message='Posisi berbeda; perlu konfirmasi melalui Direktori.';row.checked=false;continue;}
  const key=norm(match.employeeId)+'|'+norm(match.name);
  if(seen.has(key)){row.kind='review';row.message='Karyawan muncul lebih dari satu kali dalam file.';row.checked=false;continue;}
  seen.add(key);row.kind='ready';row.message='Nama, unit, dan posisi cocok. Siap diperiksa Admin.';
 }
}
function counts(){return staged.reduce((a,r)=>(a[r.kind]=(a[r.kind]||0)+1,a),{});}
function render(){
 const root=$('movementPreview');if(!root)return;
 $('movementUpload').disabled=!admin||busy;
 $('movementConfirm').disabled=busy||!admin||!staged.some(r=>r.checked&&r.kind==='ready');
 $('movementExport').disabled=staged.length===0||busy;
 $('movementSelectReady').disabled=staged.length===0||busy||!admin;
 $('movementAccess').textContent=admin?'Akses Admin HCGA & Legal • hanya update karyawan yang sudah ada.':'Akun Viewer: tidak dapat mengunggah atau memperbarui status.';
 const cnt=counts();
 $('movementStats').innerHTML=[
 ['Data dari file',staged.length],['Cocok, siap ditinjau',cnt.ready||0],
 ['Perlu pemeriksaan',cnt.review||0],['Belum ada di master',cnt.unmatched||0],
 ['Sudah tidak aktif',cnt.already||0]
 ].map(([name,num])=>'<div class="card mov-stat"><b>'+num.toLocaleString('id-ID')+'</b><small>'+esc(name)+'</small></div>').join('');
 $('movementPreview').innerHTML=staged.length?'<div class="table-wrap"><table class="data-table mov-table"><thead><tr><th>Pilih</th><th>Karyawan</th><th>Unit / Posisi</th><th>Last Day</th><th>Pencocokan</th></tr></thead><tbody>'+
 staged.map((r,i)=>'<tr><td><input type="checkbox" data-mov-check="'+i+'" '+(r.checked&&r.kind==='ready'?'checked':'')+' '+(r.kind==='ready'&&admin&&!busy?'':'disabled')+'></td><td><strong>'+esc(r.name)+'</strong><div class="muted sub">'+esc(r.file)+' • '+esc(r.sheet)+'</div></td><td>'+esc(r.unit||'Perlu mapping')+'<div class="muted sub">'+esc(r.position||'—')+'</div></td><td>'+esc(r.effectiveDate||'Tidak terbaca')+'</td><td><span class="chip '+(r.kind==='ready'?'green':r.kind==='already'?'gold':'red')+'">'+esc({ready:'Cocok',review:'Perlu Review',unmatched:'Belum Ada',already:'Sudah Tidak Aktif'}[r.kind]||r.kind)+'</span><div class="muted sub">'+esc(r.message)+'</div></td></tr>').join('')+
 '</tbody></table></div>':'<div class="empty">Belum ada file movement yang diunggah. Pilih Excel bulanan untuk melihat hasil pemeriksaan.</div>';
 $('movementStatus').textContent=staged.length?'Data dari '+[...new Set(staged.map(r=>r.file))].join(', ')+' • Last Day digunakan untuk pemeriksaan, tetapi tidak disimpan di master pada versi API ini.':'Pilih file .xlsx atau .csv (maks. 8 MB per file). XLSX dengan beberapa tab akan dibaca seluruhnya.';
}
async function onFile(files){
 if(!admin||busy)return;
 staged=[];reportDownloaded=false;
 const errs=[];
 for(const file of [...files].slice(0,5)){
  if(!/\.(xlsx|csv)$/i.test(file.name)){errs.push(file.name+': hanya Excel/CSV.');continue;}
  if(file.size>8*1024*1024){errs.push(file.name+': lebih dari 8 MB.');continue;}
  try{
   const tabs=/\.csv$/i.test(file.name)?[{name:'CSV',rows:csvRows(await file.text())}]:await window.PDC_PARSE_MOVEMENT_XLSX(await file.arrayBuffer());
   for(const tab of tabs){staged.push(...readSheet(tab.rows,file.name,tab.name));}
  }catch(e){errs.push(file.name+': '+e.message);}
 }
 classify();render();
 if(errs.length)$('movementStatus').textContent=errs.join(' • ');
 $('movementUpload').value='';
}
function reviewCsv(){
 if(!staged.length)return;
 const rows=[['File','Tab Sumber','Baris','Nama Karyawan','Employee ID pada File','Unit','Posisi','Last Day','Kategori Sumber','Exit Interview','ID Master Cocok','Status Tujuan','Hasil Pencocokan','Tindak Lanjut']];
 for(const r of staged)rows.push([r.file,r.sheet,r.row,r.name,r.employeeId,r.unit,r.position,r.effectiveDate,r.reason,r.exit,r.match?.employeeId||'',$('movementTarget')?.value||'Nonaktif',r.kind,r.message]);
 const q=v=>{let x=String(v??'');if(/^[=+@\-\t\r]/.test(x))x="'"+x;return '"'+x.replaceAll('"','""')+'"';};
 const data='\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n');
 const b=new Blob([data],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');
 a.href=URL.createObjectURL(b);a.download='Review_Movement_Karyawan_'+today+'.csv';
 document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1200);reportDownloaded=true;
}
function rpc(uid,newStatus){
 return new Promise((resolve,reject)=>{
  const runner=window.google?.script?.run;
  if(!runner)return reject(Error('Koneksi API belum tersedia.'));
  runner.withSuccessHandler(resolve).withFailureHandler(e=>reject(Error(e?.message||String(e)))).setEmployeeValidation(uid,newStatus,'Pembaruan Data HC');
 });
}
async function apply(){
 if(busy||!admin)return;
 const picked=staged.filter(r=>r.kind==='ready'&&r.checked&&r.match);
 if(!picked.length)return;
 const status=$('movementTarget')?.value==='Resign'?'Resign':'Nonaktif';
 if(!confirm('Konfirmasi perubahan status '+picked.length+' karyawan menjadi '+status.toUpperCase()+'? Status akan mengurangi Actual Manpower dan tidak dapat dibatalkan otomatis. Simpan laporan review sebagai bukti Last Day.'))return;
 reviewCsv();
 busy=true;render();let done=0,failed=0;
 for(const r of picked){
  try{await rpc(r.match.uid,status);appliedInSession.add(r.match.uid);done++;r.kind='already';r.checked=false;r.message='Status berhasil diperbarui pada database (waktu update tercatat di RIWAYAT_VALIDASI).';}
  catch(e){failed++;r.checked=false;r.kind='review';r.message='Update gagal: '+String(e.message).slice(0,120);}
  $('movementApplyProgress').textContent='Memproses '+(done+failed)+' dari '+picked.length+' • berhasil '+done+' • gagal '+failed;
 }
 busy=false;render();
 $('movementApplyProgress').innerHTML='Selesai: '+done+' diperbarui, '+failed+' gagal. <button class="btn" id="movementReload" type="button">Muat Ulang Dashboard</button>';
 $('movementReload')?.addEventListener('click',()=>location.reload());
}
function boot(){
 $('movementUpload')?.addEventListener('change',e=>onFile(e.target.files));
 $('movementSelectReady')?.addEventListener('click',()=>{const ready=staged.filter(r=>r.kind==='ready');const check=!ready.every(r=>r.checked);ready.forEach(r=>r.checked=check);render();});
 $('movementExport')?.addEventListener('click',reviewCsv);
 $('movementConfirm')?.addEventListener('click',apply);
 $('movementPreview')?.addEventListener('change',e=>{const c=e.target.closest('[data-mov-check]');if(!c)return;const r=staged[Number(c.dataset.movCheck)];if(r&&r.kind==='ready')r.checked=c.checked;render();});
}
window.PDC_MOVEMENT={refresh(data,canEdit){roster=Array.isArray(data)?data:[];admin=!!canEdit;if(staged.length)classify();render();}};
boot();
})();