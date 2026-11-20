/* NEXT MOVE · PWA locale pour Mahé, interface simplifiée */
(()=>{'use strict';
const cfg=globalThis.NEXT_MOVE_CONFIG||{};
const connected=false; // Mode autonome : aucun service distant nécessaire.
const $=s=>document.querySelector(s);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayNow=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const localTime=()=>new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'}).format(new Date());
const dayOf=s=>new Date(s+'T12:00:00Z').getUTCDay();
const rand=()=>crypto.randomUUID?.()||('nm-'+Date.now()+'-'+Math.random().toString(16).slice(2));
const futureDays=(n)=>{const d=new Date(dayNow()+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const dateLabel=s=>new Date(s+'T12:00:00Z').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
const minutes=s=>{const [h,m]=s.split(':').map(Number);return h*60+m};
const nowMs=()=>Date.now();
const pretty=s=>{s=Math.abs(Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const CATEGORY=['🌅 Routine du matin','🎒 Cartable','📚 Devoirs','🧺 Rangement','🌙 Soir & hygiène','🥋 Sport','🏠 Maison','📖 Lecture & loisirs'];
const categoryList=()=>(data?.config?.categories?.length?data.config.categories:CATEGORY);
const SUBJECTS=['Maths','Français','Histoire-Géo','Anglais','SVT','Physique-Chimie','Technologie','Espagnol','Autre'];
const WEEK=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const task=(id,title,category,time,minutes,days=[1,2,3,4,5],options={})=>({id,title,category,time,minutes,days,modes:['school'],validation:'self',priority:2,carry:'expire',notify:true,enabled:true,locked:false,steps:[],...options});
function defaultConfig(enable=false){return {
 version:1,childName:'Mahé',categories:[...CATEGORY],avatar:'🚀',frame:'neon',title:'Recrue',xpName:'XP',parentPinHint:'',pronoteUrl:cfg.pronoteUrl||'',
 tasks:[
  task('wake','Mission décollage',0,'06:25',10,[1,2,3,4,5],{steps:['Me lever','Faire mon lit'],enabled:enable,priority:1}),
  task('ready','Habillage + dents',0,'06:40',18,[1,2,3,4,5],{steps:['M’habiller','Me laver le visage','Me brosser les dents'],enabled:enable,priority:1}),
  task('bag','Cartable prêt',1,'07:05',12,[1,2,3,4,5],{steps:['Vérifier l’emploi du temps','Mettre mes cahiers','Vérifier la trousse'],validation:'parent',locked:true,enabled:enable,priority:1}),
  task('homework','Planifier les devoirs',2,'17:20',12,[1,2,3,4,5],{steps:['Ouvrir PRONOTE','Choisir les matières','Estimer les durées'],enabled:enable,priority:1}),
  task('room','Rangement express',3,'18:15',12,[1,2,3,4,5,6],{enabled:enable,priority:3,carry:'carry'}),
  task('read','Lecture personnelle',7,'19:00',12,[1,2,3,4,5],{enabled:enable,priority:3}),
  task('night','Préparation du lendemain',4,'20:15',15,[0,1,2,3,4,5,6],{modes:['school','weekend','vacation'],enabled:enable,priority:2}),
  task('sport','Préparer mes affaires de sport',5,'16:45',10,[],{enabled:false,priority:2,steps:['Tenue','Gourde','Affaires nécessaires']})
 ],
 rewards:[
  {id:'gaming',name:'15 min de jeu en plus',cost:80,icon:'🎮',active:true},
  {id:'movie',name:'Choisir le film familial',cost:100,icon:'🎬',active:true},
  {id:'outing',name:'Sortie spéciale',cost:350,icon:'🎟️',active:true},
  {id:'gift',name:'Petit cadeau',cost:220,icon:'🎁',active:true},
  {id:'pocket',name:'Bon d’achat / argent de poche',cost:250,icon:'💳',active:true},
  {id:'privilege',name:'Privilège surprise',cost:160,icon:'🌟',active:true}
 ],
 quiet:[
  {id:'quiet-school',start:'07:30',end:'17:05',days:[1,2,3,4,5],modes:['school']},
  {id:'quiet-night',start:'21:00',end:'06:25',days:[0,1,2,3,4,5,6],modes:['school','vacation','weekend']}
 ],
 periods:[],exceptions:[],customChallenges:[],rankMode:1,
 milestones:{guided:70,autonomous:85},autoChallenges:true
};}
const demoKey='nextmove_demo_v1'; // Conserver cette clé pour préserver les progrès existants
let db=JSON.parse(localStorage.getItem(demoKey)||'null')||{config:defaultConfig(true),runs:[],ledger:[],wallet:{xp:0,coins:0},requests:[],homework:[],plans:[],role:'child'};
db.homeworkDates=Array.isArray(db.homeworkDates)?db.homeworkDates:[];
db.homeworkBlocks=Array.isArray(db.homeworkBlocks)?db.homeworkBlocks:[];
const saveDemo=()=>localStorage.setItem(demoKey,JSON.stringify(db));
let data={role:'child',config:defaultConfig(false),wallet:{xp:0,coins:0},runs:[],requests:[],homework:[],ledger:[],plans:[],paired:false};
let homeworkDraft={items:{},estimate:20,manualEstimate:false};
let auth=null,uid=null,role='child',tab='today',adminTab='stats',pinUnlocked=false,activeDay=dayNow(),selectedRecord=null,online=!!navigator.onLine,serviceWorker=null,initDone=false,renderVersion=0;
const pinKey='nextmove_parent_pin_v1';
const beep=(freq=620,time=.14)=>{if(localStorage.getItem('nm_mute')==='yes')return;try{const A=window.AudioContext||window.webkitAudioContext,a=new A(),o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.001,a.currentTime);g.gain.exponentialRampToValueAtTime(.06,a.currentTime+.018);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+time);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+time);setTimeout(()=>a.close(),500);}catch{}};
const toast=(msg)=>{const el=document.createElement('div');el.className='toast';el.textContent=msg;$('#toast-root').appendChild(el);setTimeout(()=>el.remove(),3500)};
function celebration(title='NOUVEAU DÉFI ACCOMPLI !'){
 beep(880,.18);setTimeout(()=>beep(1160,.24),130);
 toast('🏆 '+title);
 const box=document.createElement('div');box.className='confetti';for(let i=0;i<65;i++){const s=document.createElement('span');s.style.left=Math.random()*100+'%';s.style.background=['#3de9ef','#a07af8','#ffd772','#56e7b6'][i%4];s.style.animationDelay=Math.random()*.6+'s';s.style.transform=`rotate(${Math.random()*180}deg)`;box.appendChild(s);}document.body.appendChild(box);setTimeout(()=>box.remove(),3600);
}
function levelInfo(xp){let n=1;while(xp>=n*n*100)n++;const lo=(n-1)**2*100,hi=n*n*100;return {n,progress:Math.max(0,Math.min(100,100*(xp-lo)/(hi-lo))),current:xp-lo,needed:hi-lo};}

/* Blocs de devoirs : quantité par date, travail anticipé et chrono sans pause. */
function hwDateRows(){return (data.homeworkDates||[]).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.due)&&Number(x.count)>0).sort((a,b)=>a.due.localeCompare(b.due));}
function hwDaysAhead(due,ref=dayNow()){return Math.round((Date.parse(due+'T12:00:00Z')-Date.parse(ref+'T12:00:00Z'))/86400000);}
function hwDateText(due){return new Intl.DateTimeFormat('fr-FR',{weekday:'short',day:'numeric',month:'short'}).format(new Date(due+'T12:00:00Z'));}
function hwSum(items){return items.reduce((sum,x)=>sum+Math.max(0,Number(x.count)||0),0);}
function hwRules(){return {xpPer:8,coinsPer:2,advancePer:2,volumePer:3,...(data.config.homeworkRules||{})};}
function hwReward(items,minutesEstimate,seconds,ref=dayNow()){
 const count=hwSum(items),rules=hwRules();
 const advance=items.reduce((sum,x)=>sum+Math.max(0,Number(x.count)||0)*Math.min(14,Math.max(0,hwDaysAhead(x.due,ref))*Number(rules.advancePer)),0);
 const fast=Number.isFinite(seconds)&&seconds<=minutesEstimate*60;
 const volume=Math.min(36,Math.max(0,count-1)*Number(rules.volumePer));
 return {xp:Math.min(400,count*Number(rules.xpPer)+volume+advance+(fast?Math.min(10,2+count*2):0)),
         coins:Math.min(150,count*Number(rules.coinsPer)+Math.min(12,Math.floor(Math.max(0,count-1)*1.5))+Math.floor(advance/2)+(fast?Math.min(5,1+count):0)),
         count,advance,volume,fast};
}
function hwReserved(due){
 return (data.homeworkBlocks||[]).reduce((n,b)=>{
  const r=runFor(b.id,b.day);
  if(r&&['complete','rejected'].includes(r.status))return n;
  return n+(b.items||[]).filter(x=>x.due===due).reduce((total,x)=>total+Number(x.count||0),0);
 },0);
}
function hwAvailable(due){return Math.max(0,Number(hwDateRows().find(x=>x.due===due)?.count||0)-hwReserved(due));}
function hwSelection(){return hwDateRows().map(x=>({due:x.due,count:Math.min(hwAvailable(x.due),Math.max(0,Number(homeworkDraft.items[x.due])||0))})).filter(x=>x.count>0);}
function hwRefreshDraft(){
 for(const key of Object.keys(homeworkDraft.items))homeworkDraft.items[key]=Math.min(hwAvailable(key),Math.max(0,Number(homeworkDraft.items[key])||0));
 if(!homeworkDraft.manualEstimate)homeworkDraft.estimate=Math.max(5,Math.min(240,hwSum(hwSelection())*15||20));
}
function hwPersist(){saveDemo();data={...db};hwRefreshDraft();render();}
function hwApplyCompleted(run){
 if(run.homeworkApplied||!Array.isArray(run.homeworkActual))return;
 for(const a of run.homeworkActual){
  const item=(db.homeworkDates||[]).find(x=>x.due===a.due);
  if(item)item.count=Math.max(0,Number(item.count||0)-Math.max(0,Number(a.count||0)));
 }
 db.homeworkDates=db.homeworkDates.filter(x=>Number(x.count)>0);
 run.homeworkApplied=true;
}
function hwBlockTask(b){
 const total=hwSum(b.items||[]);
 return {id:b.id,title:'Bloc de '+total+' devoir'+(total>1?'s':''),category:2,time:b.time||'17:20',
  minutes:Number(b.estimate)||20,priority:2,validation:b.validation||'self',homeworkBlock:true,items:b.items,enabled:true,carry:'keep'};
}

function modeFor(s){const periods=data.config.periods||[];return periods.find(x=>x.start<=s&&x.end>=s)?.mode||([0,6].includes(dayOf(s))?'weekend':'school')}
function tasksFor(s){const m=modeFor(s),d=dayOf(s),ex=(data.config.exceptions||[]).filter(x=>x.day===s);
 const plan=JSON.parse((data.plans||[]).find(p=>p.day===s)?.plan_json||'{}');
 const hasHomeworkBlock=(data.homeworkBlocks||[]).some(b=>b.day===s);
 const ordinary=(data.config.tasks||[]).filter(t=>t.enabled!==false&&(t.days||[]).includes(d)&&(t.modes||[]).includes(m)&&!ex.some(x=>x.hideTaskId===t.id)&&!(t.id==='homework'&&hasHomeworkBlock)).map(t=>{const change=ex.find(x=>x.taskId===t.id),alter=change?.changes||{},time=!t.locked&&t.priority!==1&&plan[t.id]?plan[t.id]:(alter.time||t.time);return {...t,...alter,time,...(t.id==='homework'?{title:'Blocs de devoirs',homeworkLauncher:true}: {})}});
 const leftovers=[];
 for(const t of (data.config.tasks||[]).filter(t=>t.enabled!==false&&['carry','keep'].includes(t.carry)&&!ordinary.some(x=>x.id===t.id))){
  const limit=t.carry==='keep'?7:1;
  for(let n=1;n<=limit;n++){
   const previous=futureDate(s,-n),previousMode=modeFor(previous);
   if(!(t.days||[]).includes(dayOf(previous))||!(t.modes||[]).includes(previousMode))continue;
   const prior=data.runs.find(r=>r.task_id===t.id&&r.day===previous);
   if(!prior||prior.status==='rejected'){leftovers.push({...t,carriedFrom:previous});break}
  }
 }
 const homework=(data.homework||[]).filter(h=>h.day===s).map(h=>({id:h.id,title:h.subject,category:2,time:'17:30',minutes:h.estimate,priority:2,validation:'parent',homework:true,description:h.details}));
 const blocks=(data.homeworkBlocks||[]).filter(b=>b.day===s).map(hwBlockTask);
 return [...ordinary,...leftovers.filter(x=>x.id!=='homework'),...homework,...blocks].sort((a,b)=>a.time.localeCompare(b.time)||a.priority-b.priority);
}
const runFor=(taskId,day=activeDay)=>data.runs.find(r=>r.task_id===taskId&&r.day===day);
const isDone=r=>r&&['complete','pending_parent','rejected'].includes(r.status);
const getActive=(s=activeDay)=>{const tasks=tasksFor(s),running=tasks.find(t=>runFor(t.id,s)?.status==='running');if(running)return running;const pending=tasks.filter(t=>!runFor(t.id,s));if(!pending.length)return null;if(s!==dayNow())return pending[0];const now=minutes(localTime());const relevant=pending.filter(t=>minutes(t.time)>=now-90||t.carry==='keep'||t.homeworkLauncher);return relevant.find(t=>minutes(t.time)<=now)||relevant[0]||null;};
function walletBadge(){return `<span class="pill gold">🪙 ${Number(data.wallet.coins)||0}</span><span class="pill cyan">⚡ ${Number(data.wallet.xp)||0} XP</span>`}
function parentGuard(){return role==='parent'&&!pinUnlocked}
function render(){if(!initDone)return;
 const scroll=window.scrollY;
 if(connected&&!data.paired&&role==='child'){renderPairing();return;}
 if(parentGuard()){renderPin();return;}
 const lev=levelInfo(data.wallet.xp),isParent=role==='parent';
 const nav=isParent?[['stats','📊','Bilan'],['tasks','🎯','Missions'],['calendar','📅','Planning'],['rewards','🪙','Boutique'],['settings','⚙️','Réglages']]:[['today','⚡','Mission'],['planning','📅','Journée'],['challenges','🏆','Défis'],['shop','🎁','Cadeaux']];
 const current=isParent?adminTab:tab;
 const header=`<div class="header"><div class="mark"><div class="mark-icon">ϟ</div><div><div class="brand">NEXT MOVE</div></div></div><div class="header-actions">${isParent?'<button class="iconbtn" data-action="switch-child" aria-label="Retour à Mahé" title="Retour">↩</button>':`<button class="iconbtn nm-avatar-button" data-action="tab" data-id="profile" aria-label="Mon profil" title="Mon profil">${escape(data.config.avatar||'🚀')}</button><button class="iconbtn" data-action="parent-entry" aria-label="Réglages parentaux" title="Réglages parentaux">⚙️</button>`}</div></div>`;
 const demo='';
 const page=isParent?renderAdmin():renderChild();
 $('#app').innerHTML=`<main class="app ${isParent?'parent-app':'child-app'}">${header}${demo}${page}</main><nav class="tabs" aria-label="Navigation">${nav.map(([key,icon,label])=>`<button data-action="tab" data-id="${key}" class="${current===key?'active':''}"><span>${icon}</span>${label}</button>`).join('')}</nav>`;
 window.scrollTo({top:scroll,behavior:'instant'});clockTick();
}
function renderChild(){switch(tab){case 'homework':return renderHomework();case 'planning':return renderPlanning();case 'challenges':return renderChallenges();case 'shop':return renderShop();case 'profile':return renderProfile();case 'parent-settings':return renderParentAccess();default:return renderToday();}}
function renderParentAccess(){return `<section class="nm-mission-card nm-empty-screen"><span class="nm-emoji">🔐</span><h1>Réglages parentaux</h1><p>Accès réservé au parent.</p><button class="btn primary block" data-action="parent-entry">Saisir mon code</button></section>`}

function renderHomework(){
 hwRefreshDraft();
 const dates=hwDateRows(),selected=hwSelection(),total=hwSum(selected);
 const reward=hwReward(selected,homeworkDraft.estimate,homeworkDraft.estimate*60);
 const urgent=dates.filter(x=>hwDaysAhead(x.due)<=1&&hwAvailable(x.due)>0);
 const urgentUnselected=urgent.some(x=>(homeworkDraft.items[x.due]||0)===0);
 const running=(data.homeworkBlocks||[]).find(b=>runFor(b.id,b.day)?.status==='running');
 const dateCards=dates.map(row=>{
  const available=hwAvailable(row.due),ahead=hwDaysAhead(row.due);
  const warn=ahead<0?'⚠️ En retard':ahead===0?'Pour aujourd’hui':ahead===1?'Pour demain':ahead+' jours d’avance possibles';
  return `<div class="hw-date-card">
   <div class="hw-date-main"><strong>${escape(hwDateText(row.due))}</strong><span class="hw-status">${warn}</span></div>
   <div class="hw-counter"><button class="hw-compact-btn" data-action="hw-count-minus" data-due="${row.due}" aria-label="Un devoir de moins">−</button><button class="hw-count-num" data-action="hw-edit-count" data-due="${row.due}" title="Modifier le nombre">${row.count}</button><button class="hw-compact-btn" data-action="hw-count-plus" data-due="${row.due}" aria-label="Un devoir de plus">+</button></div>
   ${available<row.count?`<small>${available} disponible${available>1?'s':''} · le reste est déjà réservé</small>`:''}
  </div>`;
 }).join('');
 const pickCards=dates.filter(x=>hwAvailable(x.due)>0).map(row=>{
  const picked=Number(homeworkDraft.items[row.due]||0),max=hwAvailable(row.due);
  return `<div class="hw-pick-row"><div><strong>${escape(hwDateText(row.due))}</strong><small>${hwDaysAhead(row.due)>0?'⭐ +'+Math.min(14,hwDaysAhead(row.due)*Number(hwRules().advancePer))+' XP/devoir d’avance':hwDaysAhead(row.due)===0?'Échéance aujourd’hui':'Échéance dépassée'} · ${max} dispo.</small></div>
   <div class="hw-counter"><button class="hw-compact-btn" data-action="hw-pick-minus" data-due="${row.due}" aria-label="Retirer un devoir">−</button><strong class="hw-count-num">${picked}</strong><button class="hw-compact-btn" data-action="hw-pick-plus" data-due="${row.due}" aria-label="Ajouter un devoir">+</button></div>
  </div>`;
 }).join('');
 const recent=(data.homeworkBlocks||[]).slice(-6).reverse().map(b=>{
  const r=runFor(b.id,b.day),label=r?.status==='complete'?'✅ Terminé':r?.status==='pending_parent'?'⏳ À valider':r?.status==='running'?'⏱️ En cours':r?.status==='rejected'?'↩ Non validé':'📝 Préparé';
  return `<div class="hw-history-row"><span>${escape(hwDateText(b.day))} · ${hwSum(b.items)} devoirs</span><span>${label}</span></div>`;
 }).join('');
 return `<h1 class="nm-page-title">📚 Mes devoirs</h1>
 <div class="hw-hint">1. Regarde PRONOTE, puis note seulement les nombres.</div>
 <section class="hw-panel">
  <div class="hw-heading"><h2>Devoirs restants</h2><span class="hw-accent">${dates.reduce((a,x)=>a+Number(x.count),0)} au total</span></div>
  <div class="hw-dates">${dateCards||'<div class="hw-empty">Ajoute ta première date de devoirs.</div>'}</div>
  <form id="hw-add-date" class="hw-add-form"><div class="field"><label for="hw-new-date">Pour le</label><input id="hw-new-date" type="date" name="due" value="${futureDate(dayNow(),1)}" required></div><div class="field"><label for="hw-new-count">Combien ?</label><input id="hw-new-count" type="number" name="count" min="1" max="60" value="1" required></div><button class="btn primary" type="submit">+ Ajouter</button></form>
 </section>
 <section class="hw-panel hw-compose">
  <div class="hw-heading"><h2>2. Mon bloc</h2><span class="hw-accent">${total} devoir${total>1?'s':''}</span></div>
  ${running?`<div class="hw-running">⏱️ Un bloc est déjà en cours.<button class="btn primary block" data-action="homework-to-mission">Voir mon chrono →</button></div>`:`
  ${pickCards||'<div class="hw-empty">Ajoute des devoirs pour préparer ton bloc.</div>'}
  <div class="hw-estimate"><div><strong>3. Mon objectif de temps</strong><small>Combien de minutes pour ce bloc ?</small></div>
   <div class="hw-counter"><button class="hw-compact-btn" data-action="hw-estimate-minus" aria-label="Cinq minutes de moins">−</button>
    <input id="hw-duration" type="number" min="5" max="240" step="5" inputmode="numeric" value="${homeworkDraft.estimate}" aria-label="Durée estimée en minutes">
    <button class="hw-compact-btn" data-action="hw-estimate-plus" aria-label="Cinq minutes de plus">+</button></div></div>
  ${urgentUnselected?'<div class="hw-urgent">⚠️ Pense aux devoirs à rendre bientôt !</div>':''}
  <div class="hw-reward-preview">🏆 ${reward.xp} XP possibles <span>🪙 ${reward.coins} pièces</span></div>
  <button class="btn primary block hw-launch" data-action="hw-start" ${total===0?'disabled':''}>▶ JE LANCE MON BLOC</button>
  <small class="hw-small">Bonus si tu respectes ton chrono. Aucun gain pour un devoir non terminé.</small>`}
 </section>
 ${recent?`<details class="hw-panel hw-history"><summary>📈 Mes derniers blocs</summary>${recent}</details>`:''}`;
}
function modalHomeworkCount(due){
 const row=hwDateRows().find(x=>x.due===due);if(!row)return;
 openModal(`<h2>📚 Devoirs pour le ${escape(hwDateText(due))}</h2><form id="hw-set-count" data-due="${due}">${field('Nombre restant','count','number',row.count,'min="0" max="60" required')}<p class="helper">Indique le nombre de devoirs encore à faire pour cette date.</p><button class="btn primary block">Enregistrer</button></form>`);
}
function modalHomeworkFinish(taskId){
 const b=(data.homeworkBlocks||[]).find(x=>x.id===taskId);
 if(!b)return toast('Bloc introuvable');
 openModal(`<h2>🏁 Bloc terminé ?</h2><p>Combien de devoirs as-tu vraiment terminés ?</p>
 <form id="hw-finish" data-id="${escape(taskId)}">
 ${(b.items||[]).map(x=>`<div class="hw-pick-row"><strong>${escape(hwDateText(x.due))}</strong><div class="hw-counter"><input type="number" min="0" max="${Number(x.count)}" step="1" name="done-${x.due}" value="${Number(x.count)}" aria-label="Devoirs terminés le ${escape(hwDateText(x.due))}"></div><span class="hw-finish-max">/ ${Number(x.count)}</span></div>`).join('')}
 <button type="submit" class="btn primary block hw-launch">✓ VALIDER MES DEVOIRS</button>
 <p class="helper">Ne compte que les devoirs vraiment terminés. Les autres resteront à faire.</p>
 </form>`);
}

function renderToday(){
 const all=tasksFor(activeDay);
 const finished=all.filter(t=>{const r=runFor(t.id,activeDay);return r&&['complete','pending_parent'].includes(r.status)}).length;
 const mission=getActive();
 const level=levelInfo(data.wallet.xp);
 const today=activeDay===dayNow();
 const name=escape(data.config.childName||'Mahé');
 let hero='';
 if(!mission){
  hero=`<section class="nm-mission-card nm-empty-screen"><span class="nm-emoji">${all.length?'🏆':'🌟'}</span><h1>${all.length?'Tous les défis sont terminés !':'Rien de prévu aujourd’hui'}</h1><p>${all.length?'Bravo, tu as assuré !':'Tu peux profiter de ton temps libre.'}</p><button class="btn primary" data-action="tab" data-id="challenges">Voir mes trophées</button></section>`;
 }else if(mission.homeworkLauncher){
  hero=`<section class="nm-mission-card"><div class="nm-eyebrow"><span class="nm-pulse"></span>MISSION DEVOIRS</div><h1 class="nm-mission-title">📚 Blocs de devoirs</h1><div class="nm-mission-meta">Choisis tes devoirs et ton objectif de temps.</div><div class="nm-timer-stage"><div class="timer" style="font-size:52px">🎯</div></div><button class="btn primary block nm-one-action" data-action="show-homework">PRÉPARER MON BLOC →</button></section>`;
 }else{
  const r=runFor(mission.id,activeDay),running=r?.status==='running';
  const mins=Math.max(1,Number(mission.minutes)||1);
  const category=escape(categoryList()[mission.category]||'🎯 Mission');
  const maxXp=(mission.xpBase??10)+(mission.xpSpeed??10)+(mission.xpInitiative??15)+5;
  const maxCoins=(mission.coinsBase??5)+(mission.coinsSpeed??3)+(mission.coinsInitiative??5);
  hero=`<section class="nm-mission-card">
   <div class="nm-eyebrow"><span class="nm-pulse"></span>${running?'DÉFI EN COURS':'TA PROCHAINE MISSION'}</div>
   <h1 class="nm-mission-title">${escape(mission.title)}</h1>
   <div class="nm-mission-meta"><span>${category}</span><span class="dot">•</span><span>${escape(mission.time)}</span><span class="dot">•</span><span>${mins} min</span></div>
   <div class="nm-timer-stage">
     <div class="timer" id="timer-num" data-task="${escape(mission.id)}">${running?'--:--':pretty(mins*60)}</div>
     <div class="timer-caption" id="timer-caption">${running?'TEMPS RESTANT':'TEMPS POUR RÉUSSIR'}</div>
   </div>
   <div class="progress"><span id="timer-progress" style="width:0%"></span></div>
   ${mission.steps?.length?`<details class="nm-steps"><summary>👀 Voir les ${mission.steps.length} étapes</summary><ul>${mission.steps.map(x=>`<li>${escape(x)}</li>`).join('')}</ul></details>`:''}
   <button class="btn ${running?'success':'primary'} block nm-one-action" data-action="${running?'finish':'start'}" data-id="${escape(mission.id)}">${running?'✓ J’AI TERMINÉ':'▶ JE COMMENCE !'}</button>
   <div class="nm-reward-hint"><span>⚡ Jusqu’à ${maxXp} XP</span><span>🪙 <strong>+${maxCoins}</strong></span></div>
  </section>`;
 }
 return `<div class="nm-topbar"><span class="nm-greeting">Salut ${name} 👋</span><div class="nm-saldo"><span>🪙 ${Number(data.wallet.coins)||0}</span><strong>Niv. ${level.n}</strong></div></div>
 <div class="nm-day-progress"><div class="nm-progress-line"><span>${today?"Aujourd’hui":escape(dateLabel(activeDay))}</span><strong>${finished} / ${all.length} missions</strong></div><div class="progress"><span style="width:${all.length?Math.round(100*finished/all.length):0}%"></span></div></div>
 ${hero}
 <div class="nm-bottom-nav"><button data-action="tab" data-id="planning">📅 Voir toute ma journée <span>→</span></button><button data-action="show-homework">📚 Mes devoirs <span>→</span></button></div>`;
}
function renderMissionList(list,day){
 const someoneRunning=list.some(t=>runFor(t.id,day)?.status==='running');
 return `<div class="nm-simple-list">${list.length?list.map(t=>{
  const r=runFor(t.id,day),status=r?.status||'todo';
  const done=['complete','pending_parent'].includes(status);
  const label=status==='complete'?'✅':status==='pending_parent'?'⏳':status==='running'?'⏱️':status==='rejected'?'↻':'';
  const canStart=day===dayNow()&&!r&&!someoneRunning;
  return `<div class="mission ${done?'completed':''}"><span class="time">${escape(t.time)}</span><div class="info"><strong>${escape(t.title)}</strong><p>${Number(t.minutes)||1} min${status==='running'?' · En cours':status==='pending_parent'?' · À valider':status==='complete'?' · Terminé':t.carriedFrom?' · À rattraper':''}</p></div>${canStart?`<button class="btn mini primary nm-list-action" data-action="start" data-id="${escape(t.id)}">▶</button>`:`<span class="state">${label||'○'}</span>`}</div>`;
 }).join(''):'<div class="empty">Aucun défi ce jour-là.</div>'}</div>`;
}
function renderPlanning(){
 const list=tasksFor(activeDay);
 return `<h1 class="nm-page-title">📅 Ma journée</h1>
 <div class="nm-day-picker"><button class="btn mini" data-action="day-prev" aria-label="Jour précédent">‹</button><strong>${escape(dateLabel(activeDay))}</strong><button class="btn mini" data-action="day-next" aria-label="Jour suivant">›</button></div>
 ${renderMissionList(list,activeDay)}
 <div class="nm-quick-actions"><button class="btn primary block" data-action="show-homework">📚 Préparer un bloc de devoirs →</button></div>
 <details class="nm-planner-tools"><summary>⏱️ Je suis en retard</summary><p>Je peux proposer un nouvel ordre sans déplacer les obligations importantes.</p><button class="btn block" data-action="replan">Réorganiser ma journée</button><div id="replan-result"></div></details>`;
}
const badges=[['⚡','Démarrage éclair',()=>data.runs.some(r=>r.status==='complete'&&r.late_s===0)],['🎯','10 missions',()=>data.runs.filter(r=>r.status==='complete').length>=10],['🏆','50 missions',()=>data.runs.filter(r=>r.status==='complete').length>=50],['🚀','Niveau 5',()=>levelInfo(data.wallet.xp).n>=5],['💎','Niveau 10',()=>levelInfo(data.wallet.xp).n>=10],['⏱️','Chrono dompté',()=>data.runs.filter(r=>r.status==='complete'&&r.elapsed_s<=900).length>=5],['🧠','Autonomie',()=>data.runs.filter(r=>r.late_s===0&&r.status==='complete').length>=20],['📚','Érudit',()=>data.runs.filter(r=>r.task_id.startsWith('hw-')&&r.status==='complete').length>=5],['🔥','Persévérant',()=>data.runs.filter(r=>r.status==='complete').length>=30]];
function renderChallenges(){const done=data.runs.filter(r=>r.status==='complete'),quick=done.filter(r=>r.elapsed_s<=(data.config.tasks.find(t=>t.id===r.task_id)?.minutes||15)*60),self=done.filter(r=>r.late_s===0);const goals=[{name:'Départ canon',desc:'Commence 3 missions sans retard',done:Math.min(self.length,3),max:3,icon:'⚡'},{name:'Sprint du champion',desc:'Termine 5 missions dans le chrono',done:Math.min(quick.length,5),max:5,icon:'⏱️'},{name:'Série gagnante',desc:'Accomplis 10 missions',done:Math.min(done.length,10),max:10,icon:'🔥'}];
 return `<div class="section-title"><h2>🏆 CENTRE DES DÉFIS</h2><span class="pill gold">${badges.filter(b=>b[2]()).length} trophées</span></div><div class="card"><h2>⚡ Défis automatiques</h2>${goals.map(g=>`<div style="margin:14px 0"><div class="row between"><strong>${g.icon} ${g.name}</strong><span class="small muted">${g.done}/${g.max}</span></div><p class="small muted" style="margin:5px 0">${g.desc}</p><div class="progress"><span style="width:${g.done/g.max*100}%"></span></div></div>`).join('')}</div>
 <section class="card" style="margin-top:12px"><h2>🎖️ Trophées à débloquer</h2><div class="badge-grid">${badges.map(([icon,name,fn])=>`<div class="trophy ${fn()?'':'locked'}"><span class="emoji">${icon}</span><strong>${name}</strong><span class="tiny muted">${fn()?'DÉBLOQUÉ':'À GAGNER'}</span></div>`).join('')}</div></section>
 <section class="card" style="margin-top:12px"><h2>🎯 Défis du parent</h2>${(data.config.customChallenges||[]).length?(data.config.customChallenges||[]).map(c=>`<div class="mission"><span>🎯</span><div class="info"><strong>${escape(c.name)}</strong><p>${escape(c.description)} · Récompense : ${Number(c.coins)||0} pièces (validation parentale)</p></div></div>`).join(''):'<p class="small muted">Aucun défi parental pour l’instant.</p>'}</section>`;
}
function renderShop(){return `<div class="row between" style="margin:10px 0 20px"><h2 style="margin:0">🪙 BOUTIQUE XP</h2><span class="pill gold">${data.wallet.coins} pièces</span></div><div class="stack">${(data.config.rewards||[]).filter(r=>r.active!==false).map(r=>`<div class="reward"><span class="emoji">${escape(r.icon||'🎁')}</span><div class="info"><strong>${escape(r.name)}</strong><p>🎟️ ${r.cost} pièces · Approbation parentale</p></div><button class="btn mini primary" data-action="request-reward" data-id="${escape(r.id)}" ${data.wallet.coins<r.cost?'disabled':''}>Obtenir</button></div>`).join('')}
 <section class="card"><h2>📜 Mes demandes</h2>${(data.requests||[]).slice(0,12).map(r=>`<div class="mission"><span class="time">${r.cost}🪙</span><div class="info"><strong>${escape(data.config.rewards.find(x=>x.id===r.reward_id)?.name||'Récompense')}</strong><p>${r.status==='pending'?'⏳ En attente du parent':r.status==='approved'?'✅ Accordée':'❌ Non validée'}</p></div></div>`).join('')||'<p class="small muted">Aucune demande pour l’instant.</p>'}</section></div>`}
function rankName(n){return n>=15?'Légende':n>=10?'Élite':n>=7?'Champion':n>=4?'Explorateur':'Recrue'}
function renderProfile(){const lvl=levelInfo(data.wallet.xp),all=data.runs.filter(r=>r.status==='complete');return `<section class="hero center"><div class="profile-portrait frame-${escape(data.config.frame||'neon')}">${escape(data.config.avatar||'🚀')}</div><h1>${escape(data.config.childName||'Mahé')}</h1><span class="pill cyan">NIVEAU ${lvl.n} · ${escape(data.config.title||rankName(lvl.n))}</span><div style="margin:18px 0">${walletBadge()}</div><div class="progress"><span style="width:${lvl.progress}%"></span></div><p>${lvl.current} / ${lvl.needed} XP vers le niveau ${lvl.n+1}</p></section>
 <section class="card" style="margin-top:14px"><h2>📈 Mes records</h2><div class="grid3"><div class="stat"><span class="small muted">Missions</span><strong>${all.length}</strong></div><div class="stat"><span class="small muted">Sans retard</span><strong>${all.filter(r=>r.late_s===0).length}</strong></div><div class="stat"><span class="small muted">Trophées</span><strong>${badges.filter(b=>b[2]()).length}</strong></div></div></section>
 <section class="card" style="margin-top:14px"><h2>🎨 Mon profil à débloquer</h2><div class="grid3">${[['🚀',1],['🦾',3],['🥷',5],['🛸',7],['👑',10],['🐉',15]].map(([icon,unlock])=>`<button class="btn" data-action="avatar" data-id="${icon}" ${lvl.n<unlock?'disabled':''}>${icon}<br><span class="tiny">Niv. ${unlock}</span></button>`).join('')}</div><div class="divider"></div><h3>Cadres débloqués</h3><div class="row wrap">${[['neon',1],['plasma',4],['legendary',10]].map(([v,l])=>`<button class="btn mini" data-action="frame" data-id="${v}" ${lvl.n<l?'disabled':''}>${v} · Niv. ${l}</button>`).join('')}</div><div class="divider"></div><h3>Titres à débloquer</h3><div class="row wrap">${[['Recrue',1],['Sprinter',3],['Stratège',6],['Légende',12]].map(([v,l])=>`<button class="btn mini" data-action="title" data-id="${v}" ${lvl.n<l?'disabled':''}>${v} · Niv. ${l}</button>`).join('')}</div><div class="divider"></div>${connected?'<button class="btn primary block" style="margin:12px 0" data-action="notify">🔔 Activer les notifications-défis</button>':''}<div class="row between"><span class="small muted">Effets sonores</span><button class="btn mini" data-action="toggle-sound">${localStorage.getItem('nm_mute')==='yes'?'Réactiver':'Couper'} les sons</button></div></section>`}
function renderAdmin(){switch(adminTab){case 'tasks':return renderAdminTasks();case 'calendar':return renderAdminCalendar();case 'rewards':return renderAdminRewards();case 'settings':return renderAdminSettings();default:return renderAdminStats();}}
function adminHeading(title,detail=''){return `<div class="section-title"><h2>${title}</h2></div>`}
function renderAdminStats(){const last7=data.runs.filter(r=>r.day>=futureDays(-6)&&r.status==='complete'),total=data.runs.filter(r=>r.status==='complete');const started=data.runs.filter(r=>r.started_at),prompt=started.filter(r=>r.late_s===0).length,early=started.length?Math.round(prompt/started.length*100):0;const avg=started.length?Math.round(started.reduce((a,r)=>a+(r.late_s||0),0)/started.length/60):0;const approved=data.runs.filter(r=>r.status==='pending_parent'),redeems=data.requests.filter(r=>r.status==='pending');
 const days=Array.from({length:7},(_,i)=>futureDays(i-6)),byDay=days.map(x=>({day:x.slice(8),count:total.filter(r=>r.day===x).length})),peak=Math.max(1,...byDay.map(d=>d.count));
 const goal=total.length>=15&&early>=75;return `${adminHeading('📊 TABLEAU DE BORD','Évolution de la réactivité, de la rapidité et de la régularité.')}
 <div class="grid2"><div class="stat"><span class="small muted">Démarrages sans retard</span><strong>${early}%</strong></div><div class="stat"><span class="small muted">Retard moyen</span><strong>${avg} min</strong></div><div class="stat"><span class="small muted">Missions réussies (7 j)</span><strong>${last7.length}</strong></div><div class="stat"><span class="small muted">XP cumulés</span><strong>${data.wallet.xp}</strong></div></div>
 <section class="card" style="margin-top:14px"><div class="row between"><h2 style="margin:0">Progression sur 7 jours</h2><span class="pill cyan">Missions</span></div><div class="trend">${byDay.map(d=>`<div style="height:${Math.max(5,d.count/peak*100)}%"><small>${d.day}</small></div>`).join('')}</div><div style="height:12px"></div></section>
 <section class="card" style="margin-top:14px"><h2>✅ Validations en attente (${approved.length})</h2>${approved.map(r=>`<div class="mission"><span>⏱️</span><div class="info"><strong>${escape(data.config.tasks.find(t=>t.id===r.task_id)?.title||data.homework.find(h=>h.id===r.task_id)?.subject||((data.homeworkBlocks||[]).some(b=>b.id===r.task_id)?'Bloc de devoirs':'Mission'))}</strong><p>${r.day} · ${pretty(r.elapsed_s||0)} · ${r.xp} XP</p></div><button class="btn mini success" data-action="approve" data-id="${r.id}">✓</button><button class="btn mini danger" data-action="reject" data-id="${r.id}">×</button></div>`).join('')||'<p class="small muted">Aucune mission en attente.</p>'}
 <div class="divider"></div><h2>🎁 Demandes de récompense (${redeems.length})</h2>${redeems.map(r=>`<div class="mission"><span>🪙</span><div class="info"><strong>${escape(data.config.rewards.find(x=>x.id===r.reward_id)?.name||'Récompense')}</strong><p>${r.cost} pièces</p></div><button class="btn mini success" data-action="reward-approve" data-id="${r.id}">✓</button><button class="btn mini danger" data-action="reward-reject" data-id="${r.id}">×</button></div>`).join('')||'<p class="small muted">Aucune demande en attente.</p>'}</section>
 <section class="card" style="margin-top:14px"><h2>🧠 Progression d’autonomie</h2><p class="small muted">Mode actuel : <b>${['','Guidé','Semi-autonome','Autonome'][data.config.rankMode||1]}</b>. Les changements sont proposés selon les résultats, mais validés par toi.</p><div class="progress"><span style="width:${early}%"></span></div><p class="small">${goal?'🏅 Mahé pourrait passer au palier suivant : ses démarrages sont réguliers.':'Objectif indicatif : au moins 15 missions réussies et 75 % de départs sans retard.'}</p><button class="btn" data-action="autonomy">Changer le palier</button></section>
 <section class="card" style="margin-top:14px"><h2>🪙 Pénalités manuelles</h2><p class="small muted">Aucune pénalité n’est automatique. Tu choisis un manquement et confirmes un petit retrait en pièces (maximum 20 par opération, solde jamais négatif).</p><button class="btn danger" data-action="penalty">Examiner une pénalité</button></section>`;
}
function renderAdminTasks(){const tasks=data.config.tasks||[];return `${adminHeading('🎯 ÉDITEUR DE MISSIONS','Toutes les missions sont personnalisables : horaires, périodes, priorité, durée, validation, sous-étapes et notifications.')}
 <div class="row" style="margin:16px 0"><button class="btn primary" data-action="edit-task">+ Nouvelle mission</button><span class="pill cyan">${tasks.filter(t=>t.enabled).length} actives</span></div>
 <div class="mission-list">${tasks.map(t=>`<div class="mission"><span class="time">${t.enabled?'⚡':'⏸️'}<br>${t.time}</span><div class="info"><strong>${escape(t.title)}</strong><p>${escape(categoryList()[t.category]||'Mission')} · ${t.minutes} min · ${t.validation==='parent'?'Parent':'Autonome'}</p></div><button class="btn mini" data-action="edit-task" data-id="${escape(t.id)}">✎</button><button class="btn mini" data-action="duplicate-task" data-id="${escape(t.id)}">⧉</button></div>`).join('')}</div>`}
function renderAdminCalendar(){return `${adminHeading('📅 CALENDRIER INTELLIGENT','Semaine, vacances, exceptions ponctuelles et plages de silence.')}
 <section class="card"><div class="row between"><h2 style="margin:0">Périodes personnalisées</h2><button class="btn mini primary" data-action="add-period">+ Période</button></div>${(data.config.periods||[]).map(p=>`<div class="mission"><span>📅</span><div class="info"><strong>${escape(p.name)}</strong><p>${p.start} → ${p.end} · ${escape(p.mode)}</p></div><button class="btn mini danger" data-action="del-period" data-id="${p.id}">×</button></div>`).join('')||'<p class="small muted">Mode école en semaine, week-end les autres jours. Ajoute tes vacances ou tes périodes spéciales.</p>'}</section>
 <section class="card" style="margin-top:14px"><div class="row between"><h2 style="margin:0">🔕 Plages silencieuses</h2><button class="btn mini primary" data-action="add-quiet">+ Silence</button></div>${(data.config.quiet||[]).map(q=>`<div class="mission"><span>🔕</span><div class="info"><strong>${q.start} → ${q.end}</strong><p>${(q.modes||[]).join(', ')} · ${(q.days||[]).map(x=>WEEK[x]).join(' ')}</p></div><button class="btn mini danger" data-action="del-quiet" data-id="${q.id}">×</button></div>`).join('')}</section>
 <section class="card" style="margin-top:14px"><div class="row between"><h2 style="margin:0">Exceptions</h2><button class="btn mini primary" data-action="add-exception">+ Exception</button></div>${(data.config.exceptions||[]).map(e=>`<div class="mission"><span>🗓️</span><div class="info"><strong>${e.day}</strong><p>${escape(data.config.tasks.find(t=>t.id===(e.taskId||e.hideTaskId))?.title||'Mission')} · ${e.hideTaskId?'Masquée':'Horaire exceptionnel'}</p></div><button class="btn mini danger" data-action="del-exception" data-id="${e.id}">×</button></div>`).join('')||'<p class="small muted">Aucune exception pour l’instant.</p>'}</section>`}
function renderAdminRewards(){return `${adminHeading('🪙 BOUTIQUE & DÉFIS','Édite librement les récompenses concrètes, leurs prix et les défis exceptionnels.')}
 <div class="row" style="margin:12px 0"><button class="btn primary" data-action="edit-reward">+ Récompense</button><button class="btn" data-action="add-challenge">+ Défi parental</button></div>
 <div class="stack">${data.config.rewards.map(r=>`<div class="reward"><span class="emoji">${escape(r.icon)}</span><div class="info"><strong>${escape(r.name)}</strong><p>${r.cost} pièces · ${r.active===false?'Inactif':'Actif'}</p></div><button class="btn mini" data-action="edit-reward" data-id="${r.id}">Modifier</button></div>`).join('')}</div>
 <section class="card" style="margin-top:14px"><h2>Défis créés par le parent</h2>${(data.config.customChallenges||[]).map(c=>`<div class="mission"><span>🎯</span><div class="info"><strong>${escape(c.name)}</strong><p>${escape(c.description)} · ${c.coins} pièces</p></div><button class="btn mini success" data-action="award-challenge" data-id="${c.id}">+ pièces</button><button class="btn mini danger" data-action="del-challenge" data-id="${c.id}">×</button></div>`).join('')||'<p class="muted small">Aucun défi ajouté.</p>'}</section>`}
function renderAdminSettings(){const rules=hwRules();return `${adminHeading('⚙️ RÉGLAGES','Gestion du compte familial, du jumelage, de PRONOTE et de la sauvegarde.')}
 <section class="card"><h2>Compte parent</h2><p class="small muted">Stockage local sur le téléphone de Mahé</p><div class="row wrap"><button class="btn" data-action="change-pin">Changer mon PIN</button><button class="btn" data-action="export">Exporter ma sauvegarde</button><button class="btn" data-action="import">Restaurer une sauvegarde</button><input id="backup-import" type="file" accept="application/json,.json" hidden>${connected?'<button class="btn danger" data-action="logout">Déconnexion Google</button>':''}</div></section>
 <section class="card" style="margin-top:14px"><h2>📱 Données sur cet appareil</h2><p class="small muted">Les missions, XP, récompenses et historiques restent sur ce Samsung. Exporter une sauvegarde est indispensable avant de changer de téléphone ou d'effacer les données de Chrome. Le PIN est une protection d'interface, pas un coffre-fort inviolable.</p><div id="pair-code"></div></section>
 <section class="card" style="margin-top:14px"><h2>Configuration générale</h2><div class="field"><label>Prénom</label><input id="child-name" value="${escape(data.config.childName||'Mahé')}" maxlength="30"></div><div class="field"><label>URL PRONOTE (facultatif)</label><input id="pronote-url" value="${escape(data.config.pronoteUrl||'')}" placeholder="https://..."></div><div class="field"><label>Niveau d’autonomie</label><select id="rank-mode"><option value="1" ${data.config.rankMode===1?'selected':''}>Guidé</option><option value="2" ${data.config.rankMode===2?'selected':''}>Semi-autonome</option><option value="3" ${data.config.rankMode===3?'selected':''}>Autonome</option></select></div><button class="btn primary" data-action="save-settings">Enregistrer</button></section>
 <details class="card" style="margin-top:14px"><summary style="font-weight:850;cursor:pointer">📚 Récompenses des blocs de devoirs</summary><form id="hw-rules" style="margin-top:16px"><div class="form-grid">
 ${field('XP par devoir terminé','xpPer','number',rules.xpPer,'min="0" max="30" required')}
 ${field('Pièces par devoir terminé','coinsPer','number',rules.coinsPer,'min="0" max="20" required')}
 ${field('XP par jour d’avance et par devoir','advancePer','number',rules.advancePer,'min="0" max="6" required')}
 ${field('XP supplémentaires par devoir du bloc après le premier','volumePer','number',rules.volumePer,'min="0" max="10" required')}
 </div><p class="small muted">L’avance et le volume sont plafonnés. Le bonus de chrono est accordé seulement si le temps estimé est respecté.</p><button class="btn primary block" type="submit">Enregistrer ce barème</button></form></details>
 <section class="card" style="margin-top:14px"><div class="row between"><h2 style="margin:0">📁 Catégories éditables</h2><button class="btn mini primary" data-action="category-add">+ Catégorie</button></div><div class="mission-list" style="margin-top:12px">${categoryList().map((c,i)=>`<div class="mission"><span class="time">${i+1}</span><div class="info"><strong>${escape(c)}</strong></div><button class="btn mini" data-action="category-edit" data-id="${i}">Modifier</button><button class="btn mini danger" data-action="category-delete" data-id="${i}">×</button></div>`).join('')}</div></section>
 <section class="card" style="margin-top:14px"><h2>🔔 Notifications</h2><p class="small muted">Mahé doit activer les notifications depuis son téléphone. Une seule notification-défi par mission, hors des plages silencieuses.</p><p class="small muted">Sans serveur, les rappels apparaissent uniquement lorsque NEXT MOVE est ouvert. Aucune notification garantie lorsque l’application est fermée.</p></section>`}
function renderPairing(){$('#app').innerHTML=`<main class="app"><div class="setup"><div class="mark" style="justify-content:center"><div class="mark-icon">ϟ</div><div class="brand">NEXT MOVE</div></div><h1>Prêt pour l’aventure ?</h1><p>Associe ce téléphone à ton espace familial ou connecte-toi comme parent.</p><section class="card"><h2>🎮 Je suis Mahé</h2><div class="field"><label>Code donné par le parent</label><input id="join-code" placeholder="CODE DE JUMELAGE" autocomplete="off"></div><button class="btn primary block" data-action="claim-pair">Associer mon téléphone</button></section><section class="card" style="margin-top:12px"><h2>🔐 Je suis le parent</h2><button class="btn block" data-action="google-login">Me connecter avec Google</button></section></div></main>`}
function renderPin(){const set=!!localStorage.getItem(pinKey);$('#app').innerHTML=`<main class="app"><section class="setup card"><div class="center" style="font-size:45px">🔐</div><h1>${set?'Accès parent':'Créer ton PIN'}</h1><p>${set?'Saisis ton code personnel à 4 chiffres.':'Choisis ton code à 4 chiffres. Il protège les réglages de cette application sur ce téléphone.'}</p><div class="field"><label>${set?'Code parent':'Nouveau code'}</label><input id="pin-entry" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="••••"></div>${set?'':`<div class="field"><label>Confirmer le code</label><input id="pin-confirm" type="password" inputmode="numeric" maxlength="4" placeholder="••••"></div>`}<button class="btn primary block" data-action="pin-submit">${set?'Déverrouiller':'Créer le PIN'}</button>${!connected?'<button class="btn block" data-action="switch-child">Retour à Mahé</button>':''}</section></main>`}
async function hashPin(pin){const salt='NEXT MOVE LOCAL PIN v1';const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+pin));return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')}
function openModal(html){$('#modal-root').innerHTML=`<div class="modal-backdrop" data-backdrop="true"><section class="modal"><button class="modal-close" data-action="close-modal">×</button>${html}</section></div>`;window.scrollTo(0,0)}
const closeModal=()=>$('#modal-root').innerHTML='';
function dayChecks(days=[1,2,3,4,5]){return `<div class="checks">${WEEK.map((d,i)=>`<label class="check"><input type="checkbox" name="days" value="${i}" ${days.includes(i)?'checked':''}>${d}</label>`).join('')}</div>`}
function modeChecks(modes=['school']){return `<div class="checks">${[['school','École'],['weekend','Week-end'],['vacation','Vacances']].map(([val,label])=>`<label class="check"><input type="checkbox" name="modes" value="${val}" ${modes.includes(val)?'checked':''}>${label}</label>`).join('')}</div>`}
function field(label,name,type='text',value='',other=''){return `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${escape(value)}" ${other}></div>`}
function selectField(label,name,options,val){return `<div class="field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${options.map(([v,l])=>`<option value="${escape(v)}" ${String(val)===String(v)?'selected':''}>${escape(l)}</option>`).join('')}</select></div>`}
function taskModal(identifier){const t=data.config.tasks.find(t=>t.id===identifier)||task('', '',0,'17:20',15,[1,2,3,4,5],{enabled:true,modes:['school','weekend','vacation']});
 openModal(`<h2>🎯 ${identifier?'Modifier':'Créer'} une mission</h2><form id="task-form" data-id="${escape(identifier||'')}">
 ${field('Nom de la mission','title','text',t.title,'required maxlength="80"')}<div class="form-grid">${selectField('Catégorie','category',categoryList().map((x,i)=>[i,x]),t.category)}${field('Début prévu','time','time',t.time,'required')}${field('Durée chrono (minutes)','minutes','number',t.minutes,'min="1" max="240" required')}${field('Échéance limite (facultative)','deadline','time',t.deadline||'')}${selectField('Priorité','priority',[[1,'1 · Obligatoire'],[2,'2 · Important'],[3,'3 · Flexible']],t.priority)}${selectField('Validation','validation',[['self','Autovalidation'],['parent','Approbation parentale']],t.validation)}${selectField('Non terminée','carry',[['expire','Expire'],['carry','Reporter'],['keep','Conserver jusqu’au bout']],t.carry)}</div>
 <div class="divider"></div><h3>Barème personnalisable</h3><div class="form-grid">${field('XP mission','xpBase','number',t.xpBase??10,'min="0" max="100"')}${field('XP rapidité','xpSpeed','number',t.xpSpeed??10,'min="0" max="100"')}${field('XP initiative','xpInitiative','number',t.xpInitiative??15,'min="0" max="100"')}${field('Pièces mission','coinsBase','number',t.coinsBase??5,'min="0" max="50"')}${field('Pièces rapidité','coinsSpeed','number',t.coinsSpeed??3,'min="0" max="50"')}${field('Pièces initiative','coinsInitiative','number',t.coinsInitiative??5,'min="0" max="50"')}</div><div class="field"><label>Jours actifs</label>${dayChecks(t.days||[])}</div><div class="field"><label>Types de journée</label>${modeChecks(t.modes||[])}</div>
 <div class="field"><label>Sous-étapes (une par ligne)</label><textarea name="steps" placeholder="Exemple : Préparer la trousse">${escape((t.steps||[]).join('\n'))}</textarea></div>
 <div class="checks"><label class="check"><input type="checkbox" name="enabled" ${t.enabled?'checked':''}>Mission active</label><label class="check"><input type="checkbox" name="notify" ${t.notify?'checked':''}>Rappel-défi dans l’application</label><label class="check"><input type="checkbox" name="locked" ${t.locked?'checked':''}>Horaire non déplaçable</label></div>
 <div class="form-actions"><button type="button" class="btn" data-action="close-modal">Annuler</button><button type="submit" class="btn primary">Enregistrer</button></div></form>${identifier?`<div class="divider"></div><button class="btn mini danger" data-action="delete-task" data-id="${escape(identifier)}">Supprimer cette mission</button>`:''}`);
}
function rewardModal(identifier){const r=data.config.rewards.find(r=>r.id===identifier)||{name:'',cost:100,icon:'🎁',active:true};openModal(`<h2>🪙 Récompense</h2><form id="reward-form" data-id="${escape(identifier||'')}">${field('Nom','name','text',r.name,'required maxlength="100"')}${field('Emoji','icon','text',r.icon,'maxlength="8"')}${field('Prix en pièces','cost','number',r.cost,'min="1" max="10000" required')}<label class="check"><input type="checkbox" name="active" ${r.active!==false?'checked':''}>Récompense disponible</label><div class="form-actions"><button type="button" class="btn" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div></form>`)}
async function updateConfig(next){if(role!=='parent')return toast('Accès parent requis');const old=data.config;data.config=next;render();try{if(connected)await call('/config','PUT',next);else{db.config=next;saveDemo()};toast('✅ Paramètres enregistrés')}catch(e){data.config=old;render();toast('Erreur : '+e.message)}}
function cloneConfig(){return JSON.parse(JSON.stringify(data.config))}
function offlineRuns(){try{return JSON.parse(localStorage.getItem('nm_offline_runs')||'[]')}catch{return []}}
function saveOfflineRuns(items){localStorage.setItem('nm_offline_runs',JSON.stringify(items))}
async function call(path,method='GET',body){
 if(!connected)return demoCall(path,method,body);
 if(!firebase.auth().currentUser)throw Error('CONNEXION_REQUISE');
 const token=await firebase.auth().currentUser.getIdToken();
 const result=await fetch(cfg.apiUrl.replace(/\/$/,'')+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body!==undefined?JSON.stringify(body):undefined});
 const payload=await result.json();if(!result.ok)throw Error(payload.error||'SERVICE_INDISPONIBLE');return payload;
}
async function demoCall(path,method,body){let result={ok:true};
 if(path==='/me')return {...db,paired:true,role};
 if(path==='/config'){db.config=body;}
 else if(path==='/run/start'){
  let r=db.runs.find(r=>r.task_id===body.taskId&&r.day===body.day);
  if(!r){const t=tasksFor(body.day).find(t=>t.id===body.taskId)||{time:localTime()};const dt=new Date();const [h,m]=t.time.split(':').map(Number);const planned=new Date();planned.setHours(h,m,0,0);r={id:rand(),task_id:body.taskId,day:body.day,planned_at:planned.getTime(),started_at:nowMs(),status:'running',validation:t.validation||'self'};db.runs.unshift(r)}result.run=r;
 }
 else if(path==='/run/finish'||path==='/run/offline'){
  const r=db.runs.find(r=>r.task_id===body.taskId&&r.day===body.day);
  if(r&&r.status==='running'){
   const t=tasksFor(r.day).find(t=>t.id===r.task_id);
   if(!t)throw Error('Mission introuvable');
   const duration=Math.max(0,Math.floor((Date.now()-r.started_at)/1000));
   const late=Math.max(0,Math.floor((r.started_at-r.planned_at)/1000)),fast=duration<=t.minutes*60;
   if(t.homeworkBlock){
    const b=db.homeworkBlocks.find(x=>x.id===t.id);
    if(!b)throw Error('Bloc introuvable');
    const actual=(b.items||[]).map(x=>{
     const requested=body.actual?.find(y=>y.due===x.due);
     const val=Number(requested?.count??x.count);
     if(!Number.isInteger(val)||val<0||val>Number(x.count))throw Error('Nombre de devoirs invalide');
     return {due:x.due,count:val};
    }).filter(x=>x.count>0);
    if(!hwSum(actual))throw Error('Indique au moins un devoir terminé');
    const points=hwReward(actual,b.estimate,duration,r.day);
    r.homeworkActual=actual;r.xp=points.xp;r.coins=points.coins;r.homeworkAdvance=points.advance;
   }else{
    r.xp=10+(fast?10:0)+(late===0?15:0);
    r.coins=5+(fast?3:0)+(late===0?5:0);
   }
   r.status=r.validation==='parent'?'pending_parent':'complete';r.finished_at=Date.now();
   r.elapsed_s=duration;r.late_s=late;
   if(r.status==='complete'){db.wallet.xp+=r.xp;db.wallet.coins+=r.coins;if(t.homeworkBlock)hwApplyCompleted(r);}
   result.points={xp:r.xp,coins:r.coins};result.status=r.status;
  }
 }
 else if(path==='/run/approve'){
  const r=db.runs.find(x=>x.id===body.id&&x.status==='pending_parent');
  if(r){r.status=body.approve?'complete':'rejected';if(body.approve){db.wallet.xp+=r.xp;db.wallet.coins+=r.coins;if(r.homeworkActual)hwApplyCompleted(r)}}
}
 else if(path==='/plan/set'){const i=db.plans.findIndex(x=>x.day===body.day);const plan={day:body.day,plan_json:JSON.stringify(body.plan)};if(i>=0)db.plans[i]=plan;else db.plans.push(plan)}
 else if(path==='/customize'){db.config[body.kind]=body.value}
 else if(path==='/homework'){const hw={id:'hw-'+rand(),parent_uid:'demo',subject:body.subject,estimate:body.estimate,day:body.day,details:body.details,due:body.due,done:0};db.homework.push(hw);result.id=hw.id;}
 else if(path==='/homework/delete'){db.homework=db.homework.filter(h=>h.id!==body.id)}
 else if(path==='/reward/request'){const r=db.config.rewards.find(x=>x.id===body.rewardId);if(db.wallet.coins<r.cost)throw Error('NOT_ENOUGH_COINS');db.requests.unshift({id:rand(),reward_id:r.id,cost:r.cost,status:'pending',created_at:Date.now()});}
 else if(path==='/reward/resolve'){const r=db.requests.find(x=>x.id===body.requestId);if(r&&r.status==='pending'){r.status=body.approve?'approved':'rejected';if(body.approve)db.wallet.coins=Math.max(0,db.wallet.coins-r.cost)}}
 else if(path==='/challenge/award'){const ch=db.config.customChallenges.find(x=>x.id===body.challengeId);if(ch)db.wallet.coins+=Math.max(0,Number(ch.coins)||0)}
 else if(path==='/penalty'){db.wallet.coins=Math.max(0,db.wallet.coins-Number(body.coins));result.deducted=body.coins;}
 saveDemo();return result;
}
async function refresh(quiet=false){if(!initDone)return;try{const result=await call('/me');data={...data,...result};const offline=JSON.parse(localStorage.getItem('nm_offline_running')||'null');if(offline&&!data.runs.find(r=>r.task_id===offline.task_id&&r.day===offline.day))data.runs.unshift(offline);role=connected?result.role:role;if(connected&&role==='parent'&&!(data.config?.tasks?.length)){
  const initial=defaultConfig(false);await call('/config','PUT',initial);data.config=initial;
 }if(!quiet)toast('Données actualisées');render()}catch(e){if(!quiet)toast(e.message);if(e.message==='NOT_PAIRED'){data.paired=false;role='child';render()}else if(connected){const local=localStorage.getItem('nm_state_cache');if(local){const cached=JSON.parse(local);data={...data,...cached};render()}}}}
