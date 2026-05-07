import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';

const SWIPE_THRESHOLD = 80;  // px to trigger a swipe

const FlashCard = forwardRef(({ word, onSwipe }, ref) => {
  const [flipped, setFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-18, 0, 18]);
  const knowOpacity = useTransform(x, [40, 110], [0, 1]);
  const skipOpacity = useTransform(x, [-110, -40], [1, 0]);
  const controls = useAnimation();

  const isAnimating = useRef(false);
  const cardRef = useRef(null);

  // Expose imperative triggerSwipe for external buttons
  useImperativeHandle(ref, () => ({
    triggerSwipe: async (dir) => {
      if (isAnimating.current) return;
      isAnimating.current = true;
      await controls.start({
        x: dir === 'right' ? 700 : -700,
        opacity: 0,
        rotate: dir === 'right' ? 22 : -22,
        transition: { duration: 0.26, ease: [0.32, 0, 0.67, 0] },
      });
      isAnimating.current = false;
      onSwipe(dir);
    }
  }));

  // Removed custom touch handlers to let Framer Motion handle drag exclusively.

  const handleDragStart = useCallback(() => {
    // optional logic
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
    }
  }, [controls, onSwipe]);

  // Strict touch lock for mobile safari/chrome
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const preventScroll = (e) => e.preventDefault();
    // Use non-passive listener to actively prevent vertical scroll when touching the card
    el.addEventListener('touchmove', preventScroll, { passive: false });
    return () => el.removeEventListener('touchmove', preventScroll);
  }, []);

  const handleTap = useCallback(() => {
    if (!isAnimating.current) {
      setFlipped((f) => !f);
    }
  }, []);

  if (!word) return null;

  return (
    <div
      ref={cardRef}
      className="relative w-full flip-container"
      style={{ userSelect: 'none', touchAction: 'none' }}
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
          touchAction: 'none',
          willChange: 'transform',
          aspectRatio: '1/1',
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
            aspectRatio: '1/1',
            minHeight: 320,
          }}
        >
          {/* ── FRONT ── */}
          <div
            className="flip-front card-lg w-full flex flex-col items-center justify-center text-center p-8"
            style={{ aspectRatio: '1/1', minHeight: 320, background: '#FFFFFF' }}
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
            style={{ aspectRatio: '1/1', minHeight: 320, background: '#FFFFFF' }}
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
});

export default FlashCard;
