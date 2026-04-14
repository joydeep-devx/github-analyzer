# GitHub Profile Analyzer

Analyze any GitHub profile in seconds — get a developer score, rank, language breakdown, accurate commit streaks, and a 90-day activity chart, all in a stunning glassmorphism dashboard.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?logo=chart.js&logoColor=white)
![GitHub GraphQL API](https://img.shields.io/badge/GitHub-GraphQL%20API-181717?logo=github&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-Visit%20App-7c3aed?style=flat)](https://YOUR_DEPLOYED_URL)

## 🌐 Live Demo

#### 👉 Try it live → https://github-analyzer-0mnp.onrender.com



## ✨ Features

- 🔍 **Instant Profile Search** — Enter any GitHub username and get a full analysis
- 🏆 **Developer Rank & Score** — Composite score (0–1000) across 9 weighted metrics
- 📊 **Score Breakdown** — Animated bar chart showing each metric's contribution
- 📅 **Commit Activity** — Accurate 90-day bar chart powered by the **GitHub GraphQL API**
- 🔥 **Streak Tracking** — Current streak and longest streak (full calendar year, not limited to 90 days)
- 🌐 **Language Breakdown** — Doughnut chart with byte-level language analysis across repos
- 📦 **Top Repositories** — 6 highest-starred repos with stars, forks, and language tags
- 💅 **Glassmorphism UI** — Dark-mode dashboard with animated background blobs, micro-animations, and counter effects
- 🛡️ **Secure Backend** — Express proxy with Helmet, CORS, and rate limiting; GitHub token never exposed to the client


## 🏅 Rank Tiers

| Score | Rank |
|-------|------|
| 900–1000 | 🏆 Legendary Dev |
| 750–899 | 💎 Elite Contributor |
| 600–749 | 🚀 Senior Developer |
| 450–599 | ⚡ Mid-Level Dev |
| 300–449 | 🌱 Rising Coder |
| 150–299 | 🔰 Junior Developer |
| 0–149 | 👶 Beginner |


## 🗂️ Project Structure

```
github-analyzer/
├── public/
│   ├── index.html          # Single-page frontend
│   ├── css/
│   │   └── styles.css      # Glassmorphism dark UI
│   └── js/
│       └── app.js          # Chart.js, API calls, animations
├── server/
│   ├── index.js            # Express entry point (Helmet, CORS, rate limit)
│   ├── routes/
│   │   └── github.js       # All API routes + GraphQL helper
│   └── utils/
│       └── ranking.js      # Scoring algorithm & rank tiers
├── .env                    # GitHub token (not committed)
├── .gitignore
└── package.json
```


## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A GitHub Personal Access Token with `read:user` and `repo` scopes

### 2. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/github-analyzer.git
cd github-analyzer
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure your GitHub token

Create a `.env` file in the project root:

```env
GITHUB_TOKEN=ghp_your_token_here
PORT=3000
```

> **Generating a token:** Go to [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token → Select scopes: `read:user` and `repo`.

### 5. Start the server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

Open **http://localhost:3000** in your browser.



## 🔌 API Endpoints

All endpoints are proxied through the Express backend to keep your GitHub token secure.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/github/user/:username` | Basic profile info |
| `GET` | `/api/github/repos/:username` | All public repositories |
| `GET` | `/api/github/languages/:username` | Aggregated language breakdown (top 8) |
| `GET` | `/api/github/contributions/:username` | GraphQL contribution data (streaks + calendar) |
| `GET` | `/api/github/stats/:username` | Full composite stats + rank score |

### Example response — `/api/github/stats/:username`

```json
{
  "success": true,
  "data": {
    "user": { "login": "torvalds", "name": "Linus Torvalds", ... },
    "metrics": {
      "totalStars": 12400,
      "totalForks": 3800,
      "totalCommits90d": 42,
      "currentStreak": 5,
      "longestStreak": 21,
      "languageCount": 7,
      "dailyActivity": { "2025-01-01": 3, "2025-01-02": 0, ... }
    },
    "topRepos": [ ... ],
    "score": 874,
    "rank": { "rank": "💎 Elite Contributor", "color": "#9333ea" },
    "breakdown": { "stars": { "points": 200, "max": 200 }, ... }
  }
}
```


## 📐 Scoring Algorithm

The composite score is calculated across **9 metrics** (max 1000 points):

| Metric | Max Points | Threshold |
|--------|-----------|-----------|
| Total Stars | 200 | 500 stars |
| Commit Streak | 150 | 30 days |
| Commits (90 days) | 150 | 300 commits |
| Followers | 150 | 1,000 followers |
| Public Repos | 100 | 100 repos |
| Total Forks | 100 | 200 forks |
| Language Diversity | 50 | 10 languages |
| Account Age | 50 | 5 years |
| Issues & PRs | 50 | 100 issues/PRs |

Each metric is linearly clamped: `score = min(value, threshold) / threshold × maxPoints`.


## 🛠️ Tech Stack

**Backend**
- [Express.js](https://expressjs.com/) — HTTP server and API proxy
- [Axios](https://axios-http.com/) — GitHub REST + GraphQL API requests
- [Helmet](https://helmetjs.github.io/) — Security headers
- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) — API abuse protection
- [dotenv](https://github.com/motdotla/dotenv) — Environment variable management

**Frontend**
- Vanilla HTML, CSS, JavaScript — no framework overhead
- [Chart.js 4](https://www.chartjs.org/) — Doughnut and bar charts
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — Typography

**APIs**
- [GitHub REST API v3](https://docs.github.com/en/rest) — User info, repos, languages
- [GitHub GraphQL API v4](https://docs.github.com/en/graphql) — Accurate contribution calendar & streaks


## ⚠️ Why GraphQL for Commits?

The GitHub REST API's `/events` endpoint:
- Returns at most **~300 events**
- Only covers the **last 90 days**
- **Drops events** silently under high traffic

The analyzer uses the **GraphQL `contributionsCollection` query** — the same data source GitHub uses for the green contribution graph on profiles — giving accurate full-year streaks and reliable daily counts.


