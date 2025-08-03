class OfflineStorage {
  constructor() {
    this.dbName = 'PookieDB';
    this.version = 1;
    this.db = null;
  }
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store for offline boings
        if (!db.objectStoreNames.contains('offline_boings')) {
          const store = db.createObjectStore('offline_boings', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  async addOfflineBoing() {
    const transaction = this.db.transaction(['offline_boings'], 'readwrite');
    const store = transaction.objectStore('offline_boings');
    
    return store.add({
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-CA'),
      synced: false
    });
  }
  
  async getOfflineBoings() {
    const transaction = this.db.transaction(['offline_boings'], 'readonly');
    const store = transaction.objectStore('offline_boings');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
