# Portrait wardrobe, version 2

Generated with the built-in image-generation tool on 2026-09-30. The existing
body-parts atlas was supplied as a style reference. Output is stored unchanged
at `public/assets/portraits/wardrobe-v2.png` (1774 × 887 RGBA).

The runtime samples ten clothed bodies: five columns (Commoner, Citizen, Noble,
Ruler, Warrior), masculine top row, feminine bottom row. Body, sleeves, clothes
and neck are one coherent piece. Head, eyes, nose, mouth, hair and beard remain
independently selected parts. The source atlas is not a sheet of finished portraits.

Atlas spacing is approximate. `src/portrait-render.js` records actual crop bounds
and measured neck centers instead of trusting the requested cell sizes. Each neck
top maps to y=282 on a 512 × 640 portrait; the chin overlaps at y=300. Torso size
variants use uniform scaling around that point. The old body atlas remains loaded
for hair and beard components only. Clothing remains cosmetic, without stat effects.

The live developer review is `tests/visual/wardrobe-review.html`. Use its center
guide, complexion selector and broad-build toggle to inspect actual compositions.

## Generation prompt

Use case: stylized-concept.
Asset type: PRODUCTION SPRITE ATLAS for modular medieval RPG character portraits, not completed characters.
Create ONE transparent PNG atlas, 5 columns by 2 rows of exactly 10 SEPARATE HEADLESS clothed human upper bodies. Prefer a wide 2560 x 1280 canvas. Each equal cell is 512 x 640; no borders, labels, shadows or decorations outside the bodies.
Image references are STYLE ONLY: crisp high definition pixel-painted medieval game art, intricate fabric and metal like the reference. Do NOT copy their uneven positions.
Columns left to right: COMMONER, CITIZEN, NOBLE, RULER, WARRIOR. Top row masculine bodies; bottom row feminine bodies. Mature adult normal human proportions. Every body faces DIRECTLY FORWARD, shoulders level, torso straight and symmetric, no three-quarter view, no leaning or twisting. Arms relaxed vertically at sides. No exposed hands: sleeves/gloves extend to lower crop.
CRITICAL MODULAR GEOMETRY: all ten bodies occupy precisely the same registration box. The vertical centerline of neck, sternum, belt buckle and pelvis is at the EXACT horizontal center of each cell. Every body INCLUDES A COMPLETE VISIBLE NATURAL SKIN NECK, cut horizontally at its top where a separate head/chin will be laid over it. NO HEAD, NO CHIN, NO FACE, NO HAIR, NO HELMET, NO CROWN. Neck top at cell y=40, neck width about 78px. Neck extends to collar at y=105. Shoulder line around y=140, widest shoulder span about 390px. Belt at y=480. Body ends at upper hips y=620. Keep all content in its own cell with transparent gutters. All bodies same size and same pose.
Skin: same warm light tan across ALL ten necks, softly shaded from upper left, anatomically natural neck and clavicles, no cylindrical wooden peg necks. Low collars expose neck so a head can overlap it naturally. Clothes and neck must already fit together as ONE integrated body artwork.
Commoner: worn oatmeal linen shirt or modest long-sleeved dress, patched brown wool waist garment/apron, plain leather belt; humble practical workwear.
Citizen: tidy muted teal wool tunic / fitted long-sleeved teal town dress, cream undershirt, stitched seams, small brass belt buckle, a leather coin pouch.
Noble: rich deep burgundy tailored medieval tunic / modest long-sleeved burgundy gown, restrained gold embroidery, brocade, decorative leather belt. Fitted but natural practical proportions.
Ruler: deep royal blue velvet ceremonial coat / royal blue long-sleeved gown, rich gold embroidered edging, ermine trim on mantle, central gold clasp or chain. Neck unobstructed, fur stays at shoulders.
Warrior: practical steel plate cuirass over visible chainmail and burgundy gambeson, leather straps, sensible shoulder plates, gauntlets; same plausible protective armor for men and women, no breast cups.
Style: beautiful readable detailed pixel illustration matching reference quality, realistic anatomical proportions, crisp material highlights, tasteful medieval clothing, consistent lighting. NO lettering. TRUE transparent background. Nothing else.
