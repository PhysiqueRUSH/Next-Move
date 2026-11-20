
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const nodeCrypto=require('node:crypto');
const pin='1234';
const pinHash=nodeCrypto.createHash('sha256').update('NEXT MOVE LOCAL PIN v1'+pin).digest('hex');
let source=fs.readFileSync('app.js','utf8');
const end=/bootstrap\(\);\s*\}\)\(\);\s*$/;
assert.match(source,end);
source=source.replace(end,"globalThis.__test={db,task,dayNow,dayOf,taskReward,hwReward,homeworkCaps,taskMaximum,scheduleMode,taskHasLimit,goalPreview,levelInfo,levelCoins,applyLevelRewards,runFor,demoCall,resetState,renderToday,renderProfile,renderAdminSettings,renderAdminStats,renderHomework,renderPlanning,tasksFor,getActive,LEVEL_REWARDS,LEVEL_MILESTONES,setData:()=>{data={...db}},currentDb:()=>db};\n})();");
const storage=new Map();
const localStorage={
 getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),
 removeItem:k=>storage.delete(k),key:n=>[...storage.keys()][n]??null,
 get length(){return storage.size}
};
let n=0;
storage.set('nextmove_parent_pin_v1',pinHash);
const ctx={console,Intl,Date,Math,JSON,Array,Set,Map,Number,String,Promise,localStorage,
 navigator:{onLine:true},crypto:{randomUUID:()=>String(++n).padStart(8,'0'),subtle:nodeCrypto.webcrypto.subtle},TextEncoder};
