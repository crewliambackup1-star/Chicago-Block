import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const assets=[
  {
    name:'human-locomotion.glb',
    url:'https://files.innerscene.com/library/locomotion-collection-maya-3d-person-animated-1499b2fd/565cfb8a45b8a67a79c4/locomotion-collection-maya-3d-person-animated.glb',
    minBytes:1_000_000
  },
  {
    name:'sedan-exterior.glb',
    url:'https://files.innerscene.com/library/sedan-car-42109739/75c64c1b3c8b03734314/sedan-original.glb',
    minBytes:100_000
  }
];
const destination=resolve(root,'assets/models');
await mkdir(destination,{recursive:true});
for(const asset of assets){
  const response=await fetch(asset.url,{redirect:'follow',headers:{'user-agent':'Chicago-Block V4.6 asset publisher'}});
  if(!response.ok)throw new Error(`Could not download ${asset.name}: HTTP ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<asset.minBytes)throw new Error(`Downloaded ${asset.name} is unexpectedly small (${bytes.length} bytes)`);
  if(bytes.subarray(0,4).toString('ascii')!=='glTF')throw new Error(`Downloaded ${asset.name} is not a binary glTF file`);
  if(bytes.readUInt32LE(4)!==2)throw new Error(`Downloaded ${asset.name} is not glTF 2.0`);
  const path=resolve(destination,asset.name);
  await writeFile(path,bytes);
  const info=await stat(path);
  process.stdout.write(`Verified ${asset.name}: ${info.size.toLocaleString()} bytes\n`);
}
