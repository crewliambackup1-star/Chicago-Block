import * as THREE from 'three';
import { getCarSteeringInput } from './controls.js';

const $ = (id) => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9eafb4);
scene.fog = new THREE.Fog(0x9eafb4, 125, 340);

// A lightweight procedural sky dome adds a proper horizon, cloud texture, and night stars.
const skyCanvas=document.createElement('canvas');skyCanvas.width=1024;skyCanvas.height=512;
const skyContext=skyCanvas.getContext('2d');
const skyGradient=skyContext.createLinearGradient(0,0,0,512);
skyGradient.addColorStop(0,'#315b7c');skyGradient.addColorStop(.43,'#78a0b1');
skyGradient.addColorStop(.78,'#c4c3b4');skyGradient.addColorStop(1,'#e3b991');
skyContext.fillStyle=skyGradient;skyContext.fillRect(0,0,1024,512);
for(let i=0;i<95;i++){
  const x=(Math.sin(i*91.73)*.5+.5)*1024,y=65+(Math.sin(i*17.31)*.5+.5)*205;
  const rx=22+(Math.sin(i*7.91)*.5+.5)*58,ry=5+(Math.sin(i*3.17)*.5+.5)*12;
  const cloud=skyContext.createRadialGradient(x,y,1,x,y,rx);
  cloud.addColorStop(0,'rgba(244,244,235,.20)');cloud.addColorStop(1,'rgba(244,244,235,0)');
  skyContext.fillStyle=cloud;skyContext.beginPath();skyContext.ellipse(x,y,rx,ry,0,0,Math.PI*2);skyContext.fill();
}
const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.colorSpace=THREE.SRGBColorSpace;
const skyMaterial=new THREE.MeshBasicMaterial({map:skyTexture,side:THREE.BackSide,depthWrite:false,fog:false});
const skyDome=new THREE.Mesh(new THREE.SphereGeometry(490,48,32),skyMaterial);
skyDome.renderOrder=-1000;skyDome.frustumCulled=false;scene.add(skyDome);
const starPositions=[];
for(let i=0;i<180;i++){
  const y=.15+Math.random()*.84,angle=Math.random()*Math.PI*2,r=Math.sqrt(1-y*y)*480;
  starPositions.push(Math.cos(angle)*r,y*480,Math.sin(angle)*r);
}
const starGeometry=new THREE.BufferGeometry();
starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
const starMaterial=new THREE.PointsMaterial({color:0xe4efff,size:1.65,transparent:true,opacity:0,depthWrite:false});
const stars=new THREE.Points(starGeometry,starMaterial);stars.frustumCulled=false;scene.add(stars);
const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(7,18,14),new THREE.MeshBasicMaterial({color:0xffe4b3,fog:false}));
sunDisc.frustumCulled=false;scene.add(sunDisc);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, .1, 600);
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = true;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
$('game').appendChild(renderer.domElement);

const mat = (color, roughness=.9) => new THREE.MeshStandardMaterial({color, roughness});
const M = {
  grass:mat(0x687d60), road:mat(0xffffff), walk:mat(0xffffff), line:mat(0xe5e2d8),
  yellow:mat(0xf0c65f), brick:mat(0xc08270), dark:mat(0xb17b6d), cream:mat(0xe2d1b7),
  glass:mat(0x243e4b,.25), metal:mat(0x3a4145,.55), wood:mat(0x694a32),
  leaf:mat(0x416a49), skin:mat(0x986d52), blue:mat(0x365b75), green:mat(0x55714e),
  red:mat(0x8c5142), tire:mat(0x171a1b), white:mat(0xece8dc),
  trim:mat(0x514b43,.72), silver:mat(0x9b9b94,.48),
  windowLit:new THREE.MeshStandardMaterial({color:0xffd9a5,emissive:0x8a4e1d,emissiveIntensity:.72,roughness:.35}),
  lampGlow:new THREE.MeshStandardMaterial({color:0xffe5b2,emissive:0xffb95c,emissiveIntensity:1.4,roughness:.25}),
  headlight:new THREE.MeshStandardMaterial({color:0xfff4d6,emissive:0xffd78a,emissiveIntensity:1.25,roughness:.22}),
  tailLight:new THREE.MeshStandardMaterial({color:0x9f231c,emissive:0xa51f17,emissiveIntensity:.8,roughness:.3})
};
function makeTexture(paint){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext('2d');paint(ctx,512,512);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
  return texture;
}
const brickTexture=makeTexture((ctx,w,h)=>{
  ctx.fillStyle='#4a302b';ctx.fillRect(0,0,w,h);
  const row=32,brick=96;
  for(let y=0;y<h;y+=row){
    const offset=(Math.floor(y/row)%2)*-brick/2;
    for(let x=offset;x<w+brick;x+=brick){
      const shade=92+Math.floor((Math.sin(x*12.7+y*4.3)+1)*18);
      ctx.fillStyle=`rgb(${shade+35},${shade-12},${shade-22})`;
      ctx.fillRect(x+3,y+3,brick-6,row-6);
    }
  }
});
brickTexture.repeat.set(3,2);
const concreteTexture=makeTexture((ctx,w,h)=>{
  ctx.fillStyle='#aaa49a';ctx.fillRect(0,0,w,h);
  for(let i=0;i<2600;i++){
    const x=(i*73)%w,y=(i*151)%h,v=110+((i*37)%90);
    ctx.fillStyle=`rgba(${v},${v-3},${v-8},.12)`;ctx.fillRect(x,y,1+(i%3),1+(i%2));
  }
  ctx.strokeStyle='rgba(55,52,48,.18)';ctx.lineWidth=2;
  for(let y=64;y<h;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
});
concreteTexture.repeat.set(2,2);
const asphaltTexture=makeTexture((ctx,w,h)=>{
  ctx.fillStyle='#3b4145';ctx.fillRect(0,0,w,h);
  for(let i=0;i<4200;i++){
    const x=(i*47)%w,y=(i*113)%h,v=80+((i*19)%65);
    ctx.fillStyle=`rgba(${v},${v+2},${v+4},.20)`;ctx.fillRect(x,y,1+(i%2),1+(i%2));
  }
});
asphaltTexture.repeat.set(12,3);
const sidewalkTexture=makeTexture((ctx,w,h)=>{
  ctx.fillStyle='#a7a79f';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(45,48,47,.22)';ctx.lineWidth=3;
  for(let x=0;x<w;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=0;y<h;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
});
sidewalkTexture.repeat.set(5,2);
M.brick.map=brickTexture;M.dark.map=concreteTexture;M.cream.map=concreteTexture;
M.road.map=asphaltTexture;M.walk.map=sidewalkTexture;
M.brick.needsUpdate=M.dark.needsUpdate=M.cream.needsUpdate=M.road.needsUpdate=M.walk.needsUpdate=true;
const world = new THREE.Group(); scene.add(world);
const colliders = [], pedestrians = [], traffic = [], keys = Object.create(null), touch = Object.create(null), windows = [];
function cube(parent,x,y,z,w,h,d,material,shadow=true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z); mesh.castShadow=shadow; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
function ground(x,z,w,d,material,y=-.05) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,d),material);
  mesh.rotation.x=-Math.PI/2; mesh.position.set(x,y,z); mesh.receiveShadow=true; world.add(mesh); return mesh;
}
function block(x,z,w,d){colliders.push({x,z,w,d});}
function blocked(x,z,r=.48) {
  if(Math.abs(x)>151-r||Math.abs(z)>151-r)return true;
  return colliders.some(c=>x>c.x-c.w/2-r&&x<c.x+c.w/2+r&&z>c.z-c.d/2-r&&z<c.z+c.d/2+r);
}
scene.add(new THREE.HemisphereLight(0xd9e7f0,0x46513e,1.25));
const sun=new THREE.DirectionalLight(0xffe1bc,2.15);
sun.position.set(-85,115,-65);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.bias=-0.00008;sun.shadow.normalBias=.025;sun.shadow.camera.near=1;sun.shadow.camera.far=340;
sun.shadow.camera.left=-180;sun.shadow.camera.right=180;sun.shadow.camera.top=180;sun.shadow.camera.bottom=-180;
sun.shadow.camera.updateProjectionMatrix();scene.add(sun);
const ambientLight=scene.children.find(item=>item.isHemisphereLight);

