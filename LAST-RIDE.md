# Last Ride

One endless run. There is no separate story/endless mode, no fixed finish distance, and no saved run checkpoint. Every attempt starts at zero distance and score with three chances and a full brake charge. Old railway checkpoints are ignored and removed when starting the game.

## Controls and recovery

Arrows or A/D change tracks; Space jumps; Down/S ducks and can quick-land an airborne cart; Shift/B spends braking charge. Ducking has no time limit and does not slow the cart, but locks the cart to its current track until the player stands. A jump lasts about 0.94 seconds and accepts a short input buffer before landing. Track changes remain available in the air. The mine switches directly between three and five tracks; even track counts are never used. Later sections climb onto raised rails. Obstacles resolve once: a hit breaks/clears the obstacle, costs a chance and briefly slows the cart, but never rewinds or pins it against a wagon. Brief invulnerability prevents one row from draining every chance.

The early mine combines hazards across three tracks. Later rows use the extra routes and become tighter as the cart speeds up. Authored patterns always offer either a clear lane or a jump/duck solution. Run seeds vary the sequence. Gold trails suggest routes and reward risky clearances.

## GHOST and first contact

Rare solid, extruded letter pickups spell GHOST. The word display tracks discoveries. Letter discoveries persist across attempts and sync with ordinary player progress; distance, health, score and power timers do not. The fifth letter diverts the cart to the results platform and the ghost-writing cutscene. If the player leaves that scene, completing a short fresh approach with the already found word lets them return.

At the platform, the cart rolls beyond the results board. A smaller, fully framed 3D ghost appears as the message arrives all at once; no writing hand or dripping effect is used. A paper poem flutters toward the camera. Intense static and a low drone accompany the scene. The contact transition records the poem in the casebook and starts the Grave Robber investigation. After contact, letters stop spawning and Last Ride remains endless.

## Powers

- Shield: timed protection that absorbs one hit.
- Veil Lantern: phases through the next collision without losing a chance.
- Magnet: collects nearby gold from other lanes.
- Double gold: doubles coin value for a limited time.
- Turbo: speeds through and smashes hazards for bonus points.
- Brake battery: restores 45 braking charge, capped at 100.

## Art, sound and verification

Rider, tombstones, bones, cart and ghost use the same code-authored 3D palette and materials. The haunted engine and the old 2D rider/graves and decorative arrow rails are removed. The rider articulates while ducking/jumping; wheels, cart lean and landing suspension animate. Repeating track sectors support an endless world with bounded obstacle/pickup cleanup and changing cave lighting. Rendering uses device pixel ratio up to 2 for sharper large-screen output.

Spatial effects include wheel clatter, impacts, pickup chimes, distinct letter/power sounds, shield break, cave wind and echo. The cutscene adds intense static, a low drone, paper movement, doors and a final wail; no drip sound plays in that scene. The top-bar sound control governs them. The message bar only reports actual outcomes.

The verified-admin test bench can inspect the key, seal, lantern, Keeper escape, other investigation segments, powers and arrival cutscene without saving scores or quest progress. The ordinary menu always creates a fresh simulation. Automated tests exercise the actual runner logic: three-to-five-track layouts, buffered jumps, unlimited speed-neutral ducking with lane lock, one-hit recovery, powers, letter completion/suppression and fresh attempts.
