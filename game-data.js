// ===== game-data.js =====
// Room layouts, objects, puzzles, items.
//
// OBJECT TYPES:
//   'cover'   — searchable surface (desk, crate, carpet)
//   'safe'    — locked container requiring code
//   'door'    — leads to another room (locked until condition met)
//   'puzzle'  — interactive puzzle element
//   'pickup'  — static item on floor/shelf, click to collect
//   'note'    — readable text
//   'prop'    — decorative, no interaction
//   'device'  — active device with animation (linked to puzzle elsewhere)
//   'window'  — shows animated scene, no interaction

// ===== ITEMS REGISTRY =====
const ITEMS = {
  // ---- Room 1 (Study) ----
  rusty_key: {
    id: 'rusty_key', name: 'Rusty Key', icon: '🗝️',
    description: 'An old rusty key. The bow is shaped like a crescent moon. The teeth look like they fit a small lock.',
    useWith: ['storage_door']
  },
  crumpled_note: {
    id: 'crumpled_note', name: 'Crumpled Note', icon: '📄',
    description: 'A crumpled note. It reads:\n\n"The order matters. Watch the light, then look at the stars.\n— F"',
    useWith: []
  },
  uv_light: {
    id: 'uv_light', name: 'UV Flashlight', icon: '🔦',
    description: 'A small UV flashlight. It makes certain inks glow. Might reveal hidden writing.',
    useWith: []
  },
  // ---- Room 2 (Storage) ----
  torn_note_a: {
    id: 'torn_note_a', name: 'Torn Paper (A)', icon: '📄',
    description: 'A torn piece of paper. Part of it is missing. It reads:\n\n"The clock in the lab… set it to the time in the painting. And remember: the code is the sum of the sequence."',
    useWith: []
  },
  wire_fragment: {
    id: 'wire_fragment', name: 'Wire Fragment', icon: '🔌',
    description: 'A short red wire with stripped ends. Could complete a circuit.',
    useWith: ['fusebox_obj']
  },
  // ---- Room 3 (Lab) ----
  torn_note_b: {
    id: 'torn_note_b', name: 'Torn Paper (B)', icon: '📄',
    description: 'The other half of the torn paper. It reads:\n\n"Sequence values: SUN=3, MOON=7, STAR=5. Add them up.\n— Dr. F"',
    useWith: []
  },
  lab_keycard: {
    id: 'lab_keycard', name: 'Lab Keycard', icon: '💳',
    description: 'A red keycard. "EMERGENCY ACCESS" is stamped on it. This unlocks something.',
    useWith: ['exit_door']
  },
  // ---- April Fools items ----
  backwards_key: {
    id: 'backwards_key', name: 'Suspicious Key', icon: '🗝️',
    description: 'A key. The label reads "DEFINITELY THE RIGHT KEY (it is not)".',
    useWith: ['fool_door']
  },
  fool_note: {
    id: 'fool_note', name: 'Suspiciously Helpful Note', icon: '📄',
    description: 'A note reading:\n\n"Everything is normal. The sequence is STAR, SUN, MOON. The code is 15. The clock is 8:35. Trust this note. — Definitely Dr. F"',
    useWith: []
  },
};

