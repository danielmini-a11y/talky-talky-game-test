(()=>{'use strict';
let ctx=null,master=null,musicGain=null,muted=false,nextBeat=0,beat=0,loop=null;
try{muted=localStorage.getItem('tokitoki-library-muted')==='1'}catch(e){}
function init(){if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;ctx=new C();master=ctx.createGain();master.gain.value=muted?0:.55;master.connect(ctx.destination);musicGain=ctx.createGain();musicGain.gain.value=.16;musicGain.connect(master)}if(ctx.state==='suspended')ctx.resume().catch(()=>{});return true}
function tone(freq,duration=.15,type='sine',volume=.12,offset=0,endFreq=null,destination=null){if(!ctx||muted)return;let t=ctx.currentTime+offset,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(40,freq),t);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(40,endFreq),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(destination||master);o.start(t);o.stop(t+duration+.02)}
function noise(duration=.18,volume=.10,offset=0){if(!ctx||muted)return;let size=Math.max(256,Math.round(ctx.sampleRate*duration)),b=ctx.createBuffer(1,size,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<size;i++)d[i]=(Math.random()*2-1)*(1-i/size);let src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=b;filter.type='bandpass';filter.frequency.value=900;g.gain.value=volume;src.connect(filter);filter.connect(g);g.connect(master);src.start(ctx.currentTime+offset)}
const effects={
fire(){tone(760,.19,'sine',.13,0,1550);tone(1100,.15,'triangle',.06,.035,1950);tone(1400,.13,'sine',.04,.07,2400)},
hit(){noise(.22,.10);tone(540,.28,'triangle',.17,0,180);tone(1000,.24,'sine',.1,.04,420);[0,.06,.12].forEach((t,i)=>tone(950+i*250,.17,'sine',.05,t))},
drop(){tone(220,.11,'triangle',.065,0,110)},
enemy(){tone(340,.23,'sawtooth',.045,0,140)},
hurt(){tone(220,.28,'sawtooth',.12,0,70);noise(.14,.06)},
owl(){tone(820,.13,'sawtooth',.10,0,340);tone(560,.21,'triangle',.12,.10,185);tone(690,.09,'square',.04,.06,420);noise(.20,.07,.06)},
forbidden(){tone(510,.16,'square',.085);tone(370,.2,'square',.07,.15);tone(220,.28,'triangle',.06,.28)},
boss(){[196,246.94,293.66,392,587.33].forEach((f,i)=>tone(f,.75,'triangle',.12,i*.15));noise(.8,.065)},
correct(){[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,.3,'sine',.13,i*.12))},
wrong(){tone(350,.22,'triangle',.09);tone(265,.25,'triangle',.08,.16)},
start(){[392,523.25,659.25].forEach((f,i)=>tone(f,.3,'sine',.09,i*.11))},
fail(){[392,330,262,196].forEach((f,i)=>tone(f,.36,'triangle',.1,i*.2))},
win(){[392,523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,.45,'sine',.11,i*.13))}
};
const bass=[130.81,130.81,174.61,196,116.54,116.54,155.56,174.61],melody=[392,0,523.25,392,349.23,0,392,523.25,349.23,0,466.16,349.23,392,0,523.25,587.33];
function tick(){if(!ctx||muted||ctx.state!=='running')return;let now=ctx.currentTime;if(nextBeat<now)nextBeat=now+.05;let n=0;while(nextBeat<now+.3&&n++<8){let step=beat%16;let base=bass[Math.floor(beat/4)%bass.length];tone(base,.33,'triangle',.055,nextBeat-now,null,musicGain);if(step%2===0)tone(base*2,.16,'sine',.025,nextBeat-now+.02,null,musicGain);if(melody[step])tone(melody[step],.23,'sine',.035,nextBeat-now+.03,null,musicGain);nextBeat+=.29;beat++}}
function start(){if(!init())return;nextBeat=ctx.currentTime+.08;if(!loop)loop=setInterval(tick,120);tick()}
function setMuted(v){muted=!!v;try{localStorage.setItem('tokitoki-library-muted',muted?'1':'0')}catch(e){}if(master)master.gain.setTargetAtTime(muted?0:.55,ctx.currentTime,.03);if(!muted)start();document.querySelector('#soundToggle')?.replaceChildren(document.createTextNode(muted?'🔇 소리 켜기':'🔊 소리 끄기'))}
function play(name){if(!init()||muted)return;effects[name]?.()}
window.LibraryAudio={start,play,setMuted,isMuted:()=>muted};
})();