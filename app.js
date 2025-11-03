// firbase
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
  setDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

//  Firebase Config 
const firebaseConfig = {
  apiKey: "AIzaSyAuB_ufAiG-xLCENo55S3vGgCOklsxMiKY",
  authDomain: "real-time-database-6f10c.firebaseapp.com",
  projectId: "real-time-database-6f10c",
  storageBucket: "real-time-database-6f10c.firebasestorage.app",
  messagingSenderId: "988171487513",
  appId: "1:988171487513:web:b93c137ae9f75e954a5d88",
  measurementId: "G-STZ7XGVBHH",
};

//  Initialization 
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

//  AUTH SYSTEM 

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

//  THEME CHANGE (global button) 
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
}
document.getElementById("theme")?.addEventListener("click", () => {
  document.body.style.backgroundColor = getRandomColor();
});

//  QR Code 
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
  // if canvas #qrcode exists, draw current origin
  const qrEl = document.getElementById("qrcode");
  if (qrEl) {
    QRCode.toCanvas(
      qrEl,
      window.location.href,
      { width: 120, margin: 2 },
      (error) => {
        if (error) console.error(error);
      }
    );
  }
};
document.head.appendChild(script);

//  CHAT SYSTEM 
const show = document.getElementById("show");
const input = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

let currentUserEmail = null;
let currentUsername = localStorage.getItem("username") || "Unknown";

// User Auth Check
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserEmail = user.email;
    loadMessages();
    listenTyping(); // start listening for typing updates
  } else {
    currentUserEmail = null;
  }
});

// Helper: create avatar HTML 
function avatarHTML(name) {
  const initial = (name && name[0]) ? name[0].toUpperCase() : "?";
  // inline style for avatar circle — you can move to CSS if you want
  return `<div class="msg-avatar" style="
      width:36px;height:36px;border-radius:50%;
      background:linear-gradient(135deg,#06b7b8,#049c9d);
      color:white;display:inline-flex;align-items:center;justify-content:center;
      font-weight:700;margin-right:8px;flex-shrink:0;">${initial}</div>`;
}

