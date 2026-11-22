/* NEXT MOVE 5 · Arcade hors ligne. Dix mini-jeux originaux en HTML5, sans dépendances. */
(()=>{'use strict';
 const CATALOG=['snake','pong','breakout','tetris','2048','mines','memory','simon','whack','tictactoe'];
 let active=null;
 const rand=n=>Math.floor(Math.random()*n);
 const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=rand(i+1);[b[i],b[j]]=[b[j],b[i]];}return b};
 function stop(){if(active){active.dispose();active=null;}}
 function ctx(root,id){
  const dispose=[],c={
   root,id,alive:true,
   on(node,event,fn){node.addEventListener(event,fn,{passive:false});dispose.push(()=>node.removeEventListener(event,fn));},
   every(fn,ms){const handle=setInterval(()=>{if(c.alive)fn();},ms);dispose.push(()=>clearInterval(handle));return handle;},
   later(fn,ms){const handle=setTimeout(()=>{if(c.alive)fn();},ms);dispose.push(()=>clearTimeout(handle));return handle;},
   dispose(){c.alive=false;dispose.forEach(fn=>fn());dispose.length=0;},
   html(markup){root.innerHTML=markup;},
   by(selector){return root.querySelector(selector);},
   score(value){const n=Math.max(0,Math.floor(value)),key='nm_game_high_'+id;let high=Number(localStorage.getItem(key)||0);if(n>high){high=n;localStorage.setItem(key,String(n));}
    const el=c.by('.arcade-score');if(el)el.textContent='Score : '+n+' · Record : '+Math.max(n,high);
   },
   button(text,fn,cls){const b=document.createElement('button');b.type='button';b.className='arcade-btn '+(cls||'');b.textContent=text;c.on(b,'click',e=>{e.preventDefault();fn()});return b;},
   restart(host){host.appendChild(c.button('↻ Rejouer',()=>mount(id,root),'arcade-restart'));},
   keyboard(fn){c.on(window,'keydown',e=>{const keys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter'];if(keys.includes(e.key)){e.preventDefault();fn(e.key);}});}
  };
  return c;
 }
 function canvasGame(c,w,h){
  c.html('<div class="arcade-score">Score : 0</div><canvas class="arcade-canvas" width="'+w+'" height="'+h+'" aria-label="Plateau de jeu"></canvas><div class="arcade-controls"></div>');
  const canvas=c.by('canvas'),g=canvas.getContext('2d'),controls=c.by('.arcade-controls');return {canvas,g,controls};
 }
 function controls(c,host,labels,fn){
  const row=document.createElement('div');row.className='arcade-pad';
  labels.forEach(([key,label])=>row.appendChild(c.button(label,()=>fn(key),'arcade-control')));
  host.appendChild(row);c.restart(host);
 }
 function snake(c){
  const N=18,S=18,{canvas,g,controls:bar}=canvasGame(c,N*S,N*S);
  let body=[{x:9,y:9},{x:8,y:9},{x:7,y:9}],d={x:1,y:0},next=d,fruit=fruitAt(),points=0,dead=false;
  function fruitAt(){let v;do{v={x:rand(N),y:rand(N)}}while(body.some(p=>p.x===v.x&&p.y===v.y));return v}
  function direction(k){const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
   const z=dirs[k];if(z&&!(z[0]===-d.x&&z[1]===-d.y))next={x:z[0],y:z[1]};}
  function draw(){
   g.fillStyle='#0b1929';g.fillRect(0,0,324,324);
   g.strokeStyle='#1e3042';for(let i=0;i<=N;i++){g.beginPath();g.moveTo(i*S,0);g.lineTo(i*S,324);g.stroke();g.beginPath();g.moveTo(0,i*S);g.lineTo(324,i*S);g.stroke();}
   g.fillStyle='#f6b552';g.beginPath();g.arc((fruit.x+.5)*S,(fruit.y+.5)*S,7,0,Math.PI*2);g.fill();
   body.forEach((p,i)=>{g.fillStyle=i?'#3fcdb9':'#a6ffe5';g.fillRect(p.x*S+1,p.y*S+1,S-2,S-2);});
   if(dead){g.fillStyle='#071321b9';g.fillRect(0,140,324,43);g.fillStyle='#fff';g.font='bold 22px sans-serif';g.textAlign='center';g.fillText('PARTIE TERMINÉE',162,168)}
  }
  c.every(()=>{if(dead)return;d=next;const head={x:body[0].x+d.x,y:body[0].y+d.y},eat=head.x===fruit.x&&head.y===fruit.y;
    if(head.x<0||head.x>=N||head.y<0||head.y>=N||body.slice(0,eat?body.length:-1).some(p=>p.x===head.x&&p.y===head.y)){dead=true;draw();return;}
    body.unshift(head);if(eat){points+=10;fruit=fruitAt();c.score(points);}else body.pop();draw();
  },160);
  controls(c,bar,[['up','▲'],['left','◀'],['down','▼'],['right','▶']],direction);
  c.keyboard(k=>direction({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[k]));
  let start=null;c.on(canvas,'touchstart',e=>{start={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:false});
  c.on(canvas,'touchend',e=>{if(!start)return;const x=e.changedTouches[0].clientX-start.x,y=e.changedTouches[0].clientY-start.y;if(Math.max(Math.abs(x),Math.abs(y))>15)direction(Math.abs(x)>Math.abs(y)?x>0?'right':'left':y>0?'down':'up');start=null;});
  c.score(0);draw();
 }
 function pong(c){
  const {canvas,g,controls:bar}=canvasGame(c,320,320);
  let x=160,y=155,vx=2.4,vy=3,player=135,opponent=135,you=0,ai=0,ended=false,move=0;
  function render(){g.fillStyle='#0b1929';g.fillRect(0,0,320,320);g.strokeStyle='#37516a';g.setLineDash([6,8]);g.beginPath();g.moveTo(0,160);g.lineTo(320,160);g.stroke();g.setLineDash([]);
   g.fillStyle='#64edcf';g.fillRect(player,299,55,8);g.fillStyle='#ffaf71';g.fillRect(opponent,14,55,8);
   g.fillStyle='#e9f9fa';g.beginPath();g.arc(x,y,6,0,7);g.fill();g.font='bold 20px sans-serif';g.textAlign='center';g.fillText(you+' : '+ai,160,165);
   if(ended){g.fillStyle='#142942dc';g.fillRect(0,130,320,60);g.fillStyle='#fff';g.fillText(you>ai?'GAGNÉ !':'PARTIE TERMINÉE',160,165);}
  }
  function resetBall(dir){x=160;y=160;vy=dir*3;vx=(rand(3)-1)*1.5+2;}
  c.every(()=>{if(ended)return;player=Math.max(0,Math.min(265,player+move*6));opponent+=Math.max(-2.2,Math.min(2.2,x-(opponent+27)));
   x+=vx;y+=vy;if(x<6||x>314)vx=-vx;
   if(vy>0&&y>=292&&y<=302&&x>=player&&x<=player+55){vy=-Math.abs(vy)*1.025;vx+=(x-player-27)/24;}
   if(vy<0&&y<=27&&y>=15&&x>=opponent&&x<=opponent+55)vy=Math.abs(vy)*1.025;
   if(y>326){ai++;resetBall(-1)}if(y< -6){you++;resetBall(1)}
   if(you>=7||ai>=7){ended=true;c.score(you*10);}
   render();
  },25);
  controls(c,bar,[['left','◀'],['right','▶']],v=>{move=v==='left'?-1:1;c.later(()=>move=0,240)});
  c.on(canvas,'pointermove',e=>{if(e.buttons||e.pointerType==='touch'){const rect=canvas.getBoundingClientRect();player=Math.max(0,Math.min(265,(e.clientX-rect.left)/rect.width*320-28));}});
  c.keyboard(k=>{if(k==='ArrowLeft')player=Math.max(0,player-24);if(k==='ArrowRight')player=Math.min(265,player+24)});
  c.score(0);render();
 }
 function breakout(c){
  const {canvas,g,controls:bar}=canvasGame(c,320,340);
  let paddle=130,x=160,y=260,vx=2.2,vy=-2.6,score=0,lives=3,done=false;
  const bricks=Array.from({length:5},()=>Array.from({length:7},()=>true));
  function paint(){g.fillStyle='#091929';g.fillRect(0,0,320,340);bricks.forEach((row,r)=>row.forEach((b,col)=>{if(b){g.fillStyle=['#55ead2','#68aedb','#b68cff','#f5b672','#ea8888'][r];g.fillRect(8+col*44,32+r*22,40,17);}}));
   g.fillStyle='#65e9e1';g.fillRect(paddle,322,60,8);g.fillStyle='#fff';g.beginPath();g.arc(x,y,6,0,7);g.fill();g.font='15px sans-serif';g.textAlign='left';g.fillText('Vies : '+lives,10,19);
   if(done){g.fillStyle='#10223bea';g.fillRect(0,145,320,50);g.fillStyle='#fff';g.font='bold 21px sans-serif';g.textAlign='center';g.fillText(lives?'GAGNÉ !':'PARTIE TERMINÉE',160,175);}}
  c.every(()=>{if(done)return;x+=vx;y+=vy;if(x<=6||x>=314)vx=-vx;if(y<=6)vy=-vy;
   if(vy>0&&y>=316&&y<=326&&x>=paddle&&x<=paddle+60){vy=-Math.abs(vy);vx+=(x-paddle-30)/35;}
   const col=Math.floor((x-8)/44),row=Math.floor((y-32)/22);
   if(row>=0&&row<5&&col>=0&&col<7&&bricks[row][col]&&x>8+col*44&&x<48+col*44){bricks[row][col]=false;vy=-vy;score+=10;c.score(score)}
   if(y>345){lives--;if(!lives)done=true;else{x=160;y=260;vy=-2.5;}}
   if(bricks.every(r=>r.every(v=>!v))){done=true;score+=100;c.score(score)}paint();
  },23);
  controls(c,bar,[['left','◀'],['right','▶']],direction=>{paddle=Math.max(0,Math.min(260,paddle+(direction==='left'?-30:30)))});
  c.on(canvas,'pointermove',e=>{if(e.buttons||e.pointerType==='touch'){const r=canvas.getBoundingClientRect();paddle=Math.max(0,Math.min(260,(e.clientX-r.left)/r.width*320-30))}});
  c.keyboard(k=>{if(k==='ArrowLeft')paddle=Math.max(0,paddle-25);if(k==='ArrowRight')paddle=Math.min(260,paddle+25)});
  c.score(0);paint();
 }
 function tetris(c){
  const W=10,H=18,S=17,{canvas,g,controls:bar}=canvasGame(c,W*S,H*S);
  const colors=['','#53e4cb','#fed077','#a4a4ff','#fc9c80','#8fdb8f','#d5a6f7','#ff78ad'];
  const shapes=[[[1,1,1,1]],[[2,2],[2,2]],[[0,3,0],[3,3,3]],[[4,4,0],[0,4,4]],[[0,5,5],[5,5,0]],[[6,0,0],[6,6,6]],[[0,0,7],[7,7,7]]];
  const board=Array.from({length:H},()=>Array(W).fill(0));let piece=null,px=3,py=0,lines=0,over=false;
  function spawn(){piece=shapes[rand(shapes.length)].map(r=>r.slice());px=3;py=0;if(!valid(piece,px,py))over=true;}
  function valid(shape,x,y){return shape.every((row,dy)=>row.every((v,dx)=>!v||x+dx>=0&&x+dx<W&&y+dy>=0&&y+dy<H&&(!board[y+dy]||!board[y+dy][x+dx])));}
  function render(){g.fillStyle='#0c1b2d';g.fillRect(0,0,W*S,H*S);
   function block(x,y,v){g.fillStyle=colors[v];g.fillRect(x*S+1,y*S+1,S-2,S-2)}
   board.forEach((r,y)=>r.forEach((v,x)=>{if(v)block(x,y,v)}));if(piece)piece.forEach((r,y)=>r.forEach((v,x)=>{if(v&&py+y>=0)block(px+x,py+y,v)}));
   if(over){g.fillStyle='#09213bdd';g.fillRect(0,133,170,42);g.fillStyle='#fff';g.textAlign='center';g.font='bold 16px sans-serif';g.fillText('PARTIE TERMINÉE',85,159)}}
  function land(){piece.forEach((r,y)=>r.forEach((v,x)=>{if(v&&board[py+y])board[py+y][px+x]=v;}));
   for(let y=H-1;y>=0;y--)if(board[y].every(Boolean)){board.splice(y,1);board.unshift(Array(W).fill(0));lines++;y++;}
   c.score(lines*100);spawn();}
  function down(){if(over)return;if(valid(piece,px,py+1))py++;else land();render();}
  function move(k){if(over)return;
   if(k==='left'&&valid(piece,px-1,py))px--;
   if(k==='right'&&valid(piece,px+1,py))px++;
   if(k==='down'){down();return;}
   if(k==='rotate'){let r=piece[0].map((_,i)=>piece.map(row=>row[i]).reverse());if(valid(r,px,py))piece=r;}
   render();}
  spawn();c.every(down,600);controls(c,bar,[['left','◀'],['rotate','↻'],['right','▶'],['down','▼']],move);
  c.keyboard(k=>move({ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'rotate',' ':'rotate'}[k]));c.score(0);render();
 }
 function game2048(c){
  const a=Array(16).fill(0);let score=0,over=false;
  c.html('<div class="arcade-score"></div><div class="arcade-2048"></div><div class="arcade-controls"></div>');
  const host=c.by('.arcade-2048'),bar=c.by('.arcade-controls');
  function spawn(){const free=a.map((v,i)=>v?null:i).filter(x=>x!==null);if(free.length)a[free[rand(free.length)]]=Math.random()<.9?2:4;}
  function draw(){host.innerHTML=a.map(v=>'<div class="arcade-tile arcade-tile-'+v+'">'+(v||'')+'</div>').join('');
   c.score(score);if(over)host.innerHTML+='<div class="arcade-2048-end">PARTIE TERMINÉE</div>';}
  function shift(k){if(over)return;const before=a.join(',');
   const lines=[];for(let i=0;i<4;i++){const indexes=Array.from({length:4},(_,j)=>{
    if(k==='left')return i*4+j;if(k==='right')return i*4+3-j;
    if(k==='up')return j*4+i;return (3-j)*4+i;});
    lines.push(indexes);}
   for(const indexes of lines){let row=indexes.map(i=>a[i]).filter(Boolean),next=[];for(let i=0;i<row.length;i++){if(row[i]===row[i+1]){next.push(row[i]*2);score+=row[i]*2;i++;}else next.push(row[i]);}
    indexes.forEach((id,j)=>a[id]=next[j]||0);}
   if(a.join(',')!==before)spawn();over=a.every(Boolean)&&!a.some((v,i)=>i%4<3&&a[i+1]===v||i<12&&a[i+4]===v);draw();}
  controls(c,bar,[['up','▲'],['left','◀'],['down','▼'],['right','▶']],shift);
  c.keyboard(k=>shift({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[k]));
  let start;c.on(host,'touchstart',e=>{start=[e.touches[0].clientX,e.touches[0].clientY]});
  c.on(host,'touchend',e=>{if(!start)return;let dx=e.changedTouches[0].clientX-start[0],dy=e.changedTouches[0].clientY-start[1];if(Math.max(Math.abs(dx),Math.abs(dy))>18)shift(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');start=null;});
  spawn();spawn();draw();
 }
 function mines(c){
  const N=8,MINES=10,board=Array.from({length:N*N},()=>({mine:false,open:false,flag:false,near:0}));
  let flags=false,first=true,finished=false,score=0;
  c.html('<div class="arcade-score"></div><div class="arcade-mines"></div><div class="arcade-controls"></div>');
  const host=c.by('.arcade-mines'),bar=c.by('.arcade-controls');
  function neighbors(id){let x=id%N,y=Math.floor(id/N),list=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&x+dx>=0&&x+dx<N&&y+dy>=0&&y+dy<N)list.push((y+dy)*N+x+dx);return list}
  function seed(avoid){let used=0;while(used<MINES){const i=rand(N*N);if(i!==avoid&&!neighbors(avoid).includes(i)&&!board[i].mine){board[i].mine=true;used++;}}board.forEach((cell,i)=>cell.near=neighbors(i).filter(j=>board[j].mine).length)}
  function reveal(id){const cell=board[id];if(cell.open||cell.flag)return;cell.open=true;if(cell.mine){finished=true;return;}score++;if(!cell.near)neighbors(id).forEach(j=>reveal(j));}
  function select(id){if(finished)return;if(flags){if(!board[id].open)board[id].flag=!board[id].flag;}
   else{if(first){seed(id);first=false;}reveal(id);if(board.filter(x=>x.open).length===N*N-MINES)finished=true;}
   draw();}
  function draw(){host.innerHTML=board.map((v,i)=>{
   const label=v.open?(v.mine?'💣':(v.near||'')):(finished&&v.mine?'💣':v.flag?'🚩':'');
   return '<button class="arcade-mine '+(v.open?'open':'')+'" data-cell="'+i+'" type="button">'+label+'</button>';
  }).join('');c.score(score);if(finished)c.by('.arcade-score').textContent=board.some(v=>v.mine&&v.open)?'💣 Perdu · '+score+' cases':'🏆 Gagné !';}
  c.on(host,'click',e=>{const btn=e.target.closest('[data-cell]');if(btn)select(Number(btn.dataset.cell));});
  const toggle=c.button('🚩 Drapeau : NON',()=>{flags=!flags;toggle.textContent='🚩 Drapeau : '+(flags?'OUI':'NON')});bar.appendChild(toggle);c.restart(bar);draw();
 }
 function memory(c){
  const icons=['🐉','🦊','🐼','🦅','🐬','🦁','🐢','🦄'],cards=shuffle([...icons,...icons]).map((icon,id)=>({icon,id,open:false,found:false}));
  let first=null,busy=false,moves=0,matched=0;
  c.html('<div class="arcade-score"></div><div class="arcade-memory"></div><div class="arcade-controls"></div>');
  const host=c.by('.arcade-memory'),bar=c.by('.arcade-controls');
  function draw(){host.innerHTML=cards.map((card,i)=>'<button class="arcade-card '+(card.found?'found':card.open?'flipped':'')+'" data-card="'+i+'">'+(card.found||card.open?card.icon:'❔')+'</button>').join('');c.score(matched*20);}
  c.on(host,'click',e=>{const btn=e.target.closest('[data-card]');if(!btn||busy)return;const index=Number(btn.dataset.card),card=cards[index];if(card.open||card.found)return;card.open=true;
   if(first===null){first=index;draw();return;}moves++;const prev=cards[first];if(prev.icon===card.icon){card.found=prev.found=true;matched++;first=null;draw();if(matched===8)c.by('.arcade-score').textContent='🏆 Gagné en '+moves+' essais !';}
   else{busy=true;draw();c.later(()=>{card.open=prev.open=false;first=null;busy=false;draw();},850);}
  });c.restart(bar);draw();
 }
 function simon(c){
  c.html('<div class="arcade-score"></div><div class="arcade-simon"><button data-pad="0">🟢</button><button data-pad="1">🔴</button><button data-pad="2">🟡</button><button data-pad="3">🔵</button></div><div class="arcade-message">Appuie sur Démarrer</div><div class="arcade-controls"></div>');
  const host=c.by('.arcade-simon'),msg=c.by('.arcade-message'),bar=c.by('.arcade-controls'),seq=[];
  let index=0,locked=true,score=0;
  function flash(id){const b=host.querySelector('[data-pad="'+id+'"]');if(!b)return;b.classList.add('lit');c.later(()=>b.classList.remove('lit'),390);}
  function showSequence(){locked=true;index=0;msg.textContent='Regarde…';seq.forEach((id,i)=>c.later(()=>flash(id),i*650+350));c.later(()=>{locked=false;msg.textContent='À toi !';},seq.length*650+400);}
  function next(){seq.push(rand(4));showSequence();}
  c.on(host,'click',e=>{const btn=e.target.closest('[data-pad]');if(!btn||locked)return;const id=Number(btn.dataset.pad);flash(id);
   if(seq[index]!==id){locked=true;msg.textContent='Raté ! Rejoue.';return;}index++;if(index===seq.length){score++;c.score(score);locked=true;msg.textContent='Parfait !';c.later(next,650);}});
  bar.appendChild(c.button('▶ Démarrer',()=>{if(seq.length)return;next()}));c.restart(bar);c.score(0);
 }
 function whack(c){
  c.html('<div class="arcade-score"></div><div class="arcade-message">30 secondes</div><div class="arcade-whack"></div><div class="arcade-controls"></div>');
  const host=c.by('.arcade-whack'),msg=c.by('.arcade-message'),bar=c.by('.arcade-controls');
  let mole=rand(9),score=0,seconds=30;
  function draw(){host.innerHTML=Array.from({length:9},(_,i)=>'<button class="arcade-hole" data-hole="'+i+'">'+(mole===i?'🐹':'🕳️')+'</button>').join('');msg.textContent=seconds>0?'⏱️ '+seconds+' s':'🏁 Terminé !';}
  c.on(host,'click',e=>{const el=e.target.closest('[data-hole]');if(!el||seconds<=0)return;if(Number(el.dataset.hole)===mole){score+=10;c.score(score);mole=rand(9);draw();}});
  c.every(()=>{if(seconds<=0)return;mole=rand(9);draw()},840);
  c.every(()=>{if(seconds>0){seconds--;draw();}},1000);c.restart(bar);c.score(0);draw();
 }
 function tictactoe(c){
  c.html('<div class="arcade-score">Toi : ❌ · Machine : ⭕</div><div class="arcade-tic"></div><div class="arcade-message">À toi !</div><div class="arcade-controls"></div>');
  const host=c.by('.arcade-tic'),msg=c.by('.arcade-message'),bar=c.by('.arcade-controls'),a=Array(9).fill('');
  let finished=false;
  const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function winner(sym){return wins.some(ids=>ids.every(i=>a[i]===sym));}
  function draw(){host.innerHTML=a.map((v,i)=>'<button class="arcade-tic-cell" data-tic="'+i+'" '+(finished?'disabled':'')+'>'+(v||'')+'</button>').join('');}
  function gameOver(){if(winner('❌')){finished=true;msg.textContent='🏆 Tu as gagné !';}else if(winner('⭕')){finished=true;msg.textContent='La machine gagne.';}else if(a.every(Boolean)){finished=true;msg.textContent='Match nul !';}return finished;}
  function cpu(){let moves=a.map((v,i)=>v?null:i).filter(v=>v!==null);
   let pick=moves.find(i=>{a[i]='⭕';const w=winner('⭕');a[i]='';return w});
   if(pick===undefined)pick=moves.find(i=>{a[i]='❌';const w=winner('❌');a[i]='';return w});
   if(pick===undefined)pick=a[4]===''?4:moves[rand(moves.length)];
   if(pick!==undefined)a[pick]='⭕';}
  c.on(host,'click',e=>{const btn=e.target.closest('[data-tic]');if(!btn||finished)return;const i=Number(btn.dataset.tic);if(a[i])return;a[i]='❌';if(!gameOver()){cpu();gameOver();}draw();});c.restart(bar);draw();
 }
 const games={snake,pong,breakout,tetris,'2048':game2048,mines,memory,simon,whack,tictactoe};
 function mount(id,root){stop();if(!CATALOG.includes(id)||!root)return;const c=ctx(root,id);active=c;games[id](c);}
 globalThis.NEXT_MOVE_ARCADE={games:CATALOG.map(id=>({id})),mount,stop};
})();