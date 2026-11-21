# Closed-off outer ground (21 November 2026)

Between the built-up city and the city walls there were large stretches of empty, walkable ground.
Mark asked for them to be closed off, with no invisible walls.

## What the game does

- `dist/assets/closed-ground-v1/manifest.json` lists the closed cells (as rows) and the wall pieces.
- `dist/city-closed-ground.mjs` hands the closed cells to the open-ground pass as private areas, so
  nobody can walk there, and draws a low stone wall on every edge between closed and open ground,
  with a post wherever a wall run ends or turns. The pieces come from the ART-107 modular wall
  kit (`dist/assets/art-107-walls/sprites/neutral/`). They are decoration only and don't block
  cells themselves.
- Tapping closed ground says "That ground is walled off".

## How the closed ground was chosen (`tools/make-closed-ground.py`)

- Walkable open ground at least 4 cells from any street centreline or building, including the
  new buildings.
- At least 5 cells from every doorway forecourt, gate, the Palace forecourt, Watch Square, every
  case place and every scripted position in the code, and clear of lamps and trees.
- Squared up to 3 × 3 blocks so the walls run straight. Patches under 45 cells are left open.
- Then filled up to the city wall, so no corridor is left between the new walls and the city
  wall. That fill is undone wherever it would cut a gate or scripted place off from the streets.
- Checked: the walkable city stays in one piece.

Result: 13,210 closed cells, 1,705 wall pieces and 517 posts.

## Regenerating

The tool reads three dumps: the running game's walkable cells and objects, the river grid, and the
compiled street map (see the tool's header). Rerun it whenever buildings, streets or case places
move, because a new case place inside closed ground would be unreachable.
