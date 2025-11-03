// ========================== Firebase Setup ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded, remove, update } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { collection, addDoc, serverTimestamp, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const dbRT = getDatabase(app); // Realtime DB
const chatDiv = document.getElementById("show");
const inputField = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");

let currentUserEmail = null;
let currentUsername = localStorage.getItem("username") || "Unknown";

// ========================== Auth ==========================
document.getElementById("sign-create")?.addEventListener("click", () => {
  const email = document.getElementById("sign-email").value;
  const password = document.getElementById("sign-password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => { alert("User created"); window.location.href = "user.html"; })
    .catch(err => alert(err.message));
});

document.getElementById("login-button")?.addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => { alert("Logged in"); window.location.href = "user.html"; })
    .catch(err => alert(err.message));
});

document.getElementById("logout-button")?.addEventListener("click", () => {
  signOut(auth).then(() => { alert("Logged out"); window.location.href = "index.html"; });
});

onAuthStateChanged(auth, user => {
  if (user) currentUserEmail = user.email;
  else currentUserEmail = null;
});

// ========================== Username ==========================
document.getElementById("username-set")?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (username) { localStorage.setItem("username", username); alert("Username saved"); window.location.href = "chat.html"; }
  else alert("Enter a valid username");
});

// ========================== Send Message ==========================
sendBtn?.addEventListener("click", sendMessage);
inputField?.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

function sendMessage() {
  const text = inputField.value.trim();
  if (!text || !currentUserEmail) return;

  // Push to Realtime DB
  const messagesRef = ref(dbRT, "messages");
  push(messagesRef, {
    username: currentUsername,
    email: currentUserEmail,
    text,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  inputField.value = "";
  scrollToBottom();
}

// ========================== Load Messages ==========================
const messagesRef = ref(dbRT, "messages");
onChildAdded(messagesRef, data => {
  const msg = data.val();
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("chat-message");
  if (msg.email === currentUserEmail) msgDiv.classList.add("self");
  else msgDiv.classList.add("other");
  msgDiv.dataset.key = data.key;

  msgDiv.innerHTML = `
    <div class="msg-header">
      <b>${msg.username}</b> • ${msg.time}
      ${
        msg.email === currentUserEmail
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
  scrollToBottom();

  // Edit
  msgDiv.querySelector(".edit-btn")?.addEventListener("click", () => {
    const newText = prompt("Edit your message:", msg.text);
    if (newText && newText.trim() !== "") {
      update(ref(dbRT, `messages/${data.key}`), { text: newText });
      msgDiv.querySelector(".msg-text").textContent = newText;
    }
  });

  // Delete
  msgDiv.querySelector(".delete-btn")?.addEventListener("click", () => {
    remove(ref(dbRT, `messages/${data.key}`));
    msgDiv.remove();
  });
});

// ========================== Scroll Control ==========================
function scrollToBottom() { if (chatDiv) chatDiv.scrollTop = chatDiv.scrollHeight; }
window.addEventListener("load", () => {
  const chatBox = document.querySelector(".chat");
  const inputArea = document.querySelector(".input-area");
  const updateScrollArea = () => {
    const availableHeight = chatBox.clientHeight - inputArea.offsetHeight - 20;
    chatDiv.style.maxHeight = `${availableHeight}px`;
    chatDiv.style.overflowY = "auto";
  };
  updateScrollArea();
  window.addEventListener("resize", updateScrollArea);
});

// ========================== Emoji Picker ==========================
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
    "🦡","🦦","🦥","🐁","🐀","🐿️","🦔"
  ];

  emojis.forEach(e => {
    const span = document.createElement("span");
    span.textContent = e;
    span.style.cursor = "pointer";
    span.addEventListener("click", () => { inputField.value += e; emojiPicker.style.display = "none"; });
    emojiPicker.appendChild(span);
  });

  emojiBtn.addEventListener("click", e => { e.stopPropagation(); emojiPicker.style.display = emojiPicker.style.display === "block" ? "none" : "block"; });
  document.addEventListener("click", e => { if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) emojiPicker.style.display = "none"; });
}

// ========================== Theme Toggle ==========================
document.getElementById("theme")?.addEventListener("click", () => {
  const color = "#" + Math.floor(Math.random()*16777215).toString(16);
  document.body.style.backgroundColor = color;
});

// ========================== QR Code ==========================
const qrToggle = document.getElementById("qr-toggle");
const qrContainer = document.getElementById("qr-container");
if (qrToggle && qrContainer) {
  qrToggle.addEventListener("click", () => { qrContainer.style.display = qrContainer.style.display === "flex" ? "none" : "flex"; });
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";
  script.onload = () => {
    QRCode.toCanvas(document.getElementById("qrcode"), currentUsername, { width: 120, margin: 2 }, err => { if (err) console.error(err); });
  };
  document.head.appendChild(script);
}
