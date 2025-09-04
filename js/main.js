// js/main.js
// Main application orchestrator - PERFORMANCE OPTIMIZED with proper UI flow

// Import all required modules
import { checkAuth, setupAuthStateHandler } from './auth.js';
import { initializeApp, setupUIEventListeners } from './ui.js';
import { setupSettingsEventListeners } from './settings.js';
import { setupPhotoEventListeners } from './photos.js';
import { initializePWA } from './pwa.js';
import { initializeCookieConsent } from './cookies.js';

// Import functions that need to be made globally available
import { register, login, logout, resetPassword, changePassword } from './auth.js';
import { showApp, showLogin } from './ui.js';

// 🚀 MAIN APP INITIALIZATION
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🎎 Initializing Pookie\'s App...');
  
  try {
    // Step 1: Initialize cookie consent (non-blocking)
    initializeCookieConsent();
    
    // Step 2: Setup authentication state handler first
    setupAuthStateHandler();
    
    // Step 3: Initialize UI with proper show/hide logic
    await initializeApp();
    
    // Step 4: Setup all event listeners after UI is ready
    setupAllEventListeners();
    
    // Step 5: Make auth functions globally available for HTML onclick handlers
    setupGlobalAuthFunctions();
    
    // Step 6: Setup performance monitoring and error handling
    setupPerformanceMonitoring();
    setupErrorHandling();
    
    // Step 7: Initialize PWA functionality (non-blocking)
    initializePWA().catch(error => {
      console.warn('⚠️ PWA initialization failed:', error);
    });
    
    console.log('✅ App initialization complete!');
    
  } catch (error) {
    console.error('❌ Critical error during app initialization:', error);
    showInitializationError(error);
  }
});

// 🎧 SETUP ALL EVENT LISTENERS
function setupAllEventListeners() {
  console.log('🎧 Setting up all event listeners...');
  
  try {
    // UI event listeners (menu, modals, keyboard shortcuts)
    setupUIEventListeners();
    
    // Settings modal event listeners
    setupSettingsEventListeners();
    
    // Photo and gallery event listeners
    setupPhotoEventListeners();
    
    // Form submission handlers with Enter key support
    setupFormHandlers();
    
    // Smart tab handling for better performance
    setupSmartTabHandling();
    
    console.log('✅ All event listeners configured');
    
  } catch (error) {
    console.error('❌ Error setting up event listeners:', error);
  }
}

// 🌐 MAKE AUTHENTICATION FUNCTIONS GLOBALLY AVAILABLE
function setupGlobalAuthFunctions() {
  console.log('🌐 Making auth functions globally available...');
  
  // Make auth functions available for onclick handlers in HTML
  window.register = register;
  window.login = login;
  window.logout = logout;
  window.resetPassword = resetPassword;
  window.changePassword = changePassword;
  window.showApp = showApp;
  window.showLogin = showLogin;
  
  // Debug function for troubleshooting
  window.debugAuth = function() {
    console.log('🔍 AUTH DEBUG INFO:');
    const { getCurrentUser } = window;
    console.log('Current user:', getCurrentUser ? getCurrentUser() : 'Function not available');
    
    // Check localStorage for auth data
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    );
    console.log('Auth localStorage keys:', authKeys);
  };
  
  console.log('✅ Global functions configured');
}

// 📝 FORM HANDLERS WITH ENTER KEY SUPPORT
function setupFormHandlers() {
  console.log('📝 Setting up form handlers...');
  
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
    console.log('✅ Login form handlers configured');
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
    console.log('✅ Reset password handler configured');
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
  
  if (settingsInputs.length > 0) {
    console.log(`✅ ${settingsInputs.length} settings input handlers configured`);
  }
  
  // Prevent form submission from causing page reload
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('📝 Form submission prevented (SPA behavior)');
    });
  });
  
  if (forms.length > 0) {
    console.log(`✅ ${forms.length} form submission handlers configured`);
  }
}

// 🔄 SMART TAB HANDLING FOR PERFORMANCE
function setupSmartTabHandling() {
  console.log('🔄 Setting up smart tab handling...');
  
  let lastTabReturn = Date.now();
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const now = Date.now();
      
      // Only do expensive operations if user was away for more than 5 minutes
      if (now - lastTabReturn > 5 * 60 * 1000) {
        console.log('👀 User returned after long absence, checking auth status...');
        
        // Only check auth if we don't have a current user
        const { getCurrentUser } = window;
        if (getCurrentUser && !getCurrentUser()) {
          checkAuth().catch(error => {
            console.error('❌ Auth check on tab return failed:', error);
          });
        }
      }
      
      lastTabReturn = now;
    }
  });
  
  console.log('✅ Smart tab handling configured');
}

// 📊 PERFORMANCE MONITORING
function setupPerformanceMonitoring() {
  console.log('📊 Setting up performance monitoring...');
  
  // Track page load time
  window.addEventListener('load', () => {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      console.log(`📈 Page loaded in ${loadTime}ms`);
      
      if (loadTime > 5000) {
        console.warn('🐌 Slow page load detected! Consider optimization.');
      }
    }
  });
  
  // Mark app initialization complete
  if (window.performance && window.performance.mark) {
    window.performance.mark('app-initialization-complete');
    console.log('🏁 Performance mark: app-initialization-complete');
  }
  
  // Memory usage monitoring (if available)
  if (performance.memory) {
    console.log('💾 Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
    });
  }
}

