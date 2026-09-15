import * as T from 'three';
export const DELIVERY_DISTANCE=12000;
export function segmentHits(a,b,center,radius){
 const delta=b.clone().sub(a),length=delta.lengthSq();
 const t=length?T.MathUtils.clamp(center.clone().sub(a).dot(delta)/length,0,1):0;
 return a.clone().addScaledVector(delta,t).distanceToSquared(center)<=radius*radius;
}
// Solve for where the target will be when a constant-speed projectile arrives.
export function interceptVelocity(origin,target,velocity,speed){
 const r=target.clone().sub(origin),a=velocity.lengthSq()-speed*speed,b=2*r.dot(velocity),c=r.lengthSq();let t=0;
 if(Math.abs(a)<1e-6){if(Math.abs(b)>1e-6)t=-c/b;}else{const d=b*b-4*a*c;if(d>=0){const roots=[(-b-Math.sqrt(d))/(2*a),(-b+Math.sqrt(d))/(2*a)].filter(n=>n>0);if(roots.length)t=Math.min(...roots);}}
 return r.addScaledVector(velocity,Math.max(0,Math.min(t,3))).normalize().multiplyScalar(speed);
}
export function createMission(scene,{message,tone,damage,destroyRock,complete,explosion=()=>{}}){
 const enemies=[],bolts=[],effects=[];let wave=0,kills=0,cooldown=0,heat=0,locked=false,finished=false;
 const green=new T.MeshStandardMaterial({color:0x618641,metalness:.45,roughness:.36});
 const glow=new T.MeshBasicMaterial({color:0x94ff35});
 const chunkGeo=new T.IcosahedronGeometry(1,1),dustGeo=new T.SphereGeometry(1,8,6);
 function shatter(position,radius=8,rock=false){
  explosion(rock? .65:1);
  for(let i=0;i<32;i++){
   const dust=i>=20,mat=dust?new T.MeshBasicMaterial({color:rock?0x91867c:0xf39640,transparent:true,opacity:.22,depthWrite:false}):new T.MeshStandardMaterial({color:rock?0x635446:0x364128,roughness:.9,transparent:true});
   const mesh=new T.Mesh(dust?dustGeo:chunkGeo,mat);mesh.position.copy(position);
   const direction=new T.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();mesh.position.addScaledVector(direction,Math.random()*radius*.5);
   const size=dust?radius*.22:.3+Math.random()*radius*.14;mesh.scale.setScalar(size);scene.add(mesh);
   effects.push({mesh,life:dust?1.1:2.2,max:dust?1.1:2.2,velocity:direction.multiplyScalar(12+Math.random()*40),spin:new T.Vector3(Math.random()*5,Math.random()*5,Math.random()*5),size,dust,opacity:dust?.22:1,materialOnly:true});
  }
  if(!rock){const flash=new T.Mesh(dustGeo,new T.MeshBasicMaterial({color:0xffe6a0,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));flash.position.copy(position);scene.add(flash);effects.push({mesh:flash,life:.25,max:.25,burst:true,materialOnly:true});}
 }
 const hullGeo=new T.OctahedronGeometry(3),wingGeo=new T.ConeGeometry(2,12,3);
 const boltGeo=new T.SphereGeometry(.65,8,6),boltMat=new T.MeshBasicMaterial({color:0x8cff36});
 const station=new T.Group(),ring=new T.Mesh(new T.TorusGeometry(48,3,8,64),new T.MeshStandardMaterial({color:0x91c0cb,metalness:.7,roughness:.4}));station.add(ring);
 for(let i=0;i<8;i++){const m=new T.Mesh(new T.BoxGeometry(8,15,8),green);m.position.set(Math.cos(i*Math.PI/4)*48,Math.sin(i*Math.PI/4)*48,0);station.add(m);}
 station.visible=false;scene.add(station);
 function removeTransient(item){scene.remove(item.mesh);if(item.dispose){item.mesh.geometry.dispose();item.mesh.material.dispose();}else if(item.materialOnly)item.mesh.material.dispose();}
 function burst(position,color=0xffa844){const mesh=new T.Mesh(new T.IcosahedronGeometry(1,1),new T.MeshBasicMaterial({color,transparent:true,opacity:.9,wireframe:true}));mesh.position.copy(position);scene.add(mesh);effects.push({mesh,life:.5,max:.5,dispose:true,burst:true});}
 function beam(a,b){
 const direction=b.clone().sub(a),length=direction.length();if(length<.001)return;
 // Mesh beams keep their thickness across WebGL implementations.
 for(const [radius,color,opacity] of [[.22,0xc9faff,1],[.58,0x38cfff,.28]]){
 const material=new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending});
 const mesh=new T.Mesh(new T.CylinderGeometry(radius,radius,length,8,1,true),material);
 mesh.position.copy(a).addScaledVector(direction,.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
 scene.add(mesh);effects.push({mesh,life:.12,max:.12,opacity,dispose:true});
 direction.copy(b).sub(a);
 }
 }
 function spawn(pos,count){for(let i=0;i<count;i++){
 const mesh=new T.Group(),hull=new T.Mesh(hullGeo,green);hull.scale.set(1.2,.65,2.7);mesh.add(hull);
 for(const side of [-1,1]){
  const shape=new T.Shape();shape.moveTo(side*1,0);shape.lineTo(side*10,-3);shape.lineTo(side*12,-9);shape.lineTo(side*6,-5);shape.lineTo(side*2,-4);shape.closePath();
  const wing=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:true,bevelThickness:.15,bevelSize:.2,bevelSegments:1}),green);wing.rotation.x=Math.PI/2;mesh.add(wing);
  const engine=new T.Mesh(new T.CylinderGeometry(1.3,1.5,4,12),green);engine.rotation.x=Math.PI/2;engine.position.set(side*3,0,-3);mesh.add(engine);
  const eye=new T.Mesh(boltGeo,glow);eye.scale.set(1.8,.4,1);eye.position.set(side*1.4,.8,3);mesh.add(eye);
  const exhaust=new T.Mesh(new T.CircleGeometry(1,16),glow);exhaust.position.set(side*3,0,-5.1);exhaust.rotation.y=Math.PI;mesh.add(exhaust);
 }
 mesh.scale.setScalar(1.5);scene.add(mesh);const mode=i%3;mesh.position.copy(pos).add(new T.Vector3(0,0,-160));
 enemies.push({mesh,hp:18,age:0,phase:i*1.3,mode,fire:2.5+i*.65});
 }message('Stay on the Razorwing. Watch its rear cannons.');tone(180,480,.4);}
 function removeEnemy(e){scene.remove(e.mesh);e.mesh.traverse(m=>{if(m.isMesh&&m.geometry!==hullGeo&&m.geometry!==boltGeo)m.geometry.dispose();});}

 return {
 reset(){for(const e of enemies)removeEnemy(e);for(const e of [...bolts,...effects])removeTransient(e);enemies.length=bolts.length=effects.length=0;wave=kills=cooldown=heat=0;locked=finished=false;station.visible=false;},
 update(dt,{pos,distance,camera,aim,firing,rocks,velocity=new T.Vector3(0,0,-155)}){
 if(finished)return;
 cooldown=Math.max(0,cooldown-dt);heat=Math.max(0,heat-dt*24);if(heat<30)locked=false;
 if(wave===0){spawn(pos,1);wave=1;}
 for(const e of enemies){e.age+=dt;e.fire-=dt;
 const targetX=pos.x+Math.sin(e.age*.45)*42+Math.sin(e.age*.9)*12,targetY=pos.y+12+Math.sin(e.age*.38)*12;
 const dx=targetX-e.mesh.position.x,dy=targetY-e.mesh.position.y;
 e.mesh.position.x+=dx*Math.min(1,dt*.9);e.mesh.position.y+=dy*Math.min(1,dt*.9);
 const gap=pos.z-e.mesh.position.z;
 e.mesh.position.z-= (-velocity.z+(120+Math.sin(e.age*.55)*30-gap)*1.4+Math.sin(e.age*.6)*12)*dt;
 e.mesh.rotation.set(.22-dy*.003,Math.PI-dx*.004,-dx*.005);
 if(e.fire<=0&&gap>15&&gap<650){e.fire=1.4;const mesh=new T.Mesh(boltGeo,boltMat);mesh.scale.set(1.6,1.6,7);mesh.position.copy(e.mesh.position).add(new T.Vector3(0,0,8));const shot=interceptVelocity(mesh.position,pos,velocity,460);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),shot.clone().normalize());scene.add(mesh);bolts.push({mesh,velocity:shot,life:4});tone(300,120,.12);}
 }
 for(let i=bolts.length-1;i>=0;i--){const b=bolts[i],old=b.mesh.position.clone();b.mesh.position.addScaledVector(b.velocity,dt);b.life-=dt;if(segmentHits(old,b.mesh.position,pos,3.5)){damage();b.life=0;}if(b.life<=0){removeTransient(b);bolts.splice(i,1);}}
 if(firing&&cooldown===0&&!locked){cooldown=.14;heat+=13;if(heat>=100){heat=100;locked=true;message('Cannons cooling. Keep moving.');}const ray=new T.Raycaster();camera.updateMatrixWorld();ray.setFromCamera(aim,camera);
 let closest=1800,hit=null;for(const e of enemies){const point=ray.ray.intersectSphere(new T.Sphere(e.mesh.position,11),new T.Vector3());if(point){const d=point.distanceTo(camera.position);if(d<closest){closest=d;hit={enemy:e};}}}
 for(const rock of rocks){const point=ray.ray.intersectSphere(new T.Sphere(rock.mesh.position,rock.radius),new T.Vector3());if(point){const d=point.distanceTo(camera.position);if(d<closest){closest=d;hit={rock};}}}
 const end=ray.ray.at(closest,new T.Vector3());for(const side of [-1,1])beam(pos.clone().add(new T.Vector3(side*2.5,0,-2)),end);tone(850,220,.08);
 if(hit?.enemy){const e=hit.enemy;e.hp--;burst(end,0x99ff66);if(e.hp<=0){shatter(e.mesh.position,10);removeEnemy(e);enemies.splice(enemies.indexOf(e),1);kills++;tone(150,35,.3);}}
 if(hit?.rock){shatter(hit.rock.mesh.position,hit.rock.radius,true);destroyRock(hit.rock);}
 }
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.mesh.material.opacity=Math.max(0,e.life/e.max)*(e.opacity??1);if(e.velocity){e.mesh.position.addScaledVector(e.velocity,dt);e.mesh.rotation.x+=e.spin.x*dt;e.mesh.rotation.y+=e.spin.y*dt;if(e.dust)e.mesh.scale.setScalar(e.size+(e.max-e.life)*12);}if(e.burst)e.mesh.scale.setScalar(1+(e.max-e.life)*25);if(e.life<=0){removeTransient(e);effects.splice(i,1);}}
 station.visible=false;
 if(kills>=1){finished=true;complete(kills);}
 },
 get status(){return {kills,heat,locked,wave,enemies:enemies.length,target:enemies[0]?.mesh.position.clone(),enemyHull:enemies[0]?.hp??0};}
 };
}
