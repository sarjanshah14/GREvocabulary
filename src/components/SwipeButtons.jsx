import { motion } from 'framer-motion';
import { X, Check, Volume2 } from 'lucide-react';

export default function SwipeButtons({ onLeft, onRight, disabled }) {
  return (
    <div
      className="inline-flex items-center justify-center gap-5"
      style={{
        background: '#FFFFFF',
        borderRadius: 999,
        padding: '10px 28px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)',
      }}
    >
      {/* Skip */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onLeft}
        disabled={disabled}
        className="w-14 h-14 rounded-full flex items-center justify-center pressable disabled:opacity-30"
        style={{ background: '#F0F0EE', border: 'none', cursor: disabled ? 'default' : 'pointer' }}
        id="swipe-left-btn"
        aria-label="Don't know"
      >
        <X size={22} color="#888888" strokeWidth={2.5} />
      </motion.button>

      {/* Audio placeholder */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        className="w-10 h-10 rounded-full flex items-center justify-center pressable"
        style={{ background: '#F4F4F2', border: 'none', cursor: 'pointer' }}
        id="audio-btn"
        aria-label="Pronunciation"
      >
        <Volume2 size={16} color="#C0C0C0" strokeWidth={1.8} />
      </motion.button>

      {/* Know */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onRight}
        disabled={disabled}
        className="w-14 h-14 rounded-full flex items-center justify-center pressable disabled:opacity-30"
        style={{
          background: '#222222',
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        }}
        id="swipe-right-btn"
        aria-label="I know this"
      >
        <Check size={22} color="#FFFFFF" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