// 🚨 ERROR HANDLING SETUP
function setupErrorHandling() {
  console.log('🚨 Setting up error handling...');
  
  // Global JavaScript error handler
  window.addEventListener('error', (event) => {
    console.error('💥 Global JavaScript error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    
    // Show user-friendly message for Supabase errors
    if (event.message && event.message.includes('supabase')) {
      console.warn('⚠️ Supabase error detected');
      showStatus('Connection issue detected. Please refresh the page.', 'warning');
    }
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🔥 Unhandled promise rejection:', event.reason);
    
    // Prevent default browser error handling
    event.preventDefault();
    
    // Show user-friendly message for auth errors
    if (event.reason && event.reason.message && event.reason.message.includes('auth')) {
      showStatus('Authentication error occurred. Please try logging in again.', 'error');
    }
  });
  
  console.log('✅ Error handling configured');
}

// 🆘 INITIALIZATION ERROR HANDLER
function showInitializationError(error) {
  console.error('💀 Critical initialization error:', error);
  
  // Try to show login section as fallback
  const loginSection = document.getElementById('login-section');
  if (loginSection) {
    loginSection.style.display = 'flex';
    
    // Add error message to login section
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      background: #ff6b6b;
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      font-weight: 500;
    `;
    errorDiv.innerHTML = `
      <h3 style="margin: 0 0 10px 0;">⚠️ Initialization Error</h3>
      <p style="margin: 0 0 10px 0;">The app failed to start properly. Please refresh the page.</p>
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
  } else {
    // Last resort: show alert
    alert('App failed to initialize. Please refresh the page.');
  }
}

// 💬 STATUS MESSAGE UTILITY
function showStatus(message, type = 'info', duration = 5000) {
  console.log(`💬 Status (${type}): ${message}`);
  
  // Try to find existing status containers
  let statusContainer = document.getElementById('login-message') || 
                       document.getElementById('upload-status') ||
                       document.getElementById('settings-message');
  
  if (statusContainer) {
    statusContainer.textContent = message;
    statusContainer.style.color = getStatusColor(type);
    
    // Clear after duration unless it's an error
    if (type !== 'error') {
      setTimeout(() => {
        statusContainer.textContent = '';
      }, duration);
    }
  } else {
    // Create floating status message
    createFloatingStatus(message, type, duration);
  }
}

function getStatusColor(type) {
  const colors = {
    error: '#ff6b6b',
    success: '#51cf66',
    warning: '#ffd43b',
    info: '#74c0fc'
  };
  return colors[type] || colors.info;
}

function createFloatingStatus(message, type, duration) {
  const statusElement = document.createElement('div');
  statusElement.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${getStatusColor(type)};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInDown 0.3s ease-out;
  `;
  statusElement.textContent = message;
  
  document.body.appendChild(statusElement);
  
  // Auto-remove after duration
  setTimeout(() => {
    statusElement.style.animation = 'slideOutUp 0.3s ease-in';
    setTimeout(() => statusElement.remove(), 300);
  }, duration);
}

// 🔧 SERVICE WORKER UPDATE HANDLER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (window.refreshing) return;
    window.refreshing = true;
    console.log('🔄 Service worker updated, reloading page...');
    window.location.reload();
  });
}

// 🎯 UTILITY FUNCTIONS FOR DEBUGGING

// Function to check current app state
window.getAppState = function() {
  const loginVisible = document.getElementById('login-section')?.style.display !== 'none';
  const appVisible = document.getElementById('app-section')?.style.display !== 'none';
  
  console.log('🔍 Current app state:', {
    loginVisible,
    appVisible,
    currentUser: window.getCurrentUser ? window.getCurrentUser() : null,
    timestamp: new Date().toISOString()
  });
  
  return { loginVisible, appVisible };
};

// Function to force refresh current section
window.refreshUI = function() {
  console.log('🔄 Force refreshing UI...');
  const { refreshCurrentSection } = window;
  if (refreshCurrentSection) {
    refreshCurrentSection();
  } else {
    console.warn('⚠️ refreshCurrentSection function not available');
    // Fallback: reload the page
    window.location.reload();
  }
};

// Function to clear all localStorage (useful for debugging)
window.clearAppData = function() {
  console.log('🧹 Clearing all app data...');
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ App data cleared. Refresh page to restart.');
};

// 📈 FINAL STARTUP LOG
console.log(`
🎎 Pookie's App Main Controller Loaded
📅 Build Date: ${new Date().toISOString()}
🌐 User Agent: ${navigator.userAgent}
📱 Mobile: ${/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)}
🔧 Debug functions: getAppState(), refreshUI(), clearAppData(), debugAuth()
`);

// Export main functions for external use if needed
export { 
  setupAllEventListeners,
  setupGlobalAuthFunctions,
  showStatus,
  showInitializationError
};
