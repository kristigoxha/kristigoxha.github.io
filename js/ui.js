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
        fileNameEl.textContent = `🎉 File ready: ${file.name}`;
      }
      
      try {
        const { uploadFile } = await import('./database.js');
        await uploadFile(file);
        if (fileNameEl) {
          fileNameEl.textContent = `✅ ${file.name} uploaded successfully!`;
        }
      } catch (error) {
        console.error('Upload error:', error);
        if (fileNameEl) {
          fileNameEl.textContent = `❌ Upload failed: ${error.message}`;
        }
      }
    });
  }
  
  console.log('✅ App setup complete');
}

// SHOW APP WITH PROPER STATE MANAGEMENT
export async function showApp() {
  console.log('🎎 Showing main app...');
  
  try {
    // Ensure login section is hidden
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      loginSection.style.display = 'none';
    }
    
    // Show app section
    const appSection = document.getElementById('app-section');
    if (appSection) {
      appSection.style.display = 'flex';
      appSection.classList.remove('hidden');
    }
    
    // Check if we should show yesterday's boing modal
    const today = new Date().toLocaleDateString('en-CA');
    const lastLogin = await getLastLoginDate();

    if (lastLogin !== today) {
      await showYesterdayBoingModal();
      await updateLastLoginDate();
    }

    // Setup the app functionality
    await setupApp();
    
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
  } else {
    statusEl.textContent = '🌐 Browser Mode';
  }
}

// Check if app is running in standalone mode
function isStandalone() {
  return window.navigator.standalone === true || 
         window.matchMedia('(display-mode: standalone)').matches ||
         document.referrer.includes('android-app://');
}

// Update PWA status indicator
export function updatePWAStatusIndicator() {
  const statusEl = document.getElementById('pwa-status');
  if (!statusEl) return;
  
  if (isStandalone()) {
    statusEl.textContent = '📱 App Mode';
    statusEl.style.color = 'rgba(255, 255, 255, 0.9)';
  } else if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    statusEl.textContent = '🔄 PWA Ready';
    statusEl.style.color = 'rgba(255, 255, 255, 0.7)';
  } else {
    statusEl.textContent = '🌐 Web Mode';
    statusEl.style.color = 'rgba(255, 255, 255, 0.5)';
  }
}

// SHOW PHOTO PREVIEW FUNCTIONALITY
export async function showPhotoPreview() {
  try {
    const { getSharedImages } = await import('./database.js');
    const images = await getSharedImages();
    
    const popup = document.getElementById('photo-preview-popup');
    const content = document.getElementById('photo-preview-content');
    
    if (!popup || !content) {
      console.error('Photo preview elements not found');
      return;
    }
    
    if (images.length === 0) {
      content.innerHTML = '<div style="text-align: center; color: white; padding: 20px;">No shared photos yet! 📸</div>';
    } else {
      content.innerHTML = images.map(img => `
        <div class="photo-item">
          <img src="${img.url}" alt="${img.name}" onclick="openImageModal('${img.url}')" />
          <div class="photo-name">${img.name}</div>
        </div>
      `).join('');
    }
    
    popup.classList.add('show');
    
    // Close button functionality
    const closeBtn = popup.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.onclick = closePhotoPreview;
    }
    
  } catch (error) {
    console.error('Error loading photo preview:', error);
    alert('Error loading photos. Please try again.');
  }
}

// Close photo preview
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
  
  // Update PWA status periodically
  setInterval(updatePWAStatusIndicator, 30000);
  
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