//  Load Messages from Firestore 
function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("timestamp"));
  onSnapshot(q, (snapshot) => {
    show.innerHTML = "";
    snapshot.forEach((docItem) => {
      const msg = docItem.data();
      const id = docItem.id;

      // create message container
      const div = document.createElement("div");
      div.classList.add("chat-message");
      div.dataset.id = id;
      // apply saved theme if exists
      const themeColor = msg.theme || null;

      // Build message content: avatar + header + body
      const avatar = avatarHTML(msg.username || msg.email.split("@")[0]);
      const header = `<div class="msg-header" style="display:flex;align-items:center;gap:8px;">
                        ${avatar}
                        <div style="display:flex;flex-direction:column;align-items:flex-start;">
                          <div style="font-weight:700">${msg.username || msg.email.split("@")[0]}</div>
                          <div style="font-size:12px;color:rgba(0,0,0,0.35)">${msg.time || ""}</div>
                        </div>
                      </div>`;

      const body = <div class="msg-body" style="margin-top:8px;">${escapeHtml(msg.text)}</div>;

      // Inline alignment styles so works w/out extra CSS
      div.style.maxWidth = "72%";
      div.style.margin = "8px";
      div.style.padding = "10px";
      div.style.borderRadius = "12px";
      div.style.wordBreak = "break-word";
      div.style.display = "block";
      div.style.clear = "both";
      div.style.position = "relative";

      if (themeColor) {
        div.style.background = themeColor;
        div.style.color = getContrastColor(themeColor);
      } else {
        // default backgrounds
        if (msg.email === currentUserEmail) {
          div.style.background = "#DCF8C6";
          div.style.float = "right";
          div.style.textAlign = "right";
        } else {
          div.style.background = "#FFFFFF";
          div.style.float = "left";
          div.style.textAlign = "left";
          div.style.color = "#000";
        }
      }

      // add options button placeholder (will show when clicked)
      const optionsBtnHtml = `<button class="msg-options-btn" title="Options" style="
          position:absolute; top:6px; right:6px; background:transparent; border:none; cursor:pointer; font-size:14px; display:none;">⋮</button>`;
      div.innerHTML = header + body + optionsBtnHtml;

      // append and scroll
      show.appendChild(div);
      show.scrollTop = show.scrollHeight;

      // show options button only when message belongs to current user OR always to allow theme/clear/name change
      const showOptions = true; // we will show menu on click always but restrict actions inside

      // click to show contextual menu
      div.addEventListener("click", (e) => {
        // prevent multiple menus
        closeAllMessageMenus();

        // create menu
        const menu = document.createElement("div");
        menu.classList.add("msg-menu");
        menu.style.position = "absolute";
        menu.style.top = "40px";
        menu.style.right = "6px";
        menu.style.background = "rgba(0,0,0,0.85)";
        menu.style.color = "#fff";
        menu.style.padding = "6px";
        menu.style.borderRadius = "8px";
        menu.style.zIndex = 9999;
        menu.style.display = "flex";
        menu.style.flexDirection = "column";
        menu.style.minWidth = "140px";
        menu.style.gap = "6px";

        // Build menu items
        // EDIT (only for own messages)
        if (msg.email === currentUserEmail) {
          const editBtn = document.createElement("button");
          editBtn.textContent = "✏ Edit";
          styleMenuButton(editBtn);
          editBtn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            const newText = prompt("Edit your message:", msg.text);
            if (newText && newText.trim() !== "") {
              await updateDoc(doc(db, "messages", id), { text: newText });
            }
            menu.remove();
          });
          menu.appendChild(editBtn);
        }

        // DELETE (only for own messages)
        if (msg.email === currentUserEmail) {
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "🗑 Delete";
          styleMenuButton(deleteBtn);
          deleteBtn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            if (confirm("Delete this message?")) {
              await deleteDoc(doc(db, "messages", id));
            }
            menu.remove();
          });
          menu.appendChild(deleteBtn);
        }

        // Theme change for this message (cycles preset themes)
        const themeBtn = document.createElement("button");
        themeBtn.textContent = "🎨 Theme";
        styleMenuButton(themeBtn);
        themeBtn.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          const themes = [
            "#DCF8C6", // light green
            "#FFD1DC", // pink
            "#FFF3B0", // yellow
            "#D0E8FF", // light blue
            "linear-gradient(135deg,#ff9a9e,#fad0c4)", // gradient
            "#E6E6EA", // light gray
            "#d1ffd6", // mint
          ];
          // rotate to next
          let current = msg.theme || null;
          let next = themes[0];
          if (current) {
            const idx = themes.findIndex(t => t === current);
            next = themes[(idx + 1) % themes.length] || themes[0];
          }
          // store theme on message doc (so it's persistent) and update DOM immediately
          try {
            await updateDoc(doc(db, "messages", id), { theme: next });
          } catch (err) {
            // if update fails (rare), still update DOM local
          }
          menu.remove();
        });
        menu.appendChild(themeBtn);

        // Clear chat (dangerous) — ask confirmation
        const clearBtn = document.createElement("button");
        clearBtn.textContent = "🧹 Clear chat";
        styleMenuButton(clearBtn);
        clearBtn.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          if (!confirm("⚠ Delete ALL messages? This cannot be undone.")) {
            menu.remove();
            return;
          }
          // fetch all message docs and delete them
          try {
            const qAll = query(collection(db, "messages"), orderBy("timestamp"));
            const snaps = await getDocs(qAll);
            const deletes = snaps.docs.map(d => deleteDoc(doc(db, "messages", d.id)));
            await Promise.all(deletes);
            alert("All messages deleted.");
          } catch (err) {
            console.error("Clear chat error:", err);
            alert("Failed to clear chat.");
          }
          menu.remove();
        });
        menu.appendChild(clearBtn);

        // Change name (updates localStorage username)
        const nameBtn = document.createElement("button");
        nameBtn.textContent = "✍ Change name";
        styleMenuButton(nameBtn);
        nameBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const newName = prompt("Enter new display name:", currentUsername || "");
          if (newName && newName.trim() !== "") {
            localStorage.setItem("username", newName.trim());
            currentUsername = newName.trim();
            alert("Name updated — new messages will use this name.");
          }
          menu.remove();
        });
        menu.appendChild(nameBtn);

        // append menu to div and stop propagation to prevent immediate close
        div.appendChild(menu);
        setTimeout(() => {
          // close menu when clicking outside
          document.addEventListener("click", onDocClickCloseMenu);
        }, 0);

        function onDocClickCloseMenu(ev) {
          if (!menu.contains(ev.target) && ev.target !== div) {
            menu.remove();
            document.removeEventListener("click", onDocClickCloseMenu);
          }
        }
      });
    });
  });
}

// Utility: close any open menus on messages
function closeAllMessageMenus() {
  document.querySelectorAll(".msg-menu").forEach(m => m.remove());
}

// Utility: style menu button (small helper)
function styleMenuButton(btn) {
  btn.style.background = "transparent";
  btn.style.border = "1px solid rgba(255,255,255,0.08)";
  btn.style.color = "#fff";
  btn.style.padding = "6px 8px";
  btn.style.borderRadius = "6px";
  btn.style.cursor = "pointer";
  btn.style.textAlign = "left";
}

