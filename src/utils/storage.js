// Local Storage Keys
const KEYS = {
  PROGRESS: 'gre_progress',
  STREAK: 'gre_streak',
  FAVOURITES: 'gre_favourites',
  BOOKMARKS: 'gre_bookmarks',
  SESSIONS: 'gre_sessions',
  GAME_SCORES: 'gre_game_scores',
  LAST_WORDLISTS: 'gre_last_wordlists',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed', e);
  }
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export function getProgress() {
  return get(KEYS.PROGRESS, {});
}

export function initializeProgress(allWords) {
  const existing = getProgress();
  let changed = false;
  allWords.forEach((w) => {
    if (!existing[w.word]) {
      existing[w.word] = {
        word: w.word,
        score: 0,
        interval: 1,
        lastSeen: null,
        sessionsSinceLastSeen: 0,
        totalRight: 0,
        totalLeft: 0,
      };
      changed = true;
    }
  });
  if (changed) set(KEYS.PROGRESS, existing);
  return existing;
}

export function updateWordProgress(word, direction) {
  const progress = getProgress();
  const entry = progress[word] || {
    word,
    score: 0,
    interval: 1,
    lastSeen: null,
    sessionsSinceLastSeen: 0,
    totalRight: 0,
    totalLeft: 0,
  };

  const today = new Date().toISOString().split('T')[0];

  if (direction === 'right') {
    entry.score = entry.score + 1;
    entry.interval = Math.min(entry.interval * 2, 30);
    entry.totalRight = (entry.totalRight || 0) + 1;
  } else {
    entry.score = Math.max(0, entry.score - 1);
    entry.interval = 1;
    entry.totalLeft = (entry.totalLeft || 0) + 1;
  }

  entry.lastSeen = today;
  entry.sessionsSinceLastSeen = 0;

  progress[word] = entry;
  set(KEYS.PROGRESS, progress);
  return entry;
}

export function getWordProgress(word) {
  const progress = getProgress();
  return progress[word] || null;
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export function getStreak() {
  return get(KEYS.STREAK, { lastStudyDate: null, currentStreak: 0 });
}

export function updateStreak() {
  const today = new Date().toISOString().split('T')[0];
  const streak = getStreak();

  if (streak.lastStudyDate === today) return streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  if (streak.lastStudyDate === yStr) {
    streak.currentStreak = (streak.currentStreak || 0) + 1;
  } else {
    streak.currentStreak = 1;
  }

  streak.lastStudyDate = today;
  set(KEYS.STREAK, streak);
  return streak;
}

// ─── Favourites ───────────────────────────────────────────────────────────────

export function getFavourites() {
  return get(KEYS.FAVOURITES, []);
}

export function toggleFavourite(word) {
  const favs = getFavourites();
  const idx = favs.indexOf(word);
  if (idx === -1) favs.push(word);
  else favs.splice(idx, 1);
  set(KEYS.FAVOURITES, favs);
  return favs;
}

export function isFavourite(word) {
  return getFavourites().includes(word);
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export function getBookmarks() {
  return get(KEYS.BOOKMARKS, []);
}

export function toggleBookmark(word) {
  const bookmarks = getBookmarks();
  const idx = bookmarks.indexOf(word);
  if (idx === -1) bookmarks.push(word);
  else bookmarks.splice(idx, 1);
  set(KEYS.BOOKMARKS, bookmarks);
  return bookmarks;
}

export function isBookmarked(word) {
  return getBookmarks().includes(word);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function getSessions() {
  return get(KEYS.SESSIONS, 0);
}

export function incrementSessions() {
  const n = getSessions() + 1;
  set(KEYS.SESSIONS, n);
  return n;
}

// ─── Game Scores ──────────────────────────────────────────────────────────────

export function getGameScores() {
  return get(KEYS.GAME_SCORES, {});
}

export function saveGameScore(phrase, accuracy) {
  const scores = getGameScores();
  scores[phrase] = { accuracy, date: new Date().toISOString() };
  set(KEYS.GAME_SCORES, scores);
  return scores;
}

// ─── Last Studied Wordlists ───────────────────────────────────────────────────

export function getLastWordlists() {
  return get(KEYS.LAST_WORDLISTS, []);
}

export function addLastWordlist(num) {
  const list = getLastWordlists();
  const filtered = list.filter((n) => n !== num);
  filtered.unshift(num);
  set(KEYS.LAST_WORDLISTS, filtered.slice(0, 4));
}

// ─── Reset ────────────────────────────────────────────────────────────────────

export function resetWordlist(wordlistNumber, allWords) {
  const progress = getProgress();
  allWords
    .filter((w) => w.wordlistNumber === wordlistNumber)
    .forEach((w) => {
      progress[w.word] = {
        word: w.word,
        score: 0,
        interval: 1,
        lastSeen: null,
        sessionsSinceLastSeen: 0,
        totalRight: 0,
        totalLeft: 0,
      };
    });
  set(KEYS.PROGRESS, progress);
}

export function resetAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

// ─── Stats Helpers ────────────────────────────────────────────────────────────

export function getWordlistStats(wordlistNumber, allWords) {
  const progress = getProgress();
  const words = allWords.filter((w) => w.wordlistNumber === wordlistNumber);
  const total = words.length;
  const studied = words.filter((w) => progress[w.word]?.lastSeen).length;
  const mastered = words.filter((w) => (progress[w.word]?.score || 0) >= 3).length;
  return { total, studied, mastered, pct: total ? Math.round((mastered / total) * 100) : 0 };
}

export function getOverallStats(allWords) {
  const progress = getProgress();
  const total = allWords.length;
  const studied = allWords.filter((w) => progress[w.word]?.lastSeen).length;
  const mastered = allWords.filter((w) => (progress[w.word]?.score || 0) >= 3).length;
  return { total, studied, mastered, pct: total ? Math.round((mastered / total) * 100) : 0 };
}
