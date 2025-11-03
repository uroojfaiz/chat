// ========================== Firebase Setup ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
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
  query,
  deleteDoc,
  doc,
  updateDoc,
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

// ========================== Initialization ==========================
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// ========================== AUTH SYSTEM ==========================

// SIGN UP
document.getElementById("sign-create")?.addEventListener("click", () => {
  const email = document.getElementById("sign-email").value.trim();
  const password = document.getElementById("sign-password").value.trim();

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("✅ Account created successfully!");
      window.location.href = "user.html";
    })
    .catch((error) => alert(error.message));
});

// LOGIN
document.getElementById("login-button")?.addEventListener("click", () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("✅ Logged in successfully!");
      window.location.href = "user.html";
    })
    .catch((error) => alert(error.message));
});

// LOGOUT
document.getElementById("logout-button")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("👋 Logged out successfully!");
      window.location.href = "index.html";
    })
    .catch((error) => alert(error.message));
});
// ========================== USERNAME ==========================
document.getElementById("username-set")?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (username) {
    localStorage.setItem("username", username);
    alert("Username saved!");
    window.location.href = "chat.html";
  } else {
    alert("Please enter a valid username.");
  }
});

// ========================== THEME CHANGE ==========================
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
}
document.getElementById("theme")?.addEventListener("click", () => {
  document.body.style.backgroundColor = getRandomColor();
});

// ========================== QR Code ==========================
const qrToggle = document.getElementById("qr-toggle");
const qrContainer = document.getElementById("qr-container");

if (qrToggle && qrContainer) {
  qrToggle.addEventListener("click", () => {
    qrContainer.style.display =
      qrContainer.style.display === "flex" ? "none" : "flex";
  });
}
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";
script.onload = () => {
  QRCode.toCanvas(
    document.getElementById("qrcode"),
    window.location.href,
    { width: 120, margin: 2 },
    (error) => {
      if (error) console.error(error);
    }
  );
};
document.head.appendChild(script);

// ========================== CHAT SYSTEM ==========================
const show = document.getElementById("show");
const input = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

let currentUserEmail = null;

// User Auth Check
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserEmail = user.email;
    loadMessages();
  } else {
    currentUserEmail = null;
  }
});

// Load Messages from Firestore
function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("timestamp"));
  onSnapshot(q, (snapshot) => {
    show.innerHTML = "";
    snapshot.forEach((docItem) => {
      const msg = docItem.data();
      const id = docItem.id;

      const div = document.createElement("div");
      div.classList.add("chat-message");
      if (msg.email === currentUserEmail) div.classList.add("self");

      div.innerHTML = `
        <div class="msg-header">
          <b>${msg.email.split("@")[0]}</b> • ${msg.time || ""}
          ${
            msg.email === currentUserEmail
              ? `<div class="msg-actions">
                   <button class="edit-btn" title="Edit">✏</button>
                   <button class="delete-btn" title="Delete">🗑</button>
                 </div>`
              : ""
          }
        </div>
        <div class="msg-body">${msg.text}</div>
      `;

      // Delete Message
      div.querySelector(".delete-btn")?.addEventListener("click", async () => {
        await deleteDoc(doc(db, "messages", id));
      });

      // Edit Message
      div.querySelector(".edit-btn")?.addEventListener("click", async () => {
        const newText = prompt("✏ Edit your message:", msg.text);
        if (newText && newText.trim() !== "") {
          await updateDoc(doc(db, "messages", id), { text: newText });
        }
      });

      show.appendChild(div);
      show.scrollTop = show.scrollHeight;
    });
  });
}

// Send Message
sendButton?.addEventListener("click", sendMsg);
input?.addEventListener("keypress", (e) => e.key === "Enter" && sendMsg());

async function sendMsg() {
  const text = input.value.trim();
  if (text === "" || !currentUserEmail) return;

  await addDoc(collection(db, "messages"), {
    email: currentUserEmail,
    text,
    timestamp: serverTimestamp(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  input.value = "";
  show.scrollTop = show.scrollHeight;
}

// ========================== EMOJI PICKER ==========================
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");

if (emojiBtn && emojiPicker && input) {
  const emojis = [
    "😀","😃","😄","😁","😆","😂","🤣","😊","😍","😘","😜","🤔",
    "😎","😢","😭","😡","😇","🥰","😴","😋","🙄","🤩","🤗","🥳",
    "👍","👎","🙏","👏","🔥","💯","❤","💔","✨","🌟","😻","🤖"
  ];
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
    emojiPicker.style.display =
      emojiPicker.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target))
      emojiPicker.style.display = "none";
  });
}

// ========================== SCROLL FIX ==========================
function adjustChatHeight() {
  const chatBox = document.querySelector(".chat");
  const inputArea = document.querySelector(".input-area");
  const chatContainer = document.getElementById("show");

  if (chatBox && inputArea && chatContainer) {
    const availableHeight =
      chatBox.getBoundingClientRect().height - inputArea.offsetHeight - 30;
    chatContainer.style.maxHeight = `${availableHeight}px`;
    chatContainer.style.overflowY = "auto";
  }
}
window.addEventListener("load", adjustChatHeight);
window.addEventListener("resize", adjustChatHeight);
