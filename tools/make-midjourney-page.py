# Builds the Midjourney prompt page twice: dist/mj/index.html (on the game site) and an
# Artifact copy with the shape drawings embedded. Image links in the prompts point at the
# public repository's raw files, which Midjourney can fetch even when Pages is down.
#   python3 tools/make-midjourney-page.py <artifact output path>
import base64, html, sys
RAW = 'https://raw.githubusercontent.com/markmarley82-cpu/City-watch/main/dist/mj/img/'
u = lambda n: RAW + n + '.jpg'
SREF_EXT = f"--sref {u('style-exterior-1-mended-drum')} {u('style-exterior-2-archives')}"
SREF_INT = f"--sref {u('style-interior-1-bakers')} {u('style-interior-2-butchers')}"
RETEX_END = ("hand-painted isometric game building, same shape, same angle and same door and window positions as the input, "
             "detailed weathered materials, warm lit windows, soft daylight from the upper left, plain flat grey background #808080, "
             "no ground, no people, no text --v 7 --sw 300 " + SREF_EXT)
A = [('bakery', 'Bakery', 'a small corner bakery: weathered red brick with cream lime plaster patches, a steep clay-tile roof with a big brick chimney, a striped canvas awning over the wide shop window full of loaves, a loaf-shaped hanging sign, a half-glazed shop door with two stone steps, flower boxes'),
     ('shrine', 'Wayside Shrine', 'a tiny stone shrine to a minor god: pale weathered stone, a steep copper roof gone green, a stone finial, an arched oak door with a carved stone surround, a candle-lit offering niche, ivy and moss'),
     ('alley', 'Crooked Alley House', 'a tall narrow four-storey town house: timber framing over soot-dark brick, small leaded windows with warm light, a steep slate roof with a twisted brick chimney, a lantern by the front door, washing hanging from an upper window'),
     ('outpost', 'Watch Outpost', 'a City Watch outpost: a stone watch tower with a slate cap behind a two-storey timber-framed guard room with a clay-tile roof, heavy studded doors with lanterns, a painted Watch shield with a lantern emblem above the door, a notice board')]
INT_END = ("isometric cutaway interior of one room, 2:1 isometric game diorama exactly like the reference, front walls removed and shown only as a low cut stone sill, "
           "back-left and back-right walls standing with windows and beams, the entrance doorway in the front-right wall at the lower right of the image, the room filling the frame, "
           "a wide clear walkable floor through the middle of the room with furniture against the walls, every object sized for people about 1.75 m tall, "
           "warm painterly hand-painted texture, soft light from the windows, solid pure black background outside the room, no people, no text "
           "--ar 3:2 --v 7 --style raw --iw 1 --sw 300 --no people, text, watermark, frame, ceiling, roof, perspective " + SREF_INT)
B = [('Cobbler', "A cobbler's workshop: a low workbench with lasts and hammers, shelves of boots and shoes, hides hanging from a beam, a leather-cutting table, a small counter by the door with a boot-shaped sign, wood-shaving floor."),
     ('Pawnbroker', "A cramped pawnbroker's shop: a high counter with a brass grille, shelves crammed with clocks, instruments, candlesticks and odd bundles with paper tags, a locked glass cabinet, three brass balls hanging inside the window, a safe in the corner."),
     ('Curry house', "A small curry house: a kitchen at the back with big copper pots on a brick range and a hood flue, spice jars and sacks, four plain tables with benches in the front room, a serving hatch, lanterns, a bowl painted on the window."),
     ('Lodging house', "A cheap lodging house's common room: a row of narrow iron beds and straw mattresses along the walls, a stove with a kettle, a rough table with a candle, a coat rack, a ledger desk by the door for the landlord."),
     ('Bonded warehouse', "A bonded dock warehouse: stacked crates, barrels and wrapped bales marked with numbers, a hoist and chain from a beam, a clerk's high desk with ledgers and a lamp, a weighing scale, wide double doors."),
     ('Rope-maker', "A rope-maker's shed: coils of rope and hemp bundles, a long rope-walk bench with a twisting wheel and hooks along one wall, tar buckets, a workbench with knives and fids."),
     ('Ship chandler', "A ship chandler's shop: shelves of lanterns, blocks and pulleys, coils of line, oilskins, tins and barrels of supplies, an anchor by the counter, nautical charts pinned up, a counter with a till."),
     ('Quay lodging', "A sailors' quay lodging: hammocks slung from the beams and a few bunks, sea chests, a stove, a long table with tankards, oilskins on pegs, a small bar counter by the door."),
     ('Smithy', "A blacksmith's forge: a glowing coal forge with bellows and a hood, an anvil on a stump, a quenching trough, tongs and hammers on racks, horseshoes and ironwork on the walls, a grindstone."),
     ('Cooper', "A cooper's workshop: barrels in every stage of making, staves stacked and steaming, iron hoops on pegs, a shaving horse, a fire basket for bending staves, adzes and drawknives on the wall."),
     ('Butcher', "A butcher's shop: a marble counter, hooks with hanging joints and sausages along a rail, a heavy chopping block with cleavers, sawdust on the floor, a scale, a cold room door at the back."),
     ('Apothecary', "An apothecary: a wall of small labelled drawers, shelves of glass jars and bottles, a pestle and mortar on the counter, bundles of drying herbs from the beams, a brass balance, a small brewing table with a burner."),
     ('Cooper workshop (yours)', "A big cooper's yard workshop: barrels in every stage of making, big tuns and casks, staves stacked and steaming, iron hoops on pegs, a crane for lifting casks, a loft ladder.")]

