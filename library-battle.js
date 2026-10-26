(()=>{'use strict';
const $=id=>document.getElementById(id),assets=JSON.parse($('originalAssets').textContent);
const questions=[
['The moon is bright tonight.','오늘 밤 달은 어떤 모습인가요?',['밝아요','빨개요','보이지 않아요'],0,'달빛이 밝은 밤에 수상한 빛이 나타난다.'],
['The key is under the table.','열쇠는 어디에 있나요?',['탁자 아래','책장 위','문 뒤'],0,'열쇠는 도서관 탁자 아래에 있다.'],
['I can hear a strange sound.','어떤 소리가 들리나요?',['노랫소리','이상한 소리','빗소리'],1,'숲의 이상한 소리는 기계에서 나온 신호일 수 있다.'],
['Open the door at midnight.','언제 문을 열어야 하나요?',['아침','정오','자정'],2,'장치는 자정에 작동하도록 설정되어 있다.'],
['Look for the little house.','무엇을 찾아야 하나요?',['작은 집','큰 나무','강'],0,'작은 집 그림이 다음 단서다.'],
['Follow the stars in the sky.','무엇을 따라가야 하나요?',['강','별','바람'],1,'별 모양 표식을 따라가야 한다.'],
['We must protect our friends.','누구를 지켜야 하나요?',['친구들','책들','장치'],0,'모두 함께 장치를 안전하게 멈춰야 한다.'],
['The ghost is only a light trick.','그림자의 정체는 무엇인가요?',['진짜 유령','마법','빛으로 만든 속임수'],2,'그림자는 빛과 거울을 이용한 장난이었다.']];
const qs=new URLSearchParams(location.search),test=qs.get('test')==='1',key=test?'tokitoki-library-battle-test':'tokitoki-library-battle';
if(qs.get('reset')==='1'){localStorage.removeItem(key);qs.delete('reset');history.replaceState(null,'',location.pathname+'?'+qs)}
let save={};try{save=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}
let round=Math.max(0,Math.min(8,save.round||0)),wand=save.wand||0,hp=5,targets=[],particles=[],shots=[],drops=[],last=0,started=false,paused=true,aimX=.5,aimY=.35,pointer=false,fireAt=0,enemyAt=0,invulnerable=0,raf=0;
const canvas=document.createElement('canvas');canvas.id='battleCanvas';$('books').replaceWith(canvas);const ctx=canvas.getContext('2d');
const root=$('room')||document.querySelector('.room');root.classList.add('battle-room');const controls=document.querySelector('.controls');controls.innerHTML='<button id="wandSelect">🪄 마법봉 선택</button><button id="fireButton">⚡ 발사</button><button id="battleInfo">📜 단서</button>';
const hud=document.createElement('div');hud.id='battleHud';root.appendChild(hud);
const aim=document.createElement('div');aim.id='aimHint';aim.textContent='화면을 움직여 조준 · 발사 버튼을 누르세요';root.appendChild(aim);
$('testTools').style.display=test?'block':'none';$('testReset').onclick=()=>{localStorage.removeItem(key);location.reload()};
document.querySelector('.quest').style.display='none';document.querySelector('.hint').style.display='none';
const saved=()=>{localStorage.setItem(key,JSON.stringify({round,wand}))};
const talk=t=>{$('npcText').textContent=t;try{speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang='ko-KR';u.rate=.95;speechSynthesis.speak(u)}catch(e){}};
const speak=t=>{try{speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.8;speechSynthesis.speak(u)}catch(e){}};
const modal=(title,desc)=>{$('title').textContent=title;$('description').textContent=desc;$('answers').replaceChildren();$('feedback').textContent='';$('listen').hidden=true;$('close').hidden=false;$('dialog').hidden=false;paused=true};
const close=()=>{$('dialog').hidden=true;paused=false};
const img=assets.map(src=>{let a=new Image();a.src=src;return a});
function resize(){let r=canvas.getBoundingClientRect();canvas.width=Math.max(320,Math.round(r.width*devicePixelRatio));canvas.height=Math.max(320,Math.round(r.height*devicePixelRatio))}
new ResizeObserver(resize).observe(canvas);
const pos=e=>{let r=canvas.getBoundingClientRect();aimX=Math.max(.04,Math.min(.96,(e.clientX-r.left)/r.width));aimY=Math.max(.05,Math.min(.85,(e.clientY-r.top)/r.height))};
canvas.addEventListener('pointerdown',e=>{pointer=true;canvas.setPointerCapture(e.pointerId);pos(e);fire()});
canvas.addEventListener('pointermove',e=>{if(pointer)pos(e)});canvas.addEventListener('pointerup',()=>pointer=false);
$('fireButton').onclick=fire;
function spawn(){hp=5;targets=[];shots=[];particles=[];drops=[];enemyAt=performance.now()+2500;invulnerable=0;for(let i=0;i<3+Math.min(round,3);i++){let x=.12+(i%3)*.34,y=.14+Math.floor(i/3)*.21;targets.push({x,y,vx:(i%2?-.09:.09)*(1+round*.08),vy:(i%2?.045:-.045),type:i%4,alive:true,attack:Math.random()*3})}started=true;paused=false;updateHud()}
function updateHud(){$('progress').textContent='📕 라운드 '+Math.min(round+1,8)+'/8';$('clues').textContent='❤️ '+ '♥'.repeat(hp)+'♡'.repeat(5-hp);$('wandHud').textContent='🪄 '+['별빛','불꽃','얼음','번개'][wand];hud.textContent='남은 책 '+targets.filter(t=>t.alive).length+'권 · 에너지 '+hp+'/5'}
function burst(x,y){for(let i=0;i<23;i++){let a=Math.random()*Math.PI*2,v=.12+Math.random()*.4;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.7+Math.random()*.35})}}
function fire(){if(paused||!started||round>=8)return;let now=performance.now();if(now-fireAt<280)return;fireAt=now;shots.push({x:.5,y:.94,tx:aimX,ty:aimY,life:.17});let hit=targets.find(t=>t.alive&&Math.hypot((t.x-aimX)*canvas.width/canvas.height,t.y-aimY)<.13);if(hit){hit.alive=false;burst(hit.x,hit.y);drops.push({x:hit.x,y:hit.y,vy:0,rotation:0});updateHud();if(targets.every(t=>!t.alive)){paused=true;setTimeout(boss,900)}}}
function boss(){if(round>=8)return;modal('📖 대마법책 등장! · '+(round+1)+'라운드','모든 책을 격추했어요! 대마법책의 영어 문제를 풀어 단서를 획득하세요.');$('listen').hidden=false;$('listen').onclick=()=>speak(questions[round][0]);let q=questions[round];$('description').textContent=q[1];q[2].forEach((v,i)=>{let b=document.createElement('button');b.textContent=v;b.onclick=()=>{if(i!==q[3]){$('feedback').textContent='다시 듣고 도전해 보세요!';speak(q[0]);return}round++;saved();$('dialog').hidden=true;burst(.5,.3);talk('정답이야! '+q[4]);if(round===8){finish()}else{modal('✨ 단서 획득!','🔎 '+q[4]+'\n다음 라운드에서는 새로운 책들이 공격해 올 거야!');$('close').textContent='▶ 다음 라운드';$('close').onclick=()=>{close();spawn()}}};$('answers').appendChild(b)});speak(q[0])}
function finish(){paused=true;modal('🏆 도서관 미션 완료','8개 라운드의 대마법책을 모두 해결했어요! 수상한 그림자는 빛과 거울을 이용한 장난이었어요.');$('close').textContent='▶ 마을로 이동';$('close').onclick=()=>location.href='./index.html?library=complete';talk('정말 잘했어! 여덟 개의 단서를 모두 모았구나. 이제 마을로 돌아가 장치의 정체를 밝혀 보자!')}
function fail(){paused=true;modal('💔 에너지가 모두 소진되었어요','이번 라운드의 책들을 모두 격추하기 전에 에너지가 떨어졌어요. 이 라운드부터 다시 도전할 수 있어요.');$('close').textContent='↻ 현재 라운드 다시 도전';$('close').onclick=()=>{close();spawn()};talk('괜찮아! 이번 라운드부터 다시 도전하자!')}
function choose(){modal('🪄 마법봉 선택','원하는 마법봉을 선택하세요.');$('answers').className='answers staff';for(let i=0;i<4;i++){let b=document.createElement('button');b.innerHTML='<img src="'+assets[8+i]+'" alt="">'+['별빛','불꽃','얼음','번개'][i];b.onclick=()=>{wand=i;saved();$('answers').className='answers';close();updateHud()};$('answers').appendChild(b)}$('close').textContent='▶ 돌아가기';$('close').onclick=()=>{$('answers').className='answers';close()}}
$('wandSelect').onclick=choose;
$('battleInfo').onclick=()=>{modal('📜 수집한 단서',round?questions.slice(0,round).map((q,i)=>(i+1)+'. '+q[4]).join('\n'):'아직 획득한 단서가 없습니다.');$('description').style.whiteSpace='pre-line';$('close').textContent='▶ 전투로 돌아가기';$('close').onclick=()=>close()};
$('guide').onclick=()=>talk('마법봉으로 날아다니는 책을 조준하고 발사해! 책들이 쏘는 빛을 피하고 에너지 다섯 칸이 사라지기 전에 모두 격추하면 대마법책이 영어 문제를 낼 거야.');
function loop(now){raf=requestAnimationFrame(loop);let dt=Math.min(.04,(now-last)/1000||0);last=now;let w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
if(!paused&&started){for(let t of targets){if(!t.alive)continue;t.x+=t.vx*dt;t.y+=t.vy*dt;if(t.x<.12||t.x>.88)t.vx*=-1;if(t.y<.1||t.y>.62)t.vy*=-1;t.attack-=dt;if(t.attack<=0){t.attack=2+Math.random()*1.6;shots.push({enemy:true,x:t.x,y:t.y,tx:.5,ty:.93,life:.85});}}
for(let s of shots){s.life-=dt;if(s.enemy&&s.life<=0&&now>invulnerable){hp--;invulnerable=now+1100;updateHud();if(hp<=0)fail()}}shots=shots.filter(s=>s.life>0);
for(let p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}particles=particles.filter(p=>p.life>0);
for(let d of drops){d.y+=d.vy*dt;d.vy+=.8*dt;d.rotation+=dt*3}drops=drops.filter(d=>d.y<1.1)}
for(let t of targets){if(!t.alive)continue;let x=t.x*w,y=t.y*h,im=img[t.type];ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(now/400+t.x*12)*.12);if(im.complete&&im.naturalWidth)ctx.drawImage(im,-w*.095,-w*.11,w*.19,w*.22);else{ctx.font='45px serif';ctx.fillText('📕',-24,15)}ctx.restore()}
for(let d of drops){ctx.save();ctx.translate(d.x*w,d.y*h);ctx.rotate(d.rotation);ctx.font=Math.max(20,w*.06)+'px serif';ctx.fillText('📖',-18,12);ctx.restore()}
for(let s of shots){ctx.save();ctx.lineWidth=s.enemy?Math.max(2,w*.007):Math.max(4,w*.013);ctx.strokeStyle=s.enemy?'#ff597c':'#8bf5ff';ctx.shadowColor=s.enemy?'#ff3355':'#5ffaff';ctx.shadowBlur=22;ctx.beginPath();if(s.enemy){let k=1-s.life/.85;ctx.moveTo(s.x*w,s.y*h);ctx.lineTo((s.x+(s.tx-s.x)*k)*w,(s.y+(s.ty-s.y)*k)*h)}else{ctx.moveTo(s.x*w,s.y*h);ctx.lineTo(s.tx*w,s.ty*h)}ctx.stroke();ctx.restore()}
for(let p of particles){ctx.globalAlpha=Math.min(1,p.life);ctx.fillStyle='#ffe478';ctx.beginPath();ctx.arc(p.x*w,p.y*h,Math.max(2,w*.008),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
ctx.strokeStyle='#fff2a4';ctx.lineWidth=2;let x=aimX*w,y=aimY*h;ctx.beginPath();ctx.arc(x,y,Math.max(13,w*.033),0,Math.PI*2);ctx.moveTo(x-23,y);ctx.lineTo(x-8,y);ctx.moveTo(x+8,y);ctx.lineTo(x+23,y);ctx.moveTo(x,y-23);ctx.lineTo(x,y-8);ctx.moveTo(x,y+8);ctx.lineTo(x,y+23);ctx.stroke();
ctx.save();ctx.translate(w*.5,h*.95);let im=img[8+wand];if(im.complete&&im.naturalWidth)ctx.drawImage(im,-w*.10,-h*.17,w*.2,h*.18);else{ctx.font='56px serif';ctx.fillText('🪄',-20,0)}ctx.restore()}
$('close').onclick=()=>{close();if(round===8){finish();return}spawn();talk('어서 와! 나는 도서관 사서 엘리야. 아래 가운데 마법봉을 움직여 책을 조준하고 빛을 발사해! 책들이 공격하니 에너지 다섯 칸을 지켜야 해. 모든 책을 격추하면 대마법책의 영어 문제를 풀 수 있어!')};
$('title').textContent='📚 마법 도서관 · 마법봉 전투';$('description').textContent='마법봉을 조준하고 빛을 발사해 날아다니는 책을 격추하세요. 책들이 공격하니 에너지 5칸을 지키세요. 라운드를 통과하면 대마법책이 영어 문제를 냅니다.';$('close').textContent='▶ 전투 시작';
if(round===8){finish()}updateHud();requestAnimationFrame(loop);
})();