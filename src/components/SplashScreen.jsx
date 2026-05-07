import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Generate N random fragments that cover the screen
const COLS = 5;
const ROWS = 9;
const TOTAL = COLS * ROWS;

function buildFragments() {
  return Array.from({ length: TOTAL }, (_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const angle = (Math.random() - 0.5) * 60;
    const dx = (col - COLS / 2) * 120 + (Math.random() - 0.5) * 80;
    const dy = (row - ROWS / 2) * 120 + (Math.random() - 0.5) * 80;
    const delay = 0.18 + Math.random() * 0.28;
    return { i, col, row, angle, dx, dy, delay };
  });
}

const fragments = buildFragments();

const SESSION_KEY = '__gre_splash_shown__';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('hold'); // 'hold' → 'shatter' → 'done'

  useEffect(() => {
    // Hold the splash for 1.1 seconds, then shatter
    const t1 = setTimeout(() => setPhase('shatter'), 1100);
    // After shatter completes (all pieces gone ~0.7s), call onDone
    const t2 = setTimeout(() => {
      setPhase('done');
      onDone();
    }, 1100 + 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  if (phase === 'done') return null;

  const shattering = phase === 'shatter';
  const cellW = 100 / COLS;
  const cellH = 100 / ROWS;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* The text — fades out just before shatter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={
          shattering
            ? { opacity: 0, scale: 0.95, transition: { duration: 0.18 } }
            : { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
        }
        style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}
      >
        <p style={{
          fontSize: 'clamp(38px, 9vw, 54px)',
          fontWeight: 900,
          color: '#F2F2F0',
          letterSpacing: '-0.04em',
          margin: 0,
          lineHeight: 1,
          fontFamily: 'Inter, sans-serif',
        }}>
          GRE Lexicon
        </p>
        <p style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          marginTop: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          Vocabulary Mastery
        </p>
      </motion.div>

      {/* Fragment layer — clips into tiles and flies away */}
      {shattering && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
          {fragments.map(({ i, col, row, angle, dx, dy, delay }) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: dx,
                y: dy,
                rotate: angle,
                scale: 0.3,
              }}
              transition={{
                duration: 0.55,
                delay,
                ease: [0.22, 0, 0.8, 0.2],
              }}
              style={{
                position: 'absolute',
                left: `${col * cellW}%`,
                top: `${row * cellH}%`,
                width: `${cellW + 0.3}%`,   // tiny overlap to avoid gaps
                height: `${cellH + 0.3}%`,
                background: '#111111',
                // Each tile clips to a slightly irregular shape
                clipPath: i % 7 === 0
                  ? 'polygon(0 0,100% 5%,95% 100%,5% 95%)'
                  : i % 5 === 0
                    ? 'polygon(5% 0,100% 0,100% 95%,0 100%)'
                    : 'polygon(0 0,100% 0,100% 100%,0 100%)',
                boxShadow: '0 0 0 0.5px rgba(255,255,255,0.04)',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
