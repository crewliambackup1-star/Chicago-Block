// V4.6 model assets are copied into the site so normal browsers load them same-origin.
// scripts/download-model-assets.mjs populates these paths during CI and Pages publishing.
const modelRoot=new URL('./assets/models/',import.meta.url);
export const V46_MODEL_ASSET_URLS=Object.freeze({
  pedestrian:new URL('human-locomotion.glb',modelRoot).href,
  vehicle:new URL('sedan-exterior.glb',modelRoot).href
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
