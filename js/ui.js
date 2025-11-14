// js/ui.js - Complete UI Controller
// This file manages what the user sees and handles all UI state changes

// 🔊 AUDIO SYSTEM - NEW ADDITION
let boingSound = null;

import { checkChristmasPopups } from './christmas-popup.js';

// Initialize audio when the app starts
function initializeAudio() {
  try {
    // Create the audio object with the correct path
    boingSound = new Audio('/assets/sounds/boing.mp3');
    
    // Preload the audio file
    boingSound.preload = 'auto';
    
    // Set volume (0.0 to 1.0)
    boingSound.volume = 0.7;
    
    // Handle loading errors
    boingSound.addEventListener('error', (e) => {
      console.error('❌ Could not load boing sound:', e);
      console.log('🔍 Checking if sound file exists at: /assets/sounds/boing.mp3');
    });
    
    // Log when audio is ready
    boingSound.addEventListener('canplaythrough', () => {
      console.log('🔊 Boing sound loaded and ready!');
    });
    
    console.log('🎵 Audio initialized');
  } catch (error) {
    console.error('❌ Failed to initialize audio:', error);
  }
}

// Function to play the boing sound
async function playBoingSound() {
  if (!boingSound) {
    console.warn('⚠️ Boing sound not initialized');
    return;
  }
  
  try {
    // Reset the audio to beginning in case it was already playing
    boingSound.currentTime = 0;
    
    // Play the sound (returns a Promise)
    await boingSound.play();
    
    console.log('🔊 Boing sound played!');
  } catch (error) {
    console.error('❌ Failed to play boing sound:', error);
    
    // Common issues and solutions:
    if (error.name === 'NotAllowedError') {
      console.log('💡 Tip: User needs to interact with page first (autoplay policy)');
    } else if (error.name === 'NotSupportedError') {
      console.log('💡 Tip: Audio format may not be supported');
    }
  }
}

// 🎯 MAIN APP INITIALIZATION
export async function initializeApp() {
  console.log('🎨 Starting app initialization...');
  
  // Step 1: Hide everything to prevent flash of unstyled content
  hideAllSections();
  
  // Step 2: Show loading state for better UX
  showLoadingState();
  
  // Step 3: Check authentication status
  try {
    const { getCurrentUser, checkInitialAuth } = await import('./auth.js');
    const user = await checkInitialAuth();
    
    if (user) {
      console.log('✅ User authenticated:', user.email);
      await showApp();
    } else {
      console.log('❌ No authenticated user, showing login');
      showLogin();
    }
  } catch (error) {
    console.error('❌ Authentication check failed:', error);
    showLogin(); // Safe fallback
  } finally {
    hideLoadingState();
  }
}

// 🔧 CORE SECTION MANAGEMENT FUNCTIONS

function hideAllSections() {
  console.log('👻 Hiding all application sections...');
  
  const sections = [
    'login-section',
    'app-section',
    'settings-modal',
    'password-modal'
  ];
  
  sections.forEach(sectionId => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.style.display = 'none';
      console.log(`📱 Hidden section: ${sectionId}`);
    }
  });
}

export function showLogin() {
  console.log('🔐 Displaying login page...');
  
  // Hide all other sections first
  hideAllSections();
  
  // Show login section
  const loginSection = document.getElementById('login-section');
  if (loginSection) {
    loginSection.style.display = 'flex';
    console.log('✅ Login page now visible');
    
    // Auto-focus email input for better UX
    setTimeout(() => {
      const emailInput = document.getElementById('email');
      if (emailInput) {
        emailInput.focus();
        console.log('📧 Email input focused');
      }
    }, 100);
  } else {
    console.error('❌ Login section not found in DOM');
  }
  
  // Update browser tab title
  document.title = 'Login - Pookie\'s App';
  
  // Clear any existing error messages
  clearLoginMessages();
}

export async function showApp() {
  console.log('🏠 Displaying main application...');
  
  // Hide all other sections first
  hideAllSections();
  
  // Show main app section
  const appSection = document.getElementById('app-section');
  if (appSection) {
    appSection.style.display = 'flex';
    console.log('✅ Main app now visible');
  } else {
    console.error('❌ App section not found in DOM');
    return;
  }
  
  // Update browser tab title
  document.title = 'Pookie\'s App';
  
  // Load app-specific data
  await loadAppData();

	// ADD THIS: Check for Christmas popups after successful login
	setTimeout(() => {
		checkChristmasPopups();
	}, 1000); // Small delay to let the app load first
  
  // Initialize app-specific UI elements - NOW WITH AUDIO!
  initializeAppUI();
}

// 🔄 LOADING STATE MANAGEMENT

function showLoadingState() {
  console.log('⏳ Showing loading state...');
  
  // Check if loading overlay already exists
  let loadingOverlay = document.getElementById('loading-overlay');
  if (!loadingOverlay) {
    loadingOverlay = createLoadingOverlay();
    document.body.appendChild(loadingOverlay);
  }
  
  loadingOverlay.style.display = 'flex';
}

function hideLoadingState() {
  console.log('✅ Hiding loading state...');
  
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      if (loadingOverlay.parentNode) {
        loadingOverlay.parentNode.removeChild(loadingOverlay);
      }
    }, 300);
  }
}

function createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transition: opacity 0.3s ease;
  `;
  
  overlay.innerHTML = `
    <div style="text-align: center; color: white;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🎎</div>
      <div style="font-size: 1.2rem; margin-bottom: 1rem;">Loading Pookie's App...</div>
      <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
        <div style="width: 100%; height: 100%; background: white; animation: loading 2s ease-in-out infinite;"></div>
      </div>
    </div>
  `;
  
  return overlay;
}

// 📊 APP DATA LOADING

async function loadAppData() {
  console.log('📊 Loading application data...');
  
  try {
    // Load today's boing count using the correct function name
    const { getTodaysBoings } = await import('./database.js');
    const todayCount = await getTodaysBoings();
    
    const countElement = document.getElementById('todayCount');
    if (countElement) {
      countElement.textContent = todayCount;
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
  
  // Initialize menu functionality
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

// 📱 MENU FUNCTIONALITY

function setupMenuToggle() {
  const menuToggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('menu');
  
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', toggleMenu);
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('show') && 
          !menu.contains(e.target) && 
          !menuToggle.contains(e.target)) {
        closeMenu();
      }
    });
  }
}

function toggleMenu() {
  const menu = document.getElementById('menu');
  const menuToggle = document.getElementById('menu-toggle');
  
  if (menu && menuToggle) {
    menu.classList.toggle('show');
    menuToggle.classList.toggle('active');
    
    console.log(`📱 Menu ${menu.classList.contains('show') ? 'opened' : 'closed'}`);
  }
}

function closeMenu() {
  const menu = document.getElementById('menu');
  const menuToggle = document.getElementById('menu-toggle');
  
  if (menu && menuToggle) {
    menu.classList.remove('show');
    menuToggle.classList.remove('active');
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
