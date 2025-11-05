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
  getDatabase,
  ref,
  push,
  onChildAdded,
  onChildChanged,
  remove,
  update,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

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
const auth = getAuth(app);
const db = getDatabase(app);

// ========================== DOM references ==========================
const chatDiv = document.getElementById("show");
const inputField = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");
const qrToggle = document.getElementById("qr-toggle");
const qrContainer = document.getElementById("qr-container");
const themeBtn = document.getElementById("theme");
const logoutBtn = document.getElementById("logout");
const loginBtn = document.getElementById("login-button");
const signCreateBtn = document.getElementById("sign-create");
const usernameSetBtn = document.getElementById("username-set");

// ========================== Globals ==========================
let currentUserEmail = null;
let currentUsername = localStorage.getItem("username") || "Unknown";

// ========================== Auth =====================================
// SIGN UP
signCreateBtn?.addEventListener("click", () => {
  const email = document.getElementById("sign-email").value.trim();
  const password = document.getElementById("sign-password").value.trim();
  if (!email || !password) return alert("Enter email & password");
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Account created!");
      window.location.href = "user.html";
    })
    .catch((err) => alert(err.message));
});

// LOGIN
loginBtn?.addEventListener("click", () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  if (!email || !password) return alert("Enter email & password");
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Logged in");
      window.location.href = "user.html";
    })
    .catch((err) => alert(err.message));
});

// LOGOUT
logoutBtn?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Logged out");
      window.location.href = "index.html";
    })
    .catch((err) => alert(err.message));
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserEmail = user.email;
   
    if (currentUsername) {
      startListeners();
    }
  } else {
    currentUserEmail = null;
  }
});

// USERNAME SET
usernameSetBtn?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Enter a valid username");
  localStorage.setItem("username", username);
  currentUsername = username;
  alert("Username saved");
  window.location.href = "chat.html";
});

// ========================== Theme (global) ==========================

document.getElementById("theme")?.addEventListener("click", () => {

  const color1 = "#" + Math.floor(Math.random()*16777215).toString(16);
  const color2 = "#" + Math.floor(Math.random()*16777215).toString(16);
  document.body.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;
});



// ========================== QR Code ==========================
if (qrToggle && qrContainer) {
  qrToggle.addEventListener("click", () => {
    qrContainer.style.display = qrContainer.style.display === "flex" ? "none" : "flex";
  });

  // load QR library and draw
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";
  script.onload = () => {
    const canvas = document.getElementById("qrcode");
    if (canvas) {
      QRCode.toCanvas(canvas, window.location.href, { width: 140, margin: 2 }).catch(console.error);
    }
  };
  document.head.appendChild(script);
}

// ========================== Emoji Picker ==========================
const emojis = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","🥲","☺️","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗",
  "😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕",
  "🙁","☹️","😣","😖","😫","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥",
  "😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪",
  "👍","👎","👏","🙌","👐","🙏","🤝","✌️","🤞","👌","👋","💪","🫶","💖","💘","💝","💞","💓","💗","💜",
  "❤️","🧡","💛","💚","💙","🤍","🖤","💔","🔥","✨","⚡","💥","💫","💦","💨","💣","💬","💭","💤",
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🍎","🍊","🍋","🍌","🍉"
];

if (emojiBtn && emojiPicker && inputField) {
  emojiBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    emojiPicker.style.display = emojiPicker.style.display === "block" ? "none" : "block";
  });

  emojis.forEach(e => {
    const span = document.createElement("span");
    span.textContent = e;
    span.style.cursor = "pointer";
    span.style.padding = "4px";
    span.style.fontSize = "20px";
    span.addEventListener("click", () => {
      inputField.value += e;
      emojiPicker.style.display = "none";
      inputField.focus();
    });
    emojiPicker.appendChild(span);
  });

  document.addEventListener("click", (e) => {
    if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
      emojiPicker.style.display = "none";
    }
  });
}

