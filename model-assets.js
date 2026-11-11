// CC0 model sources used by V4.6. Embedded GLB files are hosted by Innerscene.
export const V46_MODEL_ASSET_URLS=Object.freeze({
  pedestrian:'https://files.innerscene.com/library/locomotion-collection-maya-3d-person-animated-1499b2fd/565cfb8a45b8a67a79c4/locomotion-collection-maya-3d-person-animated.glb',
  vehicle:'https://files.innerscene.com/library/sedan-car-42109739/75c64c1b3c8b03734314/sedan-original.glb'
});
export async function loadModelAssets(){
  const [{GLTFLoader},{clone:cloneSkinnedModel}]=await Promise.all([
    import('https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/loaders/GLTFLoader.js'),
    import('https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/utils/SkeletonUtils.js')
  ]);
  const loader=new GLTFLoader();
  const [pedestrian,vehicle]=await Promise.allSettled([
    loader.loadAsync(V46_MODEL_ASSET_URLS.pedestrian),
    loader.loadAsync(V46_MODEL_ASSET_URLS.vehicle)
  ]);
  return {
    pedestrian:pedestrian.status==='fulfilled'?pedestrian.value:null,
    vehicle:vehicle.status==='fulfilled'?vehicle.value:null,
    cloneSkinnedModel,
    errors:{
      pedestrian:pedestrian.status==='rejected'?String(pedestrian.reason):null,
      vehicle:vehicle.status==='rejected'?String(vehicle.reason):null
    }
  };
}
