// ===== game-data.js =====
// All room layouts, objects, puzzles, and items live here.
// Sprites: set obj.sprite = 'path/to/sprite.png' — renderer will draw them.
// For April Fools, GAME_DATA_FOOL overrides GAME_DATA for April 1-6.
//
// -----------------------------------------------------------------------
// OBJECT TYPES:
//   'cover'   — clickable surface you search (carpet, crate, painting)
//   'safe'    — locked container requiring code or key item
//   'door'    — leads to another room (requires code, key, or open flag)
//   'puzzle'  — interactive puzzle (morse, switches, sliders, wires…)
//   'pickup'  — static item sitting in room, just needs clicking to collect
//   'note'    — readable paper/screen with text
//   'prop'    — decorative, no interaction
//   'device'  — active device (clock, radio, machine — custom behaviour)
// -----------------------------------------------------------------------
// ITEM DEFINITION shape: { id, name, icon, description, useWith: ['objId'…] }
// -----------------------------------------------------------------------

// ===== ITEMS REGISTRY =====
const ITEMS = {
  // ---- Room 1 items ----
  rusty_key: {
    id: 'rusty_key', name: 'Rusty Key', icon: '🗝️',
    description: 'An old rusty key. The bow is shaped like a crescent moon.',
    useWith: ['storage_door']
  },
  torn_note_1: {
    id: 'torn_note_1', name: 'Torn Note (1/3)', icon: '📄',
    description: 'A torn piece of paper. It reads: "The order is SUN, MOON, ___"',
    useWith: []
  },
  red_wire: {
    id: 'red_wire', name: 'Red Wire', icon: '🔴',
    description: 'A short length of red wire stripped at both ends.',
    useWith: ['fusebox']
  },
  magnifying_glass: {
    id: 'magnifying_glass', name: 'Magnifying Glass', icon: '🔍',
    description: 'Good for examining things closely. Some things are only visible with this.',
    useWith: []  // passive — held item modifier
  },
  // ---- Room 2 items ----
  torn_note_2: {
    id: 'torn_note_2', name: 'Torn Note (2/3)', icon: '📄',
    description: 'Torn paper. It reads: "...STAR. The numbers add to ___"',
    useWith: []
  },
  silver_key: {
    id: 'silver_key', name: 'Silver Key', icon: '🗝️',
    description: 'A shiny silver key. A small "2" is etched into the handle.',
    useWith: ['exit_door']
  },
  uv_light: {
    id: 'uv_light', name: 'UV Flashlight', icon: '🔦',
    description: 'Reveals hidden writing when shone on surfaces.',
    useWith: [] // passive — changes what you see on hover
  },
  // ---- Room 3 items ----
  torn_note_3: {
    id: 'torn_note_3', name: 'Torn Note (3/3)', icon: '📄',
    description: 'Torn paper. It reads: "...seventeen. — Dr. F"',
    useWith: []
  },
  // ---- April Fools items ----
  upside_down_key: {
    id: 'upside_down_key', name: '???', icon: '🗝️',
    description: "A key that looks right but feels wrong. The label says 'NOT THE KEY'.",
    useWith: ['fool_door']
  },
};

