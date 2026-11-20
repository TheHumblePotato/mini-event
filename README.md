# Nerd Mini Events

The homepage is the Christmas 2026 starter. Edit the announcement in `index.html` and the seasonal styles in `christmas/style.css`. Add Christmas activity pages and assets in `christmas/` and link them from the homepage.

## Local preview

With Node.js 22 or newer, run `npm start` and open http://127.0.0.1:4173/. The Past events links open each archived event.

## Archive and tooling

Each folder in `past/` contains one previous event. Midnight Arcade’s source, artwork, design notes and tests live together in `past/halloween 2026/`. Run `npm test` from the repository root to check its game logic.

The root preview server and Firebase configuration still support Midnight Arcade. Its cloud functions live in `functions/`. The predeploy script copies the archived progression logic into that package.

## Play Christmas 2026

Run `npm start` and choose **Play with local preview accounts**. Plant a tree as Alex S., copy its link, then switch the preview account to Alex Smith on that tree. Leave an ornament and switch back to see the signed decoration. Local preview data stays in that browser. School accounts use the regular **Deco My Tree** link and Firebase Google sign-in.

For live play, enable Google authentication on the hosting domain and deploy the christmas2026 callable from the configured Functions package alongside the site. Check the existing Firestore rules before launch: clients must have no direct access to christmas2026Trees, its cards, or christmas2026Members (including through broader wildcard grants). The callable uses server time to release messages on Christmas at midnight Pacific.