// Three-by-three fictional street grid.
ground(0,0,320,320,M.grass,-.2);
for(const v of [-82,0,82]){
  ground(0,v,320,17,M.road,-.08);ground(v,0,17,320,M.road,-.075);
  for(const side of [-1,1]){ground(0,v+side*10.1,320,3.1,M.walk,-.02);ground(v+side*10.1,0,3.1,320,M.walk,-.02);}
  for(let p=-150;p<=150;p+=13){if(Math.abs(p-v)<18)continue;cube(world,p,.015,v,5,.025,.15,M.line,false);cube(world,v,.015,p,.15,.025,5,M.line,false);}
  cube(world,0,.02,v-.13,320,.025,.12,M.yellow,false);cube(world,0,.02,v+.13,320,.025,.12,M.yellow,false);
  cube(world,v-.13,.02,0,.12,.025,320,M.yellow,false);cube(world,v+.13,.02,0,.12,.025,320,M.yellow,false);
  for(let p=-150;p<=150;p+=20){
    if(Math.abs(p-v)<18)continue;
    cube(world,p,.018,v-4.5,4.5,.025,.13,M.white,false);
    cube(world,p,.018,v+4.5,4.5,.025,.13,M.white,false);
    cube(world,v-4.5,.018,p,.13,.025,4.5,M.white,false);
    cube(world,v+4.5,.018,p,.13,.025,4.5,M.white,false);
  }
}
for(const x of [-82,0,82])for(const z of [-82,0,82])for(let k=-3;k<=3;k++){
  cube(world,x+k*1.15,.025,z-7,.55,.03,2.6,M.white,false);
  cube(world,x-7,.025,z+k*1.15,2.6,.03,.55,M.white,false);
}
function building(x,z,w,d,h,color,side=true){
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  cube(g,0,h/2,0,w,h,d,color);cube(g,0,h+.2,0,w+.5,.4,d+.5,M.dark);
  cube(g,0,.16,0,w+.28,.32,d+.28,M.trim,false);
  cube(g,0,h+.43,0,w+.9,.16,d+.9,M.trim,false);
  for(let level=3.3;level<h;level+=3.3){
    cube(g,0,level,d/2+.035,w,.075,.13,M.trim,false);
    cube(g,0,level,-d/2-.035,w,.075,.13,M.trim,false);
    cube(g,w/2+.035,level,0,.13,.075,d,M.trim,false);
    cube(g,-w/2-.035,level,0,.13,.075,d,M.trim,false);
  }
  for(const sx of [-1,1])for(const sz of [-1,1])cube(g,sx*(w/2-.12),h/2,sz*(d/2-.12),.16,h,.16,M.trim,false);
  const rows=Math.max(2,Math.floor(h/3.3)),cols=Math.max(2,Math.floor(w/4.7));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const px=-w/2+(c+.5)*w/cols,py=1.4+r*(h-2.2)/rows;
    for(const face of [-1,1])windows.push({x:x+px,y:py,z:z+face*(d/2+.04),sx:1.1,sy:1.4,sz:.08,face:'z',faceSign:face});
    if(side)for(const face of [-1,1])windows.push({x:x+face*(w/2+.04),y:py,z:z-d/2+(c+.5)*d/cols,sx:.08,sy:1.35,sz:1,face:'x',faceSign:face});
  }
  cube(g,0,1.05,d/2+.06,1.1,2.1,.12,M.wood,false);block(x,z,w,d);
}
[
 [-119,-120,42,31,15,M.brick],[-72,-121,21,28,11,M.cream],
 [36,-120,40,30,17,M.dark],[119,-119,42,32,16,M.brick],
 [-119,-34,34,35,13,M.cream],[-42,-37,36,38,18,M.brick],
 [120,-35,39,36,17,M.cream],[-118,42,38,37,15,M.dark],
 [118,41,42,36,16,M.brick],[-119,120,40,31,14,M.cream],
 [-35,120,35,30,15,M.brick],[42,120,39,31,15,M.dark],
 [119,120,40,31,17,M.cream]
].forEach(args=>building(...args));

