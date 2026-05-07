import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';
import data from '../../data.json';
import { getAllStats, getDailyGoal, getGameScores, resetAll, initProgress } from '../utils/engine';
import { fetchCloudData } from '../utils/sync';

const { wordlists } = data;

function ConfirmReset({ onCancel, onConfirm }) {
  const [step, setStep] = useState(0);
  return (
    <div className="sheet-overlay" onClick={onCancel}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: '#E4E4E2', margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: '0 0 8px' }}>Reset All Progress</h2>
        <p style={{ fontSize: 13, color: '#ADADAD', margin: '0 0 24px', lineHeight: 1.6 }}>
          This erases mastery scores for all {wordlists.length} words, your streak, and daily goal. Cannot be undone.
        </p>
        {step === 0 ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(1)}
            style={{ width: '100%', padding: '16px', borderRadius: '1.25rem', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', background: '#333', color: '#fff', marginBottom: 10 }}>
            Yes, reset everything
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm}
            style={{ width: '100%', padding: '16px', borderRadius: '1.25rem', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', background: '#111', color: '#fff', marginBottom: 10 }}>
            Confirm — erase all data ✓
          </motion.button>
        )}
        <motion.button whileTap={{ scale: 0.97 }} onClick={onCancel}
          className="btn-secondary pressable w-full"
          style={{ padding: '12px', borderRadius: '1.25rem' }}>
          Cancel
        </motion.button>
      </div>
    </div>
  );
}

function Bar({ label, count, total, shade }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 72, flexShrink: 0, fontSize: 11, fontWeight: 700, color: shade === '#EAEAE8' ? '#ADADAD' : '#fff', background: shade, padding: '4px 0', borderRadius: 8, textAlign: 'center' }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 8, background: '#EAEAE8', borderRadius: 999, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', background: shade === '#EAEAE8' ? '#D0D0CE' : shade, borderRadius: 999 }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#9A9A9A', minWidth: 28, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

export default function Profile() {
  const [showReset, setShowReset] = useState(false);
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  // Auth State
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const stats = getAllStats(wordlists);
  const daily = getDailyGoal();
  const gameScores = getGameScores();
  const groupAccs = Object.values(gameScores).map((s) => s.accuracy);
  const groupAvg = groupAccs.length
    ? Math.round(groupAccs.reduce((a, b) => a + b, 0) / groupAccs.length)
    : 0;

  const goalPct = Math.min(100, Math.round((daily.count / daily.goal) * 100));

  return (
    <div className="page-in pb-safe-bottom" style={{ background: '#F2F2F0', minHeight: '100dvh' }}>
      {showReset && (
        <ConfirmReset
          onCancel={() => setShowReset(false)}
          onConfirm={() => {
            resetAll();
            initProgress(wordlists);
            setShowReset(false);
            refresh();
          }}
        />
      )}

      <div style={{ padding: '52px 20px 32px' }}>
        {/* ── Profile & Auth Header ── */}
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: '0 0 16px' }}>
          {session ? `Hi ${profileName || session.user.user_metadata?.full_name || 'there'}` : 'Profile'}
        </h1>

        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 14, color: '#7A7A7A', margin: 0 }}>{session?.user?.email}</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleLogout}
            style={{ padding: '8px 16px', borderRadius: 999, background: '#EAEAE8', border: 'none', color: '#111', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            Log Out
          </motion.button>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', letterSpacing: '-0.02em', margin: '0 0 16px' }}>
          My Progress
        </h2>

        {/* ── Overall ring + mastered ── */}
        <div className="card" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#EAEAE8" strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#222" strokeWidth="4"
                strokeDasharray={`${(stats.pct / 100) * 87.96} 87.96`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{stats.pct}%</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 36, fontWeight: 900, color: '#111', lineHeight: 1, margin: 0 }}>{stats.mastered}</p>
            <p style={{ fontSize: 13, color: '#ADADAD', margin: '4px 0 0' }}>of {stats.total} words mastered</p>
            <p style={{ fontSize: 11, color: '#ADADAD', margin: '2px 0 0' }}>
              Mastered = score ≥ 5 · recalled ≥ 3 times
            </p>
          </div>
        </div>

        {/* ── Stat row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Studied',    val: stats.studied },
            { label: 'Streak',     val: stats.streak.current > 0 ? `🔥 ${stats.streak.current}d` : '—' },
            { label: 'Group Avg',  val: `${groupAvg}%` },
          ].map(({ label, val }) => (
            <div key={label} className="stat-card">
              <p style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1, margin: 0 }}>{val}</p>
              <p style={{ fontSize: 11, color: '#ADADAD', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Daily goal ── */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>Daily Goal</p>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>{Math.min(daily.count, daily.goal)} / {daily.goal}</span>
          </div>
          <div style={{ height: 8, background: '#EAEAE8', borderRadius: 999, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 0.7 }}
              style={{ height: '100%', background: '#333', borderRadius: 999 }} />
          </div>
          <p style={{ fontSize: 11, color: '#ADADAD', marginTop: 6 }}>
            {daily.count >= daily.goal ? '✓ Goal complete today!' : `${daily.goal - daily.count} more words to reach today's goal`}
          </p>
        </div>

        {/* ── Mastery Breakdown ── */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: '0 0 16px' }}>Mastery Breakdown</p>
          <Bar label="New"      count={stats.unseen}   total={stats.total} shade="#EAEAE8" />
          <Bar label="Learning" count={stats.learning}  total={stats.total} shade="#AAAAAA" />
          <Bar label="Familiar" count={stats.familiar}  total={stats.total} shade="#666666" />
          <Bar label="Mastered" count={stats.mastered}  total={stats.total} shade="#222222" />
        </div>

        {/* ── Reset ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowReset(true)}
          style={{
            width: '100%', padding: '14px', borderRadius: '1.25rem',
            fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
            background: '#EAEAE8', color: '#7A7A7A', marginBottom: 80
          }}
        >
          Reset All Progress
        </motion.button>
      </div>
    </div>
  );
}
