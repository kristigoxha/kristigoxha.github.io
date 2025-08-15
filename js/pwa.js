// js/pwa.js
// PWA installation, update handling, and service worker management (merged)

let deferredPrompt = null;
let swRegistration = null;
let refreshing = false;

/* ---------------- Device & display helpers (yours) ---------------- */

export function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isAndroidDevice() {
  return /Android/.test(navigator.userAgent);
}

export function isRunningStandalone() {
  return window.navigator.standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches;
}

/* ---------------- Install UX (yours) ---------------- */

export function handlePWAInstall() {
  const { closeMenu } = window;
  if (closeMenu) closeMenu();

  if (isRunningStandalone()) {
    showAlreadyInstalledMessage();
    return;
  }

  if (isIOSDevice()) {
    showIOSInstallModal();
  } else {
    if (deferredPrompt) {
      installPWA();
    } else {
      showManualInstallInstructions();
    }
  }
}

export async function installPWA() {
  if (!deferredPrompt) {
    showManualInstallInstructions();
    return;
  }
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('PWA install accepted');
      showInstallSuccessMessage();
    } else {
      console.log('PWA install dismissed');
    }
  } catch (err) {
    console.error('PWA install error:', err);
    showManualInstallInstructions();
  } finally {
    deferredPrompt = null;
    updateInstallButton();
  }
}

export function showIOSInstallModal() {
  document.getElementById('ios-install-modal')?.classList.add('show');
}
export function closeIOSInstallModal(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById('ios-install-modal')?.classList.remove('show');
}

function showAlreadyInstalledMessage() {
  alert("✅ Pookie's app is already installed on your device!");
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

/* ---------------- Update banner controls (yours, wired) ---------------- */

export function hidePWAUpdateBanner() {
  document.getElementById('pwa-update-banner')?.classList.remove('show');
}

function showPWAUpdateBanner() {
  document.getElementById('pwa-update-banner')?.classList.add('show');
  // Wire buttons if present
  document.getElementById('pwa-update-btn')?.addEventListener('click', () => updatePWA());
  document.getElementById('pwa-update-dismiss')?.addEventListener('click', () => hidePWAUpdateBanner());
}

/* ---------------- Service Worker registration & updates (merged) ---------------- */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
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

    // Periodically check for updates
    setInterval(() => reg.update(), 60 * 60 * 1000); // hourly

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

/* ---------------- Status indicator (yours) ---------------- */

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

/* ---------------- Event wiring (merged) ---------------- */

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

/* ---------------- Init (yours, with small upgrades) ---------------- */

export async function initializePWA() {
  await registerServiceWorker();
  updatePWAStatusIndicator();
  updateInstallButton();
  setupPWAEventListeners();

  // Periodic status refresh
  setInterval(updatePWAStatusIndicator, 30_000);
}
