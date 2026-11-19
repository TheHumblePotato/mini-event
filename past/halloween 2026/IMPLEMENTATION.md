# Implementation plan

## Order

1. Start screen: responsive Halloween arcade with three cabinets, controls, release state, and no fourth-game placeholder.
2. Persistence: reuse `nerd-mini-events` Firebase Google sign-in, isolated 2026 player records, local recovery, honest sync state, casebook.
3. Games: Grave Robber (treasure/fuel/entities), Midnight Delivery (driving/deliveries/crashes), Last Ride (2D runner/brakes/duck/ghost encounter).
4. Investigation: server-validated stage gates, emblem trace, black lamp/Grave Robber escape, Gloaming deliveries, Last Ride paper stack, endings.
5. Verification: game logic tests, unique lamp-route solver, backend gate tests, browser walkthrough, responsive and keyboard checks.

## Accepted changes

- Chains weaken during Halloween week. A weak soul fragment escapes but cannot travel; it waits at Last Ride's terminal. No broken-bell origin.
- Ghost claims it was a character in a removed fourth game and its assets were scattered. Reclaiming them restores that game. The assets actually served containment; its claim mixes truth and deception.
- Trace an emblem on a 5×5 dot grid. Match undirected edges, accepting reverse trace and any start point. No numbered-stud puzzle.
- Cradle text is hidden on an inspectable underside; the main warning remains saved automatically.
- Gloaming is an island city reached by a physical highway bridge; complete three deliveries there and return the parcel to Hollow's post office.
- The parcel leads to a five-page hunt in Last Ride, with page odds decreasing across the stack. The stack unlocks a first-person 3D mirror scene; its two lamp choices drive the release and containment endings. Paper text remains intentionally TBD.
- Preserve the two final endings.

## Runtime and deployment

Buildless ES modules, Canvas 2D games, DOM investigation scenes. `node server.mjs` serves local development and provides an explicit loopback-only development story service. The preview bypass is never enabled through a production URL parameter or local-storage flag. Production uses Firebase callable Functions for protected milestones and Firestore for player saves. Server credentials and deployed rules/functions are required for production enforcement; do not claim they are deployed until verified.

## Progress

- [x] Start screen
- [x] Firebase client and casebook (live deployment still required)
- [x] Three playable games
- [x] Investigation and endings
- [x] Automated tests and progression checks
- [ ] Deploy and verify Firebase rules, callable function, and production admin claims with project-owner credentials
- [ ] Playtest tuning and remaining visual polish

## Home-screen feedback incorporated

Dark purple forest, ghost seal in the header, drifting fog/bats, restrained flicker, reduced motion, minimal copy, no footer/banner/ticket slogan. Releases: October 29/30/31 at midnight Pacific. Local and verified-admin settings expose early playtests.
