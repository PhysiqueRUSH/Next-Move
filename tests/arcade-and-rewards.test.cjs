const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const nodeCrypto=require('node:crypto');
const pin='1234',pinHash=nodeCrypto.createHash('sha256').update('NEXT MOVE LOCAL PIN v1'+pin).digest('hex');
let source=fs.readFileSync('app.js','utf8');
const closing=/bootstrap\(\);\s*\}\)\(\);\s*$/;
assert.match(source,closing,'App bootstrap marker');
source=source.replace(closing,"globalThis.__t={APP_VERSION,db,task,dayNow,dayOf,modeFor,demoCall,renderShop,renderChallenges,renderProfile,renderAdminStats,renderAdminSettings,ARCADE_GAMES,LEVEL_REWARDS,ACHIEVEMENTS,achievementProgress,awardAchievements,applyLevelRewards,availableArcadeGames,resetState,setData:()=>{data={...db}},currentDb:()=>db};\n})();");
const store=new Map([['nextmove_parent_pin_v1',pinHash]]);
let seq=0;
const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),
 removeItem:k=>store.delete(k),key:i=>[...store.keys()][i]||null,get length(){return store.size}};
const env={console,Intl,Date,Math,JSON,Array,Set,Map,Number,String,Promise,TextEncoder,localStorage,
 navigator:{onLine:true},crypto:{randomUUID:()=>String(++seq).padStart(8,'0'),subtle:nodeCrypto.webcrypto.subtle}};