function rooftopUnit(x,z,roofHeight,rotation=0){
  const group=new THREE.Group();group.position.set(x,roofHeight,z);group.rotation.y=rotation;world.add(group);
  cube(group,0,.42,0,2.25,.84,1.55,M.metal);
  cube(group,0,.88,0,2.32,.12,1.62,M.silver,false);
  for(let i=0;i<7;i++)cube(group,-.86+i*.287,.43,.79,.055,.52,.035,M.trim,false);
  const fan=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.09,18),M.trim);fan.position.set(0,.96,0);group.add(fan);
  const fanHub=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.12,12),M.silver);fanHub.position.set(0,1.03,0);group.add(fanHub);
  for(let i=0;i<4;i++){
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.12,.035,.72),M.silver);
    blade.position.set(0,1.025,0);blade.rotation.y=i*Math.PI/2;group.add(blade);
  }
  return group;
}
[
  [-129,-124,15.55,0],[-110,-114,15.55,.4],[-51,-42,18.55,0],
  [112,-39,17.55,.6],[128,-31,17.55,0],[-128,38,15.55,.2],
  [111,37,16.55,0],[-42,116,15.55,.5],[50,117,15.55,0],[126,116,17.55,.3]
].forEach(args=>rooftopUnit(...args));

function rooftopWaterTank(x,z,roofHeight){
  const group=new THREE.Group();group.position.set(x,roofHeight,z);world.add(group);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    cube(group,sx*.92,1.25,sz*.92,.12,2.5,.12,M.metal);
    cube(group,sx*.92,2.5,sz*.92,.2,.12,.2,M.silver,false);
  }
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.42,2.1,16,1),M.wood);
  tank.position.y=3.55;tank.castShadow=true;group.add(tank);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(1.38,1.38,.12,16),M.trim);top.position.y=4.65;group.add(top);
  for(let i=0;i<5;i++)cube(group,-.75+i*.375,3.55,1.405,.045,1.65,.045,M.trim,false);
}
rooftopWaterTank(-119,-120,15.55);

const windowMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1), M.glass, windows.length);
const windowTransform = new THREE.Object3D();
windows.forEach((item,index)=>{
  windowTransform.position.set(item.x,item.y,item.z);
  windowTransform.scale.set(item.sx,item.sy,item.sz);
  windowTransform.updateMatrix();
  windowMesh.setMatrixAt(index,windowTransform.matrix);
});
windowMesh.instanceMatrix.needsUpdate=true;
windowMesh.castShadow=false;
world.add(windowMesh);
const litWindows=windows.filter((item,index)=>index%5===0);
const windowLightMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M.windowLit,litWindows.length);
litWindows.forEach((item,index)=>{
  windowTransform.position.set(item.x+(item.face==='x'?item.faceSign*.055:0),item.y,item.z+(item.face==='z'?item.faceSign*.055:0));
  windowTransform.scale.set(item.face==='x'?.025:item.sx*.76,item.sy*.78,item.face==='z'?.025:item.sz*.76);
  windowTransform.updateMatrix();windowLightMesh.setMatrixAt(index,windowTransform.matrix);
});
windowLightMesh.instanceMatrix.needsUpdate=true;windowLightMesh.castShadow=false;world.add(windowLightMesh);
const windowFrameMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M.trim,windows.length*4);
let frameIndex=0;
for(const item of windows){
  const sign=item.faceSign,front=item.face==='z';
  const pieces=front?[
    [item.x,item.y-item.sy/2-.035,item.z+sign*.055,item.sx+.12,.075,.13],
    [item.x,item.y+item.sy/2+.035,item.z+sign*.055,item.sx+.12,.075,.13],
    [item.x-item.sx/2-.035,item.y,item.z+sign*.055,.075,item.sy,.13],
    [item.x+item.sx/2+.035,item.y,item.z+sign*.055,.075,item.sy,.13]
  ]:[
    [item.x+sign*.055,item.y-item.sy/2-.035,item.z,.13,.075,item.sz+.12],
    [item.x+sign*.055,item.y+item.sy/2+.035,item.z,.13,.075,item.sz+.12],
    [item.x+sign*.055,item.y,item.z-item.sz/2-.035,.13,item.sy,.075],
    [item.x+sign*.055,item.y,item.z+item.sz/2+.035,.13,item.sy,.075]
  ];
  for(const [x,y,z,sx,sy,sz] of pieces){
    windowTransform.position.set(x,y,z);windowTransform.scale.set(sx,sy,sz);
    windowTransform.updateMatrix();windowFrameMesh.setMatrixAt(frameIndex++,windowTransform.matrix);
  }
}
windowFrameMesh.instanceMatrix.needsUpdate=true;windowFrameMesh.castShadow=false;world.add(windowFrameMesh);

// Corner market, courtyard, benches and trees.
const shop=new THREE.Group();shop.position.set(39,0,-38);world.add(shop);
cube(shop,0,4.7,0,27,9.4,12,M.dark);cube(shop,0,9.55,0,27.6,.5,12.6,M.brick);
cube(shop,0,6.4,6.08,10,2.2,.16,M.glass,false);
const marketSignCanvas=document.createElement('canvas');marketSignCanvas.width=1024;marketSignCanvas.height=160;
const marketSignContext=marketSignCanvas.getContext('2d');
marketSignContext.fillStyle='#d7a84f';marketSignContext.fillRect(0,0,1024,160);
marketSignContext.fillStyle='#26343a';marketSignContext.fillRect(12,12,1000,136);
marketSignContext.strokeStyle='#f4d58d';marketSignContext.lineWidth=7;marketSignContext.strokeRect(24,24,976,112);
marketSignContext.fillStyle='#f7e8c8';marketSignContext.font='900 68px system-ui, sans-serif';marketSignContext.textAlign='center';marketSignContext.textBaseline='middle';
marketSignContext.fillText('CORNER MARKET',512,80);
const marketSignTexture=new THREE.CanvasTexture(marketSignCanvas);marketSignTexture.colorSpace=THREE.SRGBColorSpace;
const marketSignMaterial=new THREE.MeshStandardMaterial({map:marketSignTexture,roughness:.62});
cube(shop,0,8.2,6.24,13,.82,.18,marketSignMaterial,false);
cube(shop,-6.2,3.1,6.18,2.1,6.2,.2,M.wood,false);
cube(shop,-6.2,3.1,6.31,1.72,5.8,.08,M.glass,false);
cube(shop,-6.2,6.35,6.37,1.9,.12,.1,M.silver,false);
for(let awning=-4.5;awning<=4.5;awning+=1.5){
  cube(shop,awning,5.2,6.75,1.38,.18,1.35,awning%3===0?M.white:M.red,false);
}
block(39,-38,27,12);
ground(-35,38,58,54,M.leaf,-.01);ground(-35,38,4.5,54,M.walk,.012);ground(-35,38,58,4.5,M.walk,.013);
function tree(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.26,3.2,8),M.wood);trunk.position.y=1.6;g.add(trunk);
  for(let n=0;n<3;n++){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3-n*.12,1),M.leaf);crown.position.set((n-1)*.35,3.1+n*.55,0);crown.castShadow=true;g.add(crown);}
}
[[-58,17],[-13,17],[-58,58],[-13,58],[-48,7],[-22,69]].forEach(p=>tree(...p));
function bench(x,z,rotation=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;world.add(g);
  cube(g,0,.62,0,2.3,.15,.58,M.wood);cube(g,0,1.05,-.22,2.3,.75,.13,M.wood);
  for(const dx of [-.8,.8])cube(g,dx,.3,0,.12,.62,.48,M.metal);
}
bench(-48,38);bench(-22,54,Math.PI/2);
ground(-35,82,34,12,M.road,.01);

