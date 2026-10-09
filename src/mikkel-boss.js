import * as THREE from 'three';
// Original cartoon boss, themed for each of the ten levels. No external assets besides supplied portrait.
const THEMES=[
  ['☕ KAFFE-MIKKEL','Kaffekop','Kaffen er min!'],
  ['📊 EXCEL-MIKKEL','Regneark','Jeg har lavet et regneark over dine nederlag!'],
  ['📦 LAGER-MIKKEL','Papkasse','Den her ordre bliver forsinket!'],
  ['💸 SPARE-MIKKEL','Mønt','Det er uden for budgettet!'],
  ['😎 SUPER-MIKKEL','Stjerne','Det her er faktisk ret nemt!'],
  ['🏓 PADEL-MIKKEL','Padelbold','Matchbold!'],
  ['📅 MØDE-MIKKEL','Kalender','Du er inviteret til et tre timers møde!'],
  ['🔥 RASENDE MIKKEL','Flamme','Nu bliver jeg altså sur!'],
  ['👑 DIREKTØR-MIKKEL','Krone','Hvem har godkendt det her?!'],
  ['💀 MEGA MIKKEL','Meteor','Jeg vil have lønforhøjelse!']
];
const m=(color,roughness=.55)=>new THREE.MeshStandardMaterial({color,roughness});
const sphere=new THREE.SphereGeometry(1,16,12);
const box=new THREE.BoxGeometry(1,1,1);
const cylinder=new THREE.CylinderGeometry(1,1,1,12);
function part(group,geo,material,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;group.add(o);return o}
export function createMikkelBoss({world,level,hp,portraitTexture,label}){
  const theme=THEMES[level-1]||THEMES[0],g=new THREE.Group();g.position.set(0,0,-136);
  const shirt=m([0xe85161,0x37b9cc,0xf3aa35,0x72a75a,0x7654d5,0x28a7e0,0x8e70b9,0xef6539,0x3b455e,0x9a43a9][level-1]);
  const skin=m(0xffd1a7),ink=m(0x25314c),shoe=m(0x242a3c),accent=m(0xffd452,.25);
  const body=new THREE.Group();g.add(body);
  part(body,sphere,shirt,0,2.2,0,1.2,1.5,.8);
  const leftArm=new THREE.Group(),rightArm=new THREE.Group();leftArm.position.set(-1.05,3.05,0);rightArm.position.set(1.05,3.05,0);body.add(leftArm,rightArm);
  part(leftArm,sphere,shirt,-.42,-.62,0,.36,.82,.38);part(leftArm,sphere,skin,-.52,-1.23,.06,.34,.33,.34);
  part(rightArm,sphere,shirt,.42,-.62,0,.36,.82,.38);part(rightArm,sphere,skin,.52,-1.23,.06,.34,.33,.34);
  part(body,sphere,shoe,-.55,.68,0,.4,.77,.42);part(body,sphere,shoe,.55,.68,0,.4,.77,.42);
  const head=new THREE.Group();head.position.set(0,4.55,.1);body.add(head);
  part(head,sphere,skin,0,0,0,1.25,1.23,1.0);
  // User-provided photo appears on the front of a stylized 3D head.
  const portrait=new THREE.Mesh(new THREE.PlaneGeometry(1.85,1.9),new THREE.MeshBasicMaterial({map:portraitTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));portrait.position.set(0,.02,1.03);head.add(portrait);
  part(head,sphere,ink,0,1.05,-.15,1.03,.22,.8);
  const crown=new THREE.Group();crown.position.set(0,1.3,0);head.add(crown);
  for(let i=-1;i<=1;i++)part(crown,new THREE.ConeGeometry(.3,.7,5),accent,i*.55,.35,0);
  part(crown,box,accent,0,.06,0,1.9,.25,.6);
  const prop=new THREE.Group();prop.position.set(1.9,2.5,.5);body.add(prop);
  if(level===1){part(prop,cylinder,m(0xffffff),0,0,0,.42,.5,.42);part(prop,sphere,accent,0,.55,0,.2,.12,.2)}
  else if(level===3){part(prop,box,m(0xd69c53),0,0,0,.72,.72,.72);part(prop,box,m(0xffdf91),0,.02,.72,.45,.14,.02)}
  else if(level===6){part(prop,cylinder,m(0x20a6ee),0,0,0,.65,.1,.65);prop.rotation.z=.6}
  else if(level===9||level===10){part(prop,sphere,accent,0,0,0,.6,.6,.6)}
  else{part(prop,box,m(0xeaf2ff),0,0,0,.65,.85,.1);part(prop,box,m(0x3d79da),0,.12,.12,.4,.07,.03)}
  const name=label(theme[0],'#ffe59c',1.45);name.position.set(0,7.15,0);g.add(name);
  const aura=new THREE.Mesh(new THREE.TorusGeometry(2.25,.12,8,40),new THREE.MeshBasicMaterial({color:0xffd64e,transparent:true,opacity:.55}));aura.rotation.x=-Math.PI/2;aura.position.y=.12;g.add(aura);
  world.add(g);
  return {g,body,head,leftArm,rightArm,prop,aura,hp,max:hp,active:false,dead:false,attackTimer:1.7,title:theme[0],quip:theme[2],warnings:[],shots:[],attackIndex:0};
}
function telegraph(boss,world,x,z,level){
  const radius=level<=2?1.0:level<=5?1.15:1.25;
  const geometry=new THREE.CylinderGeometry(radius,radius,.045,28);
  const material=new THREE.MeshBasicMaterial({color:0xff3657,transparent:true,opacity:.38,depthWrite:false});
  const ring=new THREE.Mesh(geometry,material);ring.position.set(x,.075,z);world.add(ring);
  boss.warnings.push({ring,material,x,z,radius,ttl:level<=2?1.8:level<=5?1.45:1.15,total:level<=2?1.8:level<=5?1.45:1.15});
}
export function bossAttack(boss,{world,playerX,distance,level,flash,beep}){
  if(!boss||boss.dead)return;
  boss.attackIndex++;
  const side=boss.attackIndex%3-1;
  const x=Math.max(-4.1,Math.min(4.1,playerX+side*(level<=2?.55:1.05)));
  // Place attack ahead of player and advance its position with the runner.
  telegraph(boss,world,x,-distance-2.3,level);
  flash('⚠️ MIKKEL ANGRIBER – FLYT DIG!');beep(340,.13,'triangle');
}
export function updateMikkelBoss(boss,{dt,t,playerX,distance,world}){
  if(!boss||boss.dead)return false;
  boss.body.rotation.z=Math.sin(t*2.7)*.055;
  boss.head.rotation.y=Math.sin(t*1.8)*.14;
  boss.leftArm.rotation.z=Math.sin(t*3)*.32;
  boss.rightArm.rotation.z=-Math.sin(t*3+.8)*.4;
  boss.prop.rotation.y=Math.sin(t*2)*.22;
  boss.aura.rotation.z=t*.7;
  let hit=false;
  for(let i=boss.warnings.length-1;i>=0;i--){
    const w=boss.warnings[i];w.ttl-=dt;
    // Telegraph follows player's forward movement, but not sideways movement.
    w.z=-distance-2.3;w.ring.position.z=w.z;
    w.material.opacity=.23+.24*(.5+.5*Math.sin(t*13));
    w.ring.scale.setScalar(1+(.12*(1-w.ttl/w.total)));
    if(w.ttl<=0){
      hit=hit||Math.abs(playerX-w.x)<w.radius*.8;
      world.remove(w.ring);w.ring.geometry.dispose();w.material.dispose();boss.warnings.splice(i,1);
    }
  }
  return hit;
}
export function disposeBossEffects(boss,world){
  if(!boss)return;
  for(const w of boss.warnings||[]){world.remove(w.ring);w.ring.geometry.dispose();w.material.dispose()}
  boss.warnings=[];
}
