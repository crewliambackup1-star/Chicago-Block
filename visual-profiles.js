// V4.8 character and vehicle surface profiles. Kept pure so the visual
// classification and player locomotion selection can be verified without WebGL.
const HUMAN_COLOR_VARIATION=Object.freeze([0.94,1.04,0.98,1.08,0.90]);

export function getHumanAnimationState(moving,sprinting=false){
  if(!moving)return 'idle';
  return sprinting?'run':'walk';
}

export function getHumanSurfaceProfile(meshName='',materialName='',appearance=0){
  const tag=(String(meshName)+' '+String(materialName)).toLowerCase();
  if(/hair|beard|eyebrow|brow/.test(tag)){
    return {kind:'hair',roughness:0.74,metalness:0,envMapIntensity:0.68};
  }
  if(/skin|face|flesh|body|hand|finger|ear|nose|lip|neck/.test(tag)){
    return {kind:'skin',roughness:0.66,metalness:0,envMapIntensity:0.82,sheen:0.10,sheenRoughness:0.82};
  }
  if(/shirt|trouser|jacket|coat|fabric|cloth|clothing|jean|sweater|top|hoodie|sleeve/.test(tag)){
    return {
      kind:'fabric',roughness:0.88,metalness:0,envMapIntensity:0.62,
      sheen:0.14,sheenRoughness:0.9,colorMultiplier:HUMAN_COLOR_VARIATION[Math.abs(Number(appearance)||0)%HUMAN_COLOR_VARIATION.length]
    };
  }
  if(/shoe|boot|sneaker|sole/.test(tag)){
    return {kind:'footwear',roughness:0.72,metalness:0.02,envMapIntensity:0.72};
  }
  return {kind:'surface',roughness:0.78,metalness:0,envMapIntensity:0.72};
}

export function getVehicleSurfaceProfile(meshName='',materialName=''){
  const tag=(String(meshName)+' '+String(materialName)).toLowerCase();
  if(/glass|window|windscreen|windshield/.test(tag)){
    return {kind:'glass',roughness:0.14,metalness:0.08,envMapIntensity:1.28,clearcoat:0.52,clearcoatRoughness:0.12};
  }
  if(/tire|tyre|rubber/.test(tag)){
    return {kind:'rubber',roughness:0.92,metalness:0.015,envMapIntensity:0.38};
  }
  if(/wheel/.test(tag)){
    return {kind:'wheel',roughness:0.66,metalness:0.28,envMapIntensity:0.9};
  }
  if(/lamp|light|headlight|taillight|indicator/.test(tag)){
    return {kind:'lamp',roughness:0.28,metalness:0.16,envMapIntensity:1.1};
  }
  if(/chrome|metal|trim|grille|rim|hubcap/.test(tag)){
    return {kind:'trim',roughness:0.26,metalness:0.82,envMapIntensity:1.18};
  }
  if(/seat|interior|dashboard|carpet|upholstery/.test(tag)){
    return {kind:'interior',roughness:0.82,metalness:0.025,envMapIntensity:0.58};
  }
  return {kind:'body',roughness:0.31,metalness:0.58,envMapIntensity:1.34,clearcoat:0.78,clearcoatRoughness:0.2};
}