// escape HTML to prevent basic injection
function escapeHtml(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Determine readable text color for a background (very small helper)
function getContrastColor(bg) {
  try {
    // If gradient, fallback to dark text
    if (bg.includes("gradient")) return "#000";
    // strip '#'
    let c = bg.replace("#", "");
    if (c.length === 3) c = c.split("").map(ch => ch + ch).join("");
    const r = parseInt(c.substr(0,2),16);
    const g = parseInt(c.substr(2,2),16);
    const b = parseInt(c.substr(4,2),16);
    const yiq = (r*299 + g*587 + b*114)/1000;
    return yiq >= 128 ? "#000" : "#fff";
  } catch {
    return "#000";
  }
}

//  SEND MESSAGE 
sendButton?.addEventListener("click", sendMsg);
input?.addEventListener("keypress", (e) => e.key === "Enter" && sendMsg());

async function sendMsg() {
  const text = input.value.trim();
  if (text === "" || !currentUserEmail) return;

  await addDoc(collection(db, "messages"), {
    email: currentUserEmail,
    username: currentUsername,
    text,
    timestamp: serverTimestamp(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  input.value = "";
  show.scrollTop = show.scrollHeight;
  // clear typing flag for this user on send (so others stop seeing typing)
  try {
    await setDoc(doc(db, "typing", currentUsername), { typing: false, ts: serverTimestamp() });
  } catch (err) {}
}

//  EMOJI PICKER 
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");

if (emojiBtn && emojiPicker && input) {
  const emojis = [
    "😀","😃","😄","😁","😆","😅","😂","🤣","🥲","☺","😊","😇","🙂","🙃","😉",
    "😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓",
    "😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹","😣","😖","😫",
    "🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥",
    "😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮",
    "😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑",
    "🤠","😈","👿","👹","👺","💀","☠","👻","👽","👾","🤖","💩","😺","😸","😹",
    "😻","😼","😽","🙀","😿","😾","🫣","🫡","🫢","🫥","❤","🧡","💛","💚","💙",
    "💜","🖤","🤍","🤎","💔","❣","💕","💞","💓","💗","💖","💘","💝","💟","💌",
    "🔥","✨","⚡","💥","💫","💦","💨","🕳","💣","💬","👁‍🗨","🗨","🗯","💭",
    "💤","👍","👎","👏","🙌","👐","🤲","🙏","🤝","🤞","✌","🤟","🤘","👌","👈",
    "👉","👆","🖕","👇","☝","✋","🤚","🖐","🖖","👋","🤙","💪","🦾","🦵","🦿",
    "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵",
    "🍎","🍊","🍋","🍌","🍉","🍇","🍓","🍒","🥭","🍍","🥝","🍅","🥥","🥑","🥦",
    "🌸","🌼","🌻","🌺","🌹","🌷","🌵","🌴","🌲","🌳","🌾","☘","🍀","🍁","🍂",
    "🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚚","🚜","🚲","🏍","🛵","🚀",
    "✈","🚁","🚤","⛵","🚢","⚓","🏠","🏡","🏢","🏣","🏥","🏦","🏫","🏩","💒",
    "🎮","🎲","🎯","🏆","🎵","🎧","🎤","🎬","📷","📱","💻","⌚","🔋","🔌","📎",
    "🔒","🔑","⚙","🧰","🛠"
  ];
  emojis.forEach((e) => {
    const span = document.createElement("span");
    span.textContent = e;
    span.style.cursor = "pointer";
    span.style.padding = "4px";
    span.style.fontSize = "20px";
    span.addEventListener("click", () => {
      input.value += e;
      emojiPicker.style.display = "none";
      input.focus();
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

//  SCROLL FIX 
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

//  TYPING INDICATOR (Firestore) 
let typingTimeout;
function startTyping() {
  if (!currentUsername) return;
  // set typing true doc
  setDoc(doc(db, "typing", currentUsername), { typing: true, ts: serverTimestamp() }).catch(()=>{});
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    setDoc(doc(db, "typing", currentUsername), { typing: false, ts: serverTimestamp() }).catch(()=>{});
  }, 1000);
}

input?.addEventListener("input", () => {
  startTyping();
});

// listen for typing collection changes
function listenTyping() {
  const typingCol = collection(db, "typing");
  onSnapshot(typingCol, (snap) => {
    let someoneTyping = false;
    let who = "";
    snap.forEach(s => {
      const data = s.data();
      if (s.id === currentUsername) return; // ignore self
      if (data && data.typing) {
        someoneTyping = true;
        who = s.id;
      }
    });
    if (someoneTyping) startDotsFor(who);
    else stopDots();
  });
}

let dotsInterval;
function startDotsFor(user) {
  stopDots();
  let dots = 0;
  if (typingIndicator) typingIndicator.textContent = `${user} is typing`;
  dotsInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    if (typingIndicator) typingIndicator.textContent = `${user} is typing${".".repeat(dots)}`;
  }, 450);
}
function stopDots() {
  if (dotsInterval) clearInterval(dotsInterval);
  if (typingIndicator) typingIndicator.textContent = "";
}