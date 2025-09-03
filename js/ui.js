// js/ui.js
// UI interactions, modals, and menu management - PERFORMANCE OPTIMIZED

import { getTodaysBoings, getYesterdaysBoings, recordBoing, getLastLoginDate, updateLastLoginDate } from './database.js';
import { APP_CONFIG } from './config.js';

// MENU FUNCTIONALITY
export function setupMenuHandlers() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("menu");

  if (toggle && menu) {
    // Multiple event listeners for better Safari compatibility
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Touch events for iOS Safari
    toggle.addEventListener("touchend", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (e) {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        closeMenu();
      }
    });

    // Close menu on escape key
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
  // Force reflow for Safari
  menu.offsetHeight;
}

export function closeMenu() {
  const menu = document.getElementById("menu");
  menu.classList.remove("open");
}

// MODAL FUNCTIONS
export function showPasswordModal() {
  // Close menu first
  closeMenu();
  document.getElementById('password-modal').style.display = 'flex';
  
  // Focus on first input
  setTimeout(() => {
    const firstInput = document.getElementById('current-password');
    if (firstInput) firstInput.focus();
  }, 100);
}

export function closePasswordModal() {
  document.getElementById('password-modal').style.display = 'none';
  document.getElementById('password-change-message').textContent = '';
  
  // Clear form
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

// APP SETUP AND MAIN FUNCTIONALITY
export async function setupApp() {
  console.log('🎮 Setting up app functionality...');
  
  const emoji = document.getElementById("emoji");
  const boing = document.getElementById("boing");
  const counterSpan = document.getElementById("todayCount");

  if (!emoji || !boing || !counterSpan) {
    console.error('Required app elements not found');
    return;
  }

  // Load today's count from database
  let todayCount = await getTodaysBoings();
  
  function updateCounter() {
    counterSpan.textContent = todayCount;
  }

  // Enhanced emoji interaction with better feedback
  emoji.addEventListener("pointerdown", async () => {
    // Visual feedback
    emoji.style.transform = 'scale(0.95)';
    
    // Play audio
    try {
      boing.currentTime = 0;
      await boing.play();
    } catch (e) {
      console.log('Audio play failed (browser policy):', e);
    }
    
    // Reset visual state
    setTimeout(() => {
      emoji.style.transform = '';
    }, 150);
    
    // Record boing in database
    try {
      const success = await recordBoing();
      if (success) {
        todayCount++;
        updateCounter();
        
        // Small celebration animation
        emoji.style.animation = 'spring 0.4s ease';
        setTimeout(() => {
          emoji.style.animation = '';
        }, 400);
      } else {
        console.warn('Failed to record boing');
      }
    } catch (error) {
      console.error('Error recording boing:', error);
    }
  });

  // Initial counter update
  updateCounter();

  // File input handler (if exists on main page)
  const input = document.getElementById("imageInput");
  if (input) {
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const fileNameEl = document.getElementById('file-name');
      if (fileNameEl) {
        fileNameEl.textContent = `File ready: ${file.name}`;
      }
      
      try {
        const { uploadFile } = await import('./database.js');
        await uploadFile(file);
        if (fileNameEl) {
          fileNameEl.textContent = `${file.name} uploaded successfully!`;
        }
      } catch (error) {
        console.error('Upload error:', error);
        if (fileNameEl) {
          fileNameEl.textContent = `Upload failed: ${error.message}`;
        }
      }
    });
  }
  
  console.log('✅ App setup complete');
}

// OPTIMIZED SHOW APP WITH FAST LOADING
export async function showApp() {
  console.log('🎎 Showing main app...');
  
  try {
    // 1. Show UI immediately - NO WAITING!
    const loginSection = document.getElementById('login-section');
    const appSection = document.getElementById('app-section');
    
    if (loginSection) loginSection.style.display = 'none';
    if (appSection) {
      appSection.style.display = 'flex';
      appSection.classList.remove('hidden');
    }

    // 2. Setup essential functionality immediately
    await setupApp();
    
    // 3. Do database checks in background (non-blocking)
    setTimeout(async () => {
      try {
        const today = new Date().toLocaleDateString('en-CA');
        const lastLogin = await getLastLoginDate();

        if (lastLogin !== today) {
          await showYesterdayBoingModal();
          await updateLastLoginDate();
        }
      } catch (error) {
        console.warn('Background database operations failed:', error);
      }
    }, 2000); // Show modal after 2 seconds, not immediately
    
    console.log('✅ App displayed successfully');
    
  } catch (error) {
    console.error('Error showing app:', error);
    // Fallback: just show the app section and setup
    const appSection = document.getElementById('app-section');
    if (appSection) {
      appSection.style.display = 'flex';
    }
    await setupApp();
  }
}

// Show yesterday's boing modal with better animations
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

    // Show modal with smooth animation
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    
    // Animate in
    requestAnimationFrame(() => {
      modal.style.transition = 'opacity 0.3s ease';
      modal.style.opacity = '1';
      modalContent.style.transform = 'scale(1)';
      modalContent.style.opacity = '1';
    });

    // Setup OK button
    const okButton = document.getElementById('boing-ok');
    if (okButton) {
      okButton.onclick = () => {
        modalContent.style.transform = 'scale(0.9)';
        modalContent.style.opacity = '0';
        modal.style.opacity = '0';
        setTimeout(() => {
          modal.style.display = 'none';
          modal.style.transition = '';
          modal.style.opacity = '';
        }, 300);
      };
    }
  } catch (error) {
    console.error('Error showing yesterday boing modal:', error);
  }
}

// BOING HISTORY
export async function viewBoingHistory() {
  try {
    const { getBoingHistory } = await import('./database.js');
    const history = await getBoingHistory();
    
    if (history.length === 0) {
      alert('No boing history found');
      return;
    }
    
    // Display history
    const historyText = history
      .map(([date, count]) => `${date}: ${count} boing${count === 1 ? '' : 's'}`)
      .join('\n');
    
    alert('Boing History:\n\n' + historyText);
  } catch (error) {
    console.error('Error fetching boing history:', error);
    alert('Error loading boing history. Please try again.');
  }
}

// PWA STATUS FUNCTIONS
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

// PHOTO PREVIEW FUNCTIONS
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

// OPTIMIZED SMART PWA UPDATES - NO CONTINUOUS OPERATIONS!
function setupSmartPWAUpdates() {
  // Prevent duplicate event listeners
  if (window.smartPWAUpdatesSetup) return;
  window.smartPWAUpdatesSetup = true;
  
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
  }, { passive: true });
  
  // Update on focus (when user clicks back to tab)
  window.addEventListener('focus', () => {
    const now = Date.now();
    if (now - lastUpdate > 10000) { // Only if more than 10 seconds passed
      updatePWAStatusIndicator();
      lastUpdate = now;
      console.log('🔄 PWA status updated on focus');
    }
  }, { passive: true });
  
  // Update on user interaction (clicks, etc.) - Less frequent
  document.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastUpdate > 120000) { // Only every 2 minutes
      updatePWAStatusIndicator();
      lastUpdate = now;
    }
  }, { passive: true });
  
  console.log('✅ Smart PWA updates enabled (one-time setup)');
}

// SETUP ALL UI EVENT LISTENERS
export function setupUIEventListeners() {
  console.log('🔗 Setting up UI event listeners...');
  
  setupMenuHandlers();
  updatePWAStatus();
  updatePWAStatusIndicator();
  
  // Setup smart updates (no continuous intervals!)
  setupSmartPWAUpdates();
  
  // Make functions available globally for onclick handlers
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
