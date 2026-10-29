# Midnight Delivery

Three towns share a connected road network: crooked old Hollow, Briarwick with its roundabout and market streets, and haunted harbor Rookhaven. Blackwater Highway joins the first two. A wide coast road with gentle bends connects Briarwick to Rookhaven. A marsh causeway connects Hollow directly to Rookhaven, and a northern bridge supplies a second Hollow–Briarwick crossing. Short alleys, offset junctions, bends and dead ends demand braking and route choices.

## Shift and jobs

A shift lasts **150 active seconds with no job-count limit**. Choose one of three offers using **1 / 2 / 3** or the on-screen buttons. New offers appear after each completed job. The clock waits while choosing; M also pauses for navigation. One offer is nearby, one visits another ordinary town, and one visits Rookhaven. Offers exclude the last four completed addresses.

Pay increases with route distance; Rookhaven work pays **2.5× the ordinary base fare**. Clean deliveries build a multiplier up to ×2. Beat the displayed, distance-scaled rush deadline for +75. Completion restores three points of car condition. Crashes cost up to 48 condition, subtract points and reset the multiplier. Zero condition ends the shift. A job completed without a crash earns a +60 clean-run bonus.

Choose one of four cars in the game intro. The Standard is balanced; the Blackbird Coupe is faster and scores more but has poor handling and low crash resistance; the Ironwood Hearse is slow and durable; the Witchlight Taxi favors steering and grip. The choice changes the car's handling, speed, condition damage and final job points.

Fourteen quest types include sweets for porch bowls, vigil candles, costume crates, contest prizes, cider, glass seedlings, mail, protective charms, parade lanterns, generator fuel, batteries, signal lamps and an observatory prism. Each has a reason and a recognizable destination. Building types include chapels, hotels with balconies, theatres with marquees, a diner, fire station, greenhouse, observatory dome, station, witch shop and warehouse crane.

- Delivery: take the parcel to the marked bay.
- Pickup: collect from one building, then deliver to a second.
- Service: park and press E to start a short unloading/repair task. Moving away interrupts it.
- Fragile: crashes and excessive cornering reduce the job's payout.

Each run randomizes ordinary buildings and loading bays together, retaining safe road access. The mystery's North Street Post Office stays fixed and is excluded from ordinary offers.

## Driving

W / up accelerates. S / down brakes, then reverses. A/D turn the **nose** left/right consistently in forward and reverse. Space handbrakes, H honks, E interacts while parked. M opens the regional map; Z changes between region and local detail. There is no Q cycling of accepted jobs.

Throttle ramps gently for parking. City speed tops out near 50 world units/second; the highway allows 90, while narrow alleys govern speed to 27. Coast and marsh roads allow 62 units/second with normal grip; the coast road is 25 units wide. Highway steering is gentler and releasing the wheel stabilizes the heading. Reverse has a lower cap and acceleration. Wheels, body lean, brake lights and reverse lights follow the driving state.

Buildings, boundary walls and bridge guardrails are physical. Compound car-body contacts and substeps prevent tunneling through scenery; swept traffic contacts cover fast passes. The coast rails meet at angled joints without blocking the centerline. Grass slows the car. Eighteen ordinary cars follow the actual crooked roads and connector routes, wait for closures and yield to the horn. Starting depot areas stay clear. Fast close passes earn +30 once per vehicle.

## Closures and ghosts

Every closure affects **three connected streets**, with a five-second warning. Amber/red map lines mark the full route, and navigation recalculates a detour. Each pattern leaves every address reachable. A car already beside a new barricade can clear it before that barrier becomes solid. Pumpkin spills warn before rolling across ordinary-town junctions.

Two ghost models alternate encounters, with only one active chase at a time. They form 90–155 units behind the player's travel direction, with a two-second harmless appearance and an audio warning. Ghosts now refresh their route more often and turn more responsively to follow the player. A longer flank warning and recovery window, slower committed ram, reduced knockback and 16-point base condition damage before vehicle resistance make impacts less punishing; breaking sight or outrunning them still ends the chase.

Chasers approach from behind, steer with a limited turn rate and move alongside before signaling a side ram. Flashing lights and a horn warn for about one second. The ram follows its committed trajectory, so braking or turning can make it miss. Five seconds without sight, a lead of 215 units, or leaving the city/connecting roads ends the chase. Encounters also expire rather than following forever.

Ghost contact deals **no direct cargo damage**. Body and bumper sweeps catch side impacts. Any contact consumes that ghost, which visibly dissipates, preventing repeated pinning. The stronger impulse briefly reduces lateral damping so the knockback has real travel; hitting solid scenery still damages cargo. After an impact, a shared cooldown prevents any replacement for at least 24 seconds. Other encounters also get a recovery gap; individual ghosts wait 34–46 seconds before returning.

## Rendering, sound and story

All scenery is code-authored with the existing stylized palette and pixel-filtered textures. Closed roofs, different silhouettes, porch signs, pumpkins, cold harbor lanterns and forest backdrops replace repeated generic blocks. Static scenery is batched, traffic uses a compact mesh, and baked shadows avoid a dynamic full-city shadow pass.

Directional sound includes engine, tires, horns, collisions, bells, handoffs, wind and ghost encounters. The top-bar SOUND ON/OFF button is the only sound control; directional effects have no separate opt-in. New profiles default to sound on. Audio pauses with maps, dialogs and hidden tabs.

The missing-road entry, lamp-road puzzles and fixed post-office parcel route remain. Investigation runs are untimed. The private tests/drive-playtest.html fixture exercises the real delivery engine with deterministic seeds/start points, a background-compatible clock and no score posting; the preview server keeps tests private. Remove any temporary engine copy after QA.

## Fullscreen and controls

Every game has FULLSCREEN in its toolbar. The playfield fills the viewport while preserving its 16:9 shape. Arcade/exit controls are compact overlays; keyboard help and desktop touch buttons do not consume fullscreen space. Touch controls remain available on touch devices. The dedicated pause button, pause dialog and Escape-to-pause shortcut are removed. Escape can still close an in-game map or leave native fullscreen.

Final tuning: ghost rams add 70 units/second of impulse, while causing no direct cargo damage. Critical condition gets a red HUD; 30- and 10-second warnings signal the end of a shift. Results include completed jobs, peak speed and ghosts shaken. Unreadable city/route billboards were removed from the 3D world; map labels and delivery-business signs remain.

Closing a finished run's results with Escape, its close button or the backdrop returns to the arcade. Replay creates a fresh run. Leaving mid-run tears down input/rendering and invalidates pending starts/callbacks, preventing stale scenes from reappearing.
