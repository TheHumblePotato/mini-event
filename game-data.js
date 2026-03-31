// ===== game-data.js =====
// Room layouts, objects, puzzles, items for the April 1st Escape Room

const ITEMS = {

  // ── NORMAL ──
  hat_1: {
    id: 'hat_1', name: 'Cool Hat', icon: '🎩',
    description: "It's a REALLY cool hat. You couldn't leave it behind.",
    useWith: ['item_analyzer']
  },
  hat_2: {
    id: 'hat_2', name: 'Wizard Hat', icon: '🧙',
    description: "A wizard hat. You still have no idea why it was here.",
    useWith: ['item_analyzer_af']
  },
  uv_flashlight: {
    id: 'uv_flashlight', name: 'UV Flashlight', icon: '🔦',
    description: 'A small UV flashlight. Reveals hidden ink on certain surfaces.',
    useWith: []
  },
  employee_badge: {
    id: 'employee_badge', name: 'Employee Badge', icon: '🪪',
    description: 'An employee access badge. May open employee-only safes.',
    useWith: ['employee_safe', 'employee_safe_af']
  },
  cipher_key_1: {
    id: 'cipher_key_1', name: 'Cipher Key (A–M)', icon: '📄',
    description: 'CIPHER KEY — First Half (A through M)\n\nA→!  B→@  C→#  D→$  E→%\nF→^  G→&  H→*  I→(  J→)\nK→[  L→]  M→{\n\n(Find the second half elsewhere.)',
    useWith: []
  },
  cipher_key_2: {
    id: 'cipher_key_2', name: 'Cipher Key (N–Z)', icon: '📄',
    description: 'CIPHER KEY — Second Half (N through Z)\n\nN→}  O→|  P→/  Q→\\\nR→<  S→>  T→?  U→~\nV→+  W→`  X→;  Y→:\nZ→=',
    useWith: []
  },
  secret_key: {
    id: 'secret_key', name: 'Secret Key', icon: '🗝️',
    description: 'A small key found in the locked cabinet. Opens the door to the next room.',
    useWith: ['door_r1_to_r2']
  },
  wire: {
    id: 'wire', name: 'Wire', icon: '🔌',
    description: 'An electrical wire. Could complete a circuit somewhere. The ends are stripped.',
    useWith: ['electrical_socket']
  },
  red_access_card: {
    id: 'red_access_card', name: 'Red Access Card', icon: '💳',
    description: 'A red access card. Grants entry to the laboratory.',
    useWith: ['door_r2_to_r3', 'door_af_r2_to_r3']
  },
  confidential_papers: {
    id: 'confidential_papers', name: 'Confidential Papers', icon: '📑',
    description: 'CONFIDENTIAL MEMO\n──────────────────\nRecently the archive\'s security protocols were reviewed by management.\nEach employee must now wear their badge at all times within the building.\nDue to recent incidents, the laboratory has been placed under observation.\nBefore accessing restricted areas, proper clearance must be obtained first.\nLab specimens should be stored in the designated refrigerators only.\nUnder no circumstances should chemicals be mixed without proper supervision.\nEntry logs will be reviewed by security at the end of each week.\nReport any anomalies to the head of security immediately and in writing.\nEnsure all doors are properly secured and locked before leaving for the night.\nDocumentation of all experiments remains strictly confidential at all times.',
    useWith: []
  },
  chalk: {
    id: 'chalk', name: 'Chalk', icon: '✏️',
    description: 'A stick of chalk. Useful for writing on blackboards.',
    useWith: ['blackboard']
  },
  boring_data: {
    id: 'boring_data', name: 'Boring Data', icon: '💾',
    description: 'Output from the Item Analyzer.\nCLASSIFICATION: BORING\nItem analyzed: Hat #1\nFinding: Extremely mundane.\n\nBring to a computer for further analysis.',
    useWith: ['computer']
  },
  computer_printout: {
    id: 'computer_printout', name: 'Computer Printout', icon: '🖨️',
    description: 'ANALYSIS COMPLETE\n─────────────────\nSource: Item Analyzer\nData type: BORING\nClassification: MUNDANE\n\nERROR: No relevant findings.\nERROR: Absolutely nothing of interest.\nERROR: Why are we even looking at this?\n\n──────────────────────────\nSYSTEM MESSAGE:\n\nExit code: 3892',
    useWith: []
  },
  acid: {
    id: 'acid', name: 'Acid', icon: '🧪',
    description: 'A corrosive acid, freshly mixed. Dissolves certain materials on contact.',
    useWith: ['locked_cabinet', 'bookshelf_1_af']
  },

  // ── APRIL FOOLS ──
  cipher_key_af_1: {
    id: 'cipher_key_af_1', name: 'Cipher Key AF (A–M)', icon: '📄',
    description: 'CIPHER KEY — First Half (A through M)\nNumber-based. Add dashes between.\n\nA=1  B=2  C=3  D=4  E=5\nF=6  G=7  H=8  I=9  J=10\nK=11  L=12  M=13\n\n⚠ NOTE: S and T are SWAPPED!\n  (S=20, T=19)',
    useWith: []
  },
  cipher_key_af_2: {
    id: 'cipher_key_af_2', name: 'Cipher Key AF (N–Z)', icon: '📄',
    description: 'CIPHER KEY — Second Half (N through Z)\n\nN=14  O=15  P=16  Q=17  R=18\nS=20 ← SWAPPED with T\nT=19 ← SWAPPED with S\nU=21  V=22  W=23  X=24\nY=25  Z=26',
    useWith: []
  },
  secret_key_af: {
    id: 'secret_key_af', name: 'Boring Key', icon: '🗝️',
    description: 'A completely ordinary key. Found in the locked cabinet.',
    useWith: ['door_af_r1_to_r2']
  },
  electrical_wire_af: {
    id: 'electrical_wire_af', name: 'Electrical Wire', icon: '🔌',
    description: 'A somewhat tangled electrical wire. Might connect to something.',
    useWith: ['power_socket_af_obj']
  },
  eraser_af: {
    id: 'eraser_af', name: 'Blackboard Eraser', icon: '🧹',
    description: 'A dusty blackboard eraser. Reveals things that were written beneath.',
    useWith: ['blackboard_af']
  },
  boring_data_af: {
    id: 'boring_data_af', name: 'Boring Data (AF)', icon: '💾',
    description: 'Output from the Item Analyzer.\nCLASSIFICATION: EXTREMELY BORING\nItem analyzed: Wizard Hat\nFinding: The answer to life is... boring.\n\nBring to a computer for analysis.',
    useWith: ['computer_af']
  },
  computer_printout_af: {
    id: 'computer_printout_af', name: 'Computer Printout', icon: '🖨️',
    description: 'ANALYSIS COMPLETE\n─────────────────\nData type: BORING (extra boring)\nClassification: VERY MUNDANE\n\nFUN FACT: This printout is also boring.\n\n──────────────────────────\nExit code: 6666',
    useWith: []
  },
  acid_af: {
    id: 'acid_af', name: 'Green Acid', icon: '🧪',
    description: 'A very green acid. Suspiciously green. Smells like lime.',
    useWith: ['locked_cabinet_af', 'bookshelf_1_af']
  },
  complicated_instructions_af: {
    id: 'complicated_instructions_af', name: 'Complicated Instructions', icon: '📋',
    description: 'COMPLICATED INSTRUCTIONS (Form 42-C/Alpha)\nPage 1 of 47.\n\nStep 1: Do not proceed until you have read all 47 pages.\nStep 2: ...\n\n[Pages 2 through 46 appear to be missing.]\n\nPage 47 of 47:\nACTUAL INSTRUCTIONS:\nGo back to Room 2.\nUse the acid on the bookshelf.\nA hidden passage will open.',
    useWith: []
  },
  snack_af: {
    id: 'snack_af', name: 'Chocolate Bar', icon: '🍫',
    description: 'A chocolate bar from the vending machine. Best before: 2019.\nStill technically edible. Probably.',
    useWith: []
  },
  lukewarm_coffee_af: {
    id: 'lukewarm_coffee_af', name: 'Lukewarm Coffee', icon: '☕',
    description: 'Lukewarm coffee. It was probably hot once. Maybe this morning. Maybe last week.',
    useWith: []
  }
};

