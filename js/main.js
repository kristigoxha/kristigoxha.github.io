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

// App initialization
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🎎 Initializing Pookie\'s App...');
  
  try {
    // Initialize cookie consent first
    initializeCookieConsent();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Make auth functions globally available for form handlers
    setupGlobalAuthFunctions();
    
    // Setup authentication state handler
    setupAuthStateHandler();
    
    // Initialize PWA functionality
    await initializePWA();
    
    // Check if user is already authenticated
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
        resetPassword();
      }
    });
  }
  
  // Settings form handlers
  const settingsInputs = document.querySelectorAll('.settings-input');
  settingsInputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const { saveSettings } = window;
        if (saveSettings) saveSettings();
      }
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
      if (emailInput && emailInput.style.display !== 'none') {
        emailInput.focus();
      }
    }
    
    // Ctrl/Cmd + Enter - quick login if on login page
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const loginSection = document.getElementById('login-section');
      if (loginSection && loginSection.style.display !== 'none') {
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
  const loginSection = document.getElementById('login-section');
  if (loginSection) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      background: rgba(255, 0, 0, 0.1);
      border: 2px solid rgba(255, 0, 0, 0.3);
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
      color: white;
      text-align: center;
    `;
    errorDiv.innerHTML = `
      <h3>⚠️ Initialization Error</h3>
      <p>Something went wrong while starting the app. Please refresh the page.</p>
      <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: white; color: #333; border: none; border-radius: 4px; cursor: pointer;">
        🔄 Refresh Page
      </button>
    `;
    loginSection.appendChild(errorDiv);
  }
}

// Global error handler for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // You could show a user-friendly error message here
  // For now, just log it and prevent the default browser behavior
  event.preventDefault();
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
});

// Service worker update handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Service worker has been updated, could show a message to user
    console.log('Service worker updated');
  });
}

// Visibility change handler - useful for refreshing data when user returns to tab
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // User returned to the tab, could refresh data here
    console.log('User returned to tab');
    
    // Update PWA status indicator
    const { updatePWAStatusIndicator } = window;
    if (updatePWAStatusIndicator) {
      setTimeout(updatePWAStatusIndicator, 100);
    }
  }
});

// Performance monitoring (if cookies accepted)
if (window.performance && window.performance.mark) {
  window.performance.mark('app-initialization-complete');
}

console.log('🎎 Main.js loaded successfully');