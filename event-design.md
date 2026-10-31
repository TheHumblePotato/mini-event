> **Latest player feedback — priority implementation TODOs (October 29, 2026).** This section supersedes conflicting descriptions below, especially the Keeper maze and causeway puzzle.
>
> ### Last Ride / game 3
> - Do not play the ghost cutscene until the run has ended. After the run, rapidly flicker every letter red, then leave them steadily red; wait 1–2 seconds before starting the cutscene.
> - Keep the ghost visible in frame throughout the cutscene. Make static sharper, more intense, and difficult to ignore.
> - Have the ghost actually draw the symbol. Replace the current saved clue with a vague hint to return to the graveyard; do not reveal where to dig. Save that hint in the clue book.
> - When the cutscene ends, return to the main menu as usual; do not launch or navigate directly into Grave Robber.
>
> ### Investigation flow and Grave Robber
> - Never show a “Continue Investigation” button; players should infer the next step themselves.
> - In the first investigation, make the compass red and clearly show/tell that the ghost is manipulating it to guide the player. Fix E-key interaction with the key site and seal.
> - Keep the key-search symbol distinct from the seal; the target to search for must not itself be the seal. During seal tracing, display this exact clue above it:
>   > The mark that waits when play is still<br>
>   > Must cross this lock to work your will.<br>
>   > Its shape alone unseals the stone;<br>
>   > Trace every line, then leave it lone.
> - Show the player's ordinary lamp in the secret chamber. Do not expose lamp-switch controls until the black lamp is part of the story; have the ghost explain the control when it becomes relevant.
> - Move the optional lamp-danger clues to a distant chamber area. Interacting with either clue must visibly show its text, not just announce that it was saved. Present both as paper-scroll overlays and persist them in the casebook:
>   > This coal-black flame gives dead things might;<br>
>   > What sleeps below will wake tonight.<br>
>   > If one begs, “Bring it here; let it shine,”<br>
>   > Keep dark the glass that guards its shrine.
>   >
>   > No oil it drinks, no warmth it lends;<br>
>   > It feeds the mouths where breathing ends.<br>
>   > Beneath its wick the buried wake;<br>
>   > The dead grow strong with each step you take.
> - Verify clue-book persistence and visibility; a “saved” message without a readable, retained entry is not sufficient.
>
> ### Grave Robber lantern escape — current direction
> - Delete the Keeper fight, maze, attacks, and lamp-switch mechanic. The lantern still works normally in the chamber.
> - Taking the lantern opens a side door. Going through it returns the player to the same cemetery room where they entered the vault.
> - Spawn a large, persistent group of ordinary ghosts and zombies. They should pursue and intercept the player on the difficult return to the gate.
>
> ### Midnight Delivery investigation — current direction
> - Replace the two-light causeway puzzle with a physical, ordinary-looking dark bridge on Rookhaven’s eastern edge. It is connected to the road network and appears only under black headlights.
> - The bridge leads to Gloaming, a full new city with at least five ghost cars spread across its streets.
> - Complete three deliveries in Gloaming to earn the sealed parcel. A player who wrecks must restart the deliveries, choosing either Hollow or the new-city entrance.
> - A side impact against a ghost car destroys it and restores car condition. A ghost-car impact deals reduced damage and knockback, and the ghost car remains.
> - Take the parcel to Hollow’s North Street Post Office. After delivery, return to the menu and gather five rare papers during Last Ride; the assembled puzzle and answer remain to be authored.

# Midnight Arcade — Halloween 2026

> Rendering revision: the live build uses one stylized, pixel-textured palette across the 3D menu, driving game, railway, chamber, and 2D cemetery sprites. Realistic generated images are no longer used. Last Ride is one endless runner with no run checkpoints. Rare GHOST letters persist as discoveries; collecting all five reaches the terminal encounter, after which letters no longer spawn. The lamp, seal, roads, and paper hunt are integrated into their game worlds. The story outline below remains the narrative specification except where the latest feedback above overrides it.