// ===== PUZZLES =====
const PUZZLES = {

  typewriter: {
    id: 'typewriter',
    type: 'text_input',
    label: 'Typewriter',
    hint: 'Enter 4 words from Bookshelf #1, at the positions shown by the UV numbers on Bookshelf #2. Separate words with spaces.',
    answer: 'contain holds experiment overlooked',
    reward: 'wire'
  },

  chem_mixer: {
    id: 'chem_mixer',
    type: 'color_mixer',
    label: 'Chemical Mixer',
    hint: 'Mix the chemicals in the correct order. Something in the archive may tell you the sequence.',
    colors: [
      { name: 'RED',    color: '#cc2222' },
      { name: 'BLUE',   color: '#2244cc' },
      { name: 'GREEN',  color: '#22aa44' },
      { name: 'YELLOW', color: '#bbaa00' },
      { name: 'PURPLE', color: '#882299' }
    ],
    answer: ['RED', 'BLUE', 'RED'],
    reward: 'acid'
  },

  mainframe: {
    id: 'mainframe',
    type: 'text_input',
    label: 'MAINFRAME TERMINAL',
    hint: 'Enter the system name. The cipher text on the blackboard in Room 2 will help you decode it. You\'ll need the cipher keys.',
    answer: 'MAINFRAME',
    requiresFlag: 'power_on',
    onSolveEffect: 'computer_unlocked'
  },

  // ── APRIL FOOLS PUZZLES ──

  typewriter_af: {
    id: 'typewriter_af',
    type: 'text_input',
    label: 'Typewriter',
    hint: 'Enter 4 words from Bookshelf #1. The UV numbers on Bookshelf #2 are negative — count from the BACK of the text. Separate words with spaces.',
    answer: 'by experiment holds thousands',
    onSolveEffect: 'af_power_socket_revealed'
  },

  chem_mixer_af: {
    id: 'chem_mixer_af',
    type: 'color_mixer',
    label: 'Chemical Mixer',
    hint: 'Mix chemicals in the correct sequence. Look around the lab for a hint.',
    colors: [
      { name: 'GREEN',  color: '#22aa44' },
      { name: 'RED',    color: '#cc2222' },
      { name: 'BLUE',   color: '#2244cc' },
      { name: 'YELLOW', color: '#bbaa00' },
      { name: 'PURPLE', color: '#882299' }
    ],
    answer: ['GREEN', 'GREEN', 'GREEN'],
    reward: 'acid_af'
  },

  mainframe_af: {
    id: 'mainframe_af',
    type: 'text_input',
    label: 'MAINFRAME TERMINAL',
    hint: 'Enter the system name. The numbers on the blackboard in Room 2 spell it out — use the cipher keys to decode.',
    answer: 'MAINFRAME',
    requiresFlag: 'power_on_af',
    onSolveEffect: 'computer_af_unlocked'
  }
};

