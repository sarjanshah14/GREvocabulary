import { useState, useCallback } from 'react';
import {
  getProgress,
  getFavourites,
  getBookmarks,
  toggleFavourite,
  toggleBookmark,
  getStreak,
  getSessions,
  getGameScores,
  getOverallStats,
  getWordlistStats,
} from '../utils/storage';

export function useProgress(allWords) {
  const [progress, setProgress] = useState(() => getProgress());
  const [favourites, setFavourites] = useState(() => getFavourites());
  const [bookmarks, setBookmarks] = useState(() => getBookmarks());
  const [streak, setStreak] = useState(() => getStreak());
  const [sessions, setSessions] = useState(() => getSessions());
  const [gameScores, setGameScores] = useState(() => getGameScores());

  const refreshAll = useCallback(() => {
    setProgress(getProgress());
    setFavourites(getFavourites());
    setBookmarks(getBookmarks());
    setStreak(getStreak());
    setSessions(getSessions());
    setGameScores(getGameScores());
  }, []);

  const toggleFav = useCallback((word) => {
    const updated = toggleFavourite(word);
    setFavourites([...updated]);
  }, []);

  const toggleBook = useCallback((word) => {
    const updated = toggleBookmark(word);
    setBookmarks([...updated]);
  }, []);

  const isFav = useCallback((word) => favourites.includes(word), [favourites]);
  const isBook = useCallback((word) => bookmarks.includes(word), [bookmarks]);

  const overallStats = allWords ? getOverallStats(allWords) : null;

  const wordlistStats = useCallback(
    (num) => (allWords ? getWordlistStats(num, allWords) : null),
    [allWords, progress]
  );

  return {
    progress,
    favourites,
    bookmarks,
    streak,
    sessions,
    gameScores,
    refreshAll,
    toggleFav,
    toggleBook,
    isFav,
    isBook,
    overallStats,
    wordlistStats,
  };
}
