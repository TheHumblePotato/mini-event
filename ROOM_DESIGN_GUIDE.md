# ESCAPE ROOM — Full Design Guide
## "April -1st" by Dr. F

---

## DEMO VERSION PUZZLE FLOW (current implementation)

### Room 1 — The Study
**Items found here:** Rusty Key (under carpet), Crumpled Note + UV Flashlight (desk)
**Objects:** Flickering Lamp (animated morse device — input is in Room 2), Symbol Panel (puzzle), Oil Painting (note — shows clock tower), Window (shows courtyard with clock at 7:35)

**Puzzle chain:**
1. Search carpet → get **Rusty Key**
2. Search desk → get **Crumpled Note** ("watch the light, then look at the stars") + **UV Flashlight**
3. Look at flickering lamp (animated morse device — spells SUN). Note says to decode the light.
4. Note also says "look at the painting" — painting shows clock tower.
5. Symbol Panel → enter SUN, MOON, STAR (in that order, clued by crumpled note saying "order matters, watch the light, look at the stars" → SUN = light, MOON/STAR = stars) → unlocks storage door
6. Use Rusty Key on storage door OR solve symbol panel (either works as key)

**Easter eggs:**
- Click bookshelf 5 times → hidden message
- Use UV light on painting → inscription from Dr. F
- Scratch in desk found after searching

---

### Room 2 — The Storage Room
**Items found here:** Torn Paper A (shelf), Wire Fragment (drops when morse solved)
**Objects:** Signal Decoder (morse puzzle input), Fuse Box (wires puzzle), Metal Shelf (cover), Blank Wall (UV reveals code hint)

**Puzzle chain:**
1. Interact with Signal Decoder → enter "SUN" (decoded from lamp in Room 1) → Wire Fragment drops
2. Search shelf → get **Torn Paper A** ("clock in the lab... code is sum of the sequence")
3. Use UV light on blank wall → "SUM = CODE. Don't forget the leading zero."
4. Fix Fuse Box (wire matching puzzle) → unlocks power door to Room 3

---

### Room 3 — The Lab
**Items found here:** Torn Paper B (filing cabinet), Lab Keycard (slider reward)
**Objects:** Tile Board (slider puzzle → keycard), Antique Clock (puzzle → reveals safe), Wall Safe (4-digit code → nothing, keycard was in slider), Exit Door (requires keycard)

**Puzzle chain:**
1. Search filing cabinet → get **Torn Paper B** ("Sequence values: SUN=3, MOON=7, STAR=5. Add them up.")
2. Solve Tile Board (slider) → get **Lab Keycard**
3. Solve Antique Clock (set to 7:35, from painting in Room 1) → Wall Safe revealed
4. Enter code **0015** on Wall Safe (3+7+5=15, from notes A+B, leading zero from UV wall) → safe opens (empty, keycard was from slider — confirmation they got right code)
5. Use Lab Keycard on exit door → **ESCAPED**

**Note connections:**
- Torn Note A + Torn Note B are halves of the same paper (torn in storage and lab)
- Together they say: "The clock in the lab — set it to the time in the painting. And remember: the code is the sum of the sequence. Sequence values: SUN=3, MOON=7, STAR=5. Add them up. — Dr. F"

---

### April Fools Version (same rooms, different clues)
- Painting shows 8:35 (WRONG) — correct answer still 7:35
- Carpet has "Suspicious Key" (wrong key) — real Rusty Key is in fool_storage shelf
- Desk has "Suspiciously Helpful Note" (lies about sequence order and code)
- Fool note says STAR SUN MOON (that IS the fool panel order)
- Fool note says code is 15 (that IS the right code — fool note accidentally tells truth)
- UV wall says "the helpful note told you the right number. Funny, right?"
- Fool clock description says "the painting lied"
- Easter egg messages slightly different

---

## REAL ESCAPE ROOM DESIGN PROPOSAL

### Theme: "Dr. Fenton's Lab"
You've been hired to audit Dr. Fenton's abandoned research lab. The last person to leave locked everything up with a custom puzzle system. You have 30 minutes before the building's power fails permanently.

---

### Room 1 — The Anteroom (Entry Hall)
*First impressions. Fairly simple to ease players in.*

**Aesthetic:** Dark wood paneling, faded certificates on walls, a hat rack, an intercom on the wall.

**Objects:**
- **Hat rack** (prop, but one hat has a UV pen hidden inside)
- **Filing inbox** (cover) → contains "Employee Badge" (decorative) and torn half of a cipher key
- **Wall clock** (device, animated — shows real-time; stopped at 4:17 for a reason)
- **Intercom** (device, animated — crackles and plays recorded message hinting at next room)
- **Locked cabinet** (safe, 3-digit code) → contains "Maintenance Key" → opens door to Room 2
  - Code: shadow of hat rack at "4:17" points to 3 numbers on the floor mat

