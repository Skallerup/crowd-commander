import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createMikkelBoss, updateMikkelBoss, bossAttack, disposeBossEffects } from './mikkel-boss.js';
const $=id=>document.getElementById(id);
const settings={sound:true,haptics:true,quality:'auto'};
try{Object.assign(settings,JSON.parse(localStorage.getItem('cc-settings-v3')||'{}'))}catch{}
const saveSettings=()=>{try{localStorage.setItem('cc-settings-v3',JSON.stringify(settings))}catch{}};
const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let paused=false,performanceFrames=0,performanceTime=0,lastQualityChange=0;
let pixelScale=mobile?1:1.4;
function applyQuality(){
 const max=mobile?1.5:2;
 const scale=settings.quality==='low'?.8:settings.quality==='high'?max:pixelScale;
 renderer.setPixelRatio(Math.min(devicePixelRatio,scale));renderer.setSize(innerWidth,innerHeight);
 renderer.shadowMap.enabled=settings.quality!=='low';
 sun.castShadow=settings.quality!=='low';
 $('quality').textContent='Grafik: '+(settings.quality==='auto'?'Auto':settings.quality==='low'?'Lav':'Høj');
}
function haptic(pattern=12){if(settings.haptics&&navigator.vibrate)navigator.vibrate(pattern)}
function updateControls(){ $('mute').textContent=settings.sound?'🔊':'🔇';$('haptics').textContent=settings.haptics?'📳':'📴';applyQuality() }

