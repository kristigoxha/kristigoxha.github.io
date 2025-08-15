// js/settings.js
// Settings modal and user preferences management

import { getCurrentUser, updateCurrentUser } from './config.js';
import { getUserProfile, updateUserProfile } from './database.js';

// SETTINGS MODAL FUNCTIONS
export async function showSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  
  modal.classList.add('show');
  
  // Load current settings
  await loadCurrentSettings();
}

export function closeSettingsModal(event) {
  // Only close if clicking on the backdrop or close button
  if (event && event.target !== event.currentTarget && !event.target.matches('.settings-btn-secondary')) return;
  
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.remove('show');
    clearSettingsForm();
  }
}

async function loadCurrentSettings() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  try {
    const profile = await getUserProfile();
    
    const currentUsername = profile?.username || currentUser.email.split('@')[0];
    const autoreceiverEmail = profile?.autoreceiver_email;
    
    // Update display
    document.getElementById('current-username-text').textContent = currentUsername;
    document.getElementById('new-username').value = '';
    document.getElementById('autoreceiver-email').value = '';
    
    // Show current autoreceiver if exists
    if (autoreceiverEmail) {
      document.getElementById('current-autoreceiver').style.display = 'block';
      document.getElementById('autoreceiver-tag-container').innerHTML = `
        <div class="autoreceiver-tag">
          ${autoreceiverEmail}
          <span class="remove-autoreceiver" onclick="window.removeAutoreceiver()">×</span>
        </div>
      `;
    } else {
      document.getElementById('current-autoreceiver').style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error loading current settings:', error);
  }
}

export async function saveSettings() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showSettingsMessage('❌ Not logged in', 'error');
    return;
  }
  
  const newUsername = document.getElementById('new-username').value.trim();
  const autoreceiverEmail = document.getElementById('autoreceiver-email').value.trim();
  
  // Validate inputs
  if (newUsername && newUsername.length < 2) {
    showSettingsMessage('❌ Username must be at least 2 characters', 'error');
    return;
  }
  
  if (autoreceiverEmail && !validateEmail(autoreceiverEmail)) {
    showSettingsMessage('❌ Please enter a valid email address', 'error');
    return;
  }
  
  try {
    const updates = {};
    
    if (newUsername) {
      updates.username = newUsername;
    }
    
    if (autoreceiverEmail) {
      updates.autoreceiver_email = autoreceiverEmail;
    }
    
    if (Object.keys(updates).length === 0) {
      showSettingsMessage('❌ No changes to save', 'error');
      return;
    }
    
    const success = await updateUserProfile(updates);
    
    if (!success) {
      throw new Error('Failed to update profile');
    }
    
    showSettingsMessage('✅ Settings saved successfully!', 'success');
    
    // Reload current settings to show updates
    setTimeout(() => {
      loadCurrentSettings();
      clearSettingsForm();
    }, 1500);
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showSettingsMessage('❌ Error saving settings: ' + error.message, 'error');
  }
}

export async function removeAutoreceiver() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  try {
    const success = await updateUserProfile({ autoreceiver_email: null });
    
    if (!success) {
      throw new Error('Failed to remove autoreceiver');
    }
    
    showSettingsMessage('✅ Auto-receiver removed', 'success');
    
    // Hide autoreceiver display
    document.getElementById('current-autoreceiver').style.display = 'none';
    
  } catch (error) {
    console.error('Error removing autoreceiver:', error);
    showSettingsMessage('❌ Error removing auto-receiver', 'error');
  }
}

function showSettingsMessage(message, type) {
  const messageEl = document.getElementById('settings-message');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.style.color = type === 'error' ? '#dc3545' : '#28a745';
    
    // Clear message after 3 seconds if it's not an error
    if (type !== 'error') {
      setTimeout(() => {
        messageEl.textContent = '';
      }, 3000);
    }
  }
}

function clearSettingsForm() {
  document.getElementById('new-username').value = '';
  document.getElementById('autoreceiver-email').value = '';
  document.getElementById('settings-message').textContent = '';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// SETUP SETTINGS EVENT LISTENERS
export function setupSettingsEventListeners() {
  // Make functions available globally for onclick handlers
  window.showSettingsModal = showSettingsModal;
  window.closeSettingsModal = closeSettingsModal;
  window.saveSettings = saveSettings;
  window.removeAutoreceiver = removeAutoreceiver;
}