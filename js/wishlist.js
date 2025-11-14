// js/wishlist.js
// Christmas Wishlist functionality
// FIXED: Authentication check to match your app's pattern

// Initialize Supabase client (matching your other pages)
const SUPABASE_URL = 'https://bcjmlhxuakqqqdjrtntj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjam1saHh1YWtxcXFkanJ0bnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTMxMzYsImV4cCI6MjA2NjE2OTEzNn0.3vV15QSv4y3mNRJfARPHlk-GvJGO65r594ss5kSGK3Y';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables to store wishlist data
let currentUserWishlist = '';
let pookieWishlist = '';
let autoSaveTimer = null;
let currentUser = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎄 Initializing Christmas Wishlist...');
    
    // Check authentication first
    const authenticated = await checkAuth();
    if (!authenticated) {
        return; // Stop initialization if not authenticated
    }
    
    // Set up all the features
    await loadWishlists();
    setupEventListeners();
    setupCharacterCounter();
});

// FIXED: Authentication check matching your app's pattern
async function checkAuth() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            console.log('No authenticated user, redirecting to login...');
            window.location.href = '/';
            return false;
        }
        
        currentUser = user;
        console.log('User authenticated:', user.email);
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/';
        return false;
    }
}

// TEACHING MOMENT: Event Listeners
// These listen for user actions like typing and clicking
function setupEventListeners() {
    const textarea = document.getElementById('your-wishlist-input');
    const saveBtn = document.getElementById('save-wishlist-btn');
    const previewPopup = document.getElementById('link-preview-popup');
    const closePreview = document.querySelector('.preview-close');
    
    // Save button click
    saveBtn.addEventListener('click', saveWishlist);
    
    // Auto-save as user types (with delay)
    textarea.addEventListener('input', () => {
        updateCharacterCount();
        
        // Clear existing timer
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        
        // Set new timer - save after 2 seconds of no typing
        autoSaveTimer = setTimeout(() => {
            saveWishlist(true); // true means it's an auto-save
        }, 2000);
    });
    
    // Close preview popup
    closePreview.addEventListener('click', () => {
        previewPopup.classList.remove('show');
    });
    
    // Click outside popup to close
    previewPopup.addEventListener('click', (e) => {
        if (e.target === previewPopup) {
            previewPopup.classList.remove('show');
        }
    });
}

// TEACHING MOMENT: Character Counter
// Shows users how many characters they've typed
function setupCharacterCounter() {
    const textarea = document.getElementById('your-wishlist-input');
    updateCharacterCount();
}

function updateCharacterCount() {
    const textarea = document.getElementById('your-wishlist-input');
    const charCount = document.querySelector('.char-count');
    const currentLength = textarea.value.length;
    charCount.textContent = `${currentLength} / 2000`;
    
    // Change color when getting close to limit
    if (currentLength > 1800) {
        charCount.style.color = '#ff6b6b';
    } else {
        charCount.style.color = 'rgba(255, 255, 255, 0.7)';
    }
}

