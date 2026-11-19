# Grave Robber — current gameplay

The 5120×4480 map has eleven named spaces linked by looping corridors. Between five and ten caches are active. Their locations are randomly selected from open floor cells in rooms, away from the entry and other active sites. A new site appears elsewhere whenever one is recovered; caches replenish throughout a five-minute round. Return to the entry gate to bank the full haul. At closing, an unbanked haul keeps only half its value. Warnings appear with one minute and twenty seconds left. Investigation runs are exempt.

## Light and enemies

A full tank lasts about 147 seconds while lit (0.68 fuel/sec), or 1000 seconds shuttered (0.10/sec). At 75% fuel, light retains over 90% of full reach and 95% brightness. The falloff becomes steep below 30%. Zero fuel extinguishes the player lamp without ending the run; finding fuel can relight it. Flares and fixed lanterns still provide local light. Map enemy markers respect current visibility. A continuous ray-cast mask stops light at walls.

The carried lamp sprite and the light source use one player-relative world position, so both remain attached to the moving player, including in the hidden chamber. The chamber's black lantern remains a separate fixed object until collected.

Hunters and interceptors stop briefly in the beam. After 2.2 seconds of sustained exposure, a resistance ring fills, they flash red with a 0.7-second warning, then surge through the light for about 3.4 seconds. Flares interrupt the surge. Breaking sight or sprinting around architecture is necessary; prolonged walking backward with the beam is no longer a safe escape. Hunters move at 190 px/sec while engaged, interceptors at 180, surging ghosts at 235; player walk/sprint are 175/265. Ghosts still expire and cannot pass through stone.

Two distant zombies start each run. Time, digging and low fuel raise pressure. Gravebound join later and can be baited into charging walls. Crawlers and thrown-stone decoys have been removed, including their controls and guide entries. Old saved crawlers are discarded on resume.

## Finds

Every cache contains one of six valuables, with distinct art and base values: tarnished coins (85), mourning locket (155), silver chalice (240), funeral mask (330), witchglass idol (460), or burial crown (650), plus 0–24 points of variation. Rarer objects are more valuable. Open coffins and exposed relics display the object; pickup shows its artwork, name and points.

Only 22% of new caches include a supply alongside treasure: 5% bandages (+30 health), 12% fuel (+35 light), 5% flare (+1). The remaining 78% contain treasure alone. Buried caches require three timed E strikes, coffins open over time, and exposed relics are immediate pickups. Legacy active caches without treasure metadata migrate to the new loot tables on resume.

## Navigation and help

M pauses danger and shows the complete floor plan, pillars, room names, explored floor, cache markers, visible enemies, player heading and a walkable route. C switches the map route and compass between the nearest cache and the exit. The compass gives direct distance; the map gives passage distance.

The entry screen offers an optional illustrated field guide, selected on a first visit. T or the GUIDE touch button reopens it. The twelve-page guide has animated examples, back navigation, enemy-specific counters, including ghost resistance and a playable shovel timing practice. It freezes gameplay while open. WASD/arrows move; mouse aims; SHIFT sprints; E interacts; F toggles light; R uses a ward flare.

Run saves include replacement caches and inventory. The mystery revision uses map version 5; older expedition checkpoints restart without discarding story evidence or account progress.

## Verification

Automated checks cover cache reachability across seeds, randomized opening locations, 100 successive replacements, restored IDs, supplies, dimming, escalating pressure, ghost beam stopping (including walls/range), threat lifetimes, excavation and existing story validation. Browser checks cover the optional guide, map routing, movement, and an actual flare pickup/replacement.

## Ghost investigation

After the Last Ride cutscene, the poem is saved to the casebook and the investigation starts automatically. The compass leads to a fixed key site in the West Burial Hall. Discovering it reveals the seal puzzle; tracing the seal frees the key, which opens a hidden wall in the Sealed Vault. The wall closes behind the player.

The small chamber contains the black lantern and nearby inscriptions. The first interaction opens the warning scroll and saves it; a second takes the lantern and opens the side door. The ordinary lamp remains functional. Walking through the door returns to the cemetery room where the vault entrance is located. A large wave of ordinary ghosts and zombies pursues and intercepts the player on the escape to the gate. Dark, full-width barricades close some routes; snatchers can pull the player back. Reaching the gate secures the lantern and finishes the investigation.

The admin test bench has direct starts for the key, seal, chamber warning and lantern escape. Test runs advance their local story stage but never save account progress or evidence.

## Late enemies and directional audio

Bellringers can spawn after 90 seconds. They have a 2.2-second visible alarm windup; breaking sight or using a flare interrupts it. A completed ring draws nearby existing enemies to the player's last known position. Grave mimics can be planted at distant buried caches after 150 seconds. Breathing soil is the advance tell. Digging wakes them with a 1.3-second safe window; the cache remains recoverable afterward. They are absent from the opening phase.

Enable directional sound in the intro or header. Synthesized layered effects cover footsteps, chains, groans, armor, digging, treasure, flares and bells. Stereo placement follows screen direction; distance reduces gain and walls muffle enemy cues. Maps, guides, pause dialogs and hidden tabs silence game audio.
