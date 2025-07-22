// Push Notifications Handler
class PushNotificationManager {
  constructor(supabase, currentUser) {
    this.supabase = supabase;
    this.currentUser = currentUser;
    this.publicVapidKey = 'YOUR_VAPID_PUBLIC_KEY'; // You'll need to generate this
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Check if push notifications are supported
  isNotificationSupported() {
    return this.isSupported && 'Notification' in window;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isNotificationSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Get or create push subscription
  async getSubscription() {
    if (!this.isSupported) return null;

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;

    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
      });
    }

    return subscription;
  }

  // Convert VAPID key to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Subscribe user to push notifications
  async subscribe() {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Push notification permission denied');
      }

      const subscription = await this.getSubscription();
      if (!subscription) {
        throw new Error('Failed to create push subscription');
      }

      // Save subscription to Supabase
      await this.saveSubscriptionToDatabase(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Save subscription to database
  async saveSubscriptionToDatabase(subscription) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const subscriptionData = {
      user_id: this.currentUser.id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('push_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      });

    if (error) {
      throw new Error(`Failed to save subscription: ${error.message}`);
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromDatabase();
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  // Remove subscription from database
  async removeSubscriptionFromDatabase() {
    if (!this.currentUser) return;

    const { error } = await this.supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', this.currentUser.id);

    if (error) {
      console.error('Failed to remove subscription from database:', error);
    }
  }

  // Check subscription status
  async getSubscriptionStatus() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  // Send test notification (for development)
  async sendTestNotification() {
    if (!this.isNotificationSupported()) return;

    if (Notification.permission === 'granted') {
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from Pookie\'s app!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        tag: 'test-notification'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
}

// Notification types for different events
const NotificationTypes = {
  NEW_PHOTO_SHARED: 'new_photo_shared',
  DAILY_BOING_REMINDER: 'daily_boing_reminder',
  WEEKLY_SUMMARY: 'weekly_summary',
  POOKIE_ACTIVITY: 'pookie_activity'
};

// Initialize push notifications when user logs in
async function initializePushNotifications(supabase, currentUser) {
  if (!currentUser) return null;

  const pushManager = new PushNotificationManager(supabase, currentUser);
  
  if (!pushManager.isNotificationSupported()) {
    console.log('Push notifications not supported');
    return null;
  }

  try {
    // Check if already subscribed
    const isSubscribed = await pushManager.getSubscriptionStatus();
    
    // Show notification setup UI if not subscribed
    if (!isSubscribed) {
      showNotificationSetupPrompt(pushManager);
    }

    return pushManager;
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
    return null;
  }
}

// Show notification setup prompt
function showNotificationSetupPrompt(pushManager) {
  // Create a subtle prompt to enable notifications
  const prompt = document.createElement('div');
  prompt.id = 'notification-prompt';
  prompt.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    padding: 15px 20px;
    border-radius: 25px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    z-index: 1000;
    font-size: 14px;
    color: #333;
    text-align: center;
    max-width: 300px;
    animation: slideDown 0.3s ease;
  `;

  prompt.innerHTML = `
    <div style="margin-bottom: 10px;">🔔 Get notified of new photos and updates!</div>
    <div>
      <button onclick="enableNotifications()" style="
        background: #a18cd1; color: white; border: none; padding: 8px 16px;
        border-radius: 15px; margin: 0 5px; cursor: pointer; font-size: 12px;
      ">Enable</button>
      <button onclick="dismissNotificationPrompt()" style="
        background: transparent; color: #666; border: 1px solid #ddd; padding: 8px 16px;
        border-radius: 15px; margin: 0 5px; cursor: pointer; font-size: 12px;
      ">Maybe Later</button>
    </div>
  `;

  document.body.appendChild(prompt);

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.getElementById('notification-prompt')) {
      dismissNotificationPrompt();
    }
  }, 10000);

  // Global functions for the prompt
  window.enableNotifications = async () => {
    try {
      await pushManager.subscribe();
      showNotificationSuccess();
      dismissNotificationPrompt();
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      alert('Failed to enable notifications. Please try again.');
    }
  };

  window.dismissNotificationPrompt = () => {
    const promptEl = document.getElementById('notification-prompt');
    if (promptEl) {
      promptEl.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => promptEl.remove(), 300);
    }
  };
}

// Show success message when notifications are enabled
function showNotificationSuccess() {
  const success = document.createElement('div');
  success.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(76, 175, 80, 0.9);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    z-index: 1000;
    font-size: 14px;
    animation: slideDown 0.3s ease;
  `;
  success.textContent = '✅ Notifications enabled successfully!';
  
  document.body.appendChild(success);
  
  setTimeout(() => {
    success.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => success.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  
  @keyframes slideUp {
    from { opacity: 1; transform: translateX(-50%) translateY(0); }
    to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
`;
document.head.appendChild(style);

// Export for use in main.js
window.PushNotificationManager = PushNotificationManager;
window.initializePushNotifications = initializePushNotifications;
window.NotificationTypes = NotificationTypes;