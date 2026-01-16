// word-game.js - Word of the Day Game Logic (merged + fixed)

// ----- Supabase init -----
const SUPABASE_URL = 'https://bcjmlhxuakqqqdjrtntj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjam1saHh1YWtxcXFkanJ0bnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTMxMzYsImV4cCI6MjA2NjE2OTEzNn0.3vV15QSv4y3mNRJfARPHlk-GvJGO65r594ss5kSGK3Y';
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----- Global state -----
let currentUser = null;
let currentUsername = null;
let autoreceiverEmail = null;
let autoreceiverUsername = null;

let currentLanguage = null;   // 'albanian' | 'english'
let currentWord = null;

let isEditingMode = false;
let editingSentenceId = null;
let currentTab = 'today';

// ======= Auth + profile =======
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;

  if (!currentUser) {
    // This page requires auth
    window.location.href = '/';
    return;
  }

  await loadUserProfile();
  await loadStreak();
}

async function loadUserProfile() {
  if (!currentUser) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, autoreceiver_email, email')
    .eq('id', currentUser.id)
    .single();

  if (profile) {
    currentUsername = profile.username || (currentUser.email ? currentUser.email.split('@')[0] : 'You');
    autoreceiverEmail = profile.autoreceiver_email || null;

    if (autoreceiverEmail) {
      const { data: autoProfile } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('email', autoreceiverEmail)
        .single();

      if (autoProfile) {
        autoreceiverUsername = autoProfile.username || (autoProfile.email ? autoProfile.email.split('@')[0] : 'Friend');
      }
    }
  }
}

// ======= Streaks =======
async function loadStreak() {
  if (!currentUser) return;
  try {
    const { data: streak } = await supabase
      .from('word_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', currentUser.id)
      .single();

    if (streak) {
      document.getElementById('currentStreak').textContent = streak.current_streak || 0;
      document.getElementById('longestStreak').textContent = streak.longest_streak || 0;
      document.getElementById('streakContainer').style.display = 'flex';
    }
  } catch (e) {
    console.error('Error loading streak:', e);
  }
}

async function updateStreak() {
  if (!currentUser) return;
  try {
    const { data, error } = await supabase.rpc('update_word_streak', { p_user_id: currentUser.id });
    if (!error && data && data[0]) {
      const result = data[0];
      document.getElementById('currentStreak').textContent = result.current_streak;
      document.getElementById('longestStreak').textContent = result.longest_streak;

      // Lil animation when updated
      if (result.streak_updated) {
        const streakContainer = document.getElementById('streakContainer');
        streakContainer.style.animation = 'none';
        setTimeout(() => { streakContainer.style.animation = 'slideDown 0.5s ease-out'; }, 10);
      }
      document.getElementById('streakContainer').style.display = 'flex';
    }
  } catch (e) {
    console.error('Error updating streak:', e);
  }
}

// ======= Tabs + history =======
function switchTab(tab) {
  currentTab = tab;

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tab + 'Tab').classList.add('active');

  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tab + 'Content').classList.add('active');

  if (tab === 'history' && currentUser) {
    loadWordHistory();
  }
}

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

    let html = '';
    history.forEach(item => {
      const dateStr = new Date(item.word_date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
      html += `
        <div class="history-item"
             onclick="viewHistoryWord('${escapeHtml(item.word)}','${item.word_language}','${escapeHtml(item.definition || '')}')">
          <div class="history-date">${dateStr}</div>
          <div class="history-word">
            ${escapeHtml(item.word)}
            <span class="history-badge">${item.word_language === 'albanian' ? '🇦🇱' : '🇺🇸'}</span>
            ${item.has_sentence ? '<span class="history-badge">✍️</span>' : ''}
          </div>
          ${item.definition ? `<div class="history-definition">
            ${escapeHtml(item.definition.substring(0, 100))}${item.definition.length > 100 ? '...' : ''}</div>` : ''}
        </div>
      `;
    });

    historyContainer.innerHTML = html;
  } catch (e) {
    console.error('Error loading history:', e);
    historyContainer.innerHTML = '<div class="error">Error loading history</div>';
  }
}