// ========================== Chat: send / receive ==========================
function sendMessage() {
  const text = inputField?.value?.trim();
  if (!text || !currentUserEmail) return;
  const messagesRef = ref(db, "messages");
  push(messagesRef, {
    username: currentUsername,
    email: currentUserEmail,
    text,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    theme: null,
    createdAt: Date.now(),
  });
  inputField.value = "";
  scrollToBottom();
}
sendBtn?.addEventListener("click", sendMessage);
inputField?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// helper to scroll
function scrollToBottom() {
  if (!chatDiv) return;
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// ========================== Typing indicator (Realtime DB) ==========================
let typingTimer;
function setTypingFlag(on) {
  if (!currentUsername) return;
  const tRef = ref(db, `typing/${currentUsername}`);
  set(tRef, { typing: on, ts: Date.now() }).catch(()=>{});
}

inputField?.addEventListener("input", () => {
  setTypingFlag(true);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => setTypingFlag(false), 1200);
});

// show typing indicator element (insert after show)
let typingIndicator = document.getElementById("typing-indicator");
if (!typingIndicator) {
  typingIndicator = document.createElement("div");
  typingIndicator.id = "typing-indicator";
  typingIndicator.style.padding = "6px 12px";
  typingIndicator.style.fontStyle = "italic";
  typingIndicator.style.color = "#333";
  if (chatDiv?.parentNode) chatDiv.parentNode.insertBefore(typingIndicator, chatDiv.nextSibling);
}

// listen for typing changes
const typingRootRef = ref(db, "typing");
onChildChanged(typingRootRef, (snap) => {
  const who = snap.key;
  const data = snap.val();
  if (who === currentUsername) return;
  if (data && data.typing) startDots(who);
  else stopDots();
});
onChildAdded(typingRootRef, (snap) => {
  const who = snap.key;
  const data = snap.val();
  if (who === currentUsername) return;
  if (data && data.typing) startDots(who);
});

// animate dots
let dotsInterval;
function startDots(user) {
  stopDots();
  let dots = 0;
  typingIndicator.textContent = `${user} is typing`;
  dotsInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    typingIndicator.textContent = `${user} is typing${".".repeat(dots)}`;
  }, 400);
}
function stopDots() {
  if (dotsInterval) clearInterval(dotsInterval);
  typingIndicator.textContent = "";
}

// ========================== Load & render messages ==========================
function startListeners() {
  // messages listener
  const messagesRef = ref(db, "messages");
  onChildAdded(messagesRef, (snapshot) => {
    const msg = snapshot.val();
    const key = snapshot.key;
    renderMessage(msg, key);
  });

  // react to message updates (for theme / edit)
  onChildChanged(messagesRef, (snapshot) => {
    const msg = snapshot.val();
    const key = snapshot.key;
    const existing = document.querySelector(`[data-key="${key}"]`);
    if (existing) {
      // update text
      const body = existing.querySelector(".msg-text");
      if (body) body.textContent = msg.text || "";
      // update theme
      applyThemeToBubble(existing, msg.theme);
    }
  });

  // remove handling
  const messagesRemRef = ref(db, "messages");
  onChildChanged(messagesRemRef, () => {}); // placeholder to ensure realtime updates
}

// helper: create avatar
function makeAvatar(name) {
  const initial = (name && name[0]) ? name[0].toUpperCase() : "?";
  const el = document.createElement("div");
  el.className = "msg-avatar";
  el.textContent = initial;
  // inline style fallback (if CSS missing)
  el.style.width = "36px";
  el.style.height = "36px";
  el.style.borderRadius = "50%";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.fontWeight = "700";
  el.style.marginRight = "8px";
  el.style.background = "linear-gradient(135deg,#06b7b8,#049c9d)";
  el.style.color = "#fff";
  return el;
}

// apply theme to bubble (supports color string or gradient)
function applyThemeToBubble(bubble, theme) {
  if (!bubble) return;
  if (theme) {
    bubble.style.background = theme;
    // choose text color based on contrast if simple hex
    if (typeof theme === "string" && theme.startsWith("#")) {
      const c = theme.replace("#", "");
      if (c.length === 3) {
        const r = parseInt(c[0] + c[0], 16);
        const g = parseInt(c[1] + c[1], 16);
        const b = parseInt(c[2] + c[2], 16);
        const yiq = (r*299 + g*587 + b*114)/1000;
        bubble.style.color = yiq >= 128 ? "#000" : "#000";
      }
    }
  } else {
    // default based on self/other
    if (bubble.classList.contains("self")) {
      bubble.style.background = "#DCF8C6";
      bubble.style.color = "#000";
    } else {
      bubble.style.background = "#FFFFFF";
      bubble.style.color = "#000";
    }
  }
}

