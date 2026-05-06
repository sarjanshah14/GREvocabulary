import { useState, useCallback } from 'react';
import { getSessionPool, filterWords } from '../utils/algorithm';
import { updateWordProgress } from '../utils/storage';

export function useSpacedRepetition(allWords, mode = 'all', extra = null) {
  const filtered = filterWords(allWords, mode, extra);
  const [pool] = useState(() => {
    if (mode === 'all' || mode === 'due') return getSessionPool(filtered, 50);
    return filtered.length > 50 ? getSessionPool(filtered, 50) : filtered;
  });

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(null); // 'left' | 'right'
  const [isAnimating, setIsAnimating] = useState(false);

  const current = pool[index] || null;
  const total = pool.length;

  const swipe = useCallback(
    (dir) => {
      if (isAnimating || !current) return;
      setDirection(dir);
      setIsAnimating(true);

      // Update localStorage immediately
      updateWordProgress(current.word, dir);

      setTimeout(() => {
        setIndex((i) => i + 1);
        setDirection(null);
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
    direction,
    isAnimating,
    swipe,
    isDone: index >= pool.length,
  };
}
