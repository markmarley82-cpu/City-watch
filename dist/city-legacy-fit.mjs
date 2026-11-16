/* Temporary legacy representation repair. No replacement art, parcels or navigation.
 * Ten retained source paintings are sampled directly: no per-parcel bitmap allocation. */
import {registerHouse} from './city-quarter.mjs?v=p21-b407-s039-reuse';
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export const LEGACY_CONTROLS=Object.freeze({
 dolly_building_terracotta_timber_house:{size:[380,373],contacts:[[84,303],[171,350],[315,298]],doorSourceHeight:78},
 dolly_building_blue_slate_tenement:{size:[319,387],contacts:[[52,309],[133,359],[297,305]],doorSourceHeight:84},
 dolly_building_bread_and_buns_bakery:{size:[329,371],contacts:[[38,302],[170,346],[298,305]],doorSourceHeight:65},
 dolly_building_striped_awning_corner_shop:{size:[361,359],contacts:[[62,291],[167,333],[307,292]],doorSourceHeight:68},
 dolly_building_timber_fronted_tavern:{size:[345,374],contacts:[[45,294],[202,337],[318,302]],doorSourceHeight:66},
 dolly_building_brick_washing_line_house:{size:[339,382],contacts:[[55,310],[162,348],[309,304]],doorSourceHeight:76},
 dolly_building_balcony_gabled_cottage:{size:[323,378],contacts:[[35,302],[174,350],[289,309]],doorSourceHeight:69},
 dolly_building_flower_shop:{size:[312,382],contacts:[[33,316],[144,351],[282,305]],doorSourceHeight:68},
 dolly_building_stone_guildhouse:{size:[353,380],contacts:[[43,310],[190,354],[319,309]],doorSourceHeight:73},
 dolly_building_weathered_end_house:{size:[295,365],contacts:[[24,304],[120,340],[268,298]],doorSourceHeight:71}
});
export function fitLegacyBuilding({id,im,meta,rect,alpha,fallback=null}){
 // This inherited parcel overlaps E045's saved walk cell38,211. Retain its old fit.
 if(rect.every((v,i)=>Math.abs(v-[36.61000000000001,211.049,2.636,3.151][i])<1e-7)){if(!fallback){const p=[rect[0]+rect[2]-1,rect[1]+rect[3]-1],q=project(p),scale=Math.min(1.3,(rect[2]+rect[3])*28/(im.width-20));fallback={id,im,p,rect,alpha,scale,anchor:meta.anchor_px,sourceAsset:'legacy:'+meta.id,bounds:[q.x-meta.anchor_px[0]*scale,q.y-meta.anchor_px[1]*scale,im.width*scale,im.height*scale]};}return{...fallback,legacyFitHold:'Inherited parcel overlaps saved public cell38,211; original representation retained'};}
 const c=LEGACY_CONTROLS[meta.id];if(!c||im.width!==c.size[0]||im.height!==c.size[1])throw Error('Unreviewed legacy building dimensions: '+meta.id);
 const [x,y,w,h]=rect,p=[x,y],origin=project(p),r=registerHouse({...c,doorHeight:65},w,h),near=project([w-.5,h-.5]),bounds=[origin.x-r.anchor[0],origin.y-r.anchor[1],r.width,r.height];
 const paint=g=>{for(const m of r.maps){g.save();g.transform(m.a,m.b,0,m.v,m.c+origin.x,m.f+origin.y);g.beginPath();g.rect(m.start,0,m.end-m.start,im.height);g.clip();g.drawImage(im,0,0);g.restore();}};
 const sampleAlpha=q=>{const xx=q.x-origin.x,yy=q.y-origin.y,m=r.maps[xx<near.x?0:1],uf=(xx-m.c)/m.a,u=Math.floor(uf),v=Math.floor((yy-m.b*uf-m.f)/m.v);return u>=m.start&&u<m.end&&v>=0&&v<im.height?(alpha.sample?alpha.sample(u,v):alpha[(v*im.width+u)*4+3]/255):0;};
 return{id,im,p,rect,alpha,anchor:r.anchor,scale:1,bounds,sourceAsset:'legacy:'+meta.id,doorHeight:65,legacyFitted:true,paint,sampleAlpha,registration:r,lightTransform:{maps:r.maps,anchor:r.anchor}};
}
