import http from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root=fileURLToPath(new URL('.',import.meta.url));let stored=[];try{stored=JSON.parse(await readFile(new URL('.preview-ledger.json',import.meta.url),'utf8'))}catch{}const sessions=new Map(stored);const port=Number(process.env.PORT||4173);
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.md':'text/plain'};
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,`http://127.0.0.1:${port}`);const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
 if(url.pathname.startsWith('/__dev/')){if(!['127.0.0.1','localhost'].includes(url.hostname))return send(403,{error:'Loopback only'});let sid=req.headers.cookie?.match(/midnightDev=([a-z0-9-]+)/)?.[1];if(!sessions.has(sid)){sid=randomUUID();sessions.set(sid,{stage:0,endings:[]});res.setHeader('Set-Cookie',`midnightDev=${sid}; HttpOnly; SameSite=Strict; Path=/`)}const session=sessions.get(sid);
  if(url.pathname==='/__dev/session')return send(200,{development:true,...session});
  if(req.method!=='POST'||(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`))return send(403,{error:'Same-origin POST required'});
  try{let body='';for await(const chunk of req){body+=chunk;if(body.length>50000)throw Error('Request too large')}const {action,payload}=JSON.parse(body);const {transition}=await import('./logic.js');const result=action==='restart'?{stage:0,endings:[],previous:{stage:session.stage,endings:session.endings}}:transition(session,action,payload,{released:true});Object.assign(session,result);await writeFile(new URL('.preview-ledger.json',import.meta.url),JSON.stringify([...sessions]));return send(200,{...result,development:true})}catch(e){return send(400,{error:e.message})}
 }
 try{const rel=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const path=resolve(root,'.'+rel);if(!path.startsWith(root)||rel.includes('/functions/')||rel.includes('/tests/')||rel.includes('/.')||['server.mjs','firestore.rules.fragment','firebase.json','sync-functions.mjs'].includes(rel.slice(1)))return send(403,{error:'Not public'});const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}
});server.listen(port,'127.0.0.1',()=>console.log(`Midnight Arcade local preview: http://127.0.0.1:${port}\nDevelopment story service is local only. Production release stays October 31.`));
