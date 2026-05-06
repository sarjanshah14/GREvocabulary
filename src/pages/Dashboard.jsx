import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import data from '../../data.json';
import ProgressBar from '../components/ProgressBar';
import {
  getProgress, getStreak, getSessions, getWordlistStats,
  getOverallStats, getGameScores, resetAll, resetWordlist, initializeProgress,
} from '../utils/storage';

const { wordlists } = data;
const LIST_NUMS = [...new Set(wordlists.map((w) => w.wordlistNumber))].sort((a, b) => a - b);

// Tile shade based on mastery %
function tileBg(pct) {
  if (pct === 0)   return { bg: '#ECECEA', color: '#C0C0C0' };
  if (pct < 50)   return { bg: '#D4D4D2', color: '#444444' };
  if (pct < 100)  return { bg: '#888888', color: '#FFFFFF' };
  return              { bg: '#222222', color: '#FFFFFF' };
}

function WLBreakdownSheet({ num, onClose }) {
  const stats = getWordlistStats(num, wordlists);
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#E4E4E2' }} />
        <h2 className="text-xl font-black mb-1" style={{ color: '#111111' }}>Wordlist {num}</h2>
        <p className="text-sm mb-4" style={{ color: '#ADADAD' }}>{stats.total} words · {stats.mastered} mastered</p>
        <ProgressBar value={stats.mastered} max={stats.total} height={8} />
        <div className="flex gap-6 mt-4 justify-center">
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: '#111111' }}>{stats.mastered}</p>
            <p className="text-xs" style={{ color: '#ADADAD' }}>Mastered</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: '#111111' }}>{stats.pct}%</p>
            <p className="text-xs" style={{ color: '#ADADAD' }}>Complete</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: '#111111' }}>{stats.total - stats.mastered}</p>
            <p className="text-xs" style={{ color: '#ADADAD' }}>Remaining</p>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
          className="mt-6 w-full py-3.5 rounded-2xl font-semibold pressable btn-secondary"
          style={{ borderRadius: '1.25rem' }} id="wl-detail-close">
          Close
        </motion.button>
      </div>
    </div>
  );
}

