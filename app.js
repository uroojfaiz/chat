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
getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

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

//onAuthStateChanged

onAuthStateChanged(auth, (user) => {
  if (user) {
   console.log("User is logged in:", user.email);
  } else {
   console.log("No user is logged in.");
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

// ========================== CHAT SYSTEM ==========================
const chatDiv = document.getElementById("show");
const messagesRef = ref(db, "messages");
const inputField = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");

// SEND MESSAGE
sendBtn?.addEventListener("click", sendMessage);
inputField?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const msg = inputField.value.trim();
  if (!msg) return;

  push(messagesRef, {
    username: currentUsername,
    message: msg,
    time: new Date().toLocaleTimeString(),
  });

  inputField.value = "";
  scrollToBottom();
}

// SHOW MESSAGES
if (chatDiv) {
  onChildAdded(messagesRef, (data) => {
    const msg = data.val();
    const isMine = msg.username === currentUsername;

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("chat-message");
    if (isMine) msgDiv.classList.add("self");
    msgDiv.dataset.key = data.key;

    msgDiv.innerHTML = `
      <div class="msg-header">
        <span><b>${msg.username}</b> • ${msg.time}</span>
        ${
          isMine
            ? `<div class="msg-actions">
                <button class="edit-btn" title="Edit">✏</button>
                <button class="delete-btn" title="Delete">🗑</button>
              </div>`
            : ""
        }
      </div>
      <div class="msg-text">${msg.message}</div>
    `;

    chatDiv.appendChild(msgDiv);
    scrollToBottom();

    // DELETE
    msgDiv.querySelector(".delete-btn")?.addEventListener("click", () => {
      remove(ref(db, `messages/${data.key}`));
      msgDiv.remove();
    });

    // EDIT
    msgDiv.querySelector(".edit-btn")?.addEventListener("click", () => {
      const newText = prompt("Edit your message:", msg.message);
      if (newText && newText.trim() !== "") {
        update(ref(db, `messages/${data.key}`), { message: newText });
        msgDiv.querySelector(".msg-text").textContent = newText;
      }
    });
  });
}

// ========================== EMOJI PICKER ==========================
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");

if (emojiBtn && emojiPicker && inputField) {
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
      inputField.value += e;
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

// ========================== SCROLL CONTROL (JS ONLY) ==========================
const chatContainer = document.getElementById("show");

function scrollToBottom() {
  if (chatContainer)
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function enableScrollOnOverflow() {
  if (!chatContainer) return;
  const observer = new MutationObserver(() => {
    const overflow = chatContainer.scrollHeight > chatContainer.clientHeight;
    chatContainer.style.overflowY = overflow ? "auto" : "hidden";
    scrollToBottom();
  });
  observer.observe(chatContainer, { childList: true, subtree: true });
}

window.addEventListener("load", enableScrollOnOverflow);

// ✅ Proper scroll fix without overlapping input
window.addEventListener("load", () => {
  const chatContainer = document.getElementById("show");
  if (chatContainer) {
    // Automatically calculate height to fit above input area
    const chatBox = document.querySelector(".chat");
    const inputArea = document.querySelector(".input-area");

    const updateScrollArea = () => {
      const chatBoxRect = chatBox.getBoundingClientRect();
      const inputHeight = inputArea.offsetHeight;
      const availableHeight = chatBoxRect.height - inputHeight - 30; // some margin
      chatContainer.style.maxHeight = `${availableHeight}px`;
      chatContainer.style.overflowY = "auto";
    };

    // run once and on resize
    updateScrollArea();
    window.addEventListener("resize", updateScrollArea);
  }
});