// ===== PUZZLE DEFINITIONS =====
// Each puzzle has a type and solution. The game engine processes these.
const PUZZLES = {
  // Morse code device — flashes dots/dashes, player must decode
  morse_lamp: {
    id: 'morse_lamp',
    type: 'morse',
    label: 'Flickering Lamp',
    message: 'SUN',    // what it spells out
    hint: 'Watch the light pattern. Short flash = dot, long flash = dash.',
    reward: null       // solving just reveals the info — no item drop
  },

  // Symbol panel — press symbols in correct order (SUN, MOON, STAR)
  symbol_panel: {
    id: 'symbol_panel',
    type: 'sequence',
    label: 'Symbol Panel',
    symbols: ['☀️','🌙','⭐','🌊','🌺','🔥'],
    solution: [0, 1, 2],  // indices: SUN, MOON, STAR
    hint: 'Three of these symbols belong somewhere. In the right order.',
    reward: null,
    unlocks: 'storage_door_inner'
  },

  // Fusebox — connect coloured wires to matching terminals
  fusebox: {
    id: 'fusebox',
    type: 'wires',
    label: 'Fuse Box',
    // pairs: [left terminal colour → right terminal colour]
    pairs: [
      { colour: '#ff4141', label: 'RED' },
      { colour: '#4141ff', label: 'BLUE' },
      { colour: '#ffff41', label: 'YELLOW' },
    ],
    solution: { RED: 'RED', BLUE: 'BLUE', YELLOW: 'YELLOW' },
    hint: 'Match each wire to its correct terminal.',
    unlocks: 'power_door'
  },

  // Slider puzzle — arrange number tiles
  slider_tile: {
    id: 'slider_tile',
    type: 'slider',
    label: 'Tile Puzzle',
    size: 3,           // 3×3 grid
    solution: [1,2,3,4,5,6,7,8,0], // 0 = empty
    hint: 'Slide the tiles into the correct order.',
    reward: 'silver_key'
  },

  // Clock puzzle — set hands to correct time shown in a painting
  clock_puzzle: {
    id: 'clock_puzzle',
    type: 'clock',
    label: 'Antique Clock',
    solution: { h: 7, m: 35 }, // 7:35
    hint: 'The painting in Room 1 has a shadow that tells the time.',
    unlocks: 'final_door'
  },

  // April Fools only — everything is shifted by 1
  fool_panel: {
    id: 'fool_panel',
    type: 'sequence',
    label: '??? Panel',
    symbols: ['☀️','🌙','⭐','🌊','🌺','🔥'],
    solution: [1, 2, 0],  // MOON, STAR, SUN — shifted!
    hint: "Something's off about the order…",
    reward: null,
    unlocks: 'fool_storage'
  },
};

// ===== ROOM DEFINITIONS =====
// rooms[id].objects[] — drawn in order (back to front).
// Each object: { id, type, label, x, y, w, h, sprite?, colour?, ... }
// Connections: rooms[id].connections = { left:roomId, right:roomId, up:roomId, down:roomId }
// bg: background colour or sprite path

