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
  getDatabase,
  ref,
  push,
  onChildAdded,
  remove,
  update,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

// ========================== Initialize ==========================
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);
const dbRT = getDatabase(app); // Realtime Database
const db = dbRT; // Firestore fallback if needed

// ========================== User & Auth ==========================
const currentUsername = localStorage.getItem("username") || "Unknown";

// SIGNUP
document.getElementById("sign-create")?.addEventListener("click", () => {
  const email = document.getElementById("sign-email").value;
  const password = document.getElementById("sign-password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("User created successfully");
      window.location.href = "user.html";
    })
    .catch((error) => alert(error.message));
});

// LOGIN
document.getElementById("login-button")?.addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("User logged in successfully");
      window.location.href = "user.html";
    })
    .catch((error) => alert(error.message));
});

// LOGOUT
document.getElementById("logout-button")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("User logged out successfully");
      window.location.href = "index.html";
    })
    .catch((error) => alert(error.message));
});

// AUTH STATE CHANGE
let currentUserEmail = null;
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserEmail = user.email;
  } else {
    currentUserEmail = null;
  }
});

// ========================== THEME TOGGLE ==========================
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

// ========================== CHAT ==========================
const chatDiv = document.getElementById("show");
const inputField = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");
const typingDiv = document.getElementById("typing-indicator");
const messagesRef = ref(dbRT, "messages");

// SEND MESSAGE
sendBtn?.addEventListener("click", sendMessage);
inputField?.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

function sendMessage() {
  const msg = inputField.value.trim();
  if (!msg || !currentUserEmail) return;

  push(messagesRef, {
    username: currentUsername,
    email: currentUserEmail,
    text: msg,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  inputField.value = "";
  update(ref(dbRT, `typing/${currentUsername}`), { typing: false });
}

// SHOW MESSAGES
onChildAdded(messagesRef, data => {
  const msg = data.val();
  const isMine = msg.email === currentUserEmail;

  const msgDiv = document.createElement("div");
  msgDiv.style.margin = "5px 10px";
  msgDiv.style.padding = "5px 8px";
  msgDiv.style.borderRadius = "8px";
  msgDiv.style.maxWidth = "70%";
  msgDiv.style.clear = "both";

  if (isMine) {
    msgDiv.style.backgroundColor = "#DCF8C6";
    msgDiv.style.float = "right";
    msgDiv.style.textAlign = "right";
  } else {
    msgDiv.style.backgroundColor = "#FFF";
    msgDiv.style.float = "left";
    msgDiv.style.textAlign = "left";
  }

  msgDiv.innerHTML = `
    <div class="msg-header">
      <b>${msg.username}</b> • ${msg.time}
      ${
        isMine
          ? `<div class="msg-actions">
              <button class="edit-btn">✏️</button>
              <button class="delete-btn">🗑️</button>
            </div>`
          : ""
      }
    </div>
    <div class="msg-text">${msg.text}</div>
  `;

  chatDiv.appendChild(msgDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;

  // EDIT
  msgDiv.querySelector(".edit-btn")?.addEventListener("click", () => {
    const newText = prompt("Edit your message:", msg.text);
    if (newText && newText.trim() !== "") {
      update(ref(dbRT, `messages/${data.key}`), { text: newText });
      msgDiv.querySelector(".msg-text").textContent = newText;
    }
  });

  // DELETE
  msgDiv.querySelector(".delete-btn")?.addEventListener("click", () => {
    remove(ref(dbRT, `messages/${data.key}`));
    msgDiv.remove();
  });
});

// ========================== TYPING INDICATOR ==========================
const typingRef = ref(dbRT, "typing/" + currentUsername);
let typingTimeout;
let dotsInterval;

inputField.addEventListener("input", () => {
  update(typingRef, { typing: true });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    update(typingRef, { typing: false });
  }, 1000);
});

const allTypingRef = ref(dbRT, "typing");
onChildAdded(allTypingRef, snap => updateTypingStatus(snap.key, snap.val()));
onChildChanged(allTypingRef, snap => updateTypingStatus(snap.key, snap.val()));

function updateTypingStatus(user, data) {
  if (user === currentUsername) return;
  if (data.typing) startDotsAnimation(user);
  else stopDotsAnimation();
}

function startDotsAnimation(user) {
  stopDotsAnimation();
  let dots = 0;
  typingDiv.textContent = `${user} is typing`;
  dotsInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    typingDiv.textContent = `${user} is typing${'.'.repeat(dots)}`;
  }, 500);
}

function stopDotsAnimation() {
  clearInterval(dotsInterval);
  typingDiv.textContent = "";
}

// ========================== EMOJI PICKER ==========================
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");

if (emojiBtn && emojiPicker && inputField) {
  const emojis = [
    "😀","😃","😄","😁","😆","😅","😂","🤣","🥲","☺️","😊","😇","🙂","🙃","😉",
    "😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓",
    "😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫",
    "🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥",
    "😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮",
    "😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑",
    "🤠","😈","👿","👹","👺","💀","☠️","👻","👽","👾","🤖","💩","😺","😸","😹",
    "😻","😼","😽","🙀","😿","😾","🫣","🫡","🫢","🫥","❤️","🧡","💛","💚","💙",
    "💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","💌",
    "🔥","✨","⚡","💥","💫","💦","💨","🕳️","💣","💬","👁️‍🗨️","🗨️","🗯️","💭",
    "💤","👍","👎","👏","🙌","👐","🤲","🙏","🤝","🤞","✌️","🤟","🤘","👌","👈",
    "👉","👆","🖕","👇","☝️","✋","🤚","🖐️","🖖","👋","🤙","💪","🦾","🦵","🦿",
    "🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄","💋","🩸",
    "🫦","🫧","🫠","🫤","🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁",
    "🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺",
    "🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🪲","🪳","🦟","🦗","🕷️","🕸️",
    "🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬",
    "🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦙",
    "🦒","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦌","🐐","🦃","🐓","🐇","🦝","🦨",
    "🦡","🦦","🦥","🐁","🐀","🐿️","🦔"]
