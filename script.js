/* ===========================
   STUDENT STUDY PLANNER - JS
   Designed by Sindhupriya Dharavath
   =========================== */

// ---- State ----
const state = {
  tasks: JSON.parse(localStorage.getItem('sp-tasks') || '[]'),
  subjects: JSON.parse(localStorage.getItem('sp-subjects') || 'null') || {
    Mathematics: { progress: 0, hours: 0, notes: '' },
    Chemistry:   { progress: 0, hours: 0, notes: '' },
    Physics:     { progress: 0, hours: 0, notes: '' },
    Programming: { progress: 0, hours: 0, notes: '' },
    English:     { progress: 0, hours: 0, notes: '' },
  },
  sessions: parseInt(localStorage.getItem('sp-sessions') || '0'),
  darkMode: localStorage.getItem('sp-theme') === 'dark',
  taskFilter: 'all',
  timer: { running: false, mode: 'focus', timeLeft: 25 * 60, interval: null },
  calDate: new Date(),
  quoteIdx: Math.floor(Math.random() * 10),
};

// ---- Quotes ----
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Anonymous" },
];

// ---- Subject config ----
const SUBJECT_CFG = {
  Mathematics: { emoji: '∑', gradient: 'linear-gradient(135deg,#9b66d4,#6677d4)', chip: 'chip-purple' },
  Chemistry:   { emoji: '⚗', gradient: 'linear-gradient(135deg,#5cc785,#30a8b8)', chip: 'chip-green' },
  Physics:     { emoji: '⚛', gradient: 'linear-gradient(135deg,#60a8f0,#4060d0)', chip: 'chip-blue' },
  Programming: { emoji: '</>', gradient: 'linear-gradient(135deg,#f0a040,#e06020)', chip: 'chip-orange' },
  English:     { emoji: 'Aa', gradient: 'linear-gradient(135deg,#f070a8,#d04080)', chip: 'chip-pink' },
};

const SUBJECT_COLORS_CHIP = {
  General: 'chip-gray', Mathematics: 'chip-purple', Chemistry: 'chip-green',
  Physics: 'chip-blue', Programming: 'chip-orange', English: 'chip-pink',
};

// ---- Utils ----
const save = () => {
  localStorage.setItem('sp-tasks', JSON.stringify(state.tasks));
  localStorage.setItem('sp-subjects', JSON.stringify(state.subjects));
  localStorage.setItem('sp-sessions', String(state.sessions));
};

const el = (id) => document.getElementById(id);
const fmt2 = (n) => String(n).padStart(2, '0');
const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---- Dark mode ----
function initTheme() {
  if (state.darkMode) document.body.classList.add('dark');
  updateDarkBtn();
}

function toggleDark() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle('dark', state.darkMode);
  localStorage.setItem('sp-theme', state.darkMode ? 'dark' : 'light');
  updateDarkBtn();
}

function updateDarkBtn() {
  const btn = el('dark-toggle');
  if (btn) btn.innerHTML = state.darkMode
    ? '<span>☀️</span><span>Light Mode</span>'
    : '<span>🌙</span><span>Dark Mode</span>';
}

// ---- Navigation ----
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = el('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  const navEl = el('nav-' + page);
  if (navEl) navEl.classList.add('active');
  el('page-title').textContent = { dashboard: 'Dashboard', tasks: 'Tasks', pomodoro: 'Pomodoro', subjects: 'Subjects' }[page] || page;
  closeSidebar();
  if (page === 'dashboard') renderDashboard();
  if (page === 'tasks') renderTasks();
  if (page === 'subjects') renderSubjects();
}

// ---- Sidebar ----
function openSidebar() {
  el('sidebar').classList.add('open');
  el('sidebar-overlay').classList.add('open');
}
function closeSidebar() {
  el('sidebar').classList.remove('open');
  el('sidebar-overlay').classList.remove('open');
}

// ---- Dashboard ----
function renderDashboard() {
  const tasks = state.tasks;
  const done = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const productivity = total > 0 ? Math.round(done / total * 100) : 0;
  const avgSubject = Math.round(Object.values(state.subjects).reduce((a, b) => a + b.progress, 0) / 5);

  el('stat-tasks').textContent = `${done}/${total}`;
  el('stat-sessions').textContent = state.sessions;
  el('stat-productivity').textContent = productivity + '%';

  // Progress bars
  el('pb-tasks').style.width = productivity + '%';
  el('pb-tasks-pct').textContent = productivity + '%';
  el('pb-subjects').style.width = avgSubject + '%';
  el('pb-subjects-pct').textContent = avgSubject + '%';
  const sessionPct = Math.min(state.sessions * 20, 100);
  el('pb-sessions').style.width = sessionPct + '%';
  el('pb-sessions-pct').textContent = sessionPct + '%';

  // Overall
  el('overall-pct').textContent = productivity + '%';
  el('pb-overall').style.width = productivity + '%';

  // Quote
  renderQuote();

  // Calendar
  renderCalendar();
}

