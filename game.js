const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const start=document.querySelector('#start'),end=document.querySelector('#end'),hud=document.querySelector('#hud');
const controls=document.querySelector('#controls'),joy=document.querySelector('#joystick'),stick=document.querySelector('#stick'),rootPower=document.querySelector('#rootPower');
let W,H,dpr,playing=false,t=0,last=0,pointer=false,target={x:0,y:0},score=0,won=false,joyId=null,joyVec={x:0,y:0},power=0;
let player,patches=[],ash=[],hazards=[],particles=[];
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function rnd(a,b){return a+Math.random()*(b-a)}
function reset(){score=0;won=false;t=0;player={x:W*.5,y:H*.68,vx:0,vy:0,r:15,trail:[]};target={x:player.x,y:player.y};patches=[];ash=[];hazards=[];particles=[];
  for(let i=0;i<135;i++)patches.push({x:rnd(-20,W+20),y:rnd(H*.14,H+20),r:rnd(12,35),alive:0,flower:Math.random()<.18});
  for(let i=0;i<45;i++)ash.push({x:rnd(0,W),y:rnd(0,H),s:rnd(.5,2.2),v:rnd(.15,.65)});
  for(let i=0;i<7;i++)hazards.push({x:rnd(35,W-35),y:rnd(H*.22,H*.9),r:rnd(18,27),pulse:rnd(0,6)});updateHud();}
function begin(){reset();playing=true;start.classList.add('hidden');end.classList.add('hidden');hud.classList.remove('hidden');controls.classList.remove('hidden');setTimeout(()=>document.querySelector('#hint').style.opacity=0,2600)}
document.querySelector('#play').onclick=begin;document.querySelector('#again').onclick=begin;
function pos(e){let p=e.touches?e.touches[0]:e;target.x=p.clientX;target.y=p.clientY}
canvas.addEventListener('pointerdown',e=>{pointer=true;pos(e)});canvas.addEventListener('pointermove',e=>{if(pointer)pos(e)});addEventListener('pointerup',()=>pointer=false);
function moveJoy(e){let r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,d=Math.hypot(dx,dy)||1,max=34;if(d>max){dx*=max/d;dy*=max/d}joyVec={x:dx/max,y:dy/max};stick.style.transform=`translate(${dx}px,${dy}px)`}
joy.onpointerdown=e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e)};joy.onpointermove=e=>{if(e.pointerId===joyId)moveJoy(e)};joy.onpointerup=joy.onpointercancel=e=>{joyId=null;joyVec={x:0,y:0};stick.style.transform='translate(0,0)'};
rootPower.onpointerdown=e=>{e.preventDefault();if(!playing||power>0)return;power=1;rootPower.classList.add('active');setTimeout(()=>rootPower.classList.remove('active'),180)};
function update(dt){if(!playing)return;t+=dt;
  if(Math.abs(joyVec.x)+Math.abs(joyVec.y)>.05){player.vx+=joyVec.x*.055*dt;player.vy+=joyVec.y*.055*dt}else if(pointer){let dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy)||1;player.vx+=dx/d*.055*dt;player.vy+=dy/d*.055*dt}if(power>0){power+=dt*.0025;if(power>2.1)power=0}
  player.vx*=Math.pow(.986,dt);player.vy*=Math.pow(.986,dt);let sp=Math.hypot(player.vx,player.vy),mx=.48;if(sp>mx){player.vx*=mx/sp;player.vy*=mx/sp}
  player.x+=player.vx*dt;player.y+=player.vy*dt;player.x=Math.max(18,Math.min(W-18,player.x));player.y=Math.max(H*.15,Math.min(H-18,player.y));
  player.trail.unshift({x:player.x,y:player.y});if(player.trail.length>22)player.trail.pop();
  let changed=false;for(const p of patches){let d=Math.hypot(p.x-player.x,p.y-player.y),reach=power>0?55+power*72:45;if(d<p.r+reach&&p.alive<1){p.alive=Math.min(1,p.alive+dt*(power>0?.005:.0024));changed=true;if(Math.random()<.08)particles.push({x:p.x+rnd(-p.r,p.r),y:p.y+rnd(-p.r,p.r),vx:rnd(-.05,.05),vy:rnd(-.14,-.03),life:1,c:Math.random()<.5?'#bbed68':'#fff0a1'})}}
  for(const h of hazards){h.pulse+=dt*.004;let d=Math.hypot(h.x-player.x,h.y-player.y);if(d<h.r+player.r){let dx=(player.x-h.x)/(d||1),dy=(player.y-h.y)/(d||1);player.vx+=dx*.35;player.vy+=dy*.35;for(let i=0;i<6;i++)particles.push({x:player.x,y:player.y,vx:rnd(-.18,.18),vy:rnd(-.18,.18),life:1,c:'#543b4f'})}}
  particles.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt*.0015});particles=particles.filter(q=>q.life>0);
  if(changed){score=patches.reduce((s,p)=>s+p.alive,0)/patches.length;updateHud();if(score>=.92&&!won){won=true;setTimeout(win,700)}}}
