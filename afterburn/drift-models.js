import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
const metal=(color,roughness=.45,metalness=.5)=>new T.MeshStandardMaterial({color,roughness,metalness});
export function buildShip(){
 const root=new T.Group(),ivory=metal(0xdadfdc,.36,.6),orange=metal(0xd8883d,.43,.5),dark=metal(0x253646,.44,.75),steel=metal(0x849bab,.3,.85),black=metal(0x101b28,.5,.3);
 const engines=[];
 const box=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,20,14);
 function m(geo,mat,x,y,z,sx=1,sy=1,sz=1){const mesh=new T.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);root.add(mesh);return mesh;}
 function panel(points,mat,depth=.14,y=0){const s=new T.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const mesh=new T.Mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.04,bevelSize:.06,bevelSegments:1}),mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;root.add(mesh);return mesh;}
 // Long compound hull with an armored keel and sharply tapered nose.
 m(sphere,dark,0,-.25,.2,1.04,.65,4.6);
 const sections=[[-6,.05,.05],[-4.8,.5,.38],[-2.4,.92,.65],[.8,1.12,.7],[3,1,.58],[3.9,.72,.45]];
 const points=[];for(const [z,w,h]of sections)for(let i=0;i<8;i++){let a=i*Math.PI/4;points.push(Math.cos(a)*w,Math.sin(a)*h,z);}
 const indices=[];for(let r=0;r<sections.length-1;r++)for(let i=0;i<8;i++){let a=r*8+i,b=r*8+(i+1)%8,c=a+8,d=b+8;indices.push(a,b,c,b,d,c);}
 const hull=new T.BufferGeometry();hull.setAttribute('position',new T.Float32BufferAttribute(points,3));hull.setIndex(indices);hull.computeVertexNormals();m(hull,ivory,0,0,0);
 for(const side of [-1,1]){
 panel([[side*.8,-2.8],[side*5.6,1.65],[side*5.7,2.7],[side*1.1,1.4]],ivory,.16,-.08);
 panel([[side*1.2,-1.7],[side*4.7,1.6],[side*4.75,1.93],[side*1.1,-.8]],orange,.06,.13);
 panel([[side*1.4,.1],[side*3.3,1.5],[side*2.6,1.5]],steel,.03,.17);
 panel([[side*.6,2],[side*2.7,3.6],[side*2.3,4],[side*.6,3.1]],ivory,.12,.1);
 const fin=m(box,orange,side*.9,1.18,2.45,.12,1.8,1.1);fin.rotation.z=-side*.23;fin.rotation.x=.25;
 m(box,dark,side*5.4,.07,2.25,.35,.3,1.2);
 // Panel seams and tiny mechanical latches.
 for(let i=0;i<5;i++)m(box,dark,side*(1.8+i*.57),.2,.65+i*.32,.025,.015,.55);
 for(let i=0;i<5;i++)m(box,black,side*.85,.58,.4+i*.27,.27,.025,.07);
 m(box,steel,side*.75,.18,-3,.07,.05,1.8);
 }
 // Reflective blue canopy with structural frames and a visible seat beneath it.
 m(sphere,black,0,.57,-1.7,.64,.43,1.65);m(box,dark,0,.76,-1.2,.4,.38,.45);
 const glass=new T.MeshPhysicalMaterial({color:0x235474,metalness:.5,roughness:.12,clearcoat:1,clearcoatRoughness:.08,transparent:true,opacity:.87});
 m(sphere,glass,0,.79,-1.7,.65,.62,1.62);
 for(const z of [-2.7,-.8]){const frame=m(new T.TorusGeometry(.62,.027,5,28),steel,0,.78,z,1,.9,1);frame.rotation.x=.0;}
 m(box,steel,0,1.39,-1.7,.025,.025,1.3);m(box,orange,0,.67,1.5,.4,.1,1.8);
 // Three concentric exhaust assemblies, fan blades, housings and luminous cores.
 for(const [x,y,z,r]of [[0,-.06,4.1,.76],[-2.35,-.08,2.65,.43],[2.35,-.08,2.65,.43]]){
 const casing=m(new T.CylinderGeometry(r*.92,r,1.7,20,1,true),dark,x,y,z-.45);casing.rotation.x=Math.PI/2;
 for(let i=0;i<3;i++)m(new T.TorusGeometry(r*(1-i*.08),.05,6,24),i===0?steel:dark,x,y,z+i*.11);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const blade=m(box,steel,x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,z,.06,.06,.4);blade.rotation.z=a;}
 const coreMat=new T.MeshBasicMaterial({color:0xa8edff});coreMat.color.multiplyScalar(3.2);
 m(new T.CircleGeometry(r*.78,24),coreMat,x,y,z+.13);
 const flameMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,uniforms:{uTime:{value:0},uBoost:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv;uniform float uTime;uniform float uBoost;void main(){float t=1.0-vUv.y;float bands=.8+.2*sin(t*45.-uTime*35.);float a=pow(t,1.5)*bands*.65;vec3 c=mix(vec3(.03,.25,1.),vec3(.6,.93,1.4),pow(t,3.));gl_FragColor=vec4(c*(1.2+uBoost),a);}' });
 const flame=m(new T.ConeGeometry(r*.78,4.8,18,1,true),flameMat,x,y,z+2.55);flame.rotation.x=Math.PI/2;
 const light=new T.PointLight(0x72cfff,2,10,2);light.position.set(x,y,z+1);root.add(light);
 engines.push({flame,material:flameMat,z:z+.15,r});
 }
 // Position lights and dorsal navigation beacon.
 for(const side of [-1,1])m(sphere,new T.MeshBasicMaterial({color:side<0?0xff6553:0x64e3d9}),side*5.7,.1,2.6,.07,.07,.13);
 return {root,engines};
}
function rand(seed){let x=seed|0;return()=>{x=(x*1664525+1013904223)|0;return(x>>>0)/4294967296;};}
export function asteroidGeometry(seed,detail=48){
 const random=rand(seed),craters=[];for(let i=0;i<48;i++){const y=random()*2-1,a=random()*Math.PI*2;craters.push({n:new T.Vector3(Math.sqrt(1-y*y)*Math.cos(a),y,Math.sqrt(1-y*y)*Math.sin(a)),r:.09+random()*.21,d:.07+random()*.13});}
 const geo=new T.IcosahedronGeometry(1,detail),p=geo.attributes.position,colors=[];
 const v=new T.Vector3();for(let i=0;i<p.count;i++){
 v.fromBufferAttribute(p,i).normalize();let radius=1+.09*Math.sin(v.x*8+seed)*Math.cos(v.y*6-v.z*5)+.006*Math.sin(v.x*39+v.y*31+v.z*27);
 let cavity=0;for(const c of craters){let d=v.distanceTo(c.n)/c.r;if(d<1){const bowl=(1-d*d);radius-=c.d*bowl;cavity+=bowl;}else if(d<1.22)radius+=.035*Math.sin((d-1)/.22*Math.PI);}
 const noise=(Math.sin(v.x*113+v.y*59+v.z*83)*.5+.5),shade=T.MathUtils.clamp(.7+noise*.22-cavity*.2,.28,1);
 colors.push(.23*shade,.17*shade,.12*shade);p.setXYZ(i,v.x*radius*(.92+seed%3*.05),v.y*radius,v.z*radius*1.08);
 }geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.deleteAttribute('normal');geo.deleteAttribute('uv');const smooth=mergeVertices(geo, .0001);smooth.computeVertexNormals();smooth.computeBoundingSphere();geo.dispose();return smooth;
}
