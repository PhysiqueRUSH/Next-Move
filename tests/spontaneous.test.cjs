const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const nodeCrypto=require('node:crypto');
const pin='1234';
const pinHash=nodeCrypto.createHash('sha256').update('NEXT MOVE LOCAL PIN v1'+pin).digest('hex');
let source=fs.readFileSync('app.js','utf8');
const end=/bootstrap\(\);\s*\}\)\(\);\s*$/;
assert.match(source,end);
source=source.replace(end,"globalThis.__t={db,task,dayNow,dayOf,modeFor,futureDate,spontaneousCount,spontaneousStreakInfo,spontaneousWeekStart,spontaneousAwardsFor,spontaneousTasksFor,spontaneousCompleted,renderSpontaneousPanel,renderChallenges,renderToday,renderPlanning,renderChild,renderAdminSettings,tasksFor,demoCall,resetState,setData:()=>{data={...db}},currentDb:()=>db};\n})();");
const storage=new Map([['nextmove_parent_pin_v1',pinHash]]);
const localStorage={getItem:key=>storage.get(key)??null,setItem:(key,v)=>storage.set(key,String(v)),
 removeItem:key=>storage.delete(key),key:i=>[...storage.keys()][i]??null,get length(){return storage.size}};
let seq=0;
const ctx={console,Intl,Date,Math,JSON,Array,Set,Map,Number,String,Promise,TextEncoder,localStorage,
 navigator:{onLine:true},crypto:{randomUUID:()=>String(++seq).padStart(8,'0'),subtle:nodeCrypto.webcrypto.subtle}};
