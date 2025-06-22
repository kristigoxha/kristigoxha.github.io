import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ✅ Supabase project credentials
const supabase = createClient(
  'https://bcjmlhxuakqqqdjrtntj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjam1saHh1YWtxcXFkanJ0bnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTMxMzYsImV4cCI6MjA2NjE2OTEzNn0.3vV15QSv4y3mNRJfARPHlk-GvJGO65r594ss5kSGK3Y'
);

// ⏩ Handle login via email magic link
document.getElementById("login-button").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("Check your email for the magic login link.");
  }
});

// 🔄 Check session on page load
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    showApp();
    setupApp();
  } else {
    showLogin();
  }
});

// 🔁 Listen for login state changes (e.g. after magic link returns)
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    showApp();
    setupApp();
  } else {
    showLogin();
  }
});

// 🔓 Logout
window.logout = async function () {
  await supabase.auth.signOut();
  location.reload();
};

// 👀 Show/hide UI
function showApp() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("app-section").style.display = "flex";
}

function showLogin() {
  document.getElementById("login-section").style.display = "block";
  document.getElementById("app-section").style.display = "none";
}

// 🧸 App logic
function setupApp() {
  const emoji = document.getElementById("emoji");
  const boing = document.getElementById("boing");
  const counter = document.getElementById("counter");
  const today = new Date().toISOString().split("T")[0];
  const savedData = JSON.parse(localStorage.getItem("boingData")) || {};

  if (savedData.date !== today) {
    savedData.date = today;
    savedData.count = 0;
  }

  function updateCounter() {
    counter.textContent = `Boings today: ${savedData.count}`;
  }

  emoji.addEventListener("pointerdown", () => {
    boing.currentTime = 0;
    boing.play();
    savedData.count++;
    localStorage.setItem("boingData", JSON.stringify(savedData));
    updateCounter();
  });

  updateCounter();

  const input = document.getElementById("imageInput");
  input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    alert("Image selected, but upload to Supabase not implemented yet.");
    // Optional: implement Supabase Storage upload here
  });
}
