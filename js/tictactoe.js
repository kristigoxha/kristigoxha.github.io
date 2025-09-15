// tictactoe.js - Tic Tac Toe Game Logic

// Supabase initialization
const SUPABASE_URL = 'https://bcjmlhxuakqqqdjrtntj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjam1saHh1YWtxcXFkanJ0bnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTMxMzYsImV4cCI6MjA2NjE2OTEzNn0.3vV15QSv4y3mNRJfARPHlk-GvJGO65r594ss5kSGK3Y';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentUser = null;
let pookieUser = null;
let currentGame = null;
let gameSubscription = null;
let mySymbol = null;
let opponentSymbol = null;
let isMyTurn = false;
let gameHistory = [];
let currentTab = 'game';

// Check authentication
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    
    if (!currentUser) {
        window.location.href = '/';
        return;
    }
    
    await findPookie();
}

// Find pookie (the other user)
async function findPookie() {
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id)
        .limit(1);
    
    if (profiles && profiles.length > 0) {
        pookieUser = profiles[0];
    }
}

// Initialize Tic Tac Toe
async function initializeTicTacToe() {
    await loadTodayScores();
    
    const cells = document.querySelectorAll('.tictactoe-cell');
    cells.forEach(cell => {
        cell.removeEventListener('click', handleCellClick);
        cell.addEventListener('click', handleCellClick);
    });
    
    await checkActiveGame();
}

// Check for active game
// Check for latest active game and auto-resume
async function checkActiveGame() {
  if (!currentUser) return;

  // (Optional but nice) If pookie not loaded yet, try to fetch it
  if (!pookieUser) await findPookie();

  const { data: game, error } = await supabase
    .from('tictactoe_games')
    .select('*')
    .or(`player1_id.eq.${currentUser.id},player2_id.eq.${currentUser.id}`)
    .eq('status', 'active')
    .order('updated_at', { ascending: false }) // latest first
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Active game lookup error:', error);
    updateGameStatus('Could not check for an active game.');
    return;
  }

  if (game) {
    currentGame = game;
    await resumeGame(); // uses player1=X, player2=O logic you already set
  } else {
    // No active game: make sure the UI is ready to start one
    document.getElementById('startGameBtn')?.removeAttribute('disabled');
    updateGameStatus("No active game. Click 'Start New Game' to play.");
  }
}

// Start New Game
async function startNewGame() {
    console.log('Starting new game...');

    if (!currentUser || !pookieUser) {
        updateGameStatus('Please wait, loading profiles...');
        await findPookie();
        if (!pookieUser) {
            updateGameStatus('Cannot find pookie!');
            return;
        }
    }

    // End any existing active game
    if (currentGame && currentGame.status === 'active') {
        await supabase
            .from('tictactoe_games')
            .update({ status: 'completed', winner: 'abandoned' })
            .eq('id', currentGame.id);
    }

    showDiceAnimation();

    setTimeout(async () => {
        const userIsX = Math.random() < 0.5;

        // IMPORTANT: player1 is ALWAYS X, player2 ALWAYS O
        const player1Id = userIsX ? currentUser.id : pookieUser.id;
        const player2Id = userIsX ? pookieUser.id : currentUser.id;

        const { data: game, error } = await supabase
            .from('tictactoe_games')
            .insert({
                player1_id: player1Id,     // X
                player2_id: player2Id,     // O
                board: ['', '', '', '', '', '', '', '', ''],
                current_turn: 'X',
                status: 'active',
				updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating game:', error);
            updateGameStatus('Error creating game. Please try again.');
            document.getElementById('diceContainer').style.display = 'none';
            return;
        }

        currentGame = game;

        // Compute symbols from who is player1, not from the earlier coin flip
        const iAmPlayer1 = currentUser.id === game.player1_id;
        mySymbol = iAmPlayer1 ? 'X' : 'O';
        opponentSymbol = iAmPlayer1 ? 'O' : 'X';
        isMyTurn = mySymbol === 'X';

        clearBoard();
        subscribeToGame(game.id);

        document.getElementById('diceResult').textContent =
            iAmPlayer1 ? 'You go first (X)!' : 'Pookie goes first (X)!';

        setTimeout(() => {
            document.getElementById('diceContainer').style.display = 'none';
            updateBoard(game.board);
            updateTurnIndicators();
            updateGameStatus(isMyTurn ? 'Your turn!' : "Waiting for pookie's move...");
            document.getElementById('startGameBtn').disabled = true;
        }, 2000);
    }, 1000);
}

// Clear board
function clearBoard() {
    const cells = document.querySelectorAll('.tictactoe-cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('disabled', 'winning');
    });
}

