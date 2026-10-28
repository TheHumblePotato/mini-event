# Last Ride

One endless run. There is no separate story/endless mode, no fixed finish distance, and no saved run checkpoint. Every attempt starts at zero distance and score with three chances and a full brake charge. Old railway checkpoints are ignored and removed when starting the game.

## Controls and recovery

Arrows or A/D change tracks; Space jumps; Down/S ducks and can quick-land an airborne cart; Shift/B spends braking charge. A jump lasts about 0.94 seconds and accepts a short input buffer before landing. Track changes remain available in the air. Obstacles resolve once: a hit breaks/clears the obstacle, costs a chance and briefly slows the cart, but never rewinds or pins it against a wagon. Brief invulnerability prevents one row from draining every chance.

The opening already has two-lane obstacle combinations. Later rows become tighter and the cart speeds up. Authored patterns always offer either a clear lane or a jump/duck solution. Run seeds vary the sequence. Gold trails suggest routes and reward risky clearances.

## GHOST and first contact

Rare solid, extruded letter pickups spell GHOST. The word display tracks discoveries. Letter discoveries persist across attempts and sync with ordinary player progress; distance, health, score and power timers do not. The fifth letter diverts the cart to the results platform and the ghost-writing cutscene. If the player leaves that scene, completing a short fresh approach with the already found word lets them return.

At the platform, the cart rolls beyond the results board. A modeled 3D figure writes YOU CAN HEAR ME NOW, FREE ME and the seal on a physical board. E takes the drawing and triggers the existing trusted contact transition. After contact, letters stop spawning and Last Ride remains endless. The later investigation shortcut to the projector room remains available.

## Powers and locomotive

- Shield: timed protection that absorbs one hit.
- Magnet: collects nearby gold from other lanes.
- Double gold: doubles coin value for a limited time.
- Brake battery: restores 45 charge, capped at 100.

The haunted locomotive appears after the opening stretch and returns later. Steam vents add jump hazards; three track-switch tokens drive the engine off. A defeat awards 600 bonus points, braking recharge and a short shield. Missing the switches lets the encounter expire without an instant-death rule.

## Art, sound and verification

Rider, tombstones, bones, cart, locomotive and ghost use the same code-authored 3D palette and pixel-filtered materials. The 2D rider/graves and decorative arrow rails are removed. The rider articulates while ducking/jumping; wheels, cart lean and landing suspension animate. Repeating track sectors support an endless world with bounded obstacle/pickup cleanup and changing cave lighting.

Spatial effects include wheel clatter, impacts, pickup chimes, letter/power sounds, shield break, steam, a locomotive whistle and cave drips. The top-bar sound control governs them. The message bar only reports actual outcomes.

The private ride-playtest fixture uses injected simulation states to inspect powers, the locomotive and the arrival scene without saving scores or quest progress. The ordinary menu always creates a fresh simulation. Automated tests exercise the actual runner logic: early/late patterns, buffered jumps, quick landing, one-hit recovery, powers, letter completion/suppression, fresh attempts and locomotive switches.
