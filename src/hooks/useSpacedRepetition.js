import { useState, useCallback } from 'react';
import { getSessionPool, filterWords, updateWordState, getDailyGoal } from '../utils/engine';

export function useSpacedRepetition(allWords, mode = 'all', customWords = null) {
  const filtered = customWords || filterWords(allWords, mode);

  const [pool] = useState(() => {
    if (customWords && customWords.length > 0) {
      return customWords;
    }
    const dailyGoal = getDailyGoal().goal || 30;
    return getSessionPool(filtered, dailyGoal);
  });

  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const current = pool[index] || null;
  const total = pool.length;

  const swipe = useCallback(
    (dir) => {
      if (isAnimating || !current) return;
      setIsAnimating(true);
      updateWordState(current.word, dir === 'right');
      setTimeout(() => {
        setIndex((i) => i + 1);
        setIsAnimating(false);
      }, 350);
    },
    [current, isAnimating]
  );

  return {
    pool,
    current,
    index,
    total,
    swipe,
    resetIndex: () => setIndex(0),
    isAnimating,
    isDone: index >= pool.length,
  };
}
