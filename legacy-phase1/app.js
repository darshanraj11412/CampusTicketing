// Phase 1 Prototype - Campus Event Ticketing
// RV University CS3301 Full Stack Development (Team 8)
const EVENTS = [
  {
    id: 1,
    title: "CodeStorm 2026",
    category: "fest",
    catLabel: "Tech Fest",
    date: "Sat, 6 Sep · 10:00 AM",
    venue: "Auditorium B",
    seatsLeft: 3,
    seatsTotal: 200,
    desc: "24-hour campus hackathon with mentors, midnight pizza, and a shot at ₹50k in prizes."
  },
  {
    id: 2,
    title: "Intro to Git & GitHub",
    category: "workshop",
    catLabel: "Workshop",
    date: "Mon, 8 Sep · 4:00 PM",
    venue: "Lab 3, CSE Block",
    seatsLeft: 18,
    seatsTotal: 40,
    desc: "Hands-on session on branching, PRs, and collaborating on a real repo — bring a laptop."
  },
  {
    id: 3,
    title: "Design Systems in Practice",
    category: "talk",
    catLabel: "Guest Talk",
    date: "Wed, 10 Sep · 5:30 PM",
    venue: "Seminar Hall 1",
    seatsLeft: 42,
    seatsTotal: 120,
    desc: "An alum from a product design team walks through building and scaling a design system."
  },
  {
    id: 4,
    title: "Inter-Dept Football",
    category: "sports",
    catLabel: "Sports",
    date: "Sun, 7 Sep · 7:00 AM",
    venue: "Main Ground",
    seatsLeft: 6,
    seatsTotal: 22,
    desc: "CSE vs ECE quarterfinal. Sign up as a player or grab a spot on the sidelines list."
  },
  {
    id: 5,
    title: "Figma for Beginners",
    category: "workshop",
    catLabel: "Workshop",
    date: "Thu, 11 Sep · 3:00 PM",
    venue: "Design Studio",
    seatsLeft: 25,
    seatsTotal: 30,
    desc: "Wireframes to a clickable prototype in two hours — no design background needed."
  },
  {
    id: 6,
    title: "Founders' Fireside",
    category: "talk",
    catLabel: "Guest Talk",
    date: "Fri, 12 Sep · 6:00 PM",
    venue: "Amphitheatre",
    seatsLeft: 0,
    seatsTotal: 150,
    desc: "Three campus-founded startups on what actually happened in year one. Q&A after."
  },
];

const grid = document.getElementById("eventGrid");
const filterRow = document.getElementById("filterRow");
let activeFilter = "all";

function seatsLabel(ev) {
  if (ev.seatsLeft === 0) return "Full";
  if (ev.seatsLeft <= 5) return `${ev.seatsLeft} seats left`;
  return `${ev.seatsLeft} seats left`;
}

function renderEvents() {
  if (!grid) return;
  const list = EVENTS.filter(ev => activeFilter === "all" || ev.category === activeFilter);
  grid.innerHTML = list.map(ev => `
    <div class="event-card">
      <div class="event-card-top">
        <span class="event-cat">${ev.catLabel}</span>
        <span class="event-seats ${ev.seatsLeft <= 5 ? 'is-low' : ''}">${seatsLabel(ev)}</span>
      </div>
      <h3>${ev.title}</h3>
      <p class="event-meta">${ev.date} · ${ev.venue}</p>
      <p class="event-desc">${ev.desc}</p>
      <button class="btn ${ev.seatsLeft === 0 ? 'btn-outline' : 'btn-primary'}" data-id="${ev.id}" ${ev.seatsLeft === 0 ? 'disabled' : ''}>
        ${ev.seatsLeft === 0 ? 'Join waitlist' : 'Register'}
      </button>
    </div>
  `).join("");
}

if (filterRow) {
  filterRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    filterRow.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    activeFilter = btn.dataset.filter;
    renderEvents();
  });
}

// ---- Stats ----
function animateCount(el, target, duration = 900) {
  if (!el) return;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(progress * target);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const statEvents = document.getElementById("statEvents");
const statSeats = document.getElementById("statSeats");
if (statEvents) animateCount(statEvents, EVENTS.length);
if (statSeats) animateCount(statSeats, EVENTS.reduce((s, e) => s + e.seatsLeft, 0));

// ---- Registration modal ----
const backdrop = document.getElementById("modalBackdrop");
const modalKicker = document.getElementById("modalKicker");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalSeats = document.getElementById("modalSeats");
const modalConfirm = document.getElementById("modalConfirm");
const modalSuccess = document.getElementById("modalSuccess");
const successCode = document.getElementById("successCode");
const modalClose = document.getElementById("modalClose");

let currentEvent = null;

if (grid) {
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const ev = EVENTS.find(x => x.id == btn.dataset.id);
    if (!ev) return;
    currentEvent = ev;
    openModal(ev);
  });
}

function openModal(ev) {
  if (!backdrop) return;
  modalKicker.textContent = ev.catLabel.toUpperCase();
  modalTitle.textContent = ev.title;
  modalMeta.textContent = `${ev.date} · ${ev.venue}`;
  modalSeats.textContent = ev.seatsLeft === 0 ? "Currently full — join the waitlist" : `${ev.seatsLeft} of ${ev.seatsTotal} seats left`;
  modalConfirm.textContent = ev.seatsLeft === 0 ? "Join waitlist" : "Confirm registration";
  modalConfirm.hidden = false;
  modalSuccess.hidden = true;
  backdrop.classList.add("is-open");
}

function closeModal() {
  if (backdrop) backdrop.classList.remove("is-open");
}

if (modalClose) modalClose.addEventListener("click", closeModal);
if (backdrop) backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });

if (modalConfirm) {
  modalConfirm.addEventListener("click", () => {
    if (!currentEvent) return;
    if (currentEvent.seatsLeft > 0) currentEvent.seatsLeft -= 1;
    const code = `VEN-${Math.floor(1000 + Math.random() * 9000)}`;
    successCode.textContent = code;
    modalConfirm.hidden = true;
    modalSuccess.hidden = false;
    renderEvents();
  });
}

const signInBtn = document.getElementById("signInBtn");
if (signInBtn) {
  signInBtn.addEventListener("click", () => {
    alert("Sign-in would connect to the college SSO / auth system here.");
  });
}

const openDashboardBtn = document.getElementById("openDashboardBtn");
if (openDashboardBtn) {
  openDashboardBtn.addEventListener("click", (e) => {
    e.preventDefault();
    alert("This links to the organizer dashboard — a separate authenticated view for admins.");
  });
}

renderEvents();
