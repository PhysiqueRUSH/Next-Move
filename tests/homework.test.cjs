
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const nodeCrypto=require('node:crypto');
const pin='1234';
const pinHash=nodeCrypto.createHash('sha256').update('NEXT MOVE LOCAL PIN v1'+pin).digest('hex');

let source=fs.readFileSync('app.js','utf8');
const closing=/bootstrap\(\);\s*\}\)\(\);\s*$/;
assert.match(source,closing,'Application bootstrap marker should exist');
source=source.replace(closing, "globalThis.__test={db,dayNow,futureDate,hwReward,hwSpeedPreviewHtml,hwSum,hwAvailable,hwApplyCompleted,tasksFor,runFor,demoCall,setData:()=>{data={...db}}};\n})();");
const store=new Map();
let uid=0;
store.set('nextmove_parent_pin_v1',pinHash);
const context={
 console,Intl,Date,Math,JSON,Array,Set,Map,Number,String,Promise,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
 navigator:{onLine:true},
 crypto:{randomUUID:()=>String(++uid).padStart(8,'0'),subtle:nodeCrypto.webcrypto.subtle},TextEncoder,
};
vm.createContext(context);
vm.runInContext(source,context,{filename:'app.js'});
const t=context.__test;
const plain=value=>JSON.parse(JSON.stringify(value));

async function test(){
 const today=t.dayNow(), due=t.futureDate(today,5);
 assert.ok(t.hwReward([{due,count:2}],20,20*60,today).xp>t.hwReward([{due:today,count:2}],20,20*60,today).xp,'Advance should earn more');
 assert.ok(t.hwReward([{due,count:3}],30,40*60,today).xp>t.hwReward([{due,count:1}],30,40*60,today).xp,'Volume should earn more');
 assert.equal(t.hwReward([{due,count:2}],20,20*60,today).fast,true);
 assert.equal(t.hwReward([{due,count:2}],20,21*60,today).fast,false);
 const examples=[20,15,10,5].map(min=>t.hwReward([{due,count:3}],20,min*60,today));
 for(let i=1;i<examples.length;i++){
  assert.ok(examples[i].xp>examples[i-1].xp,'XP increase for every faster effort');
  assert.ok(examples[i].coins>examples[i-1].coins,'Coins increase progressively with greater speed');
 }
 assert.equal(examples[0].speed,0,'No speed bonus at the goal');
 assert.equal(examples[1].speed,.25,'25% saved time = 25% speed factor');
 assert.equal(examples[2].speed,.5,'50% saved time = 50% speed factor');
 assert.equal(examples[3].speed,.75,'75% saved time = 75% speed factor');
 assert.equal(t.hwReward([{due,count:3}],20,21*60,today).speed,0,'No speed bonus once the self-chosen goal is missed');
 assert.equal(t.hwReward([{due,count:3}],20,21*60,today).fast,false);
 assert.ok(examples[0].xp>t.hwReward([{due,count:3}],20,21*60,today).xp,'Finishing within estimate still earns the deadline bonus');
 assert.ok(t.hwReward([{due,count:3}],20,10*60,today).xp<=3*30,'Parent XP cap remains effective');
 assert.ok(t.hwReward([{due,count:3}],20,10*60,today).coins<=3*10,'Parent coin cap remains effective');
 const preview=t.hwSpeedPreviewHtml([{due,count:3}],20);
 assert.equal((preview.match(/class="hw-speed-row"/g)||[]).length,4,'Four reward scenarios');
 for(const label of ['20 min','15 min','10 min','5 min'])assert.match(preview,new RegExp(label));
 assert.doesNotMatch(preview,/maximum possible|Plafond parental|bonus de vitesse/i,'No prose in visual rewards');
 const shorter=t.hwSpeedPreviewHtml([{due,count:3}],12);
 for(const label of ['12 min','9 min','6 min','3 min'])assert.match(shorter,new RegExp(label),'Estimated time updates all scenarios');
 assert.notEqual(preview,shorter,'Changing estimate changes the visual preview');

 assert.ok(t.hwReward([{due,count:3}],45,45*60,today).xp>3*t.hwReward([{due,count:1}],15,15*60,today).xp,'A larger block should beat three small blocks with the same work');

 t.db.homeworkDates.push({due,count:5});t.setData();
 assert.equal(t.hwAvailable(due),5);
 const b={id:'hb-unit',day:today,time:'17:20',estimate:30,items:[{due,count:2}],validation:'self'};
 t.db.homeworkBlocks.push(b);t.setData();
 assert.equal(t.hwAvailable(due),3,'A planned block reserves homework but does not deduct it');
 const run=await t.demoCall('/run/start','POST',{taskId:b.id,day:today});
 assert.equal(run.run.status,'running');t.setData();
 assert.equal(t.db.homeworkDates[0].count,5,'Start must not mark homework completed');
 const done=await t.demoCall('/run/finish','POST',{taskId:b.id,day:today,actual:[{due,count:1}]});
 assert.equal(done.status,'complete');t.setData();
 assert.equal(t.db.homeworkDates[0].count,4,'Only actual completion should be deducted');
 assert.equal(t.hwAvailable(due),4,'Unfinished homework should return to available pool');
 assert.equal(t.db.wallet.xp,done.points.xp);
 await t.demoCall('/run/finish','POST',{taskId:b.id,day:today,actual:[{due,count:1}]});
 assert.equal(t.db.homeworkDates[0].count,4,'Double finish cannot deduct twice');

 const approval={id:'hb-approval',day:today,time:'17:20',estimate:20,items:[{due,count:2}],validation:'parent'};
 t.db.homeworkBlocks.push(approval);t.setData();
 await t.demoCall('/run/start','POST',{taskId:approval.id,day:today});t.setData();
 const pending=await t.demoCall('/run/finish','POST',{taskId:approval.id,day:today,actual:[{due,count:2}]});t.setData();
 assert.equal(pending.status,'pending_parent');
 assert.equal(t.db.homeworkDates[0].count,4,'Pending validation must not deduct homework yet');
 assert.equal(t.hwAvailable(due),2,'Pending validation reserves selected homework');
 const pendingRun=t.runFor(approval.id,today);
 await t.demoCall('/run/approve','POST',{id:pendingRun.id,approve:true,pin});t.setData();
 assert.equal(t.db.homeworkDates[0].count,2,'Approval deducts the confirmed volume');
 assert.equal(t.hwAvailable(due),2);
 assert.ok(t.db.wallet.xp>done.points.xp,'Approved blocks award points');
 console.log('NEXT MOVE homework blocks: 15 checks passed');
}
test().catch(e=>{console.error(e);process.exitCode=1});