// Small street fixtures add neighborhood scale and give sidewalks more visual detail.
function streetBin(x,z){
  const group=new THREE.Group();group.position.set(x,0,z);world.add(group);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.38,.43,.92,12),M.metal);body.position.y=.48;body.castShadow=true;group.add(body);
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.44,.44,.12,12),M.trim);lid.position.y=1.0;group.add(lid);
  cube(group,0,.34,.405,.18,.38,.035,M.silver,false);
  block(x,z,.9,.9);
}
function hydrant(x,z){
  const group=new THREE.Group();group.position.set(x,0,z);world.add(group);
  const redMaterial=mat(0xa94735,.48);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.42,.5,.28,10),redMaterial);base.position.y=.15;group.add(base);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.27,.34,.82,10),redMaterial);body.position.y=.68;body.castShadow=true;group.add(body);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.16,10),M.silver);cap.position.y=1.16;group.add(cap);
  for(const side of [-1,1]){
    const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,.34,8),redMaterial);nozzle.rotation.z=Math.PI/2;nozzle.position.set(side*.34,.78,0);group.add(nozzle);
    const nozzleCap=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.1,8),M.silver);nozzleCap.rotation.z=Math.PI/2;nozzleCap.position.set(side*.52,.78,0);group.add(nozzleCap);
  }
  block(x,z,.9,.9);
}
streetBin(55,-28);streetBin(-9,45);streetBin(-58,48);
hydrant(-92,-43);hydrant(92,-54);hydrant(43,-92);hydrant(-44,92);

