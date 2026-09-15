import assert from 'node:assert/strict';
import * as THREE from 'three';
import {pointerAim,cameraAim,nearestTarget} from './targeting.js';
for(const [width,height] of [[1200,800],[800,1200],[1920,1080]])for(const fov of [74,81]){
 const camera=new THREE.PerspectiveCamera(fov,width/height,.06,6500);camera.position.set(50,80,-900);camera.rotation.set(.2,.3,.4,'YXZ');
 for(const [x,y] of [[width/2,height/2],[width*.1,height*.8],[width*.85,height*.15]]){
  const aim=pointerAim(x+12,y+30,{left:12,top:30,width,height}),ray=cameraAim(camera,aim);
  const point=ray.at(300,new THREE.Vector3()),projected=point.clone().project(camera);
  assert(Math.abs(projected.x-aim.x)<1e-8&&Math.abs(projected.y-aim.y)<1e-8);
  const target={mesh:{position:point}};
  assert.equal(nearestTarget(ray,[target],1200).target,target);
  assert.equal(nearestTarget(ray,[target],100),null);
 }
}
console.log('PASS: cursor alignment across viewport sizes, banking, camera pitch and both FOVs; target hits and obstruction range.');
