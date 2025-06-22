import Clerk from "https://esm.sh/@clerk/clerk-js@4";

const clerk = new Clerk("pk_test_bWVhc3VyZWQtZ29waGVyLTQwLmNsZXJrLmFjY291bnRzLmRldiQ");
await clerk.load();

const loginSection = document.getElementById("login-section");
const appSection = document.getElementById("app-section");

// 🔑 Send email magic link
document.getElementById("send-magic-link").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();

  try {
    await clerk.client.signIn.create({
      identifier: email,
      strategy: "email_link",
    });

    alert("Check your email for the magic login link.");
  } catch (err) {
    alert("Error: " + (err.errors?.[0]?.message || err.message));
  }
});

// 📦 Auth state detection
clerk.addListener(async () => {
  const user = await clerk.user;
  if (user) {
    showApp();
    setupApp();
  } else {
    showLogin();
  }
});

// 🔓 Logout
window.logout = async () => {
  await clerk.signOut();
  location.reload();
};

// 🧼 UI show/hide
function showApp() {
  loginSection.style.display = "none";
  appSection.style.display = "flex";
}

function showLogin() {
  loginSection.style.display = "flex";
  appSection.style.display = "none";
}

// 🎎 Pookie app logic
function setupApp() {
  const emoji = document.getElementById("emoji");
  const boing = document.getElementById("boing");
  const counter = document.getElementById("counter");
  const today = new Date().toISOString().split("T")[0];
  const data = JSON.parse(localStorage.getItem("boingData")) || { date: today, count: 0 };

  if (data.date !== today) {
    data.date = today;
    data.count = 0;
  }

  function updateCounter() {
    counter.textContent = `Boings today: ${data.count}`;
  }

  emoji.addEventListener("pointerdown", () => {
    boing.currentTime = 0;
    boing.play();
    data.count++;
    localStorage.setItem("boingData", JSON.stringify(data));
    updateCounter();
  });

  updateCounter();

  const input = document.getElementById("imageInput");
  input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    alert("Image selected — upload not implemented yet.");
  });
}
