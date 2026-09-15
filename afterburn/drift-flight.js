import * as THREE from 'three';
export function driftForce(velocity,input,boost){
 const speed=-velocity.z,thrust=boost?65:31;
 return {x:input.x*145-velocity.x*1.85,y:input.y*125-velocity.y*1.85,z:-thrust+.00125*speed*Math.abs(speed)};
}
export function pursuitPose(position,velocity,boost){
 return {camera:new THREE.Vector3(position.x-velocity.x*.085,position.y+7.5-velocity.y*.11,position.z+(boost?20:22)),target:new THREE.Vector3(position.x+velocity.x*.08,position.y+5+velocity.y*.18,position.z-55)};
}

export function flightHeading(velocity){
 const forward=Math.max(.001,-velocity.z);
 return {yaw:Math.atan2(velocity.x,forward)*180/Math.PI,pitch:Math.atan2(velocity.y,Math.hypot(velocity.x,forward))*180/Math.PI};
}