Current design and implementation handoff. Three games release at midnight Pacific on October 29, October 30, and October 31, 2026. The browser app and local preview exist alongside this file; production Firebase deployment is a separate remaining setup step.

## Home screen and release schedule

A dark purple cemetery/forest setting, bare trees, a dim moon, drifting fog, slow bats, and occasional restrained title/light flicker. Reduced motion disables animation. The header carries the ghost's diamond-and-spine seal rather than a star. Copy is minimal: dates, game names, short descriptions, unlock dates, and play buttons. No footer, ticket language, volume number, or development banner.

| Date, midnight Pacific | Game |
| --- | --- |
| October 29 | Grave Robber |
| October 30 | Midnight Delivery |
| October 31 | Last Ride and first ghost contact |

Exactly three games appear initially. No fourth slot, gap, covered cabinet, outline, or score column hints at another menu item. Contact makes the ghost uncover the locked fourth cabinet for the first time.

Local development exposes Settings → Test unreleased games. Production exposes it only to authenticated users carrying a verified Firebase admin claim. The public page contains no shared admin password.

## The three minigames

### Grave Robber

Top-down graveyard treasure hunting. Gather valuables, manage warm-lantern fuel, and return to the entrance to bank treasure. Digging takes time and makes noise. Exploration and risk increase potential rewards. The layout and important landmarks stay fixed; treasure/patrol variation can support replay.

You cannot fight entities:

- **Mourner:** follows visible light; break sight and extinguish your lamp.
- **Follower:** investigates digging sounds.
- **Lantern escape:** taking the black lantern opens a side door into the same cemetery room as the vault entrance. Ghosts and zombies pursue the player back to the gate; there is no Keeper fight or lamp-switch maze.
- Investigation fuel drain is intentionally lower than a standard run. The black lantern restores the ordinary lamp to full and removes further fuel drain for the escape. Flares work in the chamber; enemy attacks remain dangerous but do not stun the player. A death after taking the lantern offers a full-health, full-light, two-flare respawn inside the chamber.

### Midnight Delivery

Fast top-down driving: accelerate, swerve, corner, brake, crash, collect candy, and reach delivery stops. Crashes cost time/candy but usually allow recovery. Streaks and cleaner routes reward replay.

Its investigation route reveals a dark, ordinary-looking highway bridge on Rookhaven’s east side. The bridge leads to Gloaming, a larger island city with a connected street grid and hostile ghost cars. The ghost drivers use the same flank-and-ram pursuit behavior as Rookhaven’s, attacking in groups. A deliberate side or rear ram destroys a ghost car and restores condition; a ghost-initiated impact deals reduced damage and knockback, and the ghost remains active. Completing the three deliveries earns the sealed railway parcel, which must be taken to Hollow’s North Street Post Office. Last Ride investigation remains unchanged for now.

### Last Ride

A stylized 3D endless minecart runner with odd-sized sections of three or five tracks. Players switch lanes, jump crates and gaps, duck beams, collect valuables and spend limited braking charge. The opening already contains paired hazards; speed and pattern pressure rise with distance. There are three chances, buffered arcade jumps, quick landing and free airborne lane changes. Ducking does not slow the cart, but prevents track changes while held. Hits never rewind or pin the cart. Every attempt starts at the entrance; no run checkpoints are saved or loaded.

Rare collectible letters spell **GHOST**. Letter discoveries are saved between attempts as collectible progress, while distance, score, health and powers restart. Collecting the complete word routes the cart into the results platform and ghost-writing scene. After first contact, letters stop and the same game remains endless.

Power-ups include a one-hit shield, the Veil Lantern (which phases through the next collision), coin magnet, double gold, turbo, jackpot and brake batteries. The haunted locomotive has been removed. Rider, graves and ghost are modeled in 3D; decorative track arrows are removed.

## The ghost and its story

The prisoner's chains weaken for the week around Halloween. A fragment of its soul slips out, but is too weak to roam in search of people. It waits at the terminal platform until a living rider arrives. Contact is possible because the fragment is present there, not because the cart breaks a bell ward.

The ghost says:

> YOU CAN HEAR ME NOW.
>
> FREE ME.

