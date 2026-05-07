import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    // Show splash for 1.5s, then signal done so AnimatePresence can fade it out
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: 'center' }}
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
    </motion.div>
  );
}
