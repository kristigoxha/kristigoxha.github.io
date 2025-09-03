// js/auth.js
// Complete authentication system for Love You Pookie app
// 🔧 UPDATED: Fixed password reset redirect and improved error handling

import { supabase, updateCurrentUser, getCurrentUser } from './config.js';

// 🔧 CODING LESSON: Helper Functions
// These small utility functions make our code cleaner and reusable!

function showMessage(elementId, message, type = 'success') {
  const msgEl = document.getElementById(elementId);
  msgEl.textContent = message;
  msgEl.className = `message ${type}`;
  msgEl.style.display = 'block';
  
  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      msgEl.style.display = 'none';
    }, 5000);
  }
}

function setButtonLoading(button, isLoading, loadingText = 'Loading...') {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
    button.textContent = button.dataset.originalText || 'Submit';
  }
}

function showLoadingState() {
  const loadingEl = document.createElement('div');
  loadingEl.id = 'global-loading';
  loadingEl.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(102, 126, 234, 0.9); display: flex; 
                align-items: center; justify-content: center; z-index: 9999;">
      <div style="text-align: center; color: white;">
        <div style="width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3); 
                    border-top: 3px solid white; border-radius: 50%; 
                    animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p style="font-size: 18px; font-weight: 500;">Loading your app...</p>
      </div>
    </div>
  `;
  document.body.appendChild(loadingEl);
}

// 🔧 CODING LESSON: Session Management
// This clears old authentication data that might be corrupted

async function clearAuthSession() {
  try {
    console.log('🧹 Clearing auth session...');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear local user state
    updateCurrentUser(null);
    
    // Clear any auth-related localStorage items
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    );
    authKeys.forEach(key => localStorage.removeItem(key));
    
    console.log('✅ Auth session cleared');
  } catch (error) {
    console.warn('⚠️ Error clearing session:', error);
    // Continue anyway - don't let this block the user
  }
}

// 🔧 IMPROVED: User Registration with Better Error Handling
export async function register() {
  const registerBtn = document.querySelector('button[onclick="register()"]');
  const messageEl = document.getElementById('login-message');
  
  // Clear previous messages
  messageEl.style.display = 'none';
  
  try {
    setButtonLoading(registerBtn, true, 'Creating account...');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // 🔧 CODING LESSON: Input Validation
    // Always check user input before sending to server!
    if (!email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      throw new Error('Please enter a valid email address');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    console.log('📝 Attempting registration...');
    
    // Clear any existing session first
    await clearAuthSession();
    
    // Attempt registration with timeout
    const registerPromise = supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Registration timeout - please try again')), 15000);
    });
    
    const { data, error } = await Promise.race([registerPromise, timeoutPromise]);
    
    if (error) {
      // Handle specific registration errors
      if (error.message.includes('User already registered')) {
        throw new Error('An account with this email already exists. Try logging in instead.');
      } else if (error.message.includes('Password should be at least')) {
        throw new Error('Password must be at least 6 characters long');
      } else if (error.message.includes('Unable to validate email address')) {
        throw new Error('Please enter a valid email address');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Registration successful');
    
    // Show appropriate success message
    const message = data.user && !data.user.email_confirmed_at
      ? 'Account created! Please check your email to verify before signing in.'
      : 'Registration successful! You can now sign in.';
    
    showMessage('login-message', message, 'success');
    
    // Clear form on success
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    
  } catch (error) {
    console.error('Registration error:', error);
    showMessage('login-message', error.message, 'error');
  } finally {
    setButtonLoading(registerBtn, false);
  }
}

// 🔧 IMPROVED: Login with Better Error Handling and Session Management
export async function login() {
  const loginBtn = document.querySelector('button[onclick="login()"]');
  const messageEl = document.getElementById('login-message');
  
  // Clear previous messages
  messageEl.style.display = 'none';
  
  try {
    setButtonLoading(loginBtn, true, 'Signing in...');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    console.log('🔐 Attempting login with session cleanup...');
    
    // Clear any existing corrupted session first
    await clearAuthSession();
    
    // Add timeout to login attempt
    const loginPromise = supabase.auth.signInWithPassword({ 
      email: email, 
      password: password 
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login timeout - server may be slow')), 15000);
    });
    
    const { data, error } = await Promise.race([loginPromise, timeoutPromise]);
    
    if (error) {
      // Handle specific auth errors
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and click the confirmation link before signing in.');
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

// 🔧 IMPROVED: Better Logout with Loading State
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
      // Remove loading overlay first
      const loadingEl = document.getElementById('global-loading');
      if (loadingEl) loadingEl.remove();
      
      // Reload the page
      window.location.reload();
    }, 500);
  }
}

// 🔧 FIXED: Password Reset with Correct Redirect URL
export async function resetPassword() {
  const email = document.getElementById('reset-email').value.trim();
  const msgEl = document.getElementById('reset-message');
  const resetBtn = document.querySelector('button[onclick="resetPassword()"]');
  
  // Clear previous messages
  msgEl.style.display = 'none';
  
  if (!email) {
    showMessage('reset-message', 'Please enter your email address.', 'error');
    return;
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    showMessage('reset-message', 'Please enter a valid email address.', 'error');
    return;
  }
  
  try {
    setButtonLoading(resetBtn, true, 'Sending reset link...');
    
    console.log('📧 Sending password reset email...');
    
    // Add timeout to reset request
    const resetPromise = supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html` // 🔧 FIXED: Correct redirect URL
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - please try again')), 15000);
    });
    
    const { error } = await Promise.race([resetPromise, timeoutPromise]);
    
    if (error) {
      if (error.message.includes('Unable to validate email address')) {
        throw new Error('Please enter a valid email address');
      } else if (error.message.includes('For security purposes')) {
        throw new Error('For security, we always show this message. If the email exists, you\'ll receive a reset link.');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Password reset email sent');
    showMessage('reset-message', 'Reset link sent! Please check your inbox and spam folder.', 'success');
    document.getElementById('reset-email').value = '';
    
  } catch (error) {
    console.error('Reset password error:', error);
    showMessage('reset-message', error.message, 'error');
  } finally {
    setButtonLoading(resetBtn, false);
  }
}

