// word-game.js - Word of the Day Game Logic

// Supabase initialization
const SUPABASE_URL = 'https://bcjmlhxuakqqqdjrtntj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjam1saHh1YWtxcXFkanJ0bnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTMxMzYsImV4cCI6MjA2NjE2OTEzNn0.3vV15QSv4y3mNRJfARPHlk-GvJGO65r594ss5kSGK3Y';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentUser = null;
let currentLanguage = null;
let currentWord = null;
let currentTab = 'today';

// Check authentication
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    
    if (!currentUser) {
        window.location.href = '/';
        return;
    }
}

// Select language
async function selectLanguage(language) {
    if (!currentUser) {
        alert('Please log in to use this feature');
        return;
    }
    
    currentLanguage = language;
    
    // Update button states
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(language === 'albanian' ? 'albanianBtn' : 'englishBtn').classList.add('active');
    
    // Show loading
    document.getElementById('wordContent').style.display = 'block';
    document.getElementById('wordDisplay').innerHTML = '<div class="loading">Loading word of the day...</div>';
    
    try {
        // Check if user already learned a word today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingWord } = await supabase
            .from('word_history')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('word_language', language)
            .eq('word_date', today)
            .single();
        
        let word, definition, example;
        
        if (existingWord) {
            // User already has a word for today
            word = existingWord.word;
            definition = existingWord.definition;
            currentWord = word;
            await loadSentences();
        } else {
            // Get a new word
            if (language === 'albanian') {
                const albanianWords = [
                    { word: 'Dashuri', definition: 'Love - A deep feeling of affection', example: 'Dashuria është gjëja më e bukur në botë.' },
                    { word: 'Miqësi', definition: 'Friendship - The bond between friends', example: 'Miqësia jonë është e fortë.' },
                    { word: 'Buzëqeshje', definition: 'Smile - A happy facial expression', example: 'Buzëqeshja jote më bën të lumtur.' },
                    { word: 'Ëndërr', definition: 'Dream - Images and thoughts during sleep', example: 'Pashë një ëndërr të bukur.' },
                    { word: 'Shpresë', definition: 'Hope - Expectation and desire for something', example: 'Kam shpresë për të ardhmen.' }
                ];
                const selected = albanianWords[Math.floor(Math.random() * albanianWords.length)];
                word = selected.word;
                definition = selected.definition;
                example = selected.example;
            } else {
                const englishWords = [
                    { word: 'Serendipity', definition: 'The occurrence of happy or beneficial events by chance', example: 'Finding that book was pure serendipity.' },
                    { word: 'Ephemeral', definition: 'Lasting for a very short time', example: 'The beauty of cherry blossoms is ephemeral.' },
                    { word: 'Luminous', definition: 'Bright or shining, especially in the dark', example: 'The stars were luminous in the clear night sky.' },
                    { word: 'Resilient', definition: 'Able to recover quickly from difficulties', example: 'She showed how resilient she was after the setback.' },
                    { word: 'Whimsical', definition: 'Playfully quaint or fanciful', example: 'The garden had a whimsical design with hidden surprises.' }
                ];
                const selected = englishWords[Math.floor(Math.random() * englishWords.length)];
                word = selected.word;
                definition = selected.definition;
                example = selected.example;
            }
            
            currentWord = word;
            await saveToHistory(word, language, definition);
        }
        
        // Display the word
        const today = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        document.getElementById('wordDisplay').innerHTML = `
            <div class="word-title">${word}</div>
            <div class="word-definition">
                ${definition}
            </div>
            ${example ? `<div class="word-example">${example}</div>` : ''}
            <div class="word-meta">
                <div class="word-date">📅 ${today}</div>
                <div class="word-source">${language === 'albanian' ? '🇦🇱 Albanian' : '🇺🇸 English'}</div>
            </div>
        `;
        
        // Show sentence section
        document.getElementById('sentenceSection').style.display = 'block';
        await loadSentences();
        await updateStreak();
        
    } catch (error) {
        console.error('Error loading word:', error);
        document.getElementById('wordDisplay').innerHTML = '<div class="error">Error loading word. Please try again.</div>';
    }
}

