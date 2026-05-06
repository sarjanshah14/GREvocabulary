import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';

const SWIPE_THRESHOLD = 100;

export default function FlashCard({ word, onSwipe }) {
  const [flipped, setFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-16, 0, 16]);
  const knowOpacity = useTransform(x, [50, 130], [0, 1]);
  const skipOpacity = useTransform(x, [-130, -50], [1, 0]);
  const controls = useAnimation();
  const isDragging = useRef(false);

  // Reset flip when card changes
  const prevWord = useRef(word?.word);
  if (word?.word !== prevWord.current) {
    prevWord.current = word?.word;
    setFlipped(false);
  }

  const handleDragStart = () => { isDragging.current = true; };

  const handleDragEnd = async (_, info) => {
    const delta = info.offset.x;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      const dir = delta > 0 ? 'right' : 'left';
      await controls.start({
        x: dir === 'right' ? 600 : -600,
        opacity: 0,
        rotate: dir === 'right' ? 18 : -18,
        transition: { duration: 0.28, ease: 'easeIn' },
      });
      onSwipe(dir);
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 450, damping: 32 } });
    }
    isDragging.current = false;
  };

  const handleTap = () => {
    if (!isDragging.current) setFlipped((f) => !f);
  };

  if (!word) return null;

  return (
    <div className="relative w-full flip-container" style={{ userSelect: 'none' }}>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.75}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        onClick={handleTap}
        className="relative w-full"
        style={{ x, rotate, cursor: 'grab' }}
      >
        {/* KNOW label */}
        <motion.div className="swipe-label-know" style={{ opacity: knowOpacity }}>
          KNOW ✓
        </motion.div>
        {/* SKIP label */}
        <motion.div className="swipe-label-skip" style={{ opacity: skipOpacity }}>
          SKIP ✗
        </motion.div>

        <div
          className="flip-inner w-full"
          style={{
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
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
            <span className="section-label mb-3">Wordlist {word.wordlistNumber}</span>
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
              Tap to reveal · Swipe to score
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
