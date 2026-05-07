import { useState, useCallback } from 'react';
import { getSessionPool, filterWords, updateWordState } from '../utils/engine';

export function useSpacedRepetition(allWords, mode = 'all') {
  const filtered = filterWords(allWords, mode);

  const [pool] = useState(() => {
    if (mode === 'due') return getSessionPool(filtered, 50);
    return [...filtered].sort(() => Math.random() - 0.5);
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
    isAnimating,
    isDone: index >= pool.length,
  };
}
