// SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://bcjmlhxuakqqqdjrtntj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjam1saHh1YWtxcXFkanJ0bnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTMxMzYsImV4cCI6MjA2NjE2OTEzNn0.3vV15QSv4y3mNRJfARPHlk-GvJGO65r594ss5kSGK3Y'

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
window.supabase = supabase

// Global user state
let currentUser = null

// Utility function to update global user reference
function updateCurrentUser(user) {
  currentUser = user
  window.currentUser = user
}

// Check authentication status on page load
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    updateCurrentUser(user)
    window.showApp()
  }
}

// AUTHENTICATION FUNCTIONS
window.register = async () => {
  try {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    const { data, error } = await supabase.auth.signUp({ email, password })
    
    if (error) {
      console.error('Registration error:', error)
      document.getElementById('login-message').textContent = '❌ ' + error.message
      return
    }
    
    const message = data.user && !data.session 
      ? '✅ Check your email to verify your account!'
      : '✅ Registration successful! You can now login.'
    
    document.getElementById('login-message').textContent = message
  } catch (error) {
    document.getElementById('login-message').textContent = '❌ ' + error.message
  }
}

window.login = async () => {
  try {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    updateCurrentUser(data.user)
    window.showApp()
  } catch (error) {
    document.getElementById('login-message').textContent = '❌ ' + error.message
  }
}

window.logout = async () => {
  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always clear user state and reload, even if logout fails
    updateCurrentUser(null)
    location.reload()
  }
}

window.resetPassword = async () => {
  const email = document.getElementById('reset-email').value
  const msgEl = document.getElementById('reset-message')
  
  if (!email || !email.includes('@')) {
    msgEl.textContent = '❌ Please enter a valid email address.'
    return
  }
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    
    if (error) throw error
    
    msgEl.style.color = 'green'
    msgEl.textContent = '✅ Password reset email sent! Check your inbox.'
  } catch (error) {
    msgEl.style.color = 'red'
    msgEl.textContent = '❌ ' + error.message
  }
}

window.changePassword = async () => {
  if (!currentUser) {
    alert("Not logged in")
    return
  }
  
  const newPassword = document.getElementById('new-password').value
  
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    
    const msgEl = document.getElementById('password-change-message')
    msgEl.textContent = '✅ Password changed successfully!'
    setTimeout(closePasswordModal, 1500)
  } catch (error) {
    document.getElementById('password-change-message').textContent = '❌ ' + error.message
  }
}

// DATABASE FUNCTIONS
async function getTodaysBoings() {
  if (!currentUser) return 0
  
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const { data, error } = await supabase
      .from('boings')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('boing_date', today)
    
    if (error) throw error
    return data.length
  } catch (error) {
    console.error('Error getting today\'s boings:', error)
    return 0
  }
}

async function getYesterdaysBoings() {
  if (!currentUser) return 0
  
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  try {
    const { data, error } = await supabase
      .from('boings')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('boing_date', yesterday)
    
    if (error) throw error
    return data.length
  } catch (error) {
    console.error('Error getting yesterday\'s boings:', error)
    return 0
  }
}

async function recordBoing() {
  if (!currentUser) return false
  
  try {
    const { error } = await supabase
      .from('boings')
      .insert([{ user_id: currentUser.id }])
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error recording boing:', error)
    return false
  }
}

async function getLastLoginDate() {
  if (!currentUser) return null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('last_login_date')
      .eq('id', currentUser.id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.last_login_date || null
  } catch (error) {
    console.error('Error getting last login date:', error)
    return null
  }
}

async function updateLastLoginDate() {
  if (!currentUser) return
  
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert([{ 
        id: currentUser.id,
        last_login_date: today
      }])
    
    if (error) throw error
  } catch (error) {
    console.error('Error updating last login date:', error)
  }
}

// PHOTO PREVIEW FUNCTIONALITY
window.showPhotoPreview = async () => {
  if (!currentUser) {
    alert('Please log in first')
    return
  }
  
  const popup = document.getElementById('photo-preview-popup')
  const content = document.getElementById('photo-preview-content')
  
  // Show loading
  content.innerHTML = '<div style="padding: 20px;">Loading latest photo...</div>'
  popup.classList.add('show')
  
  try {
    // Get the latest photo shared with the current user (not owned by them)
    const { data: images, error } = await supabase
      .from('shared_images')
      .select('*')
      .contains('shared_with_emails', [currentUser.email])
      .neq('owner_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    if (!images || images.length === 0) {
      content.innerHTML = `
        <div class="no-photos">
          <h3>📷 No shared photos yet</h3>
          <p>Wait for someone to share photos with you!</p>
          <div class="popup-buttons">
            <button class="popup-btn popup-btn-secondary" onclick="closePhotoPreview()">
              Close
            </button>
          </div>
        </div>
      `
      return
    }
    
    const latestPhoto = images[0]
    
    content.innerHTML = `
      <img src="${latestPhoto.file_url}" 
           alt="${latestPhoto.filename}" 
           class="latest-photo"
           onclick="openImageModal('${latestPhoto.file_url}')">
      <div class="photo-info">
        <div><strong>${latestPhoto.filename}</strong></div>
        <div>Shared by: ${latestPhoto.owner_email}</div>
        <div>Date: ${new Date(latestPhoto.created_at).toLocaleDateString()}</div>
      </div>
      <div class="popup-buttons">
        <a href="/gallery.html?filter=shared-with-me" target="_blank" class="popup-btn popup-btn-primary">
          🌟 Go to Gallery
        </a>
        <button class="popup-btn popup-btn-secondary" onclick="closePhotoPreview()">
          Close
        </button>
      </div>
    `
    
  } catch (error) {
    console.error('Error loading latest photo:', error)
    content.innerHTML = `
      <div class="no-photos">
        <h3>😢 Error loading photos</h3>
        <p>Something went wrong. Please try again later.</p>
        <div class="popup-buttons">
          <button class="popup-btn popup-btn-secondary" onclick="closePhotoPreview()">
            Close
          </button>
        </div>
      </div>
    `
  }
}

