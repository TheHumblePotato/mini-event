# Midnight Arcade — Halloween 2026

## Local preview

Requires Node.js 22 or newer. No dependency installation is needed for the browser app.

```powershell
cd 'halloween 2026'
node server.mjs
```

Open http://127.0.0.1:4173. Settings → **Test unreleased games** enables early local play. The local story service is loopback-only, uses a server session, and validates the same puzzle transitions as production. This is a development server, not a production host. Do not expose or deploy it.

The public menu shows only three games until contact. Release times are midnight Pacific on October 29 (Grave Robber), October 30 (Midnight Delivery), and October 31 (Last Ride and ghost contact). Browser date controls only ordinary game availability. Production story release and progression are checked by Firebase server code.

```powershell
npm test
```

## Firebase

Uses the existing **nerd-mini-events** project's web configuration from the earlier events. Google sign-in is wired. Player records use a new `halloween2026Players/{uid}` collection; trusted stage progression lives separately in `halloween2026Ledger/{uid}`. Casebook and game progress save locally immediately, with account-linked Firestore synchronization when available. The interface reports failed or pending cloud saves instead of claiming success.

### Production setup still required

No Firebase administrative credentials were available during the local build, so cloud rules, Functions and admin claims have not been deployed or verified against the live project.

1. Use project-owner access and the official Firebase CLI to authenticate to **nerd-mini-events**.
2. Inspect the existing Firestore rules. Merge `firestore.rules.fragment` without deleting rules for older events. Audit broad wildcard allows: Firestore allow rules are additive, so another match must not permit client writes to the trusted ledger.
3. Install the Functions dependencies in `functions/`, then run `node sync-functions.mjs` in this directory.
4. Deploy only the new callable: `firebase deploy --only functions:halloween2026Advance --project nerd-mini-events`. Preserve unrelated existing functions and hosting configuration.
5. In Firebase Authentication, ensure Google sign-in is enabled and authorize the intended hosting domain. Local Google popup sign-in may also require `localhost` in Authorized domains.
6. Grant designated admins the `halloween2026Admin: true` custom claim using project-owner credentials. `functions/set-admin.mjs` is provided for an exact Firebase Auth UID and preserves existing claims. Sign out and back in after granting it.

Verified admins see **Test unreleased games** in Settings. Only a verified token claim bypasses the production story release date; a URL parameter or local-storage setting does not. Ordinary players cannot see the admin control.

The saved progress document is not an authority for story unlocks. Callable transactions validate the prerequisite stage and puzzle solution. Story code is browser-delivered and inspectable; this is not an anti-cheat or spoiler-proof encryption system. Introductory completion is an honest-client report, not a server simulation of the run. Score records are personal bests, not a tamper-proof competitive leaderboard.

Do not deploy the whole directory as a production Node server. Host the static app with the dev server, Functions sources, rules fragment, tests, and docs excluded. `firebase.json` includes static hosting exclusions, but deployment to the existing project's hosting site should be reviewed separately to avoid replacing older events.

## Files

- `app.js`, `index.html`, styles and `art.js`: home screen, navigation, account UI and original SVG illustrations.
- `games.js`: three Canvas games, keeper escape, and parcel delivery route.
- `story.js`: investigation, hints, saved documents and endings.
- `logic.js`: shared validators, seal geometry, and two finite-switch road maps.
- `firebase.js`, `state.js`: account/cloud saves and local recovery.
- `event-design.md`: current story and design.
- `IMPLEMENTATION.md`: implementation order and progress.

## Current rendering and controls

The live game now uses one stylized pixel/low-poly art direction. Generated realistic PNGs in `assets/` are unused experiments. Three.js 0.180.0 is vendored in `assets/vendor` with its MIT license, so local play needs no CDN engine download or build step.

- Grave Robber: 5120×4480 cemetery with 11 rooms/courts, catacomb passages and solid walls. There are 5–10 randomized active caches; each pickup places a replacement elsewhere. Finds include bandages, fuel and flares. The lamp dims with fuel and freezes ghosts in its beam. Two distant zombies start the run; ghost pressure and zombie numbers increase with time, finds and low fuel. Charging Gravebound appear later; crawlers and stone throwing are removed. Ghosts resist prolonged beam exposure and surge after a warning. The lamp stays useful at 75% but drains faster; zero fuel leaves the run alive in darkness. Six treasure types and scarce supplies keep risk high. Articulated pixel characters and continuous wall-aware lighting replace static actors and per-tile shadow wedges. M opens a detailed route map; T reopens the optional field guide. The lamp, seal, chamber, pickup and Keeper escape remain in the world.
- Midnight Delivery: scrolling 3D town, substepped collision physics, grip/handbrake, traffic, minimap. Investigation bridges are physically driven; the parcel returns to the town post office.
- Last Ride: 3D cave railway. Arrows change track, Down ducks, Space jumps, Shift/B brakes. The run is endless from the start, with no checkpoints. Rare GHOST letter discoveries lead to the terminal once; letters stop after contact. Three chances, buffered arcade jumps, shield/magnet/double-gold/brake power-ups and a haunted locomotive challenge provide progression. Rider, graves and ghost are fully 3D.
- The terminal projector and final chamber render in 3D rather than switching to prose pages.

Automated checks cover wall tunneling, contact resolution, frame-rate stability, cart body clearance, jump/duck rules, obstacle progression, route uniqueness and trusted stage order. These checks do not replace difficulty playtesting. Firebase production deployment remains required as described above.

Current gameplay references: [Grave Robber](GRAVE-ROBBER.md) and [Midnight Delivery](MIDNIGHT-DELIVERY.md). The latest pass adds late bellringers/mimics, a five-minute graveyard round and stereo effects, plus rebuilt delivery physics, roofs, curb bays, Halloween jobs and street events.

Delivery uses unlimited jobs in a 150-second shift across Hollow, Briarwick and haunted Rookhaven. Choose one of three offers with 1 / 2 / 3. Distance increases pay; ghost-city work pays double. Crooked streets, alleys, three-street closures and a winding bridge route increase the driving challenge. Ghost cars pursue through the city and bridges, ramming without direct damage. M opens the regional map; Z changes its scale. See MIDNIGHT-DELIVERY.md for controls and rules.

Latest delivery revision: direct Hollow–Rookhaven marsh causeway, second Hollow–Briarwick northern bridge, wider/gentler Rookhaven coast road and 18 ordinary traffic cars. Two delayed ghosts form behind the driver and telegraph side rams; each disappears after one collision, and chases can be lost. Fullscreen now dedicates the viewport to the game canvas. The top bar controls all audio; duplicate sound opt-ins and the pause interface are removed.

Current railway reference: [Last Ride](LAST-RIDE.md). Hollow now has moving lantern processions; Briarwick has alternating roadwork barriers and slippery cider patches. Rookhaven chasers keep pace with the higher car speeds, retain sight/memory longer and return more often, while preserving rear spawns and a recovery gap after impact.
