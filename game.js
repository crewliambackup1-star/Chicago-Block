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

const automationMode=(location.hostname==='localhost'||location.hostname==='127.0.0.1')
  &&new URLSearchParams(location.search).has('automation');
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, .1, 600);
const isCoarsePointer=()=>matchMedia('(pointer:coarse)').matches;
const renderPixelRatio=()=>automationMode?.8:Math.min(devicePixelRatio||1,isCoarsePointer()?1.35:1.65);
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',precision:'highp'});
renderer.setPixelRatio(renderPixelRatio());
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !automationMode;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.info.autoReset = true;
$('game').appendChild(renderer.domElement);

// A soft, hand-built equirectangular environment gives glass and vehicle paint something
// believable to reflect without requiring a network download or a large HDR asset.
const environmentCanvas=document.createElement('canvas');environmentCanvas.width=1024;environmentCanvas.height=512;
const environmentContext=environmentCanvas.getContext('2d');
const environmentGradient=environmentContext.createLinearGradient(0,0,0,512);
environmentGradient.addColorStop(0,'#6e8fa2');environmentGradient.addColorStop(.38,'#c3c9c5');
environmentGradient.addColorStop(.57,'#e4d6bf');environmentGradient.addColorStop(1,'#59656a');
environmentContext.fillStyle=environmentGradient;environmentContext.fillRect(0,0,1024,512);
for(let i=0;i<54;i++){
  const x=(i*197)%1024,w=18+(i%7)*11,h=24+(i%9)*13;
  environmentContext.fillStyle=i%3===0?'rgba(57,69,72,.58)':'rgba(82,91,91,.36)';
  environmentContext.fillRect(x,294-h,w,h);
  environmentContext.fillStyle='rgba(226,190,132,.32)';
  for(let y=300-h;y<294;y+=12)for(let xx=x+4;xx<x+w-3;xx+=9)environmentContext.fillRect(xx,y,3,4);
}
const environmentSun=environmentContext.createRadialGradient(760,150,3,760,150,115);
environmentSun.addColorStop(0,'rgba(255,244,217,.95)');environmentSun.addColorStop(.18,'rgba(255,232,190,.42)');
environmentSun.addColorStop(1,'rgba(255,232,190,0)');
environmentContext.fillStyle=environmentSun;environmentContext.fillRect(625,15,270,270);
const environmentTexture=new THREE.CanvasTexture(environmentCanvas);
environmentTexture.mapping=THREE.EquirectangularReflectionMapping;
environmentTexture.colorSpace=THREE.SRGBColorSpace;
scene.environment=environmentTexture;scene.environmentIntensity=.58;