// Load sentences
async function loadSentences() {
    if (!currentUser || !currentWord || !currentLanguage) return;
    
    const sentencesDiv = document.getElementById('sentencesDisplay');
    sentencesDiv.innerHTML = '<div class="loading">Loading sentences...</div>';
    
    try {
        const { data: sentences } = await supabase
            .from('word_sentences')
            .select(`
                *,
                users!word_sentences_user_id_fkey (display_name)
            `)
            .eq('word', currentWord.toLowerCase())
            .eq('word_language', currentLanguage)
            .order('created_at', { ascending: false });
        
        if (!sentences || sentences.length === 0) {
            sentencesDiv.innerHTML = '<div class="sentence-empty">No sentences yet. Be the first to create one!</div>';
            return;
        }
        
        let html = '';
        sentences.forEach(sentence => {
            const isMyOwn = sentence.user_id === currentUser.id;
            html += `
                <div class="sentence-item">
                    <div class="sentence-author">
                        ${sentence.users?.display_name || 'Anonymous'}
                        ${isMyOwn ? '<button class="sentence-btn-edit" onclick="editSentence(\'' + sentence.id + '\', \'' + escapeHtml(sentence.sentence) + '\')">Edit</button>' : ''}
                    </div>
                    <div class="sentence-text">${escapeHtml(sentence.sentence)}</div>
                </div>
            `;
        });
        
        sentencesDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading sentences:', error);
        sentencesDiv.innerHTML = '<div class="error">Error loading sentences</div>';
    }
}

// Sentence functions
function createSentence() {
    document.getElementById('sentenceForm').style.display = 'block';
    document.getElementById('createSentenceBtn').style.display = 'none';
    document.getElementById('sentenceInput').focus();
}

function cancelSentence() {
    document.getElementById('sentenceForm').style.display = 'none';
    document.getElementById('createSentenceBtn').style.display = 'inline-block';
    document.getElementById('sentenceInput').value = '';
}

async function saveSentence() {
    const sentenceText = document.getElementById('sentenceInput').value.trim();
    
    if (!sentenceText) {
        showStatus('Please write a sentence first!', 'error');
        return;
    }
    
    if (!currentWord || !currentLanguage) {
        showStatus('Error: No word selected', 'error');
        return;
    }
    
    try {
        const wordLower = currentWord.toLowerCase();
        
        // Check if user already has a sentence for this word
        const { data: existing } = await supabase
            .from('word_sentences')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('word', wordLower)
            .eq('word_language', currentLanguage)
            .single();
        
        if (existing) {
            // Update existing sentence
            await supabase
                .from('word_sentences')
                .update({ 
                    sentence: sentenceText,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            
            showStatus('Sentence updated successfully!', 'success');
        } else {
            // Create new sentence
            await supabase
                .from('word_sentences')
                .insert({
                    user_id: currentUser.id,
                    word: wordLower,
                    word_language: currentLanguage,
                    sentence: sentenceText
                });
            
            showStatus('Sentence saved successfully!', 'success');
        }
        
        // Update history to show sentence was created
        await updateHistoryHasSentence(wordLower, currentLanguage);
        
        // Reset form and reload sentences
        cancelSentence();
        await loadSentences();
        
    } catch (error) {
        console.error('Error saving sentence:', error);
        showStatus('Error saving sentence. Please try again.', 'error');
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('sentenceStatus');
    statusEl.textContent = message;
    statusEl.className = `sentence-status ${type}`;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// Update streak
async function updateStreak() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabase
            .rpc('update_word_streak', { p_user_id: currentUser.id });
        
        if (!error && data && data[0]) {
            const result = data[0];
            document.getElementById('currentStreak').textContent = result.current_streak;
            document.getElementById('longestStreak').textContent = result.longest_streak;
            
            document.getElementById('streakContainer').style.display = 'flex';
            
            if (result.streak_updated) {
                const streakContainer = document.getElementById('streakContainer');
                streakContainer.style.animation = 'none';
                setTimeout(() => {
                    streakContainer.style.animation = 'slideDown 0.5s ease-out';
                }, 10);
            }
        }
    } catch (error) {
        console.error('Error updating streak:', error);
    }
}

// Tab switching
function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tab + 'Content').classList.add('active');
    
    if (tab === 'history' && currentUser) {
        loadWordHistory();
    }
}

