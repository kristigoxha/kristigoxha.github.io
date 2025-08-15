// js/cookies.js - FINAL FIXED VERSION
// Cookie consent functionality with proper global scope

// IMPORTANT: Use window object for global state since HTML uses onclick handlers
window.cookieConsentShowing = window.cookieConsentShowing || false;
window.cookieConsentProcessed = window.cookieConsentProcessed || false;
window.cookieSystemInitialized = window.cookieSystemInitialized || false;
window.eventListenersSetup = window.eventListenersSetup || false;

// Cookie consent functionality
export function showCookieConsent() {
  console.log('🍪 showCookieConsent called, showing:', window.cookieConsentShowing);
  
  if (window.cookieConsentShowing || window.cookieConsentProcessed) {
    console.log('🍪 Cookie consent already showing/processed, skipping');
    return;
  }
  
  window.cookieConsentShowing = true;
  const overlay = document.getElementById("cookie-overlay");
  if (overlay) {
    overlay.classList.add("show");
    console.log('🍪 Cookie overlay shown');
  }
}

export function hideCookieConsent() {
  console.log('🍪 hideCookieConsent called');
  const overlay = document.getElementById("cookie-overlay");
  if (overlay) {
    overlay.style.animation = "cookieSlideOut 0.4s ease-in-out";
    setTimeout(() => {
      overlay.classList.remove("show");
      overlay.style.animation = "";
      window.cookieConsentShowing = false;
      console.log('🍪 Cookie overlay hidden');
    }, 400);
  }
}

export function acceptCookies() {
  console.log('🍪 acceptCookies called');
  
  // Try to store consent with error handling
  try {
    localStorage.setItem("cookieConsent", "accepted");
    console.log('🍪 Consent stored in localStorage');
  } catch (error) {
    console.error('🍪 Failed to store in localStorage:', error);
    // Fallback: use sessionStorage or memory
    try {
      sessionStorage.setItem("cookieConsent", "accepted");
      console.log('🍪 Consent stored in sessionStorage as fallback');
    } catch (sessionError) {
      console.error('🍪 Failed to store in sessionStorage:', sessionError);
      // Last resort: store in memory (will reset on page reload)
      window.cookieConsentMemory = "accepted";
      console.log('🍪 Consent stored in memory as last resort');
    }
  }
  
  window.cookieConsentProcessed = true;
  hideCookieConsent();

  // Initialize enhanced features
  console.log("🍪 Cookies accepted! Initializing enhanced features...");
  enableEnhancedFeatures();
}

export function rejectCookies() {
  console.log('🍪 rejectCookies called');
  
  // Try to store rejection with error handling
  try {
    localStorage.setItem("cookieConsent", "rejected");
    console.log('🍪 Rejection stored in localStorage');
  } catch (error) {
    console.error('🍪 Failed to store rejection in localStorage:', error);
    try {
      sessionStorage.setItem("cookieConsent", "rejected");
      console.log('🍪 Rejection stored in sessionStorage as fallback');
    } catch (sessionError) {
      console.error('🍪 Failed to store rejection in sessionStorage:', sessionError);
      window.cookieConsentMemory = "rejected";
      console.log('🍪 Rejection stored in memory as last resort');
    }
  }
  
  window.cookieConsentProcessed = true;
  hideCookieConsent();

  // Run in minimal mode
  console.log("😔 Cookies rejected. Running in minimal mode...");
  disableNonEssentialFeatures();
}

// Enhanced consent checking with fallback methods
export function getCookieConsent() {
  let consent = null;
  
  // Try localStorage first
  try {
    consent = localStorage.getItem("cookieConsent");
    if (consent) {
      console.log('🍪 Consent found in localStorage:', consent);
      return consent;
    }
  } catch (error) {
    console.warn('🍪 Cannot access localStorage:', error);
  }
  
  // Try sessionStorage as fallback
  try {
    consent = sessionStorage.getItem("cookieConsent");
    if (consent) {
      console.log('🍪 Consent found in sessionStorage:', consent);
      return consent;
    }
  } catch (error) {
    console.warn('🍪 Cannot access sessionStorage:', error);
  }
  
  // Check memory fallback
  if (window.cookieConsentMemory) {
    console.log('🍪 Consent found in memory:', window.cookieConsentMemory);
    return window.cookieConsentMemory;
  }
  
  console.log('🍪 No consent found anywhere');
  return null;
}