// Street lamps with warm bulbs and restrained local lighting for nighttime.
const nightLights=[];
for(const z of [-95,-69,-14,14,69,95])for(const x of [-95,95]){
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,7,8),M.metal);pole.position.set(x,3.5,z);pole.castShadow=true;world.add(pole);
  cube(world,x+.65,6.8,z,1.35,.12,.3,M.metal,false);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.19,10,8),M.lampGlow);bulb.position.set(x+.65,6.66,z);world.add(bulb);
  const glow=new THREE.PointLight(0xffc77b,0,23,2);glow.position.set(x+.65,6.35,z);world.add(glow);nightLights.push({glow,bulb});
}
function person(material){
  const g=new THREE.Group(),body=new THREE.Mesh(new THREE.CapsuleGeometry(.31,.68,4,9),material);
  body.position.y=1.05;body.castShadow=true;g.add(body);

  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.105,.12,.18,9),M.skin);neck.position.y=1.58;g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.22,14,12),M.skin);head.position.y=1.77;head.castShadow=true;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.222,12,8,0,Math.PI*2,0,Math.PI*.48),M.trim);
  hair.position.y=1.83;hair.rotation.x=-.08;g.add(hair);
  const eyes=[];
  for(const x of [-.075,.075]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.025,7,6),M.trim);
    eye.position.set(x,1.79,.205);g.add(eye);eyes.push(eye);
  }
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.045,8,7),M.skin);nose.position.set(0,1.735,.22);g.add(nose);

  const arms=[],legs=[];
  for(const x of [-1,1]){
    const arm=new THREE.Group();arm.position.set(x*.36,1.34,0);arm.rotation.z=-x*.12;g.add(arm);
    const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.095,.39,3,7),material);
    sleeve.position.y=-.25;sleeve.castShadow=true;arm.add(sleeve);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.095,8,7),M.skin);
    hand.position.set(0,-.52,.015);arm.add(hand);arms.push(arm);

    const leg=new THREE.Group();leg.position.set(x*.14,.56,0);g.add(leg);
    const pants=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.5,3,7),M.metal);
    pants.position.y=-.17;pants.castShadow=true;leg.add(pants);
    const shoe=new THREE.Mesh(new THREE.BoxGeometry(.23,.14,.39),M.tire);
    shoe.position.set(0,-.49,.09);leg.add(shoe);legs.push(leg);
  }
  g.userData.legs=legs;g.userData.arms=arms;return g;
}
const routes=[
 [[-101,-63],[-90,-63],[-73,-63],[-73,-91],[-101,-91]],
 [[-60,-93],[-24,-93],[-24,-72],[-60,-72]],
 [[17,-96],[65,-96],[65,-72],[17,-72]],
 [[92,-62],[92,-25],[92,-14],[92,-62]],
 [[92,20],[92,61],[92,69],[92,20]],
 [[-92,20],[-92,61],[-92,69],[-92,20]],
 [[-72,94],[-25,94],[-25,72],[-72,72]],
 [[18,94],[68,94],[68,72],[18,72]],
 [[-62,10],[-18,10],[-18,18],[-62,18]],
 [[-58,63],[-18,63],[-18,69],[-58,69]]
];
for(let i=0;i<20;i++){
  const route=routes[i%routes.length].map(p=>new THREE.Vector3(p[0],0,p[1]));
  const g=person([M.blue,M.green,M.red][i%3]);g.position.copy(route[i%route.length]);world.add(g);
  pedestrians.push({g,route,target:(i+1)%route.length,speed:1.05+(i%4)*.12,phase:i*.8});
}
function car(color=0x365b78){
  const g=new THREE.Group(),bodyMat=mat(color,.5),wheelRigs=[];
  cube(g,0,.76,0,2.1,.82,4.35,bodyMat);
  cube(g,0,1.38,-.25,1.78,.76,2.38,M.glass);
  cube(g,0,.48,-2.2,1.9,.18,.18,M.silver,false);cube(g,0,.48,2.2,1.9,.18,.18,M.silver,false);
  cube(g,0,.83,-2.22,.92,.24,.08,M.metal,false);
  for(const sx of [-.72,.72]){
    cube(g,sx,.91,-2.235,.38,.24,.07,M.headlight,false);
    cube(g,sx,.88,2.235,.34,.24,.07,M.tailLight,false);
    cube(g,sx*1.38,1.17,-.95,.34,.17,.28,bodyMat,false);
    const mirror=cube(g,sx*1.12,1.24,-1.08,.2,.16,.3,M.metal,false);
    mirror.rotation.z=sx*.08;
  }
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const rig=new THREE.Group();rig.position.set(sx*1.07,.4,sz*1.38);g.add(rig);wheelRigs.push(rig);
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.24,18),M.tire);wheel.rotation.z=Math.PI/2;rig.add(wheel);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.255,14),M.silver);hub.rotation.z=Math.PI/2;rig.add(hub);
  }
  for(const sx of [-1,1])cube(g,sx*1.055,.76,0,.045,.48,1.55,M.trim,false);
  cube(g,0,1.79,-.25,1.48,.08,2.08,M.trim,false);
  g.userData.wheels=wheelRigs;
  return g;
}
const playerCar=car(0x315e83);playerCar.position.set(-7,0,-14);playerCar.rotation.y=Math.PI;world.add(playerCar);
function activityBeacon(color=0xf3bd62){
  const group=new THREE.Group();
  const glowColor=new THREE.Color(color);
  const ringMaterial=new THREE.MeshStandardMaterial({color:glowColor,emissive:glowColor.clone().multiplyScalar(.38),emissiveIntensity:1.1,roughness:.3});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25,.085,8,32),ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=.12;group.add(ring);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.1,.58,3.5,14,1,true),new THREE.MeshBasicMaterial({color:glowColor,transparent:true,opacity:.18,depthWrite:false}));beam.position.y=1.9;group.add(beam);
  const orbMaterial=new THREE.MeshStandardMaterial({color:glowColor,emissive:glowColor,emissiveIntensity:1.45,roughness:.22});
  const orb=new THREE.Mesh(new THREE.SphereGeometry(.25,14,10),orbMaterial);orb.position.y=3.8;group.add(orb);
  return group;
}
const deliveryPickup=new THREE.Vector3(39,0,-27);
const deliveryDropoff=new THREE.Vector3(-35,0,38);
const deliveryMarker=activityBeacon();deliveryMarker.position.copy(deliveryPickup);world.add(deliveryMarker);
let carryingPackage=false,deliveriesCompleted=0;
const landmarkSpots=[
  {name:'West Avenue Mural',x:-91,z:-40},
  {name:'North Brick Row',x:-5,z:-92},
  {name:'East Side Corner',x:92,z:44},
  {name:'Courtyard Garden',x:-48,z:52},
  {name:'South Street View',x:12,z:93}
];
const landmarks=landmarkSpots.map(spot=>{
  const marker=activityBeacon(0x63cbd2);marker.scale.setScalar(.78);
  marker.position.set(spot.x,0,spot.z);world.add(marker);
  return {...spot,marker,discovered:false};
});
const roadLoop=[[-75,-82],[75,-82],[82,-75],[82,75],[75,82],[-75,82],[-82,75],[-82,-75]].map(p=>new THREE.Vector3(p[0],0,p[1]));
for(let i=0;i<7;i++){
  const g=car([0x777b7d,0x9b4d3e,0x4c665d,0xc2bba8,0x30383d,0x7d6b91,0x9a9a92][i]);world.add(g);
  traffic.push({g,segment:i%roadLoop.length,t:(i/7)*.88,speed:5.8+(i%3)*.65});
}