const mat = (color, roughness=.9) => new THREE.MeshStandardMaterial({color, roughness});
const M = {
  grass:mat(0x687d60), road:mat(0xffffff), walk:mat(0xffffff), line:mat(0xe5e2d8),
  yellow:mat(0xf0c65f), brick:mat(0xc08270,.94), dark:mat(0xb17b6d,.92), cream:mat(0xe2d1b7,.88),
  limestone:mat(0xb9aa96,.86),
  glass:new THREE.MeshPhysicalMaterial({color:0x203743,roughness:.14,metalness:.18,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.35,transparent:true,opacity:.91}),
  metal:new THREE.MeshStandardMaterial({color:0x3a4145,roughness:.38,metalness:.72}),
  wood:mat(0x694a32,.82),
  leaf:mat(0x416a49,.96), skin:mat(0x986d52,.78), blue:mat(0x365b75,.76), green:mat(0x55714e,.78),
  red:mat(0x8c5142,.78), tire:new THREE.MeshStandardMaterial({color:0x171a1b,roughness:.96,metalness:0}),
  white:mat(0xece8dc,.72), trim:new THREE.MeshStandardMaterial({color:0x514b43,roughness:.48,metalness:.42}),
  silver:new THREE.MeshStandardMaterial({color:0x9b9b94,roughness:.26,metalness:.88}),
  windowLit:new THREE.MeshStandardMaterial({color:0xffd9a5,emissive:0x8a4e1d,emissiveIntensity:.72,roughness:.35}),
  lampGlow:new THREE.MeshStandardMaterial({color:0xffe5b2,emissive:0xffb95c,emissiveIntensity:1.4,roughness:.25}),
  headlight:new THREE.MeshPhysicalMaterial({color:0xfff4d6,emissive:0xffd78a,emissiveIntensity:1.25,roughness:.12,metalness:.18,clearcoat:1}),
  tailLight:new THREE.MeshPhysicalMaterial({color:0x9f231c,emissive:0xa51f17,emissiveIntensity:.8,roughness:.2,clearcoat:1})
};
function makeTexture(paint,size=1024){
  const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d');paint(ctx,size,size);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),12);
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
  return texture;
}
function makeDataTexture(paint,size=1024){
  const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  paint(canvas.getContext('2d'),size,size);
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),12);
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
  return texture;
}
const brickTexture=makeTexture((ctx,w,h)=>{
  ctx.fillStyle='#6a5149';ctx.fillRect(0,0,w,h);
  const row=58,brick=142;
  for(let y=0;y<h;y+=row){
    const offset=(Math.floor(y/row)%2)*-brick/2;
    for(let x=offset;x<w+brick;x+=brick){
      const seed=Math.abs(Math.sin(x*12.7+y*4.3));
      const shade=106+Math.floor(seed*24),bw=brick-8,bh=row-8;
      const grad=ctx.createLinearGradient(x,y,x+brick,y+row);
      grad.addColorStop(0,`rgb(${shade+34},${shade-5},${shade-10})`);
      grad.addColorStop(.48,`rgb(${shade+22},${shade-13},${shade-19})`);
      grad.addColorStop(1,`rgb(${shade+7},${shade-22},${shade-25})`);
      ctx.fillStyle=grad;ctx.fillRect(x+4,y+4,bw,bh);
      ctx.strokeStyle='rgba(255,225,205,.11)';ctx.lineWidth=2;ctx.strokeRect(x+6,y+6,bw-4,bh-4);
      ctx.strokeStyle='rgba(35,25,22,.17)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+9,y+row-10);ctx.lineTo(x+brick-13,y+row-10);ctx.stroke();
    }
  }
  for(let i=0;i<9200;i++){
    const x=(i*61)%w,y=(i*149)%h,shade=70+(i*17)%130;
    ctx.fillStyle=`rgba(${shade},${shade-12},${shade-15},.12)`;ctx.fillRect(x,y,1+(i%3),1+(i%2));
  }
});
brickTexture.repeat.set(3,2);
const concreteTexture=makeTexture((ctx,w,h)=>{
  const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#c0b9ad');grad.addColorStop(1,'#8e8a82');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  for(let i=0;i<7200;i++){
    const x=(i*73)%w,y=(i*151)%h,v=105+((i*37)%105);
    ctx.fillStyle=`rgba(${v},${v-3},${v-8},.14)`;ctx.fillRect(x,y,1+(i%4),1+(i%3));
  }
  ctx.strokeStyle='rgba(55,52,48,.19)';ctx.lineWidth=2;
  for(let y=96;y<h;y+=192){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  for(let i=0;i<15;i++){const x=(i*83)%w,y=(i*117)%h;ctx.strokeStyle='rgba(60,57,52,.12)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+8+(i%5)*4,y+21+(i%4)*5);ctx.stroke();}
});
concreteTexture.repeat.set(2,2);
const asphaltTexture=makeTexture((ctx,w,h)=>{
  const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#62696b');grad.addColorStop(.5,'#41494d');grad.addColorStop(1,'#555b5a');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  for(let i=0;i<6200;i++){
    const x=(i*47)%w,y=(i*113)%h,v=92+((i*19)%105);
    ctx.fillStyle=`rgba(${v},${v+2},${v+4},.28)`;ctx.fillRect(x,y,1+(i%3===0?1:0),1+(i%2));
  }
  ctx.strokeStyle='rgba(12,17,19,.23)';ctx.lineWidth=2;
  for(let i=0;i<48;i++){
    const x=(i*83+31)%w,y=(i*137+57)%h;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5+(i%7)*3,y+2+(i%5)*2);
    ctx.lineTo(x+12+(i%4)*5,y+13+(i%6)*4);ctx.stroke();
  }
  for(let i=0;i<22;i++){
    const x=(i*97)%w,y=(i*173)%h;
    ctx.fillStyle='rgba(185,178,157,.09)';ctx.beginPath();ctx.ellipse(x,y,8+(i%5)*3,3+(i%3)*2,.4,0,Math.PI*2);ctx.fill();
  }
  // Uneven tar repairs and long branching hairline cracks.
  for(let i=0;i<34;i++){
    const x=(i*157+29)%w,y=(i*83+51)%h,rx=18+(i%6)*9,ry=7+(i%4)*4;
    ctx.fillStyle='rgba(24,29,31,.16)';ctx.beginPath();ctx.ellipse(x,y,rx,ry,(i%5)*.27,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(16,20,21,.42)';ctx.lineWidth=1+(i%2);
    ctx.beginPath();ctx.moveTo(x-rx*.3,y);ctx.lineTo(x,y+ry*.35);ctx.lineTo(x+rx*.38,y+ry*.8);ctx.stroke();
  }
  for(let i=0;i<5600;i++){
    const x=(i*97)%w,y=(i*181)%h,r=i%3===0?2:1,v=75+(i*23)%95;
    ctx.fillStyle=`rgba(${v},${v+2},${v+3},.2)`;ctx.fillRect(x,y,r,r);
  }
});
asphaltTexture.repeat.set(12,3);
const sidewalkTexture=makeTexture((ctx,w,h)=>{
  const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#b3afa4');grad.addColorStop(1,'#87877e');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  for(let i=0;i<4400;i++){
    const x=(i*53)%w,y=(i*127)%h,v=95+(i*11)%100;
    ctx.fillStyle=`rgba(${v},${v},${v-5},.12)`;ctx.fillRect(x,y,2,1+(i%3));
  }
  ctx.strokeStyle='rgba(45,48,47,.27)';ctx.lineWidth=4;
  for(let x=0;x<w;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=0;y<h;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
});
sidewalkTexture.repeat.set(5,2);
const grassTexture=makeTexture((ctx,w,h)=>{
  const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#708263');grad.addColorStop(1,'#455d43');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  for(let i=0;i<16000;i++){
    const x=(i*67)%w,y=(i*137)%h,v=65+(i*29)%90;
    ctx.fillStyle=`rgba(${v},${v+12},${Math.max(35,v-18)},.24)`;
    ctx.fillRect(x,y,1+(i%2),1+(i%3));
  }
  for(let i=0;i<1200;i++){
    const x=(i*43)%w,y=(i*97)%h;ctx.strokeStyle='rgba(30,56,32,.2)';
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+1+(i%4),y-3-(i%5));ctx.stroke();
  }
});
grassTexture.repeat.set(22,22);
const brickHeight=makeDataTexture((ctx,w,h)=>{
  ctx.fillStyle='#777';ctx.fillRect(0,0,w,h);
  const row=58,brick=142;
  for(let y=0;y<h;y+=row){
    const offset=(Math.floor(y/row)%2)*-brick/2;
    for(let x=offset;x<w+brick;x+=brick){
      const g=ctx.createLinearGradient(x,y,x+brick,y+row);g.addColorStop(0,'#c4c4c4');g.addColorStop(.5,'#9c9c9c');g.addColorStop(1,'#b2b2b2');
      ctx.fillStyle=g;ctx.fillRect(x+4,y+4,brick-8,row-8);
    }
  }
});
const concreteHeight=makeDataTexture((ctx,w,h)=>{
  ctx.fillStyle='#a0a0a0';ctx.fillRect(0,0,w,h);
  for(let i=0;i<6500;i++){const x=(i*71)%w,y=(i*139)%h,v=105+(i*31)%100;ctx.fillStyle=`rgba(${v},${v},${v},.25)`;ctx.fillRect(x,y,2,2);}
  ctx.strokeStyle='#555';ctx.lineWidth=3;for(let y=96;y<h;y+=192){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
});
const asphaltHeight=makeDataTexture((ctx,w,h)=>{
  ctx.fillStyle='#858585';ctx.fillRect(0,0,w,h);
  for(let i=0;i<14000;i++){const x=(i*47)%w,y=(i*113)%h,v=65+(i*29)%150;ctx.fillStyle=`rgba(${v},${v},${v},.4)`;ctx.fillRect(x,y,1+(i%2),1+(i%2));}
  ctx.strokeStyle='#555';ctx.lineWidth=2;for(let i=0;i<34;i++){const x=(i*83)%w,y=(i*137)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+15+(i%5)*5,y+12+(i%4)*4);ctx.stroke();}
});
const sidewalkHeight=makeDataTexture((ctx,w,h)=>{
  ctx.fillStyle='#999';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#555';ctx.lineWidth=5;
  for(let x=0;x<w;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=0;y<h;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
});
const grassHeight=makeDataTexture((ctx,w,h)=>{
  ctx.fillStyle='#8b8b8b';ctx.fillRect(0,0,w,h);
  for(let i=0;i<18000;i++){const x=(i*67)%w,y=(i*137)%h,v=65+(i*41)%155;ctx.fillStyle=`rgba(${v},${v},${v},.42)`;ctx.fillRect(x,y,1+(i%2),1+(i%2));}
});
grassHeight.repeat.copy(grassTexture.repeat);
brickHeight.repeat.copy(brickTexture.repeat);concreteHeight.repeat.copy(concreteTexture.repeat);
asphaltHeight.repeat.copy(asphaltTexture.repeat);sidewalkHeight.repeat.copy(sidewalkTexture.repeat);
M.brick.map=brickTexture;M.dark.map=concreteTexture;M.cream.map=concreteTexture;M.limestone.map=concreteTexture;
M.road.map=asphaltTexture;M.walk.map=sidewalkTexture;M.grass.map=grassTexture;M.grass.bumpMap=grassHeight;M.grass.bumpScale=.08;M.grass.roughnessMap=grassHeight;
M.brick.bumpMap=brickHeight;M.brick.bumpScale=.14;M.brick.roughnessMap=brickHeight;
M.dark.bumpMap=concreteHeight;M.dark.bumpScale=.09;M.dark.roughnessMap=concreteHeight;
M.cream.bumpMap=concreteHeight;M.cream.bumpScale=.075;M.limestone.bumpMap=concreteHeight;M.limestone.bumpScale=.07;
M.road.bumpMap=asphaltHeight;M.road.bumpScale=.055;M.road.roughnessMap=asphaltHeight;
M.walk.bumpMap=sidewalkHeight;M.walk.bumpScale=.085;M.walk.roughnessMap=sidewalkHeight;
// The texture canvases carry their own surface color, so the map remains neutral and untinted.
M.brick.color.setHex(0xffffff);M.dark.color.setHex(0xcabbb2);M.cream.color.setHex(0xf0e4ce);
M.road.color.setHex(0xffffff);M.walk.color.setHex(0xffffff);

M.brick.needsUpdate=M.dark.needsUpdate=M.cream.needsUpdate=M.road.needsUpdate=M.walk.needsUpdate=true;

// V3.1 material library: physically based micro-detail for close-up surfaces.
const fabricTexture=makeTexture((ctx,w,h)=>{
  ctx.fillStyle='#d8d5cf';ctx.fillRect(0,0,w,h);
  for(let i=0;i<18000;i++){
    const x=(i*37)%w,y=(i*83)%h,v=155+(i*19)%75;
    ctx.fillStyle=`rgba(${v},${v},${v},.16)`;ctx.fillRect(x,y,1+(i%2),1);
  }
  ctx.strokeStyle='rgba(75,72,68,.17)';ctx.lineWidth=1;
  for(let y=0;y<h;y+=4){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.strokeStyle='rgba(255,255,255,.2)';
  for(let x=0;x<w;x+=4){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
});
fabricTexture.repeat.set(1.5,1.5);
const fabricBump=makeDataTexture((ctx,w,h)=>{
  ctx.fillStyle='#999';ctx.fillRect(0,0,w,h);
  for(let i=0;i<22000;i++){const x=(i*41)%w,y=(i*73)%h,v=95+(i*31)%90;ctx.fillStyle=`rgba(${v},${v},${v},.35)`;ctx.fillRect(x,y,1,1);}
  ctx.strokeStyle='#777';ctx.lineWidth=1;
  for(let y=0;y<h;y+=4){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  for(let x=0;x<w;x+=4){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
},512);
const skinTexture=makeTexture((ctx,w,h)=>{
  ctx.fillStyle='#c8b09e';ctx.fillRect(0,0,w,h);
  for(let i=0;i<6800;i++){
    const x=(i*47)%w,y=(i*89)%h,r=1+(i%3),v=90+(i*29)%110;
    ctx.fillStyle=`rgba(${v},${v-12},${v-18},.075)`;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<420;i++){
    const x=(i*71)%w,y=(i*131)%h;
    ctx.fillStyle='rgba(255,229,207,.12)';ctx.fillRect(x,y,2,1);
  }
},512);
const skinBump=makeDataTexture((ctx,w,h)=>{
  ctx.fillStyle='#999';ctx.fillRect(0,0,w,h);
  for(let i=0;i<5200;i++){const x=(i*47)%w,y=(i*89)%h,v=90+(i*37)%105;ctx.fillStyle=`rgba(${v},${v},${v},.45)`;ctx.fillRect(x,y,1+(i%2),1+(i%2));}
},512);
const sidingTexture=makeTexture((ctx,w,h)=>{
  const base=ctx.createLinearGradient(0,0,w,0);base.addColorStop(0,'#c9b79e');base.addColorStop(.48,'#ddcbb0');base.addColorStop(1,'#b9a78f');
  ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=54){
    const shade=(y/54)%2? 'rgba(70,58,46,.12)':'rgba(255,246,228,.28)';
    ctx.fillStyle=shade;ctx.fillRect(0,y,w,3);
    ctx.fillStyle='rgba(70,57,43,.12)';ctx.fillRect(0,y+51,w,2);
  }
  for(let i=0;i<9800;i++){
    const x=(i*59)%w,y=(i*127)%h,v=90+(i*17)%105;
    ctx.fillStyle=`rgba(${v},${v-8},${v-18},.10)`;ctx.fillRect(x,y,1+(i%2),1);
  }
  for(let i=0;i<28;i++){
    const x=(i*97)%w,y=(i*139)%h;
    const stain=ctx.createLinearGradient(x,y,x+5,y+110);
    stain.addColorStop(0,'rgba(70,61,49,.10)');stain.addColorStop(1,'rgba(70,61,49,0)');
    ctx.fillStyle=stain;ctx.fillRect(x,y,5,110);
  }
});
sidingTexture.repeat.set(2,2);
const sidingHeight=makeDataTexture((ctx,w,h)=>{
  ctx.fillStyle='#999';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#666';ctx.lineWidth=4;
  for(let y=0;y<h;y+=54){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  for(let i=0;i<7000;i++){const x=(i*59)%w,y=(i*127)%h,v=85+(i*29)%120;ctx.fillStyle=`rgba(${v},${v},${v},.24)`;ctx.fillRect(x,y,1,1);}
});
sidingHeight.repeat.copy(sidingTexture.repeat);
const stuccoTexture=makeTexture((ctx,w,h)=>{
  const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#c9c3b8');grad.addColorStop(1,'#a39d92');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  for(let i=0;i<21000;i++){
    const x=(i*61)%w,y=(i*149)%h,v=95+(i*23)%125;
    ctx.fillStyle=`rgba(${v},${v},${v},.20)`;ctx.fillRect(x,y,1+(i%2),1+(i%2));
  }
  for(let i=0;i<18;i++){
    const x=(i*113)%w,y=(i*79)%h;
    const wash=ctx.createLinearGradient(x,y,x+8,y+155);wash.addColorStop(0,'rgba(65,61,55,.09)');wash.addColorStop(1,'rgba(65,61,55,0)');
    ctx.fillStyle=wash;ctx.fillRect(x,y,8,155);
  }
});
const stuccoHeight=makeDataTexture((ctx,w,h)=>{
  ctx.fillStyle='#999';ctx.fillRect(0,0,w,h);
  for(let i=0;i<18000;i++){const x=(i*61)%w,y=(i*149)%h,v=85+(i*31)%130;ctx.fillStyle=`rgba(${v},${v},${v},.35)`;ctx.fillRect(x,y,1,1);}
});
M.siding=mat(0xffffff,.88);M.siding.map=sidingTexture;M.siding.bumpMap=sidingHeight;M.siding.bumpScale=.055;M.siding.roughnessMap=sidingHeight;
M.stucco=mat(0xffffff,.94);M.stucco.map=stuccoTexture;M.stucco.bumpMap=stuccoHeight;M.stucco.bumpScale=.045;M.stucco.roughnessMap=stuccoHeight;
M.fabricTexture=fabricTexture;M.fabricBump=fabricBump;M.skinTexture=skinTexture;M.skinBump=skinBump;

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
scene.add(new THREE.HemisphereLight(0xd9e7f0,0x59614f,1.62));
const sun=new THREE.DirectionalLight(0xffe1bc,2.15);
sun.position.set(-85,115,-65);sun.castShadow=true;
sun.shadow.mapSize.set(Math.min(renderer.capabilities.maxTextureSize,1024),Math.min(renderer.capabilities.maxTextureSize,1024));
sun.shadow.bias=-0.00008;sun.shadow.normalBias=.025;sun.shadow.camera.near=1;sun.shadow.camera.far=340;
sun.shadow.camera.left=-180;sun.shadow.camera.right=180;sun.shadow.camera.top=180;sun.shadow.camera.bottom=-180;
sun.shadow.camera.updateProjectionMatrix();scene.add(sun);
const ambientLight=scene.children.find(item=>item.isHemisphereLight);

// Three-by-three fictional street grid.
ground(0,0,320,320,M.grass,-.2);
const curbMaterial=new THREE.MeshStandardMaterial({color:0x8e8b82,roughness:.92});
const curbTopMaterial=new THREE.MeshStandardMaterial({color:0xb9b5aa,roughness:.86});
for(const v of [-82,0,82]){
  ground(0,v,320,17,M.road,-.08);ground(v,0,17,320,M.road,-.075);
  for(const side of [-1,1]){
    ground(0,v+side*10.1,320,3.1,M.walk,-.02);ground(v+side*10.1,0,3.1,320,M.walk,-.02);
    cube(world,0,.015,v+side*8.65,320,.22,.38,curbMaterial,false);
    cube(world,v+side*8.65,.015,0,.38,.22,320,curbMaterial,false);
    cube(world,0,.13,v+side*8.65,320,.035,.4,curbTopMaterial,false);
    cube(world,v+side*8.65,.13,0,.4,.035,320,curbTopMaterial,false);
  }
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
// Road hardware: metal manhole covers and recessed curb storm drains.
const manholeMaterial=new THREE.MeshStandardMaterial({color:0x414749,roughness:.72,metalness:.5});
const manholeRingMaterial=new THREE.MeshStandardMaterial({color:0x727878,roughness:.48,metalness:.75});
function manhole(x,z){
  const plate=new THREE.Mesh(new THREE.CircleGeometry(.72,40),manholeMaterial);
  plate.rotation.x=-Math.PI/2;plate.position.set(x,.025,z);plate.receiveShadow=true;world.add(plate);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.69,.045,8,40),manholeRingMaterial);
  ring.rotation.x=Math.PI/2;ring.position.set(x,.035,z);world.add(ring);
  for(let i=0;i<7;i++)cube(world,x-.48+i*.16,.039,z,.035,.012,.72,manholeRingMaterial,false);
}
function stormDrain(x,z,rotation=0){
  const group=new THREE.Group();group.position.set(x,.035,z);group.rotation.y=rotation;world.add(group);
  cube(group,0,0,0,1.8,.045,.48,manholeMaterial,false);
  for(let i=0;i<9;i++)cube(group,-.78+i*.195,.028,0,.055,.025,.42,manholeRingMaterial,false);
}
[[-71,-82],[24,-82],[-45,0],[66,0],[-6,82],[57,82]].forEach(([x,z])=>manhole(x,z));
[[-82,-53,Math.PI/2],[82,44,Math.PI/2],[-38,-82,0],[45,82,0]].forEach(([x,z,r])=>stormDrain(x,z,r));

function building(x,z,w,d,h,color,side=true){
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  const facade=color===M.cream?M.siding:color===M.dark?M.stucco:color;
  cube(g,0,h/2,0,w,h,d,facade);cube(g,0,h+.2,0,w+.5,.4,d+.5,M.dark);
  cube(g,0,.16,0,w+.28,.32,d+.28,M.trim,false);
  cube(g,0,h+.43,0,w+.9,.16,d+.9,M.trim,false);
  cube(g,0,.42,0,w+.24,.32,d+.24,M.limestone,false);
  cube(g,0,h+.62,0,w+1.02,.12,d+1.02,M.limestone,false);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    cube(g,sx*(w/2-.42),h/2,sz*(d/2+.045),.2,h-.9,.18,M.limestone,false);
  }
  // Layered floor bands, drip caps and corner drainage pipes add believable depth.
  for(let level=3.3;level<h;level+=3.3){
    cube(g,0,level,d/2+.035,w,.085,.16,M.trim,false);
    cube(g,0,level,-d/2-.035,w,.085,.16,M.trim,false);
    cube(g,w/2+.035,level,0,.16,.085,d,M.trim,false);
    cube(g,-w/2-.035,level,0,.16,.085,d,M.trim,false);
  }
  for(const sx of [-1,1])for(const sz of [-1,1])cube(g,sx*(w/2-.12),h/2,sz*(d/2-.12),.16,h,.16,M.trim,false);
  const rows=Math.max(2,Math.floor(h/3.3)),cols=Math.max(2,Math.floor(w/4.7));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const px=-w/2+(c+.5)*w/cols,py=1.4+r*(h-2.2)/rows;
    for(const face of [-1,1]){
      windows.push({x:x+px,y:py,z:z+face*(d/2+.04),sx:1.1,sy:1.4,sz:.08,face:'z',faceSign:face});
      // A portion of windows have projecting sills and compact air-conditioning units.
      if((r*cols+c+Math.round(x))%7===0){
        const ac=cube(g,px,py-.93,z===z?face*(d/2+.22):0,.72,.28,.34,M.metal,false);
        for(let vent=0;vent<4;vent++)cube(g,px-.24+vent*.16,py-.93,face*(d/2+.397),.025,.17,.018,M.silver,false);
        cube(g,px,py-1.1,face*(d/2+.22),.78,.045,.39,M.trim,false);
      }
      // Select buildings receive small metal balconettes instead of a perfectly flat facade.
      if(h>14&&((r*cols+c+Math.abs(Math.round(x)))%11===0)){
        const balcony=cube(g,px,py-.82,face*(d/2+.55),1.48,.09,.78,M.metal,false);
        for(let rail=0;rail<7;rail++)cube(g,px-.68+rail*.227,py-.37,face*(d/2+.9),.035,.78,.045,M.silver,false);
        cube(g,px,py+.03,face*(d/2+.9),1.5,.055,.055,M.silver,false);
      }
    }
    if(side)for(const face of [-1,1])windows.push({x:x+face*(w/2+.04),y:py,z:z-d/2+(c+.5)*d/cols,sx:.08,sy:1.35,sz:1,face:'x',faceSign:face});
  }
  // Downspouts with mounting straps make long blank corners less synthetic.
  for(const sx of [-1,1]){
    const pipe=cube(g,sx*(w/2-.24),h/2,d/2+.13,.075,h-.35,.075,M.metal,false);
    for(let strap=0;strap<Math.floor(h/3.4);strap++)cube(g,sx*(w/2-.24),1.2+strap*3.3,d/2+.18,.18,.045,.045,M.silver,false);
  }
  // Concrete roof coping and small vent stacks.
  for(const sx of [-1,1])cube(g,sx*(w/2-.5),h+.74,0,.16,.22,d+.5,M.limestone,false);
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
const windowMullionMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M.silver,windows.length);
windows.forEach((item,index)=>{
  const front=item.face==='z';
  windowTransform.position.set(item.x+(front?0:item.faceSign*.065),item.y,item.z+(front?item.faceSign*.065:0));
  windowTransform.scale.set(front?.055:.055,item.sy*.88,front?.11:.11);
  windowTransform.updateMatrix();windowMullionMesh.setMatrixAt(index,windowTransform.matrix);
});
windowMullionMesh.instanceMatrix.needsUpdate=true;windowMullionMesh.castShadow=false;world.add(windowMullionMesh);
const windowSillMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M.limestone,windows.length);
windows.forEach((item,index)=>{
  const front=item.face==='z';
  windowTransform.position.set(item.x+(front?0:item.faceSign*.09),item.y-item.sy/2-.1,item.z+(front?item.faceSign*.09:0));
  windowTransform.scale.set(front?item.sx+.24:.18,.13,front?.18:item.sz+.24);
  windowTransform.updateMatrix();windowSillMesh.setMatrixAt(index,windowTransform.matrix);
});
windowSillMesh.instanceMatrix.needsUpdate=true;windowSillMesh.castShadow=false;world.add(windowSillMesh);

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
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.34,4.1,14),M.wood);trunk.position.y=2.05;trunk.castShadow=true;g.add(trunk);
  const branchMaterial=M.wood;
  const branchPoints=[[-.9,2.4,0,.85], [.82,2.65,.12,.92], [.1,3.05,-.72,.78],[-.2,3.2,.7,.72]];
  for(const [bx,by,bz,length] of branchPoints){
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.07,.13,length,9),branchMaterial);
    branch.position.set(bx*.52,by,bz*.52);branch.rotation.z=-bx*.46;branch.rotation.x=bz*.34;branch.castShadow=true;g.add(branch);
  }
  const foliage=new THREE.MeshStandardMaterial({color:0x496d4b,roughness:.96});
  const foliageLight=new THREE.MeshStandardMaterial({color:0x638258,roughness:.97});
  const foliageDark=new THREE.MeshStandardMaterial({color:0x36583e,roughness:.99});
  const clusters=[[-.92,3.45,0,1.05],[-.28,4.18,.2,1.08],[.66,3.72,.1,1.02],[.12,4.55,-.55,.92],[-.12,3.65,.78,.96],[.72,4.42,-.42,.68],[-.72,4.22,.48,.72]];
  clusters.forEach(([cx,cy,cz,r],index)=>{
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(r,2),index%3===0?foliageDark:index%2?foliage:foliageLight);
    crown.position.set(cx,cy,cz);crown.scale.set(1.12,.9,1);crown.castShadow=true;crown.receiveShadow=true;g.add(crown);
  });
  // One instanced leaf cluster layer supplies fine canopy breakup without hundreds of draw calls.
  const leafPods=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.105,1),foliageLight,64);
  const leafDummy=new THREE.Object3D();
  for(let leaf=0;leaf<64;leaf++){
    const angle=leaf*2.399963,ring=.35+(leaf%7)*.115;
    leafDummy.position.set(Math.cos(angle)*ring,3.35+(leaf%11)*.115,Math.sin(angle)*ring);
    leafDummy.scale.set(.8+(leaf%4)*.12,.72+(leaf%3)*.16,1);
    leafDummy.rotation.set((leaf%5)*.16,angle,(leaf%7)*.09);leafDummy.updateMatrix();
    leafPods.setMatrixAt(leaf,leafDummy.matrix);
    leafPods.setColorAt(leaf,new THREE.Color(leaf%4===0?0x365a3c:leaf%3===0?0x6e8d55:0x4e7549));
  }
  leafPods.instanceMatrix.needsUpdate=true;leafPods.castShadow=true;leafPods.receiveShadow=true;g.add(leafPods);
}
[[-58,17],[-13,17],[-58,58],[-13,58],[-48,7],[-22,69]].forEach(p=>tree(...p));

