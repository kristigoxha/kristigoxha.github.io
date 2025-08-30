// js/ui.js - OPTIMIZED VERSION
// UI interactions with performance improvements for fast loading

import { getTodaysBoings, getYesterdaysBoings, recordBoing, getLastLoginDate, updateLastLoginDate } from './database.js';
import { APP_CONFIG } from './config.js';

// ✨ NEW: Fast showApp - show UI immediately, load data later
export async function showApp() {
  console.log('🚀 Showing app with fast loading...');
  
  try {
    // 1. IMMEDIATELY show the app UI (no waiting!)
    const loginSection = document.getElementById('login-section');
    const appSection = document.getElementById('app-section');
    
    if (loginSection) loginSection.style.display = 'none';
    if (appSection) {
      appSection.style.display = 'flex';
      appSection.classList.remove('hidden');
    }
    
    // 2. QUICK setup of essential functionality only
    await setupAppEssentials();
    
    console.log('✅ App shown instantly!');
    
    // 3. BACKGROUND loading of non-essential features (don't await!)
    loadBackgroundFeatures().catch(error => {
      console.warn('Background features failed to load:', error);
    });
    
  } catch (error) {
    console.error('Error showing app:', error);
    // Fallback: basic app display
    const appSection = document.getElementById('app-section');
    if (appSection) appSection.style.display = 'flex';
  }
}

// ✨ NEW: Essential setup only - loads instantly
async function setupAppEssentials() {
  console.log('⚡ Setting up essential app features...');
  
  const emoji = document.getElementById("emoji");
  const boing = document.getElementById("boing");
  const counterSpan = document.getElementById("todayCount");

  if (!emoji || !boing || !counterSpan) {
    console.error('Required app elements not found');
    return;
  }

  // Start with 0, load real count in background
  let todayCount = 0;
  counterSpan.textContent = todayCount;

  // Essential emoji click handler (works immediately)
  emoji.addEventListener("pointerdown", async () => {
    // Visual feedback (instant)
    emoji.style.transform = 'scale(0.95)';
    
    try {
      // Play audio
      boing.currentTime = 0;
      await boing.play();
    } catch (error) {
      console.warn('Audio play failed:', error);
    }

    // Update counter and save to database
    todayCount++;
    counterSpan.textContent = todayCount;
    
    // Save to database (don't wait for this)
    recordBoing().catch(error => {
      console.error('Failed to record boing:', error);
      // Rollback counter on failure
      todayCount--;
      counterSpan.textContent = todayCount;
    });
  });

  emoji.addEventListener("pointerup", () => {
    emoji.style.transform = '';
  });

  console.log('✅ Essential features ready!');
}

// ✨ NEW: Background loading of non-essential features
async function loadBackgroundFeatures() {
  console.log('🔄 Loading background features...');
  
  try {
    // Load today's count from database
    const actualCount = await getTodaysBoings();
    const counterSpan = document.getElementById("todayCount");
    if (counterSpan) {
      counterSpan.textContent = actualCount;
    }
    console.log('✅ Today\'s count loaded');
    
    // Check for yesterday's modal (non-blocking)
    setTimeout(async () => {
      try {
        const today = new Date().toLocaleDateString('en-CA');
        const lastLogin = await getLastLoginDate();
        
        if (lastLogin !== today) {
          await showYesterdayBoingModal();
          await updateLastLoginDate();
        }
      } catch (error) {
        console.warn('Yesterday modal check failed:', error);
      }
    }, 2000); // Show modal after 2 seconds
    
    console.log('✅ All background features loaded');
    
  } catch (error) {
    console.error('Background loading failed:', error);
  }
}

// ✨ IMPROVED: Faster yesterday modal (only if needed)
async function showYesterdayBoingModal() {
  try {
    const yCount = await getYesterdaysBoings();
    
    // Don't show modal if no boings yesterday
    if (yCount === 0) {
      console.log('No boings yesterday, skipping modal');
      return;
    }
    
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    const modal = document.getElementById('boing-modal');
    const modalContent = document.getElementById('boing-modal-content');
    const message = document.getElementById('boing-message');

    if (!modal || !modalContent || !message) {
      console.warn('Boing modal elements not found');
      return;
    }

    message.textContent = `Yesterday (${yesterday}) you boinged ${yCount} time${yCount === 1 ? '' : 's'}.`;

    // Quick show animation
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    
    requestAnimationFrame(() => {
      modal.style.transition = 'opacity 0.3s ease';
      modal.style.opacity = '1';
      modalContent.style.transform = 'scale(1)';
    });

    // Setup OK button
    const okButton = document.getElementById('boing-ok');
    if (okButton) {
      okButton.onclick = () => {
        modal.style.opacity = '0';
        setTimeout(() => {
          modal.style.display = 'none';
        }, 300);
      };
    }
  } catch (error) {
    console.error('Error showing yesterday boing modal:', error);
  }
}

// MENU FUNCTIONALITY (unchanged for reliability)
export function setupMenuHandlers() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    toggle.addEventListener("touchend", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    document.addEventListener("click", function (e) {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeMenu();
      }
    });
  }
}

export function toggleMenu() {
  const menu = document.getElementById("menu");
  if (menu.classList.contains("open")) {
    closeMenu();
  } else {
    openMenu();
  }
}