// render a message bubble
function renderMessage(msg, key) {
  if (!chatDiv) return;
  // avoid duplicate if already exists
  if (document.querySelector(`[data-key="${key}"]`)) return;

  const wrapper = document.createElement("div");
  wrapper.className = "chat-message";
  wrapper.dataset.key = key;
  wrapper.style.maxWidth = "72%";
  wrapper.style.margin = "8px";
  wrapper.style.padding = "10px";
  wrapper.style.borderRadius = "12px";
  wrapper.style.wordBreak = "break-word";
  wrapper.style.position = "relative";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";

  // alignment
  if (msg.email === currentUserEmail) {
    wrapper.classList.add("self");
    wrapper.style.alignSelf = "flex-end";
    wrapper.style.textAlign = "right";
  } else {
    wrapper.classList.add("other");
    wrapper.style.alignSelf = "flex-start";
    wrapper.style.textAlign = "left";
  }

  // header row: avatar + name + time
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "8px";

  const avatar = makeAvatar(msg.username || (msg.email ? msg.email.split("@")[0] : "U"));
  header.appendChild(avatar);

  const nameWrap = document.createElement("div");
  nameWrap.style.display = "flex";
  nameWrap.style.flexDirection = "column";
  const nameEl = document.createElement("div");
  nameEl.style.fontWeight = "700";
  nameEl.textContent = msg.username || (msg.email ? msg.email.split("@")[0] : "Unknown");
  const timeEl = document.createElement("div");
  timeEl.style.fontSize = "12px";
  timeEl.style.opacity = "0.7";
  timeEl.textContent = msg.time || "";

  nameWrap.appendChild(nameEl);
  nameWrap.appendChild(timeEl);
  header.appendChild(nameWrap);

  // actions button placeholder (not visible by default)
  const actionsBtn = document.createElement("button");
  actionsBtn.textContent = "⋯";
  actionsBtn.title = "Options";
  actionsBtn.style.position = "absolute";
  actionsBtn.style.top = "6px";
  actionsBtn.style.right = "6px";
  actionsBtn.style.background = "transparent";
  actionsBtn.style.border = "none";
  actionsBtn.style.cursor = "pointer";
  actionsBtn.style.fontSize = "16px";
  actionsBtn.style.display = "none"; // we'll show menu on wrapper click instead
  wrapper.appendChild(actionsBtn);

  // body
  const body = document.createElement("div");
  body.className = "msg-text";
  body.style.marginTop = "8px";
  body.textContent = msg.text || "";

  wrapper.appendChild(header);
  wrapper.appendChild(body);

  // apply theme if exists
  applyThemeToBubble(wrapper, msg.theme);

  // append to chat
  chatDiv.appendChild(wrapper);
  scrollToBottom();

  // when wrapper clicked -> show options menu
  wrapper.addEventListener("click", (e) => {
    e.stopPropagation();
    // remove existing menus
    document.querySelectorAll(".msg-menu").forEach(n => n.remove());

    const menu = document.createElement("div");
    menu.className = "msg-menu";
    menu.style.position = "absolute";
    menu.style.top = "36px";
    menu.style.right = "6px";
    menu.style.background = "rgba(0,0,0,0.85)";
    menu.style.color = "#fff";
    menu.style.padding = "8px";
    menu.style.borderRadius = "8px";
    menu.style.display = "flex";
    menu.style.flexDirection = "column";
    menu.style.zIndex = 9999;
    menu.style.minWidth = "140px";

    // Edit (only own)
    if (msg.email === currentUserEmail) {
      const editBtn = document.createElement("button");
      editBtn.textContent = "✏ Edit";
      styleMenuBtn(editBtn);
      editBtn.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        const newText = prompt("Edit your message:", msg.text);
        if (newText && newText.trim() !== "") {
          await update(ref(db, `messages/${key}`), { text: newText });
        }
        menu.remove();
      });
      menu.appendChild(editBtn);
    }

    // Delete (only own)
    if (msg.email === currentUserEmail) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑 Delete";
      styleMenuBtn(delBtn);
      delBtn.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        if (confirm("Delete this message?")) {
          await remove(ref(db, `messages/${key}`));
          wrapper.remove();
        }
        menu.remove();
      });
      menu.appendChild(delBtn);
    }

    // Theme change (cycles through presets)
    const themeChangeBtn = document.createElement("button");
    themeChangeBtn.textContent = "🎨 Theme";
    styleMenuBtn(themeChangeBtn);
    themeChangeBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const themes = [
        "#DCF8C6", "#FFD1DC", "#FFF3B0", "#D0E8FF",
        "linear-gradient(135deg,#ff9a9e,#fad0c4)", "#E6E6EA", "#d1ffd6"
      ];
      const current = msg.theme || null;
      let next = themes[0];
      if (current) {
        const idx = themes.indexOf(current);
        next = themes[(idx + 1) % themes.length] || themes[0];
      }
      try {
        await update(ref(db, `messages/${key}`), { theme: next });
      } catch (err) {
        // fallback: apply locally
        applyThemeToBubble(wrapper, next);
      }
      menu.remove();
    });
    menu.appendChild(themeChangeBtn);

    // Clear chat (dangerous)
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "🧹 Clear chat";
    styleMenuBtn(clearBtn);
    clearBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      if (!confirm("⚠ Delete ALL messages? This cannot be undone.")) {
        menu.remove();
        return;
      }
      try {
        const allRef = ref(db, "messages");
        const snapshot = await get(allRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const deletes = Object.keys(data).map(k => remove(ref(db, `messages/${k}`)));
          await Promise.all(deletes);
        }
        alert("All messages deleted");
      } catch (err) {
        console.error(err);
        alert("Failed to clear chat");
      }
      menu.remove();
    });
    menu.appendChild(clearBtn);

    // Change name
    const nameBtn = document.createElement("button");
    nameBtn.textContent = "✍ Change name";
    styleMenuBtn(nameBtn);
    nameBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const newName = prompt("Enter new display name:", currentUsername || "");
      if (newName && newName.trim()) {
        localStorage.setItem("username", newName.trim());
        currentUsername = newName.trim();
        alert("Name updated. New messages will use this name.");
      }
      menu.remove();
    });
    menu.appendChild(nameBtn);

    // append menu
    wrapper.appendChild(menu);

    // remove when clicked outside
    setTimeout(() => {
      const onDocClick = (ev) => {
        if (!menu.contains(ev.target) && ev.target !== wrapper) {
          menu.remove();
          document.removeEventListener("click", onDocClick);
        }
      };
      document.addEventListener("click", onDocClick);
    }, 0);
  });

  // remove DOM when DB child removed (listen separately)
  const childRemPath = ref(db, `messages/${key}`);
  // we rely on onChildAdded/changed and onChildRemoved in global listeners (Realtime will push changes)
}