// Load word history
async function loadWordHistory() {
    if (!currentUser) return;
    
    const historyContainer = document.getElementById('historyContainer');
    historyContainer.innerHTML = '<div class="loading">Loading history...</div>';
    
    try {
        const { data: history } = await supabase
            .from('word_history')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('word_date', { ascending: false })
            .limit(30);
        
        if (!history || history.length === 0) {
            historyContainer.innerHTML = '<div class="history-empty">No word history yet. Start learning words to build your history!</div>';
            return;
        }
        
        let historyHTML = '';
        history.forEach(item => {
            const date = new Date(item.word_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            historyHTML += `
                <div class="history-item" onclick="viewHistoryWord('${escapeHtml(item.word)}', '${item.word_language}', '${escapeHtml(item.definition || '')}')">
                    <div class="history-date">${date}</div>
                    <div class="history-word">
                        ${escapeHtml(item.word)}
                        <span class="history-badge">${item.word_language === 'albanian' ? '🇦🇱' : '🇺🇸'}</span>
                        ${item.has_sentence ? '<span class="history-badge">✍️</span>' : ''}
                    </div>
                    ${item.definition ? `<div class="history-definition">${escapeHtml(item.definition.substring(0, 100))}${item.definition.length > 100 ? '...' : ''}</div>` : ''}
                </div>
            `;
        });
        
        historyContainer.innerHTML = historyHTML;
        
    } catch (error) {
        console.error('Error loading history:', error);
        historyContainer.innerHTML = '<div class="error">Error loading history</div>';
    }
}

// View a word from history
function viewHistoryWord(word, language, definition) {
    switchTab('today');
    
    currentLanguage = language;
    currentWord = word;
    
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(language + 'Btn').classList.add('active');
    
    const displayDiv = document.getElementById('wordDisplay');
    displayDiv.innerHTML = `
        <div class="word-title">${word}</div>
        <div class="word-definition">
            ${definition || 'Definition not available'}
        </div>
        <div class="word-meta">
            <div class="word-date">📅 From History</div>
            <div class="word-source">${language === 'albanian' ? '🇦🇱 Albanian' : '🇺🇸 English'}</div>
        </div>
    `;
    
    document.getElementById('wordContent').style.display = 'block';
    document.getElementById('sentenceSection').style.display = 'none';
}

// Save word to history
async function saveToHistory(word, language, definition) {
    if (!currentUser || !word) return;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existing } = await supabase
            .from('word_history')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('word', word.toLowerCase())
            .eq('word_language', language)
            .eq('word_date', today)
            .single();
        
        if (!existing) {
            await supabase
                .from('word_history')
                .insert({
                    user_id: currentUser.id,
                    word: word.toLowerCase(),
                    word_language: language,
                    definition: definition,
                    word_date: today,
                    has_sentence: false
                });
        }
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

// Update history when sentence is saved
async function updateHistoryHasSentence(word, language) {
    if (!currentUser || !word) return;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        await supabase
            .from('word_history')
            .update({ has_sentence: true })
            .eq('user_id', currentUser.id)
            .eq('word', word.toLowerCase())
            .eq('word_language', language)
            .eq('word_date', today);
    } catch (error) {
        console.error('Error updating history:', error);
    }
}

function editSentence(sentenceId, currentText) {
    const newText = prompt('Edit your sentence:', currentText);
    
    if (newText && newText.trim() !== currentText) {
        updateSentence(sentenceId, newText.trim());
    }
}

async function updateSentence(sentenceId, newText) {
    try {
        await supabase
            .from('word_sentences')
            .update({ 
                sentence: newText,
                updated_at: new Date().toISOString()
            })
            .eq('id', sentenceId)
            .eq('user_id', currentUser.id);
        
        showStatus('Sentence updated successfully!', 'success');
        await loadSentences();
    } catch (error) {
        console.error('Error updating sentence:', error);
        showStatus('Error updating sentence', 'error');
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
});