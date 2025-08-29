// js/auth.js
// Authentication functionality with proper loading states

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
    background: linear-gradient(135deg, #a18cd1 0%, #a18cd1 100%);
    color: white;
    z-index: 9999;
  `;
  
  loadingDiv.innerHTML = `
    <div style="font-size: 4rem; margin-bottom: 1rem; animation: pulse 1.5s infinite;">💖</div>
    <div style="font-size: 1rem;">loading...</div>
  `;
  
  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(loadingDiv);
}

// Hide loading state
function hideLoadingState() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.remove();
  }
}

// Check authentication status on page load with loading state
export async function checkAuth() {
  console.log('🔐 Checking authentication status...');
  showLoadingState();
  
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
      const { showApp } = await import('./ui.js');
      hideLoadingState();
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
  const loginSection = document.getElementById('login-section');
  const appSection = document.getElementById('app-section');
  
  if (loginSection) loginSection.style.display = 'flex';
  if (appSection) appSection.style.display = 'none';
}

// User registration with loading states
export async function register() {
  const registerBtn = document.querySelector('button[onclick="register()"]');
  const originalText = registerBtn.textContent;
  
  try {
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering...';
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      console.error('Registration error:', error);
      document.getElementById('login-message').textContent = '❌ ' + error.message;
      return;
    }
    
    const message = data.user && !data.session 
      ? '✅ Check your email to verify your account!'
      : '✅ Registration successful! You can now login.';
    
    document.getElementById('login-message').textContent = message;
    
    // Clear form
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    
  } catch (error) {
    document.getElementById('login-message').textContent = '❌ ' + error.message;
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = originalText;
  }
}

// User login with loading states
export async function login() {
  const loginBtn = document.querySelector('button[onclick="login()"]');
  const originalText = loginBtn.textContent;
  
  try {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    console.log('✅ Login successful');
    updateCurrentUser(data.user);
    
    // Clear any error messages
    document.getElementById('login-message').textContent = '';
    
    const { showApp } = await import('./ui.js');
    await showApp();
    
  } catch (error) {
    console.error('Login error:', error);
    document.getElementById('login-message').textContent = '❌ ' + error.message;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = originalText;
  }
}

// User logout
export async function logout() {
  console.log('🚪 Logging out...');
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear user state and reload, even if logout fails
    updateCurrentUser(null);
    location.reload();
  }
}

// Password reset
export async function resetPassword() {
  const email = document.getElementById('reset-email').value;
  const msgEl = document.getElementById('reset-message');
  const resetBtn = document.querySelector('button[onclick="resetPassword()"]');
  const originalText = resetBtn.textContent;
  
  if (!email || !email.includes('@')) {
    msgEl.textContent = '❌ Please enter a valid email address.';
    msgEl.style.color = 'red';
    return;
  }
  
  try {
    resetBtn.disabled = true;
    resetBtn.textContent = 'Sending...';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    
    if (error) throw error;
    
    msgEl.style.color = 'green';
    msgEl.textContent = '✅ Password reset email sent! Check your inbox.';
    document.getElementById('reset-email').value = '';
    
  } catch (error) {
    msgEl.style.color = 'red';
    msgEl.textContent = '❌ ' + error.message;
  } finally {
    resetBtn.disabled = false;
    resetBtn.textContent = originalText;
  }
}

// Change password
export async function changePassword() {
  const { getCurrentUser } = await import('./config.js');
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    alert("Not logged in");
    return;
  }
  
  const newPassword = document.getElementById('new-password').value;
  const changeBtn = document.querySelector('#password-modal button[onclick="changePassword()"]');
  const originalText = changeBtn.textContent;
  
  if (!newPassword || newPassword.length < 6) {
    document.getElementById('password-change-message').textContent = '❌ Password must be at least 6 characters';
    return;
  }
  
  try {
    changeBtn.disabled = true;
    changeBtn.textContent = 'Changing...';
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    
    const msgEl = document.getElementById('password-change-message');
    msgEl.textContent = '✅ Password changed successfully!';
    msgEl.style.color = 'green';
    
    // Clear form
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    
    const { closePasswordModal } = await import('./ui.js');
    setTimeout(closePasswordModal, 1500);
    
  } catch (error) {
    document.getElementById('password-change-message').textContent = '❌ ' + error.message;
    document.getElementById('password-change-message').style.color = 'red';
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