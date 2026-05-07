import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveGameScore } from '../utils/engine';
import { CheckCircle2, XCircle, CircleDashed } from 'lucide-react';

export default function MatchingGame({ group, allWords, onNext }) {
  const [selected, setSelected] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Build the chip pool for THIS round:
  // correct = group words that exist in the allWords dataset
  // decoys  = 5 random words NOT in the group
  const [chips, correctInRound] = useState(() => {
    try {
      if (!group || !Array.isArray(group.words)) return [[], []];

      const safeGroupWords = group.words.filter(w => typeof w === 'string');
      const correct = [...safeGroupWords].sort(() => Math.random() - 0.5).slice(0, 6);
      
      const safeAllWords = Array.isArray(allWords) ? allWords : [];
      const decoys = safeAllWords
        .filter(w => w && typeof w.word === 'string' && !safeGroupWords.some(gw => gw.toLowerCase() === w.word.toLowerCase()))
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(w => w.word);
        
      const pool = [...correct, ...decoys].sort(() => Math.random() - 0.5);
      return [pool, correct];
    } catch (e) {
      console.error('MatchingGame init error:', e);
      return [[], []];
    }
  });

  // correctInRound is what the user CAN possibly select — this is what accuracy is measured against
  const correctSet = new Set(correctInRound.map((w) => w.toLowerCase()));
  const correctCount = correctInRound.length;

  const toggle = (w) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(w) ? next.delete(w) : next.add(w);
      return next;
    });
  };

  const submit = () => {
    // ── CORRECT SCORING ──────────────────────────────────────────────
    // Only score against words visible in THIS round (correctInRound).
    // NEVER penalize for synonyms in the full dataset that were not shown.
    const tp = [...selected].filter((w) => correctSet.has(w.toLowerCase())).length;
    const fp = [...selected].filter((w) => !correctSet.has(w.toLowerCase())).length;
    const fn = correctInRound.filter((w) => !selected.has(w)).length;

    // accuracy = correct picks / total correct available in this round
    const accuracy = correctCount > 0 ? Math.round((tp / correctCount) * 100) : 0;
    // ─────────────────────────────────────────────────────────────────

    setResult({ tp, fp, fn, accuracy });
    setSubmitted(true);
    saveGameScore(group.phrase, accuracy);
  };

  const getChipStyle = (w) => {
    const base = {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '10px 16px', borderRadius: 999,
      fontSize: 13, fontWeight: 600,
      cursor: submitted ? 'default' : 'pointer',
      transition: 'all 0.15s',
      border: '1.5px solid transparent',
    };
    if (!submitted) {
      return selected.has(w)
        ? { ...base, background: '#222', color: '#fff', border: '1.5px solid #222' }
        : { ...base, background: '#fff', color: '#333', border: '1.5px solid #E4E4E2', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
    }
    const isCorrect = correctSet.has(w.toLowerCase());
    const isSelected = selected.has(w);
    if (isCorrect && isSelected)  return { ...base, background: '#EAEAE8', color: '#111', border: '2px solid #333' };
    if (!isCorrect && isSelected) return { ...base, background: '#F5F5F3', color: '#999', border: '1.5px solid #DDD', textDecoration: 'line-through' };
    if (isCorrect && !isSelected) return { ...base, background: '#fff', color: '#333', border: '2px dashed #888' };
    return { ...base, background: '#FAFAFA', color: '#CCC', border: '1px solid #EEE', opacity: 0.4 };
  };

  const chipIcon = (w) => {
    if (!submitted) return null;
    const isCorrect = correctSet.has(w.toLowerCase());
    const isSelected = selected.has(w);
    if (isCorrect && isSelected)  return <CheckCircle2 size={13} color="#444" />;
    if (!isCorrect && isSelected) return <XCircle size={13} color="#BBB" />;
    if (isCorrect && !isSelected) return <CircleDashed size={13} color="#888" />;
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Theme */}
      <div className="card p-5">
        <p className="section-label" style={{ marginBottom: 6 }}>Theme / Shared Meaning</p>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1.2, margin: 0 }}>
          {group.phrase}
        </h2>
      </div>

      {/* Instruction */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 13, color: '#7A7A7A', margin: 0 }}>
          Select the <strong style={{ color: '#111' }}>{correctCount} words</strong> that share this meaning
        </p>
        {!submitted && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
            background: selected.size === correctCount ? '#222' : '#EAEAE8',
            color: selected.size === correctCount ? '#fff' : '#9A9A9A',
            transition: 'all 0.2s',
          }}>
            {selected.size} / {correctCount}
          </span>
        )}
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {chips.map((w, i) => (
          <motion.button
            key={w + i}
            whileTap={!submitted ? { scale: 0.9 } : {}}
            onClick={() => toggle(w)}
            style={getChipStyle(w)}
            id={`chip-${w}`}
          >
            {chipIcon(w)}
            {w}
          </motion.button>
        ))}
      </div>

      {/* Results */}
      <AnimatePresence>
        {submitted && result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 44, fontWeight: 900, color: '#111', lineHeight: 1, margin: 0 }}>
                  {result.accuracy}%
                </p>
                <p style={{ fontSize: 11, color: '#ADADAD', marginTop: 2 }}>
                  {result.tp} of {correctCount} correct words picked
                </p>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.tp > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#444' }}>
                    <CheckCircle2 size={13} /> {result.tp} correct
                  </div>
                )}
                {result.fp > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#999' }}>
                    <XCircle size={13} /> {result.fp} wrong pick{result.fp > 1 ? 's' : ''}
                  </div>
                )}
                {result.fn > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}>
                    <CircleDashed size={13} /> {result.fn} missed (shown dashed)
                  </div>
                )}
              </div>
            </div>

            {/* All correct words */}
            <div>
              <p className="section-label" style={{ marginBottom: 8 }}>
                All {correctCount} correct words in this round
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {correctInRound.map((w, i) => (
                  <span key={i} style={{
                    padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    background: '#EAEAE8', color: '#222',
                  }}>
                    {w}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 10, color: '#ADADAD', marginTop: 8 }}>
                Note: accuracy is scored only on the {correctCount} words shown in this round.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={submitted ? onNext : submit}
        disabled={!submitted && selected.size === 0}
        className="btn-primary pressable w-full"
        style={{ padding: '16px', borderRadius: '1.25rem', fontSize: 15, fontWeight: 700, opacity: (!submitted && selected.size === 0) ? 0.35 : 1 }}
        id="game-action-btn"
      >
        {submitted ? 'Next Group →' : `Submit${selected.size > 0 ? ` (${selected.size} selected)` : ''}`}
      </motion.button>
    </div>
  );
}
