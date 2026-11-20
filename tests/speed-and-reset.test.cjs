
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
let source=fs.readFileSync('app.js','utf8');
const end=/bootstrap\(\);\s*\}\)\(\);\s*$/;
assert.match(source,end);
source=source.replace(end,"globalThis.__test={db,task,dayNow,dayOf,taskReward,hwReward,homeworkMaximum,taskMaximum,levelInfo,levelCoins,applyLevelRewards,runFor,demoCall,resetState,setData:()=>{data={...db}},currentDb:()=>db};\n})();");
const storage=new Map();
const localStorage={
 getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),
 removeItem:k=>storage.delete(k),key:n=>[...storage.keys()][n]??null,
 get length(){return storage.size}
};
let n=0;
const ctx={console,Intl,Date,Math,JSON,Array,Set,Map,Number,String,Promise,localStorage,
 navigator:{onLine:true},crypto:{randomUUID:()=>String(++n).padStart(8,'0')}};
vm.createContext(ctx);vm.runInContext(source,ctx,{filename:'app.js'});
const t=ctx.__test;
async function main(){
 const normal=t.task('speed-test','Rangement',3,'12:00',10,[0,1,2,3,4,5,6],{modes:['school','weekend','vacation'],maxMinutes:15});
 const fast=t.taskReward(normal,10,15,60,0),slower=t.taskReward(normal,10,15,480,0);
 assert.ok(fast.xp>slower.xp,'Faster mission must earn more XP');
 assert.ok(fast.coins>slower.coins,'Faster mission must earn more coins');
 assert.ok(t.taskReward(normal,10,15,600,0).xp>0,'Work at/below max still rewards');
 assert.equal(t.taskReward(normal,10,15,901,0).xp,0,'Over limit: zero XP');
 assert.equal(t.taskReward(normal,10,15,901,0).coins,0,'Over limit: zero coins');
 const estimateMet=t.taskReward(normal,10,15,510,0),estimateMiss=t.taskReward(normal,8,15,510,0);
 assert.ok(estimateMet.xp>estimateMiss.xp,'Meeting own goal grants bonus');
 const due='2026-12-10',items=[{due,count:3}];
 const hwFast=t.hwReward(items,60,180,t.dayNow(),90),hwSlow=t.hwReward(items,60,3000,t.dayNow(),90);
 assert.ok(hwFast.xp>hwSlow.xp,'Faster homework must earn more XP');
 assert.ok(hwFast.coins>hwSlow.coins,'Faster homework must earn more coins');
 assert.equal(t.hwReward(items,60,5401,t.dayNow(),90).xp,0,'Homework block above max: zero XP');
 assert.equal(t.hwReward(items,60,5401,t.dayNow(),90).coins,0,'Homework block above max: zero coins');
 assert.equal(t.homeworkMaximum(3),90,'Parent per-homework cap multiplies with volume');

 t.db.config.tasks.push(normal);
 t.setData();
 const day=t.dayNow();
 await assert.rejects(t.demoCall('/run/start','POST',{taskId:'speed-test',day,goalMinutes:16}),/limite parentale/);
 const created=await t.demoCall('/run/start','POST',{taskId:'speed-test',day,goalMinutes:10});
 assert.equal(created.run.goal_minutes,10);
 assert.equal(created.run.max_minutes,15);
 assert.equal(created.run.status,'running');
 // End with a plausible faster run
 created.run.started_at=Date.now()-2*60*1000;
 created.run.planned_at=created.run.started_at;
 const finish=await t.demoCall('/run/finish','POST',{taskId:'speed-test',day});
 assert.equal(finish.status,'complete');
 assert.ok(finish.points.xp>0);

 const late=t.task('over-test','Dépassée',3,'12:00',2,[0,1,2,3,4,5,6],{modes:['school','weekend','vacation'],maxMinutes:2});
 t.db.config.tasks.push(late);
 t.db.config.overrunPolicy='propose';t.db.config.overrunXp=5;t.db.config.overrunCoins=3;t.setData();
 const over=await t.demoCall('/run/start','POST',{taskId:'over-test',day,goalMinutes:1});
 over.run.started_at=Date.now()-3*60*1000;
 over.run.planned_at=over.run.started_at;
 const walletBefore={...t.db.wallet};
 const ended=await t.demoCall('/run/finish','POST',{taskId:'over-test',day});
 assert.equal(ended.status,'complete');
 assert.equal(ended.points.xp,0);
 assert.equal(ended.points.coins,0);
 assert.equal(ended.penaltyPending,true);
 assert.deepEqual({...t.db.wallet},walletBefore,'Penalty must NEVER apply before approval');
 await t.demoCall('/run/penalty-resolve','POST',{id:over.run.id,approve:true});
 assert.equal(over.run.penaltyDecision,'approved');
 assert.equal(t.db.wallet.xp,Math.max(0,walletBefore.xp-5));
 assert.equal(t.db.wallet.coins,Math.max(0,walletBefore.coins-3));
 await assert.rejects(t.demoCall('/run/penalty-resolve','POST',{id:over.run.id,approve:true}),/introuvable/);

 const retained=t.db.config.tasks.length;
 t.resetState('progress');
 assert.equal(t.currentDb().config.tasks.length,retained,'Progress reset preserves scheduled tasks');
 assert.equal(t.currentDb().runs.length,0);
 assert.equal(t.currentDb().wallet.xp,0);
 assert.equal(t.currentDb().wallet.coins,0);
 assert.equal(t.currentDb().homeworkBlocks.length,0);
 t.resetState('all');
 assert.equal(t.currentDb().config.tasks.length,0,'Full reset removes all scheduled tasks');
 assert.equal(t.currentDb().config.rewards.length>0,true,'Default reward catalog remains for new setup');
 console.log('NEXT MOVE speed + reset tests passed');
}
main().catch(err=>{console.error(err);process.exitCode=1});