function updateHud(){let n=Math.floor(score*100);document.querySelector('#pct').textContent=n+'%';document.querySelector('#fill').style.width=n+'%'}
function win(){playing=false;hud.classList.add('hidden');controls.classList.add('hidden');document.querySelector('#result').innerHTML=`Has recuperado el <b>${Math.floor(score*100)}%</b> del bosque<br>y rescatado tu primera mariposa.`;end.classList.remove('hidden')}
function circle(x,y,r,c,a=1){ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
function draw(){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#25312e');g.addColorStop(1,'#171b18');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // dead soil texture and living islands
  for(const p of patches){circle(p.x,p.y,p.r,'#353832');if(p.alive>0){circle(p.x,p.y,p.r*p.alive,`hsl(${92+rnd(-4,4)} 38% ${27+p.alive*10}%)`,.95);if(p.alive>.82&&p.flower){let c=['#ffe47a','#f29db2','#c9a8ff'][Math.floor((p.x+p.y)%3)];circle(p.x,p.y,p.r*.16,c,p.alive)}}}
  // burnt tree silhouettes
  ctx.strokeStyle='#242522';ctx.lineCap='round';for(let x=28;x<W;x+=95){let y=H*.24+((x*7)%Math.max(80,H*.45));ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,y+38);ctx.lineTo(x,y);ctx.lineTo(x-10,y-15);ctx.moveTo(x,y+2);ctx.lineTo(x+13,y-18);ctx.stroke()}
  for(const h of hazards){circle(h.x,h.y,h.r+Math.sin(h.pulse)*3,'#251f26');circle(h.x,h.y,h.r*.62,'#52374c');circle(h.x-5,h.y-4,4,'#8d6377',.6)}
  for(const q of particles)circle(q.x,q.y,2.5,q.c,q.life);
  ash.forEach(a=>{a.y+=a.v;if(a.y>H){a.y=-5;a.x=rnd(0,W)};circle(a.x,a.y,a.s,'#d3c9b8',.25)});
  if(player){if(power>0){ctx.strokeStyle=`rgba(174,234,102,${Math.max(0,1-power/2.1)})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(player.x,player.y,45+power*72,0,Math.PI*2);ctx.stroke()}for(let i=player.trail.length-1;i>0;i++){let q=player.trail[i];circle(q.x,q.y,3.5*(1-i/player.trail.length),'#85c64e',.35)}
    if(pointer){ctx.strokeStyle='#8dda65aa';ctx.lineWidth=2;ctx.setLineDash([4,8]);ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.quadraticCurveTo((player.x+target.x)/2+Math.sin(t*.01)*8,(player.y+target.y)/2,target.x,target.y);ctx.stroke();ctx.setLineDash([])}
    circle(player.x,player.y,player.r+5,'#9be25b',.15);circle(player.x,player.y,player.r,'#77bd49');circle(player.x-5,player.y-2,2.2,'#152017');circle(player.x+5,player.y-2,2.2,'#152017');ctx.strokeStyle='#a9e66c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(player.x,player.y-11);ctx.quadraticCurveTo(player.x-14,player.y-25,player.x-18,player.y-17);ctx.stroke();ctx.beginPath();ctx.moveTo(player.x,player.y-10);ctx.quadraticCurveTo(player.x+13,player.y-27,player.x+18,player.y-18);ctx.stroke()}
}
function loop(now){let dt=Math.min(32,now-last||16);last=now;update(dt);draw();requestAnimationFrame(loop)}reset();requestAnimationFrame(loop);
