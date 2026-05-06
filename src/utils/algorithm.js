import { getProgress } from './storage';

/**
 * Returns a weighted random session pool.
 * High-frequency words get an extra weight multiplier (3×).
 * Lower-score words appear more often (weight = 10 - score).
 */
export function getSessionPool(allWords, count = 50) {
  const progress = getProgress();

  const candidates = allWords.map((w) => {
    const p = progress[w.word] || { score: 0, interval: 1, sessionsSinceLastSeen: 0, lastSeen: null };
    return { ...w, ...p };
  });

  // Due = never seen OR sessionsSinceLastSeen >= interval
  const due = candidates.filter((w) => !w.lastSeen || (w.sessionsSinceLastSeen || 0) >= w.interval);

  let pool = due;
  if (pool.length < count) {
    const dueSet = new Set(due.map((w) => w.word));
    const extras = candidates.filter((w) => !dueSet.has(w.word)).sort((a, b) => a.score - b.score);
    pool = [...due, ...extras];
  }

  // Weighted shuffle:
  // - base weight  = max(1, 10 - score)   (weak words appear more)
  // - HF multiplier = ×3 if isHighFrequency (HF words always surface more)
  const weighted = [];
  pool.forEach((w) => {
    const base = Math.max(1, 10 - (w.score || 0));
    const hfBoost = w.isHighFrequency ? 3 : 1;
    const weight = base * hfBoost;
    for (let i = 0; i < weight; i++) weighted.push(w);
  });

  const seen = new Set();
  const result = [];
  const shuffled = [...weighted].sort(() => Math.random() - 0.5);

  for (const w of shuffled) {
    if (!seen.has(w.word)) {
      seen.add(w.word);
      result.push(w);
      if (result.length >= Math.min(count, pool.length)) break;
    }
  }

  return result;
}

/**
 * Filters words by session mode.
 */
export function filterWords(allWords, mode, extra = null) {
  switch (mode) {
    case 'all':
      return allWords;
    case 'high_frequency':
      return allWords.filter((w) => w.isHighFrequency);
    case 'bookmarks': {
      const bm = JSON.parse(localStorage.getItem('gre_bookmarks') || '[]');
      return allWords.filter((w) => bm.includes(w.word));
    }
    case 'wordlist':
      return allWords.filter((w) => w.wordlistNumber === extra);
    case 'due': {
      const progress = getProgress();
      return allWords.filter((w) => {
        const p = progress[w.word];
        return !p?.lastSeen || (p.sessionsSinceLastSeen || 0) >= p.interval;
      });
    }
    default:
      return allWords;
  }
}