export function openMenu() {
  const menu = document.getElementById("menu");
  menu.classList.add("open");
  menu.offsetHeight; // Force reflow
}

export function closeMenu() {
  const menu = document.getElementById("menu");
  menu.classList.remove("open");
}

// MODAL FUNCTIONS (unchanged)
export function showPasswordModal() {
  closeMenu();
  document.getElementById('password-modal').style.display = 'flex';
  
  setTimeout(() => {
    const firstInput = document.getElementById('current-password');
    if (firstInput) firstInput.focus();
  }, 100);
}

export function closePasswordModal() {
  document.getElementById('password-modal').style.display = 'none';
  document.getElementById('password-change-message').textContent = '';
  
  const currentPass = document.getElementById('current-password');
  const newPass = document.getElementById('new-password');
  if (currentPass) currentPass.value = '';
  if (newPass) newPass.value = '';
}

export function openImageModal(imageUrl) {
  document.getElementById('modal-image').src = imageUrl;
  document.getElementById('image-modal').classList.add('show');
}

export function closeImageModal() {
  document.getElementById('image-modal').classList.remove('show');
}

// BOING HISTORY (unchanged)
export async function viewBoingHistory() {
  try {
    const { getBoingHistory } = await import('./database.js');
    const history = await getBoingHistory();
    
    if (history.length === 0) {
      alert('No boing history found');
      return;
    }
    
    const historyText = history
      .map(([date, count]) => `${date}: ${count} boing${count === 1 ? '' : 's'}`)
      .join('\n');
    
    alert('Boing History:\n\n' + historyText);
  } catch (error) {
    console.error('Error fetching boing history:', error);
    alert('Error loading boing history. Please try again.');
  }
}

// PWA STATUS FUNCTIONS (unchanged)
export function updatePWAStatus() {
  const installPrompt = document.getElementById('pwa-install-prompt');
  if (installPrompt) {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      installPrompt.style.display = 'none';
    } else {
      installPrompt.style.display = 'block';
    }
  }
}

export function updatePWAStatusIndicator() {
  const indicator = document.getElementById('pwa-status');
  if (!indicator) return;
  
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                     window.navigator.standalone === true;
  
  if (isInstalled) {
    indicator.textContent = '📱 Installed';
    indicator.style.color = '#4CAF50';
  } else {
    indicator.textContent = '🌐 Browser';
    indicator.style.color = '#FF9800';
  }
}

// PHOTO PREVIEW FUNCTIONS (unchanged)
export async function showPhotoPreview(filename) {
  try {
    const { getSignedPhotoUrl } = await import('./photos.js');
    const url = await getSignedPhotoUrl(filename);
    
    const popup = document.getElementById('photo-preview-popup');
    const content = document.getElementById('photo-preview-content');
    
    if (popup && content) {
      content.innerHTML = `
        <img src="${url}" alt="Shared photo" style="max-width: 100%; height: auto; border-radius: 8px;">
        <div style="margin-top: 10px; font-size: 14px; color: #666;">
          Filename: ${filename}
        </div>
      `;
      popup.classList.add('show');
    }
  } catch (error) {
    console.error('Error showing photo preview:', error);
    alert('Unable to show photo preview. Please try again.');
  }
}

export function closePhotoPreview() {
  const popup = document.getElementById('photo-preview-popup');
  if (popup) {
    popup.classList.remove('show');
  }
}

// SETUP ALL UI EVENT LISTENERS
export function setupUIEventListeners() {
  console.log('🔗 Setting up UI event listeners...');
  
  setupMenuHandlers();
  updatePWAStatus();
  updatePWAStatusIndicator();
  
  // 🔧 SMART UPDATE: Only update when user interacts or returns to tab
  setupSmartPWAUpdates();
  
  // Make functions available globally
  window.showPasswordModal = showPasswordModal;
  window.closePasswordModal = closePasswordModal;
  window.toggleMenu = toggleMenu;
  window.closeMenu = closeMenu;
  window.openImageModal = openImageModal;
  window.closeImageModal = closeImageModal;
  window.viewBoingHistory = viewBoingHistory;
  window.updatePWAStatusIndicator = updatePWAStatusIndicator;
  window.showPhotoPreview = showPhotoPreview;
  window.closePhotoPreview = closePhotoPreview;
  
  console.log('✅ UI event listeners setup complete');
}

function setupSmartPWAUpdates() {
  let lastUpdate = Date.now();
  
  // Update only when user returns to tab (if it's been a while)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const now = Date.now();
      if (now - lastUpdate > 30000) { // Only if more than 30 seconds passed
        updatePWAStatusIndicator();
        lastUpdate = now;
        console.log('🔄 PWA status updated after tab return');
      }
    }
  });
  
  // Update on focus (when user clicks back to tab)
  window.addEventListener('focus', () => {
    const now = Date.now();
    if (now - lastUpdate > 10000) { // Only if more than 10 seconds passed
      updatePWAStatusIndicator();
      lastUpdate = now;
      console.log('🔄 PWA status updated on focus');
    }
  });
  
  // Update on user interaction (clicks, etc.)
  document.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastUpdate > 60000) { // Only if more than 1 minute passed
      updatePWAStatusIndicator();
      lastUpdate = now;
    }
  });
  
  console.log('✅ Smart PWA updates enabled');
}
