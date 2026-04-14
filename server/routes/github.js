const express = require('express');
const axios   = require('axios');
const { calculateScore } = require('../utils/ranking');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USERNAME_REGEX = /^[a-zA-Z0-9-]{1,39}$/;

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'github-profile-analyzer',
  };
}

function sanitizeUsername(username) {
  if (!USERNAME_REGEX.test(username)) {
    throw new Error('Invalid GitHub username format');
  }
  return username;
}

async function githubGet(url) {
  const res = await axios.get(url, { headers: githubHeaders() });
  return res.data;
}

function handleGitHubError(err, res) {
  if (err.response) {
    const status = err.response.status;
    if (status === 404)       return res.status(404).json({ success: false, error: 'GitHub user not found' });
    if (status === 403)       return res.status(429).json({ success: false, error: 'GitHub API rate limit exceeded. Please try again later.' });
    if (status === 401)       return res.status(500).json({ success: false, error: 'Invalid GitHub token configuration' });
    return res.status(status).json({ success: false, error: err.response.data?.message || 'GitHub API error' });
  }
  if (err.message === 'Invalid GitHub username format') {
    return res.status(400).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: 'Internal server error' });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/github/user/:username
 * Basic profile info
 */
router.get('/user/:username', async (req, res) => {
  try {
    const username = sanitizeUsername(req.params.username);
    const data = await githubGet(`https://api.github.com/users/${username}`);

    const accountAgeMs   = Date.now() - new Date(data.created_at).getTime();
    const accountAgeYears = accountAgeMs / (1000 * 60 * 60 * 24 * 365.25);

    res.json({
      success: true,
      data: {
        login:        data.login,
        name:         data.name,
        bio:          data.bio,
        avatar_url:   data.avatar_url,
        html_url:     data.html_url,
        location:     data.location,
        company:      data.company,
        blog:         data.blog,
        public_repos: data.public_repos,
        followers:    data.followers,
        following:    data.following,
        created_at:   data.created_at,
        account_age_years: parseFloat(accountAgeYears.toFixed(1)),
      },
    });
  } catch (err) {
    handleGitHubError(err, res);
  }
});

/**
 * GET /api/github/repos/:username
 * All repos with core metrics
 */
router.get('/repos/:username', async (req, res) => {
  try {
    const username = sanitizeUsername(req.params.username);
    const data = await githubGet(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
    );

    const repos = data.map(r => ({
      name:        r.name,
      description: r.description,
      html_url:    r.html_url,
      stars:       r.stargazers_count,
      forks:       r.forks_count,
      language:    r.language,
      size:        r.size,
      topics:      r.topics || [],
      created_at:  r.created_at,
      updated_at:  r.updated_at,
      is_fork:     r.fork,
    }));

    res.json({ success: true, data: repos });
  } catch (err) {
    handleGitHubError(err, res);
  }
});

/**
 * GET /api/github/languages/:username
 * Aggregated language breakdown (top 8)
 */
router.get('/languages/:username', async (req, res) => {
  try {
    const username = sanitizeUsername(req.params.username);

    // Get top 30 non-fork repos to avoid rate limit abuse
    const repos = await githubGet(
      `https://api.github.com/users/${username}/repos?per_page=30&sort=updated`
    );
    const ownRepos = repos.filter(r => !r.fork).slice(0, 20);

    const langMap = {};
    await Promise.all(
      ownRepos.map(async repo => {
        try {
          const langs = await githubGet(
            `https://api.github.com/repos/${username}/${repo.name}/languages`
          );
          for (const [lang, bytes] of Object.entries(langs)) {
            langMap[lang] = (langMap[lang] || 0) + bytes;
          }
        } catch (_) { /* skip if individual repo fails */ }
      })
    );

    const totalBytes = Object.values(langMap).reduce((s, b) => s + b, 0);
    const sorted = Object.entries(langMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    const languages = sorted.map(([name, bytes]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? parseFloat(((bytes / totalBytes) * 100).toFixed(1)) : 0,
    }));

    res.json({ success: true, data: { languages, totalBytes } });
  } catch (err) {
    handleGitHubError(err, res);
  }
});

// ─── GraphQL helper for contributions ────────────────────────────────────────

