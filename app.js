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
  query,
  deleteDoc,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js";

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

// ========================== Initialize Firebase ==========================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========================== Auth Logic ==========================
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

document.getElementById("logout-button")?.addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("Logged out successfully!");
    window.location.href = "index.html";
  });
});

// ========================== Username Setup ==========================
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

// ========================== Chat Logic ==========================
const show = document.getElementById("show");
const input = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

let currentUserEmail = null;

// ========================== Auth State ==========================
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserEmail = user.email;

    // Generate QR code using username
    const qrDiv = document.getElementById("qrcode");
    const username = localStorage.getItem("username") || user.email;
    if (qrDiv) {
      QRCode.toCanvas(qrDiv, username, (error) => {
        if (error) console.error(error);
      });
    }

    if (!username) {
      alert("Please set your username first!");
      window.location.href = "user.html";
    } else {
      loadMessages();
    }

    // Theme toggle
    const themeBtn = document.getElementById("theme-btn");
    const body = document.body;
    const savedTheme = localStorage.getItem("theme") || "light";
    body.setAttribute("data-theme", savedTheme);

    themeBtn?.addEventListener("click", () => {
      const current = body.getAttribute("data-theme");
      const newTheme = current === "light" ? "dark" : "light";
      body.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });

  } else {
    currentUserEmail = null;
    if (!window.location.pathname.endsWith("index.html")) {
      window.location.href = "index.html";
    }
  }
});

// ========================== Send Message ==========================
sendButton?.addEventListener("click", sendMessage);
input?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  const username = localStorage.getItem("username");
  if (!text || !currentUserEmail || !username) return;

  input.value = "";
  input.focus();

  await addDoc(collection(db, "messages"), {
    email: currentUserEmail,
    username,
    text,
    timestamp: serverTimestamp(),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });
}

// ========================== Load Messages ==========================
function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("timestamp"));
  onSnapshot(q, (snapshot) => {
    show.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const msg = docSnap.data();
      const id = docSnap.id;

      const div = document.createElement("div");
      div.classList.add("chat-message");

      // Right for current user, left for others
      if (msg.email === currentUserEmail) div.classList.add("self");
      else div.classList.add("other");

      div.innerHTML = `
        <div class="msg-header">
          <b>${msg.username || msg.email.split("@")[0]}</b> • ${msg.time || ""}
          ${
            msg.email === currentUserEmail
              ? `<span class="msg-actions">
                  <button class="edit-btn" title="Edit">✏️</button>
                  <button class="delete-btn" title="Delete">🗑️</button>
                </span>`
              : ""
          }
        </div>
        <div class="msg-body">${msg.text}</div>
      `;

      // Edit
      const editBtn = div.querySelector(".edit-btn");
      editBtn?.addEventListener("click", async () => {
        const newText = prompt("Edit your message:", msg.text);
        if (newText && newText.trim() !== "") {
          await updateDoc(doc(db, "messages", id), { text: newText });
        }
      });

      // Delete
      const delBtn = div.querySelector(".delete-btn");
      delBtn?.addEventListener("click", async () => {
        if (confirm("Delete this message?")) {
          await deleteDoc(doc(db, "messages", id));
        }
      });

      show.appendChild(div);
    });

    show.scrollTop = show.scrollHeight;
  });
}

// ========================== Emoji Picker ==========================
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");

if (emojiBtn && emojiPicker && input) {
  const emojis = [
    "😀","😃","😄","😁","😆","😅","😂","🤣","🥲","☺️","😊","😇","🙂","🙃","😉",
    "😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓",
    "😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫",
    "🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰",
    "😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧",
    "😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕",
    "🤑","🤠","😈","👿","👹","👺","💀","☠️","👻","👽","👾","🤖","💩","😺","😸",
    "😹","😻","😼","😽","🙀","
