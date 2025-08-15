// js/config.js
// Configuration and global state management

// SUPABASE CONFIGURATION
export const SUPABASE_CONFIG = {
  url: 'https://bcjmlhxuakqqqdjrtntj.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjam1saHh1YWtxcXFkanJ0bnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTMxMzYsImV4cCI6MjA2NjE2OTEzNn0.3vV15QSv4y3mNRJfARPHlk-GvJGO65r594ss5kSGK3Y'
};

// Initialize Supabase client
export const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Make supabase available globally for backward compatibility
window.supabase = supabase;

// Global user state
let currentUser = null;

// Utility function to update global user reference
export function updateCurrentUser(user) {
  currentUser = user;
  window.currentUser = user;
}

// Getter for current user
export function getCurrentUser() {
  return currentUser;
}

// App constants
export const APP_CONFIG = {
  sounds: {
    boing: 'assets/sounds/boing.mp3'
  },
  images: {
    cookie: 'assets/images/Cookie.png'
  },
  storage: {
    bucket: 'pookiepics'
  }
};