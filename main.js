import Clerk from "https://esm.sh/@clerk/clerk-js@4";

const clerk = new Clerk("pk_test_bWVhc3VyZWQtZ29waGVyLTQwLmNsZXJrLmFjY291bnRzLmRldiQ");
await clerk.load();

const loginSection = document.getElementById("login-section");
const appSection = document.getElementById("app-section");

let signInAttempt = null;

// 📲 Send OTP
document.getElementById("send-code").addEventListener("click", async () => {
  const phone = document.getElementById("phone").value;

  try {
    signInAttempt = await clerk.client.signIn.create({
      strategy: "phone_code",
      phoneNumber: phone,
    });

    await signInAttempt.preparePhoneNumberVerification();
    alert("Code sent!");
  } catch (err) {
    alert("Error sending code: " + (err.errors?.[0]?.message || err.message));
  }
});

// 🔐 Verify OTP
document.getElementById("verify-code").addEventListener("click", async () => {
  const otp = document.getElementById("otp").value;

  try {
    const result = await signInAttempt.attemptPhoneNumberVerification({ code: otp });

    if (result.status === "complete") {
      await clerk.setSession(result.createdSessionId);
      showApp();
      setupApp();
    } else {
      alert("Code invalid or expired.");
    }
  } catch (err) {
    alert("Verification failed: " + (err.errors?.[0]?.message || err.message));
  }
});

// 👁️ Session detection
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

// 🧼 UI management
function showApp() {
  loginSection.style.display = "none";
  appSection.style.display = "flex";
}

function showLogin() {
  loginSection.style.display = "flex";
  appSection.style.display = "none";
}

// 🧸 Pookie app logic
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
