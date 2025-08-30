// js/auth.js
// Authentication functionality with simple, warm styling

import { supabase, updateCurrentUser } from './config.js';

// Show loading state
function showLoadingState() {
  // Hide both sections initially
  const loginSection = document.getElementById('login-section');
  const appSection = document.getElementById('app-section');
  
  if (loginSection) loginSection.style.display = 'none';
  if (appSection) appSection.style.display = 'none';
  
  // Show loading indicator
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-screen';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #a18cd1 0%, #c4a4d8 50%, #e6d3f2 100%);
    color: white;
    z-index: 9999;
  `;
  
  loadingDiv.innerHTML = `
    <div style="font-size: 4rem; margin-bottom: 1rem; animation: pulse 1.5s infinite;">🎎</div>
    <div style="font-size: 1rem; color: #8b7ca3;">loading...</div>
  `;
  
  // Add pulse animation if not already present
  if (!document.getElementById('pulse-animation')) {
    const style = document.createElement('style');
    style.id = 'pulse-animation';
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(loadingDiv);
}

// Hide loading state
function hideLoadingState() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.remove();
  }
}

// Enhanced message display function
function showMessage(elementId, text, type = 'info') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.textContent = text;
  element.className = `message ${type}`;
  element.style.display = 'block';
  
  // Auto-hide success messages
  if (type === 'success') {
    setTimeout(() => {
      element.style.display = 'none';
    }, 4000);
  }
}

// Enhanced button loading states
function setButtonLoading(button, isLoading, loadingText = '') {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    button.setAttribute('data-original-text', button.textContent);
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
      button.textContent = originalText;
    }
  }
}

// Check authentication status on page load with loading state
export async function checkAuth() {
  console.log('🔐 Checking authentication status...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Auth check error:', error);
      hideLoadingState();
      showLoginForm();
      return;
    }
    
    if (user) {
      console.log('✅ User authenticated:', user.email);
      updateCurrentUser(user);
      hideLoadingState();
      const { showApp } = await import('./ui.js');
      await showApp();
    } else {
      console.log('❌ No user found, showing login');
      hideLoadingState();
      showLoginForm();
    }
  } catch (error) {
    console.error('Unexpected auth error:', error);
    hideLoadingState();
    showLoginForm();
  }
}

// Show login form
function showLoginForm() {
  console.log('🔑 Showing login form');
  const loginSection = document.getElementById('login-section');
  const appSection = document.getElementById('app-section');
  
  if (loginSection) loginSection.style.display = 'flex';
  if (appSection) appSection.style.display = 'none';
}

// User registration with enhanced loading states
export async function register() {
  const registerBtn = document.querySelector('button[onclick="register()"]');
  const messageEl = document.getElementById('login-message');
  
  // Clear previous messages
  messageEl.style.display = 'none';
  
  try {
    setButtonLoading(registerBtn, true, 'Creating account...');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      console.error('Registration error:', error);
      showMessage('login-message', error.message, 'error');
      return;
    }
    
    const message = data.user && !data.session 
      ? 'Account created! Please check your email to verify.'
      : 'Registration successful! You can now sign in.';
    
    showMessage('login-message', message, 'success');
    
    // Clear form on success
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    
  } catch (error) {
    showMessage('login-message', error.message, 'error');
  } finally {
    setButtonLoading(registerBtn, false);
  }
}

// User login with enhanced loading states
export async function login() {
  const loginBtn = document.querySelector('button[onclick="login()"]');
  const messageEl = document.getElementById('login-message');
  
  // Clear previous messages
  messageEl.style.display = 'none';
  
  try {
    setButtonLoading(loginBtn, true, 'Signing in...');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    console.log('✅ Login successful');
    updateCurrentUser(data.user);
    
    // Show success message briefly
    showMessage('login-message', 'Welcome back! Loading your app...', 'success');
    
    // Show loading before transitioning
    setTimeout(async () => {
      showLoadingState();
      const { showApp } = await import('./ui.js');
      await showApp();
    }, 800);
    
  } catch (error) {
    console.error('Login error:', error);
    showMessage('login-message', error.message, 'error');
  } finally {
    setButtonLoading(loginBtn, false);
  }
}

// User logout
export async function logout() {
  console.log('🚪 Logging out...');
  
  // Show loading state during logout
  showLoadingState();
  
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear user state and reload, even if logout fails
    updateCurrentUser(null);
    // Small delay to show loading animation
    setTimeout(() => {
      location.reload();
    }, 500);
  }
}

// Password reset with enhanced loading states
export async function resetPassword() {
  const email = document.getElementById('reset-email').value;
  const msgEl = document.getElementById('reset-message');
  const resetBtn = document.querySelector('button[onclick="resetPassword()"]');
  
  // Clear previous messages
  msgEl.style.display = 'none';
  
  if (!email || !email.includes('@')) {
    showMessage('reset-message', 'Please enter a valid email address.', 'error');
    return;
  }
  
  try {
    setButtonLoading(resetBtn, true, 'Sending reset link...');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    
    if (error) throw error;
    
    showMessage('reset-message', 'Reset link sent! Check your inbox.', 'success');
    document.getElementById('reset-email').value = '';
    
  } catch (error) {
    showMessage('reset-message', error.message, 'error');
  } finally {
    setButtonLoading(resetBtn, false);
  }
}

// Change password with enhanced loading states
export async function changePassword() {
  const { getCurrentUser } = await import('./config.js');
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    alert("Not logged in");
    return;
  }
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const changeBtn = document.querySelector('#password-modal button[onclick="changePassword()"]');
  const originalText = changeBtn.textContent;
  const msgEl = document.getElementById('password-change-message');
  
  // Clear previous messages
  msgEl.textContent = '';
  
  if (!currentPassword || !newPassword) {
    msgEl.textContent = 'Please fill in all fields';
    msgEl.style.color = 'red';
    return;
  }
  
  if (newPassword.length < 6) {
    msgEl.textContent = 'New password must be at least 6 characters';
    msgEl.style.color = 'red';
    return;
  }
  
  try {
    changeBtn.disabled = true;
    changeBtn.textContent = 'Changing...';
    
    // First verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword
    });
    
    if (verifyError) {
      throw new Error('Current password is incorrect');
    }
    
    // Now update to new password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    
    msgEl.textContent = 'Password changed successfully!';
    msgEl.style.color = 'green';
    
    // Clear form
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    
    const { closePasswordModal } = await import('./ui.js');
    setTimeout(closePasswordModal, 1500);
    
  } catch (error) {
    msgEl.textContent = error.message;
    msgEl.style.color = 'red';
  } finally {
    changeBtn.disabled = false;
    changeBtn.textContent = originalText;
  }
}

// Handle authentication state changes
export function setupAuthStateHandler() {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state change:', event);
    
    if (event === 'SIGNED_IN' && session) {
      updateCurrentUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      updateCurrentUser(null);
    }
  });
}