const scene=new THREE.Scene();scene.background=new THREE.Color(0x8bdaf2);scene.fog=new THREE.Fog(0x8bdaf2,40,115);
const camera=new THREE.PerspectiveCamera(53,innerWidth/innerHeight,.1,160);const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1:1.4));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xeaf7ff,0x46577b,2.1));const sun=new THREE.DirectionalLight(0xfff4d2,2.5);sun.position.set(-10,25,14);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;scene.add(sun);
const mat=(c,metalness=0)=>new THREE.MeshStandardMaterial({color:c,roughness:.55,metalness});const blue=mat(0x2879f8),skin=mat(0xffdb9e),helmet=mat(0x123eaa),red=mat(0xf14c63),dark=mat(0x233554),gold=mat(0xffcc4b),stone=mat(0x5d718f),green=mat(0x4bf5a1),bad=mat(0xff5e73);
const boxGeo=new THREE.BoxGeometry(1,1,1),ballGeo=new THREE.SphereGeometry(1,10,8),cylGeo=new THREE.CylinderGeometry(1,1,1,10);
function mesh(geo,material,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function label(str,color='#ffffff',size=1){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');c.font='900 80px system-ui';c.textAlign='center';c.textBaseline='middle';c.lineWidth=9;c.strokeStyle='#172039';c.strokeText(str,128,66);c.fillStyle=color;c.fillText(str,128,66);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));o.scale.set(2.5*size,1.25*size,1);return o}
function soldier(material=blue){const g=new THREE.Group();const isBlue=material===blue;const boots=mat(0x303c70);mesh(ballGeo,material,g,0,.65,0,.37,.53,.3);mesh(ballGeo,skin,g,0,1.37,0,.37,.39,.36);mesh(ballGeo,dark,g,-.13,1.41,.335,.045,.065,.025);mesh(ballGeo,dark,g,.13,1.41,.335,.045,.065,.025);mesh(ballGeo,isBlue?helmet:mat(0x9b2244),g,0,1.64,-.06,.4,.23,.38);mesh(ballGeo,skin,g,-.42,.67,0,.15,.35,.16);mesh(ballGeo,skin,g,.42,.67,0,.15,.35,.16);mesh(ballGeo,boots,g,-.19,.15,.04,.18,.25,.22);mesh(ballGeo,boots,g,.19,.15,.04,.18,.25,.22);mesh(ballGeo,gold,g,0,.92,.31,.12,.11,.07);mesh(ballGeo,dark,g,.18,.86,.3,.12,.11,.37);return g}
// Phase 2: lightweight, fully animated, GPU-instanced cartoon soldiers.
// No third-party model license or network requests required.
class AnimatedArmy {
  constructor(scene, materials, capacity=130) {
    this.capacity=capacity; this.count=0; this.parts=[]; this.dummy=new THREE.Object3D();
    this.offsets=Array.from({length:capacity},(_,i)=>{const a=i*2.39996323,r=Math.sqrt(i)*.24;return [Math.cos(a)*r,Math.sin(a)*r]});
    const sphere=new THREE.SphereGeometry(1,12,9), capsule=new THREE.CapsuleGeometry(1,1,4,10);
    const part=(geo,mat,x,y,z,sx,sy,sz,kind)=>{const m=new THREE.InstancedMesh(geo,mat,capacity);m.count=0;m.frustumCulled=false;m.castShadow=kind==='torso'||kind==='head';m.receiveShadow=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(m);this.parts.push({m,x,y,z,sx,sy,sz,kind})};
    part(capsule,materials.blue,0,.72,0,.27,.32,.28,'torso');
    part(sphere,materials.skin,0,1.37,.02,.35,.36,.34,'head');
    part(sphere,materials.helmet,0,1.65,-.06,.38,.22,.36,'helmet');
    part(sphere,materials.dark,-.13,1.4,.335,.042,.06,.025,'eye');
    part(sphere,materials.dark,.13,1.4,.335,.042,.06,.025,'eye');
    part(capsule,materials.blue,-.4,.75,0,.12,.23,.13,'leftArm');
    part(capsule,materials.blue,.4,.75,0,.12,.23,.13,'rightArm');
    part(capsule,materials.dark,-.18,.19,0,.14,.18,.16,'leftLeg');
    part(capsule,materials.dark,.18,.19,0,.14,.18,.16,'rightLeg');
    part(sphere,materials.gold,0,.95,.31,.12,.10,.065,'badge');
    part(capsule,materials.dark,.22,.83,.3,.10,.11,.32,'blaster');
  }
  setCount(n){this.count=Math.max(0,Math.min(this.capacity,n));for(const {m} of this.parts)m.count=this.count}
  update(t,x,z){
    const d=this.dummy;
    for(const p of this.parts){
      for(let i=0;i<this.count;i++){
        const [ox,oz]=this.offsets[i], phase=t*11+i*1.73, swing=Math.sin(phase), bob=Math.abs(Math.sin(phase))*.09;
        let px=p.x,py=p.y,pz=p.z,rx=0,ry=Math.sin(t*2+i)*.035,rz=0;
        if(p.kind==='leftArm')rz=swing*.5;
        if(p.kind==='rightArm')rz=-swing*.5;
        if(p.kind==='leftLeg')rx=swing*.55;
        if(p.kind==='rightLeg')rx=-swing*.55;
        if(p.kind==='torso')rz=Math.sin(phase)*.06;
        if(p.kind==='head')ry=Math.sin(t*3+i)*.09;
        d.position.set(x+ox+px*.57,(py+bob)*.57-(heroSquad&&i<heroSquad.count?100:0),z+oz+pz*.57);
        d.rotation.set(rx,ry,rz);d.scale.set(p.sx*.57,p.sy*.57,p.sz*.57);d.updateMatrix();p.m.setMatrixAt(i,d.matrix);
      }
      p.m.instanceMatrix.needsUpdate=true;
    }
  }
  dispose(){for(const {m} of this.parts){m.parent?.remove(m);m.dispose()}this.parts=[]}
}
// Real glTF 2.0 model with three embedded animation clips. The first 18
// soldiers use independent AnimationMixers; the rest use instanced fallback.
// This hybrid keeps draw calls predictable on iPhone when armies grow.
class GLBHeroSquad {
  constructor(parent, gltf, capacity=18) {
    this.parent=parent;this.items=[];this.capacity=capacity;this.count=0;
    this.offsets=Array.from({length:capacity},(_,i)=>{
      const a=i*2.39996323,r=Math.sqrt(i)*.24;
      return [Math.cos(a)*r,Math.sin(a)*r];
    });
    for(let i=0;i<capacity;i++){
      const model=gltf.scene.clone(true);
      model.scale.setScalar(.57);
      model.visible=false;
      model.traverse(o=>{if(o.isMesh){o.castShadow=i<8;o.receiveShadow=false}});
      parent.add(model);
      const mixer=new THREE.AnimationMixer(model);
      const run=gltf.animations.find(c=>c.name==='Run');
      if(run){const action=mixer.clipAction(run);action.play();action.time=(i*.117)%run.duration;}
      this.items.push({model,mixer});
    }
  }
  setCount(n){this.count=Math.min(this.capacity,Math.max(0,n));this.items.forEach(({model},i)=>model.visible=i<this.count)}
  update(dt,x,z,t){this.items.forEach(({model,mixer},i)=>{
    if(i>=this.count)return;
    const [ox,oz]=this.offsets[i];model.position.set(x+ox*.57,Math.abs(Math.sin(t*11+i*1.73))*.035,z+oz*.57);
    mixer.update(dt);
  })}
  dispose(){for(const {model,mixer} of this.items){mixer.stopAllAction();mixer.uncacheRoot(model);this.parent.remove(model)}this.items=[]}
}
let heroAsset=null,heroSquad=null,heroLoading=false,heroError=false;
function loadHeroAsset(){
 if(heroAsset||heroLoading||heroError)return;
 heroLoading=true;
 new GLTFLoader().load('/models/commander.glb',gltf=>{
   heroAsset=gltf;heroLoading=false;
   // Only attach to the current world, never an old world from a previous level.
   if(animatedArmy){heroSquad?.dispose();heroSquad=new GLBHeroSquad(world,gltf);updateSquad()}
 },undefined,error=>{heroError=true;heroLoading=false;console.warn('GLB failed; using instanced soldiers',error)});
}
let animatedArmy=null;let shieldCharges=0,rapidFireUntil=0,blastCharges=0,obstacles=[],boosts=[];
const mikkelTexture=new THREE.TextureLoader().load('/mikkel.png');mikkelTexture.colorSpace=THREE.SRGBColorSpace;
const decoMats=[mat(0xf9ba4e),mat(0xf38dbe),mat(0x86e7d6),mat(0xb9a2ff)];let world=new THREE.Group();scene.add(world);let squad=[],enemies=[],gates=[],traps=[],projectiles=[],particles=[];let level=1,count=12,playerX=0,distance=0,speed=9,playing=false,finished=false,last=0,shotTimer=0,spawnCounter=0,boss=null,muted=!settings.sound,ctx=null,dragging=false,lastTouchX=0,toastTimeout=0;const TRACK=160, MAX_VISUAL=130;const DIFFICULTY='challenging';let defeats={};try{defeats=JSON.parse(localStorage.getItem('cc-defeats-v3')||'{}')}catch{}
const levels=[{start:12,gates:[[17,8,3,20],[37,15,2,30],[65,25,3,40]],enemy:[[27,8],[51,17],[78,26]],boss:30},{start:16,gates:[[14,12,2,35],[42,25,3,40],[75,30,2,60]],enemy:[[29,14],[58,27],[91,37]],boss:42},{start:20,gates:[[15,20,3,50],[39,30,2,65],[72,40,3,75]],enemy:[[28,24],[57,32],[90,48]],boss:65},{start:23,gates:[[15,30,3,55],[44,45,2,80],[77,60,3,90]],enemy:[[32,29],[60,45],[94,65]],boss:90},{start:26,gates:[[16,35,3,65],[43,55,2,90],[76,75,3,110]],enemy:[[31,35],[61,58],[96,80]],boss:120},{start:30,gates:[[15,45,3,80],[44,60,2,110],[79,90,3,135]],enemy:[[30,40],[62,65],[98,100]],boss:150},{start:34,gates:[[15,50,3,100],[45,80,2,130],[80,110,3,160]],enemy:[[32,52],[65,80],[101,115]],boss:190},{start:38,gates:[[16,60,3,110],[46,95,2,155],[82,140,3,180]],enemy:[[33,60],[65,100],[103,140]],boss:240},{start:42,gates:[[16,75,3,140],[46,120,2,175],[83,160,3,210]],enemy:[[34,72],[66,120],[104,165]],boss:300},{start:50,gates:[[16,100,3,160],[47,140,2,210],[84,190,3,260]],enemy:[[35,100],[68,155],[107,210]],boss:380}];
function beep(f=440,d=.08,type='sine'){if(!settings.sound||muted||document.hidden)return;try{ctx??=new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator(),gain=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(80,f*.7),ctx.currentTime+d);gain.gain.setValueAtTime(.055,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d);o.connect(gain);gain.connect(ctx.destination);o.start();o.stop(ctx.currentTime+d)}catch{}}
function flash(s){$('toast').textContent=s;$('toast').style.opacity=1;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').style.opacity=0,900)}
function resetWorld(){if(heroSquad){heroSquad.dispose();heroSquad=null}if(animatedArmy){animatedArmy.dispose();animatedArmy=null}disposeBossEffects(boss,world);scene.remove(world);world=new THREE.Group();scene.add(world);squad=[];enemies=[];gates=[];traps=[];projectiles=[];particles=[];obstacles=[];boosts=[];shieldCharges=0;rapidFireUntil=0;blastCharges=0;boss=null;updatePowerHud()}
function createGate(z,x,type,value){const g=new THREE.Group();g.position.set(x,0,-z);const positive=true;mesh(boxGeo,positive?green:bad,g,-1.65,1.25,0,.18,2.5,.3);mesh(boxGeo,positive?green:bad,g,1.65,1.25,0,.18,2.5,.3);mesh(boxGeo,positive?green:bad,g,0,2.55,0,3.5,.2,.3);const l=label(type==='multiply'?'×'+value:'+'+value);l.position.set(0,1.7,0);g.add(l);world.add(g);gates.push({g,z,x,type,value,used:false})}
function createPowerGate(z,x,kind){
 const g=new THREE.Group();g.position.set(x,0,-z);
 const col=kind==='shield'?0x59d9ff:kind==='rapid'?0xffc548:0xff6fc8;
 const material=new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.32,roughness:.35});
 mesh(boxGeo,material,g,-1.35,1.2,0,.19,2.4,.25);mesh(boxGeo,material,g,1.35,1.2,0,.19,2.4,.25);mesh(boxGeo,material,g,0,2.48,0,2.9,.18,.25);
 const text=kind==='shield'?'🛡':kind==='rapid'?'⚡':'💥';const l=label(text);l.position.set(0,1.65,.1);g.add(l);world.add(g);boosts.push({g,z,x,kind,used:false});
}
function createMovingObstacle(z,amplitude=2.5,rate=1.2){
 const g=new THREE.Group();g.position.set(0,.72,-z);
 const material=mat(0xff8855);mesh(boxGeo,material,g,0,0,0,2.25,1.4,1.1);mesh(ballGeo,gold,g,0,.8,0,.6,.22,.6);
 world.add(g);obstacles.push({g,z,amplitude,rate,phase:z*.31,used:false});
}
function updatePowerHud(){const e=$('powerhud');if(!e)return;const v=[];if(shieldCharges)v.push('🛡️ '+shieldCharges);if(blastCharges)v.push('💥 '+blastCharges);if(rapidFireUntil>0)v.push('⚡ HURTIGSKUD');e.textContent=v.join('  ·  ')||'Vælg en specialport for bonus';}
function createEnemy(z,num){const g=new THREE.Group();g.position.set(0,0,-z);const n=Math.min(28,Math.max(4,Math.round(num/4)));for(let i=0;i<n;i++){const s=soldier(red);const a=i*2.399,r=Math.sqrt(i)*.56;s.position.set(Math.cos(a)*r,0,Math.sin(a)*r);s.scale.setScalar(.85);g.add(s)}const l=label(String(num),'#ffdae1',.8);l.position.set(0,3.3,0);g.add(l);world.add(g);enemies.push({g,z,hp:num,max:num,active:false,dead:false})}
function createTrap(z,x){const g=new THREE.Group();g.position.set(x,.18,-z);mesh(boxGeo,gold,g,0,0,0,1.8,.4,1.6);for(let i=-1;i<=1;i++)mesh(new THREE.ConeGeometry(.2,.65,4),bad,g,i*.5,.45,0);world.add(g);traps.push({g,z,x,used:false})}
function createBoss(hp){
  boss=createMikkelBoss({THREE,world,level,hp,portraitTexture:mikkelTexture,materials:{red,dark,gold,skin,blue},mesh,label});
  $('bossbar').style.display='none';$('bossname').textContent=boss.title+' · '+hp+' HP';$('bossfill').style.width='100%';
}
function setup(n){paused=false;$('pause').textContent='⏸';$('pauseNotice').hidden=true;resetWorld();level=n;const losses=defeats[n]||0;count=Math.round((levels[n-1].start+22)*(1+Math.min(losses,4)*.075));playerX=0;distance=0;shotTimer=0;spawnCounter=0;speed=7.9+n*.14;finished=false;updatePowerHud();playing=true;const track=mesh(boxGeo,mat(0x647aab),world,0,-.38,-TRACK/2,11,.7,TRACK+20);track.receiveShadow=true;for(let i=0;i<32;i++){mesh(boxGeo,i%2?mat(0x7a8fa9):mat(0x4d6683),world,-5.6,-.05,-i*5,.24,.18,4.7);mesh(boxGeo,i%2?mat(0x7a8fa9):mat(0x4d6683),world,5.6,-.05,-i*5,.24,.18,4.7)}for(let i=0;i<24;i++){mesh(boxGeo,mat(0xffffff),world,0,-.012,-i*7-3,.11,.03,2.2)}for(let i=0;i<30;i++){const z=-i*5.3-3;const col=decoMats[i%decoMats.length];for(const side of [-1,1]){mesh(new THREE.CylinderGeometry(.42,.58,1.1,10),col,world,side*7.5,.55,z);mesh(ballGeo,col,world,side*7.5,1.7,z,.78,.85,.78);mesh(boxGeo,gold,world,side*5.9,.3,z,.16,.65,.16)}}for(let i=0;i<12;i++){mesh(ballGeo,decoMats[i%4],world,(i%2?1:-1)*(11+i%3),-3,-i*13,3.5,3.5,3.5)}for(let i=0;i<18;i++){const x=(i%2?1:-1)*(8+i%4),z=-i*8-6;const trunk=mat(0x99724f);mesh(cylGeo,trunk,world,x,1,z,.25,2,.25);mesh(ballGeo,decoMats[i%4],world,x,2.7,z,1.15,1.4,1.15)}const cfg=levels[n-1];cfg.gates.forEach(([z,add,mul,alt])=>{createGate(z,-2.75,'add',add);createGate(z,2.75,'multiply',mul);if(z>40&&n>3){createTrap(z+11,Math.sin(z)*2.8)}});// Three themed power-up gates per level; the player chooses between two lanes.
 const powerZ=[22,55,102];const kinds=['shield','rapid','blast'];
 powerZ.forEach((z,i)=>{const kind=kinds[(i+n-1)%3];createPowerGate(z,i%2===0?-2.75:2.75,kind)});
 // Dynamic obstacles start gently, then demand lane changes on later levels.
 if(n>=3)createMovingObstacle(69,Math.min(3,1.5+n*.14),.7+n*.07);
 if(n>=6)createMovingObstacle(109,2.4,1.1+n*.05);
 cfg.enemy.forEach(([z,hp])=>createEnemy(z,Math.max(3,Math.round(hp*(n<=2?.32:n<=4?.48:.62)))));createBoss(Math.round(cfg.boss*(n<=2?.8:1)*(1-Math.min(losses,4)*.06)));mesh(boxGeo,gold,world,0,.02,-143,10,.12,.55);animatedArmy=new AnimatedArmy(world,{blue,skin,helmet,dark,gold},MAX_VISUAL);if(heroAsset)heroSquad=new GLBHeroSquad(world,heroAsset);else loadHeroAsset();updateSquad();$('level').textContent='BANE '+level+' / 10 · SVÆR';$('bossbar').style.display='none';$('quip').textContent=['Mikkel har taget den sidste kaffe ☕','Mikkel gemmer sig bag Excel-ark 📊','Mikkel kræver flere soldater!','Mikkel har indkaldt til møde 😴','Mikkel har låst kaffemaskinen 🔒','Mikkel har fået ny chef: dig 😎','Mikkel kalder det strategisk tilbagetog','Mikkel har glemt sit password','Mikkel har ansat flere bosser','FINALEN: Mikkel vil have lønforhøjelse 💸'][n-1];$('overlay').style.display='none';beep(660,.15)}
