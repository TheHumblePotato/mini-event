# April -1st Mini Event — Designer's Guide

## File Structure
```
april-fools-event/
├── index.html         ← Hub page (login, leaderboard, launch)
├── index.css          ← Hub styles (matrix/terminal aesthetic)
├── index.js           ← Hub logic (auth, countdown, leaderboard)
├── game.html          ← Game page (all panels, UI)
├── game.css           ← Game styles
├── game.js            ← Game engine (rendering, puzzles, inventory)
├── game-data.js       ← ALL ROOMS, PUZZLES, ITEMS live here
└── sprites/           ← Your art goes here (see below)
```

---

## HOW TO ADD SPRITES

In `game-data.js`, every object and room has a `sprite` and `bgSprite` field.
Just set the path:

```js
// Room background
bg: '#0b1a0b',
bgSprite: 'sprites/room1_bg.png',  // 16:9, ~1280×720px

// Object sprite
{
  id: 'carpet',
  sprite: 'sprites/carpet.png',   // any size, drawn to object's w/h bounds
  ...
}
```

The engine will load images lazily and fall back to coloured placeholders.
Objects with sprites still show the 🔍/🔒 indicator icons in the corner.

### RECOMMENDED SPRITE SOURCES

**Free pixel art / illustration:**
- **itch.io** → search "escape room tileset", "dungeon interior", "top-down RPG"
  - "Cozy Interior" by Cup Nooble (free)
  - "Office Room Tileset" by Kenny (free)
  - "Horror Room" by various artists
- **OpenGameArt.org** → filter by "2D", "CC0"
- **Kenney.nl** → free game asset packs, very polished
- **CraftPix.net** → some free tiers
- **Freepik** → cartoon escape room illustrations

**For a hand-drawn / sketchy vibe:**
- Generate base sprites with Midjourney ("pixel art escape room puzzle, top-down 2D, dark academia")
- Then add green tint overlay in CSS to match the terminal aesthetic

**Terminal/retro aesthetic tips:**
- Everything works in monochrome. Even solid-colour rectangles look great.
- Add green scan lines over sprites with the CSS `::after` pseudo-element already in game.css
- The game uses `image-rendering: pixelated` — pixel art will look crisp

---

## PUZZLE IDEAS (to fill out the placeholder rooms)

### Room 1 — The Study (suggested theme: Dark Academia)

**Morse Lamp (already coded)**
- Lamp on desk flickers SUN in morse
- Player must type SUN to solve
- Hint: A morse code reference card under the carpet

**Symbol Panel (already coded)**
- 6 symbols: ☀️ 🌙 ⭐ 🌊 🌺 🔥
- Correct order: SUN MOON STAR (indices 0,1,2)
- Clue: Torn note says "The order is SUN, MOON, ___"

**Painting with Clock Hint (already coded)**
- Examining painting reveals "7:35" clue (shadow on clock tower)
- With UV light: reveals "THE TIME IS IN THE SHADOW"

**Easter Egg: The Bookshelf**
- Add a book titled "Advanced Morse Code" — clicking it adds a morse cheat sheet to inventory
- Add a book titled "ESCAPE ROOM DESIGN 101" — description: "Chapter 4: Players will always check under the carpet first."

---

### Room 2 — Storage Room

**Fuse Box Wiring (already coded)**
- RED → RED, BLUE → BLUE, YELLOW → YELLOW
- But labels are faded — player has to match by colour AND name
- Unlocks the power door

**UV Wall Writing**
- Blank wall + UV flashlight = hidden text: "CODE: _ _ _ _ (SUM OF ALL PARTS)"
- Players piece together: torn notes reference numbers, sum = 17 → code is 0017

**Potential addition: A locked drawer with a number**
```js
{
  id: 'locked_drawer', type: 'safe', label: 'Locked Drawer',
  x: 0.55, y: 0.55, w: 0.2, h: 0.12,
  code: '4',   // one digit of the 4-digit code
  description: 'A stuck drawer with a small combination lock.',
  contains: [{ item: 'number_note_4' }]
}
```

---

### Room 3 — The Lab

**Tile Slider (already coded)**
- 3×3 sliding puzzle
- Solution: 1-2-3 / 4-5-6 / 7-8-_ (standard)
- When solved: compartment opens → silver key falls out

**Clock Puzzle (already coded)**
- Set hands to 7:35 (from painting in Room 1)
- Correct → exit door unlocks

**Potential addition: A spectrometer puzzle**
```js
// Shine different coloured "filters" onto a light to get correct output colour
// Pure JS canvas: draw coloured circles, player drags them to mix
// Solution: Red + Blue = Purple → matches symbol on exit door
```

**Potential addition: A binary decoder board**
```js
// 8 switches (on/off), must match binary value of a number found in notes
// e.g., notes show "ASCII 65" → binary 01000001 → decode to 'A'
// unlocks: final_door
```

---

## APRIL FOOLS CHANGES (April 1-6)

The code already supports a full alternate room set (`fool_study`, `fool_storage`, `fool_lab`).

**Implemented changes:**
- All rooms have an orange/amber colour scheme instead of green
- Symbol panel order shifted (MOON, STAR, SUN instead of SUN, MOON, STAR)
- The rusty key is in the storage room shelf, not under the carpet
- The carpet contains a "NOT THE KEY" decoy key
- Painting shows 8:35 (wrong), but the correct answer is still 7:35
- UV wall hint is ambiguous ("SUM + 1... or is it - 1?") — but code is still 0017
- All descriptions have slightly unhinged flavour text
- The win message is different

**Additional April Fools ideas to add:**