The messages appear at once. A poem flutters toward the camera on a sheet of paper, then the ghost reveals the route back to the cemetery.

Its explanation: it was a character in a removed fourth game. That game's pieces were scattered into the other games. Bringing back its lantern, route, and recording will restore the game and let the player help it.

Part of this is true. The fourth cabinet did use the captive as a character. Its scenery and machinery were distributed across the arcade, but those pieces also carried the containment links. Restoring them reopens access to the cell; it does not make releasing the captive safe. The ghost presents containment as abandonment and the repairs as rescue.

Distribute this lore through ghost conversations, depot labels, and maintenance records. Avoid one early explanation announcing that it is evil. Its practical help is real: it opens an escape gate, gives accurate navigation advice, and identifies the next useful location. The deception concerns why it wants those things done.

## Investigation chain

### 1. Find the buried key

The ghost's first clue is intentionally vague: it points back to the graveyard, not to the key or a specific place to dig.

> Return where first you raised your light;
> The graveyard waits beneath the night.
> No mark is named, no grave is shown—
> Go back, and let the dark be known.

The poem is saved to the casebook when contact ends. In Grave Robber, the ghost controls the compass and guides the player to a fixed site in the West Burial Hall. The site is distinct from ordinary random caches. Interacting with the burial mark advances the story and reveals the seal puzzle.

### 2. Trace the seal and take the key

The key site presents an Android-lock-style **5×5 dot grid**. Trace the emblem shown in the header and on machinery: a diamond with a vertical spine joining its top and bottom points. Match the set of connected segments, not a numbered sequence. Direction and starting point do not matter, and lifting between strokes is allowed. Intermediate collinear dots are included automatically. Touch dragging and keyboard/click input both work. Solving the seal releases the fixed key; only then can the player pick it up.

> The mark that waits when play is still
> Must cross this lock to work your will.
> Its shape alone unseals the stone;
> Trace every line, then leave it lone.

The seal is visible in the header and on machinery. Recognizing it connects the key site to the arcade. No unrelated eye/flame ring puzzle remains.

### 3. The black lantern

The hidden vault wall closes behind the player. The small chamber contains the black lantern and nearby clues. The first interaction with the lamp reads and saves its warning; a second interaction takes it and opens the side door.

> This coal-black flame gives dead things might;
> What sleeps below will wake tonight.
> If one begs, “Bring it here; let it shine,”
> Keep dark the glass that guards its shrine.

A rubbing and torn ledger are found elsewhere in the chamber. They are optional evidence, not requirements:

> No oil it drinks, no warmth it lends;
> It feeds the mouths where breathing ends.
> Beneath its wick the buried wake;
> The dead grow strong with each step you take.

The ghost claims the lamp was taken from its game to keep it weak. Its reaction should acknowledge the warning without disproving it.

### 4. Lantern escape through the cemetery

The Keeper fight, attack system, maze, and lamp-switch mechanic are removed. The ordinary lamp remains functional inside the chamber. Taking the black lantern opens a visible side door; going through returns the player to the same cemetery room as the vault entrance. Ghosts and zombies pour into the cemetery and pursue or intercept the player as they run back to the gate. The pressure should feel dangerous, but the route remains physically navigable. Escaping at the gate secures the lantern and advances the investigation.

After escape, the black lantern appears on the main menu and the first cabinet connection breaks. Its glass can reflect the ghost.

### 5. The lamp points to Midnight Delivery

Turning on the menu lamp exposes a shadow road running into the Midnight Delivery card and a receipt:

> Where Hollow Lane runs out of road,
> Let blackened headlights bear your load.
> Beyond the place the maps deny,
> The railway's missing parcels lie.

The explicit destination is **Hollow Lane — dead end**. The ghost suggests the switch if the player stalls, then identifies the game more directly. Selecting the receipt starts an investigation drive without the ordinary shift timer.

### 6. The bridge to Gloaming

