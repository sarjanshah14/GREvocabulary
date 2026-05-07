/**
 * GRE Lexicon — Central Learning Engine
 * Single source of truth for all progress, mastery, streaks, and daily goals.
 */

import { pushCloudData } from './sync';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  PROGRESS:  'gre_progress',   // { [word]: WordState }
  STREAK:    'gre_streak',     // { current, lastDate }
  DAILY:     'gre_daily',      // { date, count, goal }
  BOOKMARKS: 'gre_bookmarks',  // string[]
  SESSIONS:  'gre_sessions',   // number
  GAME_SCORES: 'gre_game_scores', // { [phrase]: { accuracy, date } }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0];
}

function ls_get(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function ls_set(key, value) {
  try { 
    localStorage.setItem(key, JSON.stringify(value)); 
    pushCloudData();
  }
  catch (e) { console.warn('Storage write failed:', e); }
}

// ─── Word State Schema ─────────────────────────────────────────────────────────
//
// learningStage:
//   'new'      → never reviewed (score = 0)
//   'learning' → score 1–2
//   'familiar' → score 3–4
//   'mastered' → score ≥ 5 AND correctCount ≥ 3 AND incorrectCount ≤ 1
//
// This is the ONLY place mastery is defined. Use it everywhere.

function computeStage(state) {
  const { score = 0, correctCount = 0, incorrectCount = 0 } = state;
  if (score === 0) return 'new';
  if (score >= 5 && correctCount >= 3 && incorrectCount <= 1) return 'mastered';
  if (score >= 3) return 'familiar';
  return 'learning';
}

function defaultState(word) {
  return {
    word,
    score: 0,
    reviewCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewed: null,
    nextReview: null,
    interval: 1,             // days until next review
    sessionsSinceLastSeen: 0,
    bookmarked: false,
    learningStage: 'new',
  };
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export function getAllProgress() {
  return ls_get(KEYS.PROGRESS, {});
}

export function getWordState(word) {
  const progress = getAllProgress();
  return progress[word] || defaultState(word);
}

export function updateWordState(word, correct) {
  const progress = getAllProgress();
  const state = progress[word] || defaultState(word);
  const d = today();

  state.reviewCount = (state.reviewCount || 0) + 1;
  state.lastReviewed = d;

  if (correct) {
    state.score = Math.min(10, (state.score || 0) + 1);
    state.correctCount = (state.correctCount || 0) + 1;
    state.interval = Math.min((state.interval || 1) * 2, 30);
  } else {
    state.score = Math.max(0, (state.score || 0) - 1);
    state.incorrectCount = (state.incorrectCount || 0) + 1;
    state.interval = 1;
  }

  // Compute next review date
  const next = new Date();
  next.setDate(next.getDate() + (state.interval || 1));
  state.nextReview = next.toISOString().split('T')[0];
  state.sessionsSinceLastSeen = 0;
  state.learningStage = computeStage(state);

  progress[word] = state;
  ls_set(KEYS.PROGRESS, progress);

  // Side effects
  incrementDaily();

  return state;
}

export function initProgress(allWords) {
  const progress = getAllProgress();
  let changed = false;
  allWords.forEach((w) => {
    if (!progress[w.word]) {
      progress[w.word] = defaultState(w.word);
      changed = true;
    } else {
      // Ensure all fields exist on old entries
      const s = progress[w.word];
      if (s.learningStage === undefined) {
        s.learningStage = computeStage(s);
        changed = true;
      }
    }
  });
  if (changed) ls_set(KEYS.PROGRESS, progress);
  return progress;
}

// ─── Derived Stats ─────────────────────────────────────────────────────────────

export function getAllStats(allWords) {
  const progress = getAllProgress();
  const total = allWords.length;

  let studied = 0, mastered = 0, familiar = 0, learning = 0, unseen = 0;
  allWords.forEach((w) => {
    const s = progress[w.word];
    if (!s || s.learningStage === 'new') { unseen++; return; }
    studied++;
    const stage = s.learningStage || computeStage(s);
    if (stage === 'mastered')       mastered++;
    else if (stage === 'familiar')  familiar++;
    else                             learning++;
  });

  const hfWords = allWords.filter((w) => w.isHighFrequency);
  const hfMastered = hfWords.filter((w) => {
    const s = progress[w.word];
    return s && (s.learningStage === 'mastered' || computeStage(s) === 'mastered');
  }).length;

  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return {
    total, studied, mastered, familiar, learning, unseen, pct,
    hfTotal: hfWords.length,
    hfMastered,
    hfPct: hfWords.length > 0 ? Math.round((hfMastered / hfWords.length) * 100) : 0,
    streak: getStreak(),
    daily: getDailyGoal(),
  };
}

// Subset stats (for HF mode, etc.)
export function getSubsetStats(words) {
  const progress = getAllProgress();
  const total = words.length;
  const mastered = words.filter((w) => {
    const s = progress[w.word];
    return s && (s.learningStage === 'mastered' || computeStage(s) === 'mastered');
  }).length;
  const studied = words.filter((w) => progress[w.word]?.lastReviewed).length;
  return { total, studied, mastered, pct: total > 0 ? Math.round((mastered / total) * 100) : 0 };
}

// ─── Daily Goal ────────────────────────────────────────────────────────────────

export function getDailyGoal() {
  const d = today();
  const stored = ls_get(KEYS.DAILY, { date: d, count: 0, goal: 30 });
  if (stored.date !== d) {
    // New day — reset
    const fresh = { date: d, count: 0, goal: stored.goal || 30 };
    ls_set(KEYS.DAILY, fresh);
    return fresh;
  }
  return stored;
}

export function incrementDaily() {
  const daily = getDailyGoal();
  daily.count = (daily.count || 0) + 1;
  ls_set(KEYS.DAILY, daily);
  return daily;
}

export function setDailyGoal(n) {
  const daily = getDailyGoal();
  daily.goal = n;
  ls_set(KEYS.DAILY, daily);
}

// ─── Streak ────────────────────────────────────────────────────────────────────

export function getStreak() {
  return ls_get(KEYS.STREAK, { current: 0, lastDate: null });
}

export function updateStreak() {
  const d = today();
  const streak = getStreak();
  if (streak.lastDate === d) return streak; // already updated today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  if (streak.lastDate === yStr) {
    streak.current = (streak.current || 0) + 1;
  } else {
    streak.current = 1; // broken or first time
  }
  streak.lastDate = d;
  ls_set(KEYS.STREAK, streak);
  return streak;
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export function getBookmarks() {
  return ls_get(KEYS.BOOKMARKS, []);
}

export function toggleBookmark(word) {
  const bm = getBookmarks();
  const idx = bm.indexOf(word);
  if (idx === -1) bm.push(word);
  else bm.splice(idx, 1);
  ls_set(KEYS.BOOKMARKS, bm);
  return bm;
}

export function isBookmarked(word) {
  return getBookmarks().includes(word);
}

// ─── Session Pool ─────────────────────────────────────────────────────────────
// HF words get 3× weight. Low-score words get (10 - score) weight.

export function getSessionPool(allWords, count = 50) {
  const progress = getAllProgress();
  const d = today();

  const candidates = allWords.map((w) => {
    const s = progress[w.word] || defaultState(w.word);
    return { ...w, ...s };
  });

  // Due = never seen OR nextReview <= today OR sessionsSinceLastSeen >= interval
  const due = candidates.filter((w) => {
    if (!w.lastReviewed) return true;
    if (w.nextReview && w.nextReview <= d) return true;
    return (w.sessionsSinceLastSeen || 0) >= (w.interval || 1);
  });

  let pool = due.length >= count ? due : [...due, ...candidates.filter((w) =>
    !due.find((d) => d.word === w.word)
  ).sort((a, b) => (a.score || 0) - (b.score || 0))];

  // Build weighted array
  const weighted = [];
  pool.forEach((w) => {
    let base = Math.max(1, 10 - (w.score || 0));
    const hfBoost = w.isHighFrequency ? 3 : 1;
    let weight = base * hfBoost;

    // Heavily deprioritize mastered words: 90% chance to skip adding them to the pool
    if (w.learningStage === 'mastered') {
      if (Math.random() > 0.1) return;
      weight = 1; // if it survives, give it minimum weight
    }

    for (let i = 0; i < weight; i++) weighted.push(w);
  });

  // Fisher-Yates shuffle then pick unique
  const shuffled = [...weighted].sort(() => Math.random() - 0.5);
  const seen = new Set();
  const result = [];
  for (const w of shuffled) {
    if (!seen.has(w.word)) {
      seen.add(w.word);
      result.push(w);
      if (result.length >= Math.min(count, pool.length)) break;
    }
  }
  return result;
}

export function filterWords(allWords, mode) {
  switch (mode) {
    case 'high_frequency': return allWords.filter((w) => w.isHighFrequency);
    case 'bookmarks': {
      const bm = getBookmarks();
      return allWords.filter((w) => bm.includes(w.word));
    }
    case 'due': {
      const progress = getAllProgress();
      const d = today();
      return allWords.filter((w) => {
        const s = progress[w.word];
        if (!s?.lastReviewed) return true;
        return s.nextReview ? s.nextReview <= d : (s.sessionsSinceLastSeen || 0) >= (s.interval || 1);
      });
    }
    default: return allWords;
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function getSessions() { return ls_get(KEYS.SESSIONS, 0); }
export function incrementSessions() {
  const n = getSessions() + 1;
  ls_set(KEYS.SESSIONS, n);
  updateStreak();
  return n;
}

// ─── Game Scores ──────────────────────────────────────────────────────────────

export function getGameScores() { return ls_get(KEYS.GAME_SCORES, {}); }
export function saveGameScore(phrase, accuracy) {
  const scores = getGameScores();
  scores[phrase] = { accuracy, date: new Date().toISOString() };
  ls_set(KEYS.GAME_SCORES, scores);
  return scores;
}

// ─── Reset ────────────────────────────────────────────────────────────────────

export function resetAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

// ─── Legacy shims (keep storage.js working) ────────────────────────────────────

export function getProgress() { return getAllProgress(); }
export function updateWordProgress(word, direction) {
  return updateWordState(word, direction === 'right');
}
export function getOverallStats(allWords) {
  const s = getAllStats(allWords);
  return { total: s.total, studied: s.studied, mastered: s.mastered, pct: s.pct };
}
export function getWordlistStats(wordlistNumber, allWords) {
  const words = allWords.filter((w) => w.wordlistNumber === wordlistNumber);
  return getSubsetStats(words);
}
export function initializeProgress(allWords) { return initProgress(allWords); }
export function getFavourites() { return getBookmarks(); }
export function toggleFavourite(word) { return toggleBookmark(word); }
export function isFavourite(word) { return isBookmarked(word); }
export function addLastWordlist() {}  // no-op (feature removed)
export function getLastWordlists() { return []; }
export function resetWordlist() {}    // no-op (feature removed)