const player={x:-11,z:-12,y:0,heading:0,vertical:0,grounded:true};
const avatar=person(M.blue);world.add(avatar);
let started=false,inCar=false,firstPerson=false,yaw=0,pitch=-.08,velocity=0;
let gameHours=14+20/60,lastToast=0,dragging=false,lastPointer={x:0,y:0};
let weatherMode='clear';
const rainCount=380,rainPositions=new Float32Array(rainCount*6);
for(let i=0;i<rainCount;i++){
  const j=i*6,x=(Math.random()-.5)*210,z=(Math.random()-.5)*210,y=6+Math.random()*42;
  rainPositions[j]=x;rainPositions[j+1]=y;rainPositions[j+2]=z;
  rainPositions[j+3]=x-.13;rainPositions[j+4]=y-1.25;rainPositions[j+5]=z;
}
const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
const rainLines=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:0xb6c9da,transparent:true,opacity:.48}));
rainLines.visible=false;rainLines.frustumCulled=false;scene.add(rainLines);
const puddleGroup=new THREE.Group();
const puddleMaterial=new THREE.MeshStandardMaterial({color:0x607887,transparent:true,opacity:.52,roughness:.2,metalness:.18,depthWrite:false});
const puddlePositions=[[-95,-81],[-54,-84],[-12,-79],[35,-83],[91,-80],[-83,-48],[-79,-12],[-84,31],[-80,73],[-95,1],[-47,2],[-8,-2],[48,1],[92,0],[-93,82],[-51,80],[-4,83],[43,79],[81,40],[82,-43],[0,-82],[0,82]];
for(let i=0;i<puddlePositions.length;i++){
  const puddle=new THREE.Mesh(new THREE.CircleGeometry(1,20),puddleMaterial);
  puddle.rotation.x=-Math.PI/2;puddle.scale.set(.7+(i%4)*.35,.35+(i%3)*.22,1);
  puddle.position.set(puddlePositions[i][0],-.035,puddlePositions[i][1]);puddleGroup.add(puddle);
}
puddleGroup.visible=false;world.add(puddleGroup);
const touchMap={forward:'w',back:'s',left:'a',right:'d'};
function clearInputState(){
  for(const key of Object.keys(keys))keys[key]=false;
  for(const key of Object.keys(touch))touch[key]=false;
  dragging=false;
}
window.addEventListener('blur',clearInputState);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInputState();});
function showToast(message){$('toast').textContent=message;$('toast').classList.add('show');lastToast=performance.now();}
function cycleWeather(){
  const modes=['clear','rain','fog'];weatherMode=modes[(modes.indexOf(weatherMode)+1)%modes.length];
  rainLines.visible=weatherMode==='rain';puddleGroup.visible=weatherMode==='rain';
  M.road.roughness=weatherMode==='rain'?.34:.96;M.road.metalness=weatherMode==='rain'?.16:0;
  $('weatherLabel').textContent='· '+weatherMode.toUpperCase();
  showToast('Weather: '+weatherMode.toUpperCase());
}
function updateRain(dt){
  if(weatherMode!=='rain')return;
  const positions=rainGeometry.attributes.position.array;
  for(let j=0;j<positions.length;j+=6){
    positions[j+1]-=dt*34;
    if(positions[j+1]<-2){
      positions[j]=player.x+(Math.random()-.5)*190;
      positions[j+1]=24+Math.random()*30;
      positions[j+2]=player.z+(Math.random()-.5)*190;
    }
    positions[j+3]=positions[j]-.13;positions[j+4]=positions[j+1]-1.25;positions[j+5]=positions[j+2];
  }
  rainGeometry.attributes.position.needsUpdate=true;
}
function updateActivityHud(){
  const found=landmarks.filter(item=>item.discovered).length;
  $('collectionLabel').textContent='SNAPSHOTS '+found+'/'+landmarks.length+' · DELIVERIES '+deliveriesCompleted;
}
function handleActivity(){
  if(inCar){showToast('Exit the sedan to explore or deliver');return;}
  const nearbyLandmark=landmarks.find(item=>!item.discovered&&Math.hypot(player.x-item.x,player.z-item.z)<5.5);
  if(nearbyLandmark){
    nearbyLandmark.discovered=true;nearbyLandmark.marker.visible=false;updateActivityHud();
    $('objectiveText').textContent=landmarks.every(item=>item.discovered)
      ?'All five neighborhood snapshots found! You can still deliver packages and explore the district.'
      :'Snapshot saved: '+nearbyLandmark.name+'. Find the remaining cyan beacons around the neighborhood.';
    showToast('Snapshot saved — '+nearbyLandmark.name);
    return;
  }
  if(!carryingPackage){
    if(Math.hypot(player.x-deliveryPickup.x,player.z-deliveryPickup.z)>6){showToast('Find a cyan snapshot beacon or the gold market marker');return;}
    carryingPackage=true;deliveryMarker.position.copy(deliveryDropoff);
    $('objectiveText').textContent='Package collected! Take it to the gold marker in the courtyard and press F.';
    showToast('Package collected — deliver it to the courtyard');
  }else{
    if(Math.hypot(player.x-deliveryDropoff.x,player.z-deliveryDropoff.z)>7){showToast('Head to the courtyard delivery marker');return;}
    carryingPackage=false;deliveriesCompleted++;deliveryMarker.position.copy(deliveryPickup);updateActivityHud();
    $('objectiveText').textContent='Delivery complete! Deliveries: '+deliveriesCompleted+'. Return to the market marker for another job.';
    showToast('Delivery complete! Total deliveries: '+deliveriesCompleted);
  }
}
function updateHud(){
  $('mode').textContent=(inCar?'DRIVING':'ON FOOT')+' · '+(firstPerson?'FIRST':'THIRD')+' PERSON';
  $('speed').textContent=inCar?Math.round(Math.abs(velocity)*2.237)+' MPH':'WALKING';
}
function changeCamera(){firstPerson=!firstPerson;updateHud();$('crosshair').style.display=locked&&firstPerson?'block':'none';showToast(firstPerson?'First-person view':'Third-person view');}
function input(k){return !!(keys[k]||touch[k]);}
function nearCar(){return Math.hypot(player.x-playerCar.position.x,player.z-playerCar.position.z)<5.2;}
function carSteeringInput(){return getCarSteeringInput(input('a')||input('arrowleft'),input('d')||input('arrowright'));}
function interact(){
  if(inCar){
    inCar=false;velocity=0;
    let x=playerCar.position.x+Math.cos(playerCar.rotation.y)*3.2,z=playerCar.position.z-Math.sin(playerCar.rotation.y)*3.2;
    if(blocked(x,z)){x=playerCar.position.x+3.3;z=playerCar.position.z;}
    player.x=x;player.z=z;player.heading=playerCar.rotation.y;
    $('objectiveText').textContent='Explore the expanded streets and courtyard. Press E near the blue sedan to drive again.';
    showToast('You left the sedan');
  }else if(nearCar()){
    inCar=true;player.x=playerCar.position.x;player.z=playerCar.position.z;player.heading=playerCar.rotation.y;velocity=0;
    $('objectiveText').textContent='Cruise the neighborhood. Use WASD or arrow keys to drive. Press E to exit.';
    showToast('You entered the blue sedan');
  }else showToast('Walk closer to the blue sedan to enter it');
  updateHud();
}
function keyDown(event){
  const k=event.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))event.preventDefault();
  keys[k]=true;if(event.repeat)return;
  if(k==='e')interact();if(k==='v')changeCamera();
  if(k==='f')handleActivity();if(k==='r')cycleWeather();
  if(k==='n'){gameHours=(gameHours+4)%24;showToast('Time advanced');}
  if(k===' '&&!inCar&&player.grounded){player.vertical=5.5;player.grounded=false;}
}
document.addEventListener('keydown',keyDown);
document.addEventListener('keyup',event=>{keys[event.key.toLowerCase()]=false;});
for(const button of document.querySelectorAll('[data-key]')){
  const movement=touchMap[button.dataset.key];
  const down=e=>{e.preventDefault();touch[movement]=true;button.setPointerCapture?.(e.pointerId);};
  const up=e=>{e.preventDefault();touch[movement]=false;};
  button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);
  button.addEventListener('pointercancel',up);button.addEventListener('lostpointercapture',up);
}
$('interactButton').addEventListener('click',interact);
$('cameraButton').addEventListener('click',changeCamera);
$('activityButton').addEventListener('click',handleActivity);
$('weatherButton').addEventListener('click',cycleWeather);
const brake=$('brakeButton');
brake.addEventListener('pointerdown',e=>{e.preventDefault();brake.setPointerCapture?.(e.pointerId);touch.space=true;});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(ev,()=>touch.space=false);