function viewHistoryWord(word, language, definition) {
  switchTab('today');

  currentLanguage = language;
  currentWord = word;

  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.getElementById((language === 'albanian' ? 'albanian' : 'english') + 'Btn').classList.add('active');

  const displayDiv = document.getElementById('wordDisplay');
  displayDiv.innerHTML = `
    <div class="word-title">${word}</div>
    <div class="word-definition">${definition || 'Definition not available'}</div>
    <div class="word-meta">
      <div class="word-date">📅 From History</div>
      <div class="word-source">${language === 'albanian' ? '🇦🇱 Albanian' : '🇺🇸 English'}</div>
    </div>
  `;

  document.getElementById('wordContent').style.display = 'block';
  document.getElementById('sentenceSection').style.display = 'none';
}

// ======= Daily word loaders =======
async function selectLanguage(language) {
  if (!currentUser) {
    alert('Please log in to use this feature');
    return;
  }

  currentLanguage = language;

  // Button states
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.getElementById((language === 'albanian' ? 'albanian' : 'english') + 'Btn').classList.add('active');

  // Show loading
  const contentDiv = document.getElementById('wordContent');
  const displayDiv = document.getElementById('wordDisplay');
  contentDiv.style.display = 'block';
  displayDiv.innerHTML = '<div class="loading">Loading word of the day...</div>';

  try {
    if (language === 'albanian') {
      await loadAlbanianWord();
    } else {
      await loadEnglishWord();
    }

    // After word loads, show sentence area
    if (currentWord) {
      document.getElementById('sentenceSection').style.display = 'block';
      document.getElementById('createSentenceBtn').style.display = 'inline-block';
      document.getElementById('sentenceForm').style.display = 'none';
      await loadSentences();
      await updateStreak(); // in case your RPC also counts viewing; safe to call
    }
  } catch (e) {
    console.error('Error loading word:', e);
    displayDiv.innerHTML = '<div class="error">Error loading word. Please try again.</div>';
  }
}

async function loadAlbanianWord() {
  // Lambda that returns: { word, definition, pronunciation?, type?, example? }
  const res = await fetch('https://marxfnwnc2.execute-api.eu-central-1.amazonaws.com/prod/wordoftheday');
  if (!res.ok) throw new Error('Failed to fetch Albanian word');
  const data = await res.json();

  currentWord = data.word;

  const todayFmt = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const displayDiv = document.getElementById('wordDisplay');
  const definitionHtml = data.definition || '';
  const safeDefinition = renderAlbanianDefinition(definitionHtml);
  
  displayDiv.innerHTML = `
    <div class="word-title">${escapeHtml(data.word)}</div>
    ${data.pronunciation ? `<div class="word-pronunciation">[${escapeHtml(data.pronunciation)}]</div>` : ''}
    ${data.type ? `<span class="word-type">${escapeHtml(data.type)}</span>` : ''}
    <div class="word-definition"><strong>Definition:</strong> ${safeDefinition}</div>
    ${data.example ? `<div class="word-example">${escapeHtml(data.example)}</div>` : ''}
    <div class="word-meta">
      <div class="word-date">📅 ${todayFmt}</div>
      <div class="word-source">🇦🇱 Albanian</div>
    </div>
  `;

  const tmp = document.createElement('div'); tmp.innerHTML = safeDefinition;
  await saveToHistory(data.word, 'albanian', tmp.textContent.trim());}

