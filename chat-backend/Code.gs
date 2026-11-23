/**
 * BLACK OWL — TA & TM Team Chat
 * Independent Google Apps Script project. No secrets in GitHub.
 * Execute as "User accessing the web app" + authorized Google emails.
 */
const CHAT_SHEET_PROPERTY = 'BO_TEAM_CHAT_SHEET_ID';
const CHAT_ALLOW_PROPERTY = 'BO_CHAT_ALLOWED_EMAILS';
const CHAT_TAB_NAME = 'ChatMessages';

function setupTeamChat() {
  const props = PropertiesService.getScriptProperties();
  const existing = props.getProperty(CHAT_SHEET_PROPERTY);
  const ss = existing ? SpreadsheetApp.openById(existing) : SpreadsheetApp.create('BLACK OWL | TA & TM — Team Chat');
  if (!existing) props.setProperty(CHAT_SHEET_PROPERTY, ss.getId());
  let tab = ss.getSheetByName(CHAT_TAB_NAME);
  if (!tab) tab = ss.insertSheet(CHAT_TAB_NAME);
  if (tab.getLastRow() === 0) {
    tab.appendRow(['MessageID','CreatedAt','SenderEmail','SenderName','Message']);
    tab.setFrozenRows(1);
  }
  Logger.log('Chat database: ' + ss.getUrl());
  Logger.log('Share this Sheet with authorized users as Editor, and set BO_CHAT_ALLOWED_EMAILS in Script Properties.');
  return ss.getUrl();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BLACK OWL — TA & TM Team Chat')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function chatActor_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) throw new Error('Email akun Google tidak terbaca. Deploy dengan Execute as: User accessing the web app.');
  const allowed = String(PropertiesService.getScriptProperties().getProperty(CHAT_ALLOW_PROPERTY) || '')
    .split(/[,;\n]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!allowed.length) throw new Error('BO_CHAT_ALLOWED_EMAILS belum dikonfigurasi oleh administrator.');
  if (!allowed.includes(email)) throw new Error('Akun ' + email + ' belum diizinkan menggunakan Team Chat.');
  const name = email.split('@')[0].replace(/[._-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()).slice(0,60);
  return {email:email, name:name};
}
function chatSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(CHAT_SHEET_PROPERTY);
  if (!id) throw new Error('Database chat belum dibuat. Jalankan setupTeamChat().');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(CHAT_TAB_NAME);
  if (!sheet) throw new Error('Tab ChatMessages tidak ditemukan.');
  return sheet;
}
function getTeamChatMessages() {
  const actor=chatActor_();
  const sheet=chatSheet_();
  const total=Math.max(0,sheet.getLastRow()-1);
  if (!total) return {viewer:actor,messages:[],checkedAt:new Date().toISOString()};
  const take=Math.min(80,total);
  const rows=sheet.getRange(total-take+2,1,take,5).getValues();
  return {viewer:actor, messages:rows.map(r=>({
    id:String(r[0]||''),
    at:r[1] instanceof Date?r[1].toISOString():String(r[1]||''),
    senderEmail:String(r[2]||'').toLowerCase(),
    senderName:String(r[3]||'Tim'),
    text:String(r[4]||'')
  })),checkedAt:new Date().toISOString()};
}
function sendTeamChatMessage(message) {
  const actor=chatActor_();
  const text=String(message==null?'':message).trim();
  if (!text) throw new Error('Pesan tidak boleh kosong.');
  if (text.length>1500) throw new Error('Panjang pesan maksimal 1.500 karakter.');
  const cache=CacheService.getScriptCache();
  const key='bo-team-chat-'+Utilities.base64EncodeWebSafe(actor.email).slice(0,70);
  if (cache.get(key)) throw new Error('Pengiriman terlalu cepat. Coba beberapa detik lagi.');
  const lock=LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Chat sedang sibuk. Coba kembali.');
  try {
    const sh=chatSheet_();
    const id=Utilities.getUuid();
    sh.appendRow([id,new Date(),actor.email,actor.name,text]);
    cache.put(key,'1',3);
    return {ok:true,id:id};
  } finally {lock.releaseLock();}
}
function testTeamChat() {
  const me=chatActor_();
  const sh=chatSheet_();
  Logger.log(JSON.stringify({actor:me.email,rows:sh.getLastRow(),sheet:sh.getName()}));
}
