// js/ui.js
// UI interactions, modals, and menu management

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
  document.getElementById('password-modal').style.display = 'flex';
}

export function closePasswordModal() {
  document.getElementById('password-modal').style.display = 'none';
  document.getElementById('password-change-message').textContent = '';
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
  const emoji = document.getElementById("emoji");
  const boing = document.getElementById("boing");
  const counterSpan = document.getElementById("todayCount");

  // Load today's count from database
  let todayCount = await getTodaysBoings();
  
  function updateCounter() {
    counterSpan.textContent = todayCount;
  }

  emoji.addEventListener("pointerdown", async () => {
    boing.currentTime = 0;
    boing.play().catch(e => console.log('Audio play failed:', e));
    
    // Record boing in database
    const success = await recordBoing();
    if (success) {
      todayCount++;
      updateCounter();
    }
  });

  // Initial counter update
  updateCounter();

  // File input handler (if exists)
  const input = document.getElementById("imageInput");
  if (input) {
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      document.getElementById('file-name').textContent = `🎉 File ready: ${file.name}`;
      
      try {
        const { uploadFile } = await import('./database.js');
        await uploadFile(file);
        document.getElementById('file-name').textContent = `✅ ${file.name} uploaded successfully!`;
      } catch (error) {
        document.getElementById('file-name').textContent = `❌ Upload failed: ${error.message}`;
      }
    });
  }
}

// SHOW APP WITH MODAL
export async function showApp() {
  const today = new Date().toLocaleDateString('en-CA');
  const lastLogin = await getLastLoginDate();

  if (lastLogin !== today) {
    const yCount = await getYesterdaysBoings();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');

    const modal = document.getElementById('boing-modal');
    const modalContent = document.getElementById('boing-modal-content');
    const message = document.getElementById('boing-message');

    message.textContent = `Yesterday (${yesterday}) you boinged ${yCount} time${yCount === 1 ? '' : 's'}.`;

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modalContent.style.transform = 'scale(1)';
      modalContent.style.opacity = '1';
    });

    document.getElementById('boing-ok').onclick = () => {
      modalContent.style.transform = 'scale(0.9)';
      modalContent.style.opacity = '0';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    };

    await updateLastLoginDate();
  }

  document.getElementById('login-section').style.display = 'none';
  document.getElementById('app-section').style.display = 'flex';
  await setupApp();
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
    alert('Error loading boing history');
  }
}

// PWA STATUS UPDATE
export function updatePWAStatus() {
  const statusEl = document.getElementById('pwa-status');
  if (!statusEl) return;
  
  if ('serviceWorker' in navigator) {
    if (navigator.serviceWorker.controller) {
      statusEl.textContent = '📱 App Mode';
    } else {
      statusEl.textContent = '🌐 Web Mode';
    }
  }
}

// SETUP ALL UI EVENT LISTENERS
export function setupUIEventListeners() {
  setupMenuHandlers();
  updatePWAStatus();
  
  // Make functions available globally for onclick handlers
  window.showPasswordModal = showPasswordModal;
  window.closePasswordModal = closePasswordModal;
  window.toggleMenu = toggleMenu;
  window.closeMenu = closeMenu;
  window.openImageModal = openImageModal;
  window.closeImageModal = closeImageModal;
  window.viewBoingHistory = viewBoingHistory;
}