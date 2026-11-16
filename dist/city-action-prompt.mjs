/* Screen placement only: retain the existing action, eligibility and callback. */
export function actionPromptLayout({label,player,playerHeight=60,npc,actors=[],door,workshop,project,width,height,camera,zoom}){
 if(!label||label==='Walk to Watch')return null;
 let p=player,lift=58;
 if(/^Talk to /.test(label)){const person=actors.find(a=>'Talk to '+a.name===label);p=person?.p||npc||player;}
 // At a threshold the player and action anchor coincide. Keep the bottom of
 // the button above the full recruit, rather than across their torso.
 else if(door&&(/^(Enter|Examine) /.test(label))){p=door.position;lift=playerHeight+12;}
 else if(/^Inspect cobbler workshop/.test(label)&&workshop){p=workshop;lift=playerHeight+12;}
 const q=project(p),rawX=width/2+(q.x-camera.x)*zoom,rawY=height/2+(q.y-camera.y)*zoom-lift*zoom;
 return {x:Math.round(Math.max(64,Math.min(width-64,rawX))),y:Math.round(Math.max(132,Math.min(height-76,rawY))),target:p.slice(),kind:/^Talk to /.test(label)?'person':/^(Enter|Examine|Inspect) /.test(label)?'premise':'nearby'};
}
export function placeActionPrompt(button,input){
 const layout=actionPromptLayout(input);button.hidden=!layout;if(!layout||!button.style)return layout;
 for(const [key,value]of [['--cw-action-x',layout.x+'px'],['--cw-action-y',layout.y+'px']])if(button.style.getPropertyValue(key)!==value)button.style.setProperty(key,value);
 return layout;
}
