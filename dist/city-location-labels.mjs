// Player-facing names for the current admitted city graph. Source edge names
// remain untouched for geometry, saves, routing and engineering evidence.
export const STREET_LOCATION_LABELS=Object.freeze({
 E001:'New Bridge',E002:'Brass Bridge',E003:'Contract Bridge',E004:"Pon’s Bridge",E005:'Body Street crossing',E006:'Salis Street swingbridge',E007:'Misbegot Bridge',
 E008:'Upper Broad Way',E009:'Upper Broad Way',E010:'Palace approach',E011:'Lower Broad Way',E012:'Lower Broad Way',
 E013:'Pseudopolis Yard',E014:'Pseudopolis Yard',E015:'Pseudopolis Yard',E016:'Pseudopolis Yard',E017:'Pseudopolis Yard',E018:'Pseudopolis Yard',E019:'Pseudopolis Yard',E020:'Pseudopolis Yard',
 E021:'Salis Street',E022:'Salis Street',E023:'Park Lane',E024:'Park Lane / Edgeway Road',E025:'Rimwards Gate approach',E026:'Holofernes Street',E027:'Holofernes Street',E028:'University approach',
 E029:'Brewer Street',E030:'Brewer Street',E031:'Cheapside',E032:'Quilldaisy Stairs',E033:'Quilldaisy Stairs',E034:'Sheer Street',E035:'The Shades',E036:'Polestaff Lane',E037:"Don’t Look Back Street",E038:'Body Street',E039:'Body Street',
 E040:'Hide Park approach',E041:'Park Lane',E042:'Dimwell streets',E043:'Wharfinger Street',E044:'Wharfinger Street',E045:'Treacle Mine Road approach',E046:'Morpork docks',E048:'The Shades',
 E050:'Filigree Street',E051:'Filigree Street',E052:'Short Street',E053:'Street of Small Gods',E054:'Plaza of Broken Moons',E055:'Street of Bookkeepers',E056:'Street of Cunning Artificers',E057:'Three Lamps Alley',E058:'Short Street',
 E061:'University approach',E062:'Palace district',E063:'Filigree Street',E064:'The Shades','P015-03':'Broken Moons civic stair','P015-05':'Hide Park perimeter footpath'
});

// These are existing public atlas destinations, not additional place claims.
// Resolve the actual foot position so a northern arrival does not announce
// the far southern junction. Callers without a position keep their old labels.
const E045_APPROACHES=Object.freeze([
 [[34,197],'Misbegot Bridge landing'],
 [[52,225],'Treacle Mine Road junction'],
 [[32,215],'Russet house approach'],
 [[38,211],'Stone house approach']
]);

export function cityLocationLabel(edge,doors,position){
 if(!edge)return 'Ankh-Morpork';
 if(edge.id==='RC1')return 'Pseudopolis Yard · Watch Square';
 if(edge.id==='PALACE:PUBLIC')return 'Patrician’s Palace forecourt';
 if(edge.id==='E045'&&Array.isArray(position)&&Number.isFinite(position[0])&&Number.isFinite(position[1])){
  const local=E045_APPROACHES.find(([p])=>Math.hypot(position[0]-p[0],position[1]-p[1])<=2);
  return local?.[1]||'Misbegot–Treacle Mine Road approach';
 }
 if(edge.id.startsWith('APRON:')){
  const door=doors?.get(edge.id.slice(6));
  if(door?.name)return door.name;
 }
 return STREET_LOCATION_LABELS[edge.id]||edge.name||'Ankh-Morpork';
}
