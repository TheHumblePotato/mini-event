# Implementation plan

## Order

1. Start screen: responsive Halloween arcade with three cabinets, controls, release state, and no fourth-game placeholder.
2. Persistence: reuse `nerd-mini-events` Firebase Google sign-in, isolated 2026 player records, local recovery, honest sync state, casebook.
3. Games: Grave Robber (treasure/fuel/entities), Midnight Delivery (driving/deliveries/crashes), Last Ride (2D runner/brakes/duck/ghost encounter).
4. Investigation: server-validated stage gates, emblem trace, black lamp/keeper, finite-switch road network, package delivery, simplified archive, endings.
5. Verification: game logic tests, unique lamp-route solver, backend gate tests, browser walkthrough, responsive and keyboard checks.

## Accepted changes

- Chains weaken during Halloween week. A weak soul fragment escapes but cannot travel; it waits at Last Ride's terminal. No broken-bell origin.
- Ghost claims it was a character in a removed fourth game and its assets were scattered. Reclaiming them restores that game. The assets actually served containment; its claim mixes truth and deception.
- Trace an emblem on a 5×5 dot grid. Match undirected edges, accepting reverse trace and any start point. No numbered-stud puzzle.
- Cradle text is hidden on an inspectable underside; the main warning remains saved automatically.
- Lamp-route network is larger, fully mapped, and has a strict switch budget. Generate or author it, then verify exactly one simple solution over `(node, lamp, switches)` states. A solution may move backward on screen.
- Depot contains one package. A magic return lane leads to the normal city. Find its post office and deliver it; the postal chute transports it to Last Ride's projection booth.
- Archive puzzles use a short film sequence and a concrete repair task. They reveal ambiguous containment history without announcing that the ghost is evil.
- Preserve the two final endings.

## Runtime and deployment

Buildless ES modules, Canvas 2D games, DOM investigation scenes. `node server.mjs` serves local development and provides an explicit loopback-only development story service. The preview bypass is never enabled through a production URL parameter or local-storage flag. Production uses Firebase callable Functions for protected milestones and Firestore for player saves. Server credentials and deployed rules/functions are required for production enforcement; do not claim they are deployed until verified.

## Progress

- [x] Start screen
- [x] Firebase client and casebook (live deployment still required)
- [x] Three playable games
- [x] Investigation and endings
- [x] Nine automated tests, HTTP progression smoke check, and browser launch/checkpoint/contact/trace/save checks
- [ ] Deploy and verify Firebase rules, callable function, and production admin claims with project-owner credentials
- [ ] Playtest tuning and remaining visual polish

## Home-screen feedback incorporated

Dark purple forest, ghost seal in the header, drifting fog/bats, restrained flicker, reduced motion, minimal copy, no footer/banner/ticket slogan. Releases: October 29/30/31 at midnight Pacific. Local and verified-admin settings expose early playtests.
