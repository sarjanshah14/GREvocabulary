import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';

const SWIPE_THRESHOLD = 80;  // px to trigger a swipe

export default function FlashCard({ word, onSwipe }) {
  const [flipped, setFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-18, 0, 18]);
  const knowOpacity = useTransform(x, [40, 110], [0, 1]);
  const skipOpacity = useTransform(x, [-110, -40], [1, 0]);
  const controls = useAnimation();

  // Gesture tracking refs
  const dragStarted = useRef(false);      // true once we've committed to a drag
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const axisLocked = useRef(null);        // 'x' | 'y' | null
  const isAnimating = useRef(false);

  // Reset flip when word changes
  const prevWord = useRef(word?.word);
  if (word?.word !== prevWord.current) {
    prevWord.current = word?.word;
    setFlipped(false);
  }

  // ─── Touch handlers (raw — lock axis before Framer takes over) ──────────────

  const onTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    axisLocked.current = null;
    dragStarted.current = false;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (isAnimating.current) { e.preventDefault(); return; }

    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

    if (!axisLocked.current && (dx > 6 || dy > 6)) {
      // Lock axis based on first significant movement
      axisLocked.current = dx > dy ? 'x' : 'y';
    }

    if (axisLocked.current === 'x') {
      // Horizontal drag — prevent page scroll
      e.preventDefault();
      dragStarted.current = true;
    }
    // If axis is 'y' let the browser scroll normally
  }, []);

  // ─── Framer drag callbacks ───────────────────────────────────────────────────

  const handleDragStart = useCallback(() => {
    dragStarted.current = true;
  }, []);

  const handleDragEnd = useCallback(async (_, info) => {
    if (isAnimating.current) return;
    const delta = info.offset.x;

    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      isAnimating.current = true;
      const dir = delta > 0 ? 'right' : 'left';
      await controls.start({
        x: dir === 'right' ? 700 : -700,
        opacity: 0,
        rotate: dir === 'right' ? 22 : -22,
        transition: { duration: 0.26, ease: [0.32, 0, 0.67, 0] },
      });
      isAnimating.current = false;
      onSwipe(dir);
    } else {
      // Snap back with spring
      controls.start({
        x: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 500, damping: 38 },
      });
      dragStarted.current = false;
    }
  }, [controls, onSwipe]);

  const handleTap = useCallback(() => {
    if (!dragStarted.current && !isAnimating.current) {
      setFlipped((f) => !f);
    }
    dragStarted.current = false;
  }, []);

  if (!word) return null;

  return (
    <div
      className="relative w-full flip-container"
      style={{ userSelect: 'none', touchAction: 'pan-y' }}  // allow vertical scroll by default
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.55}
        dragMomentum={false}          // no flyaway after release
        dragTransition={{ bounceStiffness: 500, bounceDamping: 40 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        onClick={handleTap}
        className="relative w-full"
        style={{
          x, rotate,
          cursor: 'grab',
          // Prevent card from scrolling page while being held
          touchAction: 'none',
        }}
        whileDrag={{ cursor: 'grabbing', scale: 1.01 }}
      >
        {/* KNOW label */}
        <motion.div className="swipe-label-know" style={{ opacity: knowOpacity }}>
          KNOW ✓
        </motion.div>
        {/* SKIP label */}
        <motion.div className="swipe-label-skip" style={{ opacity: skipOpacity }}>
          SKIP ✗
        </motion.div>

        {/* Card flip */}
        <div
          className="flip-inner w-full"
          style={{
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
            minHeight: 340,
          }}
        >
          {/* ── FRONT ── */}
          <div
            className="flip-front card-lg w-full flex flex-col items-center justify-center text-center p-8"
            style={{ minHeight: 340, background: '#FFFFFF' }}
          >
            {word.isHighFrequency && (
              <span className="star-badge mb-4">★ High Frequency</span>
            )}
            <h1
              className="font-black leading-none mb-4"
              style={{
                fontSize: 'clamp(34px, 9vw, 46px)',
                letterSpacing: '-0.03em',
                color: '#111111',
              }}
            >
              {word.word}
            </h1>
            {word.usage && (
              <p
                className="text-sm italic leading-relaxed max-w-xs"
                style={{ color: '#ADADAD' }}
              >
                "{word.usage.length > 90 ? word.usage.slice(0, 90) + '…' : word.usage}"
              </p>
            )}
            <p className="text-xs mt-8 font-medium" style={{ color: '#CCCCCC' }}>
              Tap to reveal · Hold & drag to swipe
            </p>
          </div>

          {/* ── BACK ── */}
          <div
            className="flip-back card-lg w-full flex flex-col p-6 overflow-y-auto"
            style={{ minHeight: 340, background: '#FFFFFF' }}
          >
            <span className="section-label mb-2">Meaning</span>
            <p className="font-semibold text-base leading-relaxed mb-3" style={{ color: '#111111' }}>
              {word.meaning}
            </p>

            {word.usage && (
              <p className="text-sm italic mb-4 leading-relaxed" style={{ color: '#7A7A7A' }}>
                "{word.usage}"
              </p>
            )}

            {word.synonyms?.length > 0 && (
              <div className="mb-3">
                <p className="section-label mb-2">Synonyms</p>
                <div className="flex flex-wrap gap-1.5">
                  {word.synonyms.map((s, i) => (
                    <span key={i} className="chip chip-syn">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {word.antonyms?.length > 0 && (
              <div>
                <p className="section-label mb-2">Antonyms</p>
                <div className="flex flex-wrap gap-1.5">
                  {word.antonyms.map((a, i) => (
                    <span key={i} className="chip chip-ant">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