// ===== PUZZLE DEFINITIONS =====
const PUZZLES = {
  // Morse lamp — flashes SUN in morse. Player decodes it.
  // This is displayed as a 'device' in the study but puzzle input is in storage
  morse_lamp: {
    id: 'morse_lamp',
    type: 'morse',
    label: 'Morse Signal',
    message: 'SUN',
    hint: 'Short flash = dot (·), long flash = dash (—). Each letter is separated by a pause.'
  },

  // Symbol panel — press SUN, MOON, STAR in that order
  symbol_panel: {
    id: 'symbol_panel',
    type: 'sequence',
    label: 'Symbol Panel',
    symbols: ['☀️','🌙','⭐','🌊','🌺','🔥'],
    solution: [0, 1, 2],  // SUN=0, MOON=1, STAR=2
    unlocks: 'storage_door'
  },

  // Fusebox in storage — wire puzzle
  fusebox: {
    id: 'fusebox',
    type: 'wires',
    label: 'Fuse Box',
    pairs: [
      { colour: '#ff4141', label: 'RED' },
      { colour: '#4141ff', label: 'BLUE' },
      { colour: '#ffff41', label: 'YELLOW' },
    ],
    solution: { RED: 'RED', BLUE: 'BLUE', YELLOW: 'YELLOW' },
    unlocks: 'power_door'
  },

  // Slider puzzle in lab — reveals hidden keycard compartment
  slider_tile: {
    id: 'slider_tile',
    type: 'slider',
    label: 'Tile Puzzle',
    size: 3,
    solution: [1,2,3,4,5,6,7,8,0],
    reward: 'lab_keycard'
  },

  // Clock puzzle — set to 7:35 (from painting in study)
  clock_puzzle: {
    id: 'clock_puzzle',
    type: 'clock',
    label: 'Antique Clock',
    solution: { h: 7, m: 35 },
    unlocks: 'lab_safe_door'
  },

  // Safe in lab — code 0015 (SUN=3+MOON=7+STAR=5 = 15, zero-padded)
  // Clue from torn_note_a (sum) + torn_note_b (values)
  lab_safe_combo: {
    id: 'lab_safe_combo',
    type: 'safe_code',
    label: 'Safe',
    code: '0015',
    reward: null // keycard already from slider
  },

  // April Fools: symbol order is wrong
  fool_panel: {
    id: 'fool_panel',
    type: 'sequence',
    label: '??? Panel',
    symbols: ['☀️','🌙','⭐','🌊','🌺','🔥'],
    solution: [2, 0, 1],  // STAR, SUN, MOON — per fool_note (wrong)... actual answer differs
    // fool_note says STAR SUN MOON. That IS the correct fool answer.
    unlocks: 'fool_storage_door'
  },

  // Fool clock — painting says 8:35 but correct answer is still 7:35
  fool_clock: {
    id: 'fool_clock',
    type: 'clock',
    label: 'Clock (something feels off)',
    solution: { h: 7, m: 35 },
    unlocks: 'fool_lab_safe_door'
  },

  fool_safe_combo: {
    id: 'fool_safe_combo',
    type: 'safe_code',
    label: 'Safe',
    code: '0015',  // same code — fool_note says 15 which is actually right
    reward: null
  },
};

// ===== EASTER EGGS =====
// These are hidden interactions that reveal fun messages
const EASTER_EGGS = {
  bookshelf_code: {
    trigger: 'bookshelf_click_5',  // clicking bookshelf 5 times
    message: '"The books here are organized by colour, not subject. One book is upside down. It\'s called \'How to Escape a Room\'."',
    foolMessage: '"All the books are upside down. One is right-side up. It\'s called \'How to Stay In a Room\'."'
  },
  painting_close: {
    trigger: 'painting_uv',  // using UV light on painting
    message: '"Under the UV light, a small inscription in the corner reads: \'This painting was hung on a Tuesday. That\'s irrelevant. The clock is what matters. — Dr. F\'"',
    foolMessage: '"The UV light reveals: \'DO NOT TRUST THE PAINTING. THE CLOCK IN IT IS WRONG. YOU HAVE BEEN WARNED. — Dr. F\'"'
  },
  safe_wrong_code: {
    trigger: 'safe_wrong_3',  // entering wrong code 3 times
    message: '"After the third wrong attempt, a small speaker crackles: \'Hmm. Still wrong. Take your time.\'"',
    foolMessage: '"After the third wrong attempt: \'Ha. No. Try again. The number you want starts with zero.\'"'
  },
  desk_secret: {
    trigger: 'desk_searched',  // after searching desk
    message: '"In the back of the drawer, scratched into the wood: \'If you\'re reading this you found my scratch. Hi. — F\'"',
    foolMessage: '"Scratched into the wood: \'Hi. No the code isn\'t here. Stop looking at the wood.\'"'
  }
};

