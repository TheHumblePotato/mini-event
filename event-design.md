> **Accepted revision — next mystery pass:** The black lantern belongs in a secret room hidden behind another room. Entry requires a key dug from one specific, fixed map location. That key must only spawn after the appropriate story unlock; it is separate from random endless treasure. Ghost clues should lead to the key and then the concealed doorway. This replaces the starting-lamp / buried-hatch access chain described below. It is recorded here for later implementation; this gameplay pass does not change the live mystery.

# Midnight Arcade — Halloween 2026

> Rendering revision: the live build uses one stylized, pixel-textured palette across the 3D menu, driving game, railway, chamber, and 2D cemetery sprites. Realistic generated images are no longer used. Last Ride is one endless runner with no run checkpoints. Rare GHOST letters persist as discoveries; collecting all five reaches the terminal encounter, after which letters no longer spawn. The lamp, seal, Keeper, roads and projector are integrated into their game worlds rather than separate prose scenes. The story outline below remains the narrative specification.

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
- **Keeper:** a dormant demon, introduced during the secret black-lantern extraction.

The secret escape uses warm and black light to traverse different passages. It has a checkpoint and can be retried without solving the hatch again.

### Midnight Delivery

Fast top-down driving: accelerate, swerve, corner, brake, crash, collect candy, and reach delivery stops. Crashes cost time/candy but usually allow recovery. Streaks and cleaner routes reward replay.

Its investigation route reveals an unmapped road, then a larger two-light network. An abandoned depot contains one parcel. A magic return path leads back into the real city; the player finds its post office and delivers the parcel. A postal railway chute carries it into Last Ride's projection room.

### Last Ride

A stylized 3D endless minecart runner with three main tracks and a locomotive service rail. Players switch lanes, jump crates and gaps, duck beams, collect valuables and spend limited braking charge. The opening already contains paired hazards; speed and pattern pressure rise with distance. There are three chances, buffered arcade jumps, quick landing and free airborne lane changes. Hits never rewind or pin the cart. Every attempt starts at the entrance; no run checkpoints are saved or loaded.

Rare collectible letters spell **GHOST**. Letter discoveries are saved between attempts as collectible progress, while distance, score, health and powers restart. Collecting the complete word routes the cart into the results platform and ghost-writing scene. After first contact, letters stop and the same game remains endless.

Power-ups include a one-hit shield, coin magnet, double gold and brake batteries. A recurring haunted locomotive sends steam obstacles onto the tracks; collecting three switch tokens drives it off for a bonus and braking recharge. Rider, graves and ghost are modeled in 3D; decorative track arrows are removed.

## The ghost and its story

The prisoner's chains weaken for the week around Halloween. A fragment of its soul slips out, but is too weak to roam in search of people. It waits at the terminal platform until a living rider arrives. Contact is possible because the fragment is present there, not because the cart breaks a bell ward.

The ghost says:

> YOU CAN HEAR ME NOW.
>
> FREE ME.

It draws the recurring seal and provides a cemetery illustration. The drawing shows the starting lantern stand, with a shadow pointing toward the light.

Its explanation: it was a character in a removed fourth game. That game's pieces were scattered into the other games. Bringing back its lantern, route, and recording will restore the game and let the player help it.

Part of this is true. The fourth cabinet did use the captive as a character. Its scenery and machinery were distributed across the arcade, but those pieces also carried the containment links. Restoring them reopens access to the cell; it does not make releasing the captive safe. The ghost presents containment as abandonment and the repairs as rescue.

Distribute this lore through ghost conversations, depot labels, and maintenance records. Avoid one early explanation announcing that it is evil. Its practical help is real: it opens an escape gate, gives accurate navigation advice, and identifies the next useful location. The deception concerns why it wants those things done.

## Investigation chain

### 1. Find the impossible shadow

The ghost's first clue:

> Return where first you raised your light;
> Turn its beam from left to right.
> The shadow that refuses flight
> Marks the earth to dig tonight.

Return to Grave Robber's starting lantern. Its handle becomes usable only after contact. Rotate the beam; normal shadows move, one stays fixed. Separate them and dig the fixed outline to expose the hatch. The saved illustration identifies the location and experiment.

### 2. Trace the seal