// Subscribe to real-time game updates
function subscribeToGame(gameId) {
    if (gameSubscription) {
        gameSubscription.unsubscribe();
    }
    
    gameSubscription = supabase
        .channel(`game-${gameId}`)
        .on('postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'tictactoe_games',
                filter: `id=eq.${gameId}`
            }, 
            (payload) => {
                handleGameUpdate(payload.new);
            }
        )
        .subscribe();
}

// Handle real-time game updates
async function handleGameUpdate(game) {
  currentGame = game;

  updateBoard(game.board);                 // render first
  checkWinner(game.board);                 // then highlight if any

  isMyTurn = game.current_turn === mySymbol;
  updateTurnIndicators();

  if (game.status === 'completed') {
    await handleGameEnd(game.winner);
  } else {
    updateGameStatus(isMyTurn ? 'Your turn!' : "Waiting for pookie's move...");
  }
}


// Update board display
function updateBoard(board) {
    const cells = document.querySelectorAll('.tictactoe-cell');
    cells.forEach((cell, index) => {
        cell.textContent = board[index];
        cell.classList.toggle('disabled', board[index] !== '');
    });
}

// Update turn indicators
function updateTurnIndicators() {
    document.getElementById('player1Indicator').textContent = `You (${mySymbol || 'X'})`;
    document.getElementById('player2Indicator').textContent = `Pookie (${opponentSymbol || 'O'})`;
    document.getElementById('player1Indicator').classList.toggle('active', isMyTurn);
    document.getElementById('player2Indicator').classList.toggle('active', !isMyTurn);

  const board = document.getElementById('gameBoard');
  if (isMyTurn) {
    board.classList.remove('disabled');
  } else {
    board.classList.add('disabled');
  }
}

// Handle Cell Click
async function handleCellClick(event) {
  const cell = event.target;
  const index = parseInt(cell.dataset.index, 10);  // radix 10

  if (!currentGame || !isMyTurn || currentGame.board[index] !== '' || currentGame.status !== 'active') return;

  isMyTurn = false;                        // lock immediately

  cell.textContent = mySymbol;
  cell.classList.add('disabled');

  const newBoard = [...currentGame.board];
  newBoard[index] = mySymbol;

  const winner = checkWinner(newBoard);
  const isDraw = !winner && newBoard.every(c => c !== '');

  const updates = {
    board: newBoard,
    current_turn: opponentSymbol,
    updated_at: new Date().toISOString()
  };

  if (winner) { updates.winner = mySymbol; updates.status = 'completed'; }
  else if (isDraw) { updates.winner = 'draw'; updates.status = 'completed'; }

const { error, data } = await supabase
  .from('tictactoe_games')
  .update(updates)
  .eq('id', currentGame.id)
  .eq('current_turn', mySymbol)
  .eq('status', 'active')
  .select()            // <= add this so data is returned
  .single();

if (error) {
  console.error('Error updating game:', error);
  cell.textContent = '';
  cell.classList.remove('disabled');
  updateGameStatus('Error making move. Please try again.');
  isMyTurn = true;
	}
}


// Check Winner
function checkWinner(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]  // Diagonals
    ];
    
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            highlightWinningCells(pattern);
            return board[a];
        }
    }
    
    return null;
}

// Highlight Winning Cells
function highlightWinningCells(pattern) {
    pattern.forEach(index => {
        const cell = document.querySelector(`.tictactoe-cell[data-index="${index}"]`);
        cell.classList.add('winning');
    });
}

// Handle Game End
async function handleGameEnd(winner) {
    document.getElementById('startGameBtn').disabled = false;
    
    if (gameSubscription) {
        gameSubscription.unsubscribe();
        gameSubscription = null;
    }
    
    let result;
    let message;
    
    if (winner === 'draw') {
        result = 'draw';
        message = "It's a draw! 🤝";
    } else if (winner === mySymbol) {
        result = 'win';
        message = "You win! 🎉";
    } else if (winner === 'abandoned') {
        message = "Game ended";
        return;
    } else {
        result = 'lose';
        message = "Pookie wins! 🤖";
    }
    
    updateGameStatus(message);
    
    if (result) {
        await saveGameScore(result);
    }
    
    await loadTodayScores();
    currentGame = null;
}

