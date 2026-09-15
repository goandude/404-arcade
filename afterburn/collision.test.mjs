import assert from 'node:assert/strict';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {flightForces} from './flight.js';
await RAPIER.init();
const q=new THREE.Quaternion();const velocity={x:0,y:0,z:-105};
assert(flightForces(velocity,q,1,true).z<flightForces(velocity,q,1,false).z,'Afterburner adds thrust');
const pitched=new THREE.Quaternion().setFromEuler(new THREE.Euler(.3,0,0));assert(flightForces(velocity,pitched,.7,false).y>flightForces(velocity,q,.7,false).y,'Pitch adds climb force');
const banked=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,.5));assert(flightForces(velocity,banked,.7,false).x<0,'Bank tilts lift');
const world=new RAPIER.World({x:0,y:-9.81,z:0});world.timestep=1/120;
const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,80,0).setCcdEnabled(true).lockRotations());world.createCollider(RAPIER.ColliderDesc.ball(2).setMass(1).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),body);body.setLinvel(velocity,true);
world.createCollider(RAPIER.ColliderDesc.cuboid(8000,1,12000).setTranslation(0,-2,-8500));
for(let i=0;i<300;i++)world.createCollider(RAPIER.ColliderDesc.cuboid(50,80,50).setTranslation(i%2?230:-230,80,-i*95));
body.setTranslation({x:0,y:80,z:0},true);body.setAngvel({x:0,y:0,z:0},true);body.resetForces(true);
for(let i=0;i<120*30;i++){body.setRotation(q,true);body.resetForces(true);body.addForce(flightForces(body.linvel(),q,.7,false,true),true);world.step(new RAPIER.EventQueue(true));}
assert(Number.isFinite(body.translation().z));assert(Math.abs(body.translation().y-80)<1,'Assisted level flight maintains altitude');assert(-body.linvel().z>90&&-body.linvel().z<140,'Cruise speed remains bounded');
world.createCollider(RAPIER.ColliderDesc.cuboid(50,50,2).setTranslation(0,80,body.translation().z-40));for(let i=0;i<120;i++)world.step(new RAPIER.EventQueue(true));assert(body.linvel().z>-5,'Rapier prevents passing through wall');
console.log('PASS: thrust, pitch/lift, banking, 30-second stable flight, bounded cruise, high-speed terrain collision.');world.free();
