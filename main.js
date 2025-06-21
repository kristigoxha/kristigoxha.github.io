import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAT25FtujsQeqE_pRa5QTZkEqpCfnNkZmU",
  authDomain: "pookie-home.firebaseapp.com",
  projectId: "pookie-home",
  storageBucket: "pookie-home.appspot.com",
  messagingSenderId: "207581484781",
  appId: "1:207581484781:web:62f4ff09533567b66c5ee4",
  measurementId: "G-28118SDJNW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

window.addEventListener('DOMContentLoaded', () => {
  if (!auth) {
    console.error("Firebase Auth not initialized.");
    return;
  }

  window.recaptchaVerifier = new RecaptchaVerifier('sign-in-button', {
    size: 'invisible',
    callback: (response) => {
      sendCode();
    },
    'expired-callback': () => {
      alert("reCAPTCHA expired. Please refresh.");
    }
  }, auth);

  window.recaptchaVerifier.render().then((widgetId) => {
    window.recaptchaWidgetId = widgetId;
  });
});

window.sendCode = function () {
  const phoneNumber = document.getElementById('phone').value;
  const appVerifier = window.recaptchaVerifier;

  signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    .then((confirmationResult) => {
      window.confirmationResult = confirmationResult;
      alert("Verification code sent!");
      document.getElementById('code').focus();
    })
    .catch((error) => {
      console.error("Error sending code:", error);
      alert("Failed to send code: " + error.message);
    });
};

window.verifyCode = function () {
  const code = document.getElementById('code').value;
  window.confirmationResult.confirm(code)
    .then(() => {
      alert("Logged in!");
    })
    .catch((error) => {
      alert("Invalid code. Try again.");
    });
};

window.logout = async function () {
  await signOut(auth);
  location.reload();
};

function showApp() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("app-section").style.display = "flex";
}

function showLogin() {
  document.getElementById("login-section").style.display = "block";
  document.getElementById("app-section").style.display = "none";
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    showApp();
    setupApp();
  } else {
    showLogin();
  }
});

function setupApp() {
  const emoji = document.getElementById('emoji');
  const boing = document.getElementById('boing');
  const counter = document.getElementById('counter');
  const today = new Date().toISOString().split('T')[0];
  const savedData = JSON.parse(localStorage.getItem('boingData')) || {};
  if (savedData.date !== today) {
    savedData.date = today;
    savedData.count = 0;
  }

  function updateCounter() {
    counter.textContent = `Boings today: ${savedData.count}`;
  }

  emoji.addEventListener('pointerdown', () => {
    boing.currentTime = 0;
    boing.play();
    savedData.count++;
    localStorage.setItem('boingData', JSON.stringify(savedData));
    updateCounter();
  });

  updateCounter();

  const input = document.getElementById('imageInput');
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileRef = ref(storage, 'uploads/' + file.name);
    await uploadBytes(fileRef, file);
    alert('Image uploaded!');
  });
}