**Puzzle:** Figure out that the wall clock is stopped at 4:17. Use the stopped time to find the shadow. The floor mat has faint numbers. The shadow covers 3 numbers → code. 

---

### Room 2 — The Library / Archive
*Mid-difficulty. Two interacting puzzles.*

**Aesthetic:** Shelves of journals, a locked specimen case, a mechanical typewriter, blacklight reactive hidden text.

**Objects:**
- **Bookshelf** (cover, multiple searches) → first search: torn half of cipher key; second: UV pen (if not found in R1)
- **Specimen case** (safe, key lock) → Maintenance Key from R1 opens it → "Compound Sample" (keycard-shaped glass vial, red)
- **Typewriter** (puzzle) → player must type a 5-letter word; hints are in journal titles on shelf
  - Journal titles: "VIOLET Studies", "EMBER Research", "NICKEL Compositions", "ULCER Theory", "SILEX Observations" → first letters = VENUS → type VENUS → unlocks hidden drawer
- **Hidden drawer** (opens when typewriter solved) → contains "Red Access Card"
- **Blackboard** (note) → equations that look complicated but simplify to three digits (the cipher)
- **Door to Room 3** → requires Red Access Card

**Puzzle:** Cipher from both torn halves (R1 + R2 search) decodes the blackboard equations. Typewriter word from journal initials. Card → door.

---

### Room 3 — The Laboratory
*Complex, multiple parallel threads.*

**Aesthetic:** Sterile white lab, glowing equipment, biohazard stickers, a sealed chamber window (animated).

**Objects:**
- **Sealed chamber window** (window type, animated) → shows interior of containment chamber with glowing symbols cycling
- **Chemical board** (note) → 3 chemical formulas, each with a color → red=2, blue=5, yellow=8
- **Mixing station** (puzzle, wires-style but with colored beakers) → pour red+blue+yellow in right proportions
  - Correct order from chemical board: 2 red + 5 blue + 8 yellow = pour sequence
  - Unlocks "Catalyst Cartridge" item
- **Power grid panel** (puzzle, switches) → 6 switches, correct configuration shown on back of Employee Badge (from R1) under UV light → powers the mainframe
- **Mainframe terminal** (puzzle, text input) → powered by switches → shows Dr. F's login puzzle: 
  - "My password is my mother's name backwards + year of my first paper"
  - Mother's name: clue in R2 journal dedication "To Margaret, always"  → TEGRAM
  - Year: visible on diploma in R1 → 1987
  - Password: TEGRAM1987
- **Exit airlock** (door) → requires Catalyst Cartridge + Mainframe unlocked

**Puzzle threads:**
- Thread A: Catalyst Cartridge (chemical board → mixing station)
- Thread B: Mainframe (UV badge → switches → terminal → login)
- Both required for airlock

---

### April Fools Version of Real Rooms
- Chemical board has wrong colors (swapped)
- Journal initials still spell VENUS but one is mislabeled; the correct one is hidden inside a different book
- Mainframe year is different on the diploma (but correct year is in UV text on diploma)
- Sealed chamber window shows wrong symbols (they cycle faster, everything is shifted by 1)
- All locks are 1 digit off unless player has figured out the pattern

---

### Cross-Room Linked Animations
1. **Intercom in R1** ↔ **speaker crackle in R2** — solving the cabinet in R1 triggers a "click" sound effect indicated in R2
2. **Switches in R3** ↔ **flickering lights in R2** — setting wrong configuration in R3 makes R2's lights flicker (visual feedback in other room)
3. **Sealed chamber window in R3** — the symbols it shows are the clue for the mixing station puzzle (player must note them down)

---

### Easter Eggs (Real Version)
- Click the hat in R1 eight times → the hat falls off the rack
- Enter 0000 in any safe → "No."
- Type DRFENTON in the typewriter → it responds "I see you found my machine."
- Read all journals in R2 → "You've read every word. Dr. F was remarkably verbose."
- Solve R3 in under 5 minutes → secret win message: "Suspiciously fast. Dr. F would be impressed."
- Enter 1234 in the safe → "...really?"

---

### Rough Difficulty Curve
- R1: Tutorial difficulty. One puzzle, very linear.
- R2: Moderate. Two puzzles with slight dependency.
- R3: Hard. Three parallel threads, cross-room linked clues.
- Total target time: 20–35 minutes for a group of 2–4.

---

### Items Summary
| Item | Found In | Used In |
|------|----------|---------|
| UV Pen | R1 hat rack | R2 blackboard / R3 diploma |
| Torn Cipher A | R1 inbox | Combine with B |
| Maintenance Key | R1 safe (code) | R2 specimen case |
| Torn Cipher B | R2 shelf | Combine with A |
| Red Access Card | R2 hidden drawer | R2→R3 door |
| Employee Badge | R1 inbox | R3 switches (UV) |
| Catalyst Cartridge | R3 mixing station | R3 airlock |
| (Mainframe unlock) | R3 terminal | R3 airlock |
