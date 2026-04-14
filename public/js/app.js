// ─── Language Color Map ───────────────────────────────────────────────────────
const LANG_COLORS = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', 'C++': '#f34b7d', 'C#': '#178600', C: '#555555',
  Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95',
  Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', HTML: '#e34c26',
  CSS: '#563d7c', SCSS: '#c6538c', Shell: '#89e051', Vue: '#41b883',
  Lua: '#000080', R: '#198CE7', Scala: '#c22d40', Elixir: '#6e4a7e',
  Haskell: '#5e5086', Clojure: '#db5855', Vim: '#199f4b', Nix: '#7e7eff',
};

function getLangColor(lang) {
  return LANG_COLORS[lang] || `hsl(${Math.abs([...lang].reduce((h, c) => (h = c.charCodeAt(0) + ((h << 5) - h)), 0)) % 360}, 65%, 55%)`;
}

// ─── Chart.js default dark theme ────────────────────────────────────────────
const CHART_DEFAULTS = {
  color: 'rgba(255,255,255,0.6)',
  borderColor: 'rgba(255,255,255,0.08)',
  font: { family: "'Space Grotesk', sans-serif", size: 11 },
};

// ─── Utility helpers ─────────────────────────────────────────────────────────

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function animateCounter(el, target, duration = 1400) {
  const start = performance.now();
  const isFloat = target % 1 !== 0;
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = target * ease;
    el.textContent = isFloat ? val.toFixed(1) : Math.round(val).toLocaleString();
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── API Calls ───────────────────────────────────────────────────────────────

async function fetchStats(username) {
  const res = await fetch(`/api/github/stats/${encodeURIComponent(username)}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json.data;
}

async function fetchLanguages(username) {
  const res = await fetch(`/api/github/languages/${encodeURIComponent(username)}`);
  const json = await res.json();
  if (!json.success) return null;
  return json.data;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const ICONS = {
  location: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  company:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  link:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  calendar: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  star:     `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  fork:     `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
  extLink:  `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
};

// ─── Chart instances (for cleanup) ───────────────────────────────────────────
let langChart = null;
let activityChart = null;
let rankChart = null;

function destroyCharts() {
  [langChart, activityChart, rankChart].forEach(c => c && c.destroy());
  langChart = activityChart = rankChart = null;
}

// ─── Skeleton HTML ────────────────────────────────────────────────────────────

function skeletonProfileHTML() {
  return `
    <div class="glass skeleton-card">
      <div class="sk-flex">
        <div class="skeleton sk-avatar"></div>
        <div class="sk-block">
          <div class="skeleton sk-line" style="width:60%;height:22px;margin-bottom:8px"></div>
          <div class="skeleton sk-line" style="width:40%"></div>
          <div class="skeleton sk-line" style="width:80%;margin-top:12px"></div>
          <div class="skeleton sk-line" style="width:55%;margin-top:6px"></div>
        </div>
      </div>
    </div>`;
}

// ─── Render Profile Header ────────────────────────────────────────────────────

function renderProfile(user, score, rank, breakdown) {
  const circumference = 2 * Math.PI * 52;
  const dashOffset    = circumference * (1 - score / 1000);

  const blogUrl = user.blog
    ? (user.blog.startsWith('http') ? user.blog : 'https://' + user.blog)
    : null;

  return `
    <div class="glass profile-header">
      <div class="avatar-wrap">
        <div class="avatar-ring"></div>
        <img class="avatar" src="${user.avatar_url}" alt="${user.login}'s avatar" loading="lazy" />
      </div>

      <div class="profile-info">
        <div class="profile-name">${user.name || user.login}</div>
        <div class="profile-login"><a href="${user.html_url}" target="_blank" rel="noopener">@${user.login}</a></div>
        ${user.bio ? `<div class="profile-bio">${user.bio}</div>` : ''}
        <div class="profile-meta">
          ${user.location ? `<span class="meta-pill">${ICONS.location} ${user.location}</span>` : ''}
          ${user.company  ? `<span class="meta-pill">${ICONS.company}  ${user.company}</span>`  : ''}
          ${blogUrl       ? `<span class="meta-pill">${ICONS.link}    <a href="${blogUrl}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${user.blog}</a></span>` : ''}
          ${user.created_at ? `<span class="meta-pill">${ICONS.calendar} Joined ${formatDate(user.created_at)} · ${user.account_age_years}y</span>` : ''}
        </div>
      </div>

      <div class="rank-section">
        <div class="score-arc-wrap">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle class="score-track" cx="65" cy="65" r="52"/>
            <circle id="scoreFill" class="score-fill" cx="65" cy="65" r="52"
              stroke="${rank.color}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${circumference}"
            />
          </svg>
          <div class="score-text">
            <span class="score-number" id="scoreNum" style="color:${rank.color}">0</span>
            <span class="score-label">/ 1000</span>
          </div>
        </div>
        <div class="rank-badge" style="color:${rank.color};border-color:${rank.color}">
          ${rank.rank}
        </div>
      </div>
    </div>`;
}

// ─── Render Stats Grid ─────────────────────────────────────────────────────────

function renderStats(user, metrics) {
  const cards = [
    { icon: '📦', value: user.public_repos, label: 'Public Repos' },
    { icon: '⭐', value: metrics.totalStars, label: 'Total Stars'  },
    { icon: '👥', value: user.followers,     label: `Followers · ${user.following} Following` },
    { icon: '🍴', value: metrics.totalForks, label: 'Total Forks'  },
  ];

  return `
    <div class="stats-grid">
      ${cards.map((c, i) => `
        <div class="glass stat-card">
          <div class="stat-icon">${c.icon}</div>
          <div class="stat-value" data-target="${c.value}" id="statVal${i}">0</div>
          <div class="stat-label">${c.label}</div>
        </div>
      `).join('')}
    </div>`;
}

// ─── Render Language Chart ─────────────────────────────────────────────────────

function renderLangCard(langData) {
  const langs = langData?.languages || [];
  const pills  = langs.map(l =>
    `<span class="lang-pill"><span class="lang-dot" style="background:${getLangColor(l.name)}"></span>${l.name} <strong>${l.percentage}%</strong></span>`
  ).join('');

  return `
    <div class="glass chart-card">
      <div class="card-title">🌐 Language Breakdown</div>
      <div class="chart-container"><canvas id="langChart"></canvas></div>
      <div class="lang-pills">${pills}</div>
    </div>`;
}

// ─── Render Commit Activity ────────────────────────────────────────────────────

function renderActivityCard(metrics) {
  return `
    <div class="glass chart-card">
      <div class="card-title">📅 Commit Activity — Last 90 Days</div>
      <div class="streak-stats">
        <div class="streak-item">
          <div class="streak-num" style="color:#f97316" id="curStreak">0</div>
          <div class="streak-lbl">🔥 Current Streak</div>
        </div>
        <div class="streak-item">
          <div class="streak-num" style="color:#a855f7" id="longestStreak">0</div>
          <div class="streak-lbl">🏅 Longest Streak</div>
        </div>
        <div class="streak-item">
          <div class="streak-num" style="color:#06b6d4" id="totalCommits">0</div>
          <div class="streak-lbl">💾 Total Commits</div>
        </div>
      </div>
      <div class="chart-container"><canvas id="activityChart"></canvas></div>
    </div>`;
}

// ─── Render Repos ─────────────────────────────────────────────────────────────

function renderRepos(topRepos) {
  const cards = topRepos.map(r => `
    <div class="repo-card">
      <div class="repo-name">${r.name}</div>
      ${r.description ? `<div class="repo-desc">${r.description}</div>` : '<div class="repo-desc" style="color:#475569;font-style:italic">No description</div>'}
      <div class="repo-meta">
        ${r.language ? `<span class="lang-badge">${r.language}</span>` : ''}
        <span class="repo-stat">${ICONS.star} ${formatNumber(r.stars)}</span>
        <span class="repo-stat">${ICONS.fork} ${formatNumber(r.forks)}</span>
      </div>
      <a class="repo-link" href="${r.html_url}" target="_blank" rel="noopener">${ICONS.extLink} View on GitHub</a>
    </div>`).join('');

  return `
    <div class="glass">
      <div class="section-title-bar"><div class="card-title">🏆 Top Repositories</div></div>
      <div class="repos-grid">${cards}</div>
    </div>`;
}

// ─── Render Ranking Breakdown ─────────────────────────────────────────────────

function renderRankingCard(score, breakdown, rank) {
  const rows = Object.values(breakdown).map(m => `
    <div class="rank-bar-row">
      <div class="rank-bar-header">
        <span>${m.label}</span>
        <strong>${m.points} / ${m.max}</strong>
      </div>
      <div class="rank-bar-track">
        <div class="rank-bar-fill" data-pct="${(m.points / m.max) * 100}"></div>
      </div>
    </div>`).join('');

  return `
    <div class="glass ranking-card">
      <div class="card-title">📊 Score Breakdown</div>
      <div class="rank-bars">${rows}</div>
      <div class="final-score-display">
        <div class="final-score-num" id="finalScore">0</div>
        <div class="final-score-label">out of 1000 · <span style="color:${rank.color}">${rank.rank}</span></div>
      </div>
    </div>`;
}

// ─── Build Language Doughnut Chart ────────────────────────────────────────────

function buildLangChart(langData) {
  if (!langData?.languages?.length) return;
  const ctx = document.getElementById('langChart');
  if (!ctx) return;

  const labels = langData.languages.map(l => l.name);
  const data   = langData.languages.map(l => l.percentage);
  const colors = labels.map(getLangColor);

  langChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderColor: 'rgba(10,10,15,0.8)', borderWidth: 2, hoverOffset: 8 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      animation: { animateRotate: true, duration: 1200 },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15,15,25,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed}%`,
          },
        },
      },
    },
  });
}