// Instanced grass blades give lawns real silhouette and light-catching variation.
function addGrassCover(){
  const positions=[],indices=[];
  for(let blade=0;blade<3;blade++){
    const angle=blade*Math.PI/3,c=Math.cos(angle),s=Math.sin(angle),base=positions.length/3;
    const pts=[[-.065,0,0],[.065,0,0],[0,.48,.035]];
    for(const [x,y,z] of pts)positions.push(x*c-z*s,y,x*s+z*c);
    indices.push(base,base+1,base+2);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:0x91a66e,roughness:.95,side:THREE.DoubleSide});
  const count=isCoarsePointer()?420:1450;
  const grass=new THREE.InstancedMesh(geometry,material,count);
  const dummy=new THREE.Object3D();let placed=0;
  for(let i=0;i<count*5&&placed<count;i++){
    const x=((i*73)%300)-150,z=((i*137)%300)-150;
    if([-82,0,82].some(axis=>Math.abs(x-axis)<9||Math.abs(z-axis)<9))continue;
    if(colliders.some(c=>Math.abs(x-c.x)<c.w/2+1&&Math.abs(z-c.z)<c.d/2+1))continue;
    if(x>-67&&x<-3&&z>8&&z<70)continue;
    dummy.position.set(x,-.12,z);dummy.rotation.y=(i*2.399963)%Math.PI;
    const scale=.55+(i%11)*.065;dummy.scale.set(scale,.65+(i%5)*.12,scale);
    dummy.updateMatrix();grass.setMatrixAt(placed,dummy.matrix);
    grass.setColorAt(placed,new THREE.Color(i%5===0?0x6d8654:i%3===0?0x829961:0x9aad70));
    placed++;
  }
  grass.count=placed;grass.instanceMatrix.needsUpdate=true;grass.castShadow=false;grass.receiveShadow=true;world.add(grass);
}
addGrassCover();
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

