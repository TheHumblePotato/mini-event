# Nerd Mini Events

The homepage is the Christmas 2026 starter. Edit the announcement in `index.html` and the seasonal styles in `christmas/style.css`. Add Christmas activity pages and assets in `christmas/` and link them from the homepage.

## Local preview

With Node.js 22 or newer, run `npm start` and open http://127.0.0.1:4173/. The Past events links open each archived event.

## Archive and tooling

Each folder in `past/` contains one previous event. Midnight Arcade’s source, artwork, design notes and tests live together in `past/halloween 2026/`. Run `npm test` from the repository root to check its game logic.

The root preview server and Firebase configuration still support Midnight Arcade. Its cloud functions live in `functions/`. The predeploy script copies the archived progression logic into that package.

## Play Christmas 2026

Run `npm start` and choose **Play with local preview accounts**. Plant a tree as Alex S., copy its link, then switch the preview account to Alex Smith on that tree. Leave an ornament and switch back to see the signed decoration. Local preview data stays in that browser. School accounts use the regular **Deco My Tree** link and Firebase Google sign-in.

### Live play on GitHub Pages

Christmas uses Firebase Authentication and the default Cloud Firestore database in **nerd-mini-events**. GitHub Pages serves all application code. The only Firebase setup specific to this event is its Firestore rules.

1. In the Firebase console, open **Firestore Database → Rules**. Insert the contents of [the Christmas rules fragment](christmas/firestore.rules.fragment) inside the existing `match /databases/{database}/documents { … }` block. Keep the rules for other events.
2. Check existing wildcard rules before publishing. Firestore grants access if **any** matching rule allows it. An overlapping rule granting general access to signed-in users must exclude the Christmas subtree. Publish the merged rules.
3. Push the site changes to the branch GitHub Pages serves. Google sign-in must be enabled for the Pages hostname under **Authentication → Settings → Authorized domains**. If real-account sign-in already succeeds, that part is configured.
4. Open the site without the local demo flag. A new school account should see **Plant your tree**. Test a private link with a second school account.

Event records live under `/winterEvents/christmas2026`. Tree decorations and letter text are separate documents. Firestore checks signatures, the sender cooldown, and the reveal time at midnight Pacific. Compare new catalog values with the allowlists in the rules when adding options.

For local rules verification, start a Firestore emulator for project `demo-winter-tests` on loopback port 8492, then run `npm ci` and `npm run test:christmas:rules`. The test uses simulated school identities and a disposable emulator database. Set `CHRISTMAS_EMULATOR_PORT` to use another local port.