const ROOMS = {
  // -----------------------------------------------------------------------
  // ROOM 1 — "The Study"
  // A dusty study. Desk, bookshelf, painting, lamp, locked door.
  // -----------------------------------------------------------------------
  study: {
    id: 'study',
    label: 'The Study',
    bg: '#0b1a0b',
    bgSprite: null,        // set to 'sprites/room1_bg.png' once you have art
    connections: { right: 'storage' },
    objective: 'This room holds clues. Search carefully before moving on.',
    objects: [
      // Background prop — bookshelf (decorative)
      {
        id: 'bookshelf', type: 'prop', label: 'Bookshelf',
        x: 0.05, y: 0.15, w: 0.18, h: 0.65,
        colour: '#1a3320', sprite: null,
        description: 'Rows of dusty books. Nothing looks out of place.'
      },
      // Painting on wall — contains hidden clock time clue
      {
        id: 'painting', type: 'note', label: 'Old Painting',
        x: 0.68, y: 0.12, w: 0.2, h: 0.28,
        colour: '#2a1a08', sprite: null,
        description: "A painted courtyard at dusk. The clock tower's shadow falls at an odd angle. If you could work out the time… maybe 7:35?",
        uvText: 'THE TIME IS IN THE SHADOW'  // visible with UV light
      },
      // Carpet — cover object containing rusty key
      {
        id: 'carpet', type: 'cover', label: 'Dusty Carpet',
        x: 0.25, y: 0.62, w: 0.45, h: 0.22,
        colour: '#3d1f1f', sprite: null,
        description: 'A worn carpet. Lifting the corner reveals something underneath.',
        contains: [{ item: 'rusty_key' }],
        searched: false
      },
      // Desk — cover, contains torn note 1
      {
        id: 'desk', type: 'cover', label: 'Writing Desk',
        x: 0.32, y: 0.44, w: 0.32, h: 0.18,
        colour: '#2d1a0a', sprite: null,
        description: "A cluttered writing desk. There's a locked drawer and a crumpled note.",
        contains: [{ item: 'torn_note_1' }],
        searched: false
      },
      // Flickering lamp — morse code puzzle
      {
        id: 'morse_lamp_obj', type: 'puzzle', label: 'Flickering Lamp',
        x: 0.78, y: 0.48, w: 0.08, h: 0.22,
        colour: '#4d4d00', sprite: null,
        puzzleId: 'morse_lamp',
        description: 'The lamp flickers rhythmically. Dots and dashes — is it sending a message?'
      },
      // Symbol panel on wall — needs SUN MOON STAR
      {
        id: 'symbol_panel_obj', type: 'puzzle', label: 'Symbol Panel',
        x: 0.48, y: 0.08, w: 0.14, h: 0.24,
        colour: '#0d2e0d', sprite: null,
        puzzleId: 'symbol_panel',
        description: 'A panel with six engraved symbols. Three of them glow faintly.'
      },
      // Door to storage room — needs rusty key
      {
        id: 'storage_door', type: 'door', label: 'Side Door',
        x: 0.88, y: 0.28, w: 0.1, h: 0.46,
        colour: '#1a2e1a', sprite: null,
        locked: true, keyItem: 'rusty_key',
        description: "A wooden door with a keyhole. It's locked.",
        leadsTo: 'storage',
        lockedMessage: "The door is locked. You need a key.",
        unlockedMessage: "The door clicks open."
      },
    ]
  },

  // -----------------------------------------------------------------------
  // ROOM 2 — "Storage Room"
  // Accessed from study. Contains fusebox and hidden note.
  // -----------------------------------------------------------------------
  storage: {
    id: 'storage',
    label: 'Storage Room',
    bg: '#0a0f0a',
    bgSprite: null,
    connections: { left: 'study', right: 'lab' },
    objective: 'The fuse box looks important. And something is hidden on the wall.',
    objects: [
      // Fusebox on wall
      {
        id: 'fusebox_obj', type: 'puzzle', label: 'Fuse Box',
        x: 0.1, y: 0.18, w: 0.22, h: 0.35,
        colour: '#2a2a0a', sprite: null,
        puzzleId: 'fusebox',
        description: 'An old fuse box. Several wires are disconnected. Matching the colours might restore power.'
      },
      // Shelf — cover, contains torn note 2 and UV light
      {
        id: 'shelf', type: 'cover', label: 'Metal Shelf',
        x: 0.55, y: 0.2, w: 0.3, h: 0.5,
        colour: '#1a1a2a', sprite: null,
        description: 'Metal shelves packed with boxes. Searching through them…',
        contains: [{ item: 'torn_note_2' }, { item: 'uv_light' }],
        searched: false
      },
      // Wall with UV-hidden text
      {
        id: 'blank_wall', type: 'note', label: 'Blank Wall',
        x: 0.35, y: 0.05, w: 0.15, h: 0.55,
        colour: '#0d150d', sprite: null,
        description: 'Just a wall. Nothing visible.',
        uvText: 'CODE: _ _ _ _ (SUM OF ALL PARTS)'
      },
      // Power door — opened by fusebox
      {
        id: 'power_door', type: 'door', label: 'Power Door',
        x: 0.87, y: 0.22, w: 0.1, h: 0.5,
        colour: '#1a1a1a', sprite: null,
        locked: true, unlockedBy: 'fusebox',
        description: 'A heavy door. No power, no entry.',
        leadsTo: 'lab',
        lockedMessage: 'The door needs power. Maybe the fuse box?',
        unlockedMessage: 'The door hums and slides open.'
      },
    ]
  },

  // -----------------------------------------------------------------------
  // ROOM 3 — "The Lab"
  // Final room. Contains clock puzzle, safe with silver key, exit door.
  // -----------------------------------------------------------------------
  lab: {
    id: 'lab',
    label: 'The Lab',
    bg: '#070a14',
    bgSprite: null,
    connections: { left: 'storage' },
    objective: 'The final stretch. Find the exit.',
    objects: [
      // Slide puzzle board
      {
        id: 'tile_board', type: 'puzzle', label: 'Tile Puzzle Board',
        x: 0.08, y: 0.2, w: 0.25, h: 0.45,
        colour: '#0d1a2a', sprite: null,
        puzzleId: 'slider_tile',
        description: 'A sliding tile puzzle mounted on a board. Solve it to reveal a compartment.'
      },
      // Clock — puzzle
      {
        id: 'clock_obj', type: 'puzzle', label: 'Antique Clock',
        x: 0.52, y: 0.1, w: 0.12, h: 0.28,
        colour: '#1a1408', sprite: null,
        puzzleId: 'clock_puzzle',
        description: 'An antique clock with movable hands. The face is engraved with the words "Set the correct time."'
      },
      // Filing cabinet — cover, contains torn note 3
      {
        id: 'cabinet', type: 'cover', label: 'Filing Cabinet',
        x: 0.72, y: 0.25, w: 0.14, h: 0.45,
        colour: '#1a1a2a', sprite: null,
        description: "A filing cabinet. Most files are irrelevant, but one drawer has a torn piece of paper.",
        contains: [{ item: 'torn_note_3' }],
        searched: false
      },
      // Safe — 4-digit code (sum of all parts from notes = 17, clue says "adds to ___")
      {
        id: 'lab_safe', type: 'safe', label: 'Wall Safe',
        x: 0.35, y: 0.15, w: 0.12, h: 0.22,
        colour: '#2a1a0a', sprite: null,
        locked: true, code: '0017',
        description: 'A wall safe with a 4-digit keypad. What could the combination be?',
        contains: [{ item: 'red_wire' }]   // extra item for the fusebox side-puzzle
      },
      // Exit door — opened by clock puzzle (correct time set)
      {
        id: 'exit_door', type: 'door', label: 'Exit',
        x: 0.88, y: 0.2, w: 0.1, h: 0.55,
        colour: '#0a2a0a', sprite: null,
        locked: true, unlockedBy: 'clock_puzzle',
        description: 'The way out. It needs the right time set on the clock.',
        leadsTo: '__EXIT__',
        lockedMessage: 'Sealed tight.',
        unlockedMessage: '🚪 The exit door swings open!'
      },
    ]
  },

  // -----------------------------------------------------------------------
  // APRIL FOOLS ROOMS (swapped in when isAprilFools is true)
  // Same structure but slightly broken/wrong
  // -----------------------------------------------------------------------
  fool_study: {
    id: 'fool_study',
    label: 'The Study (?)',
    bg: '#1a0500',
    bgSprite: null,
    connections: { right: 'fool_storage' },
    objective: "Something's wrong. The clues are there, but things don't add up.",
    _aprilFoolsNote: "All codes are shifted by 1. The door key is in a wrong room. The painting shows 8:35 not 7:35. Morse spells 'NOM'.",
    objects: [
      {
        id: 'bookshelf', type: 'prop', label: 'Bookshelf (?)',
        x: 0.05, y: 0.15, w: 0.18, h: 0.65,
        colour: '#2a0a00', sprite: null,
        description: "Rows of books. One title reads 'EVERYTHING IS FINE'. Another says 'THIS IS FINE'."
      },
      {
        id: 'painting', type: 'note', label: 'Old Painting',
        x: 0.68, y: 0.12, w: 0.2, h: 0.28,
        colour: '#2a1a08', sprite: null,
        description: "The clock tower shows 8:35. But something feels like it should be 7:35…",
        uvText: 'THE TIME IS WRONG (BY 1)'
      },
      {
        id: 'carpet', type: 'cover', label: 'Dusty Carpet',
        x: 0.25, y: 0.62, w: 0.45, h: 0.22,
        colour: '#3d1f1f', sprite: null,
        description: 'Lifting the corner reveals… a note that says "the key is NOT here".',
        contains: [{ item: 'upside_down_key' }],  // wrong key!
        searched: false
      },
      {
        id: 'desk', type: 'cover', label: 'Writing Desk',
        x: 0.32, y: 0.44, w: 0.32, h: 0.18,
        colour: '#2d1a0a', sprite: null,
        description: "A note reads: 'The order is MOON, STAR, ___'",
        contains: [{ item: 'torn_note_1' }],
        searched: false
      },
      {
        id: 'morse_lamp_obj', type: 'puzzle', label: 'Flickering Lamp',
        x: 0.78, y: 0.48, w: 0.08, h: 0.22,
        colour: '#4d2200', sprite: null,
        puzzleId: 'morse_lamp',  // still spells SUN but note says "shifted"
        description: 'The lamp flickers. The pattern feels slightly… wrong.'
      },
      {
        id: 'symbol_panel_obj', type: 'puzzle', label: '??? Panel',
        x: 0.48, y: 0.08, w: 0.14, h: 0.24,
        colour: '#2e0d0d', sprite: null,
        puzzleId: 'fool_panel',
        description: 'A panel with symbols. The glowing ones seem different from before.'
      },
      {
        id: 'fool_door', type: 'door', label: 'Side Door',
        x: 0.88, y: 0.28, w: 0.1, h: 0.46,
        colour: '#2e1a0a', sprite: null,
        locked: true, keyItem: 'rusty_key',  // rusty key is in fool_storage!
        description: "It's locked. The key must be somewhere else…",
        leadsTo: 'fool_storage',
        lockedMessage: "The door is locked. The key isn't under the carpet...",
        unlockedMessage: "It opens."
      },
    ]
  },

  fool_storage: {
    id: 'fool_storage',
    label: 'Storage Room (?)',
    bg: '#0a0500',
    bgSprite: null,
    connections: { left: 'fool_study', right: 'fool_lab' },
    objective: 'Wires everywhere. The code on the wall is partially erased.',
    objects: [
      {
        id: 'fusebox_obj', type: 'puzzle', label: 'Fuse Box',
        x: 0.1, y: 0.18, w: 0.22, h: 0.35,
        colour: '#2a1a00', sprite: null,
        puzzleId: 'fusebox',
        description: 'The fuse box. Labels are peeling off. RED and BLUE seem swapped.'
      },
      {
        id: 'shelf', type: 'cover', label: 'Metal Shelf',
        x: 0.55, y: 0.2, w: 0.3, h: 0.5,
        colour: '#1a1a00', sprite: null,
        description: 'Searching reveals the REAL rusty key (hiding behind a fake one).',
        contains: [{ item: 'rusty_key' }, { item: 'torn_note_2' }, { item: 'uv_light' }],
        searched: false
      },
      {
        id: 'blank_wall', type: 'note', label: 'Blank Wall',
        x: 0.35, y: 0.05, w: 0.15, h: 0.55,
        colour: '#0d0800', sprite: null,
        description: 'Just a wall.',
        uvText: 'CODE: _ _ _ _ (SUM + 1... or is it - 1?)'
      },
      {
        id: 'power_door', type: 'door', label: 'Power Door',
        x: 0.87, y: 0.22, w: 0.1, h: 0.5,
        colour: '#1a1100', sprite: null,
        locked: true, unlockedBy: 'fusebox',
        description: 'Power door.',
        leadsTo: 'fool_lab',
        lockedMessage: 'Needs power.',
        unlockedMessage: 'Opens... but backwards somehow.'
      },
    ]
  },

  fool_lab: {
    id: 'fool_lab',
    label: 'The Lab (?)',
    bg: '#07040a',
    bgSprite: null,
    connections: { left: 'fool_storage' },
    objective: 'Almost there. The clock is wrong. Trust the math.',
    objects: [
      {
        id: 'tile_board', type: 'puzzle', label: 'Tile Puzzle',
        x: 0.08, y: 0.2, w: 0.25, h: 0.45,
        colour: '#14071a', sprite: null,
        puzzleId: 'slider_tile',
        description: 'Same tile puzzle. Same solution. Probably.'
      },
      {
        id: 'clock_obj', type: 'puzzle', label: 'Antique Clock',
        x: 0.52, y: 0.1, w: 0.12, h: 0.28,
        colour: '#1a1400', sprite: null,
        puzzleId: 'clock_puzzle',
        description: 'The clock reads "Set the correct time." The painting said 8:35. The painting is wrong. The answer is 7:35.'
      },
      {
        id: 'cabinet', type: 'cover', label: 'Filing Cabinet',
        x: 0.72, y: 0.25, w: 0.14, h: 0.45,
        colour: '#0a0a14', sprite: null,
        description: "A torn note. It reads: '...seventeen. Probably. — Dr. F'",
        contains: [{ item: 'torn_note_3' }],
        searched: false
      },
      {
        id: 'lab_safe', type: 'safe', label: 'Wall Safe',
        x: 0.35, y: 0.15, w: 0.12, h: 0.22,
        colour: '#2a1500', sprite: null,
        locked: true, code: '0017',  // same code — trust the math
        description: "A wall safe. The sticker on it says 'same code as normal... we think'",
        contains: [{ item: 'red_wire' }]
      },
      {
        id: 'exit_door', type: 'door', label: 'Exit (?)',
        x: 0.88, y: 0.2, w: 0.1, h: 0.55,
        colour: '#0a1a00', sprite: null,
        locked: true, unlockedBy: 'clock_puzzle',
        description: 'The exit. Set the clock to 7:35.',
        leadsTo: '__EXIT__',
        lockedMessage: 'Not yet.',
        unlockedMessage: '🚪 You escaped... the wrong room?'
      },
    ]
  },
};

