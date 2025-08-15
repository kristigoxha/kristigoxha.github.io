// js/auth.js
// Authentication functionality

import { supabase, updateCurrentUser } from './config.js';

// Check authentication status on page load
export async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    updateCurrentUser(user);
    const { showApp } = await import('./ui.js');
    showApp();
  }
}

// User registration
export async function register() {
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
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
  } catch (error) {
    document.getElementById('login-message').textContent = '❌ ' + error.message;
  }
}

// User login
export async function login() {
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    updateCurrentUser(data.user);
    const { showApp } = await import('./ui.js');
    showApp();
  } catch (error) {
    document.getElementById('login-message').textContent = '❌ ' + error.message;
  }
}

// User logout
export async function logout() {
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
  
  if (!email || !email.includes('@')) {
    msgEl.textContent = '❌ Please enter a valid email address.';
    return;
  }
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    
    if (error) throw error;
    
    msgEl.style.color = 'green';
    msgEl.textContent = '✅ Password reset email sent! Check your inbox.';
  } catch (error) {
    msgEl.style.color = 'red';
    msgEl.textContent = '❌ ' + error.message;
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
  
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    
    const msgEl = document.getElementById('password-change-message');
    msgEl.textContent = '✅ Password changed successfully!';
    
    const { closePasswordModal } = await import('./ui.js');
    setTimeout(closePasswordModal, 1500);
  } catch (error) {
    document.getElementById('password-change-message').textContent = '❌ ' + error.message;
  }
}

// Handle authentication state changes
export function setupAuthStateHandler() {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      updateCurrentUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      updateCurrentUser(null);
    }
  });
}