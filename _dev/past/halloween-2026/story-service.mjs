import {randomUUID} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {transition} from '../../../past/halloween 2026/logic.js';

const ledger = new URL('.preview-ledger.json', import.meta.url);
let stored = [];
try {
  stored = JSON.parse(await readFile(ledger, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') console.warn('Could not load the local Halloween preview ledger.');
}
const sessions = new Map(stored);
let saving = Promise.resolve();

export async function storyRequest(req, res, url) {
  function send(code, data) {
    res.writeHead(code, {'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify(data));
  }
  if (!['127.0.0.1','localhost'].includes(url.hostname)) return send(403,{error:'Loopback only'});
  let sid = req.headers.cookie?.match(/midnightDev=([a-z0-9-]+)/)?.[1];
  if (!sessions.has(sid)) {
    sid = randomUUID();
    sessions.set(sid, {stage:0, endings:[]});
    res.setHeader('Set-Cookie', 'midnightDev=' + sid + '; HttpOnly; SameSite=Strict; Path=/');
  }
  const session = sessions.get(sid);
  if (url.pathname === '/__dev/session') return send(200,{development:true,...session});
  if (req.method !== 'POST' || (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host)) {
    return send(403,{error:'Same-origin POST required'});
  }
  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 50000) throw Error('Request too large');
    }
    const {action,payload} = JSON.parse(body);
    const result = action === 'restart'
      ? {stage:0,endings:[],previous:{stage:session.stage,endings:session.endings}}
      : transition(session,action,payload,{released:true});
    Object.assign(session,result);
    saving = saving.catch(() => {}).then(() => writeFile(ledger, JSON.stringify([...sessions])));
    await saving;
    send(200,{...result,development:true});
  } catch (error) {
    send(400,{error:error.message});
  }
}