// Four readable street-name signs make the grid feel more like a lived-in neighborhood.
const streetSigns=[];
function streetSign(x,z,label,rotation=0){
  const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rotation;world.add(group);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,3.25,8),M.metal);
  pole.position.y=1.62;pole.castShadow=true;group.add(pole);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),M.silver);
  cap.position.y=3.28;group.add(cap);
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=144;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#204d42';ctx.fillRect(0,0,640,144);
  ctx.strokeStyle='#e9dfc2';ctx.lineWidth=9;ctx.strokeRect(12,12,616,120);
  ctx.fillStyle='#f8f3e5';ctx.font='bold 47px system-ui, sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,320,72);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshStandardMaterial({map:texture,roughness:.68});
  const backing=new THREE.Mesh(new THREE.BoxGeometry(2.95,.68,.11),M.metal);
  backing.position.y=2.72;backing.castShadow=true;group.add(backing);
  for(const direction of [-1,1]){
    const face=new THREE.Mesh(new THREE.PlaneGeometry(2.78,.51),material);
    face.position.set(0,2.72,direction*.061);
    if(direction<0)face.rotation.y=Math.PI;
    group.add(face);
  }
  streetSigns.push(group);
}
streetSign(-94,82,'WEST AVENUE',Math.PI/2);
streetSign(94,-80,'MARKET STREET',-Math.PI/2);
streetSign(-80,-94,'NORTH AVENUE',0);
streetSign(80,94,'COURTYARD WAY',Math.PI);

