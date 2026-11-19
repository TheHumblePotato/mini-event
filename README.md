# Nerd Mini Events

The homepage is the Christmas 2026 starter. Edit the announcement in `index.html` and the seasonal styles in `christmas/style.css`. Add Christmas activity pages and assets in `christmas/` and link them from the homepage.

## Local preview

With Node.js 22 or newer, run `npm start` and open http://127.0.0.1:4173/. The Past events links open each archived event.

## Archive and tooling

Each folder in `past/` contains one previous event. Midnight Arcade’s source, artwork, design notes and tests live together in `past/halloween 2026/`. Run `npm test` from the repository root to check its game logic.

The root preview server and Firebase configuration still support Midnight Arcade. Its cloud functions live in `functions/`. The predeploy script copies the archived progression logic into that package.