async function loadEnglishWord() {
  // Use RSS2JSON service for better CORS support
  const rssUrl = 'https://www.merriam-webster.com/wotd/feed/rss2';
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error('Failed to fetch English word');

  const data = await res.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('No word found in RSS feed');
  }

  const firstItem = data.items[0];
  const title = firstItem.title.trim();
  currentWord = title;

  const descHtml = firstItem.description || '';
  const tmp = document.createElement('div');
  tmp.innerHTML = descHtml;

  // Attempt to extract type/definition/example
  let definition = '';
  let example = '';
  let wordType = '';

  const paragraphs = tmp.querySelectorAll('p');
  for (const p of paragraphs) {
    const text = p.textContent.trim();
    if (!text || text.includes('Merriam-Webster')) continue;

    if (text.match(/^(noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection)/i)) {
      wordType = text.split(':')[0].trim();
      definition = text.split(':')[1]?.trim() || text;
    } else if (text.includes('//')) {
      example = text;
    } else if (text.length > 50 && !definition) {
      definition = text;
    }
  }
  if (!definition) {
    for (const p of paragraphs) {
      const text = p.textContent.trim();
      if (text.length > 50 && !text.includes('Merriam-Webster')) { definition = text; break; }
    }
  }

  const todayFmt = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const displayDiv = document.getElementById('wordDisplay');
  displayDiv.innerHTML = `
    <div class="word-title">${escapeHtml(title)}</div>
    ${wordType ? `<span class="word-type">${escapeHtml(wordType)}</span>` : ''}
    <div class="word-definition">${escapeHtml(definition || 'Definition not available')}</div>
    ${example ? `<div class="word-example">${escapeHtml(example)}</div>` : ''}
    <div class="word-meta">
      <div class="word-date">📅 ${todayFmt}</div>
      <div class="word-source">🇺🇸 Merriam-Webster</div>
    </div>
  `;

  await saveToHistory(title, 'english', definition);
}

// ======= History helpers =======
async function saveToHistory(word, language, definition) {
  if (!currentUser || !word) return;
  try {
    const todayISO = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('word_history')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('word', word.toLowerCase())
      .eq('word_language', language)
      .eq('word_date', todayISO)
      .maybeSingle?.() || await supabase  // compatibility if maybeSingle not present
      .from('word_history').select('id')
      .eq('user_id', currentUser.id)
      .eq('word', word.toLowerCase())
      .eq('word_language', language)
      .eq('word_date', todayISO)
      .single();

    if (!existing) {
      await supabase.from('word_history').insert({
        user_id: currentUser.id,
        word: word.toLowerCase(),
        word_language: language,
        definition,
        word_date: todayISO,
        has_sentence: false
      });
    }
  } catch (e) {
    // ignore "no rows" errors on .single()
    if (e?.code !== 'PGRST116') console.error('Error saving to history:', e);
  }
}

async function updateHistoryHasSentence(word, language) {
  if (!currentUser || !word) return;
  try {
    const todayISO = new Date().toISOString().split('T')[0];
    await supabase.from('word_history')
      .update({ has_sentence: true })
      .eq('user_id', currentUser.id)
      .eq('word', word.toLowerCase())
      .eq('word_language', language)
      .eq('word_date', todayISO);
  } catch (e) {
    console.error('Error updating history:', e);
  }
}

