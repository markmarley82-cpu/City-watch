# Palace main-block artwork candidate

Prepared for Mark on 19 November 2026 against main fd76ccb. The approved Palace gatehouse, wall and lantern geometry already exists in dist/assets/palace-approach-v1. This packet adds a main administrative block fitted to the reserved 9.5 × 9.25-cell foundation and night companions for those four approach pieces.

The main block was generated using the existing Palace reception range and gateway as visual references, then its individual facade and roof planes were registered to world-derived target vertices. See registration.json for every source/target vertex. Native canvas is 1200 × 1000, drawing scale 0.5, native anchor [614,925], world anchor [158.75,222]. The service door reads approximately 70 px tall beside the 60 px height guide. It is decorative artwork and has no new interaction.

The packet contains main-day, main-night, separate roof and walls, window-emission and contact-shadow WebPs, plus four approach night WebPs. Main day/night dimensions and alpha are verified identical after decoding. Window masks follow dark glass in the sixteen existing apertures. The final roof was registered in individual planes to retain straight ridges and eaves.

The existing public reception entrance is [144,231]. Actual plot, road clearances and lighting appearance need a game integration review. Roof-off walls are a cutaway art layer, not an interior floorplan. The shadow is a separate ground layer. Main-night is prelit, so the integrator should account for the engine night tint when choosing the final blend.

Status is candidate for creative approval. Game files and map placement were not edited by this packet. The review sheet shows sprites at the proposed game drawing scale, with a drawn 60 px height guide, rather than a live-game screenshot.

Independent final raster alpha-boundary fit measured foundation angles of 26.844 and 27.475 degrees, within the existing 26–28 degree art tolerance. The geometric target vertices are exact 2:1. Source cut-stone edge variation affects the raster measurement. Main day/night alpha matched byte-for-byte after export.

20 November: main-roof-night.webp and main-walls-night.webp complete the cutaway night companions. These reuse existing registered night pixels and the respective day layer alpha, with unchanged canvas and anchor. The complete packet is now on main; docs/art/CITY-ART-REVIEW-INDEX.md records the consolidated delivery and checks.