function storeCache(){if(connected){const safe={config:data.config,runs:data.runs,wallet:data.wallet,homework:data.homework,requests:data.requests,paired:data.paired};localStorage.setItem('nm_state_cache',JSON.stringify(safe))}}
async function changeTab(which){if(role==='parent')adminTab=which;else {tab=which;if(which==='today')activeDay=dayNow();}render();window.scrollTo(0,0)}
async function startTask(taskId){const day=activeDay;if(day!==dayNow())return toast('Lance les missions du jour uniquement.');
 if(tasksFor(day).find(t=>t.id===taskId)?.homeworkLauncher){tab='homework';render();return;}
 const old=runFor(taskId,day);if(old)return toast('Cette mission est déjà commencée.');
 try{const r=await call('/run/start','POST',{taskId,day});if(!data.runs.some(x=>x.id===r.run.id))data.runs.unshift(r.run);render();beep(700,.1);toast('⚡ Chrono lancé, c’est parti !')}
 catch(e){if(!navigator.onLine){const obj={id:'offline-'+rand(),task_id:taskId,day,started_at:Date.now(),planned_at:Date.now(),status:'running',offline:true};data.runs.unshift(obj);localStorage.setItem('nm_offline_running',JSON.stringify(obj));render();toast('Hors ligne · chrono local actif. Validation parentale après synchronisation.')}else toast('Impossible de démarrer : '+e.message)}
}
async function finishTask(taskId){const run=runFor(taskId,activeDay);if(!run||run.status!=='running')return;
 if(tasksFor(activeDay).find(t=>t.id===taskId)?.homeworkBlock){modalHomeworkFinish(taskId);return;}
 if(!confirm('Confirmer que la mission est réellement terminée ?'))return;
 if(run.offline){run.finished_at=nowMs();run.elapsed_s=Math.floor((run.finished_at-run.started_at)/1000);run.status='pending_parent';const q=offlineRuns();q.push({taskId,day:activeDay,startedAt:run.started_at,finishedAt:run.finished_at});saveOfflineRuns(q);localStorage.removeItem('nm_offline_running');render();celebration('Défi terminé hors ligne : en attente de vérification');return;}
 try{const result=await call('/run/finish','POST',{taskId,day:activeDay});await refresh(true);if(result.status==='pending_parent')toast('⏳ Mission terminée, validation parentale en attente');else celebration('Mission terminée ! +'+result.points.xp+' XP')}catch(e){
  if(!navigator.onLine||e instanceof TypeError){const end=Date.now(),q=offlineRuns();q.push({taskId,day:activeDay,startedAt:run.started_at,finishedAt:end});saveOfflineRuns(q);run.status='pending_parent';run.finished_at=end;render();toast('Hors ligne : résultat enregistré. Validation parentale au retour du réseau.');}
  else toast('Erreur : '+e.message)
 }
}
async function flushOffline(){if(!connected||!navigator.onLine)return;const queue=offlineRuns();if(!queue.length)return;let pending=[];for(const item of queue){try{await call('/run/offline','POST',item)}catch{pending.push(item)}}saveOfflineRuns(pending);if(pending.length!==queue.length)await refresh(true)}
async function openPronote(){const url=data.config.pronoteUrl||cfg.pronoteUrl;if(url&&/^https:\/\//.test(url))window.open(url,'_blank','noopener,noreferrer');else toast('Adresse PRONOTE à configurer depuis l’espace parent.')}
function replan(){const pending=tasksFor(activeDay).filter(t=>!isDone(runFor(t.id))),start=localTime();let cursor=minutes(start);const changes={};const display=pending.map(t=>{
  const planned=minutes(t.time);
  if(t.locked||t.priority===1){cursor=Math.max(cursor,planned)+t.minutes;return `${escape(t.title)} : horaire fixé à ${t.time}`}
  cursor=Math.max(cursor,planned);const hh=String(Math.floor(cursor/60)%24).padStart(2,'0')+':'+String(cursor%60).padStart(2,'0');if((!t.deadline||hh<=t.deadline)&&hh!=='24:00')changes[t.id]=hh;cursor+=t.minutes;return `${escape(t.title)} : proposé à ${hh}`;
 });const el=$('#replan-result');if(el)el.innerHTML='<div class="divider"></div>'+display.map(s=>`<p class="small">• ${s}</p>`).join('')+'<p class="helper">Les contraintes parentales et les horaires fixes restent prioritaires.</p>'+((data.config.rankMode||1)>=2?'<button class="btn primary block" data-action="apply-plan">Appliquer ce planning</button>':'<p class="small muted">En mode Guidé, le parent conserve la décision de déplacement des horaires.</p>');window.__suggestedMovePlan=changes;
}
async function requestNotifications(){if(!connected)return toast('Notifications distantes indisponibles en démonstration');
 if(!('Notification' in window)||!('serviceWorker' in navigator))return toast('Notifications non prises en charge');
 try{
  const permission=await Notification.requestPermission();if(permission!=='granted')return toast('Notifications refusées. Autorise-les dans Chrome.');
  const messaging=firebase.messaging();const token=await messaging.getToken({vapidKey:cfg.vapidKey,serviceWorkerRegistration:serviceWorker});
  if(!token)throw Error('TOKEN_MANQUANT');await call('/push-token','POST',{token});toast('🔔 Notifications de défis activées !');
 }catch(e){toast('Notifications : '+e.message)}
}
function modalAddHomework(){openModal(`<h2>📚 Planifier un devoir</h2><p class="small muted">Consulte PRONOTE, choisis une matière et estime le chrono nécessaire.</p><form id="homework-form">${selectField('Matière','subject',SUBJECTS.map(s=>[s,s]),SUBJECTS[0])}${field('Pour le jour','day','date',activeDay,'required')}${field('Durée estimée (min)','estimate','number',20,'min="1" max="240" required')}<div class="field"><label>Ce que je dois faire</label><textarea name="details" placeholder="Exercices, leçon à apprendre…"></textarea></div><div class="form-actions"><button type="button" class="btn" data-action="pronote">PRONOTE ↗</button><button class="btn primary" type="submit">Créer ma mission</button></div></form>`)}
async function googleLogin(){if(!connected)return toast('Connecte Firebase pour utiliser Google.');try{const provider=new firebase.auth.GoogleAuthProvider();await firebase.auth().signInWithPopup(provider);await refresh(true)}catch(e){if(e.code==='auth/popup-blocked'){try{await firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());return}catch{}}toast('Connexion Google : '+e.message)}}
async function pinSubmit(){const entered=$('#pin-entry')?.value||'';if(!/^\d{4}$/.test(entered))return toast('PIN de quatre chiffres requis.');const existing=localStorage.getItem(pinKey);if(!existing){if($('#pin-confirm')?.value!==entered)return toast('Les deux codes ne correspondent pas.');localStorage.setItem(pinKey,await hashPin(entered));pinUnlocked=true;render();toast('PIN créé');return}
 if(existing===await hashPin(entered)){pinUnlocked=true;render();toast('Espace parent déverrouillé')}else toast('Code incorrect')}
function autoStartSetup(){if(connected)return;initDone=true;data={...db};role='child';render()}
async function signOut(){if(!connected)return;await firebase.auth().signOut();pinUnlocked=false;role='child';data.paired=false;render();await firebase.auth().signInAnonymously()}
async function activateFirebase(){
 if(!connected){autoStartSetup();return;}
 try{firebase.initializeApp(cfg.firebase);auth=firebase.auth();await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);serviceWorker=await navigator.serviceWorker?.register('./sw.js',{updateViaCache:'none'});
 auth.onAuthStateChanged(async user=>{
  if(!user){try{await auth.signInAnonymously()}catch(e){toast('Connexion enfant : '+e.message)}return;}
  uid=user.uid;initDone=true;try{const response=await call('/me');data={...data,...response};const offline=JSON.parse(localStorage.getItem('nm_offline_running')||'null');if(offline&&!data.runs.find(r=>r.task_id===offline.task_id&&r.day===offline.day))data.runs.unshift(offline);role=response.role;if(role==='parent'&&!(data.config?.tasks?.length)){const initial=defaultConfig(false);await call('/config','PUT',initial);data.config=initial;}storeCache();render();}
  catch(e){if(e.message==='NOT_PAIRED'){role='child';data.paired=false;render()}
   else if(e.message==='PARENT_ONLY'||e.message==='ORIGIN_DENIED'){role='child';data.paired=false;render();toast('Compte Google non autorisé par le serveur.')}
   else{const saved=localStorage.getItem('nm_state_cache');if(saved){data={...data,...JSON.parse(saved)};role=user.isAnonymous?'child':'parent';data.paired=true;render()}else renderPairing();toast('Service indisponible : '+e.message)}}
 });
 }catch(e){initDone=true;toast('Firebase : '+e.message);renderPairing()}
}

