


// Candy Gambling — Day 1 game logic


// Elements
const deckEl = document.getElementById('deck');
const discardEl = document.getElementById('discard-pile');
const deckCountEl = document.querySelector('#deck .deck-count');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const stopBtn = document.getElementById('stop-btn');
const restartBtn = document.getElementById('restart-btn');
const countdownEl = document.getElementById('countdown');


// Game state
let deck = [];
let discard = [];
let score = 0;
let lives = 1;
let scoringEnabled = true;


// Constants
const DECK_SIZE = 256;
// Event end: October 28, 00:00 local time
const eventEnd = new Date(new Date().getFullYear(), 9, 28, 0, 0, 0); // month is 0-indexed => 9 = Oct


// Utility: shuffle array in place
function shuffle(array) {
   for (let i = array.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [array[i], array[j]] = [array[j], array[i]];
   }
}


// Build explicit deck composition per requirements:
// 8 jumpscares/pumpkins (jumpscare if scary mode on, pumpkin if off)
// 2 +1 life
// 6 shuffle
// 40 special cards (30 good, 10 bad)
// 150 positive cards (fixed set)
// 50 negative cards
function createDeck() {
   const newDeck = [];
   let id = 1;


   // 8 jumpscares
   for (let i = 0; i < 8; i++) newDeck.push({ id: id++, kind: 'jumpscare' });


   // 2 +1 life
   for (let i = 0; i < 2; i++) newDeck.push({ id: id++, kind: 'life', value: 1 });


   // 6 shuffle cards
   for (let i = 0; i < 6; i++) newDeck.push({ id: id++, kind: 'shuffle' });


   // 40 special cards (30 good, 10 bad)
   const goodSpecials = [
       { name: 'double_next', desc: 'Double next draw' },
       { name: 'peek3', desc: 'See top 3' },
       { name: 'gain50', desc: 'Gain 50 points' },
       { name: 'extra_life', desc: 'Gain 1 life' }
   ];
   const badSpecials = [
       { name: 'lose_half', desc: 'Lose half points' },
       { name: 'curse_next', desc: 'Next draw costs a life' }
   ];
   // add 30 good specials (cycle through goodSpecials)
   for (let i = 0; i < 30; i++) {
       const s = goodSpecials[i % goodSpecials.length];
       newDeck.push({ id: id++, kind: 'special', special: s.name, good: true });
   }
   // add 10 bad specials
   for (let i = 0; i < 10; i++) {
       const s = badSpecials[i % badSpecials.length];
       newDeck.push({ id: id++, kind: 'special', special: s.name, good: false });
   }


   // 150 positive fixed cards — we'll make them deterministic values: 1..6 repeated
   const positives = [];
   for (let v = 1; v <= 6; v++) {
       const repeat = Math.floor(150 / 6); // 25 each -> 150
       for (let r = 0; r < repeat; r++) positives.push({ id: id++, kind: 'positive', value: v });
   }
   // If rounding left any, fill with 1s
   while (positives.length < 150) positives.push({ id: id++, kind: 'positive', value: 1 });
   newDeck.push(...positives);


   // 50 negative cards — fixed values -1 .. -3 repeated to be predictable
   const negatives = [];
   for (let i = 0; i < 50; i++) negatives.push({ id: id++, kind: 'negative', value: -(1 + (i % 3)) });
   newDeck.push(...negatives);


   // Ensure we have exactly DECK_SIZE
   if (newDeck.length !== DECK_SIZE) {
       // if too many/too few, trim or fill with small positive cards
       if (newDeck.length > DECK_SIZE) newDeck.splice(DECK_SIZE);
       while (newDeck.length < DECK_SIZE) newDeck.push({ id: id++, kind: 'positive', value: 1 });
   }


   shuffle(newDeck);
   return newDeck;
}


function updateUI() {
   deckCountEl.textContent = deck.length;
   scoreEl.textContent = score;
   livesEl.textContent = lives;
}


function renderTopDiscard() {
   discardEl.querySelectorAll('.card').forEach(n => n.remove());
   if (discard.length === 0) return;
   const top = discard[discard.length - 1];
   const cardEl = document.createElement('div');
   cardEl.className = 'card';
   // show a friendly representation
   if (top.kind === 'positive') cardEl.textContent = `+${top.value}`;
   else if (top.kind === 'negative') cardEl.textContent = `${top.value}`;
   else if (top.kind === 'jumpscare') cardEl.textContent = '!!!';
   else if (top.kind === 'life') cardEl.textContent = '+1';
   else if (top.kind === 'shuffle') cardEl.textContent = '⇄';
   else if (top.kind === 'special') cardEl.textContent = top.special;
   discardEl.appendChild(cardEl);
}


let modifiers = {
   doubleNext: false,
   cursedNext: false
};


function doJumpscareOverlay(type) {
   const overlay = document.getElementById('jumpscare-overlay');
   const content = document.getElementById('jumpscare-content');
   if (!overlay || !content) return;
   if (type === 'jumpscare') {
       content.textContent = '😱 JUMPSCARE!';
   } else {
       content.textContent = '🎃 PUMPKIN!';
   }
   overlay.classList.remove('hidden');
   setTimeout(() => overlay.classList.add('hidden'), 1400);
}


