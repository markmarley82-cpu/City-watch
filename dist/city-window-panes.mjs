// Original Watch painting retained; manually fitted visible glass only, native367x444.
export const WATCH_PANES=[
 {id:'left-dormer',anchor:[77,164],quad:[[72,150],[81,155],[81,178],[72,173]]},
 {id:'right-dormer',anchor:[172,218],quad:[[168,205],[176,209],[176,231],[168,227]]},
 {id:'front-left',anchor:[99,257],quad:[[94,244],[101,248],[101,267],[94,263]]},
 {id:'front-right',anchor:[131,271],quad:[[128,261],[135,265],[135,284],[128,280]]},
 {id:'side-lower',anchor:[281,284],quad:[[278,276],[285,272],[285,292],[278,296]]}
];
export const watchPaneObject=o=>o.id==='watch'&&(o.im.cwSourceWidth||o.im.width)===367&&(o.im.cwSourceHeight||o.im.height)===444;
export function watchPanePoint(o,p){const d=o.im.cwDensity||1;return watchPaneObject(o)&&WATCH_PANES.some(w=>Math.abs(p.x/d-w.anchor[0])<.01&&Math.abs(p.y/d-w.anchor[1])<.01);}
export function cells(w){const q=w.quad,at=(u,v)=>[q[0][0]+(q[1][0]-q[0][0])*u+(q[3][0]-q[0][0])*v,q[0][1]+(q[1][1]-q[0][1])*u+(q[3][1]-q[0][1])*v];return [[0,.42],[.58,1]].flatMap(([u,U])=>[[0,.27],[.39,.62],[.74,1]].map(([v,V])=>[at(u,v),at(U,v),at(U,V),at(u,V)]));}
export function drawWatchPanes(g,o,night){if(!watchPaneObject(o))return;const d=o.im.cwDensity||1;g.save();g.translate(o.bounds[0],o.bounds[1]);g.scale(o.scale*d,o.scale*d);g.globalAlpha=.92*night;for(const w of WATCH_PANES){const ys=w.quad.map(p=>p[1]),f=g.createLinearGradient(0,Math.min(...ys),0,Math.max(...ys));f.addColorStop(0,'#e5aa50');f.addColorStop(1,'#ffe7a1');g.fillStyle=f;g.shadowColor='rgba(255,192,87,.25)';g.shadowBlur=2;for(const q of cells(w)){g.beginPath();q.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}}g.restore();}