function hwAdjustCount(due,delta){
 const item=db.homeworkDates.find(x=>x.due===due);if(!item)return;
 item.count=Math.min(60,Math.max(0,Number(item.count)+delta));
 if(item.count===0)db.homeworkDates=db.homeworkDates.filter(x=>x.due!==due);
 hwPersist();
}
function hwAdjustPick(due,delta){
 const max=hwAvailable(due);
 const next=Math.max(0,Math.min(max,Number(homeworkDraft.items[due]||0)+delta));
 if(delta>0&&hwSum(hwSelection())>=20){toast('20 devoirs maximum par bloc');return;}
 homeworkDraft.items[due]=next;hwRefreshDraft();render();
}
function hwAdjustEstimate(delta){
 homeworkDraft.estimate=Math.max(5,Math.min(240,Number(homeworkDraft.estimate)+delta));
 homeworkDraft.manualEstimate=true;render();
}
async function hwCreateAndStart(){
 if(db.runs.some(r=>r.status==='running'&&r.day===dayNow()))return toast('Termine d’abord ta mission en cours.');
 const items=hwSelection(),count=hwSum(items);
 if(!count)return toast('Choisis au moins un devoir.');
 if(count>20)return toast('Maximum 20 devoirs dans un bloc.');
 const estimate=Number($('#hw-duration')?.value||homeworkDraft.estimate);
 if(!Number.isInteger(estimate)||estimate<5||estimate>240)return toast('Choisis une durée entre 5 et 240 minutes.');
 for(const x of items){if(x.count>hwAvailable(x.due))return toast('Le nombre de devoirs a changé : vérifie ton bloc.');}
 const original=data.config.tasks.find(t=>t.id==='homework');
 const block={id:'hb-'+rand(),day:dayNow(),time:localTime(),estimate,items,validation:original?.validation==='parent'?'parent':'self'};
 db.homeworkBlocks.push(block);saveDemo();data={...db};
 homeworkDraft={items:{},estimate:20,manualEstimate:false};activeDay=dayNow();tab='today';
 await startTask(block.id);
}