// Extra street-level architecture and landscaping make the block read less like a procedural test map.
const visualDetailCounts={fireEscapes:0,courtyardPlanters:0,murals:0};
function fireEscape(x,z,levels=3){
  const group=new THREE.Group();group.position.set(x,0,z);world.add(group);
  for(let level=0;level<levels;level++){
    const y=3.4+level*3.35;
    cube(group,0,y,1.05,5.7,.14,1.55,M.metal,false);
    cube(group,0,y+.88,1.78,5.7,.11,.12,M.silver,false);
    for(const side of [-1,1]){
      cube(group,side*2.78,y+.45,1.12,.11,.9,1.42,M.silver,false);
      for(let post=0;post<5;post++)cube(group,side*(.7+post*.47),y+.43,1.78,.055,.86,.055,M.silver,false);
    }
    for(let post=0;post<7;post++)cube(group,-2.55+post*.85,y+.43,1.78,.055,.86,.055,M.silver,false);
    for(const support of [-2.25,2.25])cube(group,support,y-.62,.45,.12,1.12,.12,M.metal,false);
  }
  const ladderX=2.35;
  for(const side of [-1,1])cube(group,ladderX+side*.22,(levels*3.35)/2+1.2,2.0,.075,levels*3.35,.075,M.silver,false);
  for(let rung=0;rung<levels*6;rung++)cube(group,ladderX,1.1+rung*.55,2.0,.5,.055,.055,M.silver,false);
  visualDetailCounts.fireEscapes++;
  return group;
}
fireEscape(-45,-18.3,4);
fireEscape(119,-17.2,3);
fireEscape(-117,60.8,3);

function courtyardPlanter(x,z,flowerColor=0xd18a69){
  const group=new THREE.Group();group.position.set(x,0,z);world.add(group);
  cube(group,0,.42,0,3.5,.84,1.35,M.cream,false);
  cube(group,0,.87,0,3.35,.13,1.22,M.wood,false);
  for(let i=0;i<8;i++){
    const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.34+(i%3)*.035,1),M.leaf);
    shrub.position.set(-1.35+(i%4)*.9,1.18+(i%2)*.08,(i<4?-.28:.28));
    shrub.castShadow=true;group.add(shrub);
    if(i%2===0){
      const flower=new THREE.Mesh(new THREE.SphereGeometry(.12,8,7),mat(flowerColor,.55));
      flower.position.set(shrub.position.x,1.47,shrub.position.z);group.add(flower);
    }
  }
  visualDetailCounts.courtyardPlanters++;
  return group;
}
courtyardPlanter(-55,31,0xd18a69);
courtyardPlanter(-16,31,0xe5bb69);
courtyardPlanter(-37,63,0xb9789b);