function renderQuote() {
  const q = QUOTES[state.quoteIdx];
  el('quote-text').textContent = `"${q.text}"`;
  el('quote-author').textContent = '— ' + q.author;
}

function nextQuote() {
  const qt = el('quote-text');
  qt.style.opacity = '0';
  setTimeout(() => {
    state.quoteIdx = (state.quoteIdx + 1) % QUOTES.length;
    renderQuote();
    qt.style.opacity = '1';
  }, 200);
}

function renderCalendar() {
  const d = state.calDate;
  const today = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  el('cal-month').textContent = d.toLocaleString('default', { month: 'long', year: 'numeric' });

  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day blank"></div>';
  for (let d2 = 1; d2 <= daysInMonth; d2++) {
    const isToday = d2 === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    html += `<div class="cal-day${isToday ? ' today' : ''}">${d2}</div>`;
  }
  el('cal-days').innerHTML = html;
}

function calPrev() { state.calDate = new Date(state.calDate.getFullYear(), state.calDate.getMonth() - 1, 1); renderCalendar(); }
function calNext() { state.calDate = new Date(state.calDate.getFullYear(), state.calDate.getMonth() + 1, 1); renderCalendar(); }

// ---- Tasks ----
function renderTasks() {
  const tasks = state.tasks;
  const done = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const productivity = total > 0 ? Math.round(done / total * 100) : 0;

  el('task-total').textContent = total;
  el('task-active').textContent = total - done;
  el('task-done').textContent = done;
  el('task-pb').style.width = productivity + '%';
  el('task-pb-pct').textContent = productivity + '%';

  const filter = state.taskFilter;
  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  if (filtered.length === 0) {
    el('task-list').innerHTML = `
      <div style="text-align:center;padding:32px 0;color:var(--text-muted)">
        <div style="font-size:32px;margin-bottom:8px">✅</div>
        <p style="font-size:13px">${filter === 'done' ? 'No completed tasks yet.' : 'No tasks here. Add one above!'}</p>
      </div>`;
    return;
  }

  el('task-list').innerHTML = filtered.map(t => `
    <div class="task-item" id="task-${t.id}">
      <button class="task-check${t.completed ? ' done' : ''}" onclick="toggleTask('${t.id}')">
        ${t.completed ? '✓' : ''}
      </button>
      <span class="task-text${t.completed ? ' done' : ''}">${escHtml(t.text)}</span>
      <span class="chip ${SUBJECT_COLORS_CHIP[t.subject] || 'chip-gray'}">${t.subject}</span>
      <button class="btn btn-danger btn-icon" onclick="deleteTask('${t.id}')" title="Delete">🗑</button>
    </div>
  `).join('');
}

function addTask() {
  const input = el('task-input');
  const subjectEl = el('task-subject');
  const text = input.value.trim();
  if (!text) return;
  state.tasks.unshift({ id: uuid(), text, completed: false, subject: subjectEl.value, createdAt: Date.now() });
  input.value = '';
  save();
  renderTasks();
}

function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (t) { t.completed = !t.completed; save(); renderTasks(); }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  save();
  renderTasks();
}

function clearDone() {
  state.tasks = state.tasks.filter(t => !t.completed);
  save();
  renderTasks();
}

function setFilter(f) {
  state.taskFilter = f;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el('filter-' + f).classList.add('active');
  renderTasks();
}

// ---- Pomodoro ----
const TIMER_MODES = {
  focus: { label: 'Focus', duration: 25 * 60 },
  break: { label: 'Break', duration: 5 * 60 },
};

function setTimerMode(mode) {
  if (state.timer.interval) clearInterval(state.timer.interval);
  state.timer.running = false;
  state.timer.mode = mode;
  state.timer.timeLeft = TIMER_MODES[mode].duration;
  el('timer-mode-label').textContent = TIMER_MODES[mode].label + ' Session';
  el('btn-play').textContent = '▶';
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  el('tab-' + mode).classList.add('active');
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const { timeLeft, mode } = state.timer;
  const duration = TIMER_MODES[mode].duration;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  el('timer-time').textContent = `${fmt2(mins)}:${fmt2(secs)}`;

  // SVG ring
  const r = 88; const circ = 2 * Math.PI * r;
  const progress = timeLeft / duration;
  const offset = circ * (1 - progress);
  el('timer-ring-fg').style.strokeDasharray = circ;
  el('timer-ring-fg').style.strokeDashoffset = offset;
  el('timer-ring-fg').style.stroke = mode === 'focus' ? '#9b66d4' : '#60a8f0';
}