const actions={
 'tab':(_,el)=>changeTab(el.dataset.id),
 'day-prev':()=>{activeDay=futureDate(activeDay,-1);render()},
 'day-next':()=>{activeDay=futureDate(activeDay,1);render()},
 'start':async(_,el)=>{tab='today';activeDay=dayNow();await startTask(el.dataset.id);window.scrollTo(0,0)},
 'finish':(_,el)=>finishTask(el.dataset.id),
 'toggle-sound':()=>{localStorage.setItem('nm_mute',localStorage.getItem('nm_mute')==='yes'?'no':'yes');render()},
 'parent-entry':async()=>{if(connected){await googleLogin()}else{role='parent';pinUnlocked=false;render()}},
 'google-login':()=>googleLogin(),
 'switch-child':()=>{if(connected){signOut()}else{role='child';pinUnlocked=false;render()}},
 'pin-submit':()=>pinSubmit(),
 'close-modal':()=>closeModal(),
 'pronote':()=>openPronote(),
 'add-homework':()=>{tab='homework';render()},
 'show-homework':()=>{tab='homework';render();window.scrollTo(0,0)},
 'homework-to-mission':()=>{tab='today';activeDay=dayNow();render()},
 'hw-count-minus':(_,el)=>hwAdjustCount(el.dataset.due,-1),
 'hw-count-plus':(_,el)=>hwAdjustCount(el.dataset.due,1),
 'hw-edit-count':(_,el)=>modalHomeworkCount(el.dataset.due),
 'hw-pick-minus':(_,el)=>hwAdjustPick(el.dataset.due,-1),
 'hw-pick-plus':(_,el)=>hwAdjustPick(el.dataset.due,1),
 'hw-estimate-minus':()=>hwAdjustEstimate(-5),
 'hw-estimate-plus':()=>hwAdjustEstimate(5),
 'hw-start':()=>hwCreateAndStart(),
 'replan':()=>replan(),
 'apply-plan':async()=>{try{const plan=window.__suggestedMovePlan||{};await call('/plan/set','POST',{day:activeDay,plan});await refresh(true);toast('📅 Plan de rattrapage enregistré')}catch(e){toast(e.message)}},
 'edit-task':(_,el)=>taskModal(el.dataset.id),
 'duplicate-task':async(_,el)=>{const conf=cloneConfig(),t=conf.tasks.find(x=>x.id===el.dataset.id);if(!t)return;conf.tasks.push({...t,id:rand(),title:t.title+' (copie)',enabled:false});await updateConfig(conf)},
 'delete-task':async(_,el)=>{if(!confirm('Supprimer cette mission ?'))return;const c=cloneConfig();c.tasks=c.tasks.filter(t=>t.id!==el.dataset.id);closeModal();await updateConfig(c)},
 'edit-reward':(_,el)=>rewardModal(el.dataset.id),
 'request-reward':async(_,el)=>{if(!confirm('Demander cette récompense au parent ?'))return;try{await call('/reward/request','POST',{rewardId:el.dataset.id});await refresh(true);toast('🎁 Demande envoyée !')}catch(e){toast(e.message)}},
 'approve':(_,el)=>resolveRun(el.dataset.id,true),
 'reject':(_,el)=>resolveRun(el.dataset.id,false),
 'reward-approve':(_,el)=>resolveReward(el.dataset.id,true),
 'reward-reject':(_,el)=>resolveReward(el.dataset.id,false),
 'add-period':()=>openModal(`<h2>📆 Ajouter une période</h2><form id="period-form">${field('Nom (ex. vacances d’hiver)','name','text','','required')}${field('Du','start','date',dayNow(),'required')}${field('Au','end','date',futureDays(7),'required')}${selectField('Mode','mode',[['vacation','Vacances'],['school','École'],['weekend','Week-end']], 'vacation')}<button class="btn primary block">Ajouter</button></form>`),
 'del-period':async(_,el)=>{const c=cloneConfig();c.periods=c.periods.filter(x=>x.id!==el.dataset.id);await updateConfig(c)},
 'add-quiet':()=>openModal(`<h2>🔕 Plage de silence</h2><form id="quiet-form"><div class="form-grid">${field('Début','start','time','21:00','required')}${field('Fin','end','time','06:25','required')}</div><div class="field"><label>Jours</label>${dayChecks([0,1,2,3,4,5,6])}</div><div class="field"><label>Périodes</label>${modeChecks(['school','weekend','vacation'])}</div><button class="btn primary block">Ajouter</button></form>`),
 'del-quiet':async(_,el)=>{const c=cloneConfig();c.quiet=c.quiet.filter(x=>x.id!==el.dataset.id);await updateConfig(c)},
 'add-exception':()=>openModal(`<h2>🗓️ Exception ponctuelle</h2><form id="exception-form">${field('Jour','day','date',dayNow(),'required')}${selectField('Mission','taskId',(data.config.tasks||[]).map(t=>[t.id,t.title]),data.config.tasks[0]?.id)}${selectField('Type','kind',[['hide','Ne pas afficher la mission'],['time','Changer l’horaire ce jour']], 'hide')}${field('Nouvel horaire si applicable','time','time','17:00')}<button class="btn primary block">Ajouter l’exception</button></form>`),
 'del-exception':async(_,el)=>{const c=cloneConfig();c.exceptions=c.exceptions.filter(x=>x.id!==el.dataset.id);await updateConfig(c)},
 'add-challenge':()=>openModal(`<h2>🎯 Défi parental</h2><form id="challenge-form">${field('Nom','name','text','','required')}${field('Règle de réussite','description','text','','required')}${field('Pièces prévues (à attribuer manuellement)','coins','number',10,'min="1" max="1000"')}<button class="btn primary block">Ajouter</button></form>`),
 'award-challenge':async(_,el)=>{if(!confirm('Confirmer que Mahé a réussi ce défi et attribuer les pièces ?'))return;try{await call('/challenge/award','POST',{challengeId:el.dataset.id,day:dayNow()});await refresh(true);celebration('Défi parental approuvé')}catch(e){toast(e.message)}},
 'del-challenge':async(_,el)=>{const c=cloneConfig();c.customChallenges=c.customChallenges.filter(x=>x.id!==el.dataset.id);await updateConfig(c)},
 'category-add':()=>openModal(`<h2>📁 Nouvelle catégorie</h2><form id="category-form" data-id=""><div class="field"><label>Nom (emoji facultatif)</label><input name="categoryName" maxlength="55" required placeholder="🎵 Musique"></div><button class="btn primary block">Enregistrer</button></form>`),
 'category-edit':(_,el)=>{const old=categoryList()[Number(el.dataset.id)];openModal(`<h2>📁 Modifier la catégorie</h2><form id="category-form" data-id="${el.dataset.id}"><div class="field"><label>Nom</label><input name="categoryName" maxlength="55" required value="${escape(old)}"></div><button class="btn primary block">Enregistrer</button></form>`)},
 'category-delete':async(_,el)=>{const idx=Number(el.dataset.id),c=cloneConfig();if(c.tasks.some(t=>t.category===idx))return toast('Réaffecte d’abord les missions de cette catégorie.');if(!confirm('Supprimer cette catégorie ?'))return;c.categories.splice(idx,1);c.tasks.forEach(t=>{if(t.category>idx)t.category--;});await updateConfig(c)},
 'save-settings':async()=>{const c=cloneConfig();c.childName=$('#child-name').value.trim()||'Mahé';c.rankMode=Number($('#rank-mode').value);c.pronoteUrl=$('#pronote-url').value.trim();await updateConfig(c)},
 'change-pin':()=>{if(!confirm('Remplacer le PIN local de ce téléphone ?'))return;localStorage.removeItem(pinKey);pinUnlocked=false;render()},
 'autonomy':()=>openModal(`<h2>🧠 Palier d’autonomie</h2><p class="small muted">Le palier est indépendant du niveau XP. Sa progression nécessite ton approbation.</p><form id="autonomy-form">${selectField('Nouveau palier','rankMode',[[1,'Guidé'],[2,'Semi-autonome'],[3,'Autonome']],data.config.rankMode||1)}<button class="btn primary block">Valider le palier</button></form>`),
 'penalty':()=>penaltyModal(),
 'pair-code':async()=>{try{const x=await call('/pair/create','POST',{});$('#pair-code').innerHTML=`<div class="notice" style="margin-top:15px;text-align:center"><b style="font-size:23px;letter-spacing:3px">${escape(x.code)}</b><p>Valable ${x.expiresInMinutes} minutes. À saisir sur le téléphone de Mahé.</p></div>`}catch(e){toast(e.message)}},
 'claim-pair':async()=>{const code=($('#join-code')?.value||'').trim();if(!code)return toast('Saisis le code de jumelage');try{await call('/pair/claim','POST',{code});await refresh(true)}catch(e){toast('Jumelage : '+e.message)}},
 'logout':()=>signOut(),
 'export':()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),app:'next-move-local',version:1,data:{...db,role:'child'}},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='next-move-sauvegarde-'+dayNow()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)},
 'import':()=>$('#backup-import')?.click(),
 'avatar':async(_,el)=>{try{await call('/customize','POST',{kind:'avatar',value:el.dataset.id});await refresh(true);toast('Avatar sélectionné !')}catch(e){toast(e.message)}},
 'frame':async(_,el)=>{try{await call('/customize','POST',{kind:'frame',value:el.dataset.id});await refresh(true);toast('Cadre sélectionné !')}catch(e){toast(e.message)}},
 'title':async(_,el)=>{try{await call('/customize','POST',{kind:'title',value:el.dataset.id});await refresh(true);toast('Titre sélectionné !')}catch(e){toast(e.message)}},
 'notify':()=>requestNotifications()
};
async function resolveRun(id,approve){try{await call('/run/approve','POST',{id,approve});await refresh(true);toast(approve?'✅ Mission approuvée':'Validation refusée')}catch(e){toast(e.message)}}
async function resolveReward(requestId,approve){try{await call('/reward/resolve','POST',{requestId,approve});await refresh(true);toast(approve?'🎁 Récompense accordée':'Demande refusée')}catch(e){toast(e.message)}}
function futureDate(s,n){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function penaltyModal(){const misses=tasksFor(dayNow()).filter(t=>!runFor(t.id,dayNow()));openModal(`<h2>🪙 Pénalité sur décision parentale</h2><p class="helper">Aucune perte de XP ni de trophées. Retrait maximal de 20 pièces, uniquement après ton accord.</p><form id="penalty-form">${selectField('Mission concernée','taskId',(misses.length?misses:tasksFor(dayNow())).map(t=>[t.id,t.title]),misses[0]?.id||'')}${field('Date','day','date',dayNow(),'required')}${field('Pièces à retirer','coins','number',3,'min="1" max="20" required')}<div class="form-actions"><button type="button" class="btn" data-action="close-modal">Annuler</button><button class="btn danger">Confirmer la pénalité</button></div></form>`)}
async function restoreBackup(file){
 if(!file||role!=='parent'||!pinUnlocked)return toast('Accès parent requis');
 if(file.size>2_000_000)return toast('Sauvegarde trop volumineuse');
 try{
  const x=JSON.parse(await file.text()),d=x?.data;
  if(!d||!d.config||!Array.isArray(d.config.tasks)||!Array.isArray(d.config.rewards)||!Array.isArray(d.runs)||!Array.isArray(d.requests)||!d.wallet||!Array.isArray(d.homework)||!Array.isArray(d.plans))throw Error('Fichier NEXT MOVE non reconnu');
  if(!confirm('Restaurer cette sauvegarde remplacera TOUTES les données actuelles de NEXT MOVE sur ce téléphone. Continuer ?'))return;
  db={config:d.config,runs:d.runs,ledger:Array.isArray(d.ledger)?d.ledger:[],wallet:d.wallet,requests:d.requests,homework:d.homework,plans:d.plans,homeworkDates:Array.isArray(d.homeworkDates)?d.homeworkDates:[],homeworkBlocks:Array.isArray(d.homeworkBlocks)?d.homeworkBlocks:[],role:'child'};
  saveDemo();data={...db};role='child';pinUnlocked=false;tab='today';render();toast('✅ Sauvegarde restaurée.');
 }catch(e){toast('Import impossible : '+e.message)}
}
function checkLocalChallenges(){
 if(role!=='child'||document.visibilityState!=='visible')return;
 const day=dayNow(),now=localTime(),minute=minutes(now),dayIdx=dayOf(day),mode=modeFor(day);
 const quiet=(data.config.quiet||[]).some(q=>{
  if(!(q.modes||[]).includes(mode))return false;
  const start=minutes(q.start),end=minutes(q.end);
  if(start<=end)return (q.days||[]).includes(dayIdx)&&minute>=start&&minute<end;
  return minute>=start?(q.days||[]).includes(dayIdx):(q.days||[]).includes((dayIdx+6)%7)&&minute<end;
 });
 if(quiet)return;
 for(const t of tasksFor(day)){
  if(!t.notify||runFor(t.id,day)||Math.abs(minute-minutes(t.time))>0)continue;
  const key='nm_local_notice_'+day+'_'+t.id;
  if(localStorage.getItem(key))continue;
  localStorage.setItem(key,'1');
  toast('⚡ DÉFI NEXT MOVE : '+t.title+' — À toi de jouer !');beep(740,.1);
 }
}
function clockTick(){const el=$('#timer-num');if(!el)return;const taskId=el.dataset.task,t=tasksFor(activeDay).find(x=>x.id===taskId),r=runFor(taskId,activeDay);if(!t||!r||r.status!=='running')return;
 const remaining=t.minutes*60-Math.floor((Date.now()-r.started_at)/1000);el.textContent=(remaining<0?'+':'')+pretty(remaining);el.classList.toggle('overtime',remaining<0);
 const cap=$('#timer-caption');if(cap)cap.textContent=remaining<0?'DÉPASSEMENT · MISSION TOUJOURS ACTIVE':'TEMPS RESTANT';const progress=$('#timer-progress');if(progress)progress.style.width=Math.min(100,Math.max(0,100*(1-remaining/(t.minutes*60))))+'%';}
async function onForm(event){const form=event.target;if(!form.id)return;event.preventDefault();const f=new FormData(form),get=name=>String(f.get(name)||'').trim();try{
 if(form.id==='hw-add-date'){
  const due=get('due'),count=Number(get('count'));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(due)||!Number.isFinite(Date.parse(due+'T12:00:00Z')))throw Error('Choisis une date valide');
  if(!Number.isInteger(count)||count<1||count>60)throw Error('Indique entre 1 et 60 devoirs');
  const old=db.homeworkDates.find(x=>x.due===due);if(old)old.count=count;else db.homeworkDates.push({due,count});
  hwPersist();toast('Devoirs enregistrés');
 }
 else if(form.id==='hw-set-count'){
  const due=form.dataset.due,count=Number(get('count'));
  if(!Number.isInteger(count)||count<0||count>60)throw Error('Nombre invalide');
  const old=db.homeworkDates.find(x=>x.due===due);if(!old)throw Error('Date introuvable');
  if(count===0)db.homeworkDates=db.homeworkDates.filter(x=>x.due!==due);else old.count=count;
  closeModal();hwPersist();
 }
 else if(form.id==='hw-rules'){
  if(role!=='parent'||!pinUnlocked)throw Error('Accès parent requis');
  const c=cloneConfig(),rules={};
  for(const [key,max] of [['xpPer',30],['coinsPer',20],['advancePer',6],['volumePer',10]]){
   const value=Number(get(key));if(!Number.isInteger(value)||value<0||value>max)throw Error('Barème invalide');
   rules[key]=value;
  }
  c.homeworkRules=rules;await updateConfig(c);
 }
 else if(form.id==='hw-finish'){
  const b=(db.homeworkBlocks||[]).find(x=>x.id===form.dataset.id);
  if(!b)throw Error('Bloc introuvable');
  const actual=b.items.map(x=>{
   const count=Number(get('done-'+x.due));
   if(!Number.isInteger(count)||count<0||count>x.count)throw Error('Vérifie le nombre terminé');
   return {due:x.due,count};
  });
  if(!hwSum(actual))throw Error('Indique au moins un devoir terminé');
  const result=await call('/run/finish','POST',{taskId:b.id,day:b.day,actual});
  closeModal();await refresh(true);homeworkDraft.manualEstimate=false;
  if(result.status==='pending_parent')toast('Bloc terminé · en attente de validation');
  else celebration('Bloc validé · +'+result.points.xp+' XP !');
 }
 else if(form.id==='category-form'){const c=cloneConfig(),name=get('categoryName');if(!name)throw Error('Nom manquant');if(!Array.isArray(c.categories))c.categories=[...CATEGORY];const idx=form.dataset.id;if(idx===''){if(c.categories.length>=20)throw Error('Maximum 20 catégories');c.categories.push(name)}else c.categories[Number(idx)]=name;closeModal();await updateConfig(c)}
 else if(form.id==='task-form'){const c=cloneConfig(),identifier=form.dataset.id||rand(),old=c.tasks.find(x=>x.id===identifier)||{};
  const t={...old,id:identifier,title:get('title'),category:Number(get('category')),time:get('time'),minutes:Number(get('minutes')),priority:Number(get('priority')),validation:get('validation'),carry:get('carry'),days:f.getAll('days').map(Number),modes:f.getAll('modes'),steps:get('steps').split('\n').map(x=>x.trim()).filter(Boolean),enabled:f.has('enabled'),notify:f.has('notify'),locked:f.has('locked'),deadline:get('deadline'),xpBase:Number(get('xpBase')),xpSpeed:Number(get('xpSpeed')),xpInitiative:Number(get('xpInitiative')),coinsBase:Number(get('coinsBase')),coinsSpeed:Number(get('coinsSpeed')),coinsInitiative:Number(get('coinsInitiative'))};
  if(!t.title||!t.days.length||!t.modes.length)throw Error('Nom, jours et périodes obligatoires');c.tasks=c.tasks.filter(x=>x.id!==identifier);c.tasks.push(t);closeModal();await updateConfig(c)}
 else if(form.id==='reward-form'){const c=cloneConfig(),identifier=form.dataset.id||rand(),old=c.rewards.find(x=>x.id===identifier)||{};c.rewards=c.rewards.filter(x=>x.id!==identifier);c.rewards.push({...old,id:identifier,name:get('name'),icon:get('icon'),cost:Number(get('cost')),active:f.has('active')});closeModal();await updateConfig(c)}
 else if(form.id==='homework-form'){const body={subject:get('subject'),day:get('day'),due:get('day'),estimate:Number(get('estimate')),details:get('details')};await call('/homework','POST',body);closeModal();await refresh(true);toast('Matière ajoutée au planning')}
 else if(form.id==='period-form'){const c=cloneConfig();if(get('end')<get('start'))throw Error('Dates inversées');c.periods.push({id:rand(),name:get('name'),start:get('start'),end:get('end'),mode:get('mode')});closeModal();await updateConfig(c)}
 else if(form.id==='quiet-form'){const c=cloneConfig();c.quiet.push({id:rand(),start:get('start'),end:get('end'),days:f.getAll('days').map(Number),modes:f.getAll('modes')});closeModal();await updateConfig(c)}
 else if(form.id==='exception-form'){const c=cloneConfig(),common={id:rand(),day:get('day')};c.exceptions.push(get('kind')==='hide'?{...common,hideTaskId:get('taskId')}:{...common,taskId:get('taskId'),changes:{time:get('time')}});closeModal();await updateConfig(c)}
 else if(form.id==='challenge-form'){const c=cloneConfig();c.customChallenges.push({id:rand(),name:get('name'),description:get('description'),coins:Number(get('coins'))});closeModal();await updateConfig(c)}
 else if(form.id==='autonomy-form'){const c=cloneConfig();c.rankMode=Number(get('rankMode'));closeModal();await updateConfig(c)}
 else if(form.id==='penalty-form'){if(!confirm('Appliquer réellement cette pénalité en pièces ?'))return;const r=await call('/penalty','POST',{taskId:get('taskId'),day:get('day'),coins:Number(get('coins'))});closeModal();await refresh(true);toast(`Retrait confirmé : ${r.deducted} pièce(s)`)}
 }catch(e){toast('Erreur : '+e.message)}}
