// js/ui.js - Complete UI Controller
// This file manages what the user sees and handles all UI state changes

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
  
  // Initialize app-specific UI elements
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
    loadingOverlay.style.display = 'none';
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  `;
  
  overlay.innerHTML = `
    <div style="font-size: 4rem; margin-bottom: 1rem; animation: bounce 1s infinite;">🎎</div>
    <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem;">Loading Pookie's App...</div>
    <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
      <div style="width: 100%; height: 100%; background: white; border-radius: 2px; animation: loading 2s infinite;"></div>
    </div>
  `;
  
  // Add animations if not already present
  if (!document.getElementById('loading-animations')) {
    const style = document.createElement('style');
    style.id = 'loading-animations';
    style.textContent = `
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
      @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }
  
  return overlay;
}

// 📊 APP DATA LOADING

async function loadAppData() {
  console.log('📊 Loading application data...');
  
  try {
    // Load today's boing count
    const { getTodayBoingCount } = await import('./database.js');
    const todayCount = await getTodayBoingCount();
    
    const countElement = document.getElementById('todayCount');
    if (countElement) {
      countElement.textContent = todayCount;
      console.log(`📈 Today's boing count: ${todayCount}`);
    }
    
    // Load user profile data
    const { getCurrentUser } = await import('./auth.js');
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

// 🎭 EMOJI INTERACTION

async function handleEmojiClick() {
  console.log('🎎 Emoji clicked!');
  
  try {
    const { addBoing } = await import('./database.js');
    const result = await addBoing();
    
    if (result.success) {
      // Update counter
      const countElement = document.getElementById('todayCount');
      if (countElement) {
        countElement.textContent = result.newCount;
      }
      
      // Add visual feedback
      addClickAnimation();
      
      console.log(`✅ Boing added! New count: ${result.newCount}`);
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
      element.className = 'message'; // Reset classes
    }
  });
}

// 📢 STATUS MESSAGES

export function showMessage(elementId, message, type = 'info') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.textContent = message;
  element.className = `message ${type}`;
  
  console.log(`💬 Message (${type}): ${message}`);
  
  // Auto-clear non-error messages after 5 seconds
  if (type !== 'error') {
    setTimeout(() => {
      element.textContent = '';
      element.className = 'message';
    }, 5000);
  }
}

export function showStatus(message, type = 'info', duration = 5000) {
  // Try to find existing status container
  let statusContainer = document.getElementById('status-container');
  
  if (!statusContainer) {
    statusContainer = createStatusContainer();
    document.body.appendChild(statusContainer);
  }
  
  const statusElement = createStatusElement(message, type);
  statusContainer.appendChild(statusElement);
  
  // Auto-remove after duration
  setTimeout(() => {
    statusElement.remove();
    
    // Remove container if empty
    if (statusContainer.children.length === 0) {
      statusContainer.remove();
    }
  }, duration);
}

function createStatusContainer() {
  const container = document.createElement('div');
  container.id = 'status-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    pointer-events: none;
  `;
  return container;
}

function createStatusElement(message, type) {
  const element = document.createElement('div');
  
  const colors = {
    success: '#51cf66',
    error: '#ff6b6b',
    warning: '#ffd43b',
    info: '#74c0fc'
  };
  
  element.style.cssText = `
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 500;
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

// Export main initialization function
export { initializeApp as default };
