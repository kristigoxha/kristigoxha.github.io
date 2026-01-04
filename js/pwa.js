// js/pwa.js
// Progressive Web App functionality - PERFORMANCE OPTIMIZED

let swRegistration = null;
let deferredPrompt = null;
let refreshing = false;

/* ---------------- Device & Browser Detection ---------------- */

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isRunningStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

/* ---------------- Installation Handlers ---------------- */

export function handlePWAInstall() {
  if (isIOSDevice()) {
    showIOSInstallModal();
    return;
  }

  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log('PWA install choice:', choiceResult.outcome);
      if (choiceResult.outcome === 'accepted') {
        showInstallSuccessMessage();
      }
      deferredPrompt = null;
      updateInstallButton();
    });
  } else {
    showManualInstallInstructions();
  }
}

export function closeIOSInstallModal() {
  const modal = document.getElementById('ios-install-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function showIOSInstallModal() {
  const modal = document.getElementById('ios-install-modal');
  if (modal) {
    modal.classList.add('show');
  }
}

function showInstallSuccessMessage() {
  alert("🎉 Great! Pookie's app has been installed successfully!");
}

function showManualInstallInstructions() {
  const instructions = isIOSDevice()
    ? "Tap the Share button (⬆️) at the bottom of Safari, then 'Add to Home Screen'."
    : "Look for the install prompt in your browser's address bar, or check your browser menu for 'Install' or 'Add to Home Screen'.";
  alert(`📱 To install Pookie's app:\n\n${instructions}`);
}

function updateInstallButton() {
  const installBtn = document.getElementById('pwa-install-menu');
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

/* ---------------- Update banner controls ---------------- */

export function hidePWAUpdateBanner() {
  document.getElementById('pwa-update-banner')?.classList.remove('show');
}

function showPWAUpdateBanner() {
  document.getElementById('pwa-update-banner')?.classList.add('show');
  // Wire buttons if present
  document.getElementById('pwa-update-btn')?.addEventListener('click', () => updatePWA());
  document.getElementById('pwa-update-dismiss')?.addEventListener('click', () => hidePWAUpdateBanner());
}

/* ---------------- Service Worker registration & updates ---------------- */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register('/js/sw.js', { scope: '/' });
    swRegistration = reg;
    console.log('ServiceWorker registered:', reg);

    // If a new worker is already waiting (common after a deploy), show the banner.
    if (reg.waiting) showPWAUpdateBanner();

    // Watch for installing → installed (new version available)
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showPWAUpdateBanner();
        }
      });
    });

    // When the new SW takes control, reload once
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    return reg;
  } catch (error) {
    console.log('ServiceWorker registration failed:', error);
    return null;
  }
}

/** Trigger the waiting SW to activate immediately */
export function updatePWA() {
  // Prefer messaging the waiting worker (the one that can skip waiting)
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return;
  }
  // Fallback: ask the active controller (no-op if it ignores it)
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

/* ---------------- Status indicator ---------------- */

export function updatePWAStatusIndicator() {
  const el = document.getElementById('pwa-status');
  if (!el) return;

  if (isRunningStandalone()) {
    el.textContent = '📱 App Mode';
  } else if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    el.textContent = '🔄 PWA Ready';
  } else {
    el.textContent = '🌐 Web Mode';
  }
}

/* ---------------- Event wiring ---------------- */

export function setupPWAEventListeners() {
  // Install prompt capture
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    updateInstallButton();
    console.log('PWA install prompt available');
  });

  // Installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    deferredPrompt = null;
    updateInstallButton();
    updatePWAStatusIndicator();
    showInstallSuccessMessage();
  });

  // Optional: still honor your old message for backwards compat
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'RELOAD_FOR_UPDATE') {
        window.location.reload();
      }
    });
  }

  // Expose helpers globally (your original behavior)
  window.handlePWAInstall = handlePWAInstall;
  window.closeIOSInstallModal = closeIOSInstallModal;
  window.updatePWA = updatePWA;
  window.hidePWAUpdateBanner = hidePWAUpdateBanner;
}

/* ---------------- OPTIMIZED Smart Service Worker Updates ---------------- */

function setupSmartServiceWorkerUpdates() {
  // Prevent duplicate event listeners
  if (window.smartSWUpdatesSetup) return;
  window.smartSWUpdatesSetup = true;
  
  let lastUpdateCheck = Date.now();
  
  // Check for service worker updates only when user returns to tab
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && swRegistration) {
      const now = Date.now();
      // Only check once per hour
      if (now - lastUpdateCheck > 60 * 60 * 1000) {
        console.log('🔄 Checking for service worker updates...');
        swRegistration.update().catch(console.warn);
        lastUpdateCheck = now;
      }
    }
  }, { passive: true });
  
  console.log('✅ Smart service worker updates enabled (one-time setup)');
}

/* ---------------- Init (optimized) ---------------- */

export async function initializePWA() {
  await registerServiceWorker();
  updatePWAStatusIndicator();
  updateInstallButton();
  setupPWAEventListeners();
  
  // Setup smart updates (no continuous intervals!)
  setupSmartServiceWorkerUpdates();
}
