import {bridgeDeckContains} from './city-bridge-contact.mjs?v=p21-b407-s039-reuse';
import {GroundPainter} from './city-ground.mjs?v=p21-b407-s039-reuse';

export const BRIDGE_LOCAL_CUTAWAY_TRANSMISSION=0.55;

export function bridgeLocalCutawayEligible(object) {
  return object?.edge==='E007'&&object?.bridgePart==='front';
}

// The Misbegot frontage paintings are registered separately from its parapets.
export function bridgeHouseCutawayEligible(object){
 return object?.edge==='E007'&&object?.bridgePart==='front'&&object.sourceLayers?.some(layer=>/misbegot_house_[A-P]_RGBA\.webp$/.test(layer))===true;
}

export function bridgeLocalCutawayMask(point,height,count=1) {
  const n=Math.max(1,Math.floor(count));
  return {
    x:point.x,
    y:point.y-height*.59,
    rx:22,
    ry:Math.max(25,height*.48),
    opacity:1-Math.pow(BRIDGE_LOCAL_CUTAWAY_TRANSMISSION,1/n)
  };
}

export function bridgeLocalCutawayContains(mask,point) {
  const dx=(point.x-mask.x)/mask.rx,dy=(point.y-mask.y)/mask.ry;
  return dx*dx+dy*dy<=1;
}

export function bridgeActorInFront(p,o) {
  const anchor=o.bridgeAnchor||o.p;
  if(bridgeDeckContains(p,o)) return o.bridgePart==='back';
  return p[0]>anchor[0]+o.width/2||p[1]>anchor[1]+o.length;
}

export class BridgePainter extends GroundPainter {
  constructor(manifest, options={}) {
    super(manifest,{baseURL:'assets/river-bridges-v1/',maxDecoded:32,concurrency:2,...options});
    this.bridges=manifest.bridges;
    this.renderObjects=new WeakMap();
  }
  objects(pixels) {
    return this.visible.flatMap(record=>{
      const entry=this.entries.get(this.cacheKey(record));
      if(entry?.state!=='ready')return [];
      // Streaming another layer must not invalidate the lighting of a layer
      // whose decoded image and placement are unchanged.
      let records=this.renderObjects.get(entry.image);
      if(!records)this.renderObjects.set(entry.image,records=new Map());
      const cached=records.get(record);
      if(cached?.resolution===this.resolution)return [cached.object];
      const object={...record,im:entry.image,anchor:record.native_anchor_px.map(x=>x*this.resolution),
        scale:1/this.resolution,alpha:pixels(entry.image),
        bounds:[record.screen_box[0],record.screen_box[1],...record.dimensions],
        bridgeLocalCutaway:bridgeLocalCutawayEligible(record),
        order:record.bridgePart==='back'?(record.id.includes('rear_')?1:0):(record.id.includes('front_')?4:3)};
      records.set(record,{resolution:this.resolution,object});
      return [object];
    });
  }
  bounds(edge){return this.records.filter(r=>r.edge===edge).map(r=>[r.screen_box[0],r.screen_box[1],...r.dimensions]);}
  report(){return {...super.report(),crossings:this.bridges.map(b=>b.edge),newNavigation:false};}
}
