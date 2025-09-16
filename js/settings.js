// js/settings.js
// Settings modal and user preferences management with error handling

import { getCurrentUser, updateCurrentUser } from './config.js';
import { getUserProfile, updateUserProfile } from './database.js';

// SETTINGS MODAL FUNCTIONS
export async function showSettingsModal() {
  console.log('Opening settings modal...');
  const modal = document.getElementById('settings-modal');
  if (!modal) {
    console.error('Settings modal not found');
    return;
  }
  
  modal.style.display = 'flex';
  modal.classList.add('show');
  
  // Load current settings
  await loadCurrentSettings();
}

export function closeSettingsModal(event) {
  // Only close if clicking on the backdrop or close button
  if (event && event.target !== event.currentTarget && !event.target.matches('.settings-btn-secondary')) {
    return;
  }
  
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
    clearSettingsForm();
  }
}

async function loadCurrentSettings() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log('No current user found');
    return;
  }
  
  try {
    const profile = await getUserProfile();
    
    const currentUsername = profile?.username || currentUser.email.split('@')[0];
    const autoreceiverEmail = profile?.autoreceiver_email;
    
    // Update display with null checks
    const usernameElement = document.getElementById('current-username-text');
    if (usernameElement) {
      usernameElement.textContent = currentUsername;
    }
    
    const newUsernameInput = document.getElementById('new-username');
    if (newUsernameInput) {
      newUsernameInput.value = '';
    }
    
    const autoreceiverInput = document.getElementById('autoreceiver-email');
    if (autoreceiverInput) {
      autoreceiverInput.value = '';
    }
    
    // Show current autoreceiver if exists
    const currentAutoreceiverDiv = document.getElementById('current-autoreceiver');
    const tagContainer = document.getElementById('autoreceiver-tag-container');
    
    if (autoreceiverEmail && currentAutoreceiverDiv && tagContainer) {
      currentAutoreceiverDiv.style.display = 'block';
      tagContainer.innerHTML = `
        <div class="autoreceiver-tag">
          ${autoreceiverEmail}
          <span class="remove-autoreceiver" onclick="window.removeAutoreceiver()">×</span>
        </div>
      `;
    } else if (currentAutoreceiverDiv) {
      currentAutoreceiverDiv.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error loading current settings:', error);
    showSettingsMessage('Error loading settings', 'error');
  }
}

export async function saveSettings() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showSettingsMessage('❌ Not logged in', 'error');
    return;
  }
  
  const newUsernameInput = document.getElementById('new-username');
  const autoreceiverInput = document.getElementById('autoreceiver-email');
  
  if (!newUsernameInput || !autoreceiverInput) {
    console.error('Settings form inputs not found');
    showSettingsMessage('❌ Error: Form not found', 'error');
    return;
  }
  
  const newUsername = newUsernameInput.value.trim();
  const autoreceiverEmail = autoreceiverInput.value.trim();
  
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
      showSettingsMessage('ℹ️ No changes to save', 'info');
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
    const currentAutoreceiverDiv = document.getElementById('current-autoreceiver');
    if (currentAutoreceiverDiv) {
      currentAutoreceiverDiv.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error removing autoreceiver:', error);
    showSettingsMessage('❌ Error removing auto-receiver', 'error');
  }
}

function showSettingsMessage(message, type = 'info') {
  const messageEl = document.getElementById('settings-message');
  if (messageEl) {
    messageEl.textContent = message;
    
    // Set color based on type
    switch(type) {
      case 'error':
        messageEl.style.color = '#dc3545';
        break;
      case 'success':
        messageEl.style.color = '#28a745';
        break;
      case 'info':
        messageEl.style.color = '#17a2b8';
        break;
      default:
        messageEl.style.color = '#333';
    }
    
    // Clear message after 3 seconds if it's not an error
    if (type !== 'error') {
      setTimeout(() => {
        messageEl.textContent = '';
      }, 3000);
    }
  }
}

function clearSettingsForm() {
  const newUsernameInput = document.getElementById('new-username');
  if (newUsernameInput) {
    newUsernameInput.value = '';
  }
  
  const autoreceiverInput = document.getElementById('autoreceiver-email');
  if (autoreceiverInput) {
    autoreceiverInput.value = '';
  }
  
  const messageEl = document.getElementById('settings-message');
  if (messageEl) {
    messageEl.textContent = '';
  }
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
  
  console.log('Settings event listeners setup complete');
}