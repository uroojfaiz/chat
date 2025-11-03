// app.js — Complete working ChatX script (Firestore + Auth + UI fixes)

// === Firebase imports (12.5.0) ===
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

// === Firebase config ===
const firebaseConfig = {
  apiKey: "AIzaSyAuB_ufAiG-xLCENo55S3vGgCOklsxMiKY",
  authDomain: "real-time-database-6f10c.firebaseapp.com",
  projectId: "real-time-database-6f10c",
  storageBucket: "real-time-database-6f10c.firebasestorage.app",
  messagingSenderId: "988171487513",
  appId: "1:988171487513:web:b93c137ae9f75e954a5d88",
  measurementId: "G-STZ7XGVBHH",
};

// === Initialize ===
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Wrap everything after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // --- DOM elements ---
  const show = document.getElementById("show"); // messages container
  const input = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const emojiBtn = document.getElementById("emoji-btn");
  const emojiPicker = document.getElementById("emoji-picker");
  const qrToggle = document.getElementById("qr-toggle");
  const qrContainer = document.getElementById("qr-container");
  const qrcodeCanvas = document.getElementById("qrcode");
  const themeBtn = document.getElementById("theme");
  const logoutBtn = document.getElementById("logout-button");

  // Auth form elements (if present)
  const signCreateBtn = document.getElementById("sign-create");
  const signEmail = document.getElementById("sign-email");
  const signPassword = document.getElementById("sign-password");
  const loginBtn = document.getElementById("login-button");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const usernameSetBtn = document.getElementById("username-set");
  const usernameInput = document.getElementById("username");

  // keep track of current user's email
  let currentUserEmail = null;

  // === AUTH handlers (signup/login/logout) ===
  signCreateBtn?.addEventListener("click", async () => {
    const email = signEmail?.value?.trim();
    const pass = signPassword?.value?.trim();
    if (!email || !pass) return alert("Please enter email & password");
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      alert("Account created — please login.");
      window.location.href = "user.html";
    } catch (err) {
      alert(err.message);
    }
  });

  loginBtn?.addEventListener("click", async () => {
    const email = loginEmail?.value?.trim();
    const pass = loginPassword?.value?.trim();
    if (!email || !pass) return alert("Please enter email & password");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      alert("Logged in");
      window.location.href = "user.html";
    } catch (err) {
      alert(err.message);
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      alert("Logged out");
      window.location.href = "index.html";
    } catch (err) {
      alert(err.message);
    }
  });

  usernameSetBtn?.addEventListener("click", () => {
    const uname = usernameInput?.value?.trim();
    if (!uname) return alert("Please enter a username");
    localStorage.setItem("username", uname);
    alert("Username saved");
    window.location.href = "chat.html";
  });

  // === Theme change ===
  themeBtn?.addEventListener("click", () => {
    const color = getRandomColor();
    document.body.style.backgroundColor = color;
  });

  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let c = "#";
    for (let i = 0; i < 6; i++) c += letters[Math.floor(Math.random() * 16)];
    return c;
  }

  // === QR code toggle & generate ===
  qrToggle?.addEventListener("click", () => {
    if (!qrContainer) return;
    qrContainer.style.display = qrContainer.style.display === "flex" ? "none" : "flex";
  });

  // load qrcode script and draw
  (function loadQRCode() {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";
    script.onload = () => {
      try {
        if (qrcodeCanvas) {
          QRCode.toCanvas(qrcodeCanvas, window.location.href, { width: 120, margin: 2 }, (err) => {
            if (err) console.error("QR error", err);
          });
        }
      } catch (e) {
        console.error("QR lib error", e);
      }
    };
    document.head.appendChild(script);
  })();

  // === Emoji picker ===
  if (emojiBtn && emojiPicker && input) {
    const emojis = [
      "😀","😃","😄","😁","😆","😂","🤣","😊","😍","😘","😜","🤔",
      "😎","😢","😭","😡","😇","🥰","😴","😋","🙄","🤩","🤗","🥳",
      "👍","👎","🙏","👏","🔥","💯","❤","💔","✨","🌟","😻","🤖"
    ];
    emojis.forEach(e => {
      const span = document.createElement("span");
      span.textContent = e;
      span.style.cursor = "pointer";
      span.style.margin = "4px";
      span.addEventListener("click", () => {
        input.value += e;
        emojiPicker.style.display = "none";
        input.focus();
      });
      emojiPicker.appendChild(span);
    });

    emojiBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      emojiPicker.style.display = emojiPicker.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (ev) => {
      if (!emojiBtn.contains(ev.target) && !emojiPicker.contains(ev.target)) {
        emojiPicker.style.display = "none";
      }
    });
  }

  // === Scroll & layout helpers ===
  const chatBoxElement = document.querySelector(".chat"); // parent of show + input
  const inputArea = document.querySelector(".input-area");

  function adjustChatHeight() {
    if (!chatBoxElement || !inputArea || !show) return;
    const chatBoxRect = chatBoxElement.getBoundingClientRect();
    const inputHeight = inputArea.offsetHeight;
    const available = chatBoxRect.height - inputHeight - 8; // small margin
    show.style.maxHeight = `${available}px`;
    show.style.overflowY = "auto";
  }

  window.addEventListener("resize", adjustChatHeight);
  // call after short delay to let layout settle
  setTimeout(adjustChatHeight, 250);

  function scrollToBottom() {
    if (!show) return;
    show.scrollTop = show.scrollHeight;
  }

  // === Firestore: load messages realtime ===
  let unsubMessages = null;

  function startMessagesListener() {
    if (!show) return;
    // detach previous
    if (typeof unsubMessages === "function") unsubMessages();

    const q = query(collection(db, "messages"), orderBy("timestamp"));
    unsubMessages = onSnapshot(q, (snapshot) => {
      // clear
      show.innerHTML = "";
      snapshot.forEach((docItem) => {
        const msg = docItem.data();
        const id = docItem.id;

        // message wrapper
        const div = document.createElement("div");
        div.classList.add("chat-message");
        if (msg.email === currentUserEmail) div.classList.add("self");

        // build header with actions if mine
        const header = document.createElement("div");
        header.classList.add("msg-header");
        header.innerHTML = `<b>${escapeHtml((msg.email || "").split("@")[0])}</b> • ${escapeHtml(msg.time || "")}`;

        if (msg.email === currentUserEmail) {
          const actions = document.createElement("div");
          actions.classList.add("msg-actions");
          const editBtn = document.createElement("button");
          editBtn.classList.add("edit-btn");
          editBtn.title = "Edit";
          editBtn.textContent = "✏";
          const delBtn = document.createElement("button");
          delBtn.classList.add("delete-btn");
          delBtn.title = "Delete";
          delBtn.textContent = "🗑";

          // edit handler
          editBtn.addEventListener("click", async () => {
            const newText = prompt("Edit your message:", msg.text);
            if (newText !== null && newText.trim() !== "") {
              try {
                await updateDoc(doc(db, "messages", id), { text: newText.trim() });
              } catch (err) {
                console.error("Edit failed", err);
                alert("Could not update message.");
              }
            }
          });

          // delete handler
          delBtn.addEventListener("click", async () => {
            if (!confirm("Delete this message?")) return;
            try {
              await deleteDoc(doc(db, "messages", id));
            } catch (err) {
              console.error("Delete failed", err);
              alert("Could not delete message.");
            }
          });

          actions.appendChild(editBtn);
          actions.appendChild(delBtn);
          header.appendChild(actions);
        }

        const body = document.createElement("div");
        body.classList.add("msg-body");
        body.innerHTML = escapeHtml(msg.text || "");

        div.appendChild(header);
        div.appendChild(body);

        show.appendChild(div);
      });

      // after rendering all messages
      adjustChatHeight();
      scrollToBottom();
    }, (err) => {
      console.error("Messages snapshot error:", err);
    });
  }

  // escape helper (avoid basic HTML injection)
  function escapeHtml(s) {
    if (!s && s !== "") return "";
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  // === Send message handler ===
  let sending = false;
  async function sendMsg() {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    if (!currentUserEmail) return alert("Please login to send messages.");

    // disable while sending
    if (sending) return;
    sending = true;
    sendButton.disabled = true;

    try {
      await addDoc(collection(db, "messages"), {
        email: currentUserEmail,
        text,
        timestamp: serverTimestamp(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      // clear immediately after successful send
      input.value = "";
      input.focus();
      // scroll will be handled by onSnapshot rendering; but ensure quick scroll
      setTimeout(scrollToBottom, 150);
    } catch (err) {
      console.error("Send failed", err);
      alert("Could not send message.");
    } finally {
      sending = false;
      sendButton.disabled = false;
    }
  }

  sendButton?.addEventListener("click", sendMsg);
  input?.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMsg(); });

  // === Auth state watcher ===
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserEmail = user.email;
      // start listening to messages
      startMessagesListener();
    } else {
      currentUserEmail = null;
      // clear messages and detach listener
      if (show) show.innerHTML = "";
      if (typeof unsubMessages === "function") { unsubMessages(); unsubMessages = null; }
    }
  });

  // === small UI niceties ===
  // ensure input area visible and space for keyboard on mobile
  function ensureInputVisible() {
    setTimeout(() => {
      input?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 200);
  }
  input?.addEventListener("focus", ensureInputVisible);

  // initial adjust
  adjustChatHeight();

}); // DOMContentLoaded end
