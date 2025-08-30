// js/main.js
// Main application orchestrator - imports and initializes all modules

// Import all modules
import { checkAuth, setupAuthStateHandler } from './auth.js';
import { setupUIEventListeners } from './ui.js';
import { setupSettingsEventListeners } from './settings.js';
import { setupPhotoEventListeners } from './photos.js';
import { initializePWA } from './pwa.js';
import { initializeCookieConsent } from './cookies.js';

// Import functions that need to be made globally available
import { register, login, logout, resetPassword, changePassword } from './auth.js';
import { showApp } from './ui.js';

// App initialization with proper loading states
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🎎 Initializing Pookie\'s App...');
  
  try {
    // Initialize cookie consent first (but don't wait)
    initializeCookieConsent();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Make auth functions globally available for form handlers
    setupGlobalAuthFunctions();
    
    // Setup authentication state handler
    setupAuthStateHandler();

    setupSmartTabHandling();

    // Initialize PWA functionality (don't wait)
    initializePWA().catch(error => {
      console.warn('PWA initialization failed:', error);
    });
    
    // Check if user is already authenticated (this will handle loading states)
    await checkAuth();
    
    console.log('✅ App initialized successfully');
    
  } catch (error) {
    console.error('❌ Error initializing app:', error);
    // Show a user-friendly error message
    showInitializationError(error);
  }
});

// Setup all event listeners
function setupEventListeners() {
  // UI event listeners (menu, modals, etc.)
  setupUIEventListeners();
  
  // Settings modal event listeners
  setupSettingsEventListeners();
  
  // Photo and gallery event listeners
  setupPhotoEventListeners();
  
  // Form submission handlers
  setupFormHandlers();
  
  // Keyboard shortcuts
  setupKeyboardShortcuts();
}

// Make authentication functions globally available
function setupGlobalAuthFunctions() {
  // Make auth functions available globally for onclick handlers
  window.register = register;
  window.login = login;
  window.logout = logout;
  window.resetPassword = resetPassword;
  window.changePassword = changePassword;
  window.showApp = showApp;
}

// Setup form handlers with Enter key support
function setupFormHandlers() {
  // Login form Enter key handler
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  if (emailInput && passwordInput) {
    [emailInput, passwordInput].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          login();
        }
      });
    });
  }
  
  // Reset password form Enter key handler
  const resetEmailInput = document.getElementById('reset-email');
  if (resetEmailInput) {
    resetEmailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        resetPassword();
      }
    });
  }
  
  // Settings form handlers
  const settingsInputs = document.querySelectorAll('.settings-input');
  settingsInputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const { saveSettings } = window;
        if (saveSettings) saveSettings();
      }
    });
  });
  
  // Disable form submission on Enter to prevent page reload
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape key - close any open modals
    if (e.key === 'Escape') {
      closeAllModals();
    }
    
    // Ctrl/Cmd + K - focus on search/email input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const emailInput = document.getElementById('email');
      if (emailInput && emailInput.offsetParent !== null) {
        emailInput.focus();
      }
    }
    
    // Ctrl/Cmd + Enter - quick login if on login page
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const loginSection = document.getElementById('login-section');
      if (loginSection && loginSection.offsetParent !== null) {
        e.preventDefault();
        login();
      }
    }
  });
}

// Close all open modals
function closeAllModals() {
  // Close settings modal
  const settingsModal = document.getElementById('settings-modal');
  if (settingsModal && settingsModal.classList.contains('show')) {
    const { closeSettingsModal } = window;
    if (closeSettingsModal) closeSettingsModal();
  }
  
  // Close password modal
  const passwordModal = document.getElementById('password-modal');
  if (passwordModal && passwordModal.style.display === 'flex') {
    const { closePasswordModal } = window;
    if (closePasswordModal) closePasswordModal();
  }
  
  // Close photo preview
  const photoPreview = document.getElementById('photo-preview-popup');
  if (photoPreview && photoPreview.classList.contains('show')) {
    const { closePhotoPreview } = window;
    if (closePhotoPreview) closePhotoPreview();
  }
  
  // Close image modal
  const imageModal = document.getElementById('image-modal');
  if (imageModal && imageModal.classList.contains('show')) {
    const { closeImageModal } = window;
    if (closeImageModal) closeImageModal();
  }
  
  // Close iOS install modal
  const iosModal = document.getElementById('ios-install-modal');
  if (iosModal && iosModal.classList.contains('show')) {
    const { closeIOSInstallModal } = window;
    if (closeIOSInstallModal) closeIOSInstallModal();
  }
  
  // Close menu
  const { closeMenu } = window;
  if (closeMenu) closeMenu();
}