Black headlights reveal a normal-looking, dark bridge connected to the road network on Rookhaven’s eastern edge. It leads directly into Gloaming, a complete new city with multiple streets, buildings, and at least five ghost cars roaming in different areas. The bridge stays visible once revealed. There is no road-color puzzle or limited light-swap budget.

In Gloaming, complete three distinct delivery handoffs to earn the sealed railway parcel. Ghost-car side impacts disintegrate the struck car and restore some car condition. A ghost-car collision with the player deals less damage and knockback than an ordinary crash, and the ghost car remains in traffic.

Wrecking the car resets all three delivery objectives. Offer a choice to restart from Hollow or resume at Gloaming’s entrance; either choice restarts the delivery count.

### 7. One package and the real post office

After all three Gloaming deliveries, the player receives one sealed parcel addressed to Hollow’s North Street Post Office. Drive back through the bridge network and deliver it.

The dispatch completion message is **“Package successfully sent!”** The player returns to the arcade menu. The ghost directs them to Last Ride; during the run, the ghost says the parcel was sent into that game.

### 8. Gather the scattered papers

During the Last Ride run, gather five rare paper pickups. They begin spawning only after the player has traveled a while, and the investigation run is faster and more dangerous than an ordinary run.

When all five are collected, they become one persistent paper stack. The stack appears on the main menu and can be reopened there. The paper text and coherent puzzle remain **to be authored**; do not invent them. Collecting all five unlocks the Fourth Game directly; no answer is required.

## Fourth game and final room

The Fourth Game opens from its unlocked cabinet. It is a 3D first-person room: the player holds the black lantern and faces a mirror. The ghost asks the player to choose between lighting the black lantern and lighting the ordinary lantern.

### Black-lantern ending

Power flows from the black lantern into the mirror. The ghost breaks free, approaches the player, and the site corrupts into intense static. End on a page that offers **RESET EVERYTHING**.

### Ordinary-lantern ending

The mirror illuminates with **NEVER FREE HIM**. The player runs from the room and hears the ghost's last line: **I can wait.** Return to the arcade with the Fourth Game cabinet boarded shut. It cannot be reopened; its only action is **RESTART**.

Restart clears local progress, casebook entries, items, scores, endings, and the signed-in player's cloud progress and personal leaderboard records.

Last Ride is temporarily marked **UNDER CONSTRUCTION** until October 31, 2026 at 4 PM Pacific. Verified admins can still use the admin test bench.

## Ghost hints and automatic saves

The ghost grows more present at each milestone: terminal writing → local help → reflections/menu writing → delivery radio → whole-site speech and interface influence. It should react to progress and failed experiments, not repeat a single line.

Offer a nudge after roughly 60–90 active seconds without progress. Players can ask immediately. Escalate from observation to direct instruction to a demonstration. Pause hint timers while reading evidence. Critical practical help can use plain language when rhyme would obscure it. Hints never erase warnings or falsify saved evidence.

The **Casebook** saves automatically:

- Every acquired clue, illustration, warning, notice, receipt, and dialogue line.
- The assembled Last Ride paper stack, once recovered.
- Items, route maps, solved traces, checkpoints, and ending history.
- Meaningful puzzle edits so refreshes do not discard work.

Opening evidence pauses active danger. Local saves happen immediately; signed-in players also sync to the existing **nerd-mini-events** Firebase project. Display pending/failed cloud status honestly. Scores are stored separately from trusted story milestones.

## Gating and build order

Build order: **home screen → Firebase/casebook → three games → ghost investigation → validation/polish**.

Required story order: **Last Ride contact → shadow → seal → lantern → cemetery escape → menu lamp → Gloaming bridge → three deliveries → parcel → post office → Last Ride papers → Fourth Game → ending**.

Use Firebase callable transactions for protected progression and server release time. A verified admin token may playtest early. A URL parameter, browser clock, guessed answer, or edited player-save document must not grant trusted story progress. The local preview service uses the same validators in a development-only loopback session.

The browser's visual game code is inspectable; this is not spoiler-proof encryption or a server-simulated anti-cheat system. Production rules and callable deployment must be verified before release. Preserve all old-event data and rules when adding the new collections.