async function fetchContributionsGraphQL(username) {
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  const response = await axios.post(
    'https://api.github.com/graphql',
    { query, variables: { username } },
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || 'GraphQL error');
  }

  const calendar =
    response.data.data.user.contributionsCollection.contributionCalendar;

  const allDays = calendar.weeks.flatMap(week => week.contributionDays);

  // Current streak (walk backwards from today)
  let currentStreak = 0;
  for (let i = allDays.length - 1; i >= 0; i--) {
    if (allDays[i].contributionCount > 0) currentStreak++;
    else break;
  }

  // Longest streak (full calendar year)
  let longestStreak = 0;
  let tempStreak = 0;
  for (const day of allDays) {
    if (day.contributionCount > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Last 90 days
  const last90Days = allDays.slice(-90);
  const totalCommits90d = last90Days.reduce((sum, d) => sum + d.contributionCount, 0);

  // dailyMap: { 'YYYY-MM-DD': count } — matches what buildActivityChart() expects
  const dailyMap = {};
  for (const d of last90Days) {
    dailyMap[d.date] = d.contributionCount;
  }

  return {
    totalContributions: calendar.totalContributions,
    currentStreak,
    longestStreak,
    totalCommits90d,
    dailyMap,
    // array form for the standalone /contributions endpoint
    dailyActivity: last90Days.map(d => ({ date: d.date, count: d.contributionCount })),
  };
}

/**
 * GET /api/github/contributions/:username
 * Standalone GraphQL-based contribution data (accurate streaks + calendar)
 */
router.get('/contributions/:username', async (req, res) => {
  try {
    const username = sanitizeUsername(req.params.username);
    const contrib = await fetchContributionsGraphQL(username);
    res.json({
      success: true,
      data: {
        totalContributions: contrib.totalContributions,
        currentStreak:      contrib.currentStreak,
        longestStreak:      contrib.longestStreak,
        totalCommits90d:    contrib.totalCommits90d,
        dailyActivity:      contrib.dailyActivity,
      },
    });
  } catch (err) {
    handleGitHubError(err, res);
  }
});

/**
 * GET /api/github/stats/:username
 * Full composite stats + rank score
 */
router.get('/stats/:username', async (req, res) => {
  try {
    const username = sanitizeUsername(req.params.username);

    // Fan out REST calls + GraphQL contributions in parallel
    const [userRes, reposRes, contrib] = await Promise.all([
      githubGet(`https://api.github.com/users/${username}`),
      githubGet(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
      fetchContributionsGraphQL(username),   // ← accurate GraphQL data
    ]);

    // Aggregate stars & forks
    const ownRepos   = reposRes.filter(r => !r.fork);
    const totalStars = ownRepos.reduce((s, r) => s + r.stargazers_count, 0);
    const totalForks = ownRepos.reduce((s, r) => s + r.forks_count, 0);

    // Language diversity from primary language field (fast path)
    const langSet = new Set(reposRes.map(r => r.language).filter(Boolean));

    const accountAgeYears = (Date.now() - new Date(userRes.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    const { currentStreak, longestStreak, totalCommits90d, dailyMap } = contrib;

    // Score
    const scoreData = {
      totalStars,
      totalForks,
      followers:      userRes.followers,
      publicRepos:    userRes.public_repos,
      currentStreak,
      totalCommits90d,
      languageCount:  langSet.size,
      accountAgeYears,
      totalIssuesAndPRs: 0,
    };

    const { total, breakdown, rank } = calculateScore(scoreData);

    res.json({
      success: true,
      data: {
        user: {
          login:        userRes.login,
          name:         userRes.name,
          bio:          userRes.bio,
          avatar_url:   userRes.avatar_url,
          html_url:     userRes.html_url,
          location:     userRes.location,
          company:      userRes.company,
          blog:         userRes.blog,
          public_repos: userRes.public_repos,
          followers:    userRes.followers,
          following:    userRes.following,
          created_at:   userRes.created_at,
          account_age_years: parseFloat(accountAgeYears.toFixed(1)),
        },
        metrics: {
          totalStars,
          totalForks,
          totalCommits90d,
          currentStreak,
          longestStreak,
          languageCount: langSet.size,
          dailyActivity: dailyMap,   // { 'YYYY-MM-DD': count } map
        },
        topRepos: ownRepos
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 6)
          .map(r => ({
            name:        r.name,
            description: r.description,
            html_url:    r.html_url,
            stars:       r.stargazers_count,
            forks:       r.forks_count,
            language:    r.language,
            topics:      r.topics || [],
            updated_at:  r.updated_at,
          })),
        score: total,
        breakdown,
        rank,
      },
    });
  } catch (err) {
    handleGitHubError(err, res);
  }
});

/**
 * GET /api/github/languages/:username  (already defined above)
 * This route is separate for lazy-loading language chart
 */

module.exports = router;