let locked=false;
const automationMode=(location.hostname==='localhost'||location.hostname==='127.0.0.1')
  &&new URLSearchParams(location.search).has('automation');
function canUsePointerLock(){
  return innerWidth>760&&matchMedia('(pointer:fine)').matches;
}
function requestLookLock(){
  if(automationMode||!canUsePointerLock()||document.pointerLockElement===renderer.domElement)return;
  try{
    const request=renderer.domElement.requestPointerLock?.();
    if(request&&typeof request.catch==='function')request.catch(()=>{});
  }catch(error){
    // Pointer lock is optional; dragging remains available as a fallback.
  }
}
renderer.domElement.addEventListener('click',()=>{
  if(started)requestLookLock();
});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer.domElement;$('crosshair').style.display=locked&&firstPerson?'block':'none';});
document.addEventListener('mousemove',e=>{
  if(!locked)return;yaw-=e.movementX*.0026;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0022,-.65,.42);
});
renderer.domElement.addEventListener('pointerdown',e=>{
  if(innerWidth>760||!started)return;dragging=true;lastPointer={x:e.clientX,y:e.clientY};
});
document.addEventListener('pointermove',e=>{
  if(!dragging)return;const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;
  yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch-dy*.004,-.65,.42);lastPointer={x:e.clientX,y:e.clientY};
});
for(const ev of ['pointerup','pointercancel'])document.addEventListener(ev,()=>dragging=false);
$('playButton').addEventListener('click',()=>{
  started=true;$('startScreen').style.display='none';$('loading').textContent='Ready';
  requestLookLock();
});