// TEACHING MOMENT: Loading Wishlists from Database
// This gets both your wishlist and your partner's wishlist
async function loadWishlists() {
    try {
        if (!currentUser) {
            console.error('No current user found');
            return;
        }
        
        // Load your wishlist
        const { data: yourData, error: yourError } = await supabase
            .from('wishlists')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
        
        if (yourError && yourError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error loading your wishlist:', yourError);
        }
        
        if (yourData) {
            currentUserWishlist = yourData.content || '';
            document.getElementById('your-wishlist-input').value = currentUserWishlist;
            updateWishlistStatus('your', currentUserWishlist);
        }
        
        // Load pookie's wishlist (all wishlists except yours)
        const { data: pookieData, error: pookieError } = await supabase
            .from('wishlists')
            .select('*')
            .neq('user_id', currentUser.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
        
        if (pookieError && pookieError.code !== 'PGRST116') {
            console.error('Error loading pookie wishlist:', pookieError);
        }
        
        if (pookieData) {
            pookieWishlist = pookieData.content || '';
            displayPookieWishlist(pookieWishlist);
            updateWishlistStatus('pookie', pookieWishlist);
        } else {
            // No pookie wishlist yet
            displayPookieWishlist('');
        }
        
    } catch (error) {
        console.error('Error loading wishlists:', error);
        showMessage('Error loading wishlists. Please refresh the page.', 'error');
    }
}

// TEACHING MOMENT: Saving Wishlist
// This saves your wishlist to the database
async function saveWishlist(isAutoSave = false) {
    const saveBtn = document.getElementById('save-wishlist-btn');
    const textarea = document.getElementById('your-wishlist-input');
    const wishlistContent = textarea.value.trim();
    
    // Don't save if nothing changed
    if (wishlistContent === currentUserWishlist) return;
    
    try {
        // Show saving state
        if (!isAutoSave) {
            saveBtn.textContent = 'Saving...';
            saveBtn.classList.add('saving');
        }
        
        if (!currentUser) {
            throw new Error('No user logged in');
        }
        
        // Check if wishlist exists
        const { data: existing, error: checkError } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', currentUser.id)
            .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }
        
        if (existing) {
            // Update existing wishlist
            const { error } = await supabase
                .from('wishlists')
                .update({ 
                    content: wishlistContent,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
        } else {
            // Create new wishlist
            const { error } = await supabase
                .from('wishlists')
                .insert({ 
                    user_id: currentUser.id,
                    content: wishlistContent,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
        }
        
        currentUserWishlist = wishlistContent;
        updateWishlistStatus('your', wishlistContent);
        
        if (!isAutoSave) {
            showMessage('Wishlist saved successfully! 🎄', 'success');
        }
        
    } catch (error) {
        console.error('Error saving wishlist:', error);
        showMessage('Error saving wishlist. Please try again.', 'error');
    } finally {
        if (!isAutoSave) {
            saveBtn.textContent = 'Save Wishlist';
            saveBtn.classList.remove('saving');
        }
    }
}

// TEACHING MOMENT: Display Pookie's Wishlist
// This shows your partner's wishlist with clickable links
function displayPookieWishlist(content) {
    const display = document.getElementById('pookie-wishlist-display');
    
    if (!content) {
        display.innerHTML = '<p class="empty-wishlist">Your pookie hasn\'t added their wishlist yet 💝</p>';
        return;
    }
    
    // Convert URLs to clickable links
    const contentWithLinks = convertUrlsToLinks(content);
    display.innerHTML = contentWithLinks;
    
    // Add click handlers to links
    const links = display.querySelectorAll('.wishlist-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showLinkPreview(link.href);
        });
    });
}

// TEACHING MOMENT: Convert URLs to Links
// This finds URLs in text and makes them clickable
function convertUrlsToLinks(text) {
    // Regular expression to find URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Escape HTML to prevent XSS attacks
    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    // Split text by URLs and escape each part
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
        if (index % 2 === 1) { // This is a URL
            return `<a href="${escapeHtml(part)}" class="wishlist-link" target="_blank">${escapeHtml(part)}</a>`;
        } else {
            return escapeHtml(part);
        }
    }).join('');
}

// TEACHING MOMENT: Show Link Preview
// This creates a popup preview for product links
async function showLinkPreview(url) {
    const popup = document.getElementById('link-preview-popup');
    const previewImage = popup.querySelector('.preview-image');
    const previewTitle = popup.querySelector('.preview-title');
    const previewDescription = popup.querySelector('.preview-description');
    const previewLink = popup.querySelector('.preview-link');
    
    // For this example, we'll show a simple preview
    // In a real app, you might fetch product data from an API
    try {
        const urlObj = new URL(url);
        previewTitle.textContent = 'Product from ' + urlObj.hostname;
        previewDescription.textContent = 'Click below to view this product on the original website.';
        previewImage.src = ''; // Clear previous image
        previewImage.style.display = 'none'; // Hide image if we don't have one
        previewLink.href = url;
        
        popup.classList.add('show');
    } catch (error) {
        console.error('Invalid URL:', error);
    }
}

// TEACHING MOMENT: Update Status Indicators
// Shows if wishlists are complete or not
function updateWishlistStatus(whose, content) {
    const statusIcon = document.getElementById(`${whose}-status`);
    const statusText = document.getElementById(`${whose}-status-text`);
    
    if (!statusIcon || !statusText) return;
    
    if (!content || content.length < 10) {
        statusIcon.textContent = '⏳';
        statusText.textContent = 'Not started';
    } else if (content.length < 50) {
        statusIcon.textContent = '📝';
        statusText.textContent = 'In progress';
    } else {
        statusIcon.textContent = '✅';
        statusText.textContent = 'Complete!';
    }
}

// TEACHING MOMENT: Show Messages
// This shows success or error messages to the user
function showMessage(text, type = 'success') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('wishlist-message-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'wishlist-message-toast';
        toast.className = 'message-toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = text;
    toast.className = `message-toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

console.log('🎄 Wishlist.js loaded and ready!');