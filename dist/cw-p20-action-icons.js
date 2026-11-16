/* Jimmy ICON-STUDY v0.1: captioned existing controls; no callbacks replaced. */
(function(){'use strict';
const specs=[['interact','interact','Talk / Use'],['map','atlas',null],['p13-menu-launch','more','More'],['cw-ux108b-notebook','notebook','Open Watch notebook']];
const style=document.createElement('style');style.textContent=`
#app .top{height:auto!important;min-height:42px!important}
#app .actions .p20-captioned{display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:44px;min-height:54px;padding:5px 3px!important;font-size:1em!important;line-height:1.15!important;white-space:normal;overflow-wrap:anywhere;text-align:center}
#app .actions .p20-captioned::before{content:'';display:block;width:24px;height:24px;flex:none;background:center/contain no-repeat var(--p20-action-icon)}
#app.i1-inside #map.p20-captioned::before{background-image:url('assets/p20-base-03/action-icons/concept-room-plan.svg')}
`;document.head.appendChild(style);
for(const [id,icon,aria]of specs){const el=document.getElementById(id);if(!el)continue;el.classList.add('p20-captioned');el.style.setProperty('--p20-action-icon',`url("assets/p20-base-03/action-icons/concept-${icon}.svg")`);if(aria)el.setAttribute('aria-label',aria);}
window.CW_P20_ACTIONS={version:'P20-ACTION-CAPTIONS-01',report(){return specs.map(([id])=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return{id,label:e.textContent,width:r.width,height:r.height,icon:getComputedStyle(e,'::before').backgroundImage,originalControl:true};});}};
})();
