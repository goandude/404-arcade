import * as THREE from 'three';
export function pointerAim(x,y,rect){return new THREE.Vector2(THREE.MathUtils.clamp((x-rect.left)/rect.width*2-1,-1,1),THREE.MathUtils.clamp(1-(y-rect.top)/rect.height*2,-1,1));}
export function cameraAim(camera,aim){camera.updateMatrixWorld(true);const raycaster=new THREE.Raycaster();raycaster.setFromCamera(aim,camera);return raycaster.ray.clone();}
export function nearestTarget(ray,targets,maxDistance){let nearest=null;const point=new THREE.Vector3();for(const target of targets){const hit=ray.intersectSphere(new THREE.Sphere(target.mesh.position,7),point);if(hit){const distance=point.distanceTo(ray.origin);if(distance<maxDistance){maxDistance=distance;nearest={target,point:point.clone(),distance};}}}return nearest;}