def page(embed):
    n = 0
    def prompt(text):
        nonlocal n; n += 1
        return f'<div class="prompt"><pre id="p{n}">{html.escape(text)}</pre><button type="button" data-copy="p{n}">Copy prompt</button></div>'
    def img(key):
        src = 'data:image/jpeg;base64,' + base64.b64encode(open(f'dist/mj/img/blockout-{key}.jpg', 'rb').read()).decode() if embed else f'img/blockout-{key}.jpg'
        return f'<img src="{src}" alt="Shape drawing for Midjourney Retexture" width="512" height="512"><p class="small"><a href="{u("blockout-" + key)}" target="_blank" rel="noopener">Open full size</a> to save it, then press and hold the picture and choose Save.</p>'
    a = ''.join(f'<section class="card"><h3><span class="tag">A</span>{html.escape(t)}</h3><ol><li>Save this shape drawing, then in Midjourney go to <b>Edit → Upload image → Retexture</b>.</li><li>Paste the prompt. The style pictures are already linked inside it.</li></ol>{img(k)}{prompt(d + ", " + RETEX_END)}</section>' for k, t, d in A)
    b = ''.join(f'<section class="card"><h3><span class="tag">B</span>{html.escape(t)}</h3><p class="small">Normal <b>Imagine</b>. Nothing to upload.</p>{prompt(u("guide-interior") + " " + u("style-interior-1-bakers") + " " + d + " " + INT_END)}</section>' for t, d in B)
    return f'''<title>City Watch Midjourney Prompts</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One column of prompt cards: each shows what to upload (if anything) and a copy button. */
:root{{--bg:#efe9df;--card:#fbf8f2;--ink:#2a2017;--muted:#6e5f4f;--line:#d8cbb6;--code:#e9e1d3;--accent:#7a3f16;--ok:#2f6b3a;--display:"Alegreya SC",Georgia,serif;--body:"Alegreya Sans",system-ui,sans-serif;--mono:ui-monospace,Menlo,Consolas,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#17130f;--card:#211b15;--ink:#eee3d2;--muted:#b5a48e;--line:#3a3027;--code:#2c241c;--accent:#e0a062;--ok:#6fbf7d;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#17130f;--card:#211b15;--ink:#eee3d2;--muted:#b5a48e;--line:#3a3027;--code:#2c241c;--accent:#e0a062;--ok:#6fbf7d;color-scheme:dark}}
body{{background:var(--bg);color:var(--ink);font:17px/1.5 var(--body);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:20px 48px}}
main{{max-width:720px;margin:0 auto;display:grid;gap:14px}}
h1{{font:700 1.9rem/1.15 var(--display);margin:0;text-wrap:balance}}h2{{font:700 1.3rem var(--display);margin:22px 0 0;text-wrap:balance}}
h3{{font:700 1.15rem var(--body);margin:0 0 8px;display:flex;gap:8px;align-items:center}}
.tag{{font:700 .75rem var(--mono);letter-spacing:.06em;color:var(--accent);border:1px solid var(--accent);border-radius:4px;padding:1px 6px}}
p{{margin:0}}.small{{color:var(--muted);font-size:.92rem}}ol{{margin:0 0 8px;padding-left:1.2em}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px;display:grid;gap:8px;min-width:0}}
img{{max-width:100%;height:auto;max-height:320px;width:auto;justify-self:center;border-radius:6px;border:1px solid var(--line)}}
.prompt{{display:grid;gap:8px;min-width:0}}
pre{{white-space:pre-wrap;word-break:break-word;background:var(--code);color:var(--ink);padding:10px;border-radius:6px;font:12.5px/1.45 var(--mono);margin:0;max-height:150px;overflow:auto}}
button{{font:700 1rem var(--body);background:var(--accent);color:var(--card);border:0;border-radius:8px;padding:12px;min-height:44px;cursor:pointer}}
button:focus-visible{{outline:3px solid var(--ink);outline-offset:2px}}button.done{{background:var(--ok)}}
a{{color:var(--accent)}}
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya+SC:wght@700&family=Alegreya+Sans:wght@400;700&display=swap">
<main>
<h1>City Watch: Midjourney prompts</h1>
<p class="small">Each prompt already links the reference pictures, so you never upload them. Tap <b>Copy prompt</b>, paste it into Midjourney, make 4, upscale the best, download the PNG and send it to Claude.</p>
<h2>A · The four old buildings</h2>
<p class="small">Uses <b>Retexture</b>: upload only the shape drawing in each card. It fixes the angle and the door size; the prompt brings the style. Too plain? Change <code>--sw 300</code> to 500. Shape changing? Use 200.</p>
{a}
<h2>B · Inside views for the new buildings</h2>
<p class="small">The two links at the start are the room layout and the bakers' room; the links after <code>--sref</code> set the style.</p>
{b}
</main>
<script>
document.addEventListener('click',async e=>{{const b=e.target.closest('button[data-copy]');if(!b)return;const pre=document.getElementById(b.dataset.copy);
try{{await navigator.clipboard.writeText(pre.textContent);b.textContent='Copied';}}catch(_){{const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Selected: tap Copy';}}
b.classList.add('done');setTimeout(()=>{{b.textContent='Copy prompt';b.classList.remove('done');}},2000);}});
</script>'''

site = page(False)
open('dist/mj/index.html', 'w').write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"></head><body>' + site + '</body></html>')
open(sys.argv[1], 'w').write(page(True))
