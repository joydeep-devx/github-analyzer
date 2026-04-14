/**
 * Ranking & Scoring System for GitHub Profile Analyzer
 * Calculates a composite score (0-1000) across multiple metrics
 */

const RANK_TIERS = [
  { min: 900, max: 1000, rank: '🏆 Legendary Dev',     badge: 'legendary', color: '#FFD700' },
  { min: 750, max: 899,  rank: '💎 Elite Contributor', badge: 'elite',     color: '#9333ea' },
  { min: 600, max: 749,  rank: '🚀 Senior Developer',  badge: 'senior',    color: '#3b82f6' },
  { min: 450, max: 599,  rank: '⚡ Mid-Level Dev',     badge: 'mid',       color: '#06b6d4' },
  { min: 300, max: 449,  rank: '🌱 Rising Coder',      badge: 'rising',    color: '#10b981' },
  { min: 150, max: 299,  rank: '🔰 Junior Developer',  badge: 'junior',    color: '#eab308' },
  { min: 0,   max: 149,  rank: '👶 Beginner',          badge: 'beginner',  color: '#6b7280' },
];

/**
 * Clamps a value between 0 and max, then scales to maxPoints
 */
function scoreMetric(value, threshold, maxPoints) {
  const clamped = Math.min(value, threshold);
  return Math.round((clamped / threshold) * maxPoints);
}

/**
 * Calculate the composite score breakdown
 * @param {Object} data - aggregated profile data
 * @returns {{ total: number, breakdown: Object, rank: Object }}
 */
function calculateScore(data) {
  const {
    totalStars = 0,
    totalForks = 0,
    followers = 0,
    publicRepos = 0,
    currentStreak = 0,
    totalCommits90d = 0,
    languageCount = 0,
    accountAgeYears = 0,
    totalIssuesAndPRs = 0,
  } = data;

  const breakdown = {
    stars:          { points: scoreMetric(totalStars,        500,  200), max: 200,  label: 'Total Stars'         },
    forks:          { points: scoreMetric(totalForks,        200,  100), max: 100,  label: 'Total Forks'         },
    followers:      { points: scoreMetric(followers,         1000, 150), max: 150,  label: 'Followers'           },
    repos:          { points: scoreMetric(publicRepos,       100,  100), max: 100,  label: 'Public Repos'        },
    streak:         { points: scoreMetric(currentStreak,     30,   150), max: 150,  label: 'Commit Streak'       },
    commits:        { points: scoreMetric(totalCommits90d,   300,  150), max: 150,  label: 'Commits (90 days)'   },
    languages:      { points: scoreMetric(languageCount,     10,   50),  max: 50,   label: 'Language Diversity'  },
    accountAge:     { points: scoreMetric(accountAgeYears,   5,    50),  max: 50,   label: 'Account Age'         },
    issuesAndPRs:   { points: scoreMetric(totalIssuesAndPRs, 100,  50),  max: 50,   label: 'Issues & PRs'        },
  };

  const total = Object.values(breakdown).reduce((sum, m) => sum + m.points, 0);
  const rank  = getRank(total);

  return { total, breakdown, rank };
}

/**
 * Returns the rank tier object for a given score
 */
function getRank(score) {
  return RANK_TIERS.find(t => score >= t.min && score <= t.max) || RANK_TIERS[RANK_TIERS.length - 1];
}

module.exports = { calculateScore, getRank, RANK_TIERS };