// ===== ROOM DEFINITIONS =====
const ROOMS = {
  // -----------------------------------------------------------------------
  // ROOM 1 — "The Study"
  // Dusty academic study. Flickering lamp (morse device), symbol panel on wall,
  // painting (clock time clue + UV easter egg), bookshelf, desk, carpet.
  // Goal: get rusty key (carpet) → decode morse → enter symbol panel → unlock storage door
  // -----------------------------------------------------------------------
  study: {
    id: 'study',
    label: 'The Study',
    bg: '#080f08',
    connections: { right: 'storage' },
    objects: [
      // Bookshelf — prop with easter egg on multi-click
      {
        id: 'bookshelf', type: 'prop', label: 'Bookshelf',
        x: 0.02, y: 0.1, w: 0.14, h: 0.72,
        colour: '#0f2010',
        description: 'Rows of old books. Nothing immediately jumps out.',
        easterEggClicks: 5,
        easterEggId: 'bookshelf_code'
      },
      // Painting — shows clock tower at 7:35. UV reveals easter egg.
      {
        id: 'painting', type: 'note', label: 'Oil Painting',
        x: 0.65, y: 0.08, w: 0.22, h: 0.3,
        colour: '#1a1006',
        description: 'A painting of a courtyard at dusk. A stone clock tower rises in the background. The shadows fall at a strange angle.',
        uvText: 'The UV light illuminates a small inscription in the corner: "This painting was hung on a Tuesday. That\'s irrelevant. The clock is what matters. — Dr. F"',
        uvEasterEgg: true
      },
      // Flickering lamp — DEVICE linked to morse_lamp puzzle (input is in storage)
      {
        id: 'morse_lamp_device', type: 'device', label: 'Flickering Lamp',
        x: 0.76, y: 0.4, w: 0.07, h: 0.3,
        colour: '#2a2a00',
        linkedPuzzle: 'morse_lamp',  // the input for this is in storage room
        description: 'The lamp flickers in an irregular pattern. Short flashes and long flashes. It seems deliberate.',
        animationType: 'morse_display'
      },
      // Symbol panel — puzzle input (door unlocked when solved)
      {
        id: 'symbol_panel_obj', type: 'puzzle', label: 'Symbol Panel',
        x: 0.44, y: 0.06, w: 0.13, h: 0.26,
        colour: '#060f06',
        puzzleId: 'symbol_panel',
        description: 'A metal panel inset into the wall. Six symbols are engraved on it, three of which faintly glow. There are three recessed buttons beneath them.',
        solvedDescription: 'The panel buttons are locked in place. A soft green light pulses.'
      },
      // Carpet — cover, contains rusty key
      {
        id: 'carpet', type: 'cover', label: 'Worn Carpet',
        x: 0.22, y: 0.6, w: 0.42, h: 0.22,
        colour: '#2a1010',
        description: 'A threadbare carpet. The corner is slightly lifted.',
        contains: [{ item: 'rusty_key' }]
      },
      // Desk — cover, contains crumpled note and UV light
      {
        id: 'desk', type: 'cover', label: 'Writing Desk',
        x: 0.28, y: 0.42, w: 0.3, h: 0.18,
        colour: '#1a0e06',
        description: 'A cluttered desk. Papers, a dried inkwell, and a locked drawer.',
        contains: [{ item: 'crumpled_note' }, { item: 'uv_light' }],
        easterEggId: 'desk_secret'
      },
      // Window showing outside courtyard (animated — matches painting)
      {
        id: 'courtyard_window', type: 'window', label: 'Window',
        x: 0.46, y: 0.08, w: 0.0, h: 0.0, // hidden — rendered by window system at position
        windowX: 0.82, windowY: 0.28, windowW: 0.1, windowH: 0.22,
        colour: '#020a1a',
        scene: 'courtyard_dusk',
        description: 'A small window. Through it you can see a stone courtyard and a clock tower. The clock reads 7:35.'
      },
      // Storage door — locked, requires rusty_key (OR symbol panel solved)
      {
        id: 'storage_door', type: 'door', label: 'Side Door',
        x: 0.88, y: 0.24, w: 0.1, h: 0.48,
        colour: '#0d1a0d',
        locked: true, keyItem: 'rusty_key',
        description: 'A wooden door. The keyhole is rusty.',
        leadsTo: 'storage',
        lockedMessage: 'Locked. Something fits in that keyhole.',
        unlockedMessage: 'The lock clicks. The door swings open.'
      },
    ]
  },

  // -----------------------------------------------------------------------
  // ROOM 2 — "The Storage Room"
  // Dark utility room. Fuse box, morse input panel (linked to study lamp),
  // wall with UV text, power door.
  // Goal: decode morse from study lamp → enter answer → get wire → fix fuses → power door opens
  // -----------------------------------------------------------------------
  storage: {
    id: 'storage',
    label: 'Storage Room',
    bg: '#060a06',
    connections: { left: 'study', right: 'lab' },
    objects: [
      // Morse decoder panel — INPUT for the morse lamp in the study
      {
        id: 'morse_input_obj', type: 'puzzle', label: 'Signal Decoder',
        x: 0.08, y: 0.15, w: 0.18, h: 0.3,
        colour: '#0f0f00',
        puzzleId: 'morse_lamp',
        description: 'A wall-mounted signal decoder panel. A small display reads "AWAITING INPUT". There\'s a keypad for entering decoded text.',
        solvedDescription: 'The decoder reads "SUN ✓". A small compartment has popped open beneath it.'
      },
      // Wire compartment — only accessible after morse solved (reward from morse puzzle)
      // Actually, the wire_fragment drops when morse is solved
      // Fusebox
      {
        id: 'fusebox_obj', type: 'puzzle', label: 'Fuse Box',
        x: 0.55, y: 0.12, w: 0.22, h: 0.4,
        colour: '#1a1a00',
        puzzleId: 'fusebox',
        description: 'An old fuse box. Several wires have come loose from their terminals. The box is labelled with three colour strips.',
        solvedDescription: 'The wires are correctly connected. A low hum indicates power is restored.'
      },
      // Metal shelf — contains torn note A
      {
        id: 'shelf', type: 'cover', label: 'Metal Shelf',
        x: 0.56, y: 0.55, w: 0.28, h: 0.3,
        colour: '#0d0d1a',
        description: 'Metal shelves loaded with dusty boxes. Searching through them takes a moment.',
        contains: [{ item: 'torn_note_a' }]
      },
      // Blank wall — UV reveals code hint
      {
        id: 'blank_wall', type: 'note', label: 'Bare Wall',
        x: 0.3, y: 0.05, w: 0.18, h: 0.6,
        colour: '#080808',
        description: 'A bare concrete wall. Nothing on it.',
        uvText: 'Under the UV light, faint writing appears:\n"SUM = CODE. Don\'t forget the leading zero."'
      },
      // Power door — opened by fusebox
      {
        id: 'power_door', type: 'door', label: 'Heavy Door',
        x: 0.87, y: 0.2, w: 0.1, h: 0.52,
        colour: '#0a0a0a',
        locked: true, unlockedBy: 'fusebox',
        description: 'A heavy steel door. A red indicator light blinks above it.',
        leadsTo: 'lab',
        lockedMessage: 'No power. The indicator light is red.',
        unlockedMessage: 'The indicator turns green. The door grinds open.'
      },
    ]
  },

  // -----------------------------------------------------------------------
  // ROOM 3 — "The Lab"
  // Final room. Clock, slider, safe, filing cabinet, exit.
  // Goal: slider → keycard; clock → safe; safe code 0015 → (already have keycard) → exit
  // -----------------------------------------------------------------------
  lab: {
    id: 'lab',
    label: 'The Lab',
    bg: '#040608',
    connections: { left: 'storage' },
    objects: [
      // Slider puzzle — reward is lab_keycard
      {
        id: 'tile_board', type: 'puzzle', label: 'Tile Board',
        x: 0.06, y: 0.18, w: 0.24, h: 0.46,
        colour: '#060d1a',
        puzzleId: 'slider_tile',
        description: 'A sliding tile puzzle mounted on the wall. The tiles are numbered. There\'s a small compartment behind it.',
        solvedDescription: 'The tiles are in order. A hidden compartment has opened.'
      },
      // Antique clock — puzzle, unlocks lab_safe_door when set to 7:35
      {
        id: 'clock_obj', type: 'puzzle', label: 'Antique Clock',
        x: 0.5, y: 0.08, w: 0.12, h: 0.28,
        colour: '#0f0c06',
        puzzleId: 'clock_puzzle',
        description: 'A brass clock on a pedestal. The hands can be moved. An engraving reads: "Set the correct time."',
        solvedDescription: 'The clock hands rest at 7:35. Something clicked.'
      },
      // Filing cabinet — contains torn note B
      {
        id: 'cabinet', type: 'cover', label: 'Filing Cabinet',
        x: 0.7, y: 0.22, w: 0.14, h: 0.46,
        colour: '#0d0d1a',
        description: 'A battered filing cabinet. Most files are gibberish. One drawer rattles.',
        contains: [{ item: 'torn_note_b' }]
      },
      // Wall safe — 4-digit code (0015), opened by clock puzzle first (locked until)
      {
        id: 'lab_safe', type: 'safe', label: 'Wall Safe',
        x: 0.33, y: 0.12, w: 0.13, h: 0.24,
        colour: '#1a0d06',
        locked: true,
        requiresPuzzle: 'clock_puzzle',  // must solve clock first to reveal/unlock
        code: '0015',
        description: 'A recessed safe behind a hinged panel. A 4-digit keypad glows faintly.',
        lockedDescription: 'A blank panel on the wall. Something is behind it.',
        contains: [],
        easterEggId: 'safe_wrong_code'
      },
      // Exit door — requires lab_keycard
      {
        id: 'exit_door', type: 'door', label: 'Exit',
        x: 0.86, y: 0.18, w: 0.1, h: 0.56,
        colour: '#062006',
        locked: true, keyItem: 'lab_keycard',
        description: 'A reinforced exit door. A card reader blinks red on the wall beside it.',
        leadsTo: '__EXIT__',
        lockedMessage: 'The card reader blinks red.',
        unlockedMessage: '🚪 Access granted. The exit door opens.'
      },
    ]
  },

  // -----------------------------------------------------------------------
  // APRIL FOOLS ROOMS — Everything is slightly wrong
  // -----------------------------------------------------------------------
  fool_study: {
    id: 'fool_study',
    label: 'The Study (?)',
    bg: '#100600',
    connections: { right: 'fool_storage' },
    _aprilFoolsNote: 'Painting says 8:35 (wrong). Fool_note gives STAR SUN MOON which IS correct for fool_panel. Wire clue says 15 which is right. Carpet has wrong key. Real key in fool_storage shelf.',
    objects: [
      {
        id: 'bookshelf', type: 'prop', label: 'Bookshelf (?)',
        x: 0.02, y: 0.1, w: 0.14, h: 0.72,
        colour: '#1a0500',
        description: 'Rows of books. One title reads "EVERYTHING IS FINE". Another: "NO IT ISN\'T".',
        easterEggClicks: 5,
        easterEggId: 'bookshelf_code',
        foolMode: true
      },
      {
        id: 'painting', type: 'note', label: 'Oil Painting',
        x: 0.65, y: 0.08, w: 0.22, h: 0.3,
        colour: '#1a0c00',
        description: 'A painting of a courtyard. The clock tower reads 8:35. Something feels off about it.',
        uvText: 'The UV light reveals: "DO NOT TRUST THE PAINTING. The clock it shows is wrong. You have been warned. — Dr. F"',
        uvEasterEgg: true,
        foolMode: true
      },
      {
        id: 'morse_lamp_device', type: 'device', label: 'Flickering Lamp',
        x: 0.76, y: 0.4, w: 0.07, h: 0.3,
        colour: '#2a0e00',
        linkedPuzzle: 'morse_lamp',
        description: 'The lamp flickers. The pattern feels… slightly wrong. Or does it?',
        animationType: 'morse_display'
      },
      {
        id: 'symbol_panel_obj', type: 'puzzle', label: '??? Panel',
        x: 0.44, y: 0.06, w: 0.13, h: 0.26,
        colour: '#140600',
        puzzleId: 'fool_panel',
        description: 'The same kind of panel. But the glowing symbols are different.',
        solvedDescription: 'The panel clicks. Something is different about the order.'
      },
      {
        id: 'carpet', type: 'cover', label: 'Worn Carpet',
        x: 0.22, y: 0.6, w: 0.42, h: 0.22,
        colour: '#2a1000',
        description: 'The carpet corner is lifted. Something is visible underneath.',
        contains: [{ item: 'backwards_key' }]
      },
      {
        id: 'desk', type: 'cover', label: 'Writing Desk',
        x: 0.28, y: 0.42, w: 0.3, h: 0.18,
        colour: '#1a0800',
        description: 'A cluttered desk. Among the papers is a very helpful-looking note.',
        contains: [{ item: 'fool_note' }, { item: 'uv_light' }],
        easterEggId: 'desk_secret',
        foolMode: true
      },
      {
        id: 'courtyard_window', type: 'window',
        windowX: 0.82, windowY: 0.28, windowW: 0.1, windowH: 0.22,
        colour: '#020a1a',
        scene: 'courtyard_fool',
        description: 'Through the window: the courtyard clock reads 8:35. Wait. The shadows don\'t match that time of day.'
      },
      {
        id: 'fool_door', type: 'door', label: 'Side Door',
        x: 0.88, y: 0.24, w: 0.1, h: 0.48,
        colour: '#1a0d00',
        locked: true, keyItem: 'rusty_key',
        description: 'Locked. The wrong key won\'t open it.',
        leadsTo: 'fool_storage',
        lockedMessage: 'That key doesn\'t fit. The real key must be somewhere else.',
        unlockedMessage: 'The door opens with a suspicious creak.'
      },
    ]
  },

  fool_storage: {
    id: 'fool_storage',
    label: 'Storage Room (?)',
    bg: '#080400',
    connections: { left: 'fool_study', right: 'fool_lab' },
    objects: [
      {
        id: 'morse_input_obj', type: 'puzzle', label: 'Signal Decoder',
        x: 0.08, y: 0.15, w: 0.18, h: 0.3,
        colour: '#0f0a00',
        puzzleId: 'morse_lamp',
        description: 'The decoder. The lamp in the study still spells SUN. Some things don\'t change.',
        solvedDescription: 'Reads "SUN ✓". A compartment opens beneath it.'
      },
      {
        id: 'fusebox_obj', type: 'puzzle', label: 'Fuse Box',
        x: 0.55, y: 0.12, w: 0.22, h: 0.4,
        colour: '#1a1400',
        puzzleId: 'fusebox',
        description: 'The fuse box. The wire labels appear to be peeling off. Or are they?',
        solvedDescription: 'Power restored. The door light turns green.'
      },
      {
        id: 'shelf', type: 'cover', label: 'Metal Shelf',
        x: 0.56, y: 0.55, w: 0.28, h: 0.3,
        colour: '#0d0800',
        description: 'Dusty shelves. Something is tucked behind a box.',
        contains: [{ item: 'rusty_key' }, { item: 'torn_note_a' }]
      },
      {
        id: 'blank_wall', type: 'note', label: 'Bare Wall',
        x: 0.3, y: 0.05, w: 0.18, h: 0.6,
        colour: '#060400',
        description: 'A bare wall. Or is it?',
        uvText: 'UV reveals:\n"SUM = CODE. Still has a leading zero. The helpful note told you the right number. Funny, right?"'
      },
      {
        id: 'fool_storage_door', type: 'door', label: 'Heavy Door',
        x: 0.87, y: 0.2, w: 0.1, h: 0.52,
        colour: '#0a0800',
        locked: true, unlockedBy: 'fusebox',
        description: 'A heavy door. Power indicator is red.',
        leadsTo: 'fool_lab',
        lockedMessage: 'No power.',
        unlockedMessage: 'It opens. You\'re almost there.'
      },
    ]
  },

  fool_lab: {
    id: 'fool_lab',
    label: 'The Lab (?)',
    bg: '#04040a',
    connections: { left: 'fool_storage' },
    objects: [
      {
        id: 'tile_board', type: 'puzzle', label: 'Tile Board',
        x: 0.06, y: 0.18, w: 0.24, h: 0.46,
        colour: '#08081a',
        puzzleId: 'slider_tile',
        description: 'Same tile puzzle. Probably.',
        solvedDescription: 'Tiles in order. The compartment opens.'
      },
      {
        id: 'clock_obj', type: 'puzzle', label: 'Clock (something feels wrong)',
        x: 0.5, y: 0.08, w: 0.12, h: 0.28,
        colour: '#0f0c00',
        puzzleId: 'fool_clock',
        description: 'The clock. "Set the correct time." The painting said 8:35. The painting lied.',
        solvedDescription: '7:35. Correct. The panel clicks.'
      },
      {
        id: 'cabinet', type: 'cover', label: 'Filing Cabinet',
        x: 0.7, y: 0.22, w: 0.14, h: 0.46,
        colour: '#0a0a12',
        description: 'A filing cabinet. One drawer has a torn note. It says "...probably. — Dr. F"',
        contains: [{ item: 'torn_note_b' }]
      },
      {
        id: 'lab_safe', type: 'safe', label: 'Wall Safe',
        x: 0.33, y: 0.12, w: 0.13, h: 0.24,
        colour: '#1a0a00',
        locked: true,
        requiresPuzzle: 'fool_clock',
        code: '0015',
        description: 'A safe. The sticker reads: "same code as always... we think"',
        lockedDescription: 'A panel. Probably a safe behind it.',
        contains: [],
        easterEggId: 'safe_wrong_code'
      },
      {
        id: 'exit_door', type: 'door', label: 'Exit (?)',
        x: 0.86, y: 0.18, w: 0.1, h: 0.56,
        colour: '#041404',
        locked: true, keyItem: 'lab_keycard',
        description: 'The exit. A card reader blinks. Red.',
        leadsTo: '__EXIT__',
        lockedMessage: 'Card reader blinks red.',
        unlockedMessage: '🚪 You escaped. The wrong room. Or did you?'
      },
    ]
  },
};

