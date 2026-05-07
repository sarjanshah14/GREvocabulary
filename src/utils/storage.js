/**
 * storage.js — Thin shim delegating to engine.js
 * All logic lives in engine.js. This file exists only for backward compatibility.
 */
export {
  getAllProgress as getProgress,
  updateWordProgress,
  updateWordState,
  getWordState,
  initProgress as initializeProgress,
  getAllStats,
  getSubsetStats,
  getOverallStats,
  getWordlistStats,
  getStreak,
  updateStreak,
  getBookmarks,
  toggleBookmark,
  isBookmarked,
  getFavourites,
  toggleFavourite,
  isFavourite,
  getSessions,
  incrementSessions,
  getGameScores,
  saveGameScore,
  getDailyGoal,
  incrementDaily,
  resetAll,
  getSessionPool,
  filterWords,
  addLastWordlist,
  getLastWordlists,
} from './engine.js';
