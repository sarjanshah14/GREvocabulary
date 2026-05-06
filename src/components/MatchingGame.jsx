import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveGameScore } from '../utils/storage';
import { CheckCircle2, XCircle, CircleDashed } from 'lucide-react';

export default function MatchingGame({ group, allWords, onNext }) {
  const [selected, setSelected] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // The correct answer set for this theme
  const correctSet = new Set(group.words);
  const correctCount = group.words.length;

  // Build chip pool: all correct words + 5 random decoys from other groups
  const [chips] = useState(() => {
    const correct = group.words.filter((w) => allWords.some((a) => a.word === w));
    const others = allWords
      .filter((w) => !correctSet.has(w.word))
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map((w) => w.word);
    return [...correct, ...others].sort(() => Math.random() - 0.5);
  });

  const toggle = (w) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(w) ? next.delete(w) : next.add(w);
      return next;
    });
  };

  const submit = () => {
    const tp = [...selected].filter((w) => correctSet.has(w)).length;  // correct picks
    const fp = [...selected].filter((w) => !correctSet.has(w)).length; // wrong picks
    const fn = [...correctSet].filter((w) => !selected.has(w)).length; // missed
    const accuracy = correctCount > 0 ? Math.round((tp / (tp + fp + fn)) * 100) : 0;
    setResult({ tp, fp, fn, accuracy });
    setSubmitted(true);
    saveGameScore(group.phrase, accuracy);
  };

  // Chip visual state
  const getChipClass = (w) => {
    if (!submitted) {
      return selected.has(w) ? 'game-chip-selected' : 'game-chip-idle';
    }
    if (correctSet.has(w) && selected.has(w)) return 'game-chip-correct';   // ✓ correct pick
    if (!correctSet.has(w) && selected.has(w)) return 'game-chip-wrong';    // ✗ wrong pick
    if (correctSet.has(w) && !selected.has(w)) return 'game-chip-missed';   // ◌ missed correct
    return 'game-chip-idle opacity-30';                                       // irrelevant decoy
  };

  const getChipIcon = (w) => {
    if (!submitted) return null;
    if (correctSet.has(w) && selected.has(w)) return <CheckCircle2 size={14} color="#333" />;
    if (!correctSet.has(w) && selected.has(w)) return <XCircle size={14} color="#999" />;
    if (correctSet.has(w) && !selected.has(w)) return <CircleDashed size={14} color="#888" />;
    return null;
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Theme card ── */}
      <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E4E4E2' }}>
        <p className="section-label mb-2">Theme / Meaning</p>
        <h2 className="text-2xl font-black text-[#111111] leading-tight">{group.phrase}</h2>
      </div>

      {/* ── Instruction with count ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: '#7A7A7A' }}>
          Select the <span className="font-bold text-[#111111]">{correctCount} words</span> that share this meaning
        </p>
        {!submitted && (
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: selected.size === correctCount ? '#222222' : '#EAEAE8',
              color: selected.size === correctCount ? '#FFFFFF' : '#7A7A7A',
              transition: 'all 0.2s',
            }}
          >
            {selected.size} / {correctCount}
          </span>
        )}
      </div>

      {/* ── Chip pool ── */}
      <div className="flex flex-wrap gap-2.5">
        {chips.map((w, i) => (
          <motion.button
            key={w + i}
            whileTap={!submitted ? { scale: 0.92 } : {}}
            onClick={() => toggle(w)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold pressable transition-all duration-150 ${getChipClass(w)}`}
            style={{ cursor: submitted ? 'default' : 'pointer' }}
            id={`chip-${w}`}
          >
            {getChipIcon(w)}
            {w}
          </motion.button>
        ))}
      </div>

      {/* ── Result breakdown ── */}
      <AnimatePresence>
        {submitted && result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4"
            style={{ background: '#FFFFFF', border: '1px solid #E4E4E2' }}
          >
            {/* Score */}
            <div className="flex items-center gap-3 mb-3">
              <div>
                <p className="text-4xl font-black text-[#111111]">{result.accuracy}%</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#7A7A7A' }}>accuracy</p>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 ml-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={15} color="#333" />
                  <span style={{ color: '#333' }}><b>{result.tp}</b> correct picked</span>
                </div>
                {result.fp > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle size={15} color="#888" />
                    <span style={{ color: '#888' }}><b>{result.fp}</b> wrong picked</span>
                  </div>
                )}
                {result.fn > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CircleDashed size={15} color="#888" />
                    <span style={{ color: '#888' }}><b>{result.fn}</b> missed (dashed border)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Correct answer reveal */}
            <div>
              <p className="section-label mb-2">All {correctCount} correct words</p>
              <div className="flex flex-wrap gap-1.5">
                {group.words.map((w, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: '#EAEAE8', color: '#222222' }}>
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action button ── */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={submitted ? onNext : submit}
        disabled={!submitted && selected.size === 0}
        className="w-full py-4 rounded-2xl font-bold text-base pressable btn-primary"
        id="game-action-btn"
      >
        {submitted ? 'Next Group →' : `Submit${selected.size > 0 ? ` (${selected.size} selected)` : ''}`}
      </motion.button>
    </div>
  );
}