// Check if consent has already been given - WITH SAFEGUARDS
export function checkCookieConsent() {
  // Prevent multiple simultaneous checks
  if (window.cookieConsentProcessed) {
    console.log('🍪 Cookie consent already processed, skipping check');
    return getCookieConsent();
  }
  
  console.log('🍪 Checking cookie consent...');
  const consent = getCookieConsent();
  
  if (consent === "accepted") {
    console.log("🍪 Cookies previously accepted");
    enableEnhancedFeatures();
    window.cookieConsentProcessed = true;
    return true;
  } else if (consent === "rejected") {
    console.log("😔 Cookies previously rejected");
    disableNonEssentialFeatures();
    window.cookieConsentProcessed = true;
    return false;
  }
  
  // Only show popup if we haven't processed consent yet AND not currently showing
  if (!window.cookieConsentShowing && !window.cookieConsentProcessed) {
    console.log('🍪 No consent found, will show popup in 2 seconds');
    
    // Use a timeout ID so we can clear it if needed
    window.cookieTimeoutId = setTimeout(() => {
      // Double-check conditions before showing
      if (!window.cookieConsentProcessed && !window.cookieConsentShowing) {
        console.log('🍪 Showing cookie popup now');
        showCookieConsent();
      } else {
        console.log('🍪 Consent processed while waiting, skipping popup');
      }
    }, 2000);
  }
  
  return null;
}

// Reset cookie consent (for testing or user preference change)
export function resetCookieConsent() {
  console.log('🍪 Resetting cookie consent');
  
  // Clear any pending timeouts
  if (window.cookieTimeoutId) {
    clearTimeout(window.cookieTimeoutId);
    window.cookieTimeoutId = null;
  }
  
  // Clear all storage methods
  try {
    localStorage.removeItem("cookieConsent");
  } catch (error) {
    console.warn('🍪 Cannot clear localStorage:', error);
  }
  
  try {
    sessionStorage.removeItem("cookieConsent");
  } catch (error) {
    console.warn('🍪 Cannot clear sessionStorage:', error);
  }
  
  delete window.cookieConsentMemory;
  
  // Reset flags
  window.cookieConsentProcessed = false;
  window.cookieConsentShowing = false;
  window.cookieSystemInitialized = false;
  
  console.log("🍪 Cookie consent reset");
}

// Enhanced features when cookies are accepted
function enableEnhancedFeatures() {
  console.log('🍪 Enabling enhanced features...');
  
  // Enable analytics (placeholder for future implementation)
  // initializeAnalytics();
  
  // Enable advanced caching
  enableAdvancedCaching();
  
  // Enable user preference storage
  enableUserPreferences();
  
  // Enable performance monitoring
  // enablePerformanceMonitoring();
}

// Disable non-essential features when cookies are rejected
function disableNonEssentialFeatures() {
  console.log('🍪 Disabling non-essential features...');
  
  // Disable analytics
  // disableAnalytics();
  
  // Use minimal caching
  useMinimalCaching();
  
  // Disable user preference storage
  disableUserPreferences();
  
  console.log("Running in privacy-focused minimal mode");
}

// Advanced caching functionality
function enableAdvancedCaching() {
  if ('serviceWorker' in navigator) {
    console.log("🍪 Advanced caching enabled");
  }
}

function useMinimalCaching() {
  console.log("🍪 Using minimal caching for privacy");
}

// User preferences
function enableUserPreferences() {
  console.log("🍪 User preferences storage enabled");
}

