// js/ui.js
// User Interface Management Module
// Handles all UI interactions, modals, menus, and visual feedback

import { supabase, getCurrentUser } from './config.js';

// 🔊 AUDIO SYSTEM - NEW!
let audioContext;
let boingBuffer;

function initializeAudio() {
  console.log('🔊 Initializing audio system...');
  
  // Create audio context on first user interaction
  const initAudioContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      loadBoingSound();
      // Remove the listener after first interaction
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    }
  };
  
  // Wait for user interaction to create audio context (browser requirement)
  document.addEventListener('click', initAudioContext);
  document.addEventListener('touchstart', initAudioContext);
}

async function loadBoingSound() {
  try {
    const response = await fetch('/assets/boing.mp3');
    const arrayBuffer = await response.arrayBuffer();
    boingBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log('✅ Boing sound loaded!');
  } catch (error) {
    console.log('🔇 Could not load boing sound (it\'s okay!):', error);
  }
}

async function playBoingSound() {
  if (audioContext && boingBuffer) {
    try {
      const source = audioContext.createBufferSource();
      source.buffer = boingBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      console.log('🔊 Boing!');
    } catch (error) {
      console.log('🔇 Could not play sound:', error);
    }
  }
}

// 📱 MAIN SECTION SWITCHING

export function showApp() {
  console.log('🚀 Showing main app...');
  
  const loginSection = document.getElementById('login-section');
  const appSection = document.getElementById('app-section');
  
  if (loginSection) loginSection.style.display = 'none';
  if (appSection) {
    appSection.style.display = 'flex';
    
    // Load app data when showing
    loadAppData();
    
    // Initialize UI components
    initializeAppUI();
  }
}

export function showLogin() {
  console.log('🔒 Showing login page...');
  
  const loginSection = document.getElementById('login-section');
  const appSection = document.getElementById('app-section');
  
  if (loginSection) loginSection.style.display = 'flex';
  if (appSection) appSection.style.display = 'none';
  
  // Clear any existing messages
  clearLoginMessages();
}

// 📊 DATA LOADING