vm.createContext(ctx);vm.runInContext(source,ctx,{filename:'app.js'});
const t=ctx.__test;
async function main(){
 const normal=t.task('speed-test','Rangement',3,'12:00',10,[0,1,2,3,4,5,6],{modes:['school','weekend','vacation'],maxMinutes:15});
 const screenshotTask=t.task('ready-test','Habillage + dents',0,'06:40',18,[0,1,2,3,4,5,6],{xpMax:40,coinsMax:15,maxMinutes:27,hasTimeLimit:true});
 const perfect=t.taskReward(screenshotTask,5,27,5*60,0);
 const delayed=t.taskReward(screenshotTask,5,27,5*60,60);
 assert.equal(perfect.xp,40,'Full 40 XP must be realistically reachable in five minutes with on-time start');
 assert.equal(perfect.coins,15,'Full 15 coins must be realistically reachable with on-time start');
 assert.equal(delayed.xp,36,'Late start reduces reachable cap to 36 XP');
 assert.equal(delayed.coins,14,'Late start reduces reachable coins to 14');
 assert.equal(t.taskReward(screenshotTask,5,27,60,0).xp,40,'Faster than full-speed threshold stays capped, no impossible asymptote');
 assert.equal(t.taskReward(screenshotTask,5,27,60,0).coins,15,'Faster action cannot exceed maximum coins');
 assert.equal(t.taskReward(screenshotTask,5,27,5*60,30).xp,40,'The one-minute start grace counts as on time');
 assert.ok(t.taskReward(screenshotTask,5,27,8*60,0).xp<40,'Missing the chosen personal goal must reduce the reward');
 assert.match(t.goalPreview(screenshotTask,5),/Termine en/,'Preview explains how to win maximum');
 assert.match(t.goalPreview(screenshotTask,5),/40 XP et 15 pièces|40 XP · 15/,'The exact attainable maximum appears in the preview');

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
 assert.ok(t.hwReward(items,60,5401,t.dayNow()).xp>0,'Homework has no hard time cutoff');
 assert.ok(t.hwReward(items,60,5401,t.dayNow()).coins>0,'Homework can still earn coins when slow');
 assert.ok(t.hwReward(items,60,10,t.dayNow()).xp<=3*t.homeworkCaps().xp,'Per homework XP cap is respected');
 assert.ok(t.hwReward(items,60,10,t.dayNow()).coins<=3*t.homeworkCaps().coins,'Per homework coin cap is respected');

 t.db.config.tasks.push(normal);
 t.setData();
 const day=t.dayNow();
 await assert.rejects(t.demoCall('/run/start','POST',{taskId:'speed-test',day,goalMinutes:16}),/Objectif de temps invalide/);
 const created=await t.demoCall('/run/start','POST',{taskId:'speed-test',day,goalMinutes:10});
 assert.equal(created.run.goal_minutes,10);
 assert.equal(created.run.max_minutes,15);
 assert.equal(created.run.status,'running');
 assert.deepEqual({...created.run.reward_caps},{xp:45,coins:15},'Start captures parent reward caps');
 normal.xpMax=500;normal.coinsMax=500;
 t.setData();
 // End with a plausible faster run
 created.run.started_at=Date.now()-2*60*1000;
 created.run.planned_at=created.run.started_at;
 const finish=await t.demoCall('/run/finish','POST',{taskId:'speed-test',day});
 assert.equal(finish.status,'complete');
 assert.ok(finish.points.xp>0);
 assert.ok(finish.points.xp<=45&&finish.points.coins<=15,'Later cap changes cannot affect a started run');
 normal.xpMax=45;normal.coinsMax=15;t.setData();

 const free=t.task('free-test','Lecture libre',7,'18:00',12,[0,1,2,3,4,5,6],{modes:['school','weekend','vacation'],maxMinutes:5,hasTimeLimit:false,scheduleMode:'flexible',xpMax:22,coinsMax:8});
 assert.equal(t.scheduleMode(free),'flexible');
 assert.equal(t.taskHasLimit(free),false);
 assert.ok(t.taskReward(free,30,5,6000,999).xp>0,'Unlimited tasks earn XP when slow');
 assert.ok(t.taskReward(free,30,5,6000,999).coins>0,'Unlimited tasks earn coins when slow');
 assert.ok(t.taskReward(free,30,5,1,0).xp<=22,'Task XP cannot exceed parent cap');
 assert.ok(t.taskReward(free,30,5,1,0).coins<=8,'Task coins cannot exceed parent cap');
 t.db.config.tasks.push(free);t.setData();
 const freeRun=await t.demoCall('/run/start','POST',{taskId:'free-test',day,goalMinutes:30});
 assert.equal(freeRun.run.max_minutes,null,'Unlimited task has no max time');
 assert.equal(freeRun.run.planned_at,freeRun.run.started_at,'Free schedule has no start delay');
 freeRun.run.started_at=Date.now()-7000*1000;
 assert.match(t.renderPlanning(),/À heure fixe/);
 assert.match(t.renderPlanning(),/Quand je veux/);
 assert.match(t.goalPreview(free,30),/Aucune limite de temps/);
 const freeFinish=await t.demoCall('/run/finish','POST',{taskId:'free-test',day});
 assert.equal(freeFinish.penaltyPending,false,'Unlimited task must never be penalized');
 assert.ok(freeFinish.points.xp>0,'Unlimited actual run still yields XP');

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
 await t.demoCall('/run/penalty-resolve','POST',{id:over.run.id,approve:true,pin});
 assert.equal(over.run.penaltyDecision,'approved');
 assert.equal(t.db.wallet.xp,Math.max(0,walletBefore.xp-5));
 assert.equal(t.db.wallet.coins,Math.max(0,walletBefore.coins-3));
 await assert.rejects(t.demoCall('/run/penalty-resolve','POST',{id:over.run.id,approve:true}),/introuvable/);


 assert.equal(t.LEVEL_REWARDS.avatar.length>=25,true,'Large avatar catalog');
 assert.equal(t.LEVEL_REWARDS.frame.length>=10,true,'Varied frame collection');
 assert.equal(t.LEVEL_REWARDS.title.length>=20,true,'Varied title collection');
 assert.equal(t.LEVEL_MILESTONES.length>=10,true,'Extra level medals');
 assert.match(t.renderProfile(),/Récompenses de niveaux/);
 assert.match(t.renderHomework(),/Mon bloc/);
 assert.match(t.renderToday(),/mission|Rien de prévu|défis/i);
 assert.match(t.renderAdminSettings(),/Gains maximum par devoir/);
 assert.match(t.renderAdminSettings(),/Les tâches sans limite/);
 assert.match(t.goalPreview(normal,10),/En 10 min/);
 assert.match(t.renderAdminSettings(),/Effacer et recommencer/);
 assert.match(t.renderAdminStats(),/Dépassements à examiner/);
 const originalXp=t.db.wallet.xp;
 t.db.wallet.xp=150;t.db.claimedLevels=[1];t.setData();
 const first=t.applyLevelRewards(),again=t.applyLevelRewards();
 assert.ok(first>0,'New level gives coins');
 assert.equal(again,0,'Level reward may only be earned once');
 t.db.wallet.xp=originalXp;t.setData();
 
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