The hatch presents an Android-lock-style **5×5 dot grid**. Trace the emblem shown in the header and on machinery: a diamond with a vertical spine joining its top and bottom points. Match the set of connected segments, not a numbered sequence. Direction and starting point do not matter, and lifting between strokes is allowed. Intermediate collinear dots are included automatically. Touch dragging and keyboard/click input both work.

> The mark that waits when play is still
> Must cross this lock to work your will.
> Its shape alone unseals the stone;
> Trace every line, then leave it lone.

The seal is visible in the header and on machinery. Recognizing it connects the hatch to the arcade. No unrelated eye/flame ring puzzle remains.

### 3. The black lantern

The chamber contains a cradle, black lantern, main warning, and a diagram. Entering automatically saves the warning, so rushing the pickup cannot lose it.

> This coal-black flame gives dead things might;
> What sleeps below will wake tonight.
> If one begs, “Bring it here; let it shine,”
> Keep dark the glass that guards its shrine.

A diagram shows a lamp directed at a bound figure while the mirror remains dark.

Additional text is hidden beneath the cradle's lip. Players must inspect it; it is optional evidence, not a requirement:

> No oil it drinks, no warmth it lends;
> It feeds the mouths where breathing ends.
> Beneath its wick the buried wake;
> The dead grow strong with each step you take.

The ghost claims the lamp was taken from its game to keep it weak. Its reaction should acknowledge the warning without disproving it.

### 4. Keeper awakening and escape

Taking the lamp breaks its cradle seal and ignites it. A short first-time cutscene shows a vast hand uncurling, dust falling, and the Keeper turning toward the flame. Reduced motion removes shaking/flashes. Retries skip the cutscene but allow replay from the casebook.

The exit ladder fails. The ghost opens a side gate:

> The stair is gone; the gate is wide.
> Come through before it looks inside.

The player carries both lamps but burns only one at a time:

| Lamp | Passages | Keeper |
| --- | --- | --- |
| Warm | Ordinary floor and pale bridges; shadow doors are closed | Slower, searching by sound |
| Black | Shadow doors/bridges appear; pale bridges disappear | Stronger and attracted to the flame |

Solid stone islands exist in both states. Swap there. Teach a safe shadow doorway, a pale bridge, then a route combining both. Inactive paths remain marked clearly enough to plan. Switching off a phase-dependent bridge is refused rather than causing an unexpected fall or softlock. Failure restarts the extraction and preserves evidence.

After escape, the black lantern appears on the main menu and the first cabinet connection breaks. Its glass can reflect the ghost.

### 5. The lamp points to Midnight Delivery

Turning on the menu lamp exposes a shadow road running into the Midnight Delivery card and a receipt:

> Where Hollow Lane runs out of road,
> Let blackened headlights bear your load.
> Beyond the place the maps deny,
> The railway's missing parcels lie.

The explicit destination is **Hollow Lane — dead end**. The ghost suggests the switch if the player stalls, then identifies the game more directly. Selecting the receipt starts an investigation drive without the ordinary shift timer.

### 6. Two finite-switch road puzzles

Black headlights reveal the missing road. Beyond it are two fully mapped causeways, each a **25-island network** with a **four-switch budget**. Gold solid roads require warm light; purple dashed roads require black light. Shape/labels accompany color. Islands are safe in both states.

> Where pale roads fade, let black roads gleam;
> On stone alone exchange the beam.
> Four changes only: choose your way;
> The shortest road may lead astray.

The player sees all roads before choosing a route. Some necessary segments travel backward on screen. Dead-end branches create planning decisions. Each authored map is solver-checked to have exactly one simple start-to-goal route within budget. Both road modes reverse in the second puzzle.

No steering precision, hidden map tiles, loop maze, or arbitrary time limit. The route UI is a tactical map in the first implementation. Checkpoints, restart, and saved puzzle state support experimentation. Meaningless revisits do not count as distinct solutions; the implementation rejects loops in a submitted route.

### 7. One package and the real post office

The depot contains one sealed parcel addressed to the city post office. Its smaller stamp shows a projector and railway platform. No multi-parcel sorting puzzle.

> Where Last Ride ends and scores grow still,
> The booth awaits beside the sill.
> Let city post receive this load;
> Its hidden chute completes the road.

Taking it opens a green return path to the normal city. Find the post office on North Street, northeast of the map. The ghost supplies a street or direction hint if needed. Stop and deliver. The post office sends the parcel through a railway chute to the projection booth.

