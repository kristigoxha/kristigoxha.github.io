// js/database.js
// Database operations for boings, profiles, and uploads

import { supabase, getCurrentUser } from './config.js';

// BOING OPERATIONS
export async function getTodaysBoings() {
  const currentUser = getCurrentUser();
  if (!currentUser) return 0;
  
  const today = new Date().toLocaleDateString('en-CA');
  
  try {
    const { data, error } = await supabase
      .from('boings')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('boing_date', today);
    
    if (error) throw error;
    return data.length;
  } catch (error) {
    console.error('Error getting today\'s boings:', error);
    return 0;
  }
}

export async function getYesterdaysBoings() {
  const currentUser = getCurrentUser();
  if (!currentUser) return 0;
  
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
  
  try {
    const { data, error } = await supabase
      .from('boings')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('boing_date', yesterday);
    
    if (error) throw error;
    return data.length;
  } catch (error) {
    console.error('Error getting yesterday\'s boings:', error);
    return 0;
  }
}

export async function recordBoing() {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  try {
    const { error } = await supabase
      .from('boings')
      .insert([{ user_id: currentUser.id }]);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error recording boing:', error);
    return false;
  }
}

export async function getBoingHistory() {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  
  try {
    const { data, error } = await supabase
      .from('boings')
      .select('boing_date')
      .eq('user_id', currentUser.id)
      .order('boing_date', { ascending: false });
    
    if (error) throw error;
    
    // Group by date
    const history = {};
    data.forEach(boing => {
      const date = boing.boing_date;
      history[date] = (history[date] || 0) + 1;
    });
    
    return Object.entries(history);
  } catch (error) {
    console.error('Error fetching boing history:', error);
    return [];
  }
}

// PROFILE OPERATIONS
export async function getLastLoginDate() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('last_login_date')
      .eq('id', currentUser.id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data?.last_login_date || null;
  } catch (error) {
    console.error('Error getting last login date:', error);
    return null;
  }
}

export async function updateLastLoginDate() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const today = new Date().toLocaleDateString('en-CA');
  
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert([{ 
        id: currentUser.id,
        last_login_date: today
      }], {
        onConflict: 'id'
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating last login date:', error);
  }
}

export async function getUserProfile() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, autoreceiver_email')
      .eq('id', currentUser.id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}

export async function updateUserProfile(updates) {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert([{ 
        id: currentUser.id,
        ...updates
      }], {
        onConflict: 'id'
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

// FILE UPLOAD OPERATIONS
export async function uploadFile(file) {
  const currentUser = getCurrentUser();
  if (!currentUser || !file) return null;
  
  const fileName = `${currentUser.id}/${Date.now()}-${file.name}`;
  
  try {
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('pookiepics')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    // Save record to database
    const { error: dbError } = await supabase
      .from('uploads')
      .insert([{
        user_id: currentUser.id,
        filename: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type
      }]);
    
    if (dbError) throw dbError;
    
    return fileName;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// SHARED IMAGES OPERATIONS
export async function getLatestSharedPhoto() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  
  try {
    const { data: images, error } = await supabase
      .from('shared_images')
      .select('*')
      .contains('shared_with_emails', [currentUser.email])
      .neq('owner_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return images && images.length > 0 ? images[0] : null;
  } catch (error) {
    console.error('Error loading latest shared photo:', error);
    return null;
  }
}