1. **Upside-down text** — some notes render flipped (CSS `transform: rotate(180deg)`)
2. **The hint button lies** — first hint is always wrong, second is right
3. **Wrong leaderboard order** — April Fools leaderboard sorts by SLOWEST time (but players don't know until they see it)
4. **Red herring item** — "Definitely Not The Key" is in inventory but does nothing
5. **Morse lamp spells "NOM"** — but the correct solution is still "SUN" (noted in the object description if you look closely)
6. **The timer counts UP normally but is labeled "Time Remaining"**
7. **One puzzle instruction is backwards** ("Press the symbols in REVERSE order")
8. **Exit door description** — "This is not a door. (It is a door.)"

In `game-data.js`, `fool_*` rooms can be freely edited. The engine selects them automatically based on `isAprilFools()`.

---

## QoL IMPROVEMENTS TO ADD

### Save/Load Progress
```js
// Add to game.js saveState() / loadState()
// Use localStorage for progress (puzzles solved, items collected)
// Clear on win or explicit reset
function saveState() {
  localStorage.setItem('april_save', JSON.stringify({
    inventory: S.inventory,
    solvedPuzzles: S.solvedPuzzles,
    // ... etc
    timerElapsed: S.timer.elapsed,
    currentRoom: S.currentRoom
  }));
}
```

### Keyboard Shortcuts
- `I` → toggle inventory
- `N` → toggle notes
- `H` → hint
- `Escape` → close topmost panel
- `Arrow keys` → navigate rooms

### Mobile Support
- Touch-friendly keypad (already works)
- Swipe left/right to navigate rooms
- Tap-to-examine is already wired

### Sound Effects (Web Audio API)
- Key pickup: short chime
- Wrong code: buzz
- Door unlock: click/creak
- Puzzle solved: success melody
- Timer ticking: ambient loop

```js
// Simple beep:
function beep(freq = 440, dur = 0.1, type = 'sine') {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.start(); osc.stop(ctx.currentTime + dur);
}
```

### Completed Items Checklist (sidebar)
- Scratch off completed objectives as players progress
- "Searched all covers", "Solved morse lamp", etc.

---

## EASTER EGGS

1. **Konami Code** → on index page, Konami code changes all text to Comic Sans for 10 seconds
2. **The 4th wall book** — clicking the bookshelf 7 times reveals a book titled "You've clicked the bookshelf 7 times." description: "Was it worth it? (yes)"
3. **Hidden UV message in the lab** — with UV flashlight on the exit door: "Use the door, not the light." 
4. **Dr. F signature** — all torn notes are signed "— Dr. F". If you piece together who Dr. F is, a notice popup says "You figured it out. Too bad it doesn't help."
5. **April Fools date check** — if someone visits on April 2nd, a tiny note on the hub says "Yesterday was more interesting."
6. **The clock at 4:20** — setting the clock to 4:20 instead of 7:35 gives a special message: "Nice. But that's not it."
7. **Entering "1234" into any safe** — response: "Really? 1234? Come on."
8. **Entering "0000"** — response: "This is a bad password. Still wrong."
9. **Agent name "admin"** — leaderboard shows "admin" with time "00:00.00" already in first place (fake entry), description next to it: "Suspicious."

---

## LEADERBOARD FIREBASE SETUP

The game uses these Firestore collections:
- `april_users/{uid}` — user profiles (codename, created)
- `april_times_normal/{uid}` — one doc per user, normal run best time
- `april_times_fool/{uid}` — one doc per user, April Fools run time

**Firestore rules to add:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /april_users/{uid} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }
    match /april_times_normal/{uid} {
      allow read: if true;
      allow create: if request.auth.uid == uid;  // once only!
      allow update: if false;  // no updates — first time is final
    }
    match /april_times_fool/{uid} {
      allow read: if true;
      allow create: if request.auth.uid == uid;
      allow update: if false;
    }
  }
}
```

---

## PUZZLE SOLUTION SUMMARY (for your reference)

| Puzzle          | Solution       | Reward/Unlocks      |
|-----------------|----------------|---------------------|
| Morse Lamp      | SUN            | info only           |
| Symbol Panel    | ☀️ 🌙 ⭐ (0,1,2) | storage_door_inner  |
| Fuse Box        | match colours  | power_door          |
| Tile Slider     | 1-8, blank     | silver_key          |
| Lab Safe        | 0017           | red_wire            |
| Clock           | 7:35           | exit_door           |

**April Fools solutions:**
| Puzzle          | Solution          | Note                |
|-----------------|-------------------|---------------------|
| Fool Panel      | 🌙 ⭐ ☀️ (1,2,0)  | shifted by 1        |
| Fuse Box        | same              | labels look swapped |
| Lab Safe        | 0017              | "same... we think"  |
| Clock           | 7:35              | painting lied (8:35)|
| Rusty Key       | in storage shelf  | not under carpet!   |

---

## THEMING NOTES

The escape room theme is intentionally **ambiguous and slightly unsettling** — "Dark Academia Lab / Secret Office". Suggested visual direction:

- **Colour palette**: Deep forest green terminal text on near-black (#020a04)
- **Typography**: VT323 for headers/display, Share Tech Mono for body
- **Atmosphere**: Scanlines, subtle CRT flicker, matrix-rain background chars
- **Room 1 (Study)**: Warm wood tones, dim amber lamp glow, dusty greens
- **Room 2 (Storage)**: Cold industrial greys, wire oranges, metal shelves
- **Room 3 (Lab)**: Clinical blue-black, white accents, chrome equipment

For sprites, a consistent hand-drawn or pixel art style at ~64px grid works best. The game renders them with `image-rendering: pixelated` so crisp low-res art looks sharp.