// Save game score to database
async function saveGameScore(result) {
    if (!currentUser || !pookieUser || !currentGame) return;
    
    try {
        await supabase
            .from('tictactoe_scores')
            .insert({
                game_id: currentGame.id,
                player_id: currentUser.id,
                opponent_id: pookieUser.id,
                result: result,
                played_date: new Date().toISOString().split('T')[0]
            });
    } catch (error) {
        console.error('Error saving score:', error);
    }
}

// Resume an active game
async function resumeGame() {
    if (!currentGame || !currentUser) return;

    const iAmPlayer1 = currentGame.player1_id === currentUser.id;
    mySymbol = iAmPlayer1 ? 'X' : 'O';
    opponentSymbol = iAmPlayer1 ? 'O' : 'X';
    isMyTurn = currentGame.current_turn === mySymbol;

    updateBoard(currentGame.board);
    updateTurnIndicators();
    updateGameStatus(isMyTurn ? 'Your turn!' : "Waiting for pookie's move...");

    subscribeToGame(currentGame.id);
    document.getElementById('startGameBtn').disabled = true;
}


// Show Dice Animation
function showDiceAnimation() {
    const diceContainer = document.getElementById('diceContainer');
    const dice = document.getElementById('dice');
    
    diceContainer.style.display = 'flex';
    document.getElementById('diceResult').textContent = '';
    
    let count = 0;
    const interval = setInterval(() => {
        dice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][Math.floor(Math.random() * 6)];
        count++;
        if (count > 10) {
            clearInterval(interval);
            dice.textContent = '🎲';
        }
    }, 100);
}

// Update Game Status
function updateGameStatus(message) {
    const statusEl = document.getElementById('gameStatus');
    statusEl.innerHTML = message.includes('Waiting') ? 
        message.replace('Waiting', '<span class="waiting-indicator">Waiting</span>') : 
        message;
}

// Load Today's Scores
async function loadTodayScores() {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const { data: scores } = await supabase
            .from('tictactoe_scores')
            .select('result')
            .eq('player_id', currentUser.id)
            .eq('played_date', today);
        
        let wins = 0, losses = 0, draws = 0;
        
        if (scores) {
            scores.forEach(score => {
                if (score.result === 'win') wins++;
                else if (score.result === 'lose') losses++;
                else if (score.result === 'draw') draws++;
            });
        }
        
        document.getElementById('scoreX').textContent = wins;
        document.getElementById('scoreO').textContent = losses;
        document.getElementById('scoreDraw').textContent = draws;
    } catch (error) {
        console.error('Error loading scores:', error);
    }
}

// Reset Scores
async function resetScores() {
    if (!confirm("Are you sure you want to reset today's scores?")) {
        return;
    }
    
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
        await supabase
            .from('tictactoe_scores')
            .delete()
            .eq('player_id', currentUser.id)
            .eq('played_date', today);
        
        document.getElementById('scoreX').textContent = '0';
        document.getElementById('scoreO').textContent = '0';
        document.getElementById('scoreDraw').textContent = '0';
        
        updateGameStatus("Scores reset! Click 'Start New Game' to play.");
    } catch (error) {
        console.error('Error resetting scores:', error);
    }
}

// Tab switching
function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tab + 'Content').classList.add('active');
    
    if (tab === 'history') {
        loadGameHistory();
    }
}

// Load Game History
async function loadGameHistory() {
    if (!currentUser) return;
    
    try {
        const { data: games } = await supabase
            .from('tictactoe_scores')
            .select('*')
            .eq('player_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(20);
        
        gameHistory = games || [];
        displayHistory();
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Display History
function displayHistory() {
    const historyContent = document.getElementById('historyContentDisplay');
    
    if (!gameHistory || gameHistory.length === 0) {
        historyContent.innerHTML = '<div style="color: rgba(255,255,255,0.6); text-align: center;">No games played yet!</div>';
        return;
    }
    
    let html = '';
    gameHistory.forEach(game => {
        const date = new Date(game.created_at);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        let resultText = '';
        let resultClass = '';
        
        if (game.result === 'win') {
            resultText = 'You won!';
            resultClass = 'winner-x';
        } else if (game.result === 'lose') {
            resultText = 'Pookie won!';
            resultClass = 'winner-o';
        } else {
            resultText = 'Draw!';
            resultClass = 'winner-draw';
        }
        
        html += `
            <div class="history-entry">
                <div class="history-date">${dateStr}</div>
                <div class="history-result ${resultClass}">${resultText}</div>
            </div>
        `;
    });
    
    historyContent.innerHTML = html;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    await initializeTicTacToe();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (gameSubscription) {
        gameSubscription.unsubscribe();
    }
});