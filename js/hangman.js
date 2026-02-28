// Simple Hangman implementation for the Hangman page
const HANGMAN_WORDS = [
  'javascript','pookie','hangman','developer','browser','localstorage','cookie','service','offline','game'
];

let state = {
  secret: '',
  guessed: new Set(),
  wrong: 0,
  maxWrong: 6,
  scores: { x: 0, o: 0, played: 0 },
  history: []
};

function pickWord(){
  const w = HANGMAN_WORDS[Math.floor(Math.random()*HANGMAN_WORDS.length)];
  return w.toUpperCase();
}

function startNewGame(){
  state.secret = pickWord();
  state.guessed = new Set();
  state.wrong = 0;
  document.getElementById('gameStatus').textContent = 'Good luck!';
  renderWord();
  renderLetters();
  updateHangmanDrawing();
}

function renderWord(){
  const el = document.getElementById('wordDisplay');
  const chars = state.secret.split('').map(ch => (ch === ' ' ? ' ' : (state.guessed.has(ch) ? ch : '_')));
  el.textContent = chars.join(' ');
  checkWin();
}

function renderLetters(){
  const container = document.getElementById('lettersContainer');
  container.innerHTML = '';
  for(let i=65;i<=90;i++){
    const letter = String.fromCharCode(i);
    const btn = document.createElement('button');
    btn.textContent = letter;
    btn.dataset.letter = letter;
    btn.onclick = () => handleLetter(letter, btn);
    if(state.guessed.has(letter)) btn.classList.add('disabled');
    container.appendChild(btn);
  }
}

function handleLetter(letter, btn){
  if(state.guessed.has(letter) || state.wrong >= state.maxWrong) return;
  state.guessed.add(letter);
  btn.classList.add('disabled');
  if(state.secret.includes(letter)){
    renderWord();
  } else {
    state.wrong += 1;
    updateHangmanDrawing();
    checkLose();
  }
}

function updateHangmanDrawing(){
  const d = document.getElementById('hangmanDrawing');
  // simple textual representation of progress
  d.textContent = '⚫'.repeat(state.wrong) + '⚪'.repeat(state.maxWrong - state.wrong);
}

function checkWin(){
  if(!state.secret) return;
  const revealed = state.secret.split('').every(ch => ch === ' ' || state.guessed.has(ch));
  if(revealed){
    document.getElementById('gameStatus').textContent = 'You won! 🎉';
    state.scores.x += 1;
    finishRound(true);
  }
}

function checkLose(){
  if(state.wrong >= state.maxWrong){
    document.getElementById('gameStatus').textContent = 'You lost — word: ' + state.secret;
    state.scores.o += 1;
    finishRound(false);
  }
}

function finishRound(won){
  state.scores.played += 1;
  saveScores();
  state.history.unshift({ word: state.secret, won, time: Date.now() });
  saveHistory();
  updateHistoryDisplay();
  updateScores();
}

function saveScores(){
  localStorage.setItem('hangmanScores', JSON.stringify(state.scores));
}

function loadScores(){
  const s = localStorage.getItem('hangmanScores');
  if(s) state.scores = JSON.parse(s);
  updateScores();
}

function updateScores(){
  document.getElementById('scoreX').textContent = state.scores.x || 0;
  document.getElementById('scoreO').textContent = state.scores.o || 0;
  document.getElementById('scorePlayed').textContent = state.scores.played || 0;
}

function saveHistory(){
  localStorage.setItem('hangmanHistory', JSON.stringify(state.history.slice(0,50)));
}

function loadHistory(){
  const h = localStorage.getItem('hangmanHistory');
  if(h) state.history = JSON.parse(h);
  updateHistoryDisplay();
}

function updateHistoryDisplay(){
  const container = document.getElementById('historyContentDisplay');
  if(!container) return;
  container.innerHTML = '';
  if(state.history.length === 0){
    container.textContent = 'No games yet.';
    return;
  }
  const ul = document.createElement('ul');
  state.history.forEach(item => {
    const li = document.createElement('li');
    const date = new Date(item.time).toLocaleString();
    li.textContent = `${item.word} — ${item.won ? 'Won' : 'Lost'} — ${date}`;
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

function resetScores(){
  state.scores = { x:0, o:0, played:0 };
  saveScores();
  updateScores();
}

function init(){
  loadScores();
  loadHistory();
  startNewGame();
}

window.addEventListener('DOMContentLoaded', init);