async function bootstrap(){
 if('serviceWorker' in navigator)try{serviceWorker=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'})}catch(e){console.warn('Service worker',e)}
 await activateFirebase();
 document.addEventListener('click',async event=>{
  if(event.target.dataset.backdrop==='true'){closeModal();return}
  const target=event.target.closest('[data-action]');if(!target)return;
  event.preventDefault();const action=actions[target.dataset.action];if(action)try{await action(event,target)}catch(e){toast('Erreur : '+e.message)}
 });
 document.addEventListener('submit',onForm);
 document.addEventListener('change',async e=>{if(e.target.id==='backup-import')await restoreBackup(e.target.files?.[0]);if(e.target.id==='hw-duration'){const x=Number(e.target.value);if(Number.isInteger(x)&&x>=5&&x<=240){homeworkDraft.estimate=x;homeworkDraft.manualEstimate=true;render();}}});
 setInterval(clockTick,1000);
 setInterval(checkLocalChallenges,15000);
 setInterval(async()=>{if(connected&&navigator.onLine&&initDone&&data.paired){await refresh(true);storeCache()}},30000);
 window.addEventListener('online',async()=>{online=true;await flushOffline();await refresh(true)});
 window.addEventListener('offline',()=>{online=false;toast('Mode hors ligne : les défis restent accessibles')});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&role==='parent'){role='child';pinUnlocked=false;tab='today';render();}else if(document.visibilityState==='visible'){checkLocalChallenges();}});
 // La permission notification est demandée uniquement après un clic volontaire de Mahé.

}
bootstrap();
})();