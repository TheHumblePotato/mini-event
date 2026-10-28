# Archived image experiments

These realistic images are retained for reference only. Following the latest art-direction feedback, NONE are used by the live scenes. The active art is authored in `engine/pixel-art.js` and `engine/visuals.js`, using a shared palette, pixel atlas, and pixel-filtered textures.

Generated with the built-in ImageGen tool, then copied into this project. No generated asset is referenced from an external cache path. The art direction is detailed, desaturated gothic horror: charcoal/indigo environments, weathered materials, amber practical light, and restrained violet supernatural light.

- `arcade-night.png`: cinematic abandoned Victorian arcade beyond cemetery gates, wet stone, bare trees, pumpkins, fog, dark central space for title; no text or people.
- `ghost.png`: full-body spectral woman, dark mourning dress, hollow face, long hair, broken wrist chains, dissolving violet cloth/smoke; transparent background, no sheet-ghost silhouette.
- `cemetery-atlas.png`: transparent 4×3 equal-cell atlas. Row 1: gravestone, Celtic cross, sarcophagus, pumpkin. Row 2: dead tree, bush, gate, pillar. Row 3: warm lantern, black lantern, coffin, explorer carrying lantern. Detailed painted material and consistent three-quarter overhead perspective.
- `facades.png` (when present): 2×2 orthographic texture atlas of weathered Victorian facades: brick, stone, timber/plaster, gothic stone. Three storeys, three tall windows per storey, dark mullions, some amber windows, old door surrounds, cracks/moss/water stains; no roofs, scenery, signs or text.

These are production assets, not interface mockups. Runtime Canvas/WebGL rendering supplies lighting, perspective, movement, shadows, and animations. The sprite atlas is sampled directly in the renderer; it is not flattened into an environment screenshot.

## Prompts

Ghost: “One single full-body spectral woman, floating, front-facing with slight three-quarter turn. Thin anguished porcelain-like face under long flowing black hair, hollow eyes with faint lavender pinpoints, ancient charcoal Victorian mourning dress dissolving into violet smoke and torn translucent cloth, long articulated fingers, rusted wrist-chain fragments. Detailed textured gothic horror concept art, cool moonlight rim, faint amber reflection. Entire subject contained, transparent background, no ground, text, logos or UI.”

Environment: “Widescreen cinematic gothic Halloween environment painting. Deserted muddy cemetery lane toward an abandoned Victorian arcade hall at midnight, crooked wrought iron gates foreground, ancient gravestones, dead autumn trees, wet stone, carved amber jack-o-lanterns, distant peaked roof behind ground fog, cold moon and clouds. Dark indigo/charcoal with localized orange light, realistic hand-painted material detail, uncluttered dark upper middle for title, no text/people/UI.”

Atlas: “Exact uniform 4 columns by 3 rows, isolated props with transparent padding, consistent detailed hand-painted gothic horror top-down three-quarter view. Cracked gravestone; broken Celtic cross; sarcophagus; glowing pumpkin; dead tree; dead bush; cemetery gate; mossy pillar; brass lantern; black iron violet lantern; coffin; dark-coated explorer carrying lantern. Fully contained equal cells, no labels or gridlines, readable realistic silhouettes.”

Facades: “Exact 2×2 atlas of flat orthographic front elevations for 3D haunted Victorian houses. Detailed muted brick, stone, timber and plaster; three storeys by three windows, dark mullions and warm candles, ornate lower-middle door, weathering, cracks, moss, stains, cobwebs and carved lintels. Four material variants, no perspective, roofs, people, text, sky, ground or UI.”
