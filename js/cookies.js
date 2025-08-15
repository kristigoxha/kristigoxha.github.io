// js/cookies.js
// Cookie consent functionality

// Cookie consent functionality
export function showCookieConsent() {
  document.getElementById("cookie-overlay").classList.add("show");
}

export function hideCookieConsent() {
  const overlay = document.getElementById("cookie-overlay");
  overlay.style.animation = "cookieSlideOut 0.4s ease-in-out";
  setTimeout(() => {
    overlay.classList.remove("show");
    overlay.style.animation = "";
  }, 400);
}

export function acceptCookies() {
  // Store consent in localStorage
  localStorage.setItem("cookieConsent", "accepted");
  hideCookieConsent();

  // Initialize enhanced features (analytics, etc.)
  console.log("🍪 Cookies accepted! Initializing enhanced features...");
  
  // Enable enhanced tracking and features
  enableEnhancedFeatures();
}

export function rejectCookies() {
  // Store rejection in localStorage
  localStorage.setItem("cookieConsent", "rejected");
  hideCookieConsent();

  // Run in minimal mode
  console.log("😔 Cookies rejected. Running in minimal mode...");
  
  // Disable non-essential features
  disableNonEssentialFeatures();
}

// Check if consent has already been given
export function checkCookieConsent() {
  const consent = localStorage.getItem("cookieConsent");
  
  if (consent === "accepted") {
    // Initialize enhanced features
    console.log("🍪 Cookies previously accepted");
    enableEnhancedFeatures();
    return true;
  } else if (consent === "rejected") {
    // Run in minimal mode
    console.log("😔 Cookies previously rejected");
    disableNonEssentialFeatures();
    return false;
  }
  
  // If no consent yet, show the popup after a delay
  setTimeout(showCookieConsent, 2000);
  return null;
}

// Get current consent status
export function getCookieConsent() {
  return localStorage.getItem("cookieConsent");
}

// Reset cookie consent (for testing or user preference change)
export function resetCookieConsent() {
  localStorage.removeItem("cookieConsent");
  console.log("Cookie consent reset");
}

// Enhanced features when cookies are accepted
function enableEnhancedFeatures() {
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
  // Enable service worker caching strategies
  if ('serviceWorker' in navigator) {
    console.log("Advanced caching enabled");
    // Could implement advanced caching strategies here
  }
}

function useMinimalCaching() {
  console.log("Using minimal caching for privacy");
  // Implement minimal caching that respects privacy
}

// User preferences
function enableUserPreferences() {
  // Allow storing user preferences like theme, settings, etc.
  console.log("User preferences storage enabled");
}

function disableUserPreferences() {
  // Don't store user preferences when cookies are rejected
  console.log("User preferences storage disabled");
}

// Cookie management utilities
export function clearAllCookies() {
  // Clear all cookies for the domain
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Clear localStorage consent
  localStorage.removeItem("cookieConsent");
  
  console.log("All cookies cleared");
}

// Set a cookie with consent check
export function setCookie(name, value, days = 30) {
  const consent = getCookieConsent();
  
  if (consent !== "accepted") {
    console.warn(`Cannot set cookie "${name}" - user has not accepted cookies`);
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

// Setup cookie consent event listeners
export function setupCookieEventListeners() {
  // Make functions available globally for onclick handlers
  window.showCookieConsent = showCookieConsent;
  window.hideCookieConsent = hideCookieConsent;
  window.acceptCookies = acceptCookies;
  window.rejectCookies = rejectCookies;
  window.checkCookieConsent = checkCookieConsent;
  window.resetCookieConsent = resetCookieConsent;
  window.clearAllCookies = clearAllCookies;
}

// Initialize cookie consent system
export function initializeCookieConsent() {
  setupCookieEventListeners();
  
  // Check consent on page load with a small delay to not block initial render
  setTimeout(() => {
    checkCookieConsent();
  }, 1000);
}