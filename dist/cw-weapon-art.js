/* Native vector accessories fitted to existing pose/torso registrations.
 * Existing painted body frames are never stretched or replaced. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.CWWeaponArt=api;})(globalThis,function(root){
'use strict';
function sword(g){
 g.fillStyle='#5a3924';g.strokeStyle='#241b16';g.lineWidth=1.2;g.fillRect(-2,-2,4,13);g.strokeRect(-2,-2,4,13);g.fillStyle='#b69a58';g.fillRect(-7,-4,14,3);g.fillRect(-3,10,6,3);
 g.beginPath();g.moveTo(-3,-5);g.lineTo(-2,-35);g.lineTo(0,-43);g.lineTo(3,-35);g.lineTo(3,-5);g.closePath();g.fillStyle='#b9c0ba';g.fill();g.stroke();g.strokeStyle='#e4e0ca';g.lineWidth=.8;g.beginPath();g.moveTo(0,-7);g.lineTo(0,-36);g.stroke();
}
function crossbow(g,loaded=false){
 g.strokeStyle='#231b15';g.lineWidth=6;g.beginPath();g.moveTo(8,11);g.lineTo(-20,-10);g.stroke();g.strokeStyle='#805c38';g.lineWidth=3.5;g.stroke();
 g.strokeStyle='#3e443d';g.lineWidth=3;g.beginPath();g.moveTo(-28,5);g.quadraticCurveTo(-5,-23,-1,-23);g.stroke();g.strokeStyle='#c3bba0';g.lineWidth=.8;g.beginPath();g.moveTo(-28,5);g.lineTo(-9,-1);g.lineTo(-1,-23);g.stroke();
 g.fillStyle='#aa925e';g.fillRect(-11,-4,4,4);if(loaded){g.strokeStyle='#c7b384';g.lineWidth=1;g.beginPath();g.moveTo(-5,2);g.lineTo(-25,-14);g.stroke();}
}
function icon(g,id,x,y,size=1){g.save();g.translate(x,y);g.scale(size,size);if(id==='service-sword')sword(g);else if(id==='service-crossbow')crossbow(g,true);else{g.rotate(-.6);g.fillStyle=id==='balanced-truncheon'?'#61432d':'#836140';g.strokeStyle='#33241a';g.lineWidth=1.5;g.fillRect(-3,-31,6,42);g.strokeRect(-3,-31,6,42);g.fillStyle='#baa069';g.fillRect(-3,2,6,2);}g.restore();}
function draw(g,meta,pose,x,y,height,id){
 if(!['service-sword','service-crossbow'].includes(id)||['down','surrender','restrain','shove'].includes(pose.clip))return false;
 const D=root.CWDrawnCharacters,m=D?.current?.entries?.[meta.id];if(!m)return false;
 const f=D.frame(m,pose),E=root.CWFittedEquipment?.current,rig=E?.manifest.rigs[E.canonical(meta.id)],torso=rig?.variants?.base?.poses?.[f?.index];
 if(!f||!torso)return false;
 const s=height/m.visibleHeight,attack=pose.clip==='attack',phase=f.frame;
 g.save();g.translate(x,y);if(f.flip)g.scale(-1,1);
 const grip=root.CWWeaponGrips?.[meta.id]?.[f.index],handX=((attack&&grip?grip[0]:torso[0]-m.visibleHeight*.12)-m.footX)*s,handY=((attack&&grip?grip[1]:torso[1]+m.visibleHeight*.15)-m.footY)*s;
 g.translate(handX,handY);g.scale(height/110,height/110);
 if(id==='service-sword'){g.rotate(attack?[1.25,.65,-.35,-1.1,-.5,.6][phase]:-.45);g.translate(0,-5);sword(g);}
 else{g.rotate(attack?[-.08,-.04,0,.05,.02,0][phase]:-.25);crossbow(g,pose.loaded);}
 g.restore();return true;
}
return {draw,icon};
});