async function loadAppData() {
  console.log('📊 Loading app data...');
  
  try {
    // Load today's count
    const { getTodaysBoings } = await import('./database.js');
    const todayCount = await getTodaysBoings();
    
    const countElement = document.getElementById('todayCount');
    if (countElement) {
      countElement.textContent = todayCount || 0;
      console.log(`📈 Today's boing count: ${todayCount}`);
    }
    
    // Load user profile data
    const { getCurrentUser } = await import('./config.js');
    const currentUser = getCurrentUser();
    if (currentUser) {
      console.log(`👤 Current user: ${currentUser.email}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to load app data:', error);
    // Don't block UI for data loading errors
  }
}

function initializeAppUI() {
  console.log('🎨 Initializing app UI components...');
  
  // NEW: Initialize audio system
  initializeAudio();
  
  // Initialize emoji click counter if present
  const emoji = document.getElementById('emoji');
  if (emoji && !emoji.hasAttribute('data-initialized')) {
    emoji.setAttribute('data-initialized', 'true');
    emoji.addEventListener('click', handleEmojiClick);
  }
  
  // Initialize menu functionality - FIX: This was the missing piece!
  setupMenuToggle();
  
  // Initialize keyboard shortcuts
  setupKeyboardShortcuts();
}

// 🎭 EMOJI INTERACTION - FIXED WITH SOUND

async function handleEmojiClick() {
  console.log('🎎 Emoji clicked!');
  
  try {
    // Play the sound immediately when clicked
    await playBoingSound();
    
    // Use the correct function names from your database.js
    const { recordBoing, getTodaysBoings } = await import('./database.js');
    const success = await recordBoing();
    
    if (success) {
      // Get the fresh count from database immediately
      const newCount = await getTodaysBoings();
      
      // Update counter display with visual effect
      const countElement = document.getElementById('todayCount');
      if (countElement) {
        countElement.style.transition = 'all 0.3s ease';
        countElement.style.transform = 'scale(1.2)';
        countElement.style.color = '#4CAF50';
        countElement.textContent = newCount;
        
        setTimeout(() => {
          countElement.style.transform = 'scale(1)';
          countElement.style.color = '';
        }, 300);
      }
      
      // Add visual feedback
      addClickAnimation();
      
      console.log(`✅ Boing added! New count: ${newCount}`);
    }
  } catch (error) {
    console.error('❌ Failed to add boing:', error);
  }
}

function addClickAnimation() {
  const emoji = document.getElementById('emoji');
  if (emoji) {
    emoji.style.transform = 'scale(1.1)';
    setTimeout(() => {
      emoji.style.transform = 'scale(1)';
    }, 150);
  }
}

// 🎯 MODAL MANAGEMENT

export function showSettingsModal() {
  console.log('⚙️ Opening settings modal...');
  
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // Focus first input for better UX
    setTimeout(() => {
      const firstInput = modal.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }
}

export function closeSettingsModal() {
  console.log('❌ Closing settings modal...');
  
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
}

export function showPasswordModal() {
  console.log('🔒 Opening password change modal...');
  
  const modal = document.getElementById('password-modal');
  if (modal) {
    modal.style.display = 'flex';
    
    // Focus first password input
    setTimeout(() => {
      const firstInput = modal.querySelector('input[type="password"]');
      if (firstInput) firstInput.focus();
    }, 100);
  }
}

export function closePasswordModal() {
  console.log('❌ Closing password modal...');
  
  const modal = document.getElementById('password-modal');
  if (modal) {
    modal.style.display = 'none';
    
    // Clear password fields for security
    const passwordInputs = modal.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => input.value = '');
  }
}

// 📱 MENU FUNCTIONALITY - FIXED!

function setupMenuToggle() {
  console.log('📱 Setting up menu toggle...');
  
  const menuToggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('menu');
  
  if (menuToggle && menu) {
    // Remove any existing listeners to prevent duplicates
    menuToggle.replaceWith(menuToggle.cloneNode(true));
    const newMenuToggle = document.getElementById('menu-toggle');
    
    // Add click listener to hamburger button
    newMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event bubbling
      toggleMenu();
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('open') && 
          !menu.contains(e.target) && 
          !newMenuToggle.contains(e.target)) {
        closeMenu();
      }
    });
    
    // Close menu when clicking a menu item
    const menuButtons = menu.querySelectorAll('button, a');
    menuButtons.forEach(button => {
      button.addEventListener('click', () => {
        setTimeout(closeMenu, 100); // Small delay for the action to complete
      });
    });
    
    console.log('✅ Menu toggle configured');
  } else {
    console.log('⚠️ Menu elements not found');
  }
}

function toggleMenu() {
  const menu = document.getElementById('menu');
  const menuToggle = document.getElementById('menu-toggle');
  
  if (menu) {
    if (menu.classList.contains('open')) {
      // Menu is open, close it
      menu.classList.remove('open');
      menu.style.display = 'none';
      if (menuToggle) menuToggle.classList.remove('active');
      console.log('📱 Menu closed');
    } else {
      // Menu is closed, open it
      menu.style.display = 'flex';
      // Force a reflow to ensure the display change is applied before adding the class
      menu.offsetHeight;
      menu.classList.add('open');
      if (menuToggle) menuToggle.classList.add('active');
      console.log('📱 Menu opened');
    }
  }
}

function closeMenu() {
  const menu = document.getElementById('menu');
  const menuToggle = document.getElementById('menu-toggle');
  
  if (menu) {
    menu.classList.remove('open');
    // Wait for animation to complete before hiding
    setTimeout(() => {
      if (!menu.classList.contains('open')) {
        menu.style.display = 'none';
      }
    }, 300);
    
    if (menuToggle) {
      menuToggle.classList.remove('active');
    }
  }
}

// ⌨️ KEYBOARD SHORTCUTS

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeyboardShortcut);
}

function handleKeyboardShortcut(e) {
  // Escape key - close any open modals or menus
  if (e.key === 'Escape') {
    closeSettingsModal();
    closePasswordModal();
    closeMenu();
    return;
  }
  
  // Spacebar to click emoji (NEW!)
  if (e.code === 'Space' && !e.target.matches('input, textarea')) {
    e.preventDefault();
    handleEmojiClick();
    return;
  }
  
  // Ctrl/Cmd + K - focus search/email input
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const emailInput = document.getElementById('email');
    if (emailInput && isOnLoginPage()) {
      emailInput.focus();
    }
    return;
  }
  
  // Ctrl/Cmd + Enter - quick login
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (isOnLoginPage()) {
      e.preventDefault();
      const { login } = window;
      if (login) login();
    }
    return;
  }
}

// 🔧 UTILITY FUNCTIONS

export function isOnLoginPage() {
  const loginSection = document.getElementById('login-section');
  return loginSection && loginSection.style.display !== 'none';
}

export function isOnMainApp() {
  const appSection = document.getElementById('app-section');
  return appSection && appSection.style.display !== 'none';
}

export function refreshCurrentSection() {
  console.log('🔄 Refreshing current section...');
  
  if (isOnMainApp()) {
    showApp();
  } else {
    showLogin();
  }
}

function clearLoginMessages() {
  const messageElements = [
    'login-message',
    'reset-message'
  ];
  
  messageElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = '';
      element.className = 'message'; // Reset class
    }
  });
}

function createStatusMessage(message, type = 'info') {
  const element = document.createElement('div');
  element.className = `message ${type}`;
  element.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    color: #333;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInDown 0.3s ease-out;
  `;
  
  element.textContent = message;
  
  // Add slide animation if not present
  if (!document.getElementById('status-animations')) {
    const style = document.createElement('style');
    style.id = 'status-animations';
    style.textContent = `
      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }
  
  return element;
}

// 🎧 EVENT LISTENER SETUP

export function setupUIEventListeners() {
  console.log('🎧 Setting up UI event listeners...');
  
  // Setup menu toggle
  setupMenuToggle();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Setup modal close on background click
  setupModalBackdropClose();
  
  console.log('✅ UI event listeners configured');
}

function setupModalBackdropClose() {
  // Close modals when clicking backdrop
  document.addEventListener('click', (e) => {
    const modals = ['settings-modal', 'password-modal'];
    
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal && e.target === modal) {
        if (modalId === 'settings-modal') {
          closeSettingsModal();
        } else if (modalId === 'password-modal') {
          closePasswordModal();
        }
      }
    });
  });
}

// 🌐 MAKE FUNCTIONS GLOBALLY AVAILABLE

// These functions need to be available for onclick handlers in HTML
window.showSettingsModal = showSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.showPasswordModal = showPasswordModal;
window.closePasswordModal = closePasswordModal;
window.showApp = showApp;
window.showLogin = showLogin;