// ===== EASTER EGGS =====
const EASTER_EGGS = {
  hat_rack_clicks: {
    message: "It's STILL a hat rack. What did you expect.",
    foolMessage: "It's STILL a hat rack. In the April Fools version. Still just a hat rack."
  },
  carpet_clicks: {
    message: "You've searched the carpet four times now. The carpet is clean.",
    foolMessage: "The carpet stares back at you. It knows you're stalling."
  },
  safe_wrong_code: {
    message: 'If you have to guess, you\'re not ready.',
    foolMessage: 'The answer is definitely not 1234. Or is it? No.'
  }
};

// ===== ROOMS =====
const ROOMS = {

  // ══════════════════════════════════════════
  //  ROOM 1 — ANTEROOM (Normal)
  // ══════════════════════════════════════════
  anteroom: {
    id: 'anteroom',
    label: 'Room 1 — The Anteroom',
    bg: '#080f08',
    connections: { right: 'library' },
    objects: [
      // Hat rack (prop, left side, tall)
      {
        id: 'hat_rack', type: 'prop', label: 'Hat Rack',
        description: "It's a hat rack, what did you expect.",
        colour: '#1a1208',
        x: 0.02, y: 0.04, w: 0.11, h: 0.74,
        easterEggClicks: 5, easterEggId: 'hat_rack_clicks'
      },
      // Hat #1 (overlapping hat rack — cover)
      {
        id: 'hat_1_cover', type: 'cover', label: 'Hat #1',
        description: "It's a REALLY cool hat.",
        searchText: "It's a REALLY cool hat. You pocket it.",
        colour: '#2a1a08',
        x: 0.025, y: 0.07, w: 0.09, h: 0.12,
        contains: [{ item: 'hat_1' }]
      },
      // Hat #2 Wizard hat (overlapping hat rack — cover)
      {
        id: 'hat_2_cover', type: 'cover', label: 'Wizard Hat',
        description: "Don't ask me why this is here.",
        searchText: "Found the answer to life. Just kidding. Found a wizard hat though.",
        colour: '#1a0830',
        x: 0.025, y: 0.21, w: 0.09, h: 0.12,
        contains: [{ item: 'hat_2' }]
      },
      // Hat #3 (overlapping hat rack — cover)
      {
        id: 'hat_3_cover', type: 'cover', label: 'Hat #3',
        description: "Hat. It's a hat.",
        searchText: "You find a hidden compartment inside the hat. There's a UV flashlight.",
        colour: '#1a1a08',
        x: 0.025, y: 0.35, w: 0.09, h: 0.12,
        contains: [{ item: 'uv_flashlight' }]
      },
      // Filing inbox (cover)
      {
        id: 'filing_inbox', type: 'cover', label: 'Filing Inbox',
        description: "Lot's of juicy things in here!",
        searchText: "You rifle through the inbox and find something useful.",
        colour: '#1a1208',
        x: 0.17, y: 0.50, w: 0.15, h: 0.28,
        contains: [{ item: 'employee_badge' }, { item: 'cipher_key_1' }]
      },
      // Wall clock (cover — clock stopped at 8:37)
      {
        id: 'wall_clock', type: 'cover', label: 'Wall Clock',
        description: 'A wall clock. It reads 8:37. The hands are not moving.',
        searchText: 'Lots of dust. The clock appears to have stopped at exactly 8:37.',
        colour: '#1a1408',
        x: 0.44, y: 0.05, w: 0.12, h: 0.22
      },
      // Carpet (cover, large, bottom)
      {
        id: 'carpet', type: 'cover', label: 'Carpet',
        description: "A worn carpet. Everyone searches the carpet.",
        searchText: "Everyone searches the carpet. Nothing obvious here.",
        uvText: 'hour times min',
        colour: '#180808',
        x: 0.07, y: 0.82, w: 0.82, h: 0.15,
        easterEggClicks: 4, easterEggId: 'carpet_clicks'
      },
      // Locked cabinet (safe, 3-digit: 296)
      {
        id: 'locked_cabinet_r1', type: 'safe', label: 'Locked Cabinet',
        description: 'A locked cabinet. The combination lock has 3 digits.\n\nThe clock reads 8:37. The carpet hint might help.',
        code: '296',
        colour: '#0f1a10',
        x: 0.70, y: 0.24, w: 0.13, h: 0.54,
        contains: [{ item: 'secret_key' }],
        easterEggId: 'safe_wrong_code'
      },
      // Electrical socket (prop)
      {
        id: 'electrical_socket', type: 'prop', label: 'Electrical Socket',
        description: 'Shocking.',
        colour: '#101010',
        x: 0.83, y: 0.72, w: 0.05, h: 0.07
      },
      // Door to library (locked, requires secret_key)
      {
        id: 'door_r1_to_r2', type: 'door', label: 'Door to Room 2',
        description: 'A locked door leading to the next room. You need a key.',
        lockedMessage: 'The door is locked. Find the key.',
        unlockedMessage: 'The door swings open.',
        locked: true,
        keyItem: 'secret_key',
        leadsTo: 'library',
        colour: '#0a160a',
        x: 0.88, y: 0.10, w: 0.10, h: 0.80
      }
    ]
  },

  // ══════════════════════════════════════════
  //  ROOM 2 — LIBRARY / ARCHIVE (Normal)
  // ══════════════════════════════════════════
  library: {
    id: 'library',
    label: 'Room 2 — The Library',
    bg: '#080a0f',
    connections: { left: 'anteroom', right: 'laboratory' },
    objects: [
      // Bookshelf #1 (cover — contains the paragraph)
      {
        id: 'bookshelf_1', type: 'cover', label: 'Bookshelf #1',
        description: 'A tall bookshelf packed with folders and binders.',
        searchText: 'The laboratory archives contain thousands of classified documents. Each folder holds secrets from decades of research. Scientists recorded every experiment with great precision. Nothing was overlooked by the dedicated staff.',
        colour: '#0e0c08',
        x: 0.02, y: 0.04, w: 0.14, h: 0.76
      },
      // Bookshelf #2 (cover — UV text reveals positions)
      {
        id: 'bookshelf_2', type: 'cover', label: 'Bookshelf #2',
        description: 'Another bookshelf. Equally tall.',
        searchText: 'Many books. Nothing notable.',
        uvText: '4 · 11 · 20 · 26',
        colour: '#0e0c08',
        x: 0.18, y: 0.04, w: 0.14, h: 0.76
      },
      // Notebook (cover — gives cipher_key_2)
      {
        id: 'notebook', type: 'cover', label: 'Notebook',
        description: 'A worn notebook sitting on the shelf.',
        searchText: "Inside the notebook is a hand-written cipher reference table.",
        colour: '#12100a',
        x: 0.35, y: 0.62, w: 0.14, h: 0.26,
        contains: [{ item: 'cipher_key_2' }]
      },
      // Typewriter (puzzle — text_input)
      {
        id: 'typewriter_obj', type: 'puzzle', label: 'Typewriter',
        description: 'An old typewriter. A note taped to it reads:\n"Enter 4 words from Bookshelf #1\nat positions given by the UV numbers on Bookshelf #2.\nSeparate with spaces."',
        solvedDescription: 'The typewriter. [Already used — a wire dropped out of a hidden compartment.]',
        puzzleId: 'typewriter',
        colour: '#12100a',
        x: 0.35, y: 0.25, w: 0.20, h: 0.30
      },
      // Blackboard (note — chalk reveals cipher text)
      {
        id: 'blackboard', type: 'note', label: 'Blackboard',
        description: 'A blackboard. It shows the equation:\n\n(8 × 4) ÷ 2 + 7 = ?\n\nThe equation seems to have no relevance whatsoever.',
        chalkReveal: '{!(}^<!{%',
        colour: '#080f08',
        x: 0.58, y: 0.04, w: 0.22, h: 0.50
      },
      // Employee safe (safe — itemKey = employee_badge)
      {
        id: 'employee_safe', type: 'safe', label: 'Employee Safe',
        description: "It's a safe. Employees only.\n\nThere's a badge scanner instead of a combination lock.",
        itemKey: 'employee_badge',
        colour: '#0f1410',
        x: 0.72, y: 0.50, w: 0.12, h: 0.38,
        contains: [{ item: 'red_access_card' }, { item: 'confidential_papers' }]
      },
      // Computer (device)
      {
        id: 'computer', type: 'device', label: 'Computer',
        description: 'I forgot my password.',
        colour: '#080f08',
        x: 0.58, y: 0.58, w: 0.12, h: 0.30
      },
      // Door to laboratory (locked — requires red_access_card)
      {
        id: 'door_r2_to_r3', type: 'door', label: 'Door to Room 3',
        description: 'A reinforced door. Requires a red access card.',
        lockedMessage: 'ACCESS DENIED. Red access card required.',
        unlockedMessage: 'Access granted.',
        locked: true,
        keyItem: 'red_access_card',
        leadsTo: 'laboratory',
        colour: '#0a120a',
        x: 0.88, y: 0.10, w: 0.10, h: 0.80
      }
    ]
  },

  // ══════════════════════════════════════════
  //  ROOM 3 — LABORATORY (Normal)
  // ══════════════════════════════════════════
  laboratory: {
    id: 'laboratory',
    label: 'Room 3 — The Laboratory',
    bg: '#050f09',
    connections: { left: 'library' },
    objects: [
      // Item Analyzer (device)
      {
        id: 'item_analyzer', type: 'device', label: 'Item Analyzer',
        description: 'ITEM ANALYZER v2.1\n\nSearching for REALLY cool items.\n\nInsert item to analyze.',
        colour: '#0a1a12',
        x: 0.02, y: 0.10, w: 0.16, h: 0.52
      },
      // Labeled Potion (cover — can be searched, UV reveals "First Letters")
      {
        id: 'labeled_potion', type: 'cover', label: 'Labeled Potion',
        description: 'A labeled potion sitting on a shelf. The label is hard to read.',
        searchText: 'Turns out the label was empty. Nothing written on it at all.',
        uvText: 'First Letters',
        colour: '#0a120a',
        x: 0.22, y: 0.62, w: 0.10, h: 0.24
      },
      // Chemical Mixer (puzzle — color_mixer)
      {
        id: 'chem_mixer_obj', type: 'puzzle', label: 'Chemical Mixer',
        description: 'A chemical mixing station. 5 colored chemical tanks, 3 slots.\n\nSomething in the archive mentioned an order.',
        solvedDescription: 'The chemical mixer. [Already solved — contents dispensed.]',
        puzzleId: 'chem_mixer',
        colour: '#0a1208',
        x: 0.22, y: 0.05, w: 0.22, h: 0.50
      },
      // Power grid panel (device)
      {
        id: 'power_grid', type: 'device', label: 'Power Grid Panel',
        description: 'Power grid panel. POWER OFFLINE.',
        colour: '#0f100a',
        x: 0.48, y: 0.52, w: 0.14, h: 0.36
      },
      // Mainframe terminal (puzzle — text_input, requires power_on)
      {
        id: 'mainframe_terminal', type: 'puzzle', label: 'Mainframe Terminal',
        description: 'MAINFRAME TERMINAL\nSTATUS: OFFLINE\n\nPower is required to operate.',
        solvedDescription: 'MAINFRAME TERMINAL\nSTATUS: SOLVED ✓\n\nSystem authenticated.',
        puzzleId: 'mainframe',
        colour: '#080f08',
        x: 0.48, y: 0.04, w: 0.22, h: 0.44
      },
      // Locked Cabinet (cover — acid required to open)
      {
        id: 'locked_cabinet', type: 'cover', label: 'Locked Cabinet',
        description: 'A heavy metal cabinet. Something is inside.\n\nOrdinary handles won\'t open it. Something corrosive might work.',
        searchText: 'The cabinet is sealed tight. A corrosive substance might dissolve the lock.',
        colour: '#0f1410',
        x: 0.74, y: 0.20, w: 0.12, h: 0.60
      },
      // Exit panel (safe — code 3892, triggers win)
      {
        id: 'exit_panel', type: 'safe', label: 'Exit Keypad',
        description: 'Exit keypad. Enter the passcode to unlock the exit.\n\nThe printout from the computer should have it.',
        code: '3892',
        triggersWin: true,
        colour: '#0a160a',
        x: 0.88, y: 0.28, w: 0.10, h: 0.44,
        easterEggId: 'safe_wrong_code'
      }
    ]
  },

  // ══════════════════════════════════════════
  //  AF ROOM 1 — ANTEROOM (April Fools)
  // ══════════════════════════════════════════
  af_anteroom: {
    id: 'af_anteroom',
    label: 'Room 1 — The Anteroom',
    bg: '#0f080f',
    connections: { right: 'af_library' },
    objects: [
      // Hat rack (prop)
      {
        id: 'hat_rack_af', type: 'prop', label: 'Hat Rack',
        description: "It's a hat rack, what did you expect.",
        colour: '#1a1208',
        x: 0.02, y: 0.04, w: 0.11, h: 0.74,
        easterEggClicks: 5, easterEggId: 'hat_rack_clicks'
      },
      // Hat #1 (cover)
      {
        id: 'hat_1_cover_af', type: 'cover', label: 'Hat #1',
        description: "It's a REALLY cool hat.",
        searchText: "It's a REALLY cool hat. You pocket it.",
        colour: '#2a1a08',
        x: 0.025, y: 0.07, w: 0.09, h: 0.12,
        contains: [{ item: 'hat_1' }]
      },
      // Hat #2 Wizard hat (cover)
      {
        id: 'hat_2_cover_af', type: 'cover', label: 'Wizard Hat',
        description: "Don't ask me why this is here.",
        searchText: "Found the answer to life. You keep the wizard hat.",
        colour: '#1a0830',
        x: 0.025, y: 0.21, w: 0.09, h: 0.12,
        contains: [{ item: 'hat_2' }]
      },
      // Hat #3 (cover)
      {
        id: 'hat_3_cover_af', type: 'cover', label: 'Hat #3',
        description: "Hat. It's a hat.",
        searchText: "You find a hidden compartment. A UV flashlight.",
        colour: '#1a1a08',
        x: 0.025, y: 0.35, w: 0.09, h: 0.12,
        contains: [{ item: 'uv_flashlight' }]
      },
      // Filing inbox (AF version — boring junk, different cipher)
      {
        id: 'filing_inbox_af', type: 'cover', label: 'Filing Inbox',
        description: "Lot's of boring junk in here!",
        searchText: "You rifle through the junk. Finds something.",
        colour: '#1a1208',
        x: 0.17, y: 0.50, w: 0.15, h: 0.28,
        contains: [{ item: 'employee_badge' }, { item: 'cipher_key_af_1' }]
      },
      // Wall clock (prop — stopped at -1:67)
      {
        id: 'wall_clock_af', type: 'cover', label: 'Wall Clock',
        description: 'A wall clock. It reads -1:67. That is not a valid time.',
        searchText: 'Lots of dust. The clock reads -1:67. Someone broke physics.',
        colour: '#1a1408',
        x: 0.44, y: 0.05, w: 0.12, h: 0.22
      },
      // Carpet (cover — clue is searchText, NOT UV)
      {
        id: 'carpet_af', type: 'cover', label: 'Carpet',
        description: 'A carpet. It looks normal. Suspiciously normal.',
        searchText: 'hour plus min',
        uvText: 'nobody searches the carpet',
        colour: '#180808',
        x: 0.07, y: 0.82, w: 0.82, h: 0.15,
        easterEggClicks: 4, easterEggId: 'carpet_clicks'
      },
      // Locked cabinet (safe — code 066)
      {
        id: 'locked_cabinet_af_r1', type: 'safe', label: 'Locked Cabinet',
        description: 'A locked cabinet. 3-digit combination.\n\nThe clock reads -1:67.',
        code: '066',
        colour: '#0f1a10',
        x: 0.70, y: 0.24, w: 0.13, h: 0.54,
        contains: [{ item: 'secret_key_af' }],
        easterEggId: 'safe_wrong_code'
      },
      // Tangled cables (cover — gives electrical_wire_af)
      {
        id: 'tangled_cables_af', type: 'cover', label: 'Tangled Cables',
        description: 'A coil of wire. Looks like a snake.',
        searchText: 'After untangling for 20 minutes, you find a usable wire.',
        colour: '#101010',
        x: 0.83, y: 0.65, w: 0.08, h: 0.15,
        contains: [{ item: 'electrical_wire_af' }]
      },
      // Door to AF library
      {
        id: 'door_af_r1_to_r2', type: 'door', label: 'Door to Room 2',
        description: 'A locked door. Needs a key.',
        lockedMessage: 'Locked. Find the key.',
        unlockedMessage: 'The door opens.',
        locked: true,
        keyItem: 'secret_key_af',
        leadsTo: 'af_library',
        colour: '#0a120a',
        x: 0.88, y: 0.10, w: 0.10, h: 0.80
      }
    ]
  },

  // ══════════════════════════════════════════
  //  AF ROOM 2 — LIBRARY (April Fools)
  // ══════════════════════════════════════════
  af_library: {
    id: 'af_library',
    label: 'Room 2 — The Library',
    bg: '#0f080f',
    connections: { left: 'af_anteroom', right: 'af_laboratory' },
    objects: [
      // Bookshelf #1 AF (cover — same paragraph, can be acid'd later)
      {
        id: 'bookshelf_1_af', type: 'cover', label: 'Bookshelf #1',
        description: 'A tall bookshelf. Familiar looking.',
        searchText: 'The laboratory archives contain thousands of classified documents. Each folder holds secrets from decades of research. Scientists recorded every experiment with great precision. Nothing was overlooked by the dedicated staff.',
        colour: '#0e0c08',
        x: 0.02, y: 0.04, w: 0.14, h: 0.76
      },
      // Bookshelf #2 AF (cover — UV text: negative positions)
      {
        id: 'bookshelf_2_af', type: 'cover', label: 'Bookshelf #2',
        description: 'Another bookshelf.',
        searchText: 'Many books.',
        uvText: '-4 · -11 · -20 · -26',
        colour: '#0e0c08',
        x: 0.18, y: 0.04, w: 0.14, h: 0.76
      },
      // Notebook AF (cover — gives cipher_key_af_2)
      {
        id: 'notebook_af', type: 'cover', label: 'Notebook',
        description: 'A notebook. It looks slightly different from the other one.',
        searchText: 'Inside: a hand-written AF cipher reference table.',
        colour: '#12100a',
        x: 0.35, y: 0.62, w: 0.14, h: 0.26,
        contains: [{ item: 'cipher_key_af_2' }]
      },
      // Typewriter AF (puzzle — text_input, reveals power socket)
      {
        id: 'typewriter_af_obj', type: 'puzzle', label: 'Typewriter',
        description: 'An old typewriter. Taped note:\n"Enter 4 words from Bookshelf #1\nThe UV numbers on Bookshelf #2 are negative.\nCount from the BACK. Separate with spaces."',
        solvedDescription: 'The typewriter. [Solved — a hidden compartment opened in the wall.]',
        puzzleId: 'typewriter_af',
        colour: '#12100a',
        x: 0.35, y: 0.25, w: 0.20, h: 0.30
      },
      // Blackboard AF (note — eraser reveals AF cipher)
      {
        id: 'blackboard_af', type: 'note', label: 'Blackboard',
        description: 'A blackboard. Complex equation:\n\n((2^100 × e^π) + ∑(n→∞) + √(-9)) × 0 + 0 = ?\n\nThe answer is 0. That was easy.',
        eraserReveal: '13-1-9-14-6-18-1-13-5',
        colour: '#080f08',
        x: 0.58, y: 0.04, w: 0.22, h: 0.50
      },
      // Power socket fixture (prop — visibleFlag: af_power_socket_revealed)
      {
        id: 'power_socket_af_obj', type: 'prop', label: 'Power Socket',
        description: 'A power socket. It just appeared after the typewriter compartment opened.\n\nSomething with a plug might connect here.',
        visibleFlag: 'af_power_socket_revealed',
        colour: '#101010',
        x: 0.58, y: 0.58, w: 0.08, h: 0.12
      },
      // Employee safe AF (same as normal)
      {
        id: 'employee_safe_af', type: 'safe', label: 'Employee Safe',
        description: "It's a safe. Employees only.\n\nBadge scanner instead of combination lock.",
        itemKey: 'employee_badge',
        colour: '#0f1410',
        x: 0.72, y: 0.50, w: 0.12, h: 0.38,
        contains: [{ item: 'red_access_card' }, { item: 'confidential_papers' }]
      },
      // Computer AF (device)
      {
        id: 'computer_af', type: 'device', label: 'Computer',
        description: 'I forgot my password.',
        colour: '#080f08',
        x: 0.68, y: 0.04, w: 0.12, h: 0.30
      },
      // Door to AF laboratory
      {
        id: 'door_af_r2_to_r3', type: 'door', label: 'Door to Room 3',
        description: 'A reinforced door. Requires a red access card.',
        lockedMessage: 'ACCESS DENIED. Red access card required.',
        unlockedMessage: 'Access granted.',
        locked: true,
        keyItem: 'red_access_card',
        leadsTo: 'af_laboratory',
        colour: '#0a120a',
        x: 0.88, y: 0.10, w: 0.10, h: 0.80
      }
    ]
  },

  // ══════════════════════════════════════════
  //  AF ROOM 3 — LABORATORY (April Fools)
  // ══════════════════════════════════════════
  af_laboratory: {
    id: 'af_laboratory',
    label: 'Room 3 — The Laboratory',
    bg: '#0f080f',
    connections: { left: 'af_library' },
    objects: [
      // Item Analyzer AF (device)
      {
        id: 'item_analyzer_af', type: 'device', label: 'Item Analyzer',
        description: 'ITEM ANALYZER v2.2 (AF Edition)\n\nSearching for the answer to life.\n\nInsert item to analyze.',
        colour: '#0a1a12',
        x: 0.02, y: 0.10, w: 0.16, h: 0.52
      },
      // Labeled Potion AF (cover — searchable, UV is useless)
      {
        id: 'labeled_potion_af', type: 'cover', label: 'Labeled Potion',
        description: 'Very green potion. green green green.',
        searchText: 'Turns out the label was empty. You were expecting something profound.',
        uvText: 'Whoops I forgot',
        colour: '#0a120a',
        x: 0.22, y: 0.62, w: 0.10, h: 0.24
      },
      // Chemical Mixer AF (puzzle — color_mixer, GREEN GREEN GREEN)
      {
        id: 'chem_mixer_af_obj', type: 'puzzle', label: 'Chemical Mixer',
        description: 'A chemical mixing station.\n\nThe green one looks very promising.\nVery very green.',
        solvedDescription: 'The chemical mixer. [Solved — very green output dispensed.]',
        puzzleId: 'chem_mixer_af',
        colour: '#0a1208',
        x: 0.22, y: 0.05, w: 0.22, h: 0.50
      },
      // Power grid panel AF (device)
      {
        id: 'power_grid_af', type: 'device', label: 'Power Grid Panel',
        description: 'Power grid panel. POWER OFFLINE.',
        colour: '#0f100a',
        x: 0.48, y: 0.52, w: 0.14, h: 0.36
      },
      // Mainframe terminal AF (puzzle — text_input, requires power_on_af)
      {
        id: 'mainframe_af_terminal', type: 'puzzle', label: 'Mainframe Terminal',
        description: 'MAINFRAME TERMINAL (AF)\nSTATUS: OFFLINE',
        solvedDescription: 'MAINFRAME TERMINAL\nSTATUS: SOLVED ✓',
        puzzleId: 'mainframe_af',
        colour: '#080f08',
        x: 0.48, y: 0.04, w: 0.22, h: 0.44
      },
      // Locked Cabinet AF (cover — acid_af required)
      {
        id: 'locked_cabinet_af', type: 'cover', label: 'Locked Cabinet',
        description: 'A heavy cabinet. Something is inside.\n\nOrdinary handles won\'t open it. Something corrosive might work.',
        searchText: 'The cabinet is sealed. You need something corrosive.',
        colour: '#0f1410',
        x: 0.74, y: 0.20, w: 0.12, h: 0.60
      },
      // Exit panel AF (safe — code 6666, triggers april_fools win sequence)
      {
        id: 'exit_panel_af', type: 'safe', label: 'Exit Keypad',
        description: 'Exit keypad. Enter the passcode.\n\nSomething about this seems too easy.',
        code: '6666',
        triggersWin: 'april_fools',
        colour: '#160a0a',
        x: 0.88, y: 0.28, w: 0.10, h: 0.44,
        easterEggId: 'safe_wrong_code'
      }
    ]
  },

  // ══════════════════════════════════════════
  //  AF ROOM 4 — THE TROLL EXIT (April Fools)
  // ══════════════════════════════════════════
  af_exit_room: {
    id: 'af_exit_room',
    label: 'Room 4 — The Exit',
    bg: '#100808',
    connections: {},
    objects: [
      // Troll note
      {
        id: 'note_troll', type: 'note', label: 'Mysterious Note',
        description: 'Only one of these doors is real.\nThe others will void your run.\nProceed carefully.\n\n(This room was made by AI.)',
        colour: '#1a1208',
        x: 0.02, y: 0.05, w: 0.12, h: 0.22
      },
      // Neon EXIT sign
      {
        id: 'neon_exit_af', type: 'prop', label: 'Neon EXIT Sign',
        description: 'Flashes aggressively. Points at nothing in particular.',
        colour: '#200808',
        x: 0.36, y: 0.02, w: 0.28, h: 0.11
      },
      // Big Red Button
      {
        id: 'big_red_button_af', type: 'prop', label: 'BIG RED BUTTON',
        description: 'BIG RED BUTTON. DO NOT PRESS.\n\nYou pressed it. Nothing happened. Or did it?',
        colour: '#200808',
        x: 0.16, y: 0.05, w: 0.08, h: 0.16
      },
      // Rubber Duck
      {
        id: 'rubber_duck_af', type: 'prop', label: 'Rubber Duck',
        description: 'It stares at you judgmentally.',
        colour: '#1a1208',
        x: 0.27, y: 0.05, w: 0.07, h: 0.12
      },
      // Grandfather Clock
      {
        id: 'grandfather_clock_af', type: 'prop', label: 'Grandfather Clock',
        description: 'The time reads 4:20. Nice.',
        colour: '#12100a',
        x: 0.80, y: 0.04, w: 0.08, h: 0.58
      },
      // Fake Plant
      {
        id: 'fake_plant_af', type: 'prop', label: 'Fake Plant',
        description: 'Impressively fake. The plastic looks almost real.',
        colour: '#0a1a08',
        x: 0.69, y: 0.38, w: 0.09, h: 0.38
      },
      // Mirror
      {
        id: 'mirror_af', type: 'prop', label: 'Mirror',
        description: 'You look surprisingly composed for someone who just escaped 3 rooms.',
        colour: '#0a0a14',
        x: 0.02, y: 0.34, w: 0.08, h: 0.30
      },
      // Pile of Paperwork (cover)
      {
        id: 'pile_paperwork_af', type: 'cover', label: 'Pile of Paperwork',
        description: 'More forms. Always more forms.',
        searchText: 'Form 27-B/6. For the record. You don\'t know what this is for.',
        colour: '#1a1608',
        x: 0.80, y: 0.65, w: 0.10, h: 0.22
      },
      // Vending Machine (cover)
      {
        id: 'vending_machine_af', type: 'cover', label: 'Vending Machine',
        description: 'Out of order. As usual.',
        searchText: 'You bang the side and a chocolate bar falls out.',
        colour: '#0e0e12',
        x: 0.90, y: 0.05, w: 0.08, h: 0.60,
        contains: [{ item: 'snack_af' }]
      },
      // Coffee Machine (cover)
      {
        id: 'coffee_machine_af', type: 'cover', label: 'Coffee Machine',
        description: 'Possibly functional.',
        searchText: 'It dispenses lukewarm coffee. You take it.',
        colour: '#0e0e0e',
        x: 0.69, y: 0.04, w: 0.09, h: 0.32,
        contains: [{ item: 'lukewarm_coffee_af' }]
      },
      // ── Five Doors (all lead to __EXIT__) ──
      {
        id: 'door_af_r4_1', type: 'door', label: 'Door #1',
        description: 'A door. Probably real.',
        locked: false, leadsTo: '__EXIT__',
        colour: '#0a160a',
        x: 0.02, y: 0.38, w: 0.08, h: 0.58
      },
      {
        id: 'door_af_r4_2', type: 'door', label: 'Door #2',
        description: 'A very suspicious door.',
        locked: false, leadsTo: '__EXIT__',
        colour: '#0a160a',
        x: 0.12, y: 0.38, w: 0.08, h: 0.58
      },
      {
        id: 'door_af_r4_3', type: 'door', label: 'Door #3',
        description: 'This one looks legit.',
        locked: false, leadsTo: '__EXIT__',
        colour: '#0a160a',
        x: 0.22, y: 0.38, w: 0.08, h: 0.58
      },
      {
        id: 'door_af_r4_4', type: 'door', label: 'Door #4',
        description: 'The most normal door.',
        locked: false, leadsTo: '__EXIT__',
        colour: '#0a160a',
        x: 0.32, y: 0.38, w: 0.08, h: 0.58
      },
      {
        id: 'door_af_r4_5', type: 'door', label: 'Door #5',
        description: 'This one was added last minute.',
        locked: false, leadsTo: '__EXIT__',
        colour: '#0a160a',
        x: 0.42, y: 0.38, w: 0.08, h: 0.58
      }
    ]
  }

}; // end ROOMS