function ResetSheet({ onClose, onResetAll, onResetWordlist }) {
  const [wl, setWL] = useState(null);
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#E4E4E2' }} />
        <h2 className="text-xl font-black mb-1" style={{ color: '#111111' }}>Reset Progress</h2>
        <p className="text-sm mb-5" style={{ color: '#ADADAD' }}>This cannot be undone.</p>

        <p className="text-sm font-semibold mb-2" style={{ color: '#111111' }}>Reset a specific wordlist:</p>
        <div className="scroll-row flex gap-2 pb-1 mb-3">
          {LIST_NUMS.map((n) => (
            <button key={n} onClick={() => setWL(n)}
              className="flex-shrink-0 w-10 h-10 rounded-xl font-bold text-sm pressable"
              style={{ background: wl === n ? '#222222' : '#FFFFFF', color: wl === n ? '#FFFFFF' : '#9A9A9A',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer' }}
              id={`reset-wl-${n}`}>{n}</button>
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => wl && onResetWordlist(wl)} disabled={!wl}
          className="w-full py-3 rounded-xl font-semibold mb-4 pressable disabled:opacity-40"
          style={{ background: '#EAEAE8', color: '#333333', border: 'none', cursor: 'pointer', borderRadius: '0.75rem' }}
          id="reset-wl-btn">
          Reset Wordlist {wl || '—'}
        </motion.button>

        <motion.button whileTap={{ scale: 0.97 }} onClick={onResetAll}
          className="w-full py-3.5 rounded-2xl font-bold mb-3 pressable"
          style={{ background: '#333333', color: '#FFFFFF', border: 'none', cursor: 'pointer', borderRadius: '1.25rem' }}
          id="reset-all-btn">
          Reset All Progress
        </motion.button>
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
  const navigate = useNavigate();
  const [showReset, setShowReset] = useState(false);
  const [selectedWL, setSelectedWL] = useState(null);
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const streak = getStreak();
  const sessions = getSessions();
  const overall = getOverallStats(wordlists);
  const gameScores = getGameScores();
  const progress = getProgress();

  const hfWords = wordlists.filter((w) => w.isHighFrequency);
  const hfMastered = hfWords.filter((w) => (progress[w.word]?.score || 0) >= 3).length;
  const hfPct = hfWords.length ? Math.round((hfMastered / hfWords.length) * 100) : 0;

  const groupAccs = Object.values(gameScores).map((s) => s.accuracy);
  const groupAvg = groupAccs.length ? Math.round(groupAccs.reduce((a, b) => a + b, 0) / groupAccs.length) : 0;

  return (
    <div className="page-in min-h-screen" style={{ background: '#F2F2F0' }}>
      {showReset && (
        <ResetSheet
          onClose={() => setShowReset(false)}
          onResetAll={() => { resetAll(); initializeProgress(wordlists); setShowReset(false); refresh(); }}
          onResetWordlist={(n) => { resetWordlist(n, wordlists); setShowReset(false); refresh(); }}
        />
      )}
      {selectedWL && <WLBreakdownSheet num={selectedWL} onClose={() => setSelectedWL(null)} />}

      <div className="px-5 pt-14 pb-6">
        <h1 className="text-3xl font-black mb-1" style={{ letterSpacing: '-0.03em', color: '#111111' }}>My Progress</h1>
        <p className="text-sm mb-6" style={{ color: '#ADADAD' }}>Track your GRE journey</p>

        {/* ── Stat grid ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: 'Words Studied', value: overall.studied },
            { label: streak.currentStreak > 0 ? 'Day Streak' : 'Sessions', value: streak.currentStreak > 0 ? `🔥 ${streak.currentStreak}` : sessions },
            { label: 'Mastered', value: overall.mastered },
            { label: 'Overall', value: `${overall.pct}%` },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <p className="text-3xl font-black" style={{ color: '#111111' }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#ADADAD' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Overall bar ── */}
        <div className="card p-5 mb-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-bold" style={{ color: '#111111' }}>Overall Mastery</p>
            <span className="font-black text-sm" style={{ color: '#555555' }}>{overall.mastered} / {overall.total}</span>
          </div>
          <ProgressBar value={overall.mastered} max={overall.total} height={10} />
        </div>

        {/* ── HF progress ── */}
        <div className="card p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-sm" style={{ color: '#111111' }}>★ High Frequency Words</p>
            <span className="text-sm font-black" style={{ color: '#555555' }}>{hfPct}%</span>
          </div>
          <ProgressBar value={hfMastered} max={hfWords.length} height={8} />
          <p className="text-xs mt-1.5" style={{ color: '#ADADAD' }}>{hfMastered} / {hfWords.length} mastered</p>
        </div>

        {/* ── Group scores ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card p-4">
            <p className="section-label mb-1">Word Groups</p>
            <p className="text-2xl font-black" style={{ color: '#111111' }}>{groupAvg}%</p>
            <p className="text-xs mt-0.5" style={{ color: '#ADADAD' }}>avg · {groupAccs.length} played</p>
          </div>
          <div className="card p-4">
            <p className="section-label mb-1">Sessions Done</p>
            <p className="text-2xl font-black" style={{ color: '#111111' }}>{sessions}</p>
            <p className="text-xs mt-0.5" style={{ color: '#ADADAD' }}>total study sessions</p>
          </div>
        </div>

        {/* ── Wordlist grid ── */}
        <div className="mb-6">
          <p className="font-bold text-base mb-3" style={{ color: '#111111' }}>Wordlist Mastery</p>
          <div className="grid grid-cols-6 gap-1.5">
            {LIST_NUMS.map((num) => {
              const stats = getWordlistStats(num, wordlists);
              const { bg, color } = tileBg(stats.pct);
              return (
                <motion.button key={num} whileTap={{ scale: 0.88 }}
                  onClick={() => setSelectedWL(num)}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center pressable"
                  style={{ background: bg, border: 'none', cursor: 'pointer' }}
                  id={`tile-${num}`}>
                  <span className="text-xs font-black leading-none" style={{ color }}>{num}</span>
                  {stats.pct > 0 && (
                    <span className="text-[8px] font-semibold mt-0.5" style={{ color, opacity: 0.8 }}>{stats.pct}%</span>
                  )}
                </motion.button>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-3 flex-wrap">
            {[
              { bg: '#ECECEA', label: 'Not started' },
              { bg: '#D4D4D2', label: '1–49%' },
              { bg: '#888888', label: '50–99%' },
              { bg: '#222222', label: '100%' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: l.bg }} />
                <span className="text-xs" style={{ color: '#ADADAD' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Reset button ── */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowReset(true)}
          className="w-full py-4 rounded-2xl font-semibold pressable"
          style={{ background: '#EAEAE8', color: '#777777', border: 'none', cursor: 'pointer', borderRadius: '1.25rem' }}
          id="dash-reset-btn">
          Reset Progress
        </motion.button>
      </div>
    </div>
  );
}
