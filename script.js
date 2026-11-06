/* ============================================================
   BATCH 1975 — ROYAL ALUMNI YEARBOOK · script.js
   ============================================================ */
const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------------- SUPABASE (with offline demo fallback) ---------------- */
const SUPABASE_URL = "https://rxevyuegjknutkpqgzze.supabase.co";
const SUPABASE_KEY = "sb_publishable_lunmsXZaRSvq0HmueaBdkQ_6cUvAJBp";

let sb = null;
try {
  if (window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) { console.warn("Supabase unavailable, demo mode enabled.", e); }

/* demo-mode stores (used only if Supabase can't be reached) */
const demoUsers   = () => JSON.parse(localStorage.getItem("b75_users") || "{}");
const saveDemoUser= (email, pw) => { const u = demoUsers(); u[email] = pw; localStorage.setItem("b75_users", JSON.stringify(u)); };
const hasSession  = () => !!localStorage.getItem("b75_user");
const setSession  = (email) => localStorage.setItem("b75_user", email);
const clearSession= () => localStorage.removeItem("b75_user");

/* ---------------- SCREENS ---------------- */
const cover        = $("#cover");
const entrance     = $("#entrance");
const yearbook     = $("#yearbook");
const overlay      = $("#authOverlay");
const bgMusic      = $("#bgMusic");

function showEntrance() {
  cover.classList.add("gone");
  entrance.hidden = false;
  entrance.classList.remove("gone");
  yearbook.hidden = true;
  stopGlitter();
}
function showYearbook() {
  cover.classList.add("gone");
  entrance.classList.add("gone");
  yearbook.hidden = false;
  stopGlitter();
  initReveal();
  window.scrollTo({ top: 0 });
}
function showCover() {
  clearSession();
  if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
  yearbook.hidden = true;
  entrance.hidden = true;
  entrance.classList.add("gone");
  cover.classList.remove("gone");
  startGlitter();
  openModal("view-signin");
}

/* ---------------- GLITTER CANVAS ---------------- */
const cv  = $("#glitter");
const ctx = cv.getContext("2d");
let W, H, parts = [], glitterRunning = false;
const COLORS = ["#f7e08a","#d4af37","#fffbe8","#1d6b4f","#7fb8ff"];

function resize(){ W = cv.width = innerWidth; H = cv.height = innerHeight; }
addEventListener("resize", resize); resize();

function spawnGlitter(n){
  for (let i = 0; i < n; i++) parts.push({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*1.8 + .4,
    vx: (Math.random()-.5)*.25,
    vy: -(Math.random()*.35 + .08),
    tw: Math.random()*.04 + .008,
    ts: Math.random()*Math.PI*2,
    c: COLORS[Math.random()*COLORS.length|0]
  });
}
spawnGlitter(80);

function glitterTick(){
  if (!glitterRunning) return;
  ctx.clearRect(0, 0, W, H);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx; p.y += p.vy; p.ts += p.tw * 8;
    ctx.globalAlpha = (Math.sin(p.ts)*.5 + .5)*.9 + .05;
    ctx.shadowBlur = 8; ctx.shadowColor = p.c;
    ctx.fillStyle = p.c;
    const s = p.r * (1.4 + Math.sin(p.ts)*.6);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - s*2);
    ctx.quadraticCurveTo(p.x, p.y, p.x + s*2, p.y);
    ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s*2);
    ctx.quadraticCurveTo(p.x, p.y, p.x - s*2, p.y);
    ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s*2);
    ctx.fill();
    if (p.y < -10 || p.x < -10 || p.x > W + 10) { parts.splice(i, 1); spawnGlitter(1); }
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(glitterTick);
}
function startGlitter(){ if (!glitterRunning) { glitterRunning = true; requestAnimationFrame(glitterTick); } }
function stopGlitter(){ glitterRunning = false; }
startGlitter();

/* occasional glitter burst */
setInterval(() => {
  if (!glitterRunning) return;
  const bx = Math.random()*W, by = Math.random()*H*.7;
  for (let i = 0; i < 5; i++) parts.push({
    x: bx, y: by, r: Math.random()*2 + .6,
    vx: (Math.random()-.5)*1.6, vy: (Math.random()-.5)*1.6 - .3,
    tw: .06, ts: Math.random()*6, c: COLORS[Math.random()*COLORS.length|0]
  });
}, 4500);