function createMural(x,z){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=384;
  const ctx=canvas.getContext('2d'),sky=ctx.createLinearGradient(0,0,0,384);
  sky.addColorStop(0,'#e5a45f');sky.addColorStop(.52,'#b45f4b');sky.addColorStop(1,'#273b48');
  ctx.fillStyle=sky;ctx.fillRect(0,0,768,384);
  ctx.fillStyle='#f4d58d';ctx.beginPath();ctx.arc(575,112,68,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#283b45';
  const skyline=[[0,210,90,174],[78,166,84,218],[150,195,74,189],[225,145,92,239],[315,194,78,190],[392,170,86,214],[480,216,80,168],[558,186,90,198],[646,220,122,164]];
  for(const [sx,sy,sw,sh] of skyline)ctx.fillRect(sx,sy,sw,sh);
  ctx.fillStyle='#e8b45f';
  for(let i=0;i<18;i++){const sx=(i*43+18)%740,sy=190+(i%4)*37;ctx.fillRect(sx,sy,15,7);}
  ctx.fillStyle='#f5e8d1';ctx.font='900 52px system-ui,sans-serif';ctx.textAlign='left';
  ctx.fillText('WEST AVENUE',34,328);
  ctx.fillStyle='#f4d58d';ctx.fillRect(34,344,700,7);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const muralMaterial=new THREE.MeshStandardMaterial({map:texture,roughness:.82,side:THREE.DoubleSide});
  const art=new THREE.Mesh(new THREE.PlaneGeometry(13.5,6.5),muralMaterial);
  art.position.set(x,5.1,z);art.rotation.y=Math.PI/2;art.receiveShadow=true;world.add(art);
  visualDetailCounts.murals++;
  return art;
}
createMural(-101.78,-38.5);

// Street lamps with warm bulbs and restrained local lighting for nighttime.
const nightLights=[];
for(const z of [-95,-69,-14,14,69,95])for(const x of [-95,95]){
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,7,8),M.metal);pole.position.set(x,3.5,z);pole.castShadow=true;world.add(pole);
  cube(world,x+.65,6.8,z,1.35,.12,.3,M.metal,false);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.19,10,8),M.lampGlow);bulb.position.set(x+.65,6.66,z);world.add(bulb);
  const glow=new THREE.PointLight(0xffc77b,0,23,2);glow.position.set(x+.65,6.35,z);world.add(glow);nightLights.push({glow,bulb});
}
function person(material,appearance=0){
  const g=new THREE.Group();
  const skinTones=[0x714d3e,0x8d624d,0xa87558,0xc18e6d,0xd1a17d,0x986d52];
  const skin=new THREE.MeshPhysicalMaterial({
    color:skinTones[appearance%skinTones.length],map:skinTexture,bumpMap:skinBump,bumpScale:.018,
    roughness:.73,metalness:0,clearcoat:.035,clearcoatRoughness:.72
  });
  const clothing=material.clone();clothing.map=fabricTexture;clothing.bumpMap=fabricBump;clothing.bumpScale=.025;
  clothing.roughnessMap=fabricBump;clothing.roughness=.88;clothing.color.copy(material.color);clothing.needsUpdate=true;
  const pantsMat=new THREE.MeshStandardMaterial({
    color:[0x252c32,0x3b454c,0x4b4c4b,0x292a31][appearance%4],
    map:fabricTexture,bumpMap:fabricBump,bumpScale:.018,roughness:.92
  });
  const hairColors=[0x171615,0x29201a,0x3d2b20,0x544033];
  const hairMat=new THREE.MeshStandardMaterial({color:hairColors[appearance%hairColors.length],roughness:.88});
  const shoeMat=new THREE.MeshStandardMaterial({color:appearance%3===0?0x181b1d:0x36322d,roughness:.76});
  const detailMat=new THREE.MeshStandardMaterial({color:0x25282a,roughness:.72});
  const torso=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),clothing);
  torso.position.set(0,1.15,0);torso.scale.set(.345,.48,.225);torso.castShadow=true;torso.receiveShadow=true;g.add(torso);
  for(const side of [-1,1]){
    const shoulder=new THREE.Mesh(new THREE.SphereGeometry(.17,20,16),clothing);
    shoulder.position.set(side*.285,1.4,0);shoulder.scale.set(1,.9,1);shoulder.castShadow=true;g.add(shoulder);
  }
  const hem=new THREE.Mesh(new THREE.TorusGeometry(.245,.014,7,28),new THREE.MeshStandardMaterial({color:material.color,roughness:.9}));
  hem.position.set(0,.83,0);hem.rotation.x=Math.PI/2;hem.scale.set(1,.78,1);g.add(hem);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.095,.12,.2,18),skin);neck.position.y=1.59;neck.castShadow=true;g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.215,32,26),skin);
  head.position.set(0,1.82,.018);head.scale.set(.9,1.12,.91);head.castShadow=true;head.receiveShadow=true;g.add(head);
  const jaw=new THREE.Mesh(new THREE.SphereGeometry(.145,24,18),skin);
  jaw.position.set(0,1.69,.07);jaw.scale.set(.82,.7,.82);jaw.castShadow=true;g.add(jaw);
  for(const side of [-1,1]){
    const cheek=new THREE.Mesh(new THREE.SphereGeometry(.082,16,12),skin);
    cheek.position.set(side*.105,1.735,.145);cheek.scale.set(1,.75,.7);g.add(cheek);
    const ear=new THREE.Mesh(new THREE.SphereGeometry(.052,16,12),skin);
    ear.position.set(side*.198,1.8,.012);ear.scale.set(.72,1.2,.72);g.add(ear);
    const earInner=new THREE.Mesh(new THREE.SphereGeometry(.022,10,8),detailMat);
    earInner.position.set(side*.213,1.8,.037);earInner.scale.set(.7,1,.65);g.add(earInner);
  }
  // Natural hairline and separated curls/locks break up the old smooth helmet silhouette.
  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.222,28,20,0,Math.PI*2,0,Math.PI*.59),hairMat);
  hairCap.position.set(0,1.89,-.005);hairCap.scale.set(.99,1.1,1);hairCap.castShadow=true;g.add(hairCap);
  const curlGeometry=new THREE.SphereGeometry(.047,10,8);
  for(let i=0;i<17;i++){
    const angle=(i/17)*Math.PI*2,ring=i%2===0?0.155:0.12;
    const curl=new THREE.Mesh(curlGeometry,hairMat);
    curl.position.set(Math.cos(angle)*ring,1.965+(i%3)*.012,Math.sin(angle)*ring-.005);
    curl.scale.set(.9,.72,1);g.add(curl);
  }
  for(const side of [-1,1]){
    const eyeWhite=new THREE.Mesh(new THREE.SphereGeometry(.031,14,10),new THREE.MeshStandardMaterial({color:0xe7e0d5,roughness:.45}));
    eyeWhite.position.set(side*.075,1.827,.197);eyeWhite.scale.set(1,.72,.48);g.add(eyeWhite);
    const iris=new THREE.Mesh(new THREE.SphereGeometry(.015,12,9),new THREE.MeshStandardMaterial({color:0x34251e,roughness:.32}));
    iris.position.set(side*.075,1.827,.212);g.add(iris);
    const pupil=new THREE.Mesh(new THREE.SphereGeometry(.007,8,6),new THREE.MeshBasicMaterial({color:0x100e0c}));
    pupil.position.set(side*.075,1.827,.219);g.add(pupil);
    const brow=new THREE.Mesh(new THREE.CapsuleGeometry(.012,.07,3,8),hairMat);
    brow.position.set(side*.075,1.874,.195);brow.rotation.z=side*.08;g.add(brow);
    const lid=new THREE.Mesh(new THREE.TorusGeometry(.031,.006,5,14,Math.PI),skin);
    lid.position.set(side*.075,1.829,.213);lid.rotation.z=Math.PI;g.add(lid);
  }
  const noseBridge=new THREE.Mesh(new THREE.CylinderGeometry(.018,.032,.12,10),skin);
  noseBridge.position.set(0,1.765,.205);noseBridge.rotation.x=-.12;g.add(noseBridge);
  const noseTip=new THREE.Mesh(new THREE.SphereGeometry(.037,14,10),skin);
  noseTip.position.set(0,1.744,.232);noseTip.scale.set(1,.72,.82);g.add(noseTip);
  const nostrilMat=new THREE.MeshStandardMaterial({color:0x4d3329,roughness:.9});
  for(const side of [-1,1]){
    const nostril=new THREE.Mesh(new THREE.SphereGeometry(.009,8,6),nostrilMat);
    nostril.position.set(side*.023,1.728,.249);nostril.scale.set(1,.55,.5);g.add(nostril);
  }
  const mouthCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.046,1.688,.208),new THREE.Vector3(0,1.681,.218),new THREE.Vector3(.046,1.688,.208)
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(mouthCurve,8,.006,5,false),detailMat));
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.32,1.39,0);arm.rotation.z=-side*.08;g.add(arm);
    const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.31,7,16),clothing);
    upper.position.set(side*.018,-.22,0);upper.rotation.z=-side*.035;upper.castShadow=true;arm.add(upper);
    const cuff=new THREE.Mesh(new THREE.TorusGeometry(.083,.012,6,16),clothing);
    cuff.position.set(side*.025,-.44,0);cuff.rotation.x=Math.PI/2;arm.add(cuff);
    const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.072,.27,7,14),skin);
    forearm.position.set(side*.035,-.61,.005);forearm.castShadow=true;arm.add(forearm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.074,16,12),skin);
    hand.position.set(side*.045,-.81,.018);hand.scale.set(.78,1.12,.65);arm.add(hand);
    for(let finger=0;finger<4;finger++){
      const digit=new THREE.Mesh(new THREE.CapsuleGeometry(.014,.065,3,7),skin);
      digit.position.set(side*.045-.035+finger*.023,-.885,.038);digit.rotation.z=-.08;arm.add(digit);
    }
    const thumb=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.052,3,7),skin);
    thumb.position.set(side*.045+side*.075,-.82,.05);thumb.rotation.z=side*.62;arm.add(thumb);
    arms.push(arm);
    const leg=new THREE.Group();leg.position.set(side*.145,.64,0);g.add(leg);
    const thigh=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.34,7,14),pantsMat);
    thigh.position.y=-.15;thigh.castShadow=true;leg.add(thigh);
    const knee=new THREE.Mesh(new THREE.SphereGeometry(.106,14,10),pantsMat);knee.position.y=-.34;leg.add(knee);
    const lower=new THREE.Mesh(new THREE.CapsuleGeometry(.092,.28,7,14),pantsMat);
    lower.position.y=-.43;lower.castShadow=true;leg.add(lower);
    const shoe=new THREE.Mesh(new THREE.SphereGeometry(.135,18,12),shoeMat);
    shoe.position.set(0,-.7,.09);shoe.scale.set(1,.55,1.62);shoe.castShadow=true;leg.add(shoe);
    const sole=new THREE.Mesh(new THREE.BoxGeometry(.265,.04,.4),new THREE.MeshStandardMaterial({color:0x191a19,roughness:.96}));
    sole.position.set(0,-.77,.09);leg.add(sole);legs.push(leg);
  }
  // Collar, placket and small buttons make the clothing read as stitched garments.
  const collarMat=clothing.clone();collarMat.color.multiplyScalar(.78);
  for(const side of [-1,1]){
    const collar=new THREE.Mesh(new THREE.BoxGeometry(.12,.07,.12),collarMat);
    collar.position.set(side*.085,1.505,.17);collar.rotation.z=side*.28;g.add(collar);
  }
  for(let button=0;button<4;button++){
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.012,7,6),detailMat);
    dot.position.set(0,1.39-button*.085,.218);g.add(dot);
  }
  g.userData.legs=legs;g.userData.arms=arms;
  g.userData.visualQuality='v3.1-anatomical-textured';
  return g;
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
  const g=person([M.blue,M.green,M.red][i%3],i);g.position.copy(route[i%route.length]);world.add(g);
  pedestrians.push({g,route,target:(i+1)%route.length,speed:1.05+(i%4)*.12,phase:i*.8});
}
const plateCanvas=document.createElement('canvas');plateCanvas.width=512;plateCanvas.height=128;
const plateContext=plateCanvas.getContext('2d');
plateContext.fillStyle='#f0ead7';plateContext.fillRect(0,0,512,128);
plateContext.strokeStyle='#27435a';plateContext.lineWidth=9;plateContext.strokeRect(10,10,492,108);
plateContext.fillStyle='#27435a';plateContext.textAlign='center';plateContext.textBaseline='middle';
plateContext.font='bold 42px system-ui, sans-serif';plateContext.fillText('CHICAGO',256,42);
plateContext.font='bold 42px system-ui, sans-serif';plateContext.fillText('CBK 2048',256,88);
const plateTexture=new THREE.CanvasTexture(plateCanvas);plateTexture.colorSpace=THREE.SRGBColorSpace;
const licensePlateMaterial=new THREE.MeshStandardMaterial({map:plateTexture,roughness:.82});