function walkNPCs(dt,time){
  for(const p of pedestrians){
    const target=p.route[p.target],dx=target.x-p.g.position.x,dz=target.z-p.g.position.z,d=Math.hypot(dx,dz);
    if(d<.9)p.target=(p.target+1)%p.route.length;
    else{const step=Math.min(d,p.speed*dt);p.g.position.x+=dx/d*step;p.g.position.z+=dz/d*step;p.g.rotation.y=Math.atan2(dx,dz);}
    const swing=Math.sin(time*7+p.phase)*.2;
    p.g.userData.legs[0].rotation.x=swing;p.g.userData.legs[1].rotation.x=-swing;
    p.g.userData.arms[0].rotation.x=-swing*.72;p.g.userData.arms[1].rotation.x=swing*.72;
  }
}
function moveTraffic(dt){
  for(const item of traffic){
    const a=roadLoop[item.segment],b=roadLoop[(item.segment+1)%roadLoop.length];
    item.t+=item.speed*dt/a.distanceTo(b);
    if(item.t>=1){item.t-=1;item.segment=(item.segment+1)%roadLoop.length;}
    const from=roadLoop[item.segment],to=roadLoop[(item.segment+1)%roadLoop.length];
    item.g.position.lerpVectors(from,to,item.t);item.g.rotation.y=Math.atan2(to.x-from.x,to.z-from.z);
    for(const wheel of item.g.userData.wheels||[])wheel.rotation.x+=item.speed*dt/.39;
  }
}
function movePlayer(dt){
  const f=(input('w')||input('arrowup')?1:0)-(input('s')||input('arrowdown')?1:0);
  const s=(input('d')||input('arrowright')?1:0)-(input('a')||input('arrowleft')?1:0);
  if(inCar){
    velocity+=f*13.5*dt;velocity*=Math.pow((input(' ')||touch.space)?0.07:0.992,dt*60);
    velocity=THREE.MathUtils.clamp(velocity,-7,19);
    const steer=carSteeringInput();
    playerCar.rotation.y+=steer*Math.min(Math.abs(velocity)/5.5,1)*1.45*dt*Math.sign(velocity||1);
    const nx=playerCar.position.x-Math.sin(playerCar.rotation.y)*velocity*dt;
    const nz=playerCar.position.z-Math.cos(playerCar.rotation.y)*velocity*dt;
    if(!blocked(nx,nz,1.35)){playerCar.position.x=nx;playerCar.position.z=nz;}else velocity*=-.16;
    for(const wheel of playerCar.userData.wheels||[])wheel.rotation.x+=velocity*dt/.39;
    player.x=playerCar.position.x;player.z=playerCar.position.z;player.heading=playerCar.rotation.y;
  }else{
    const len=Math.hypot(f,s)||1,speed=(input('shift')?7.6:4.4)*dt;
    const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)/len*speed;
    const dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)/len*speed;
    if(!blocked(player.x+dx,player.z))player.x+=dx;
    if(!blocked(player.x,player.z+dz))player.z+=dz;
    if(f||s){player.heading=Math.atan2(dx,dz);avatar.rotation.y=player.heading;}
    player.vertical-=15*dt;player.y+=player.vertical*dt;
    if(player.y<=0){player.y=0;player.vertical=0;player.grounded=true;}
  }
  const gait=!inCar&&(f||s)?Math.sin(timer.elapsedTime*9)*.55:0;
  avatar.userData.legs[0].rotation.x=gait;avatar.userData.legs[1].rotation.x=-gait;
  avatar.userData.arms[0].rotation.x=-gait*.72;avatar.userData.arms[1].rotation.x=gait*.72;
  avatar.position.set(player.x,player.y,player.z);avatar.visible=!firstPerson&&!inCar;updateHud();
}
function updateCamera(dt){
  const focus=new THREE.Vector3(player.x,player.y+(inCar?1.45:1.55),player.z);
  if(firstPerson){camera.position.copy(focus);camera.rotation.order='YXZ';camera.rotation.y=yaw+(inCar?player.heading:0);camera.rotation.x=pitch;}
  else{
    const heading=inCar?player.heading+yaw:yaw,dist=inCar?10:7.2,height=inCar?4.1:3.2;
    const desired=new THREE.Vector3(player.x+Math.sin(heading)*dist,focus.y+height,player.z+Math.cos(heading)*dist);
    camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(focus);
  }
}
function updateClock(dt){
  gameHours=(gameHours+dt*.015)%24;const hour=Math.floor(gameHours),minute=Math.floor((gameHours-hour)*60);
  $('clock').textContent=String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
  const daylight=Math.max(.16,Math.sin((gameHours-6)/12*Math.PI));
  const weatherDim=weatherMode==='clear'?1:weatherMode==='rain'?.78:.66;
  sun.intensity=(.18+daylight*2.12)*weatherDim;ambientLight.intensity=(.72+daylight*.98)*(weatherMode==='fog'?.88:1);
  sun.position.set(-85+daylight*35,25+daylight*95,-65);
  const night=1-daylight;
  M.headlight.emissiveIntensity=.3+night*2.35;M.tailLight.emissiveIntensity=.55+night*1.25;
  skyMaterial.color.setRGB(.2+daylight*.8,.24+daylight*.76,.42+daylight*.58);
  stars.material.opacity=night*.88;
  sunDisc.visible=daylight>.28;
  sunDisc.position.copy(sun.position).normalize().multiplyScalar(475);
  for(const item of nightLights){item.glow.intensity=night*1.65;item.bulb.material.emissiveIntensity=.25+night*1.8;}
  scene.fog.near=weatherMode==='fog'?20:weatherMode==='rain'?58:125;
  scene.fog.far=weatherMode==='fog'?175:weatherMode==='rain'?245:340;
  const skyLightness=weatherMode==='fog'?.31:weatherMode==='rain'?.24:.19+daylight*.37;
  scene.fog.color.setHSL(.55,.13,skyLightness);scene.background.copy(scene.fog.color);
}
function updateMap(){
  const ctx=$('minimap').getContext('2d');ctx.clearRect(0,0,248,248);ctx.fillStyle='#596d55';ctx.fillRect(0,0,248,248);
  const scale=248/320;ctx.fillStyle='#292f33';
  for(const v of [-82,0,82]){ctx.fillRect(0,(160+v-8.5)*scale,248,17*scale);ctx.fillRect((160+v-8.5)*scale,0,17*scale,248);}
  ctx.fillStyle='#416a49';ctx.fillRect(96*scale,171*scale,58*scale,54*scale);
  for(const item of traffic){ctx.fillStyle='#e0c17b';ctx.beginPath();ctx.arc((160+item.g.position.x)*scale,(160+item.g.position.z)*scale,2.5,0,Math.PI*2);ctx.fill();}
  for(const landmark of landmarks){if(!landmark.discovered){ctx.fillStyle='#63cbd2';ctx.beginPath();ctx.arc((160+landmark.x)*scale,(160+landmark.z)*scale,3.2,0,Math.PI*2);ctx.fill();}}
  ctx.fillStyle='#e8b45f';ctx.beginPath();ctx.arc((160+player.x)*scale,(160+player.z)*scale,4.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=2;ctx.strokeRect(1,1,246,246);
}
function updateZone(){
  const z=player.x<-82?'WEST SIDE':player.x>82?'EAST SIDE':player.z<-82?'NORTH BLOCK':player.z>82?'SOUTH BLOCK':'COURTYARD DISTRICT';
  $('zone').textContent='· '+z;
}
const timer=new THREE.Clock();let elapsed=0;
function frame(){
  requestAnimationFrame(frame);const dt=Math.min(timer.getDelta(),.04),time=timer.elapsedTime;
  if(started){
    elapsed+=dt;movePlayer(dt);walkNPCs(dt,time);moveTraffic(dt);updateCamera(dt);updateClock(dt);updateRain(dt);
    deliveryMarker.position.y=.08+Math.sin(time*2.2)*.16;deliveryMarker.rotation.y+=dt*.65;
    for(let i=0;i<landmarks.length;i++){
      const marker=landmarks[i].marker;
      if(marker.visible){marker.position.y=.08+Math.sin(time*2.1+i*.73)*.13;marker.rotation.y+=dt*.55;}
    }
    if(elapsed%0.22<dt){updateMap();updateZone();}
    if(performance.now()-lastToast>1900)$('toast').classList.remove('show');
  }
  renderer.render(scene,camera);
}
frame();
if(automationMode){
  Object.defineProperty(window,'__CHICAGO_BLOCK_TEST__',{value:Object.freeze({
    getState:()=>({
      started,inCar,firstPerson,weatherMode,gameHours,carryingPackage,deliveriesCompleted,
      discoveredLandmarks:landmarks.filter(item=>item.discovered).length,
      player:{x:player.x,z:player.z},car:{x:playerCar.position.x,z:playerCar.position.z,heading:playerCar.rotation.y,wheelRotations:(playerCar.userData.wheels||[]).map(w=>w.rotation.x)},
      velocity,yaw,braking:!!touch.space,keys:{w:!!keys.w,a:!!keys.a,d:!!keys.d},
      movementDebug:(()=>{
        const f=(input('w')||input('arrowup')?1:0)-(input('s')||input('arrowdown')?1:0);
        const s=(input('d')||input('arrowright')?1:0)-(input('a')||input('arrowleft')?1:0);
        const len=Math.hypot(f,s)||1,speed=(input('shift')?7.6:4.4)*.04;
        const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)/len*speed;
        const dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)/len*speed;
        return {forward:f,side:s,dx,dz,positionBlocked:blocked(player.x,player.z),nextPositionBlocked:blocked(player.x+dx,player.z+dz),yaw};
      })(),
      elapsed,
      simulationRunning:started&&elapsed>0,
      pedestrians:pedestrians.length,traffic:traffic.length,
      npcPositions:pedestrians.map(p=>({x:p.g.position.x,z:p.g.position.z,target:p.target})),
      trafficPositions:traffic.map(item=>({x:item.g.position.x,z:item.g.position.z}))
    }),
    setKey:(key,pressed)=>{
      const normalized=String(key).toLowerCase();
      if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(normalized))throw new TypeError('Unsupported test key');
      keys[normalized]=Boolean(pressed);
    },
    setYaw:(angle)=>{
      if(!Number.isFinite(angle))throw new TypeError('Test yaw must be finite');
      yaw=angle;
    },
    teleport:(x,z)=>{
      if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError('Test coordinates must be finite');
      if(inCar)throw new Error('Exit the car before teleporting the player');
      player.x=x;player.z=z;player.y=0;player.vertical=0;player.grounded=true;avatar.position.set(x,0,z);
    }
  }),configurable:false});
}
updateActivityHud();
window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
});
$('loading').textContent='Neighborhood ready';
