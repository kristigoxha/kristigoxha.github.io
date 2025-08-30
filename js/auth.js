// js/auth.js
// Authentication functionality with AuthSessionMissingError fix and fast loading

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

// 🔧 NEW: Clear corrupted auth session
async function clearAuthSession() {
  try {
    // Sign out to clear any corrupted session
    await supabase.auth.signOut();
    
    // Clear any stored auth data
    updateCurrentUser(null);
    
    // Clear localStorage auth data that might be corrupted
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session')
    );
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log('🧹 Cleared:', key);
      } catch (e) {
        console.warn('Could not clear:', key);
      }
    });
    
    console.log('✅ Auth session cleared');
  } catch (error) {
    console.warn('Error clearing auth session:', error);
  }
}

// 🔧 FIXED: Robust authentication check with proper error handling
export async function checkAuth() {
  console.log('🔐 Checking authentication status...');
  
  try {
    // Add timeout to prevent hanging
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth check timeout')), 5000); // 5 second timeout
    });
    
    const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]);
    
    // Handle the AuthSessionMissingError specifically
    if (error) {
      console.warn('Auth check error:', error.message);
      
      // If it's a session error, clear any stored auth data and show login
      if (error.message.includes('Auth session missing') || 
          error.message.includes('session') || 
          error.message.includes('timeout')) {
        console.log('🧹 Clearing corrupted auth session...');
        await clearAuthSession();
        hideLoadingState();
        showLoginForm();
        return;
      }
      
      // For other errors, also show login
      console.error('Other auth error:', error);
      hideLoadingState();
      showLoginForm();
      return;
    }
    
    if (user) {
      console.log('✅ User authenticated:', user.email);
      updateCurrentUser(user);
      hideLoadingState();
      
      // Import and show app
      const { showApp } = await import('./ui.js');
      await showApp();
    } else {
      console.log('❌ No user found, showing login');
      hideLoadingState();
      showLoginForm();
    }
    
  } catch (error) {
    console.error('Unexpected auth error:', error);
    
    // Always clear session on errors to prevent future issues
    await clearAuthSession();
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

// 🔧 IMPROVED: Registration with session cleanup
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
    
    // Clear any existing session first
    await clearAuthSession();
    
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

// 🔧 IMPROVED: Login with better error handling
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
    
    console.log('🔐 Attempting login with session cleanup...');
    
    // Clear any existing corrupted session first
    await clearAuthSession();
    
    // Add timeout to login attempt
    const loginPromise = supabase.auth.signInWithPassword({ email, password });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login timeout - server may be slow')), 15000);
    });
    
    const { data, error } = await Promise.race([loginPromise, timeoutPromise]);
    
    if (error) {
      // Handle specific auth errors
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password');
      } else if (error.message.includes('timeout')) {
        throw new Error('Login timed out - please check your connection and try again');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Login successful');
    updateCurrentUser(data.user);
    
    // Show success message briefly
    showMessage('login-message', 'Welcome back! Loading app...', 'success');
    
    // Show loading and transition to app
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

// 🔧 IMPROVED: Better logout
export async function logout() {
  console.log('🚪 Logging out...');
  
  // Show loading state during logout
  showLoadingState();
  
  try {
    // Clear session properly
    await clearAuthSession();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always reload to ensure clean state
    setTimeout(() => {
      location.reload();
    }, 500);
  }
}

// 🔧 IMPROVED: Password reset with timeout
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
    
    // Add timeout to reset request
    const resetPromise = supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - please try again')), 10000);
    });
    
    const { error } = await Promise.race([resetPromise, timeoutPromise]);
    
    if (error) throw error;
    
    showMessage('reset-message', 'Reset link sent! Check your inbox.', 'success');
    document.getElementById('reset-email').value = '';
    
  } catch (error) {
    console.error('Reset password error:', error);
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

// 🔧 NEW: Debug function to check auth state
window.debugAuth = function() {
  console.log('🔍 AUTH DEBUG:');
  console.log('Current user:', getCurrentUser());
  console.log('Supabase client:', supabase);
  
  // Check localStorage for auth data
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('auth')
  );
  console.log('Auth localStorage keys:', authKeys);
  
  // Test connectivity
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Session check:', { data: data.session ? 'Has session' : 'No session', error });
  });
};

console.log('✅ Auth.js loaded with AuthSessionMissingError fixes!');