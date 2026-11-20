/** NEXT MOVE · Cloudflare Worker + D1 + Firebase Auth + FCM
 * Secrets : PARENT_EMAIL, FCM_SERVICE_ACCOUNT_JSON
 * Aucune donnée d'enfant ni secret dans le dépôt public.
 */
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8',...extra}});
const now=()=>Date.now();
const id=()=>crypto.randomUUID();
const encoder=new TextEncoder();
const b64u=arr=>btoa(String.fromCharCode(...arr)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const u8=str=>encoder.encode(str);
const decode=part=>JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/')));
function cors(request,env,response){
 const origin=request.headers.get('Origin')||'';
 const accepted=origin===env.APP_ORIGIN;
 const headers=new Headers(response.headers);
 if(accepted){headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin');}
 headers.set('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
 headers.set('Access-Control-Allow-Headers','Authorization,Content-Type');
 headers.set('Cache-Control','no-store');
 return new Response(response.body,{status:response.status,headers});
}
let jwkCache={at:0,keys:[]};
async function verifyFirebase(jwt,env){
 if(!jwt)throw Error('AUTH_REQUIRED');
 const parts=jwt.split('.'); if(parts.length!==3)throw Error('INVALID_TOKEN');
 const head=decode(parts[0]),payload=decode(parts[1]);
 if(head.alg!=='RS256'||!head.kid)throw Error('INVALID_TOKEN');
 const t=Date.now()/1000;
 if(payload.aud!==env.FIREBASE_PROJECT_ID||payload.iss!==`https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`||!payload.sub||payload.exp<=t||payload.iat>t+60)throw Error('INVALID_TOKEN');
 if(Date.now()-jwkCache.at>1800000){
  const res=await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  if(!res.ok)throw Error('AUTH_KEYS_UNAVAILABLE');
  jwkCache={keys:(await res.json()).keys,at:Date.now()};
 }
 const jwk=jwkCache.keys.find(k=>k.kid===head.kid); if(!jwk)throw Error('INVALID_TOKEN');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const signature=Uint8Array.from(atob(parts[2].replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,signature,u8(parts[0]+'.'+parts[1])))throw Error('INVALID_TOKEN');
 return payload;
}
async function sha(s){return b64u(new Uint8Array(await crypto.subtle.digest('SHA-256',u8(s))));}
async function identity(req,env){
 const token=(req.headers.get('Authorization')||'').replace(/^Bearer /,'');
 const claims=await verifyFirebase(token,env);
 const admin=claims.email_verified===true&&claims.email?.toLowerCase()===env.PARENT_EMAIL?.toLowerCase()&&claims.firebase?.sign_in_provider==='google.com';
 let parent=admin?claims.sub:null;
 if(!admin){const row=await env.DB.prepare('SELECT parent_uid FROM families WHERE child_uid=?').bind(claims.sub).first();parent=row?.parent_uid||null;}
 return {uid:claims.sub,admin,parent,claims};
}
function requireAdmin(auth){if(!auth.admin)throw Error('PARENT_ONLY');}
function requirePaired(auth){if(!auth.parent)throw Error('NOT_PAIRED');}
async function family(env,parent){return env.DB.prepare('SELECT * FROM families WHERE parent_uid=?').bind(parent).first();}
async function plannedTasks(env,state,parent,day){
 const tasks=currentTasks(state,day);
 // Missions non terminées : report au lendemain (carry), ou maintien jusqu'à 7 jours (keep).
 const possible=(state.tasks||[]).filter(t=>t.enabled!==false&&['carry','keep'].includes(t.carry)&&!tasks.some(x=>x.id===t.id));
 if(possible.length){
  const oldest=new Date(day+'T12:00:00Z');oldest.setUTCDate(oldest.getUTCDate()-7);
  const history=await env.DB.prepare('SELECT task_id,day,status FROM runs WHERE parent_uid=? AND day>=? AND day<?').bind(parent,oldest.toISOString().slice(0,10),day).all();
  for(const t of possible){const limit=t.carry==='keep'?7:1;
   for(let back=1;back<=limit;back++){
    const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-back);const earlier=date.toISOString().slice(0,10);
    if(!currentTasks(state,earlier).some(x=>x.id===t.id))continue;
    const run=(history.results||[]).find(x=>x.task_id===t.id&&x.day===earlier);
    if(!run||run.status==='rejected'){tasks.push({...t,carriedFrom:earlier});break}
   }
  }
 }
 const row=await env.DB.prepare('SELECT plan_json FROM day_plans WHERE parent_uid=? AND day=?').bind(parent,day).first();const plan=parse(row?.plan_json,'{}');
 return tasks.map(t=>({...t,time:!t.locked&&t.priority!==1&&validHH(plan[t.id])?plan[t.id]:t.time}));
}
async function ensureParent(env,auth){
 if(!auth.admin)return;
 await env.DB.prepare('INSERT OR IGNORE INTO families (parent_uid,state_json,updated_at) VALUES (?, ?, ?)').bind(auth.parent,'{}',now()).run();
}
const parse=(v,def)=>{try{return JSON.parse(v)}catch{return def}};
const validDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);
const validHH=s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const maxJson=150000;
const only=(v,allow)=>allow.includes(v)?v:null;
function parisInfo(d=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(p=>[p.type,p.value]));
 const day=`${parts.year}-${parts.month}-${parts.day}`;
 return {day,hh:`${parts.hour}:${parts.minute}`,weekday:new Date(`${day}T12:00:00Z`).getUTCDay()};
}
function activeMode(state,day){return (state.periods||[]).find(p=>p.start<=day&&p.end>=day)?.mode||(new Date(`${day}T12:00:00Z`).getUTCDay()%6===0?'weekend':'school');}
function currentTasks(state,day){
 const mode=activeMode(state,day),weekday=new Date(`${day}T12:00:00Z`).getUTCDay();
 const ex=(state.exceptions||[]).filter(x=>x.day===day);
 return (state.tasks||[]).filter(t=>t.enabled!==false &&(!t.days||t.days.includes(weekday))&&(!t.modes||t.modes.includes(mode))&&!ex.some(x=>x.hideTaskId===t.id)).map(t=>{
  const change=ex.find(x=>x.taskId===t.id);return change?{...t,...change.changes}:t;
 });
}
function isQuiet(state,day,hh){
 const mode=activeMode(state,day),weekday=new Date(`${day}T12:00:00Z`).getUTCDay();
 const blocks=(state.quiet||[]).filter(q=>(!q.modes||q.modes.includes(mode))&&(!q.days||q.days.includes(weekday)));
 return blocks.some(q=>q.start<=q.end?(hh>=q.start&&hh<q.end):(hh>=q.start||hh<q.end));
}
function rewardFor(task,run,previous){
 const duration=Math.max(0,Math.floor((now()-run.started_at)/1000));
 const late=Math.max(0,Math.floor((run.started_at-(run.planned_at||run.started_at))/1000));
 const quick=duration<=Math.max(1,Number(task.minutes)||10)*60;
 const selfStart=late===0;
 // Record bonus only for previous completed runs with measurable durations.
 const record=Boolean(previous?.elapsed_s)&&duration<previous.elapsed_s;
 const v=(name,defaultValue,max)=>Math.max(0,Math.min(max,Number.isFinite(Number(task[name]))?Number(task[name]):defaultValue));
 return {duration,late,quick,selfStart,record,xp:v('xpBase',10,100)+(quick?v('xpSpeed',10,100):0)+(selfStart?v('xpInitiative',15,100):0)+(record?5:0),coins:v('coinsBase',5,50)+(quick?v('coinsSpeed',3,50):0)+(selfStart?v('coinsInitiative',5,50):0)};
}
async function sumWallet(env,parent){
 const r=await env.DB.prepare('SELECT COALESCE(SUM(delta_xp),0) xp,COALESCE(SUM(delta_coins),0) coins FROM ledger WHERE parent_uid=?').bind(parent).first();
 return {xp:r?.xp||0,coins:r?.coins||0};
}
async function credit(env,parent,source,xp,coins,reason){
 await env.DB.prepare('INSERT OR IGNORE INTO ledger (id,parent_uid,source,delta_xp,delta_coins,reason,at) VALUES (?,?,?,?,?,?,?)').bind(id(),parent,source,xp,coins,reason,now()).run();
}
async function api(req,env){
 const url=new URL(req.url),method=req.method;
 if(method==='OPTIONS')return new Response(null,{status:204});
 if(url.pathname==='/health')return json({ok:true,service:'NEXT MOVE API'});
 if(req.headers.get('Origin')!==env.APP_ORIGIN)throw Error('ORIGIN_DENIED');
 const auth=await identity(req,env);
 if(auth.admin)await ensureParent(env,auth);
 const p=url.pathname;
 if(p==='/me'&&method==='GET'){
  requirePaired(auth);const f=await family(env,auth.parent),wallet=await sumWallet(env,auth.parent);
  const [runs,requests,homework,ledger,plans]=await Promise.all([
   env.DB.prepare('SELECT * FROM runs WHERE parent_uid=? ORDER BY day DESC LIMIT 300').bind(auth.parent).all(),
   env.DB.prepare('SELECT * FROM reward_requests WHERE parent_uid=? ORDER BY created_at DESC LIMIT 100').bind(auth.parent).all(),
   env.DB.prepare('SELECT * FROM homework WHERE parent_uid=? ORDER BY day DESC LIMIT 150').bind(auth.parent).all(),
   auth.admin?env.DB.prepare('SELECT * FROM ledger WHERE parent_uid=? ORDER BY at DESC LIMIT 100').bind(auth.parent).all():Promise.resolve({results:[]}),
   env.DB.prepare('SELECT * FROM day_plans WHERE parent_uid=? ORDER BY day DESC LIMIT 21').bind(auth.parent).all()
  ]);
  return json({role:auth.admin?'parent':'child',paired:!!f?.child_uid,config:parse(f.state_json,{}),wallet,runs:runs.results,requests:requests.results,homework:homework.results,ledger:ledger.results,plans:plans.results});
 }
 if(p==='/config'&&method==='PUT'){
  requireAdmin(auth);const raw=await req.text();if(raw.length>maxJson)throw Error('CONFIG_TOO_LARGE');
  const state=JSON.parse(raw);
  if(!Array.isArray(state.tasks)||!Array.isArray(state.rewards)||!Array.isArray(state.quiet))throw Error('INVALID_CONFIG');
  if(state.tasks.length>150||state.rewards.length>60||state.tasks.some(t=>!t.id||!t.title||!validHH(t.time)||!Number.isFinite(Number(t.minutes))||Number(t.minutes)<1))throw Error('INVALID_CONFIG');
  await env.DB.prepare('UPDATE families SET state_json=?,updated_at=? WHERE parent_uid=?').bind(raw,now(),auth.parent).run();
  return json({ok:true});
 }
 if(p==='/pair/create'&&method==='POST'){
  requireAdmin(auth);
  const code=b64u(crypto.getRandomValues(new Uint8Array(9))).toUpperCase();
  await env.DB.prepare('UPDATE families SET pairing_hash=?,pairing_expires=? WHERE parent_uid=?').bind(await sha(code),now()+10*60000,auth.parent).run();
  return json({code,expiresInMinutes:10});
 }
 if(p==='/pair/claim'&&method==='POST'){
  if(auth.admin)throw Error('CHILD_ONLY');
  const attempts=await env.DB.prepare('SELECT * FROM pair_attempts WHERE uid=?').bind(auth.uid).first();
  const bucket=Math.floor(now()/3600000);
  if(attempts?.bucket===bucket&&attempts.attempts>=5)throw Error('TOO_MANY_ATTEMPTS');
  await env.DB.prepare('INSERT INTO pair_attempts(uid,bucket,attempts) VALUES(?,?,1) ON CONFLICT(uid) DO UPDATE SET attempts=CASE WHEN bucket=excluded.bucket THEN attempts+1 ELSE 1 END,bucket=excluded.bucket').bind(auth.uid,bucket).run();
  const body=await req.json(),code=String(body.code||'').trim().toUpperCase();
  const f=await env.DB.prepare('SELECT parent_uid FROM families WHERE pairing_hash=? AND pairing_expires>?').bind(await sha(code),now()).first();
  if(!f)throw Error('INVALID_PAIR_CODE');
  await env.DB.prepare('UPDATE families SET child_uid=?,pairing_hash=NULL,pairing_expires=0 WHERE parent_uid=?').bind(auth.uid,f.parent_uid).run();
  return json({ok:true});
 }
 if(p==='/push-token'&&method==='POST'){
  requirePaired(auth);if(auth.admin)throw Error('CHILD_ONLY');
  const {token}=await req.json();if(typeof token!=='string'||token.length<30||token.length>4000)throw Error('INVALID_TOKEN');
  await env.DB.prepare('INSERT INTO devices(uid,parent_uid,token,updated_at) VALUES(?,?,?,?) ON CONFLICT(uid) DO UPDATE SET token=excluded.token,updated_at=excluded.updated_at').bind(auth.uid,auth.parent,token,now()).run();
  return json({ok:true});
 }
 if(p==='/homework'&&method==='POST'){
  requirePaired(auth);const h=await req.json();
  if(!h.subject||String(h.subject).length>50||String(h.details||'').length>1000||!validDay(h.day)||Number(h.estimate)<1||Number(h.estimate)>240)throw Error('INVALID_HOMEWORK');
  const identifier=id();await env.DB.prepare('INSERT INTO homework(id,parent_uid,subject,details,due,estimate,day,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(identifier,auth.parent,String(h.subject),String(h.details||''),h.due||h.day,Math.floor(Number(h.estimate)),h.day,now()).run();
  return json({ok:true,id:identifier});
 }
 if(p==='/homework/delete'&&method==='POST'){
  requirePaired(auth);const {id:hw}=await req.json();
  await env.DB.prepare('DELETE FROM homework WHERE parent_uid=? AND id=?').bind(auth.parent,hw).run();return json({ok:true});
 }
 if(p==='/plan/set'&&method==='POST'){
  requirePaired(auth);const {day,plan}=await req.json();
  if(!validDay(day)||day!==parisInfo().day||!plan||typeof plan!=='object'||Array.isArray(plan)||Object.keys(plan).length>100)throw Error('INVALID_PLAN');
  const state=parse((await family(env,auth.parent)).state_json,{});
  if(!auth.admin&&Number(state.rankMode||1)<2)throw Error('NOT_YET_AUTONOMOUS');
  const available=currentTasks(state,day);
  for(const [taskId,time] of Object.entries(plan)){
   const t=available.find(x=>x.id===taskId);
   if(!t||t.locked||t.priority===1||!validHH(time)||(t.deadline&&time>t.deadline))throw Error('FORBIDDEN_PLAN_CHANGE');
  }
  await env.DB.prepare('INSERT INTO day_plans(parent_uid,day,plan_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(parent_uid,day) DO UPDATE SET plan_json=excluded.plan_json,updated_at=excluded.updated_at').bind(auth.parent,day,JSON.stringify(plan),now()).run();
  return json({ok:true});
 }
 if(p==='/customize'&&method==='POST'){
  requirePaired(auth);const {kind,value}=await req.json();
  const options={avatar:{'🚀':1,'🦾':3,'🥷':5,'🛸':7,'👑':10,'🐉':15},frame:{neon:1,plasma:4,legendary:10},title:{'Recrue':1,'Sprinter':3,'Stratège':6,'Légende':12}};
  if(!options[kind]||!Object.hasOwn(options[kind],value))throw Error('INVALID_CUSTOMIZATION');
  const w=await sumWallet(env,auth.parent);let level=1;while(w.xp>=level*level*100)level++;
  if(level<options[kind][value])throw Error('LEVEL_REQUIRED');
  const state=parse((await family(env,auth.parent)).state_json,{});
  state[kind]=value;
  await env.DB.prepare('UPDATE families SET state_json=?,updated_at=? WHERE parent_uid=?').bind(JSON.stringify(state),now(),auth.parent).run();
  return json({ok:true});
 }
 if(p==='/run/start'&&method==='POST'){
  requirePaired(auth);if(auth.admin)throw Error('CHILD_ONLY');
  const {taskId,day}=await req.json(),local=parisInfo();
  if(!validDay(day)||day!==local.day)throw Error('ONLY_TODAY');
  const f=await family(env,auth.parent),config=parse(f.state_json,{});
  const task=(await plannedTasks(env,config,auth.parent,day)).find(x=>x.id===taskId);
  const h=await env.DB.prepare('SELECT * FROM homework WHERE parent_uid=? AND id=? AND day=?').bind(auth.parent,taskId,day).first();
  if(!task&&!h)throw Error('TASK_NOT_FOUND');
  const planned=task?day+'T'+task.time+':00':'',mins=task?task.minutes:h.estimate;
  const plannedAt=task?Math.max(0,new Date(planned+'+01:00').getTime()):now(); // corrected local offset below
  const exact=task?parisTimestamp(day,task.time):plannedAt;
  if(task&&exact-now()>30*60000)throw Error('TOO_EARLY');
  const runId=id();
  await env.DB.prepare('INSERT OR IGNORE INTO runs(id,parent_uid,task_id,day,planned_at,started_at,validation) VALUES(?,?,?,?,?,?,?)').bind(runId,auth.parent,taskId,day,exact,now(),task?.validation||'parent').run();
  const run=await env.DB.prepare('SELECT * FROM runs WHERE parent_uid=? AND task_id=? AND day=?').bind(auth.parent,taskId,day).first();
  return json({ok:true,run});
 }
 if(p==='/run/offline'&&method==='POST'){
  requirePaired(auth);if(auth.admin)throw Error('CHILD_ONLY');
  const {taskId,day,startedAt,finishedAt}=await req.json();
  if(!validDay(day)||typeof taskId!=='string'||!Number.isFinite(startedAt)||!Number.isFinite(finishedAt)||finishedAt<=startedAt||finishedAt-startedAt>4*3600000||Math.abs(now()-finishedAt)>14*86400000)throw Error('INVALID_OFFLINE_RUN');
  const f=await family(env,auth.parent),state=parse(f.state_json,{}),task=(state.tasks||[]).find(x=>x.id===taskId);
  if(!task)throw Error('TASK_NOT_FOUND');
  const elapsed=Math.floor((finishedAt-startedAt)/1000),late=Math.max(0,Math.floor((startedAt-parisTimestamp(day,task.time))/1000));
  const quick=elapsed<=task.minutes*60, v=(k,d,m)=>Math.max(0,Math.min(m,Number.isFinite(Number(task[k]))?Number(task[k]):d));
  const xp=v('xpBase',10,100)+(quick?v('xpSpeed',10,100):0)+(late===0?v('xpInitiative',15,100):0),coins=v('coinsBase',5,50)+(quick?v('coinsSpeed',3,50):0)+(late===0?v('coinsInitiative',5,50):0);
  const existing=await env.DB.prepare('SELECT * FROM runs WHERE parent_uid=? AND task_id=? AND day=?').bind(auth.parent,taskId,day).first();
  if(existing){
   if(existing.status!=='running')throw Error('ALREADY_CLOSED');
   const confirmedStart=existing.started_at,elapsedServer=Math.floor((finishedAt-confirmedStart)/1000);
   if(elapsedServer<=0||elapsedServer>4*3600)throw Error('INVALID_OFFLINE_TIME');
   // Bilan annoncé par l'enfant : le parent doit vérifier avant toute attribution.
   await env.DB.prepare("UPDATE runs SET finished_at=?,elapsed_s=?,late_s=?,xp=?,coins=?,status='pending_parent',validation='offline' WHERE id=? AND status='running'")
    .bind(finishedAt,elapsedServer,Math.max(0,Math.floor((confirmedStart-(existing.planned_at||confirmedStart))/1000)),xp,coins,existing.id).run();
  }else{
   await env.DB.prepare('INSERT OR IGNORE INTO runs(id,parent_uid,task_id,day,planned_at,started_at,finished_at,elapsed_s,late_s,xp,coins,status,validation) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id(),auth.parent,taskId,day,parisTimestamp(day,task.time),startedAt,finishedAt,elapsed,late,xp,coins,'pending_parent','offline').run();
  }
  return json({ok:true,pendingParent:true});
 }
 if(p==='/run/finish'&&method==='POST'){
  requirePaired(auth);if(auth.admin)throw Error('CHILD_ONLY');
  const {taskId,day}=await req.json();if(!validDay(day))throw Error('INVALID_DAY');
  const run=await env.DB.prepare('SELECT * FROM runs WHERE parent_uid=? AND task_id=? AND day=?').bind(auth.parent,taskId,day).first();
  if(!run||run.status!=='running')throw Error('RUN_NOT_RUNNING');
  const f=await family(env,auth.parent),config=parse(f.state_json,{}),task=(config.tasks||[]).find(t=>t.id===taskId);
  const hw=!task?await env.DB.prepare('SELECT * FROM homework WHERE parent_uid=? AND id=?').bind(auth.parent,taskId).first():null;
  if(!task&&!hw)throw Error('TASK_NOT_FOUND');
  const previous=await env.DB.prepare("SELECT elapsed_s FROM runs WHERE parent_uid=? AND task_id=? AND status='complete' AND elapsed_s>0 ORDER BY elapsed_s ASC LIMIT 1").bind(auth.parent,taskId).first();
  const points=rewardFor(task||{minutes:hw.estimate},run,previous),status=run.validation==='parent'?'pending_parent':'complete';
  const res=await env.DB.prepare("UPDATE runs SET finished_at=?,elapsed_s=?,late_s=?,xp=?,coins=?,status=? WHERE id=? AND status='running'").bind(now(),points.duration,points.late,points.xp,points.coins,status,run.id).run();
  if(res.meta?.changes&&status==='complete')await credit(env,auth.parent,'run:'+run.id,points.xp,points.coins,'Mission terminée');
  if(hw)await env.DB.prepare('UPDATE homework SET done=1 WHERE parent_uid=? AND id=?').bind(auth.parent,hw.id).run();
  return json({ok:true,status,points});
 }
 if(p==='/run/approve'&&method==='POST'){
  requireAdmin(auth);const {id:runId,approve}=await req.json();
  const run=await env.DB.prepare('SELECT * FROM runs WHERE parent_uid=? AND id=?').bind(auth.parent,runId).first();
  if(!run||run.status!=='pending_parent')throw Error('NOT_PENDING');
  await env.DB.prepare("UPDATE runs SET status=? WHERE id=? AND status='pending_parent'").bind(approve?'complete':'rejected',runId).run();
  if(approve)await credit(env,auth.parent,'run:'+runId,run.xp,run.coins,'Mission approuvée');
  return json({ok:true});
 }
 if(p==='/reward/request'&&method==='POST'){
  requirePaired(auth);if(auth.admin)throw Error('CHILD_ONLY');
  const {rewardId}=await req.json(),f=await family(env,auth.parent),config=parse(f.state_json,{});
  const reward=(config.rewards||[]).find(r=>r.id===rewardId&&r.active!==false);
  if(!reward)throw Error('REWARD_NOT_FOUND');
  const wallet=await sumWallet(env,auth.parent);if(wallet.coins<reward.cost)throw Error('NOT_ENOUGH_COINS');
  await env.DB.prepare('INSERT INTO reward_requests(id,parent_uid,reward_id,cost,created_at) VALUES(?,?,?,?,?)').bind(id(),auth.parent,rewardId,reward.cost,now()).run();
  return json({ok:true});
 }
 if(p==='/reward/resolve'&&method==='POST'){
  requireAdmin(auth);const {requestId,approve}=await req.json();
  const r=await env.DB.prepare('SELECT * FROM reward_requests WHERE id=? AND parent_uid=?').bind(requestId,auth.parent).first();
  if(!r||r.status!=='pending')throw Error('NOT_PENDING');
  if(approve){const w=await sumWallet(env,auth.parent);if(w.coins<r.cost)throw Error('NOT_ENOUGH_COINS');}
  await env.DB.prepare("UPDATE reward_requests SET status=?,resolved_at=? WHERE id=? AND status='pending'").bind(approve?'approved':'rejected',now(),requestId).run();
  if(approve)await credit(env,auth.parent,'redeem:'+requestId,0,-r.cost,'Récompense approuvée');
  return json({ok:true});
 }
 if(p==='/challenge/award'&&method==='POST'){
  requireAdmin(auth);const {challengeId,day}=await req.json();
  if(!validDay(day))throw Error('INVALID_DAY');
  const state=parse((await family(env,auth.parent)).state_json,{}),challenge=(state.customChallenges||[]).find(c=>c.id===challengeId);
  if(!challenge)throw Error('CHALLENGE_NOT_FOUND');
  const coins=Math.max(0,Math.min(1000,Math.floor(Number(challenge.coins)||0)));
  await credit(env,auth.parent,'challenge:'+challengeId+':'+day,0,coins,'Défi parental approuvé');
  return json({ok:true,coins});
 }
 if(p==='/penalty'&&method==='POST'){
  requireAdmin(auth);const {taskId,day,coins}=await req.json(),amount=Math.floor(Number(coins));
  if(!taskId||!validDay(day)||!Number.isFinite(amount)||amount<1||amount>20)throw Error('INVALID_PENALTY');
  const f=await family(env,auth.parent),state=parse(f.state_json,{});
  if(!(state.tasks||[]).find(t=>t.id===taskId))throw Error('TASK_NOT_FOUND');
  const w=await sumWallet(env,auth.parent),value=Math.min(amount,Math.max(0,w.coins));
  if(value>0)await credit(env,auth.parent,`penalty:${taskId}:${day}`,0,-value,'Pénalité confirmée par le parent');
  return json({ok:true,deducted:value});
 }
 throw Error('NOT_FOUND');
}
function parisTimestamp(day,time){
 // Work with the real Paris offset (CET/CEST); handles clock changes for daytime tasks.
 const target=day+' '+time;
 const guess=new Date(`${day}T${time}:00Z`);
 for(let minutes=-120;minutes<=120;minutes+=60){
  const d=new Date(guess.getTime()+minutes*60000),p=parisInfo(d);
  if(p.day+' '+p.hh===target)return d.getTime();
 }
 return guess.getTime();
}
let oauth={token:'',until:0};
async function fcmAccess(env){
 if(oauth.token&&oauth.until>now()+60000)return oauth.token;
 const svc=JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON),keyPem=svc.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
 const priv=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(keyPem),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const iat=Math.floor(now()/1000),payload={iss:svc.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat,exp:iat+3600};
 const prefix=b64u(u8(JSON.stringify({alg:'RS256',typ:'JWT'})))+'.'+b64u(u8(JSON.stringify(payload)));
 const sig=b64u(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',priv,u8(prefix))));
 const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:prefix+'.'+sig})});
 if(!res.ok)throw Error('FCM_OAUTH_FAILED');
 const data=await res.json();oauth={token:data.access_token,until:now()+data.expires_in*1000};return oauth.token;
}
async function sendPush(env,token,task){
 const response=await fetch(`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`,{
  method:'POST',headers:{'Authorization':'Bearer '+await fcmAccess(env),'Content-Type':'application/json'},
  body:JSON.stringify({message:{token,data:{title:'⚡ NEXT MOVE · Défi !',body:`${task.title} : prêt à gagner ton bonus Réactivité ?`,url:env.APP_URL},webpush:{headers:{TTL:'300'}}}})
 });
 if(!response.ok)throw Error('FCM_SEND_'+response.status);
}
async function scheduled(env){
 const local=parisInfo(),families=await env.DB.prepare('SELECT * FROM families WHERE child_uid IS NOT NULL').all();
 for(const f of (families.results||[])){
  const state=parse(f.state_json,{});if(isQuiet(state,local.day,local.hh))continue;
  const due=(await plannedTasks(env,state,f.parent_uid,local.day)).filter(t=>t.time===local.hh&&t.notify!==false);
  if(!due.length)continue;
  const device=await env.DB.prepare('SELECT token FROM devices WHERE uid=?').bind(f.child_uid).first();if(!device)continue;
  for(const task of due){
   const run=await env.DB.prepare('SELECT id FROM runs WHERE parent_uid=? AND task_id=? AND day=?').bind(f.parent_uid,task.id,local.day).first();
   if(run)continue;
   const key=f.parent_uid+':'+local.day+':'+task.id;
   const stored=await env.DB.prepare('INSERT OR IGNORE INTO push_sent(key,at) VALUES(?,?)').bind(key,now()).run();
   if(!stored.meta?.changes)continue;
   try{await sendPush(env,device.token,task)}catch(e){console.error('Push failed:',e.message)}
  }
 }
}
export default {
 async fetch(req,env){
  try{return cors(req,env,await api(req,env))}
  catch(err){const msg=err?.message||'SERVER_ERROR';
   const code=msg==='NOT_FOUND'?404:['AUTH_REQUIRED','INVALID_TOKEN'].includes(msg)?401:['PARENT_ONLY','CHILD_ONLY','NOT_PAIRED','ORIGIN_DENIED'].includes(msg)?403:400;
   return cors(req,env,json({error:msg},code));
  }
 },
 async scheduled(controller,env,ctx){ctx.waitUntil(scheduled(env));}
};