// ======= Sentences =======
async function loadSentences() {
  if (!currentUser || !currentWord || !currentLanguage) return;

  const sentencesDisplay = document.getElementById('sentencesDisplay');
  const createBtn = document.getElementById('createSentenceBtn');
  const form = document.getElementById('sentenceForm');

  sentencesDisplay.innerHTML = '<div class="loading">Loading sentences...</div>';

  try {
    const todayISO = new Date().toISOString().split('T')[0];
    const wordLower = currentWord.toLowerCase();

    // Your sentence (for today)
    const { data: userSentence } = await supabase
      .from('word_sentences')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('word', wordLower)
      .eq('word_language', currentLanguage)
      .eq('word_date', todayISO)
      .maybeSingle?.() || await supabase
      .from('word_sentences').select('*')
      .eq('user_id', currentUser.id)
      .eq('word', wordLower)
      .eq('word_language', currentLanguage)
      .eq('word_date', todayISO)
      .single();

    // Autoreceiver sentence (for today)
    let autoSentence = null;
    if (autoreceiverEmail) {
      const { data: autoUser } = await supabase
        .from('profiles').select('id').eq('email', autoreceiverEmail).single();

      if (autoUser) {
        const { data: a } = await supabase
          .from('word_sentences')
          .select('*')
          .eq('user_id', autoUser.id)
          .eq('word', wordLower)
          .eq('word_language', currentLanguage)
          .eq('word_date', todayISO)
          .maybeSingle?.() || await supabase
          .from('word_sentences').select('*')
          .eq('user_id', autoUser.id)
          .eq('word', wordLower)
          .eq('word_language', currentLanguage)
          .eq('word_date', todayISO)
          .single();

        autoSentence = a || null;
      }
    }

    let html = '';

    if (userSentence) {
      const sentenceEnc = encodeURIComponent(userSentence.sentence || '');
      html += `
        <div class="sentence-item">
          <div class="sentence-author">You said:</div>
          <div class="sentence-text">${escapeHtml(userSentence.sentence || '')}</div>
          <button class="sentence-btn sentence-btn-edit"
                  onclick="editSentence('${userSentence.id}','${sentenceEnc}')">✏️ Edit</button>
        </div>
      `;
      // hide create button if you already have one
      createBtn.style.display = 'none';
      form.style.display = 'none';
    } else {
      html += `<div class="sentence-empty">You haven't used this word in a sentence yet.</div>`;
      createBtn.style.display = 'inline-block';
      form.style.display = 'none';
    }

    // Helper for display name
    const getAutoName = () => {
      if (autoreceiverUsername && autoreceiverUsername.trim()) return autoreceiverUsername;
      if (autoreceiverEmail) return autoreceiverEmail.split('@')[0];
      return 'Friend';
    };

    if (autoSentence) {
      html += `
        <div class="sentence-item">
          <div class="sentence-author">${escapeHtml(getAutoName())} said:</div>
          <div class="sentence-text">${escapeHtml(autoSentence.sentence || '')}</div>
        </div>
      `;
    } else if (autoreceiverEmail) {
      html += `
        <div class="sentence-item" style="opacity:.6;">
          <div class="sentence-author">${escapeHtml(getAutoName())}:</div>
          <div class="sentence-text">Hasn't used this word yet</div>
        </div>
      `;
    }

    sentencesDisplay.innerHTML = html;
  } catch (e) {
    console.error('Error loading sentences:', e);
    sentencesDisplay.innerHTML = '<div class="sentence-empty">Error loading sentences</div>';
  }
}

// UI: open/create/cancel/edit
function createSentence() {
  document.getElementById('sentenceForm').style.display = 'block';
  document.getElementById('createSentenceBtn').style.display = 'none';
  const ta = document.getElementById('sentenceInput');
  ta.value = '';
  ta.focus();
  isEditingMode = false;
  editingSentenceId = null;
}

function cancelSentence() {
  document.getElementById('sentenceForm').style.display = 'none';
  document.getElementById('createSentenceBtn').style.display = 'inline-block';
  document.getElementById('sentenceInput').value = '';
  isEditingMode = false;
  editingSentenceId = null;
}

function editSentence(sentenceId, encodedText) {
  const text = decodeURIComponent(encodedText || '');
  document.getElementById('sentenceForm').style.display = 'block';
  document.getElementById('createSentenceBtn').style.display = 'none';
  const ta = document.getElementById('sentenceInput');
  ta.value = text; // raw into textarea (safe)
  ta.focus();
  isEditingMode = true;
  editingSentenceId = sentenceId;
}