function car(color=0x365b78,detailedInterior=false){
  const g=new THREE.Group(),bodyMat=new THREE.MeshPhysicalMaterial({color,roughness:.24,metalness:.48,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.45}),wheelRigs=[];
  // Rounded, sloped side profiles replace the old rectangular body and cabin blocks.
  const extrudedProfile=(points,depth,material)=>{
    const profile=new THREE.Shape();
    points.forEach(([x,y],index)=>index===0?profile.moveTo(x,y):profile.lineTo(x,y));
    profile.closePath();
    const geometry=new THREE.ExtrudeGeometry(profile,{
      depth,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.035,bevelThickness:.035,curveSegments:8
    });
    geometry.translate(0,0,-depth/2);
    geometry.rotateY(Math.PI/2);
    geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,material);
    mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);
    return mesh;
  };
  // Profile X is reversed local Z because the side shape is rotated into the car's length axis.
  extrudedProfile([
    [-2.22,.36],[2.2,.36],[2.18,.58],[1.98,.77],[1.3,.86],[1.05,1.02],
    [.88,1.08],[-1.12,1.08],[-1.35,.9],[-1.98,.81],[-2.17,.64]
  ],2.02,bodyMat);
  extrudedProfile([
    [-1.3,.88],[1.2,.88],[.78,1.48],[.48,1.62],[-.82,1.62],[-1.15,1.4]
  ],1.76,bodyMat);
  const windowMaterial=M.glass.clone();windowMaterial.side=THREE.DoubleSide;windowMaterial.roughness=.12;windowMaterial.clearcoat=1;windowMaterial.envMapIntensity=1.7;windowMaterial.transmission=.08;windowMaterial.ior=1.46;
  const addSideWindow=(points,side)=>{
    const shape=new THREE.Shape();
    points.forEach(([x,y],index)=>index===0?shape.moveTo(x,y):shape.lineTo(x,y));
    shape.closePath();
    const geometry=new THREE.ShapeGeometry(shape,8);geometry.rotateY(Math.PI/2);
    const pane=new THREE.Mesh(geometry,windowMaterial);
    pane.position.x=side*.895;pane.position.y=0;pane.position.z=0;
    pane.castShadow=false;g.add(pane);
  };
  for(const side of [-1,1]){
    addSideWindow([[-1.08,1.01],[-.16,1.01],[-.16,1.5],[-.78,1.5]],side);
    addSideWindow([[-.04,1.01],[.94,1.01],[.66,1.47],[.08,1.5]],side);
    cube(g,side*.905,1.26,.02,.045,.48,.055,M.trim,false);
  }
  const windshield=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.5),windowMaterial);
  windshield.position.set(0,1.27,-1.17);windshield.rotation.x=.42;g.add(windshield);
  const rearGlass=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.44),windowMaterial);
  rearGlass.position.set(0,1.26,1.12);rearGlass.rotation.x=-.42;g.add(rearGlass);
  cube(g,0,1.65,-.16,1.36,.055,1.38,bodyMat,false);
  // Visible cabin details make the sedan read as a finished vehicle from either camera.
  if(detailedInterior){
    const cabinMat=new THREE.MeshStandardMaterial({color:0x20272a,roughness:.88});
    const seatMat=new THREE.MeshStandardMaterial({color:0x343a3b,roughness:.94});
    cube(g,0,1.02,.02,1.42,.22,1.86,cabinMat,false);
    cube(g,0,1.12,-.91,1.35,.22,.34,cabinMat,false);
    for(const sx of [-1,1])for(const sz of [-.48,.55]){
      cube(g,sx*.43,1.28,sz,.48,.62,.5,seatMat,false);
      cube(g,sx*.43,1.66,sz+.14,.45,.34,.14,seatMat,false);
    }
    const steeringWheel=new THREE.Mesh(new THREE.TorusGeometry(.22,.035,9,28),M.trim);
    steeringWheel.position.set(.42,1.34,-.87);steeringWheel.rotation.x=.92;steeringWheel.rotation.z=-.14;g.add(steeringWheel);
    cube(g,0,1.23,-.72,1.22,.14,.28,cabinMat,false);
  }
  cube(g,0,.48,-2.2,1.9,.18,.18,M.silver,false);cube(g,0,.48,2.2,1.9,.18,.18,M.silver,false);
  cube(g,0,.83,-2.22,.92,.24,.08,M.metal,false);
  for(let slat=0;slat<3;slat++){
    cube(g,0,.76+slat*.07,-2.27,.74,.025,.022,M.silver,false);
  }
  for(const [z,rotation] of [[-2.32,0],[2.32,Math.PI]]){
    const plate=new THREE.Mesh(new THREE.PlaneGeometry(.82,.15),licensePlateMaterial);
    plate.position.set(0,.49,z);plate.rotation.y=rotation;g.add(plate);
  }
  for(const sx of [-.72,.72]){
    cube(g,sx,.91,-2.235,.38,.24,.07,M.headlight,false);
    cube(g,sx,.88,2.235,.34,.24,.07,M.tailLight,false);
    cube(g,sx*1.38,1.17,-.95,.34,.17,.28,bodyMat,false);
    const mirror=cube(g,sx*1.12,1.24,-1.08,.2,.16,.3,M.metal,false);
    mirror.rotation.z=sx*.08;
  }
  let wheelSpokeCount=0;
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const rig=new THREE.Group();rig.position.set(sx*1.07,.4,sz*1.38);g.add(rig);wheelRigs.push(rig);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.27,40),M.tire);tire.rotation.z=Math.PI/2;rig.add(tire);
    const sidewall=new THREE.Mesh(new THREE.TorusGeometry(.345,.035,8,36),new THREE.MeshStandardMaterial({color:0x252829,roughness:.92}));
    sidewall.rotation.y=Math.PI/2;sidewall.position.x=sx*.14;rig.add(sidewall);
    const brakeDisc=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.255,32),new THREE.MeshStandardMaterial({color:0x737b7e,roughness:.5,metalness:.82}));
    brakeDisc.rotation.z=Math.PI/2;rig.add(brakeDisc);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.275,28),M.silver);hub.rotation.z=Math.PI/2;rig.add(hub);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.205,.028,8,22),M.trim);
    rim.rotation.y=Math.PI/2;rim.position.x=sx*.135;rig.add(rim);
    for(let spokeIndex=0;spokeIndex<5;spokeIndex++){
      const angle=spokeIndex*Math.PI*2/5;
      const spoke=cube(rig,sx*.145,Math.sin(angle)*.105,Math.cos(angle)*.105,.035,.17,.035,M.silver,false);
      spoke.rotation.x=angle;wheelSpokeCount++;
    }
    const centerCap=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.27,14),M.trim);
    centerCap.rotation.z=Math.PI/2;rig.add(centerCap);
    const arch=new THREE.Mesh(new THREE.TorusGeometry(.43,.045,7,20,Math.PI),M.trim);
    arch.rotation.set(0,Math.PI/2,Math.PI);arch.position.set(sx*1.05,.42,sz*1.38);g.add(arch);
  }
  for(const sx of [-1,1])cube(g,sx*1.055,.76,0,.045,.48,1.55,M.trim,false);
  // Chrome window surrounds and subtle lower sill accents.
  for(const sx of [-1,1]){
    cube(g,sx*.91,1.0,-.15,.035,.055,1.65,M.silver,false);
    cube(g,sx*.91,1.49,-.12,.035,.045,1.35,M.silver,false);
    cube(g,sx*.91,.43,0,.045,.11,2.5,M.trim,false);
  }
  for(const sx of [-1,1])for(const z of [-.58,.48]){
    const doorHandle=cube(g,sx*1.075,1.03,z,.05,.085,.3,M.silver,false);
  }
  // Fine panel gaps, lower body crease and chrome beltline catch directional light.
  const seamMaterial=new THREE.MeshBasicMaterial({color:0x20282c,transparent:true,opacity:.68});
  for(const sx of [-1,1]){
    for(const z of [-.94,.82]){
      const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx*1.035,.77,z),new THREE.Vector3(sx*1.055,.93,z+.05),new THREE.Vector3(sx*1.055,1.0,z+.1)
      ]),12,.009,5,false),seamMaterial);g.add(seam);
    }
    const beltline=cube(g,sx*.91,1.47,-.12,.025,.025,1.35,M.silver,false);
    const lowerCrease=cube(g,sx*1.045,.69,.05,.018,.025,1.82,M.silver,false);
  }
  // Layered front grille and projector-style lamps make the front fascia read as a finished car.
  cube(g,0,.78,-2.285,.78,.23,.04,M.trim,false);
  for(let grille=0;grille<9;grille++)cube(g,-.34+grille*.085,.78,-2.312,.018,.18,.022,M.silver,false);
  for(const sx of [-1,1]){
    const projector=new THREE.Mesh(new THREE.SphereGeometry(.095,16,10),M.headlight);
    projector.position.set(sx*.72,.84,-2.29);projector.scale.set(1,.68,.25);g.add(projector);
    const tailLens=new THREE.Mesh(new THREE.BoxGeometry(.28,.13,.06),M.tailLight);
    tailLens.position.set(sx*.73,.85,2.27);g.add(tailLens);
    for(const axle of [-1,1]){
      const sidewallDetail=new THREE.Mesh(new THREE.TorusGeometry(.315,.009,5,28),new THREE.MeshStandardMaterial({color:0x303537,roughness:.96}));
      sidewallDetail.rotation.y=Math.PI/2;sidewallDetail.position.set(sx*1.215,.4,axle*1.38);g.add(sidewallDetail);
      for(let tread=0;tread<10;tread++){
        const angle=tread*Math.PI/5;
        const groove=new THREE.Mesh(new THREE.BoxGeometry(.018,.075,.018),new THREE.MeshStandardMaterial({color:0x393d3e,roughness:.98}));
        groove.position.set(sx*1.218,.4+Math.sin(angle)*.335,axle*1.38+Math.cos(angle)*.335);
        groove.rotation.x=angle;g.add(groove);
      }
    }
  }
  // Windshield wipers and mirror glass add close-up cues in first-person view.
  for(const sx of [-1,1]){
    const wiper=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.63,6),M.trim);
    wiper.position.set(sx*.34,1.12,-1.18);wiper.rotation.z=Math.PI/2-.2;g.add(wiper);
  }
  cube(g,0,1.79,-.25,1.48,.08,2.08,M.trim,false);
  g.userData.wheels=wheelRigs;
  g.userData.plates=2;g.userData.doorHandles=4;
  g.userData.wheelSpokes=wheelSpokeCount;g.userData.wheelArches=4;
  return g;
}
const playerCar=car(0x315e83,true);playerCar.position.set(-7,0,-14);playerCar.rotation.y=Math.PI;world.add(playerCar);
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
const avatar=person(M.blue,23);world.add(avatar);
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
  $('mode').textContent=(inCar?'DRIVING · ':'')+(firstPerson?'FIRST':'THIRD')+' PERSON';
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
  sun.intensity=(.18+daylight*2.12)*weatherDim;ambientLight.intensity=(.72+daylight*.86)*(weatherMode==='fog'?.9:1);
  scene.environmentIntensity=.18+daylight*.52;
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
      player:{x:player.x,z:player.z},car:{x:playerCar.position.x,z:playerCar.position.z,heading:playerCar.rotation.y,wheelRotations:(playerCar.userData.wheels||[]).map(w=>w.rotation.x),details:{plates:playerCar.userData.plates,doorHandles:playerCar.userData.doorHandles,wheelSpokes:playerCar.userData.wheelSpokes,wheelArches:playerCar.userData.wheelArches}},
      streetSigns:streetSigns.length,
      visualDetails:{...visualDetailCounts},
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
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(renderPixelRatio());
});
$('loading').textContent='Neighborhood ready';
document.documentElement.dataset.visualVersion='v3.1-model-textures';
