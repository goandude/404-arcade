import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {flightForces,centerAt} from './flight.js';
import {pointerAim,cameraAim,nearestTarget} from './targeting.js';
const $=id=>document.getElementById(id),canvas=$('view');
let ready=false,state='loading',practice=false,time=0,score=0,armor=100,throttle=.7,pitch=0,roll=0,yaw=0,fireTime=0,hurtTime=0,flareTime=0,enemyTime=0,boostHeat=0;
const keys=new Set(),aim=new THREE.Vector2(0,0),enemies=[],bolts=[],particles=[],rings=[];
let renderer,world,body,scene,camera,events;
const q=new THREE.Quaternion(),pos=new THREE.Vector3(),velocity=new THREE.Vector3();
let audio,osc,engineGain,sound=true;
try{sound=localStorage.getItem('afterburn-sound')!=='false';}catch(_){}
function soundStart(){if(!sound)return;try{if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();osc=audio.createOscillator();engineGain=audio.createGain();osc.type='sawtooth';engineGain.gain.value=0;osc.connect(engineGain);engineGain.connect(audio.destination);osc.start();}if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){}}
function tone(freq,end,duration=.12,volume=.035){if(!sound||audio?.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(end,audio.currentTime+duration);g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.linearRampToValueAtTime(volume,audio.currentTime+.005);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};}
function audioUpdate(speed){if(!audio)return;osc.frequency.setTargetAtTime(35+speed*.3+(keys.has('shift')?15:0),audio.currentTime,.15);engineGain.gain.setTargetAtTime(sound&&state==='playing'?.015:0,audio.currentTime,.05);}
function radio(text){$('radio').textContent=text;}
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.88,...extra});
const rockMats=[mat(0xc99870),mat(0xb88260),mat(0xe0b18a),mat(0xa77557)],dark=mat(0x15252c),metal=mat(0x344750),green=mat(0x82ec48,{emissive:0x286a08,emissiveIntensity:1}),cyan=mat(0x63eafa,{emissive:0x23b9d1,emissiveIntensity:1});
const boxGeo=new THREE.BoxGeometry(1,1,1),rockGeo=new THREE.CylinderGeometry(.78,1,1,6);
function mesh(geo,material,x,y,z,sx=1,sy=1,sz=1,parent=scene){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
function solid(x,y,z,w,h,d,material){const m=mesh(boxGeo,material,x,y,z,w,h,d);world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2).setTranslation(x,y,z));return m;}
function wing(points,material,parent){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const m=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:false}),material);m.rotation.x=Math.PI/2;parent.add(m);return m;}
function jet(){const g=new THREE.Group();mesh(new THREE.ConeGeometry(1,8,6),metal,0,0,0,1,1,1,g).rotation.x=-Math.PI/2;
wing([[-.5,-2],[-6,2],[-5.5,3],[0,1],[5.5,3],[6,2],[.5,-2]],dark,g);
mesh(boxGeo,green,-4,.1,2,1.5,.18,.7,g);mesh(boxGeo,green,4,.1,2,1.5,.18,.7,g);
for(const x of [-1,1]){mesh(new THREE.CylinderGeometry(.4,.55,2,8),metal,x,0,2,1,1,1,g).rotation.x=Math.PI/2;mesh(new THREE.SphereGeometry(.43,8,6),green,x,0,3,1,1,.4,g);const fin=mesh(boxGeo,dark,x,1.1,2,.15,2,1.7,g);fin.rotation.z=x*.3;}
mesh(new THREE.SphereGeometry(.8,10,8),mat(0x40988e,{transparent:true,opacity:.55,metalness:.4}),0,.65,-.7,.8,1,1.7,g);
// Goblin head and swept ears are geometry inside the canopy.
mesh(new THREE.SphereGeometry(.4,8,6),green,0,.75,-.7,1,1,1,g);for(const x of [-.55,.55]){const ear=mesh(new THREE.ConeGeometry(.17,.7,3),green,x,.8,-.7,1,1,1,g);ear.rotation.z=x>0?-1.2:1.2;mesh(boxGeo,dark,x*.3,.84,-1.04,.13,.06,.03,g);}return g;}
function cockpit(){const group=new THREE.Group();camera.add(group);scene.add(camera);
const panel=mesh(boxGeo,dark,0,-.9,-1.05,2.4,.55,.55,group);panel.rotation.x=.25;
for(const side of [-1,1]){const rim=mesh(boxGeo,metal,side*1.03,-.12,-1.05,.075,2.3,.085,group);rim.rotation.z=-side*.32;mesh(boxGeo,dark,side*1.12,-.65,-.8,.3,.9,.8,group);}
for(const x of [-.64,0,.64]){const frame=mesh(boxGeo,metal,x,-.69,-.74,.47,.3,.03,group);frame.rotation.x=.12;mesh(boxGeo,mat(0x082b32,{emissive:0x073f46,emissiveIntensity:.7}),x,-.68,-.717,.4,.23,.015,group);}
for(let i=0;i<10;i++)mesh(boxGeo,mat(i%3?0xe0a04a:0x69d2ce,{emissive:i%3?0x815721:0x206066}),-.9+i*.2,-.48,-.8,.045,.018,.025,group);
}
function environment(){
scene.background=new THREE.Color(0x8fc4d8);scene.fog=new THREE.FogExp2(0xa5c8d3,.00075);scene.add(new THREE.HemisphereLight(0xd6f5ff,0x967459,2.3));const sun=new THREE.DirectionalLight(0xffe3b4,3.1);sun.position.set(-500,900,300);scene.add(sun);
const water=mesh(new THREE.PlaneGeometry(16000,24000),mat(0x249fae,{metalness:.25,roughness:.3}),0,0,-8500);water.rotation.x=-Math.PI/2;
world.createCollider(RAPIER.ColliderDesc.cuboid(8000,1,12000).setTranslation(0,-2,-8500));
for(let i=0;i<145;i++){const z=400-i*95,center=centerAt(z);for(const side of [-1,1]){const height=100+(Math.sin(i*7.3)+1)*45,width=65+(i%4)*12;const x=center+side*(185+width/2);solid(x,height/2,z,width,height,105,rockMats[i%4]);for(let j=0;j<2;j++){const m=mesh(rockGeo,rockMats[(i+j)%4],x+side*(25+j*60),height*(.5+j*.08),z+22*(j%2),70,height*(1+j*.25),65);m.rotation.y=i*.5;}if(i%4===0){const bush=mesh(new THREE.IcosahedronGeometry(1,0),mat(0x687a49),x,height+3,z,12,5,10);}}}
const cloudMat=new THREE.MeshBasicMaterial({color:0xecf2e9,transparent:true,opacity:.55});for(let i=0;i<32;i++)mesh(new THREE.IcosahedronGeometry(1,1),cloudMat,(i%2?1:-1)*(500+i%5*80),400+i%3*35,-i*410,130,25,45);
const concrete=mat(0xaeb4a9);for(const z of [-2900,-6500]){const c=centerAt(z);solid(c,120,z,460,12,22,concrete);for(const x of [-135,135])solid(c+x,55,z,16,110,20,concrete);}
for(let i=0;i<12;i++){const z=-550-i*760,g=new THREE.Mesh(new THREE.TorusGeometry(30,1.2,8,48),cyan);g.position.set(centerAt(z),65+(i%3)*10,z);scene.add(g);rings.push({mesh:g,done:false});}
}
function spawnEnemy(){const g=jet();g.position.set(pos.x+(Math.random()-.5)*150,Math.max(35,pos.y+(Math.random()-.5)*60),pos.z-500);scene.add(g);enemies.push({mesh:g,hp:2,phase:Math.random()*6,timer:2.5,baseX:g.position.x});}
const boltGeo=new THREE.SphereGeometry(1,6,4),blueBolt=new THREE.MeshBasicMaterial({color:0x88faff}),greenBolt=new THREE.MeshBasicMaterial({color:0xb0ff55}),sparkMat=new THREE.MeshBasicMaterial({color:0xffc075});
function shoot(){
 // Reconcile the current simulation pose before unprojecting the visible reticle.
 camera.position.copy(pos);camera.quaternion.copy(q);
 const ray=cameraAim(camera,aim),range=1200;
 const obstruction=world.castRay(new RAPIER.Ray(ray.origin,ray.direction),range,true,undefined,undefined,shipCollider);
 const limit=obstruction?obstruction.timeOfImpact:range;
 const selected=nearestTarget(ray,enemies,limit);
 const impact=selected?selected.point:ray.at(limit,new THREE.Vector3());
 for(const side of [-1,1]){
   const origin=pos.clone().add(new THREE.Vector3(side*2,-.8,-4).applyQuaternion(q));
   const vector=impact.clone().sub(origin),length=vector.length();
   const beam=mesh(boxGeo,blueBolt,0,0,0,.1,.1,length);
   beam.position.copy(origin).addScaledVector(vector,.5);
   beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),vector.normalize());
   particles.push({mesh:beam,v:new THREE.Vector3(),life:.075});
 }
 if(selected){const e=selected.target;e.hp--;score+=25;
   if(e.hp<=0){explode(e.mesh.position);disposeObject(e.mesh);enemies.splice(enemies.indexOf(e),1);score+=100;radio('Goblin down. Keep moving.');}
   else tone(350,650,.05,.02);
 }
 tone(950,230,.08,.025);
}
function explode(position){for(let i=0;i<22;i++){const m=mesh(boltGeo,sparkMat,position.x,position.y,position.z,.7,.7,.7);particles.push({mesh:m,v:new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(50),life:.7});}tone(100,30,.3,.065);}
function disposeObject(m){scene.remove(m);}
function hit(amount){if(hurtTime>0)return;armor=Math.max(0,armor-amount);hurtTime=1.2;explode(pos);radio('Arrow One, damage detected. Watch your altitude.');if(armor===0)finish(false);}
function finish(won){state='ended';keys.clear();audioUpdate(0);$('menu').hidden=false;$('brief').textContent=won?`Extraction reached. Score ${score}; ${rings.filter(r=>r.done).length}/12 navigation rings. Fly again to improve your run.`:`Aircraft lost. Score ${score}. Practice mode lets you learn the canyon without hostile fire.`;$('load-status').textContent=won?'MISSION COMPLETE':'FLIGHT ENDED';try{const best=Number(localStorage.getItem('afterburn-best'))||0;if(score>best)localStorage.setItem('afterburn-best',String(score));}catch(_){} }
function launch(training){if(!ready)return;practice=training;state='playing';time=0;score=0;armor=100;throttle=.7;pitch=0;roll=0;yaw=0;fireTime=0;hurtTime=0;flareTime=0;enemyTime=2;boostHeat=0;keys.clear();aim.set(0,0);positionReticle();
body.setTranslation({x:centerAt(0),y:80,z:0},true);body.setLinvel({x:0,y:0,z:-105},true);body.setAngvel({x:0,y:0,z:0},true);body.resetForces(true);
for(const list of [enemies,bolts,particles]){list.forEach(o=>disposeObject(o.mesh));list.length=0;}rings.forEach(r=>{r.done=false;r.mesh.visible=true;});$('menu').hidden=true;$('pause').disabled=false;$('pause').textContent='PAUSE · P';soundStart();canvas.focus();radio(training?'Practice cleared. Bank gently and follow the cyan rings.':'Goblin fighters inbound. Weapons free, Arrow One.');}
function pause(){if(state==='paused'){state='playing';$('menu').hidden=true;soundStart();canvas.focus();$('pause').textContent='PAUSE · P';}else if(state==='playing'){state='paused';keys.clear();aim.set(0,0);positionReticle();$('menu').hidden=false;$('brief').textContent='Flight paused. Press P to resume without restarting, or launch a fresh mission below.';$('load-status').textContent='PAUSED';$('pause').textContent='RESUME · P';}audioUpdate(0);}
function flares(){if(state!=='playing'||flareTime>0)return;flareTime=8;for(let i=bolts.length-1;i>=0;i--)if(bolts[i].enemy){disposeObject(bolts[i].mesh);bolts.splice(i,1);}radio('Flares away. Incoming fire disrupted.');tone(1800,300,.25);}
function tick(dt){if(state!=='playing')return;time+=dt;fireTime-=dt;hurtTime=Math.max(0,hurtTime-dt);flareTime=Math.max(0,flareTime-dt);
const sensitivity=Number($('sensitivity').value),assist=$('assist').checked;
throttle=THREE.MathUtils.clamp(throttle+((keys.has('arrowup')?1:0)-(keys.has('arrowdown')?1:0))*dt*.3,.05,1);
const bank=(keys.has('a')?1:0)-(keys.has('d')?1:0),climb=(keys.has('w')?1:0)-(keys.has('s')?1:0);
roll=THREE.MathUtils.damp(roll,bank*.9*sensitivity,3,dt);pitch=THREE.MathUtils.damp(pitch,climb*.38*sensitivity,2.2,dt);
const linear=body.linvel();velocity.set(linear.x,linear.y,linear.z);const speed=velocity.length();
yaw+=Math.sin(roll)*Math.min(.38,30/Math.max(speed,40))*dt;
q.setFromEuler(new THREE.Euler(pitch,yaw,roll,'YXZ'));body.setRotation(q,true);
const boost=keys.has('shift')&&boostHeat<1;boostHeat=THREE.MathUtils.clamp(boostHeat+(boost?.22:-.18)*dt,0,1);
const force=flightForces(linear,q,throttle,boost,assist);if(![force.x,force.y,force.z,q.x,q.y,q.z,q.w].every(Number.isFinite))throw new Error("Nonfinite flight state: "+JSON.stringify({force,q,sensitivity,pitch,roll,yaw}));body.resetForces(true);body.addForce(force,true);world.step(events);
events.drainCollisionEvents((a,b,started)=>{if(started&&(a===shipCollider.handle||b===shipCollider.handle))hit(45);});
const p=body.translation();pos.set(p.x,p.y,p.z);
if(pos.y<3||pos.y>850||Math.abs(pos.x-centerAt(pos.z))>1800){hit(100);}
if(state!=='playing')return;
for(const r of rings)if(!r.done&&pos.distanceTo(r.mesh.position)<32){r.done=true;r.mesh.visible=false;score+=250;tone(650,1200,.18);radio('Navigation ring cleared. +250');}
if((keys.has('fire')||keys.has(' '))&&fireTime<=0){shoot();fireTime=.13;}
if(!practice){enemyTime-=dt;if(enemyTime<=0&&enemies.length<5){spawnEnemy();enemyTime=4.5;}}
for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];e.phase+=dt;e.mesh.position.z-=72*dt;e.mesh.position.x=e.baseX+Math.sin(e.phase)*22;e.mesh.rotation.z=Math.cos(e.phase)*-.25;e.timer-=dt;
if(e.timer<=0&&e.mesh.position.distanceTo(pos)<650){const m=mesh(boltGeo,greenBolt,e.mesh.position.x,e.mesh.position.y,e.mesh.position.z,.6,.6,6);const direction=pos.clone().addScaledVector(velocity,.45).sub(e.mesh.position).normalize();m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction);bolts.push({mesh:m,v:direction.multiplyScalar(240),life:4,enemy:true});e.timer=3.2;}
if(e.mesh.position.distanceTo(pos)<9)hit(35);
if(e.mesh.position.z>pos.z+120||e.mesh.position.distanceTo(pos)>1800){disposeObject(e.mesh);enemies.splice(i,1);}}
for(let i=bolts.length-1;i>=0;i--){const b=bolts[i],old=b.mesh.position.clone();b.mesh.position.addScaledVector(b.v,dt);b.life-=dt;const segment=new THREE.Line3(old,b.mesh.position),closest=new THREE.Vector3();
if(b.enemy){segment.closestPointToPoint(pos,true,closest);if(closest.distanceTo(pos)<3){hit(12);b.life=0;}}
else{for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];segment.closestPointToPoint(e.mesh.position,true,closest);if(closest.distanceTo(e.mesh.position)<7){e.hp--;b.life=0;score+=25;if(e.hp<=0){explode(e.mesh.position);disposeObject(e.mesh);enemies.splice(j,1);score+=100;radio('Goblin down. Keep moving.');}break;}}}
if(b.life<=0){disposeObject(b.mesh);bolts.splice(i,1);}}
for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.scale.multiplyScalar(.98);if(p.life<=0){disposeObject(p.mesh);particles.splice(i,1);}}
if(pos.z<-10000){score+=Math.round(armor*10);finish(true);}
audioUpdate(speed);
}
let shipCollider;
function display(){if(!camera||!body)return;const p=body.translation();camera.position.set(p.x,p.y,p.z);camera.quaternion.copy(q);camera.fov=THREE.MathUtils.lerp(camera.fov,keys.has('shift')&&state==='playing'?81:74,.04);camera.updateProjectionMatrix();
$('speed').textContent=Math.round(velocity.length()*3.6);$('altitude').textContent=Math.round(p.y);$('throttle').textContent=Math.round(throttle*100)+'%';$('shield').textContent=armor+'%';$('armor').value=armor;$('score').textContent=String(score).padStart(4,'0');$('flares').textContent=flareTime>0?`FLARES ${Math.ceil(flareTime)}s`:'FLARES READY';$('warning').textContent=p.y<25?'PULL UP':velocity.length()<65?'LOW AIRSPEED':boostHeat>.9?'BOOST HOT':'';$('objective').textContent=`${practice?'PRACTICE':'MISSION'} / ${Math.max(0,10+p.z/1000).toFixed(1)} KM TO EXTRACTION / ${rings.filter(r=>r.done).length} RINGS`;
$('damage').style.opacity=hurtTime>0?String(hurtTime*.35):'0';$('horizon').style.transform=`rotate(${-roll}rad) translateY(${pitch*100}px)`;renderer.render(scene,camera);}
function resize(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio,Number($('quality').value)));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();positionReticle();}
async function boot(){try{await RAPIER.init();world=new RAPIER.World({x:0,y:-9.81,z:0});world.timestep=1/120;events=new RAPIER.EventQueue(true);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(74,innerWidth/innerHeight,.06,6500);renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
environment();cockpit();body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,80,0).setCcdEnabled(true).lockRotations());shipCollider=world.createCollider(RAPIER.ColliderDesc.ball(2).setMass(1).setRestitution(.05).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),body);body.setLinvel({x:0,y:0,z:-105},true);velocity.set(0,0,-105);resize();ready=true;state='ready';$('combat').disabled=false;$('practice').disabled=false;$('load-status').textContent='FLIGHT SYSTEMS READY · CHOOSE A MODE';let last=null,acc=0;renderer.setAnimationLoop(now=>{if(last===null)last=now;acc+=Math.min((now-last)/1000,.08);last=now;while(acc>=1/120){tick(1/120);acc-=1/120;}display();});}catch(e){$('load-status').textContent='Unable to start 3D: '+e.message;$('brief').textContent='This game requires a browser with WebGL 2 and WebAssembly enabled. Try a current desktop browser.';console.error(e);}}
window.addEventListener('resize',resize);$('quality').addEventListener('change',resize);$('combat').addEventListener('click',()=>launch(false));$('practice').addEventListener('click',()=>launch(true));$('pause').addEventListener('click',pause);$('mute').textContent=sound?'SOUND ON':'SOUND OFF';$('mute').addEventListener('click',()=>{sound=!sound;try{localStorage.setItem('afterburn-sound',String(sound));}catch(_){}$('mute').textContent=sound?'SOUND ON':'SOUND OFF';soundStart();audioUpdate(velocity.length());});
window.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||e.target.closest('input,select,button'))return;const key=e.key.toLowerCase();if([' ','arrowup','arrowdown','w','a','s','d','shift','f','p'].includes(key))e.preventDefault();if(key==='p'&&!e.repeat)pause();else if(key==='f'&&!e.repeat)flares();else if(state==='playing')keys.add(key);});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function positionReticle(){const r=canvas.getBoundingClientRect();$('reticle').style.left=(r.left+(aim.x+1)*.5*r.width)+'px';$('reticle').style.top=(r.top+(1-aim.y)*.5*r.height)+'px';}
function updateAim(e){aim.copy(pointerAim(e.clientX,e.clientY,canvas.getBoundingClientRect()));positionReticle();}
canvas.addEventListener('pointermove',updateAim);
canvas.addEventListener('pointerdown',e=>{if(state!=='playing')return;updateAim(e);canvas.setPointerCapture(e.pointerId);keys.add('fire');});for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>keys.delete('fire'));
for(const button of document.querySelectorAll('[data-key]')){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(state==='playing')keys.add(button.dataset.key);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(ev,()=>keys.delete(button.dataset.key));}$('touch-flare').addEventListener('click',flares);window.addEventListener('blur',()=>{if(state==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(state==='playing')pause();$('load-status').textContent='Graphics context lost. Reload to restart.';});
boot();