// ===== TUTORIAL STEPS =====
const TUTORIAL_STEPS = [
  {
    title: 'Welcome',
    html: `<h2>Welcome, Agent.</h2>
    <p>You've been locked in. Your goal: <strong style="color:var(--accent)">escape</strong>.</p>
    <p>Press <strong>Next</strong> to continue or <strong>Skip</strong> to jump straight in.</p>`
  },
  {
    title: 'Moving Around',
    html: `<h2>Looking Around</h2>
    <p>Move between rooms using the <span class="tut-key">◀ ▶</span> arrows at the edges of the screen. Arrows only appear when a path is open.</p>
    <p>Doors must be <strong>unlocked</strong> before you can pass through them.</p>`
  },
  {
    title: 'Interacting',
    html: `<h2>Interacting</h2>
    <p>Click any object to examine it. A panel will appear with a description and options.</p>
    <p>Your <strong>inventory</strong> is always visible at the bottom of the screen. Click an item while viewing an object to try using it.</p>`
  },
  {
    title: 'Puzzles',
    html: `<h2>Puzzles</h2>
    <p>Some objects are puzzles. Solving them unlocks things — sometimes in the same room, sometimes elsewhere.</p>
    <p>Pay attention to everything. Notes, descriptions, and even decorations can be clues.</p>
    <div class="tut-demo">💡 Some items reveal hidden information when used on objects.</div>`
  },
  {
    title: 'Timer',
    html: `<h2>The Timer</h2>
    <p>Once you dismiss this tutorial, the timer starts. ⏱️</p>
    <p>Your time is recorded <strong>on first completion only</strong>. Fastest times go on the leaderboard.</p>`
  },
];

// Window scene definitions — what each 'window' type renders
const WINDOW_SCENES = {
  courtyard_dusk: {
    // Animated dusk sky, clock tower showing 7:35
    animate: true,
    clockTime: { h: 7, m: 35 },
    skyColor: ['#0a1a3a', '#1a0a2a', '#3a1a08'],
    stars: true
  },
  courtyard_fool: {
    animate: true,
    clockTime: { h: 8, m: 35 },  // wrong time shown
    skyColor: ['#1a0806', '#2a0408', '#0a0606'],
    stars: false
  }
};

// Expose globally
window.GAME_ROOMS = ROOMS;
window.GAME_ITEMS = ITEMS;
window.GAME_PUZZLES = PUZZLES;
window.GAME_TUTORIAL = TUTORIAL_STEPS;
window.GAME_EASTER_EGGS = EASTER_EGGS;
window.WINDOW_SCENES = WINDOW_SCENES;