// Show initialization error
function showInitializationError(error) {
  // Remove any loading screens first
  const existingLoading = document.getElementById('loading-screen');
  if (existingLoading) {
    existingLoading.remove();
  }
  
  const loginSection = document.getElementById('login-section');
  if (loginSection) {
    loginSection.style.display = 'flex'; // Show login section
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      background: rgba(255, 0, 0, 0.1);
      border: 2px solid rgba(255, 0, 0, 0.3);
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
      color: white;
      text-align: center;
      backdrop-filter: blur(5px);
    `;
    errorDiv.innerHTML = `
      <h3>⚠️ Initialization Error</h3>
      <p>Something went wrong while starting the app. Please refresh the page.</p>
      <button onclick="location.reload()" style="
        margin-top: 10px; 
        padding: 8px 16px; 
        background: white; 
        color: #333; 
        border: none; 
        border-radius: 4px; 
        cursor: pointer;
        font-weight: 600;
      ">
        🔄 Refresh Page
      </button>
    `;
    loginSection.appendChild(errorDiv);
  }
}

// Global error handler for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent default browser error handling
  event.preventDefault();
  
  // Show user-friendly message for auth errors
  if (event.reason && event.reason.message && event.reason.message.includes('auth')) {
    showStatus('Authentication error occurred. Please try logging in again.', 'error');
  }
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Log error details for debugging
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  
  // Don't show error to user unless it's critical
  if (event.message && event.message.includes('supabase')) {
    console.warn('Supabase error detected, might need to refresh');
  }
});

// Service worker update handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (window.refreshing) return;
    window.refreshing = true;
    console.log('Service worker updated, reloading...');
    window.location.reload();
  });
}

// Visibility change handler - useful for refreshing data when user returns to tab
function setupSmartTabHandling() {
  let lastTabReturn = Date.now();
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const now = Date.now();
      
      // Only do expensive operations if user was away for more than 5 minutes
      if (now - lastTabReturn > 5 * 60 * 1000) {
        console.log('User returned after long absence, checking auth...');
        
        // Only check auth if we don't have a current user
        const { getCurrentUser } = window;
        if (getCurrentUser && !getCurrentUser()) {
          checkAuth().catch(console.error);
        }
      }
      
      lastTabReturn = now;
    }
  });
}

// Performance monitoring (if cookies accepted)
if (window.performance && window.performance.mark) {
  window.performance.mark('app-initialization-complete');
}

// Utility function to show status messages (used by error handlers)
function showStatus(message, type) {
  // Try to find a status container
  let statusContainer = document.getElementById('login-message') || 
                       document.getElementById('upload-status') ||
                       document.getElementById('settings-message');
  
  if (statusContainer) {
    statusContainer.textContent = message;
    statusContainer.style.color = type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : '#74c0fc';
    
    // Clear after 5 seconds unless it's an error
    if (type !== 'error') {
      setTimeout(() => {
        statusContainer.textContent = '';
      }, 5000);
    }
  } else {
    // Fallback: create a temporary status message
    const tempStatus = document.createElement('div');
    tempStatus.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? 'rgba(255, 107, 107, 0.9)' : 'rgba(81, 207, 102, 0.9)'};
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      z-index: 10000;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    tempStatus.textContent = message;
    document.body.appendChild(tempStatus);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (document.body.contains(tempStatus)) {
        tempStatus.remove();
      }
    }, 4000);
  }
}

// Make showStatus globally available
window.showStatus = showStatus;

console.log('🎎 Main.js loaded successfully');