/* ---------------- MOUSE PARALLAX (cover only) ---------------- */
const layers = $$(".layer");
let tx = 0, ty = 0, cx = 0, cy = 0;
addEventListener("mousemove", (e) => {
  tx = e.clientX / innerWidth - .5;
  ty = e.clientY / innerHeight - .5;
});
(function par(){
  cx += (tx - cx) * .06; cy += (ty - cy) * .06;
  if (!cover.classList.contains("gone")) {
    layers.forEach((l) => {
      const d = +l.dataset.depth || 8;
      l.style.transform = `translate(${-cx*d}px, ${-cy*d}px)`;
    });
  }
  requestAnimationFrame(par);
})();

/* ---------------- AUTH MODAL ---------------- */
function openModal(viewId) {
  if (viewId) showView(viewId);
  overlay.classList.add("open");
}
function closeModal() { overlay.classList.remove("open"); }
function showView(id) {
  $$(".view").forEach((v) => v.classList.remove("active"));
  $("#" + id).classList.add("active");
}
$("#modalClose").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
$$("[data-view]").forEach((a) => a.addEventListener("click", () => showView(a.dataset.view)));

/* ---------------- COVER BUTTONS ---------------- */
$("#openYearbookBtn").addEventListener("click", () => {
  hasSession() ? showEntrance() : openModal("view-signin");
});
$("#joinBtn").addEventListener("click", () => openModal("view-signup"));

/* ---------------- AUTH ACTIONS ---------------- */
const isOfflineError = (err) => err && (err.name === "AuthRetryableFetchError" || /fetch|network|failed/i.test(err.message || ""));

$("#signInButton").addEventListener("click", async () => {
  const email = $("#signInEmail").value.trim();
  const pw    = $("#signInPassword").value;
  const msg   = $("#signInMessage");
  msg.textContent = "";
  if (!email || !pw) { msg.textContent = "Please enter your email and password."; return; }

  if (sb) {
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) {
        if (isOfflineError(error)) return demoSignIn(email, pw, msg);
        msg.textContent = error.message; return;
      }
      setSession(email); closeModal(); showEntrance(); return;
    } catch (e) { return demoSignIn(email, pw, msg); }
  }
  demoSignIn(email, pw, msg);
});

function demoSignIn(email, pw, msg) {
  const users = demoUsers();
  if (!users[email])            { msg.textContent = "No account found for that email. Try Sign Up."; return; }
  if (users[email] !== pw)      { msg.textContent = "Incorrect password. Please try again."; return; }
  setSession(email); closeModal(); showEntrance();
}

$("#signUpButton").addEventListener("click", async () => {
  const email = $("#signUpEmail").value.trim();
  const pw    = $("#signUpPassword").value;
  const msg   = $("#signUpMessage");
  msg.textContent = "";
  if (!email || !pw)           { msg.textContent = "Please enter your email and password."; return; }
  if (pw.length < 6)           { msg.textContent = "Your password must be at least 6 characters."; return; }

  if (sb) {
    try {
      const { data, error } = await sb.auth.signUp({ email, password: pw });
      if (error) {
        if (isOfflineError(error)) return demoSignUp(email, pw, msg);
        msg.textContent = error.message; return;
      }
      if (data.session) { setSession(email); closeModal(); showEntrance(); }
      else msg.textContent = "Account created! Please check your email to confirm, then sign in.";
      return;
    } catch (e) { return demoSignUp(email, pw, msg); }
  }
  demoSignUp(email, pw, msg);
});

function demoSignUp(email, pw, msg) {
  const users = demoUsers();
  if (users[email]) { msg.textContent = "That email is already registered. Try signing in."; return; }
  saveDemoUser(email, pw);
  setSession(email); closeModal(); showEntrance();
}

$("#forgotButton").addEventListener("click", async () => {
  const email = $("#forgotEmail").value.trim() || $("#signInEmail").value.trim();
  const msg = $("#forgotMessage");
  msg.textContent = "";
  if (!email) { msg.textContent = "Please enter your email address."; return; }

  if (sb) {
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
      if (error) {
        if (isOfflineError(error)) { msg.textContent = "You're offline — demo mode can't send emails."; return; }
        msg.textContent = error.message; return;
      }
      msg.textContent = "Password reset link sent! Please check your email."; return;
    } catch (e) { msg.textContent = "You're offline — demo mode can't send emails."; return; }
  }
  msg.textContent = "Demo mode: password reset isn't available offline.";
});
$("#forgotLink").addEventListener("click", () => {
  $("#forgotEmail").value = $("#signInEmail").value.trim();
  showView("view-forgot");
});

