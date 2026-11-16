// Native fitted N568 apertures; approved source artwork retained.
export const CITY_PANES_BATCH02={
  "E045-N568-ORIGINAL": {
    "size": [
      330,
      330
    ],
    "source": "dist/assets/e045-n568/full-day.png",
    "sha256": "1b759a72c13113149f39ed68c6df8e95ae4124eaedc4f0761b39b90dea7a17b5",
    "windows": [
      {
        "id": "gable",
        "anchor": [
          127.93,
          138.8025
        ],
        "quad": [
          [
            123.5,
            131
          ],
          [
            132,
            135
          ],
          [
            132,
            146
          ],
          [
            123.5,
            142
          ]
        ]
      },
      {
        "id": "front-upper",
        "anchor": [
          127.485,
          173.735
        ],
        "quad": [
          [
            122,
            162
          ],
          [
            132,
            167
          ],
          [
            132,
            185
          ],
          [
            122,
            180
          ]
        ]
      },
      {
        "id": "return-upper",
        "anchor": [
          206.25,
          149.9275
        ],
        "quad": [
          [
            202.5,
            144
          ],
          [
            209,
            140.5
          ],
          [
            209,
            153.5
          ],
          [
            202.5,
            157
          ]
        ]
      }
    ]
  }
};
import {cells} from './city-window-panes.mjs?v=p21-b407-s039-reuse';
import {watchPanePoint as watchPoint,drawWatchPanes as drawWatch} from './city-window-pane-batch01.mjs?v=p21-b407-s039-reuse';
const entry=o=>{const e=CITY_PANES_BATCH02[o.id];return e&&(o.im.cwSourceWidth||o.im.width)===e.size[0]&&(o.im.cwSourceHeight||o.im.height)===e.size[1]?e:null;};
export function watchPanePoint(o,p){if(watchPoint(o,p))return true;const e=entry(o),d=o.im.cwDensity||1;return !!e&&e.windows.some(w=>Math.abs(p.x/d-w.anchor[0])<.01&&Math.abs(p.y/d-w.anchor[1])<.01);}
export function drawWatchPanes(g,o,night){drawWatch(g,o,night);const e=entry(o);if(!e)return;const d=o.im.cwDensity||1,c=document.createElement('canvas');c.width=o.im.width;c.height=o.im.height;const t=c.getContext('2d');t.scale(d,d);t.globalAlpha=.92*night;for(const w of e.windows){const ys=w.quad.map(p=>p[1]),f=t.createLinearGradient(0,Math.min(...ys),0,Math.max(...ys));f.addColorStop(0,'#e5aa50');f.addColorStop(1,'#ffe7a1');t.fillStyle=f;t.shadowColor='rgba(255,192,87,.25)';t.shadowBlur=2;for(const q of cells(w)){t.beginPath();q.forEach(([x,y],i)=>i?t.lineTo(x,y):t.moveTo(x,y));t.closePath();t.fill();}}t.setTransform(1,0,0,1,0,0);t.globalAlpha=1;t.globalCompositeOperation='destination-in';t.drawImage(o.im,0,0);g.save();g.drawImage(c,o.bounds[0],o.bounds[1],o.im.width*o.scale,o.im.height*o.scale);g.restore();c.width=c.height=1;}
