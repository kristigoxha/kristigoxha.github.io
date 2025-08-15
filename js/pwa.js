// js/pwa.js
// PWA installation and service worker functionality

// PWA installation prompt
let deferredPrompt = null;

// Device detection
export function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isAndroidDevice() {
  return /Android/.test(navigator.userAgent);
}

// Check if running in standalone mode (already installed as PWA)
export function isRunningStandalone() {
  return window.navigator.standalone === true || 
         window.matchMedia('(display-mode: standalone)').matches;
}

// Handle PWA installation for different platforms
export function handlePWAInstall() {
  // Close the menu first
  const { closeMenu } = window;
  if (closeMenu) closeMenu();
  
  if (isRunningStandalone()) {
    // Already installed
    showAlreadyInstalledMessage();
    return;
  }

  if (isIOSDevice()) {
    // Show iOS-specific instructions
    showIOSInstallModal();
  } else {
    // Try standard PWA install prompt
    if (deferredPrompt) {
      installPWA();
    } else {
      showManualInstallInstructions();
    }
  }
}

// Standard PWA installation
export async function installPWA() {
  if (!deferredPrompt) {
    showManualInstallInstructions();
    return;
  }

  try {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA install accepted');
      showInstallSuccessMessage();
    } else {
      console.log('PWA install dismissed');
    }
    
    // Reset the deferred prompt
    deferredPrompt = null;
    updateInstallButton();
    
  } catch (error) {
    console.error('PWA install error:', error);
    showManualInstallInstructions();
  }
}

// iOS installation modal
export function showIOSInstallModal() {
  document.getElementById("ios-install-modal").classList.add("show");
}

export function closeIOSInstallModal(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById("ios-install-modal").classList.remove("show");
}

// Success/info messages
function showAlreadyInstalledMessage() {
  alert("✅ Pookie's app is already installed on your device!");
}

function showInstallSuccessMessage() {
  alert("🎉 Great! Pookie's app has been installed successfully!");
}

function showManualInstallInstructions() {
  const instructions = isIOSDevice() 
    ? "Tap the Share button (⬆️) at the bottom of Safari, then 'Add to Home Screen'"
    : "Look for the install prompt in your browser's address bar, or check your browser menu for 'Install' or 'Add to Home Screen' options.";
  
  alert(`📱 To install Pookie's app:\n\n${instructions}`);
}

// Update install button based on device/state
function updateInstallButton() {
  const installBtn = document.getElementById("pwa-install-menu");
  if (!installBtn) return;
  
  if (isRunningStandalone()) {
    installBtn.style.display = 'none';
    return;
  }
  
  if (isIOSDevice()) {
    installBtn.innerHTML = '📱 Install on iPhone';
    installBtn.classList.add('ios-install-btn');
  } else if (deferredPrompt) {
    installBtn.innerHTML = '📱 Install App';
    installBtn.classList.remove('ios-install-btn');
  } else {
    installBtn.innerHTML = '📱 Install Instructions';
    installBtn.classList.remove('ios-install-btn');
  }
}

// PWA update functionality
export function updatePWA() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ command: 'SKIP_WAITING' });
    window.location.reload();
  }
}

export function hidePWAUpdateBanner() {
  document.getElementById('pwa-update-banner').classList.remove('show');
}

function showPWAUpdateBanner() {
  document.getElementById('pwa-update-banner').classList.add('show');
}

// Service Worker registration and management
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      console.log('ServiceWorker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              showPWAUpdateBanner();
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.log('ServiceWorker registration failed:', error);
      return null;
    }
  }
}

// Update PWA status indicator
export function updatePWAStatusIndicator() {
  const statusEl = document.getElementById('pwa-status');
  if (!statusEl) return;
  
  if (isRunningStandalone()) {
    statusEl.textContent = '📱 App Mode';
  } else if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    statusEl.textContent = '🔄 PWA Ready';
  } else {
    statusEl.textContent = '🌐 Web Mode';
  }
}

// Setup PWA event listeners
export function setupPWAEventListeners() {
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    
    // Store the event for later use
    deferredPrompt = e;
    
    // Update install button
    updateInstallButton();
    
    console.log('PWA install prompt available');
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', (e) => {
    console.log('PWA was installed successfully');
    deferredPrompt = null;
    updateInstallButton();
    updatePWAStatusIndicator();
    showInstallSuccessMessage();
  });

  // Listen for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'RELOAD_FOR_UPDATE') {
        window.location.reload();
      }
    });
  }

  // Make functions available globally
  window.handlePWAInstall = handlePWAInstall;
  window.closeIOSInstallModal = closeIOSInstallModal;
  window.updatePWA = updatePWA;
  window.hidePWAUpdateBanner = hidePWAUpdateBanner;
}

// Initialize PWA functionality
export async function initializePWA() {
  await registerServiceWorker();
  updatePWAStatusIndicator();
  updateInstallButton();
  setupPWAEventListeners();
  
  // Update status periodically
  setInterval(updatePWAStatusIndicator, 30000); // Every 30 seconds
}