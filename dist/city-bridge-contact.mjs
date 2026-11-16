// Draw depth follows the painted deck, including shared road/bridge landings.
// Navigation edge labels may change while the visible foot remains at one point.
export function bridgeDeckContains(p,bridge){
 const a=bridge.bridgeAnchor||bridge.p||bridge.anchor;
 return Array.isArray(p)&&Array.isArray(a)&&p[1]>=a[1]&&p[1]<=a[1]+bridge.length&&Math.abs(p[0]-a[0])<=bridge.width/2;
}

// Shared road/bridge cells retain the continuous street finish beneath the art.
export function bridgeFallbackCell(ids){
 const labels=[...ids];
 return labels.length>0&&labels.every(id=>/^E00[1-7]$/.test(id));
}

// Local presentation treatment at registered landings, never a new walk area.
export function nearBridgeLanding(p,bridges){
 return bridges.some(b=>Math.abs(p[0]-b.anchor[0])<=b.width/2+2&&Math.min(Math.abs(p[1]-b.anchor[1]),Math.abs(p[1]-b.anchor[1]-b.length))<=2);
}