function drawCard() {
   if (deck.length === 0) {
       deck = discard.splice(0);
       shuffle(deck);
   }
   if (deck.length === 0) return;


   const card = deck.pop();
   discard.push(card);
   // handle visual and effect
   handleCard(card);
   renderTopDiscard();
   updateUI();
}


function handleCard(card) {
   switch (card.kind) {
       case 'positive':
           let val = card.value;
           if (modifiers.doubleNext) { val *= 2; modifiers.doubleNext = false; }
           if (scoringEnabled) score += val;
           break;
       case 'negative':
           if (scoringEnabled) {
               score += card.value; // negative
               if (score < 0) { score = 0; lives -= 1; }
           }
           break;
       case 'jumpscare':
           // show jumpscare or pumpkin depending on scaryMode (which lives in index.js). We'll read localStorage flag 'scaryMode'.
           const scary = localStorage.getItem('scaryMode') === 'true';
           if (scary) {
               doJumpscareOverlay('jumpscare');
           } else {
               doJumpscareOverlay('pumpkin');
           }
           // remove a life (only if scoring enabled)
           if (scoringEnabled) lives -= 1;
           break;
       case 'life':
           if (scoringEnabled) lives += card.value || 1;
           break;
       case 'shuffle':
           // shuffle deck + discard together
           deck = deck.concat(discard.splice(0));
           shuffle(deck);
           break;
       case 'special':
           applySpecial(card);
           break;
   }


   // check lives
   if (lives <= 0) {
       // out of lives: clear score and restart without saving
       score = 0;
       resetGame();
   }
}


function applySpecial(card) {
   // implement a few special behaviors
   switch (card.special) {
       case 'double_next':
           modifiers.doubleNext = true;
           showPeek(`Double next draw!`);
           break;
       case 'peek3':
           showPeekTop(3);
           break;
       case 'gain50':
           score += 50;
           showPeek('+50!');
           break;
       case 'extra_life':
           lives += 1;
           showPeek('+1 life');
           break;
       case 'lose_half':
           score = Math.floor(score / 2);
           showPeek('Lost half!');
           break;
       case 'curse_next':
           modifiers.cursedNext = true;
           showPeek('Next draw costs a life');
           break;
       default:
           showPeek('Special');
   }
}


// Peek UI helpers
function showPeek(message, autoHide = true) {
   const preview = document.getElementById('peek-preview');
   const inner = preview ? preview.querySelector('.peek-inner') : null;
   if (!preview || !inner) return;
   inner.textContent = message;
   preview.classList.remove('hidden');
   if (autoHide) {
       setTimeout(() => preview.classList.add('hidden'), 3000);
   }
}


function showPeekTop(n) {
   const top = deck.slice(-n).reverse();
   const repr = top.map(c => {
       if (c.kind === 'positive') return `+${c.value}`;
       if (c.kind === 'negative') return `${c.value}`;
       if (c.kind === 'jumpscare') return '🎃/😱';
       if (c.kind === 'life') return '+1L';
       if (c.kind === 'shuffle') return 'SHUFFLE';
       if (c.kind === 'special') return `S:${c.special}`;
       return '?';
   }).join(', ');
   showPeek(repr);
}


// close peek button handler
const peekClose = document.getElementById('peek-close');
if (peekClose) peekClose.addEventListener('click', () => {
   const preview = document.getElementById('peek-preview');
   if (preview) preview.classList.add('hidden');
});


// Ensure score changes only happen while scoringEnabled, but visual/effects still run
// (Adjustments already made in handleCard where necessary)


function resetGame() {
   deck = createDeck();
   discard = [];
   score = 0;
   lives = 1;
   scoringEnabled = (new Date() < eventEnd);
   deckEl.classList.remove('dead');
   renderTopDiscard();
   updateUI();
}


function stopAndSave() {
   // push to a simple local leaderboard
   const board = JSON.parse(localStorage.getItem('day1_leaderboard') || '[]');
   board.push({ score, ts: Date.now() });
   localStorage.setItem('day1_leaderboard', JSON.stringify(board));
   resetGame();
}


function restartGame() {
   resetGame();
}


// Countdown logic to eventEnd
function updateCountdown() {
   const now = new Date();
   const diff = eventEnd - now;
   if (diff <= 0) {
       countdownEl.textContent = '00:00:00';
       scoringEnabled = false;
       return;
   }
   const hrs = Math.floor(diff / (1000 * 60 * 60));
   const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
   const secs = Math.floor((diff % (1000 * 60)) / 1000);
   countdownEl.textContent = `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}


// Event listeners
if (deckEl) {
   deckEl.addEventListener('click', () => {
       if (lives <= 0) return;
       // if cursedNext modifier active, drawing costs a life and cancels the curse
       if (modifiers.cursedNext) {
           modifiers.cursedNext = false;
           lives -= 1;
           if (lives <= 0) { score = 0; resetGame(); return; }
       }
       drawCard();
   });
}
if (stopBtn) stopBtn.addEventListener('click', () => stopAndSave());
if (restartBtn) restartBtn.addEventListener('click', () => restartGame());


// initialization
resetGame();
updateCountdown();
setInterval(updateCountdown, 1000);


// expose for debugging
window.day1 = { resetGame, drawCard, stopAndSave };