// ===== TUTORIAL STEPS =====
const TUTORIAL_STEPS = [
  {
    title: 'Welcome to the Escape Room',
    html: `<h2>Welcome, Agent.</h2>
    <p>You've been locked in. Your goal: <strong style="color:var(--accent)">escape</strong>.</p>
    <p>This tutorial will walk you through everything. Press <strong>Next</strong> to continue or <strong>Skip</strong> to jump straight in.</p>`
  },
  {
    title: 'Looking Around',
    html: `<h2>Looking Around</h2>
    <p>Move between rooms using the <span class="tut-key">◀ ▶ ▲ ▼</span> arrows at the edges of the screen.</p>
    <p>Each room has a name shown at the top. The sidebar shows your current <strong>objective</strong>.</p>
    <div class="tut-demo">📌 Room navigation buttons only appear when that direction has a connected room.</div>`
  },
  {
    title: 'Interacting with Objects',
    html: `<h2>Interacting</h2>
    <p>Click on any object in the room to examine it. A popup will appear with a description.</p>
    <p>Objects can be:</p>
    <ul style="margin-left:16px;line-height:2;">
      <li>🔍 <strong>Searchable</strong> — carpets, boxes, desks</li>
      <li>🗝️ <strong>Locked</strong> — safes and doors</li>
      <li>📝 <strong>Readable</strong> — notes and signs</li>
      <li>🔧 <strong>Puzzles</strong> — interactive challenges</li>
    </ul>`
  },
  {
    title: 'Inventory & Bulletin Board',
    html: `<h2>Inventory</h2>
    <p>Items you pick up go into your <span class="tut-key">🎒 Inventory</span>.</p>
    <p>Open the <strong>Bulletin Board</strong> inside inventory to:</p>
    <ul style="margin-left:16px;line-height:2;">
      <li>📝 Add sticky notes</li>
      <li>🔗 Draw connection strings between clues</li>
      <li>🗑 Erase connections</li>
    </ul>
    <p>You can also take free-form notes in the <span class="tut-key">📋 Notes</span> panel.</p>`
  },
  {
    title: 'Using Items',
    html: `<h2>Using Items</h2>
    <p>When you examine an object, if you have a compatible item, a <strong style="color:var(--amber)">"Use [item]"</strong> button will appear.</p>
    <p>Keys unlock doors and safes. The right item at the right object is key (pun intended).</p>
    <div class="tut-demo">💡 If you're stuck, click <span class="tut-key">💡 Hint</span> in the top bar for a nudge.</div>`
  },
  {
    title: 'Your Time',
    html: `<h2>The Timer</h2>
    <p>The moment you dismiss this tutorial, the timer starts. ⏱️</p>
    <p>Your time is recorded <strong>once</strong> — on first completion only. Replays don't count.</p>
    <p>Fastest times appear on the <strong>Leaderboard</strong>.</p>
    <div class="tut-demo" style="color:var(--amber)">⚠️ On April 1st, things may be… slightly different.</div>`
  },
];

