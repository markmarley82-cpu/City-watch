import {activateS569Contact} from './city-e045-s569-contact.mjs?v=p21-b407-s039-reuse';
// Original layered house fitted to the released E045 plot; exterior contact only.
export async function createS569Layered({load, createCanvas, addSprites, lightAnchors, bindRoofHidden = false}) {
  const names = ['body-west.png', 'body-returns.png', 'west-door-contact.png', 'threshold-ground-join.png', 'roof-foreground.png'];
  const parts = await Promise.all(names.map(load));
  const emission = await load('night-emission.png');
  for (const image of [...parts, emission]) if (image.width !== 330 || image.height !== 330) throw Error('S569 layer registration changed');
  const compose = images => {
    const canvas = createCanvas(); canvas.width = canvas.height = 330;
    const ctx = canvas.getContext('2d');
    for (const image of images) ctx.drawImage(image, 0, 0);
    return canvas;
  };
  const full = compose(parts), hidden = compose(parts.slice(0, -1));
  const id = 'E045-S569-WEST';
  // Keep the authored source emission. Land its pool on the west-side
  // public flags at the existing exterior stance [56,207], rather than
  // the unowned sliver at the foot of the painted foundation.
  lightAnchors[id] = [[161, 145, 128.812, 279.006]];
  const [object] = addSprites([[id, full, [56.571, 206.8], [150.4, 284.2], 1,
    [57.071, 205.1, 1.509, 3.245], {sceneryKind: 'building', sourceAsset: id, nightEmission: emission}]]);
  // Keep this binding off until the night path passes outside-window parity.
  if (bindRoofHidden) object.roofHidden = {...object, im: hidden};
  object.actorFootCutaway = Object.freeze({width: 48, centerHeight: .25, heightFactor: 1.15, groundOnly: true});
  return Object.freeze({object, full, hidden, layers: names, ingress: false, replacesLegacy: false, activateContact: activateS569Contact});
}
