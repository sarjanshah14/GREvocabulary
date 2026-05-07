# GRE Lexicon — Vocabulary Mastery App

A mobile-first Progressive Web App for mastering GRE vocabulary using spaced repetition, word groups, confusing pairs, and daily goal tracking.

**Live:** https://gre-vocabulary.vercel.app

---

## Overview

GRE Lexicon is designed around daily productivity and long-term retention. Every feature feeds from a single learning engine — there is no duplicated or conflicting logic.

**Stack:** React + Vite + Tailwind CSS + Framer Motion  
**Storage:** localStorage (no backend required)  
**Platform:** PWA — installable on iPhone and Android as a standalone app

---

## Learning Modes

| Mode | Description |
|------|-------------|
| **All Words** | Full vocabulary pool (775 words). High-frequency words appear 3× more often |
| **High Frequency** | Only the ~220 priority GRE words identified as most exam-likely |
| **Bookmarks** | Words you've manually saved during study |
| **Due for Review** | Words your spaced repetition schedule has queued for today |
| **Word Groups** | Matching game — identify words that share a semantic theme |
| **Confusing Pairs** | Side-by-side comparison of easily confused words |

---

## Mastery System

Every word progresses through 4 stages:

| Stage | Criteria |
|-------|----------|
| **New** | Never reviewed (`score = 0`) |
| **Learning** | Reviewed, score 1–2 |
| **Familiar** | Score 3–4 |
| **Mastered** | Score ≥ 5 AND recalled correctly ≥ 3 times AND incorrect count ≤ 1 |

**How score changes:**
- Swipe right (Know it) → `score += 1`, review interval doubles
- Swipe left (Skip) → `score -= 1`, interval resets to 1 day
- Score is clamped: minimum 0, maximum 10

This means a word can only reach Mastered after multiple successful review passes, even if you've never been wrong — ensuring genuine retention.

---

## Spaced Repetition

Each word tracks a `nextReview` date. Words are eligible for review when:
1. They've never been seen before
2. Their `nextReview` date is today or in the past
3. Their `sessionsSinceLastSeen` exceeds their current interval

Session pool construction:
1. Collect all "due" words
2. If pool < 50, supplement with lowest-score unseen words
3. Apply weights: `weight = (10 - score) × hfBoost`
4. `hfBoost = 3` for High Frequency words, `1` for others
5. Fisher-Yates shuffle, deduplicate, return top 50

---

## Daily Goal System

- Default goal: **30 words per day**
- Automatically resets at midnight (date comparison, no timer)
- Incremented by: flashcard swipes, matching game completions
- Displayed on Home (ring + bar) and Dashboard

---

## Streak System

- A streak day is recorded once per calendar day (idempotent)
- Streak continues if the user studied yesterday
- Streak resets to 1 if a day was missed
- Streak is updated when a session completes

---

## Matching Game — Scoring

The game shows a pool of chips: **correct words** (from the word group) + **5 random decoys**.

**Scoring formula:**
```
accuracy = correct_picks / correct_words_in_round × 100
```

- `correct_picks` = words selected that belong to the theme
- `correct_words_in_round` = only the correct chips shown in THIS round

**Critical design decision:** Accuracy is NEVER calculated against the full dataset synonyms. If 3 correct words are shown and the user picks all 3, the score is 100% — regardless of how many synonyms exist in the database.

---

## Data Structure

Words in `data.json`:
```json
{
  "word": "Abate",
  "meaning": "To reduce in amount, degree, or intensity",
  "synonyms": ["diminish", "lessen", "subside"],
  "antonyms": ["intensify", "aggravate"],
  "usage": "The storm abated after midnight.",
  "wordlistNumber": 1,
  "isHighFrequency": true
}
```

Per-word progress stored in localStorage (`gre_progress`):
```json
{
  "Abate": {
    "score": 4,
    "reviewCount": 6,
    "correctCount": 5,
    "incorrectCount": 1,
    "lastReviewed": "2025-05-07",
    "nextReview": "2025-05-15",
    "interval": 8,
    "learningStage": "familiar"
  }
}
```

---

## PWA Installation (iPhone)

1. Open the app URL in **Safari**
2. Tap the **Share** button (bottom toolbar)
3. Tap **"Add to Home Screen"**
4. Tap **"Add"**

The app will launch in standalone mode with no Safari URL bar — exactly like a native app.

**Apple meta tags configured:**
- `apple-mobile-web-app-capable: yes`
- `apple-mobile-web-app-status-bar-style: black`
- `apple-mobile-web-app-title: GRE Lexicon`

---

## Architecture

```
src/
  utils/
    engine.js       ← Central learning engine (single source of truth)
    storage.js      ← Re-exports from engine.js (backward compat shim)
    algorithm.js    ← Re-exports from engine.js (backward compat shim)
  hooks/
    useSpacedRepetition.js  ← Session pool + swipe handler
  pages/
    Home.jsx        ← 3-card dashboard: Daily Goal, Streak, Mastered
    Flashcards.jsx  ← Swipe study mode
    WordLibrary.jsx ← Searchable word list
    WordGroups.jsx  ← Browse semantic groups
    WordGroupPractice.jsx ← Matching game session
    ConfusingWords.jsx    ← Side-by-side pair comparison
    Dashboard.jsx   ← Full progress breakdown
  components/
    MatchingGame.jsx ← Game logic with corrected scoring
    FlashCard.jsx    ← Flip card with word/meaning
    SwipeButtons.jsx ← Know / Skip buttons
    WordCard.jsx     ← Expandable library card
    Navbar.jsx       ← Fixed bottom navigation
    ProgressBar.jsx  ← Reusable progress bar
public/
  manifest.json    ← PWA manifest
  sw.js            ← Service worker (offline support)
  icons/           ← App icons
vercel.json        ← SPA routing rewrite (fixes 404 on refresh)
```

---

## State Management

All state is persisted to `localStorage` via `engine.js`. No external state management library.

Keys:
| Key | Value |
|-----|-------|
| `gre_progress` | `{ [word]: WordState }` — all word progress |
| `gre_streak` | `{ current, lastDate }` |
| `gre_daily` | `{ date, count, goal }` — auto-resets daily |
| `gre_bookmarks` | `string[]` — bookmarked words |
| `gre_sessions` | `number` — total sessions completed |
| `gre_game_scores` | `{ [phrase]: { accuracy, date } }` |

---

## Offline Support

The service worker (`sw.js`) implements stale-while-revalidate:
1. On first load, assets are cached
2. On repeat visits, cached assets are served immediately
3. Network fetch updates the cache in the background
4. If network is unavailable, the app works fully from cache
5. All progress is stored in localStorage — no server required

---

## Running Locally

```bash
git clone https://github.com/sarjanshah14/GREvocabulary.git
cd GREvocabulary
npm install
npm run dev
```

**Test on phone (same WiFi):**
```bash
npm run dev -- --host
# Open the Network: URL in Safari on your phone
```

**Production build:**
```bash
npm run build
```