/* ---------------- ENTER YEARBOOK + MUSIC ---------------- */
$("#enterYearbook").addEventListener("click", () => {
  if (bgMusic) {
    bgMusic.volume = 0.3;
    bgMusic.play().catch((err) => console.log("Music playback blocked:", err));
  }
  showYearbook();
});

/* ---------------- LOG OUT ---------------- */
$("#logoutButton").addEventListener("click", async () => {
  if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
  showCover();
  window.scrollTo({ top: 0 });
});

/* ============================================================
   MEET THE CLASS — VIEW MORE
============================================================ */
const extraClassmates = [
  "Hipolita Asis","Lourdes Asis","Precy Asis","Amalia Balane","Paul Balce",
  "Pio Bayani","Oscar Bustos","Susan Capistrano","Efren Enverga","Estelita Garcia",
  "Romeo Guinto","Soledad Guinto","William Jerez","Benito Jimenez","Rosario Jimenez",
  "Zoe Jimenez","Alex Lamadrid","Rodolfo Lamadrid","Florian Mago","Corazon Manalo",
  "Lilibeth Marabe","Liberty Mendoza","Henedina Micquiabas","Dalisay Montanez","Fe Montuya",
  "Ariston Morales","Eleanor Obusan","Merly Ojeda","Nemia Ojeda","Estella Palado",
  "Dan Pajarillo","Rouel Pajarillo","Ruby Pajarillo","Nemia Parena","Marissa Raro",
  "Sonia Salva","Lourdes Salvanerra","Luzviminda Saman","Emilrose Sanchez","Rosa Sendon",
  "Cesaria Valeros","Merly Vega","Lucia Velacruz","Jesus Vedad","Arnulfo Zenarosa"
];

let isExpanded = false;
const classGrid = $("#classGrid");
const showMoreButton = $("#showMore");
const originalMemberCount = classGrid ? classGrid.children.length : 0;

showMoreButton?.addEventListener("click", () => {
  if (!isExpanded) {
    extraClassmates.forEach((name) => {
      const card = document.createElement("article");
      card.className = "person";
      const img = document.createElement("img");
      img.src = `images/${name}.png`;
      img.alt = "Alumni portrait of " + name;
      const h = document.createElement("h3"); h.textContent = name;
      const p = document.createElement("p");  p.textContent = "Class of 1975";
      card.append(img, h, p);
      classGrid.appendChild(card);
    });
    showMoreButton.textContent = "VIEW LESS ↑";
    isExpanded = true;
  } else {
    while (classGrid.children.length > originalMemberCount) classGrid.removeChild(classGrid.lastElementChild);
    showMoreButton.textContent = "VIEW MORE →";
    isExpanded = false;
    $("#class").scrollIntoView({ behavior: "smooth" });
  }
});