vm.createContext(ctx);vm.runInContext(source,ctx,{filename:'app.js'});
const t=ctx.__t;
const allDays=[0,1,2,3,4,5,6],allModes=['school','weekend','vacation'];
async function main(){
 const today=t.dayNow();
 const spontan=t.task('sp-test','Aider spontanément',6,'12:00',10,allDays,{modes:allModes,enabled:true,spontaneous:true,
  scheduleMode:'flexible',hasTimeLimit:false,validation:'self',xpMax:8,coinsMax:2});
 t.db.config.tasks.push(spontan);
 t.setData();
 assert.ok(!t.tasksFor(today).some(x=>x.id==='sp-test'),'A spontaneous task must not block the next timed mission');
 assert.ok(t.spontaneousTasksFor(today).some(x=>x.id==='sp-test'));
 assert.match(t.renderSpontaneousPanel(today),/Sans chrono/);
 assert.match(t.renderSpontaneousPanel(today),/FAIT/);
 assert.match(t.renderToday(),/Missions spontanées/);
 assert.match(t.renderPlanning(),/🎯 Missions/);
 assert.match(t.renderChild(),/🎯 Missions/,'The child home is now the agenda, not the old mission hero');
 assert.match(t.renderPlanning(),/Missions spontanées/,'Spontaneous missions remain in the unified tab');
 assert.doesNotMatch(t.renderPlanning(),/TA PROCHAINE MISSION/);
 assert.match(t.renderChallenges(),/Triple action/);

 const results=[];
 for(let i=0;i<3;i++)results.push(await t.demoCall('/spontaneous/complete','POST',{taskId:'sp-test'}));
 t.setData();
 assert.equal(new Set(results.map(r=>r.runId)).size,3,'Each completion has an independent run id');
 assert.equal(t.spontaneousCount(today,'sp-test'),3,'Task can be completed more than once a day');
 assert.equal(t.db.wallet.xp,3*8+15,'Three spontaneous completions and one daily challenge');
 assert.equal(t.db.wallet.coins,3*2+5);
 assert.equal(t.db.spontaneousAwards.filter(x=>x.ruleId==='day3').length,1);
 assert.match(t.renderSpontaneousPanel(today),/3 fois/);
 await t.demoCall('/spontaneous/complete','POST',{taskId:'sp-test'});t.setData();
 assert.equal(t.db.spontaneousAwards.filter(x=>x.ruleId==='day3').length,1,'Daily challenge is not awarded twice');
 for(let i=4;i<10;i++)await t.demoCall('/spontaneous/complete','POST',{taskId:'sp-test'});
 t.setData();
 assert.equal(t.spontaneousCount(today,'sp-test'),10);
 assert.equal(t.db.spontaneousAwards.filter(x=>x.ruleId==='week10').length,1,'Weekly challenge awarded at 10');
 assert.ok(t.renderChallenges().includes('GAGNÉ'));
 await t.demoCall('/spontaneous/complete','POST',{taskId:'sp-test'});t.setData();
 assert.equal(t.db.spontaneousAwards.filter(x=>x.ruleId==='week10').length,1,'Weekly challenge not farmable');

 const oldDay=t.futureDate(today,-2),yesterday=t.futureDate(today,-1);
 for(const day of [oldDay,yesterday]){
  t.db.runs.push({id:'past-'+day,task_id:'sp-test',spontaneous:true,day,status:'complete',xp:8,coins:2});
 }
 t.setData();
 await t.demoCall('/spontaneous/complete','POST',{taskId:'sp-test'});t.setData();
 assert.equal(t.db.spontaneousAwards.filter(x=>x.ruleId==='streak3').length,1,'3 consecutive days are rewarded');
 await t.demoCall('/spontaneous/complete','POST',{taskId:'sp-test'});t.setData();
 assert.equal(t.db.spontaneousAwards.filter(x=>x.ruleId==='streak3').length,1,'Streak cannot be rewarded repeatedly in one run');
 for(let daysBack=3;daysBack<=6;daysBack++){
  const day=t.futureDate(today,-daysBack);
  t.db.runs.push({id:'past7-'+day,task_id:'sp-test',spontaneous:true,day,status:'complete'});
 }
 t.setData();
 await t.demoCall('/spontaneous/complete','POST',{taskId:'sp-test'});t.setData();
 assert.equal(t.db.spontaneousAwards.filter(x=>x.ruleId==='streak7').length,1,'Seven-day streak bonus awarded once');

 const needsParent=t.task('sp-parent','Rendre un service',6,'18:00',5,allDays,{modes:allModes,enabled:true,spontaneous:true,
  scheduleMode:'flexible',hasTimeLimit:false,validation:'parent',xpMax:6,coinsMax:3});
 t.db.config.tasks.push(needsParent);t.setData();
 const walletBefore={...t.db.wallet},completedBefore=t.spontaneousCount(today);
 const a=await t.demoCall('/spontaneous/complete','POST',{taskId:'sp-parent'});
 const b=await t.demoCall('/spontaneous/complete','POST',{taskId:'sp-parent'});
 assert.equal(a.status,'pending_parent');assert.equal(b.status,'pending_parent');
 assert.notEqual(a.runId,b.runId);
 assert.equal(t.db.wallet.xp,walletBefore.xp);
 assert.equal(t.db.wallet.coins,walletBefore.coins);
 t.setData();
 assert.equal(t.spontaneousCount(today),completedBefore,'Pending work does not count for challenge');
 assert.match(t.renderSpontaneousPanel(today),/2 à valider/);
 assert.match(t.renderSpontaneousPanel(today),/Faire valider \(2\)/);
 assert.match(t.renderSpontaneousPanel(today),/open-run-approval/);
 await assert.rejects(t.demoCall('/run/approve','POST',{id:a.runId,approve:true}),/Code PIN/i);
 const ok=await t.demoCall('/run/approve','POST',{id:a.runId,approve:true,pin});
 assert.equal(ok.status,'complete');t.setData();
 assert.equal(t.spontaneousCount(today),completedBefore+1);
 assert.equal(t.db.wallet.xp,walletBefore.xp+6);
 assert.equal(t.db.wallet.coins,walletBefore.coins+3);
 await assert.rejects(t.demoCall('/run/approve','POST',{id:a.runId,approve:true,pin}),/validation/);
 await t.demoCall('/run/approve','POST',{id:b.runId,approve:false,pin});t.setData();
 assert.equal(t.spontaneousCount(today),completedBefore+1,'Rejected action is not counted');

 const unavailable=t.task('sp-hidden','Invisible',1,'09:00',10,[],{modes:allModes,enabled:true,spontaneous:true});
 t.db.config.tasks.push(unavailable);t.setData();
 await assert.rejects(t.demoCall('/spontaneous/complete','POST',{taskId:'sp-hidden'}),/pas disponible/);
 assert.match(t.renderAdminSettings(),/Défis de fréquence et de régularité/);
 const keptTasks=t.db.config.tasks.length;
 t.resetState('progress');
 assert.equal(t.currentDb().spontaneousAwards.length,0,'Reset progress clears earned spontaneous bonuses');
 assert.equal(t.currentDb().config.tasks.length,keptTasks,'Reset progress preserves task settings');
 console.log('Spontaneous mission repeatability, validation, streaks, and reward idempotency: PASSED');
}
main().catch(err=>{console.error(err);process.exitCode=1});