# Nerd Mini Events

The [homepage](index.html) opens the current Christmas mini event and links to four archived events. GitHub Pages serves the site directly from the repository.

| Location | Contents |
| --- | --- |
| [christmas/](christmas/) | Deco My Tree page, styles and UI entry point. Scene rendering lives in `scene/`, menus and letters in `screens/`, school-account and Firestore code in `data/`, and textures in `assets/`. |
| [past/](past/) | Playable archived events, including their original pages and required assets. |
| [_dev/christmas/](_dev/christmas/) | Project brief, local preview accounts, tests and the standalone Christmas rules fragment. |
| [_dev/past/](_dev/past/) | Archived design notes, tests, playtest pages, art experiments and the Halloween backend. |
| [firestore.rules](firestore.rules) | Complete rules file for the shared Firebase project. |

## Local preview

With Node.js 22 or newer, run `npm start` from the repository root and open [the local preview](http://127.0.0.1:4173/). Run `npm run test:christmas` for the current event or `npm test` to include the archived game suite. The [Midnight Arcade development notes](_dev/past/halloween-2026/README.md) cover the archived backend and browser playtests.

## Play Christmas 2026

Run `npm start` and choose **Play with local preview accounts**. Plant a tree as Alex S., copy its link, then switch the preview account to Alex Smith on that tree. Leave an ornament and switch back to see the signed decoration. Local preview data stays in that browser. School accounts use the regular **Deco My Tree** link and Firebase Google sign-in.

### Live play on GitHub Pages

Christmas uses Firebase Authentication and the default Cloud Firestore database in **nerd-mini-events**. GitHub Pages serves all application code. The only Firebase setup specific to this event is its Firestore rules.

1. In **nerd-mini-events → Firestore Database → Rules**, paste the complete [firestore.rules](firestore.rules) file and click **Publish**. It includes the Halloween player, ledger and leaderboard rules, the retired collection restrictions, and the active Christmas rules. If you have added other production rules since this file was prepared, merge those before publishing.
2. Push the site changes to the branch GitHub Pages serves. Google sign-in must be enabled for the Pages hostname under **Authentication → Settings → Authorized domains**. If real-account sign-in already succeeds, that part is configured.
3. Open the site without the local demo flag. A new school account should see **Plant your tree**. Test a private link with a second school account.

Event records live under `/winterEvents/christmas2026`. Tree decorations and letter text are separate documents. Firestore checks signatures, the sender cooldown, and the reveal time at midnight Pacific. Compare new catalog values with the allowlists in the rules when adding options.

For local rules verification, start a Firestore emulator for project `demo-winter-tests` on loopback port 8492, then run `npm ci` and `npm run test:christmas:rules`. The test uses simulated school identities and a disposable emulator database. Set `CHRISTMAS_EMULATOR_PORT` to use another local port.