// ===== HINT SYSTEM =====
// Ordered hint chain per room — each call reveals next hint
const HINTS = {
  study: [
    "Start by searching everything you can click on.",
    "The carpet hides something. So does the desk.",
    "The lamp is sending a message in morse code. Short flash = dot, long flash = dash.",
    "The symbol panel needs three symbols in order. Read the torn note carefully.",
    "SUN, MOON, STAR — in that order.",
  ],
  storage: [
    "The fuse box needs its wires reconnected. Match colours.",
    "Shine the UV light on the blank wall.",
    "The wall says the code is a sum. Check your notes.",
    "After fixing the fuse box, the power door will open.",
  ],
  lab: [
    "The tile puzzle reveals a compartment when solved.",
    "The clock needs to be set to the time shown in the study's painting.",
    "The safe code is 0017 — seventeen, as the note says.",
    "Set the clock to 7:35 to open the exit.",
  ],
  fool_study: [
    "Things are slightly off. Read everything twice.",
    "The key isn't under the carpet this time.",
    "The symbol order has shifted by one position.",
    "Check the storage room first — the key is hiding there.",
  ],
  fool_storage: [
    "The real rusty key is on the shelf, behind a decoy.",
    "The UV wall hint is... ambiguous. Trust the math.",
    "The fuse box works the same way regardless.",
  ],
  fool_lab: [
    "The painting says 8:35 but it's wrong. Trust your memory.",
    "The clock answer is still 7:35. The painting lied.",
    "The safe code is still 0017. Some things don't change.",
  ],
};

// Expose everything globally
window.GAME_ROOMS = ROOMS;
window.GAME_ITEMS = ITEMS;
window.GAME_PUZZLES = PUZZLES;
window.GAME_TUTORIAL = TUTORIAL_STEPS;
window.GAME_HINTS = HINTS;
