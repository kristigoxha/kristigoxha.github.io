// js/photos.js
// Photo preview, gallery, and image handling functionality

import { getCurrentUser } from './config.js';
import { getLatestSharedPhoto } from './database.js';

// PHOTO PREVIEW FUNCTIONALITY
export async function showPhotoPreview() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Please log in first');
    return;
  }
  
  const popup = document.getElementById('photo-preview-popup');
  const content = document.getElementById('photo-preview-content');
  
  // Show loading
  content.innerHTML = '<div style="padding: 20px;">Loading latest photo...</div>';
  popup.classList.add('show');
  
  try {
    const latestPhoto = await getLatestSharedPhoto();
    
    if (!latestPhoto) {
      content.innerHTML = `
        <div class="no-photos">
          <h3>📷 No shared photos yet</h3>
          <p>Wait for someone to share photos with you!</p>
          <div class="popup-buttons">
            <button class="popup-btn popup-btn-secondary" onclick="window.closePhotoPreview()">
              Close
            </button>
          </div>
        </div>
      `;
      return;
    }
    
    content.innerHTML = `
      <img src="${latestPhoto.file_url}" 
           alt="${latestPhoto.filename}" 
           class="latest-photo"
           onclick="window.openImageModal('${latestPhoto.file_url}')">
      <div class="photo-info">
        <div><strong>${latestPhoto.filename}</strong></div>
        <div>Shared by: ${latestPhoto.owner_email}</div>
        <div>Date: ${new Date(latestPhoto.created_at).toLocaleDateString()}</div>
      </div>
      <div class="popup-buttons">
        <a href="/pages/gallery.html?filter=shared-with-me" target="_blank" class="popup-btn popup-btn-primary">
          🌟 Go to Gallery
        </a>
        <button class="popup-btn popup-btn-secondary" onclick="window.closePhotoPreview()">
          Close
        </button>
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading latest photo:', error);
    content.innerHTML = `
      <div class="no-photos">
        <h3>😢 Error loading photos</h3>
        <p>Something went wrong. Please try again later.</p>
        <div class="popup-buttons">
          <button class="popup-btn popup-btn-secondary" onclick="window.closePhotoPreview()">
            Close
          </button>
        </div>
      </div>
    `;
  }
}

export function closePhotoPreview(event) {
  // Only close if clicking on the backdrop, not the content
  if (event && event.target !== event.currentTarget) return;
  
  document.getElementById('photo-preview-popup').classList.remove('show');
}

// IMAGE MODAL FUNCTIONS
export function openImageModal(imageUrl) {
  document.getElementById('modal-image').src = imageUrl;
  document.getElementById('image-modal').classList.add('show');
}

export function closeImageModal() {
  document.getElementById('image-modal').classList.remove('show');
}

// FILE UPLOAD HANDLER
export async function handleFileUpload(file) {
  if (!file) return;
  
  const fileNameEl = document.getElementById('file-name');
  if (fileNameEl) {
    fileNameEl.textContent = `🎉 File ready: ${file.name}`;
  }
  
  try {
    const { uploadFile } = await import('./database.js');
    await uploadFile(file);
    
    if (fileNameEl) {
      fileNameEl.textContent = `✅ ${file.name} uploaded successfully!`;
    }
  } catch (error) {
    console.error('Upload error:', error);
    if (fileNameEl) {
      fileNameEl.textContent = `❌ Upload failed: ${error.message}`;
    }
  }
}

// GALLERY INTEGRATION
export function redirectToGallery() {
  window.open('/pages/gallery.html', '_blank');
}

export function redirectToGalleryWithFilter(filter) {
  window.open(`/pages/gallery.html?filter=${filter}`, '_blank');
}

// IMAGE VALIDATION
export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
  }
  
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }
  
  return true;
}

// SETUP PHOTO EVENT LISTENERS
export function setupPhotoEventListeners() {
  // Make functions available globally for onclick handlers
  window.showPhotoPreview = showPhotoPreview;
  window.closePhotoPreview = closePhotoPreview;
  window.openImageModal = openImageModal;
  window.closeImageModal = closeImageModal;
  
  // Set up file input handlers
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          validateImageFile(file);
          await handleFileUpload(file);
        } catch (error) {
          alert(error.message);
        }
      }
    });
  });
}