function toggleTimer() {
  if (state.timer.running) {
    clearInterval(state.timer.interval);
    state.timer.running = false;
    el('btn-play').textContent = '▶';
  } else {
    state.timer.running = true;
    el('btn-play').textContent = '⏸';
    state.timer.interval = setInterval(() => {
      state.timer.timeLeft--;
      if (state.timer.timeLeft <= 0) {
        clearInterval(state.timer.interval);
        state.timer.running = false;
        el('btn-play').textContent = '▶';
        playBeep();
        if (state.timer.mode === 'focus') {
          state.sessions++;
          save();
          renderPomoDots();
          updateSessionStats();
        }
        state.timer.timeLeft = 0;
      }
      updateTimerDisplay();
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(state.timer.interval);
  state.timer.running = false;
  state.timer.timeLeft = TIMER_MODES[state.timer.mode].duration;
  el('btn-play').textContent = '▶';
  updateTimerDisplay();
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(); osc.stop(ctx.currentTime + 0.8);
  } catch (_) {}
}

function renderPomoDots() {
  const count = Math.max(state.sessions, 4);
  el('pomo-dots').innerHTML = Array.from({ length: count }, (_, i) =>
    `<div class="pomo-dot ${i < state.sessions ? 'done' : 'pending'}">${i + 1}</div>`
  ).join('');
}

function updateSessionStats() {
  el('stat-sess-count').textContent = state.sessions;
  const total = state.sessions * 25;
  const h = Math.floor(total / 60), m = total % 60;
  el('stat-sess-hours').textContent = `${h}h${m}m`;
  el('stat-sess-streak').textContent = `${Math.min(state.sessions, 4)}/4`;
}

// ---- Subjects ----
function renderSubjects() {
  const avg = Math.round(Object.values(state.subjects).reduce((a, b) => a + b.progress, 0) / 5);
  const totalHrs = Object.values(state.subjects).reduce((a, b) => a + b.hours, 0);
  el('subj-avg').textContent = avg + '%';
  el('subj-hrs').textContent = totalHrs + 'h';
  el('subj-overall-pb').style.width = avg + '%';
  el('subj-overall-pct').textContent = avg + '%';

  const container = el('subjects-list');
  container.innerHTML = Object.entries(state.subjects).map(([name, data]) => {
    const cfg = SUBJECT_CFG[name];
    return `
      <div class="subject-card">
        <div class="subject-header" onclick="toggleSubjectPanel('${name}')">
          <div class="subject-icon" style="background:${cfg.gradient}">${cfg.emoji}</div>
          <div class="subject-body">
            <div class="subject-name">${name}</div>
            <div class="subject-progress-row">
              <div class="progress-track" style="flex:1;height:6px">
                <div class="progress-fill" style="width:${data.progress}%;background:${cfg.gradient}"></div>
              </div>
              <span style="font-size:12px;font-weight:700;color:var(--text-muted);margin-left:8px">${data.progress}%</span>
            </div>
            <div style="margin-top:6px">
              <span class="chip ${cfg.chip}">${data.hours}h studied</span>
            </div>
          </div>
        </div>
        <div class="subject-controls" id="subj-ctrl-${name}">
          <div class="ctrl-row">
            <label>Progress</label>
            <div class="num-ctrl">
              <button class="num-btn" onclick="adjustSubj('${name}','progress',-5)">−</button>
              <span class="num-val" id="subj-prog-${name}">${data.progress}%</span>
              <button class="num-btn" onclick="adjustSubj('${name}','progress',5)">+</button>
            </div>
          </div>
          <div class="ctrl-row">
            <label>Hours studied</label>
            <div class="num-ctrl">
              <button class="num-btn" onclick="adjustSubj('${name}','hours',-1)">−</button>
              <span class="num-val" id="subj-hrs-${name}">${data.hours}h</span>
              <button class="num-btn" onclick="adjustSubj('${name}','hours',1)">+</button>
            </div>
          </div>
          <div>
            <label style="font-size:12px;color:var(--text-muted);font-weight:500;display:block;margin-bottom:6px">Notes</label>
            <textarea class="form-control" rows="2" placeholder="Notes for ${name}..."
              onchange="updateSubjNotes('${name}',this.value)">${escHtml(data.notes)}</textarea>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleSubjectPanel(name) {
  const panel = el('subj-ctrl-' + name);
  panel.classList.toggle('open');
}

function adjustSubj(name, field, delta) {
  if (field === 'progress') {
    state.subjects[name].progress = Math.max(0, Math.min(100, state.subjects[name].progress + delta));
    el('subj-prog-' + name).textContent = state.subjects[name].progress + '%';
  } else {
    state.subjects[name].hours = Math.max(0, state.subjects[name].hours + delta);
    el('subj-hrs-' + name).textContent = state.subjects[name].hours + 'h';
  }
  save();
  // Re-render to update bars
  renderSubjects();
  el('subj-ctrl-' + name).classList.add('open');
}

function updateSubjNotes(name, val) {
  state.subjects[name].notes = val;
  save();
}

// ---- Helpers ----
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Init ----
function init() {
  initTheme();
  navigate('dashboard');
  updateTimerDisplay();
  renderPomoDots();
  updateSessionStats();

  // Enter key on task input
  el('task-input').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  // Date in topbar
  el('topbar-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', init);