// style helper for menu buttons
function styleMenuBtn(btn) {
  btn.style.background = "transparent";
  btn.style.border = "1px solid rgba(255,255,255,0.08)";
  btn.style.color = "#fff";
  btn.style.padding = "6px 8px";
  btn.style.borderRadius = "6px";
  btn.style.cursor = "pointer";
  btn.style.marginBottom = "6px";
  btn.style.textAlign = "left";
}

// remove message DOM when it is removed from DB
const messagesRoot = ref(db, "messages");
onChildChanged(messagesRoot, () => {}); // placeholder for real-time behavior

setInterval(async () => {
  try {
    const snap = await get(ref(db, "messages"));
    const keys = snap.exists() ? Object.keys(snap.val()) : [];
    // remove DOM nodes whose keys no longer exist
    document.querySelectorAll(".chat-message").forEach(el => {
      const k = el.dataset.key;
      if (k && !keys.includes(k)) el.remove();
    });
  } catch (err) {}
}, 3000);

// ========================== Utilities ==========================
function escapeHtml(text) {
  if (typeof text !== "string") return text;
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ========================== Start listeners (initial) ==========================
function init() {
  // If user already signed in, onAuthStateChanged will call startListeners
  // But we also call startListeners if username is set and auth present
}
init();

// ensure the input area doesn't block scroll area calculations
window.addEventListener("load", () => {
  scrollToBottom();
});
window.addEventListener("resize", () => {
  scrollToBottom();
});


// ========================== Voice Input (Mic) ==========================
const micButton = document.getElementById("mic-button");
if (micButton && inputField) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US"; // You can change to "hi-IN" for Hindi
    recognition.continuous = false;
    recognition.interimResults = false;

    micButton.addEventListener("click", () => {
      recognition.start();
      micButton.classList.add("active");
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputField.value += " " + transcript;
    };

    recognition.onend = () => {
      micButton.classList.remove("active");
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      micButton.classList.remove("active");
    };
  } else {
    console.warn("Speech Recognition not supported in this browser.");
  }
}

