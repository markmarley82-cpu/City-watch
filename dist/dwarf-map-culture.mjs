/* Quill dwarf brief v1, Library libfile_110012ad6dc08191898435616e27ca4e.
   Original map interpretation. No new canonical parcels, actors or route authority. */
export const DWARF_MAP_CULTURE=Object.freeze({
 watch:[['Belonging in the Watch','Dwarfs serve the city as individuals. Carrot is human and dwarfish by adoption; Cheery’s beard and female identity belong together. Clothing does not determine someone’s gender.']],
 outpost:[['Officers, not a single mould','A dwarf officer can bring craft knowledge, family ties or mountain memories to city work. None of these decides their temperament or loyalties.']],
 'scenic:dimwell-cobbler':[['Craft and city life','A trade is a life, not merely a way to pass time above ground. Tools, repair work and letters home connect city households with communities elsewhere. This workshop is an unnamed city craft location.']],
 warehouse:[['Roads between homes','Trade carries raw materials towards cities and manufactured goods towards the mountains. Travellers can make lives at both ends.']],
 store:[['Goods and memories','A shipment can carry specialist tools, household goods or a letter home. Dwarfish city life reaches beyond mines and precious metals.']],
 books:[['Stories written in stone','Written words carry great weight in dwarfish tradition. Copies, damaged pages and older versions deserve examination before anyone claims the last word.'],['Remembering Koom Valley','Later discoveries challenged the familiar story of Koom Valley and opened a path towards peace. People do not all change inherited memories at the same speed.']],
 archives:[['Interpreting the lore','Loremasters disagree about inherited words and a changing world. A hood or robe cannot tell you which argument its wearer will make.'],['The Low King','The Low King belongs to a tradition of mining communities, precedent and disputes. The seat lies beyond Ankh-Morpork; it is not a new city palace.'],['The Scone of Stone','The coronation relic is distinct from a replica. Its place in a shared history matters beyond its material value.']],
 'guild-bakers':[['Bread worth remembering','Dwarf bread can be a treasured tradition and an alarming object. Not every loaf is a weapon, and this guild is not the Dwarf Bread Museum.']],
 bakery:[['Bread and heritage','Dwarf bread belongs to a particular food and cultural tradition. An ordinary city bakery need not specialise in it.']],
 drum:[['Taking the other side','Thud places dwarfs and trolls on opposing sides of a board. Exchanging sides invites another view of the same struggle. This is cultural context, not a newly installed playable board.']],
 default:[['Dwarfish city life','Dwarfs make varied lives in a mixed city: officers, craft workers, traders, readers and neighbours. Work, family and inherited stories can matter without making everyone alike.'],['Home and independence','City families can preserve traditions, question them or live differently from relatives elsewhere. Belonging does not require one costume, profession or opinion.']]
});
export function mountDwarfMapCulture(container,getDestination){
 if(!container)return ()=>{};
 const panel=document.createElement('details');panel.className='dwarf-map-culture';
 const heading=document.createElement('summary');heading.textContent='Dwarfish city life';panel.append(heading);
 const body=document.createElement('div');panel.append(body);container.append(panel);
 function refresh(){body.replaceChildren();const id=getDestination();for(const[title,text]of DWARF_MAP_CULTURE[id]||DWARF_MAP_CULTURE.default){const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=text;body.append(h,p);}const note=document.createElement('p');note.className='hint';note.textContent='Cultural reading for this part of the city; these notes do not identify the residents of individual houses.';body.append(note);}
 refresh();return refresh;
}
