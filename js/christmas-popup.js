// js/christmas-popup.js
// Christmas Wishlist Popup System
// Teaching moment: This handles the greeting and reminder popups!

import { supabase, getCurrentUser } from './config.js';

// TEACHING MOMENT: Check and Show Popups
// This runs when user logs in successfully
export async function checkChristmasPopups() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Check if this is the first time seeing Christmas popup
    const hasSeenWelcome = localStorage.getItem('christmas_welcome_shown');
    
    if (!hasSeenWelcome) {
        // Show welcome popup for first time
        showChristmasWelcomePopup();
        localStorage.setItem('christmas_welcome_shown', 'true');
    } else {
        // Check for daily reminder
        await checkDailyReminder();
    }
}

// TEACHING MOMENT: Christmas Welcome Popup
// This shows when user first logs in after feature is added
function showChristmasWelcomePopup() {
    // Create popup HTML
    const popupHTML = `
        <div id="christmas-welcome-popup" class="christmas-popup-overlay">
            <div class="christmas-popup">
                <div class="popup-header">
                    <span class="popup-emoji">🎅</span>
                    <h2>Ho Ho Ho! Christmas is Coming!</h2>
                    <span class="popup-emoji">🎄</span>
                </div>
                <div class="popup-body">
                    <p>Hey there, lovebird! 💝</p>
                    <p>Christmas is just around the corner, and you know what that means...</p>
                    <p><strong>It's time to create your wishlist!</strong></p>
                    <p>Share your Christmas wishes with your pookie so they know exactly what will make you smile this holiday season!</p>
                    <div class="popup-decorations">
                        🎁 ❄️ ⭐ 🎁 ❄️ ⭐ 🎁
                    </div>
                </div>
                <div class="popup-actions">
                    <button id="go-to-wishlist" class="popup-btn-primary">
                        Create My Wishlist 🎄
                    </button>
                    <button id="close-welcome" class="popup-btn-secondary">
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Add event listeners
    document.getElementById('go-to-wishlist').addEventListener('click', () => {
        window.location.href = '/pages/wishlist.html';
    });
    
    document.getElementById('close-welcome').addEventListener('click', () => {
        closePopup('christmas-welcome-popup');
    });
    
    // Show with animation
    setTimeout(() => {
        document.getElementById('christmas-welcome-popup').classList.add('show');
    }, 100);
}

// TEACHING MOMENT: Daily Reminder
// This checks if user completed their wishlist and shows reminder if not
async function checkDailyReminder() {
    const user = getCurrentUser();
    
    // Check last reminder date
    const lastReminder = localStorage.getItem('last_wishlist_reminder');
    const today = new Date().toDateString();
    
    // If already shown today, skip
    if (lastReminder === today) return;
    
    try {
        // Check if user has a wishlist
        const { data, error } = await supabase
            .from('wishlists')
            .select('content')
            .eq('user_id', user.id)
            .single();
        
        // If no wishlist or very short, show reminder
        if (!data || !data.content || data.content.length < 50) {
            showDailyReminderPopup();
            localStorage.setItem('last_wishlist_reminder', today);
        }
    } catch (error) {
        console.log('No wishlist yet');
    }
}

// TEACHING MOMENT: Daily Reminder Popup
// A gentle nudge to complete the wishlist
function showDailyReminderPopup() {
    const popupHTML = `
        <div id="daily-reminder-popup" class="christmas-popup-overlay light">
            <div class="christmas-popup small">
                <button class="popup-close-x">×</button>
                <div class="popup-header small">
                    <span class="popup-emoji">🎁</span>
                    <h3>Don't Forget Your Wishlist!</h3>
                </div>
                <div class="popup-body small">
                    <p>Hey! Quick reminder to complete your Christmas wishlist so your pookie knows what to get you!</p>
                </div>
                <div class="popup-actions">
                    <button id="reminder-go-wishlist" class="popup-btn-small-primary">
                        Complete Wishlist
                    </button>
                    <button id="reminder-close" class="popup-btn-small-secondary">
                        Later
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Event listeners
    document.getElementById('reminder-go-wishlist').addEventListener('click', () => {
        window.location.href = '/pages/wishlist.html';
    });
    
    document.getElementById('reminder-close').addEventListener('click', () => {
        closePopup('daily-reminder-popup');
    });
    
    document.querySelector('.popup-close-x').addEventListener('click', () => {
        closePopup('daily-reminder-popup');
    });
    
    // Show with animation
    setTimeout(() => {
        document.getElementById('daily-reminder-popup').classList.add('show');
    }, 100);
}

// TEACHING MOMENT: Close Popup Helper
// Removes popup with animation
function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => {
            popup.remove();
        }, 300);
    }
}

// Export for use in other files
export { checkChristmasPopups };