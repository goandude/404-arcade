import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import assert from 'node:assert/strict';
const elements=new Map();let frame;
const element=id=>{if(!elements.has(id))elements.set(id,{style:{},value:id==='sensitivity'||id==='quality'?'1':'',checked:true,disabled:true,hidden:false,textContent:'',handlers:{},addEventListener(k,f){this.handlers[k]=f},focus(){},getBoundingClientRect(){return {left:0,top:0,width:1200,height:800}}});return elements.get(id)};
globalThis.document={getElementById:element,querySelectorAll:()=>[],addEventListener(){}};
globalThis.window={crypto:webcrypto,performance,addEventListener(){}};globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.innerWidth=1200;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;
globalThis.captureFrame=f=>frame=f;
let source=fs.readFileSync(new URL('main.js',import.meta.url),'utf8').replace("import * as THREE from 'three';",`import * as Actual from 'three';const THREE={...Actual,WebGLRenderer:class {setPixelRatio(){}setSize(){}render(){}setAnimationLoop(f){globalThis.captureFrame(f)}}};`);

source+='\nexport const test={launch,tick,display,get:()=>({state,armor,score,pos:pos.clone(),enemies:enemies.length})};';
const file=new URL('.smoke-main.mjs',import.meta.url);fs.writeFileSync(file,source);const {test}=await import(file.href);
for(let i=0;i<100&&!frame;i++)await new Promise(r=>setTimeout(r,50));
assert(frame,'Game initialized');assert.equal(element('load-status').textContent,'FLIGHT SYSTEMS READY · CHOOSE A MODE');
test.launch(true);for(let i=0;i<120*10;i++){try{test.tick(1/120)}catch(e){console.log("FAILED STEP",i,test.get());throw e;}}test.display();assert.equal(test.get().state,'playing');assert.equal(test.get().enemies,0);assert(test.get().pos.z < -900);
test.launch(false);for(let i=0;i<120*10;i++){try{test.tick(1/120)}catch(e){console.log("FAILED STEP",i,test.get());throw e;}}test.display();assert(test.get().enemies>0);assert.equal(test.get().state,'playing');
console.log('PASS: full scene construction, WASM initialization, cockpit construction, 10 seconds practice, mission enemy spawning, HUD updates. GPU rendering is not covered by this headless smoke test.');

