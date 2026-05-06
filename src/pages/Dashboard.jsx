import { useState } from 'react';
import { motion } from 'framer-motion';
import data from '../../data.json';
import ProgressBar from '../components/ProgressBar';
import {
  getProgress, getStreak, getSessions,
  getOverallStats, getGameScores, resetAll, initializeProgress,
} from '../utils/storage';

const { wordlists } = data;
const totalWords = wordlists.length;
const hfWords = wordlists.filter((w) => w.isHighFrequency);

function ResetSheet({ onClose, onResetAll }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#E4E4E2' }} />
        <h2 className="text-xl font-black mb-1" style={{ color: '#111111' }}>Reset All Progress</h2>
        <p className="text-sm mb-6" style={{ color: '#ADADAD' }}>
          This will erase your mastery scores for all {totalWords} words. This cannot be undone.
        </p>
        {!confirm ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setConfirm(true)}
            className="w-full py-4 rounded-2xl font-bold mb-3 pressable"
            style={{ background: '#333333', color: '#FFFFFF', border: 'none', cursor: 'pointer', borderRadius: '1.25rem' }}
            id="reset-confirm-btn">
            Yes, Reset Everything
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} onClick={onResetAll}
            className="w-full py-4 rounded-2xl font-bold mb-3 pressable"
            style={{ background: '#111111', color: '#FFFFFF', border: 'none', cursor: 'pointer', borderRadius: '1.25rem' }}
            id="reset-final-btn">
            Confirm Reset ✓
          </motion.button>
        )}
        <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
          className="w-full py-3 rounded-2xl font-semibold pressable btn-secondary"
          style={{ borderRadius: '1.25rem' }} id="reset-cancel">
          Cancel
        </motion.button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [showReset, setShowReset] = useState(false);
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const streak = getStreak();
  const sessions = getSessions();
  const overall = getOverallStats(wordlists);
  const gameScores = getGameScores();
  const progress = getProgress();

  const hfMastered = hfWords.filter((w) => (progress[w.word]?.score || 0) >= 3).length;
  const hfPct = hfWords.length ? Math.round((hfMastered / hfWords.length) * 100) : 0;

  const groupAccs = Object.values(gameScores).map((s) => s.accuracy);
  const groupAvg = groupAccs.length ? Math.round(groupAccs.reduce((a, b) => a + b, 0) / groupAccs.length) : 0;

  // Mastery breakdown buckets
  const buckets = { unseen: 0, learning: 0, familiar: 0, mastered: 0 };
  wordlists.forEach((w) => {
    const score = progress[w.word]?.score || 0;
    if (score === 0)      buckets.unseen++;
    else if (score <= 2)  buckets.learning++;
    else if (score <= 4)  buckets.familiar++;
    else                  buckets.mastered++;
  });

  return (
    <div className="page-in min-h-screen" style={{ background: '#F2F2F0' }}>
      {showReset && (
        <ResetSheet
          onClose={() => setShowReset(false)}
          onResetAll={() => { resetAll(); initializeProgress(wordlists); setShowReset(false); refresh(); }}
        />
      )}

      <div className="px-5 pt-14 pb-8">
        <h1 className="text-3xl font-black mb-1" style={{ letterSpacing: '-0.03em', color: '#111111' }}>My Progress</h1>
        <p className="text-sm mb-6" style={{ color: '#ADADAD' }}>
          {totalWords} total words · {hfWords.length} high frequency
        </p>

        {/* ── Overall mastery ring + stats ── */}
        <div className="card p-5 mb-4 flex items-center gap-5">
          <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#E4E4E2" strokeWidth="4"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#222222" strokeWidth="4"
                strokeDasharray={`${(overall.pct / 100) * 87.96} 87.96`} strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black leading-none" style={{ color: '#111111' }}>{overall.pct}%</span>
              <span className="text-[9px]" style={{ color: '#ADADAD' }}>done</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-black text-2xl" style={{ color: '#111111' }}>{overall.mastered}</p>
            <p className="text-sm" style={{ color: '#ADADAD' }}>of {totalWords} words mastered</p>
            <div className="mt-2">
              <ProgressBar value={overall.mastered} max={totalWords} height={6} />
            </div>
          </div>
        </div>

        {/* ── Stat grid ── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="stat-card">
            <p className="text-2xl font-black" style={{ color: '#111111' }}>{overall.studied}</p>
            <p className="text-xs" style={{ color: '#ADADAD' }}>Studied</p>
          </div>
          <div className="stat-card">
            <p className="text-2xl font-black" style={{ color: '#111111' }}>
              {streak.currentStreak > 0 ? `🔥${streak.currentStreak}` : sessions}
            </p>
            <p className="text-xs" style={{ color: '#ADADAD' }}>
              {streak.currentStreak > 0 ? 'Streak' : 'Sessions'}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-2xl font-black" style={{ color: '#111111' }}>{groupAvg}%</p>
            <p className="text-xs" style={{ color: '#ADADAD' }}>Group avg</p>
          </div>
        </div>

        {/* ── HF progress ── */}
        <div className="card p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-sm" style={{ color: '#111111' }}>★ High Frequency Words</p>
            <span className="text-sm font-black" style={{ color: '#555' }}>{hfPct}%</span>
          </div>
          <ProgressBar value={hfMastered} max={hfWords.length} height={8} />
          <p className="text-xs mt-1.5" style={{ color: '#ADADAD' }}>{hfMastered} / {hfWords.length} mastered</p>
        </div>

        {/* ── Mastery breakdown ── */}
        <div className="card p-4 mb-6">
          <p className="font-bold text-sm mb-4" style={{ color: '#111111' }}>Mastery Breakdown</p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Unseen',   count: buckets.unseen,   bg: '#ECECEA', color: '#ADADAD' },
              { label: 'Learning', count: buckets.learning,  bg: '#D4D4D2', color: '#555555' },
              { label: 'Familiar', count: buckets.familiar,  bg: '#888888', color: '#FFFFFF' },
              { label: 'Mastered', count: buckets.mastered,  bg: '#222222', color: '#FFFFFF' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <div className="w-20 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: b.bg }}>
                  <span className="text-xs font-bold" style={{ color: b.color }}>{b.label}</span>
                </div>
                <div className="flex-1">
                  <div className="progress-track" style={{ height: 6 }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${totalWords > 0 ? (b.count / totalWords) * 100 : 0}%`, background: b.bg === '#ECECEA' ? '#D0D0CE' : b.bg }} />
                  </div>
                </div>
                <span className="text-sm font-bold w-8 text-right" style={{ color: '#7A7A7A' }}>{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Reset ── */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowReset(true)}
          className="w-full py-4 rounded-2xl font-semibold pressable"
          style={{ background: '#EAEAE8', color: '#777777', border: 'none', cursor: 'pointer', borderRadius: '1.25rem' }}
          id="dash-reset-btn">
          Reset All Progress
        </motion.button>
      </div>
    </div>
  );
}
