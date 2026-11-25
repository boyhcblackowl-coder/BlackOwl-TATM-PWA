(()=>{'use strict';
const methods=new Set(['getBootstrap','saveImport','setEmployeeValidation','getContractTracking','saveContractFollowUp']);
const config=window.PDC_CONFIG||{};
async function callApi(method,args){
 if(!methods.has(method))throw Error('Metode API tidak diizinkan.');
 const token=await window.PDCAuth.waitForToken();
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
 try{
  const res=await fetch(config.apiUrl,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token,method,args})});
  let body;try{body=await res.json()}catch{throw Error('Respons API tidak valid. Periksa deployment Worker dan Apps Script.');}
  if(!res.ok||!body.ok)throw Error(body.error||'Permintaan data gagal.');
  return body.result;
 }catch(error){if(error.name==='AbortError')throw Error('Koneksi API melewati batas waktu. Periksa jaringan.');throw error;}finally{clearTimeout(timer)}
}
function chain(){let success=()=>{},failure=()=>{};const runner={
 withSuccessHandler(fn){success=typeof fn==='function'?fn:success;return runner;},
 withFailureHandler(fn){failure=typeof fn==='function'?fn:failure;return runner;}
 };for(const method of methods){runner[method]=(...args)=>{callApi(method,args).then(success).catch(error=>{console.error('[PDC API]',method,error);failure(error);});};}return runner;}
const g=window.google=window.google||{};g.script=g.script||{};
Object.defineProperty(g.script,'run',{configurable:true,get(){return chain()}});
})();