function updateSquad(){if(heroSquad)heroSquad.setCount(Math.floor(count));if(animatedArmy)animatedArmy.setCount(Math.min(MAX_VISUAL,Math.max(0,Math.floor(count))));$('troops').textContent=Math.max(0,Math.floor(count)).toLocaleString('da-DK');updatePowerHud();$('squadtitle').textContent=count>=100?'KÆMPEHÆR 🔥':count>=40?'STÆRK HÆR 💪':'DIN HÆR'}
function end(win){if(finished)return;haptic(win?[30,40,60]:[60,30,60]);finished=true;playing=false;if(win){defeats[level]=0}else{defeats[level]=(defeats[level]||0)+1}localStorage.setItem('cc-defeats-v3',JSON.stringify(defeats));beep(win?880:170,.4,win?'sine':'sawtooth');$('overlay').style.display='flex';$('heading').textContent=win?(level===10?'🏆 DU VANDT OVER MIKKEL!':'🏅 MIKKEL TABTE IGEN!'):'💥 MIKKEL VANDT DENNE GANG';$('message').textContent=win?(level===10?'Du har klaret alle 10 baner! Klar til en ny tur?':'Mikkel siger, det var et uheld. Næste bane bliver sværere!' ):'Prøv igen! Efter hvert nederlag får du lidt flere soldater. Vælg de bedste porte.';$('action').textContent=win?(level===10?'SPIL IGEN':'NÆSTE BANE →'):'PRØV IGEN';$('action').onclick=()=>{const next=win?(level===10?1:level+1):level;if(win)localStorage.setItem('cc-unlocked',String(Math.max(next,Number(localStorage.getItem('cc-unlocked')||1))));setup(next)}}
function shoot(target,dt){shotTimer-=dt;if(shotTimer>0)return;shotTimer=rapidFireUntil>0?.065:.12;const damage=Math.max(3,Math.ceil(count*(level<=2?.25:level<=4?.19:.15)));target.hp-=damage;if(blastCharges>0&&target===boss){target.hp-=Math.max(6,Math.ceil(count*.32));blastCharges--;flash('💥 EKSPLOSIVT ANGREB!');updatePowerHud()}const bullet=mesh(ballGeo,gold,world,playerX,1,-distance-1,.15,.15,.15);projectiles.push({o:bullet,t:0,target:target.g.position.clone()});if(Math.random()<.45)beep(280+Math.random()*180,.035,'square');if(target===boss){$('bossfill').style.width=Math.max(0,target.hp/target.max*100)+'%'}if(target.hp<=0){target.dead=true;world.remove(target.g);count=Math.max(1,Math.floor(count*.94));updateSquad();flash('FJENDE BESEJRET!');if(target===boss){flash('MIKKEL ER SENDT TIL KAFFEPAUSE ☕');end(true)}}}
function tick(dt,t){if(!playing||paused||document.hidden)return;distance+=speed*dt;if(rapidFireUntil>0){rapidFireUntil=Math.max(0,rapidFireUntil-dt);if(rapidFireUntil===0)updatePowerHud()}$('fill').style.width=Math.min(100,distance/143*100)+'%';if(animatedArmy)animatedArmy.update(t,playerX,-distance);if(heroSquad)heroSquad.update(dt,playerX,-distance,t);
for(const gate of gates){if(!gate.used&&distance>=gate.z-.7){gate.used=true;const choose=Math.abs(playerX-gate.x)<1.75;if(choose){haptic(10);count=gate.type==='add'?count+gate.value:count*gate.value;count=Math.min(count,9999);updateSquad();flash((gate.type==='add'?'+':'×')+gate.value+' SOLDATER');beep(790,.12)}}}
for(const boost of boosts){if(!boost.used&&distance>=boost.z-.7){boost.used=true;world.remove(boost.g);if(Math.abs(playerX-boost.x)<1.55){if(boost.kind==='shield')shieldCharges=Math.min(3,shieldCharges+1);if(boost.kind==='rapid')rapidFireUntil=8;if(boost.kind==='blast')blastCharges=Math.min(3,blastCharges+1);updatePowerHud();flash(boost.kind==='shield'?'🛡️ SKJOLD AKTIVERET':boost.kind==='rapid'?'⚡ HURTIGSKUD I 8 SEKUNDER':'💥 EKSPLOSIVT SKUD KLAR');beep(970,.2)}}}
 for(const ob of obstacles){if(ob.used)continue;ob.g.position.x=Math.sin(t*ob.rate+ob.phase)*ob.amplitude;if(distance>=ob.z-.9){ob.used=true;world.remove(ob.g);if(Math.abs(playerX-ob.g.position.x)<1.65){if(shieldCharges>0){shieldCharges--;updatePowerHud();flash('🛡️ SKJOLDET REDDEDE DIG!')}else{count=Math.max(0,Math.floor(count*.75));updateSquad();flash('🚧 PAS PÅ FORHINDRINGEN!');if(count<=0)return end(false)}}}}
 for(const trap of traps){if(!trap.used&&distance>=trap.z-.9){trap.used=true;if(Math.abs(playerX-trap.x)<1.35){if(shieldCharges>0){shieldCharges--;updatePowerHud();flash('🛡️ SKJOLD BLOKEREDE FÆLDEN')}else{count=Math.max(0,Math.floor(count*.65));updateSquad();flash('⚠️ FÆLDE!');}beep(130,.2);if(count<=0)return end(false)}}}
let target=null;for(const enemy of enemies){if(enemy.dead)continue;const dz=enemy.z-distance;if(dz<15&&dz>-.7){target=enemy;break}if(dz<=-.7){enemy.dead=true;world.remove(enemy.g);count-=Math.max(1,Math.floor(enemy.hp*(level<=2?.13:.23)));updateSquad();flash('⚔️ SAMMENSTØD!');if(count<=0)return end(false)}}
if(distance>119&&!boss.dead){boss.active=true;$('bossbar').style.display='block';target=boss;boss.attackTimer-=dt;
if(boss.attackTimer<=0){boss.attackTimer=level<=2?4.8:level<=5?3.9:3.1;bossAttack(boss,{THREE,world,playerX,distance,level,flash,beep});}
const bossHit=updateMikkelBoss(boss,{dt,t,playerX,distance,level,THREE,world});
if(bossHit){if(shieldCharges>0){shieldCharges--;updatePowerHud();flash('🛡️ SKJOLDET STOPPEDE MIKKEL!')}else{count=Math.max(0,count-Math.max(1,Math.ceil(count*(level<=2?.035:level<=5?.065:.09))));updateSquad();flash('💥 MIKKEL RAMTE! UNDVIG DE RØDE FELTER');}beep(160,.17);if(count<=0)return end(false)}}
if(target)shoot(target,dt);for(let i=projectiles.length-1;i>=0;i--){const b=projectiles[i];b.t+=dt*13;b.o.position.lerp(b.target,Math.min(1,dt*13));if(b.t>1){world.remove(b.o);projectiles.splice(i,1)}}
if(distance>155&&!boss.dead)end(false);camera.position.lerp(new THREE.Vector3(playerX*.2,13.2,-distance+20),Math.min(1,dt*4));camera.lookAt(playerX*.2,0,-distance-14);if(boss&&!boss.dead&&distance>110){boss.g.rotation.y=Math.sin(t*2)*.14;boss.g.position.y=Math.sin(t*3)*.1}}
function animate(ms){
 requestAnimationFrame(animate);
 const t=ms*.001,dt=Math.min(.05,t-last||0);last=t;
 if(document.hidden)return;
 if(!paused)tick(dt,t);
 renderer.render(scene,camera);
 if(settings.quality==='auto'&&playing&&!paused&&dt>.001){
   performanceFrames++;performanceTime+=dt;
   if(performanceTime>=4&&t-lastQualityChange>12){
     const fps=performanceFrames/performanceTime;
     const next=fps<38?Math.max(.7,pixelScale-.15):fps>56?Math.min(mobile?1.35:1.8,pixelScale+.1):pixelScale;
     if(next!==pixelScale){pixelScale=next;applyQuality();lastQualityChange=t}
     performanceFrames=0;performanceTime=0;
   }
 }
}requestAnimationFrame(animate);
function move(dx){if(!playing)return;playerX=THREE.MathUtils.clamp(playerX+dx,-4.3,4.3)}renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastTouchX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;move((e.clientX-lastTouchX)/innerWidth*12);lastTouchX=e.clientX});renderer.domElement.addEventListener('pointerup',()=>dragging=false);renderer.domElement.addEventListener('pointercancel',()=>dragging=false);window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')move(-.5);if(e.key==='ArrowRight'||e.key==='d')move(.5)});window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();applyQuality()});
$('mute').onclick=()=>{settings.sound=!settings.sound;muted=!settings.sound;saveSettings();updateControls()};
$('haptics').onclick=()=>{settings.haptics=!settings.haptics;saveSettings();updateControls();haptic()};
$('quality').onclick=()=>{settings.quality=({auto:'low',low:'high',high:'auto'})[settings.quality];saveSettings();updateControls()};
$('pause').onclick=()=>{if(!playing)return;paused=!paused;$('pause').textContent=paused?'▶️':'⏸';$('pauseNotice').hidden=!paused};
document.addEventListener('visibilitychange',()=>{last=performance.now()*.001;performanceFrames=0;performanceTime=0;if(document.hidden&&playing){paused=true;$('pause').textContent='▶️';$('pauseNotice').hidden=false}});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;$('pauseNotice').hidden=false;$('pauseNotice').textContent='Grafikken blev afbrudt. Genindlæs siden for at fortsætte.'});
updateControls();$('action').onclick=()=>setup(Math.min(10,Math.max(1,Number(localStorage.getItem('cc-unlocked')||1))));camera.position.set(0,13.2,20);camera.lookAt(0,0,-15);
