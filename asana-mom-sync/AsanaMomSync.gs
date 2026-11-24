/**
 * BLACK OWL — Weekly MoM Asana -> private Google Sheets sync
 * Copy into an existing ADMIN-OWNED Apps Script project.
 * Never publish Asana access tokens in GitHub, frontend JS or Sheets.
 *
 * Prerequisite Script Property: TATM_ASANA_TOKEN = Asana PAT
 * Source task: 1210517627492639
 * Destination: existing Program Planner & Notes > Weekly_MoM
 */
const BO_MOM_ASANA_TASK = '1210517627492639';
const BO_MOM_SHEET_ID = '1xVJcCsnjubEIq8Sy9FcTp7wQV_i_pNnqfMab_Rpcq18';
const BO_MOM_TAB = 'Weekly_MoM';
const BO_MOM_TASK_URL = 'https://app.asana.com/1/1184897653019384/project/1203625569754693/task/1210517627492639?focus=true';

function boMomExtractDate_(text, createdAt) {
  const months = {januari:'01',februari:'02',maret:'03',april:'04',mei:'05',juni:'06',juli:'07',agustus:'08',september:'09',oktober:'10',november:'11',desember:'12'};
  const match = String(text || '').slice(0, 240).match(/(?:MoM\s+)?(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(20\d{2})/i);
  return match ? match[3] + '-' + months[match[2].toLowerCase()] + '-' + ('0' + match[1]).slice(-2) : String(createdAt || '').slice(0, 10);
}

function boMomGetAsanaComments_() {
  const token = PropertiesService.getScriptProperties().getProperty('TATM_ASANA_TOKEN');
  if (!token) throw new Error('Set Script Property TATM_ASANA_TOKEN menggunakan Asana Personal Access Token milik admin.');
  let offset = null;
  const comments = [];
  const offsets = {};
  for (let page = 0; page < 20; page++) {
    const args = [
      'limit=100',
      'opt_fields=gid,resource_subtype,text,created_at,created_by.name'
    ];
    if (offset) args.push('offset=' + encodeURIComponent(offset));
    const url = 'https://app.asana.com/api/1.0/tasks/' + BO_MOM_ASANA_TASK + '/stories?' + args.join('&');
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {Authorization: 'Bearer ' + token, Accept: 'application/json'},
      muteHttpExceptions: true
    });
    const status = response.getResponseCode();
    if (status < 200 || status >= 300) {
      throw new Error('Asana API ' + status + ': ' + response.getContentText().slice(0, 250));
    }
    const body = JSON.parse(response.getContentText());
    for (const story of (body.data || [])) {
      const type = String(story.resource_subtype || '');
      if (type && type !== 'comment_added') continue;
      if (!story.gid || !story.text || !String(story.text).trim()) continue;
      comments.push(story);
    }
    const next = body.next_page && body.next_page.offset;
    if (!next) return comments;
    if (offsets[next]) throw new Error('Offset pagination Asana berulang, sinkronisasi dibatalkan.');
    offsets[next] = true; offset = next;
  }
  throw new Error('Batas pagination tercapai; data tidak diubah agar tidak menghapus arsip lama.');
}

function syncBlackOwlWeeklyMom() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('Sinkronisasi lain masih berjalan.');
  try {
    const stories = boMomGetAsanaComments_();
    if (!stories.length) throw new Error('Asana tidak mengembalikan komentar; database tidak diubah.');
    stories.sort((a,b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    const ss = SpreadsheetApp.openById(BO_MOM_SHEET_ID);
    const sh = ss.getSheetByName(BO_MOM_TAB);
    if (!sh) throw new Error('Tab Weekly_MoM tidak ada. Periksa spreadsheet Program Planner & Notes.');
    const headers = ['Story ID','Meeting Date','Created At','Author','Title','Content','Source URL','Synced At'];
    const now = new Date().toISOString();
    const rows = stories.map(story => {
      const date = boMomExtractDate_(story.text, story.created_at);
      return [String(story.gid), date, String(story.created_at || ''),
        String((story.created_by && story.created_by.name) || 'TA & TM'),
        'Weekly MoM • ' + date, String(story.text), BO_MOM_TASK_URL, now];
    });
    // Protect against Apps Script and Sheets cell size limits; never silently truncate minutes.
    if (rows.some(row => row[5].length > 49000)) throw new Error('Ada komentar melebihi batas 49.000 karakter. Perlu desain multi-row sebelum sync.');
    const oldLast = sh.getLastRow();
    if (sh.getMaxRows() < rows.length + 1) sh.insertRowsAfter(sh.getMaxRows(), rows.length + 1 - sh.getMaxRows());
    sh.getRange(1,1,1,8).setValues([headers]);
    sh.getRange(2,1,rows.length,8).setValues(rows);
    if (oldLast > rows.length + 1) sh.getRange(rows.length+2,1,oldLast-rows.length-1,8).clearContent();
    sh.setFrozenRows(1);
    Logger.log('Weekly MoM synched: '+rows.length+' comments | newest: '+rows[0][1]);
    return {count:rows.length, newest:rows[0][1], sheet:ss.getUrl()};
  } finally {
    lock.releaseLock();
  }
}

function installBlackOwlWeeklyMomSync() {
  const summary = syncBlackOwlWeeklyMom();
  // Only this named trigger is replaced, other project triggers remain untouched.
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncBlackOwlWeeklyMom')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncBlackOwlWeeklyMom').timeBased().everyMinutes(30).create();
  Logger.log('Automatic sync installed: every 30 minutes.');
  return summary;
}
