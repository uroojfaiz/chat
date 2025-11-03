// ========================== Firebase Setup ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// ========================== Firebase Config ==========================
const firebaseConfig = {
  apiKey: "AIzaSyAuB_ufAiG-xLCENo55S3vGgCOklsxMiKY",
  authDomain: "real-time-database-6f10c.firebaseapp.com",
  projectId: "real-time-database-6f10c",
  storageBucket: "real-time-database-6f10c.firebasestorage.app",
  messagingSenderId: "988171487513",
  appId: "1:988171487513:web:b93c137ae9f75e954a5d88",
  measurementId: "G-STZ7XGVBHH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========================== AUTH FUNCTIONS ==========================

// SIGNUP
document.getElementById("sign-create")?.addEventListener("click", () => {
  const email = document.getElementById("sign-email").value;
  const password = document.getElementById("sign-password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Account created successfully!");
      window.location.href = "user.html";
    })
    .catch((err) => alert(err.message));
});

// LOGIN
document.getElementById("login-button")?.addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login successful!");
      window.location.href = "user.html";
    })
    .catch((err) => alert(err.message));
});

// LOGOUT
document.getElementById("logout-button")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Logged out successfully!");
      window.location.href = "index.html";
    })
    .catch((err) => alert(err.message));
});

// ========================== USERNAME ==========================
document.getElementById("username-set")?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (username) {
    localStorage.setItem("username", username);
    window.location.href = "chat.html";
  } else {
    alert("Please enter a valid username.");
  }
});

// ========================== CHAT SYSTEM ==========================
const show = document.getElementById("show");
const input = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
let currentUserEmail = null;

// Check Login User
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserEmail = user.email;
    console.log("Logged in:", currentUserEmail);
    loadMessages();
  } else {
    console.log("No user logged in");
    currentUserEmail = null;
  }
});

// Send Message
sendButton?.addEventListener("click", sendMessage);
input?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text || !currentUserEmail) return;

  input.value = ""; // ✅ clear input instantly
  input.focus();

  await addDoc(collection(db, "messages"), {
    email: currentUserEmail,
    text,
    timestamp: serverTimestamp(),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });
}

// Load Messages (Right/Left Alignment)
function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("timestamp"));
  onSnapshot(q, (snapshot) => {
    show.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.classList.add("chat-message");
      if (msg.email === currentUserEmail) div.classList.add("self");

      div.innerHTML = `
        <div class="msg-header">
          <b>${msg.email.split("@")[0]}</b> • ${msg.time || ""}
        </div>
        <div class="msg-body">${msg.text}</div>
      `;
      show.appendChild(div);
    });
    show.scrollTop = show.scrollHeight;
  });
}

// ========================== EMOJI PICKER ==========================
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");

if (emojiBtn && emojiPicker && input) {
  const emojis = ["😀","😂","🤣","😍","😘","😎","😇","😢","😭","😡","😋","🥳","👍","🙏","👏","🔥","❤"];
  emojis.forEach((e) => {
    const span = document.createElement("span");
    span.textContent = e;
    span.style.cursor = "pointer";
    span.addEventListener("click", () => {
      input.value += e;
      emojiPicker.style.display = "none";
    });
    emojiPicker.appendChild(span);
  });

  emojiBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    emojiPicker.style.display = emojiPicker.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target))
      emojiPicker.style.display = "none";
  });
}

// ========================== SCROLL FIX ==========================
window.addEventListener("load", () => {
  const chatContainer = document.getElementById("show");
  const chatBox = document.querySelector(".chat");
  const inputArea = document.querySelector(".input-area");

  if (chatContainer && chatBox && inputArea) {
    const updateScrollArea = () => {
      const availableHeight = chatBox.clientHeight - inputArea.offsetHeight - 20;
      chatContainer.style.maxHeight = `${availableHeight}px`;
      chatContainer.style.overflowY = "auto";
    };
    updateScrollArea();
    window.addEventListener("resize", updateScrollArea);
  }
});