// ─── Build Commit Activity Chart ──────────────────────────────────────────────

function buildActivityChart(dailyActivity) {
  const ctx = document.getElementById('activityChart');
  if (!ctx) return;

  const days = [];
  const values = [];
  const now = new Date();

  for (let i = 89; i >= 0; i--) {
    const d   = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    days.push(key.slice(5));   // MM-DD
    values.push(dailyActivity[key] || 0);
  }

  activityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        data: values,
        backgroundColor: values.map(v =>
          v > 0 ? 'rgba(124, 58, 237, 0.7)' : 'rgba(255,255,255,0.04)'
        ),
        borderColor: values.map(v =>
          v > 0 ? 'rgba(159, 103, 250, 0.9)' : 'rgba(255,255,255,0.06)'
        ),
        borderWidth: 1,
        borderRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,15,25,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            title: items => `Date: ${items[0].label}`,
            label: item  => ` ${item.raw} commit${item.raw !== 1 ? 's' : ''}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(255,255,255,0.3)',
            maxTicksLimit: 15,
            font: { size: 9 },
          },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, precision: 0 },
          grid: { color: 'rgba(255,255,255,0.07)' },
          beginAtZero: true,
        },
      },
    },
  });
}

// ─── Post-render animations ───────────────────────────────────────────────────

function runAnimations(data, langData) {
  const { user, metrics, score, breakdown, rank } = data;

  // Score arc
  const circumference = 2 * Math.PI * 52;
  const fillEl = document.getElementById('scoreFill');
  if (fillEl) {
    setTimeout(() => {
      fillEl.style.strokeDashoffset = circumference * (1 - score / 1000);
    }, 200);
  }

  // Score number
  const scoreNumEl = document.getElementById('scoreNum');
  if (scoreNumEl) animateCounter(scoreNumEl, score);

  // Final score in breakdown card
  const finalEl = document.getElementById('finalScore');
  if (finalEl) animateCounter(finalEl, score);

  // Stat cards
  [user.public_repos, metrics.totalStars, user.followers, metrics.totalForks].forEach((val, i) => {
    const el = document.getElementById(`statVal${i}`);
    if (el) animateCounter(el, val);
  });

  // Streak counters
  const cs = document.getElementById('curStreak');
  const ls = document.getElementById('longestStreak');
  const tc = document.getElementById('totalCommits');
  if (cs) animateCounter(cs, metrics.currentStreak);
  if (ls) animateCounter(ls, metrics.longestStreak);
  if (tc) animateCounter(tc, metrics.totalCommits90d);

  // Ranking bars
  setTimeout(() => {
    document.querySelectorAll('.rank-bar-fill').forEach(el => {
      el.style.width = el.dataset.pct + '%';
    });
  }, 300);

  // Charts
  setTimeout(() => {
    buildLangChart(langData);
    buildActivityChart(metrics.dailyActivity || {});
  }, 200);
}

// ─── Main Render ──────────────────────────────────────────────────────────────

function renderDashboard(data, langData) {
  const { user, metrics, topRepos, score, breakdown, rank } = data;
  const resultsEl = document.getElementById('results');

  destroyCharts();
  resultsEl.innerHTML = '';

  const sections = [
    renderProfile(user, score, rank, breakdown),
    renderStats(user, metrics),
    `<div class="charts-grid">${renderLangCard(langData)}${renderActivityCard(metrics)}</div>`,
    renderRepos(topRepos),
    renderRankingCard(score, breakdown, rank),
  ];

  resultsEl.innerHTML = sections.join('');
  resultsEl.classList.add('visible');

  // Small delay then run animations
  requestAnimationFrame(() => runAnimations(data, langData));
}

function renderError(message) {
  const resultsEl = document.getElementById('results');
  destroyCharts();
  resultsEl.innerHTML = `
    <div class="glass error-card">
      <div class="error-title">Something went wrong</div>
      <div class="error-message">${message}</div>
      <button class="retry-btn" onclick="document.getElementById('searchInput').focus()">Try Again</button>
    </div>`;
  resultsEl.classList.add('visible');
}

function showSkeleton() {
  const resultsEl = document.getElementById('results');
  resultsEl.innerHTML = skeletonProfileHTML() + skeletonProfileHTML();
  resultsEl.classList.add('visible');
}

// ─── Search Logic ─────────────────────────────────────────────────────────────

async function handleSearch() {
  const input   = document.getElementById('searchInput');
  const btn     = document.getElementById('searchBtn');
  const btnText = document.getElementById('btnText');
  const spinner = document.getElementById('spinner');

  const username = input.value.trim();
  if (!username) { input.focus(); return; }

  // Loading state
  btn.disabled = true;
  btnText.textContent = 'Analyzing...';
  spinner.classList.add('active');
  showSkeleton();

  try {
    const [statsData, langData] = await Promise.all([
      fetchStats(username),
      fetchLanguages(username),
    ]);
    renderDashboard(statsData, langData);
  } catch (err) {
    renderError(err.message);
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Analyze';
    spinner.classList.remove('active');
  }
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  const btn   = document.getElementById('searchBtn');

  if (btn)   btn.addEventListener('click', handleSearch);
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });

  // Set Chart.js defaults
  if (window.Chart) {
    Chart.defaults.color           = CHART_DEFAULTS.color;
    Chart.defaults.borderColor     = CHART_DEFAULTS.borderColor;
    Chart.defaults.font.family     = CHART_DEFAULTS.font.family;
    Chart.defaults.font.size       = CHART_DEFAULTS.font.size;
  }
});
