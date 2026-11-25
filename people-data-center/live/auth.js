(()=>{'use strict';
let idToken='';let expiry=0;let pending=[];let timer=null;
const config=window.PDC_CONFIG||{};
const $=id=>document.getElementById(id);
function show(message){$('pdcAuth').hidden=false;if(message){$('pdcAuthMessage').hidden=false;$('pdcAuthMessage').textContent=message}else{$('pdcAuthMessage').hidden=true;}}
function fail(error){const jobs=pending.splice(0);jobs.forEach(j=>j.reject(Error(error)));show(error)}
function parseJwtExpiry(token){try{let p=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const obj=JSON.parse(atob(p));return Number(obj.exp||0)*1000}catch{return 0}}
function onCredential(response){if(!response?.credential)return fail('Login Google belum menghasilkan token.');idToken=response.credential;expiry=parseJwtExpiry(idToken);if(expiry<Date.now()+60000)return fail('Token Google sudah kedaluwarsa. Silakan masuk kembali.');$('pdcAuth').hidden=true;$('pdcUserBar').hidden=false;try{const payload=JSON.parse(atob(response.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));$('pdcEmail').textContent=String(payload.email||'Pengguna Google')}catch{$('pdcEmail').textContent='Pengguna Google'}const jobs=pending.splice(0);jobs.forEach(j=>j.resolve(idToken));}
function waitForToken(){if(idToken&&expiry>Date.now()+60000)return Promise.resolve(idToken);idToken='';show('Silakan masuk dengan Google untuk membuka database.');return new Promise((resolve,reject)=>pending.push({resolve,reject}));}
function logout(){idToken='';expiry=0;$('pdcUserBar').hidden=true;window.google?.accounts?.id?.disableAutoSelect?.();show('Anda telah keluar. Muat ulang halaman setelah masuk kembali.');window.location.reload();}
function initialize(){if(!config.oauthClientId||config.oauthClientId.includes('REPLACE_WITH')||!config.apiUrl||config.apiUrl.includes('REPLACE_WITH')){fail('Konfigurasi API belum diaktifkan oleh Admin.\nLengkapi OAuth Client ID dan URL Cloudflare Worker pada live/config.js.');return;}
 if(!/^https:\/\//.test(config.apiUrl)){fail('URL backend harus HTTPS.');return;}
 if(!window.google?.accounts?.id){fail('Google Sign-In belum dapat dimuat. Periksa internet atau pemblokir script.');return;}
 try{window.google.accounts.id.initialize({client_id:config.oauthClientId,callback:onCredential,auto_select:false});window.google.accounts.id.renderButton($('googleButton'),{type:'standard',theme:'filled_black',size:'large',text:'signin_with',shape:'pill',width:300});$('retryGoogle').addEventListener('click',()=>window.google.accounts.id.prompt());show('Silakan pilih akun Google yang diizinkan.');}catch(err){fail('Gagal mengaktifkan login Google: '+err.message)}}
function boot(){let checks=0;const t=setInterval(()=>{if(window.google?.accounts?.id){clearInterval(t);initialize();return}if(++checks>=60){clearInterval(t);initialize()}},200)}
$('pdcLogout').addEventListener('click',logout);$('retryGoogle').addEventListener('click',()=>{if(window.google?.accounts?.id)window.google.accounts.id.prompt();else window.location.reload()});
window.PDCAuth={waitForToken,show,logout};boot();
})();