// 🔧 IMPROVED: Change Password with Better Validation
export async function changePassword() {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    alert("Not logged in - please refresh and try again");
    return;
  }
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const changeBtn = document.querySelector('#password-modal button[onclick="changePassword()"]');
  const originalText = changeBtn.textContent;
  const msgEl = document.getElementById('password-change-message');
  
  // Clear previous messages
  msgEl.textContent = '';
  msgEl.style.color = '';
  
  // 🔧 CODING LESSON: Input Validation
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
  
  if (currentPassword === newPassword) {
    msgEl.textContent = 'New password must be different from current password';
    msgEl.style.color = 'red';
    return;
  }
  
  try {
    changeBtn.disabled = true;
    changeBtn.textContent = 'Changing...';
    
    console.log('🔐 Verifying current password...');
    
    // First verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword
    });
    
    if (verifyError) {
      throw new Error('Current password is incorrect');
    }
    
    console.log('✅ Current password verified, updating...');
    
    // Now update to new password
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    
    if (error) throw error;
    
    console.log('✅ Password changed successfully');
    
    msgEl.textContent = 'Password changed successfully!';
    msgEl.style.color = 'green';
    
    // Clear form
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    
    // Close modal after success
    const { closePasswordModal } = await import('./ui.js');
    setTimeout(closePasswordModal, 1500);
    
  } catch (error) {
    console.error('Change password error:', error);
    msgEl.textContent = error.message;
    msgEl.style.color = 'red';
  } finally {
    changeBtn.disabled = false;
    changeBtn.textContent = originalText;
  }
}

// 🔧 IMPROVED: Authentication State Handler
export function setupAuthStateHandler() {
  console.log('🔐 Setting up auth state handler...');
  
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔐 Auth state change:', event, session ? 'Has session' : 'No session');
    
    if (event === 'SIGNED_IN' && session) {
      console.log('✅ User signed in:', session.user.email);
      updateCurrentUser(session.user);
      
      // If we're on the login page, redirect to app
      if (document.getElementById('login-section')?.style.display !== 'none') {
        const { showApp } = await import('./ui.js');
        await showApp();
      }
      
    } else if (event === 'SIGNED_OUT') {
      console.log('👋 User signed out');
      updateCurrentUser(null);
      
      // If we're in the app, redirect to login
      if (document.getElementById('app-section')?.style.display !== 'none') {
        const { showLogin } = await import('./ui.js');
        showLogin();
      }
      
    } else if (event === 'TOKEN_REFRESHED') {
      console.log('🔄 Token refreshed');
      updateCurrentUser(session?.user || null);
      
    } else if (event === 'PASSWORD_RECOVERY') {
      console.log('🔑 Password recovery initiated');
    }
  });
}

// 🔧 IMPROVED: Initial Session Check
export async function checkInitialAuth() {
  console.log('🔍 Checking initial authentication state...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Session check error:', error);
      await clearAuthSession();
      return null;
    }
    
    if (session && session.user) {
      console.log('✅ Found existing session for:', session.user.email);
      updateCurrentUser(session.user);
      return session.user;
    }
    
    console.log('ℹ️ No existing session found');
    return null;
    
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    await clearAuthSession();
    return null;
  }
}

// 🔧 NEW: Debug Function (Helpful for Troubleshooting)
window.debugAuth = function() {
  console.log('🔍 AUTH DEBUG INFO:');
  console.log('Current user:', getCurrentUser());
  console.log('Supabase client:', supabase);
  
  // Check localStorage for auth data
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('auth')
  );
  console.log('Auth localStorage keys:', authKeys);
  
  // Test connectivity
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Current session:', { 
      hasSession: !!data.session, 
      user: data.session?.user?.email || 'None',
      error: error?.message || 'None'
    });
  });
  
  // Test Supabase connection
  supabase.auth.getUser().then(({ data, error }) => {
    console.log('Current user check:', {
      hasUser: !!data.user,
      email: data.user?.email || 'None',
      error: error?.message || 'None'
    });
  });
};

// 🔧 CODING LESSON: Utility Function for Email Validation
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 🔧 CODING LESSON: Password Strength Checker
export function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 6,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  if (score <= 2) return { strength: 'weak', score, checks };
  if (score <= 4) return { strength: 'medium', score, checks };
  return { strength: 'strong', score, checks };
}

console.log('✅ Auth.js loaded with all improvements and fixes!');
