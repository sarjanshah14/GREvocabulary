import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Volume2 } from 'lucide-react';

/**
 * Speaks a word using the Web Speech API.
 * Uses en-US voice if available, falls back to default.
 * Returns immediately if speech is not supported.
 */
function speak(word) {
  if (!word || !('speechSynthesis' in window)) return;
  // Cancel any in-progress speech
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = 'en-US';
  utter.rate = 0.88;   // slightly slower for clear pronunciation
  utter.pitch = 1.0;

  // Pick an en-US voice if available
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(
    (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('natural')
  ) || voices.find(
    (v) => v.lang === 'en-US'
  ) || voices.find(
    (v) => v.lang.startsWith('en')
  );
  if (enVoice) utter.voice = enVoice;

  window.speechSynthesis.speak(utter);
}

export default function SwipeButtons({ onLeft, onRight, disabled, word }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = 'speechSynthesis' in window;

  const handleAudio = useCallback(() => {
    if (!word || !supported) return;
    setSpeaking(true);

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    utter.rate = 0.88;
    utter.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const enVoice =
      voices.find((v) => v.lang === 'en-US' && v.name.toLowerCase().includes('natural')) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) utter.voice = enVoice;

    utter.onend  = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utter);
  }, [word, supported]);

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
      {/* Skip / Don't know */}
      <motion.button
        whileTap={{ scale: 0.82 }}
        onClick={onLeft}
        disabled={disabled}
        className="w-14 h-14 rounded-full flex items-center justify-center pressable"
        style={{
          background: '#F0F0EE',
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.3 : 1,
        }}
        id="swipe-left-btn"
        aria-label="Don't know"
      >
        <X size={22} color="#888888" strokeWidth={2.5} />
      </motion.button>

      {/* Audio pronunciation */}
      <motion.button
        whileTap={{ scale: 0.82 }}
        animate={speaking ? { scale: [1, 1.15, 1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        onClick={handleAudio}
        disabled={!word || !supported}
        className="w-12 h-12 rounded-full flex items-center justify-center pressable"
        style={{
          background: speaking ? '#222' : '#F4F4F2',
          border: 'none',
          cursor: (!word || !supported) ? 'default' : 'pointer',
          opacity: (!word || !supported) ? 0.3 : 1,
          transition: 'background 0.2s',
          boxShadow: speaking ? '0 0 0 4px rgba(0,0,0,0.12)' : 'none',
        }}
        id="audio-btn"
        aria-label="Pronounce word"
        title={supported ? `Pronounce "${word}"` : 'Speech not supported in this browser'}
      >
        <Volume2
          size={17}
          color={speaking ? '#FFFFFF' : '#9A9A9A'}
          strokeWidth={2}
        />
      </motion.button>

      {/* Know / Got it */}
      <motion.button
        whileTap={{ scale: 0.82 }}
        onClick={onRight}
        disabled={disabled}
        className="w-14 h-14 rounded-full flex items-center justify-center pressable"
        style={{
          background: '#222222',
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.3 : 1,
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