window.closePhotoPreview = (event) => {
  // Only close if clicking on the backdrop, not the content
  if (event && event.target !== event.currentTarget) return
  
  document.getElementById('photo-preview-popup').classList.remove('show')
}

window.openImageModal = (imageUrl) => {
  document.getElementById('modal-image').src = imageUrl
  document.getElementById('image-modal').classList.add('show')
}

window.closeImageModal = () => {
  document.getElementById('image-modal').classList.remove('show')
}

// APP SETUP
async function setupApp() {
  const emoji = document.getElementById("emoji")
  const boing = document.getElementById("boing")
  const counterSpan = document.getElementById("todayCount")

  // Load today's count from database
  let todayCount = await getTodaysBoings()
  
  function updateCounter() {
    counterSpan.textContent = todayCount
  }

  emoji.addEventListener("pointerdown", async () => {
    boing.currentTime = 0
    boing.play()
    
    // Record boing in database
    const success = await recordBoing()
    if (success) {
      todayCount++
      updateCounter()
    }
  })

  // Initial counter update
  updateCounter()

  // File input handler (if exists)
  const input = document.getElementById("imageInput")
  if (input) {
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      document.getElementById('file-name').textContent = `🎉 File ready: ${file.name}`
      await uploadFile(file)
    })
  }
}

// FILE UPLOAD FUNCTION
async function uploadFile(file) {
  if (!currentUser || !file) return
  
  const fileName = `${currentUser.id}/${Date.now()}-${file.name}`
  
  try {
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('pookiepics')
      .upload(fileName, file)
    
    if (uploadError) throw uploadError
    
    // Save record to database
    const { error: dbError } = await supabase
      .from('uploads')
      .insert([{
        user_id: currentUser.id,
        filename: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type
      }])
    
    if (dbError) throw dbError
    
    document.getElementById('file-name').textContent = `✅ ${file.name} uploaded successfully!`
  } catch (error) {
    console.error('Upload error:', error)
    document.getElementById('file-name').textContent = `❌ Upload failed: ${error.message}`
  }
}

// SHOW APP WITH MODAL
window.showApp = async () => {
  const today = new Date().toISOString().split('T')[0]
  const lastLogin = await getLastLoginDate()

  if (lastLogin !== today) {
    const yCount = await getYesterdaysBoings()
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const modal = document.getElementById('boing-modal')
    const modalContent = document.getElementById('boing-modal-content')
    const message = document.getElementById('boing-message')

    message.textContent = `Yesterday (${yesterday}) you boinged ${yCount} time${yCount === 1 ? '' : 's'}.`
    modal.style.display = 'flex'

    requestAnimationFrame(() => {
      modalContent.style.transform = 'scale(1)'
      modalContent.style.opacity = '1'
    })

    document.getElementById('boing-ok').onclick = () => {
      modalContent.style.transform = 'scale(0.9)'
      modalContent.style.opacity = '0'
      setTimeout(() => {
        modal.style.display = 'none'
      }, 300)
    }

    await updateLastLoginDate()
  }

  document.getElementById('login-section').style.display = 'none'
  document.getElementById('app-section').style.display = 'flex'
  await setupApp()
}

// MODAL FUNCTIONS
window.showPasswordModal = () => {
  document.getElementById('password-modal').style.display = 'flex'
}

window.closePasswordModal = () => {
  document.getElementById('password-modal').style.display = 'none'
  document.getElementById('password-change-message').textContent = ''
}

// BOING HISTORY
window.viewBoingHistory = async () => {
  if (!currentUser) return
  
  try {
    const { data, error } = await supabase
      .from('boings')
      .select('boing_date')
      .eq('user_id', currentUser.id)
      .order('boing_date', { ascending: false })
    
    if (error) throw error
    
    // Group by date
    const history = {}
    data.forEach(boing => {
      const date = boing.boing_date
      history[date] = (history[date] || 0) + 1
    })
    
    // Display history
    const historyText = Object.entries(history)
      .map(([date, count]) => `${date}: ${count} boing${count === 1 ? '' : 's'}`)
      .join('\n')
    
    alert('Boing History:\n\n' + (historyText || 'No boing history found'))
  } catch (error) {
    console.error('Error fetching boing history:', error)
    alert('Error loading boing history')
  }
}

// Handle authentication state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    updateCurrentUser(session.user)
  } else if (event === 'SIGNED_OUT') {
    updateCurrentUser(null)
  }
})

// Make setupApp available globally
window.setupApp = setupApp

// Initialize authentication check
checkAuth()