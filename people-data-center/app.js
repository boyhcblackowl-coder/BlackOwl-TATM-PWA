(()=>{'use strict';
const KEY='blackowl.pdc.webapp.url.v1';
const $=id=>document.getElementById(id);
const toast=(message)=>{const n=$('toast');n.textContent=message;n.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>n.hidden=true,4200)};
function validUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&u.hostname==='script.google.com'&&/^\/macros\/s\/[A-Za-z0-9_-]+\/exec\/?$/.test(u.pathname)?u.href:null}catch{return null}}
function saved(){try{return localStorage.getItem(KEY)||''}catch{return ''}}
function status(){const url=saved();$('linkStatus').textContent=url?'Aplikasi internal siap dibuka':'Alamat belum disetel di perangkat ini';$('webappUrl').value=url;}
function save(){const url=validUrl($('webappUrl').value.trim());if(!url){$('feedback').textContent='Alamat tidak sesuai. Gunakan URL Web App Apps Script yang berakhir /exec.';toast('URL belum valid. Pastikan alamat /exec benar.');return}try{localStorage.setItem(KEY,url)}catch{$('feedback').textContent='Browser menolak penyimpanan lokal. Gunakan mode normal, bukan private.';return}$('feedback').textContent='Alamat tersimpan pada perangkat ini.';status();toast('Alamat People Data Center berhasil disimpan.')}
function clear(){try{localStorage.removeItem(KEY)}catch{}$('feedback').textContent='Alamat di perangkat ini sudah dikosongkan.';status();toast('Alamat dihapus dari perangkat ini.')}
function open(){const u=validUrl(saved());if(!u){document.getElementById('connect').scrollIntoView({behavior:'smooth',block:'center'});toast('Masukkan alamat Web App /exec terlebih dahulu.');return}const w=window.open(u,'_blank','noopener,noreferrer');if(!w){toast('Pop-up diblokir. Izinkan pop-up atau buka Web App dari Chrome.') } }
function go(name){const dest={home:'home',modules:'modules',connect:'connect',install:'install'}[name]||'home';$(dest)?.scrollIntoView({behavior:'smooth',block:'start'});document.querySelectorAll('[data-go]').forEach(e=>e.classList.toggle('selected',e.dataset.go===name));$('crumb').textContent={home:'Beranda',modules:'Modul People Data',connect:'Hubungkan Web App',install:'Instal PWA'}[name];}
let deferredPrompt=null;
async function install(){if(deferredPrompt){deferredPrompt.prompt();const choice=await deferredPrompt.userChoice;deferredPrompt=null;toast(choice.outcome==='accepted'?'Instalasi PWA dimulai.':'Instalasi dibatalkan.');return}toast('Gunakan menu Chrome/Edge ⋮ → Install page as app. Di Android pilih Add to Home Screen.');}
function network(){const n=navigator.onLine;$('networkText').textContent=n?'Online':'Offline · hanya halaman pembuka';}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;toast('People Data Center berhasil diinstal.')});
window.addEventListener('online',network);window.addEventListener('offline',network);
document.querySelectorAll('[data-go]').forEach(e=>e.addEventListener('click',()=>go(e.dataset.go)));
document.querySelectorAll('[data-open]').forEach(e=>e.addEventListener('click',open));
$('saveUrl').addEventListener('click',save);$('clearUrl').addEventListener('click',clear);
$('openMain').addEventListener('click',open);$('installMain').addEventListener('click',install);$('installPanel').addEventListener('click',install);
$('webappUrl').addEventListener('keydown',e=>{if(e.key==='Enter')save()});
status();network();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(()=>{}));
})();