async function saveSentence() {
  if (!currentUser || !currentWord || !currentLanguage) {
    showStatus('Please log in to save sentences', 'error');
    return;
  }

  const ta = document.getElementById('sentenceInput');
  const sentence = (ta.value || '').trim();
  if (!sentence) {
    showStatus('Please enter a sentence', 'error');
    return;
  }

  // Must include the word (case-insensitive)
  const wordLower = currentWord.toLowerCase();
  if (!sentence.toLowerCase().includes(wordLower)) {
    showStatus(`Please use the word "${currentWord}" in your sentence`, 'error');
    return;
  }

  try {
    const todayISO = new Date().toISOString().split('T')[0];

    if (isEditingMode && editingSentenceId) {
      const { error } = await supabase
        .from('word_sentences')
        .update({ sentence, updated_at: new Date().toISOString() })
        .eq('id', editingSentenceId)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      showStatus('Sentence updated successfully!', 'success');
    } else {
      // Upsert “today” sentence
      const { data: existing } = await supabase
        .from('word_sentences')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('word', wordLower)
        .eq('word_language', currentLanguage)
        .eq('word_date', todayISO)
        .maybeSingle?.() || await supabase
        .from('word_sentences').select('id')
        .eq('user_id', currentUser.id)
        .eq('word', wordLower)
        .eq('word_language', currentLanguage)
        .eq('word_date', todayISO)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('word_sentences')
          .update({ sentence, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('word_sentences')
          .insert({
            user_id: currentUser.id,
            word: wordLower,
            word_language: currentLanguage,
            sentence,
            word_date: todayISO
          });
        if (error) throw error;

        // Only bump streak on a brand-new sentence
        await updateStreak();
      }

      showStatus('Sentence saved successfully!', 'success');
    }

    await updateHistoryHasSentence(wordLower, currentLanguage);
    cancelSentence();
    await loadSentences();
  } catch (e) {
    console.error('Error saving sentence:', e);
    showStatus('Error saving sentence. Please try again.', 'error');
  }
}

// Sanitize a small allowlist of tags (abbr, b, strong, i, em) and strip attributes except title on <abbr>
function sanitizeAllowedHtml(root) {
  const allowedTags = new Set(['ABBR', 'B', 'STRONG', 'I', 'EM']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);

  const toRemoveAttrs = (el) => {
    // Only allow title on abbr; remove everything else
    for (const attr of Array.from(el.attributes)) {
      if (!(el.tagName === 'ABBR' && attr.name.toLowerCase() === 'title')) {
        el.removeAttribute(attr.name);
      }
    }
  };

  const nodes = [];
  let n = walker.currentNode;
  while (n) {
    nodes.push(n);
    n = walker.nextNode();
  }

  for (const el of nodes) {
    if (!allowedTags.has(el.tagName)) {
      // unwrap element: replace it with its children
      const parent = el.parentNode;
      if (!parent) continue;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    } else {
      toRemoveAttrs(el);
    }
  }
  return root.innerHTML;
}

// Turn <span class="SHRT" data-short="kal.">folje kalimtare</span>
// into <abbr title="folje kalimtare">kal.</abbr> (or just text if no data-short)
function renderAlbanianDefinition(defHtml) {
  const tmp = document.createElement('div');
  tmp.innerHTML = defHtml;

  tmp.querySelectorAll('span.SHRT').forEach(span => {
    const short = span.getAttribute('data-short') || span.textContent || '';
    const full = span.textContent || '';
    const abbr = document.createElement('abbr');
    abbr.textContent = short.trim();
    if (full.trim() && full.trim() !== short.trim()) {
      abbr.setAttribute('title', full.trim());
    }
    span.replaceWith(abbr);
  });

  // Allow only abbr/b/strong/i/em, strip the rest
  return sanitizeAllowedHtml(tmp);
}

// ======= Utilities =======
function showStatus(message, type) {
  const el = document.getElementById('sentenceStatus');
  el.textContent = message;
  el.className = `sentence-status ${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// ======= Init =======
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
});
