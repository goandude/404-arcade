import * as THREE from 'three';
export const centerAt=z=>Math.sin(z*.0008)*115+Math.sin(z*.0021)*28;
export function flightForces(velocity,quaternion,throttle,boost,assist=true){
 const forward=new THREE.Vector3(0,0,-1).applyQuaternion(quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(quaternion);
 const v=new THREE.Vector3(velocity.x,velocity.y,velocity.z),speed=v.length();
 const along=v.dot(forward),lift=9.81*Math.min(1.6,(Math.max(0,along)/105)**2);
 const force=forward.multiplyScalar(8+throttle*14+(boost?15:0));
 force.addScaledVector(v,-.00165*speed);force.addScaledVector(up,lift);
 // Lateral aerodynamic damping aligns momentum gradually with the nose.
 const lateral=v.clone().addScaledVector(new THREE.Vector3(0,0,-1).applyQuaternion(quaternion),-along);
 force.addScaledVector(lateral,-.55);
 if(assist)force.y+=Math.max(-6,Math.min(6, -v.y*.22+9.81-lift*up.y));
 return force;
}