vm.createContext(env);
vm.runInContext(source,env,{filename:'app.js'});
const t=env.__t;
const read=x=>JSON.parse(JSON.stringify(x));
async function main(){
 assert.equal(t.APP_VERSION,'5.0.0');
 assert.equal(t.ARCADE_GAMES.length,10);
 assert.equal(new Set(t.ARCADE_GAMES.map(x=>x.id)).size,10,'Game IDs unique');
 assert.equal(t.db.config.rewards.filter(r=>r.id==='arcade-random').length,1,'Game gift added once');
 const sorted=t.db.config.rewards.slice().sort((a,b)=>a.cost-b.cost).map(x=>x.id);
 const html=t.renderShop();
 let last=-1;
 for(const id of sorted){const position=html.indexOf('data-id="'+id+'"');if(position>=0){assert.ok(position>last,'Gifts sorted ascending by cost');last=position;}}
 assert.match(html,/Mini-jeu surprise/);
 assert.match(t.renderChallenges(),/Mini-jeux/);

 const startCoins=t.db.wallet.coins;
 await assert.rejects(t.demoCall('/coins/adjust','POST',{delta:30}),/Code PIN/i);
 assert.equal(t.db.wallet.coins,startCoins);
 const a=await t.demoCall('/coins/adjust','POST',{delta:250,pin,reason:'Départ'});
 assert.equal(a.adjustment.delta,250);
 assert.equal(t.db.wallet.coins,startCoins+250);
 const b=await t.demoCall('/coins/adjust','POST',{delta:-1000,pin,reason:'Test malus'});
 assert.equal(b.adjustment.delta,-(startCoins+250),'Malus stops at zero');
 assert.equal(t.db.wallet.coins,0);
 assert.equal(t.db.coinLedger.length,2);
 await t.demoCall('/coins/adjust','POST',{delta:2200,pin});
 assert.equal(t.db.wallet.coins,2200);

 const day=t.dayNow();
 const task=t.task('v5task','Défi test',1,'12:00',10,[t.dayOf(day)],{enabled:true,modes:[t.modeFor(day)],maxMinutes:20,validation:'parent'});
 t.db.config.tasks.push(task);t.setData();
 const run=await t.demoCall('/run/start','POST',{taskId:task.id,day,goalMinutes:10});
 run.run.started_at=Date.now()-3*60*1000;run.run.planned_at=run.run.started_at;
 const finish=await t.demoCall('/run/finish','POST',{taskId:task.id,day});
 assert.equal(finish.status,'pending_parent');
 const before=t.db.wallet.coins;
 await assert.rejects(t.demoCall('/run/approve','POST',{id:run.run.id,approve:true,pin:'9999',coinsAdjustment:25}),/PIN|incorrect/i);
 assert.equal(t.db.wallet.coins,before);
 const approval=await t.demoCall('/run/approve','POST',{id:run.run.id,approve:true,pin,coinsAdjustment:25,reason:'Excellent effort'});
 assert.equal(approval.coinAdjustment.delta,25);
 assert.equal(t.db.coinLedger[0].runId,run.run.id);
 assert.equal(approval.status,'complete');
 assert.ok(t.db.wallet.coins>=before+25);
 await assert.rejects(t.demoCall('/run/approve','POST',{id:run.run.id,approve:true,pin,coinsAdjustment:25}),/validation/);
 assert.equal(t.db.coinLedger.filter(x=>x.runId===run.run.id).length,1,'No repeated parent bonus');

 const gameGift=t.db.config.rewards.find(r=>r.id==='arcade-random');
 const bought=[];
 for(let i=0;i<10;i++){
  const asked=await t.demoCall('/reward/request','POST',{rewardId:gameGift.id});
  assert.equal(asked.request.status,'pending');
  await assert.rejects(t.demoCall('/reward/resolve','POST',{requestId:asked.request.id,approve:true,pin:'9999'}),/PIN|incorrect/i);
  const approved=await t.demoCall('/reward/resolve','POST',{requestId:asked.request.id,approve:true,pin});
  assert.ok(approved.game&&approved.game.id);
  assert.equal(t.db.requests.find(r=>r.id===asked.request.id).grantedGameId,approved.game.id);
  assert.ok(!bought.includes(approved.game.id),'Never unlock an already owned game');
  bought.push(approved.game.id);
 }
 assert.equal(bought.length,10);
 assert.equal(new Set(bought).size,10);
 assert.equal(t.availableArcadeGames().length,0);
 await assert.rejects(t.demoCall('/reward/request','POST',{rewardId:gameGift.id}),/mini-jeu disponible/);
 t.setData();
 assert.match(t.renderShop(),/Collection complète/);
 assert.equal((t.renderChallenges().match(/data-action="play-game"/g)||[]).length,10);
 assert.match(t.renderAdminStats(),/Bonus \/ malus/);

 const achievementsBefore=t.db.achievementAwards.length;
 for(let i=0;i<5;i++)t.db.runs.push({id:'achievement-run-'+i,day,task_id:'another',status:'complete',xp:0,coins:0});
 const bonus=t.awardAchievements();
 assert.ok(bonus.length>=1,'Validated milestones award bonus XP and coins');
 const count=t.db.achievementAwards.length;
 assert.ok(count>achievementsBefore);
 assert.equal(t.awardAchievements().length,0,'Achievements cannot pay twice');
 assert.equal(t.db.achievementAwards.length,count);
 t.setData();
 assert.match(t.renderChallenges(),/Défis à récompenses/);
 assert.ok(t.LEVEL_REWARDS.avatar.length>30);
 assert.ok(t.LEVEL_REWARDS.frame.length>18);
 assert.ok(t.LEVEL_REWARDS.title.length>30);
 assert.ok(t.LEVEL_REWARDS.effect.length>=10);
 await assert.rejects(t.demoCall('/customize','POST',{kind:'effect',value:'master'}),/débloqué/);
 t.db.achievementAwards.push({id:'days7'});t.setData();
 const effect=await t.demoCall('/customize','POST',{kind:'effect',value:'master'});
 assert.equal(t.db.config.effect,'master');
 t.resetState('progress');
 assert.equal(t.currentDb().unlockedGames.length,0);
 assert.equal(t.currentDb().achievementAwards.length,0);
 assert.equal(t.currentDb().coinLedger.length,0);
 assert.equal(t.currentDb().wallet.coins,0);
 console.log('NEXT MOVE 5 economy, arcade gifts, achievements, personalization: PASSED');

 // Mount all ten browser engines through a minimal DOM emulator (no live timers).
 const sourceGame=fs.readFileSync('mini-games.js','utf8');
 const timerIds=new Set();let timer=0;
 function node(){
  const obj={innerHTML:'',dataset:{},style:{},className:'',classList:{add(){},remove(){}},
   appendChild(){},addEventListener(){},removeEventListener(){},getBoundingClientRect(){return {left:0,width:320}},
   getContext(){const fn=()=>{};return {fillRect:fn,beginPath:fn,arc:fn,fill:fn,stroke:fn,moveTo:fn,lineTo:fn,setLineDash:fn,fillText:fn};}};
  obj.querySelector=()=>node();return obj;
 }
 const gameEnv={console,Math,Date,Array,Set,Map,Number,String,Intl,localStorage,window:node(),
  document:{createElement:()=>node()},setInterval:()=>{const id=++timer;timerIds.add(id);return id},
  clearInterval:id=>timerIds.delete(id),setTimeout:()=>{const id=++timer;timerIds.add(id);return id},
  clearTimeout:id=>timerIds.delete(id)};
 vm.createContext(gameEnv);
 vm.runInContext(sourceGame,gameEnv,{filename:'mini-games.js'});
 const arcade=gameEnv.NEXT_MOVE_ARCADE;
 assert.ok(arcade&&typeof arcade.mount==='function');
 assert.equal(arcade.games.length,10);
 assert.deepEqual(arcade.games.map(g=>g.id),t.ARCADE_GAMES.map(g=>g.id),'Catalogue and engines consistent');
 for(const game of arcade.games){arcade.mount(game.id,node());arcade.stop();}
 assert.equal(timerIds.size,0,'Game intervals and delays cleaned up on close');
 console.log('Ten playable game engines mount and clean up: PASSED');
}
main().catch(e=>{console.error(e);process.exitCode=1});