The ghost gains radio speech and some navigation control. A second cabinet connection breaks. The next destination is explicitly Last Ride; no guessing what accepts the reel.

### 8. Restore a short recording

Use a direct shortcut to Last Ride's projection booth. The postal chute has deposited the parcel there; inside is a reel broken into four short pieces.

Arrange **arrival → signal → shadow → return** using clear frame numbers and captions. The film shows a character entering a game, a lamp starting, a shadow forming, and a keeper closing a shutter. It is ambiguous whether the keeper is protecting, imprisoning, or simply operating the cabinet. No early recording labels the ghost a monster.

A separate maintenance record explains the Halloween-week soul fragment and why it waited at the terminal. The ghost comments on the restored footage and repeats its character-restoration story.

This replaces the complex layered strip/timecode reconstruction puzzle.

### 9. Prepare the projector

A short practical repair: **seat lens → thread film → close shutter**. The service card states these operations clearly. Completing them restores the final control connection.

A resulting maintenance sheet records the old shutdown settings: **closed eye → downward flame → barred doorway**. Save it as evidence. Its purpose becomes fully clear in the final room, rather than immediately announcing a betrayal.

No projected half-symbol cipher or precision alignment remains. The cabinet is now accessible, but its final mirror passage is still closed.

## The final room

A figure, unlit black lamp mount, dark mirror, and a panel concealed in shadow. The mirror reflects the familiar arcade. Placing the lantern is safe.

The ghost's final request:

> Turn the flame toward the glass;
> Light the road and let me pass.

The player chooses lamp direction and ignition through physical controls, not a trust/distrust dialogue box. The warning predicted exactly this request: bring the lamp to the captive and light its route out.

### Release ending

Light the mirror and hold the beam. It becomes a passage to the arcade. The ghost crosses and appears to take over the website: games become windows, labels change, the ghost moves through the interface, and the cursor becomes the remaining lantern light.

**THANK YOU FOR PLAYING YOUR PART.**

Final line: **YOU SHOWED ME WHICH SIDE YOU WERE ON.**

The effect remains inside the site. Preserve an exit and resolve into an ending screen with replay.

### Containment ending

Keep the mirror dark and illuminate the ghost instead. It grows stronger, as warned, but its shadow reveals the panel. Use the saved shutdown settings: **closed eye → downward flame → barred doorway**. Close the revealed latch. The ghost objects, the flame dies, and the mirror darkens.

The menu returns with the fourth cabinet sealed and marked **DO NOT RESTORE.** A last message appears: **I can wait.**

Both endings are replayable from the final room. Neither erases the casebook.

## Ghost hints and automatic saves

The ghost grows more present at each milestone: terminal writing → local help → reflections/menu writing → delivery radio → whole-site speech and interface influence. It should react to progress and failed experiments, not repeat a single line.

Offer a nudge after roughly 60–90 active seconds without progress. Players can ask immediately. Escalate from observation to direct instruction to a demonstration. Pause hint timers while reading evidence. Critical practical help can use plain language when rhyme would obscure it. Hints never erase warnings or falsify saved evidence.

The **Casebook** saves automatically:

- Every acquired clue, illustration, warning, notice, receipt, and dialogue line.
- Original and reconstructed documents, film order, repair instructions, and shutdown settings.
- Items, route maps, solved traces, checkpoints, and ending history.
- Meaningful puzzle edits so refreshes do not discard work.

Opening evidence pauses active danger. Local saves happen immediately; signed-in players also sync to the existing **nerd-mini-events** Firebase project. Display pending/failed cloud status honestly. Scores are stored separately from trusted story milestones.

## Gating and build order

Build order: **home screen → Firebase/casebook → three games → ghost investigation → validation/polish**.

Required story order: **Last Ride contact → shadow → seal → lantern → escape → menu lamp → causeways → parcel → post office → film → projector → fourth game → ending**.

Use Firebase callable transactions for protected progression and server release time. A verified admin token may playtest early. A URL parameter, browser clock, guessed answer, or edited player-save document must not grant trusted story progress. The local preview service uses the same validators in a development-only loopback session.

The browser's visual game code is inspectable; this is not spoiler-proof encryption or a server-simulated anti-cheat system. Production rules and callable deployment must be verified before release. Preserve all old-event data and rules when adding the new collections.