/* ============================================================
   IMAGE FALLBACK (elegant gold silhouette)
============================================================ */
const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500">
    <rect width="400" height="500" fill="#0b3d2e"/>
    <rect x="8" y="8" width="384" height="484" fill="none" stroke="#d4af37" stroke-width="3"/>
    <circle cx="200" cy="185" r="62" fill="#d4af37" opacity=".85"/>
    <path d="M90 430 Q90 300 200 300 Q310 300 310 430 Z" fill="#d4af37" opacity=".85"/>
    <text x="200" y="472" text-anchor="middle" font-family="Georgia" font-size="20" fill="#f7e08a" font-style="italic">Batch 1975</text>
  </svg>`);
document.addEventListener("error", (e) => {
  const t = e.target;
  if (t.tagName === "IMG" && !t.dataset.fallback) { t.dataset.fallback = "1"; t.src = PLACEHOLDER_IMG; }
}, true);

/* ============================================================
   LETTERS THROUGH TIME — MODAL
============================================================ */
let lastLetterButton = null;

function openLetter(button) {
  const card = button.closest(".letter-card");
  const modal = $("#letterModal");
  if (!card || !modal) return;
  lastLetterButton = button;

  $("#letterModalCategory").textContent = card.querySelector(".letter-category").textContent;
  $("#letterModalTitle").textContent     = card.querySelector("h3").textContent;
  $("#letterModalName").textContent      = card.querySelector(".letter-name").textContent;

  const content = card.querySelector(".letter-full-content");
  const body = $("#letterModalBody");
  body.replaceChildren();
  content?.querySelectorAll("p").forEach((p) => {
    const np = document.createElement("p");
    np.textContent = p.textContent;
    body.appendChild(np);
  });

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modal.querySelector(".letter-close").focus();
}
function closeLetter() {
  const modal = $("#letterModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (lastLetterButton) lastLetterButton.focus();
}
function closeLetterOnBackdrop(e) { if (e.target.id === "letterModal") closeLetter(); }
document.addEventListener("keydown", (e) => {
  const modal = $("#letterModal");
  if (e.key === "Escape" && modal?.classList.contains("is-open")) closeLetter();
});

/* ============================================================
   GUESTBOOK (Supabase REST, localStorage fallback)
============================================================ */
const guestForm = $("#guestForm");
const guestMessages = $("#guestMessages");

function showGuestMessage(item) {
  const card = document.createElement("article");
  card.className = "message-card";
  const heading = document.createElement("strong");
  heading.textContent = item.name + (item.year ? " · " + item.year : "");
  const p = document.createElement("p");
  p.textContent = item.message;
  card.append(heading, p);
  guestMessages.appendChild(card);
}

async function loadGuestMessages() {
  if (sb) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/guestbook?select=id,name,year,message,created_at&order=created_at.desc`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (res.ok) {
        const msgs = await res.json();
        guestMessages.replaceChildren();
        msgs.forEach(showGuestMessage);
        return;
      }
    } catch (e) { /* fall through to local */ }
  }
  const local = JSON.parse(localStorage.getItem("b75_guestbook") || "[]");
  guestMessages.replaceChildren();
  local.forEach(showGuestMessage);
}

guestForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#guestName").value.trim();
  const year = $("#guestYear").value.trim();
  const message = $("#guestMessage").value.trim();
  if (!name || !message) return;

  if (sb) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/guestbook`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({ name, year: year || null, message })
      });
      if (res.ok) {
        const saved = await res.json();
        if (saved.length) showGuestMessage(saved[0]);
        guestForm.reset();
        return;
      }
    } catch (err) { /* fall through to local */ }
  }
  const item = { name, year: year || null, message };
  const local = JSON.parse(localStorage.getItem("b75_guestbook") || "[]");
  local.unshift(item);
  localStorage.setItem("b75_guestbook", JSON.stringify(local));
  showGuestMessage(item);
  guestForm.reset();
});

/* ============================================================
   GOLD SPARKLE CURSOR TRAIL (throttled)
============================================================ */
let lastSparkle = 0;
document.addEventListener("mousemove", (e) => {
  const now = Date.now();
  if (now - lastSparkle < 60) return;
  lastSparkle = now;
  const s = document.createElement("span");
  s.className = "cursor-sparkle";
  s.textContent = "✦";
  s.style.left = e.clientX + "px";
  s.style.top  = e.clientY + "px";
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 700);
});

/* ============================================================
   SCROLL REVEAL
============================================================ */
let revealObserver = null;
function initReveal() {
  if (revealObserver) return;
  const sections = $$("#yearbook .reveal");
  if (!sections.length) return;
  revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); obs.unobserve(en.target); }
    });
  }, { threshold: 0.1 });
  sections.forEach((s) => revealObserver.observe(s));
}

/* ============================================================
   APP START
============================================================ */
(async function init() {
  if (sb) {
    try {
      const { data } = await sb.auth.getSession();
      if (data.session) setSession(data.session.user.email);
    } catch (e) { /* offline — rely on local session */ }
  }
  loadGuestMessages();
})();

document.querySelectorAll(".honor-card, .letter-card").forEach(card => {
  if (card.querySelector(".letter-sparkle")) return;

  for (let i = 0; i < 5; i++) {
    const sparkle = document.createElement("span");
    sparkle.className = "letter-sparkle";
    sparkle.textContent = "✦";
    card.appendChild(sparkle);
  }
});