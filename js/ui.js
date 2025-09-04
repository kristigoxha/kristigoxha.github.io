// js/ui.js
// User Interface management and interactions

// 🔊 AUDIO SYSTEM
let boingSound = null;

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

// 🎨 UI INITIALIZATION
export function initializeUI() {
  console.log('🎨 Initializing UI...');
  
  // Show loading overlay
  const overlay = createLoadingOverlay();
  document.body.appendChild(overlay);
  
  // Initialize all UI components
  initializeAppUI();
  
  // Load app data
  loadAppData().finally(() => {
    // Hide loading overlay after data loads
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }, 500);
  });
}

function createLoadingOverlay() {
  const overlay = document.createElement('div');
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
  
  // Add loading animation styles
  if (!document.getElementById('loading-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
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
  
  // Initialize audio system
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
    // FIRST: Play the sound immediately when clicked
    await playBoingSound();
    
    // THEN: Handle database update
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
    console.log('📱 Menu closed');
  }
}

// ⌨️ KEYBOARD SHORTCUTS
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Spacebar to click emoji
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      handleEmojiClick();
    }
    
    // Escape to close modals
    if (e.code === 'Escape') {
      closeSettingsModal();
      closePasswordModal();
      closeMenu();
    }
    
    // Ctrl/Cmd + , for settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      showSettingsModal();
    }
  });
}

// 🖼️ PHOTO PREVIEW FUNCTIONALITY
export function showPhotoPreview() {
  console.log('📸 Showing photo preview...');
  // This function would be implemented to show recent photos
  // For now, just log that it was called
  alert('Photo preview feature coming soon!');
}

// 🔄 PWA UPDATE FUNCTIONALITY
export function updatePWA() {
  console.log('🔄 Updating PWA...');
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    });
  }
}

export function hidePWAUpdateBanner() {
  const banner = document.getElementById('pwa-update-banner');
  if (banner) {
    banner.style.display = 'none';
  }
}

// 🐛 DEBUG FUNCTIONALITY
export function showDebugInfo() {
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
  }
}

// Export all the functions that might be called from HTML
export { 
  handleEmojiClick, 
  playBoingSound, 
  initializeAppUI,
  toggleMenu,
  closeMenu
};