function disableUserPreferences() {
  console.log("🍪 User preferences storage disabled");
}

// Cookie management utilities with consent checking
export function setCookie(name, value, days = 30) {
  const consent = getCookieConsent();
  
  if (consent !== "accepted") {
    console.warn(`🍪 Cannot set cookie "${name}" - user has not accepted cookies`);
    return false;
  }
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  return true;
}

// Get a cookie value
export function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  
  return null;
}

// Delete a specific cookie
export function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// Clear all cookies with enhanced error handling
export function clearAllCookies() {
  console.log('🍪 Clearing all cookies...');
  
  // Clear any pending timeouts
  if (window.cookieTimeoutId) {
    clearTimeout(window.cookieTimeoutId);
    window.cookieTimeoutId = null;
  }
  
  // Clear browser cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Clear all storage
  try {
    localStorage.removeItem("cookieConsent");
  } catch (error) {
    console.warn('🍪 Cannot clear localStorage:', error);
  }
  
  try {
    sessionStorage.removeItem("cookieConsent");
  } catch (error) {
    console.warn('🍪 Cannot clear sessionStorage:', error);
  }
  
  delete window.cookieConsentMemory;
  
  // Reset flags
  window.cookieConsentProcessed = false;
  window.cookieConsentShowing = false;
  window.cookieSystemInitialized = false;
  
  console.log("🍪 All cookies cleared");
}

// Setup cookie consent event listeners - ONLY ONCE
export function setupCookieEventListeners() {
  if (window.eventListenersSetup) {
    console.log('🍪 Event listeners already setup, skipping');
    return;
  }
  
  console.log('🍪 Setting up cookie event listeners...');
  
  // Make functions available globally for onclick handlers
  window.showCookieConsent = showCookieConsent;
  window.hideCookieConsent = hideCookieConsent;
  window.acceptCookies = acceptCookies;
  window.rejectCookies = rejectCookies;
  window.checkCookieConsent = checkCookieConsent;
  window.resetCookieConsent = resetCookieConsent;
  window.clearAllCookies = clearAllCookies;
  window.getCookieConsent = getCookieConsent;
  
  window.eventListenersSetup = true;
  console.log('🍪 Event listeners setup complete');
}

// Initialize cookie consent system - ONLY ONCE
export function initializeCookieConsent() {
  if (window.cookieSystemInitialized) {
    console.log('🍪 Cookie system already initialized, skipping');
    return;
  }
  
  console.log('🍪 Initializing cookie consent system...');
  
  setupCookieEventListeners();
  
  // Check consent on page load with a delay to not block initial render
  setTimeout(() => {
    if (!window.cookieSystemInitialized) {
      checkCookieConsent();
      window.cookieSystemInitialized = true;
      console.log('🍪 Cookie system initialization complete');
    }
  }, 1000);
}

// Debug function to check current state
window.debugCookies = function() {
  console.log('🍪 Cookie Debug Info:', {
    consent: getCookieConsent(),
    showing: window.cookieConsentShowing,
    processed: window.cookieConsentProcessed,
    initialized: window.cookieSystemInitialized,
    eventListeners: window.eventListenersSetup,
    timeoutId: window.cookieTimeoutId || 'none',
    localStorage: (() => {
      try { return localStorage.getItem("cookieConsent"); } catch { return 'unavailable'; }
    })(),
    sessionStorage: (() => {
      try { return sessionStorage.getItem("cookieConsent"); } catch { return 'unavailable'; }
    })(),
    memory: window.cookieConsentMemory || 'none'
  });
  
  // Also show current popup state
  const overlay = document.getElementById("cookie-overlay");
  console.log('🍪 Popup DOM state:', {
    exists: !!overlay,
    hasShowClass: overlay ? overlay.classList.contains('show') : false,
    display: overlay ? overlay.style.display : 'no element',
    visible: overlay ? (overlay.offsetParent !== null) : false
  });
};