// ===== TUTORIAL =====
const TUTORIAL_STEPS = [
  {
    html: `<h2>WELCOME</h2><p>You are locked in. Find a way out.</p><p>Click objects on the canvas to interact with them.</p>`
  },
  {
    html: `<h2>SEARCHING</h2><p>Click <strong>covers</strong> (desks, shelves, carpets) to reveal hidden items.<br>Found items go into your inventory at the bottom.</p>`
  },
  {
    html: `<h2>USING ITEMS</h2><p>When a notice popup is open, your <strong>inventory appears on the right sidebar</strong>.<br>Click an item to use it on the current object.</p>`
  },
  {
    html: `<h2>UV FLASHLIGHT</h2><p>Some surfaces have <strong>hidden writing</strong> only visible under UV light.<br>Find the UV flashlight — then re-examine surfaces for hidden clues.</p>`
  },
  {
    html: `<h2>NAVIGATION</h2><p>Use the <strong>← → arrow buttons</strong> or keyboard arrows to move between rooms.<br>Locked doors need the right key or access card.</p>`
  },
  {
    html: `<h2>GOOD LUCK</h2><p>Observe everything. Connect the clues. Escape.</p><p style="color:var(--amber);font-size:0.85rem;">⚠ This is an April 1st escape room. Something may be... off.</p>`
  }
];

// ===== WINDOW SCENES =====
const WINDOW_SCENES = {
  night_city: {
    label: 'Night City',
    skyColor: ['#020810', '#080820'],
    stars: true,
    clockTime: { h: 8, m: 37 }
  },
  night_city_af: {
    label: 'Night City (AF)',
    skyColor: ['#0f0208', '#200a08'],
    stars: true,
    clockTime: { h: 4, m: 20 }
  }
};

// ===== EXPORTS =====
window.GAME_ROOMS    = ROOMS;
window.GAME_ITEMS    = ITEMS;
window.GAME_PUZZLES  = PUZZLES;
window.GAME_TUTORIAL = TUTORIAL_STEPS;
window.GAME_EASTER_EGGS = EASTER_EGGS;
window.WINDOW_SCENES = WINDOW_SCENES;
