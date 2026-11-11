// CC0 model sources used by V4.6. Embedded GLB files are hosted by Innerscene.
export const V46_MODEL_ASSET_URLS=Object.freeze({
  pedestrian:'https://files.innerscene.com/library/crossing-step-3d-person-walking-4235c1bb/c469a266f2d61a7ff749/walking-cross-step.glb',
  vehicle:'https://files.innerscene.com/library/sedan-car-42109739/75c64c1b3c8b03734314/sedan-original.glb'
});
export async function loadModelAssets(){
  const {GLTFLoader}=await import('https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/loaders/GLTFLoader.js');
  const loader=new GLTFLoader();
  const [pedestrian,vehicle]=await Promise.allSettled([
    loader.loadAsync(V46_MODEL_ASSET_URLS.pedestrian),
    loader.loadAsync(V46_MODEL_ASSET_URLS.vehicle)
  ]);
  return {
    pedestrian:pedestrian.status==='fulfilled'?pedestrian.value:null,
    vehicle:vehicle.status==='fulfilled'?vehicle.value:null,
    errors:{
      pedestrian:pedestrian.status==='rejected'?String(pedestrian.reason):null,
      vehicle:vehicle.status==='rejected'?String(vehicle.reason):null
    }
  };
}
