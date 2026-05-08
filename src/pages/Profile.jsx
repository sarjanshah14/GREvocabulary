import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';
import data from '../../data.json';
import { getAllStats, getGameScores, resetAll, initProgress, getDailyWordsHistory } from '../utils/engine';
import { fetchCloudData, wipeCloudData } from '../utils/sync';

const { wordlists } = data;

function ConfirmReset({ onCancel, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="sheet-overlay" style={{ zIndex: 1000 }}>
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="sheet-panel" 
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 999, background: '#E4E4E2', margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: '0 0 8px' }}>Reset All Progress</h2>
        <p style={{ fontSize: 13, color: '#ADADAD', margin: '0 0 24px', lineHeight: 1.6 }}>
          This erases mastery scores for all {wordlists.length} words, your streak, and daily goal. This action is permanent.
        </p>
        
        {step === 0 ? (
          <motion.button 
            whileTap={{ scale: 0.96 }} 
            onClick={() => setStep(1)}
            style={{ width: '100%', padding: '16px', borderRadius: '1.25rem', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', background: '#F2F2F0', color: '#111', marginBottom: 12 }}
          >
            Yes, reset everything
          </motion.button>
        ) : (
          <motion.button 
            whileTap={{ scale: 0.96 }} 
            disabled={loading}
            onClick={handleConfirm}
            style={{ width: '100%', padding: '16px', borderRadius: '1.25rem', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', background: '#111', color: '#fff', marginBottom: 12, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Wiping...' : 'Confirm — erase all data ✓'}
          </motion.button>
        )}
        
        <motion.button 
          whileTap={{ scale: 0.96 }} 
          onClick={onCancel}
          disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: '1.25rem', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', background: 'transparent', color: '#ADADAD' }}
        >
          Cancel
        </motion.button>
      </motion.div>
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

export default function Profile({ session }) {
  const [showReset, setShowReset] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  useEffect(() => {
    if (session) {
      // Fetch profile
      supabase.from('profiles').select('name').eq('id', session.user.id).single().then(({data}) => {
        if (data) setProfileName(data.name);
      });
      // Pull cloud data on mount
      fetchCloudData(session.user.id).then(() => refresh());
    }
  }, [session]);

  // Auth State
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  const stats = getAllStats(wordlists);
  const gameScores = getGameScores();
  const groupAccs = Object.values(gameScores).map((s) => s.accuracy);
  const groupAvg = groupAccs.length
    ? Math.round(groupAccs.reduce((a, b) => a + b, 0) / groupAccs.length)
    : 0;

  const dailyHistory = getDailyWordsHistory();
  const [selectedDay, setSelectedDay] = useState(null);

  const weekRows = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - idx));
    const iso = d.toISOString().split('T')[0];
    const row = dailyHistory[iso] || { count: 0, goal: 30 };
    return { 
      iso, 
      count: row.count || 0, 
      goal: row.goal || 30, 
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate()
    };
  });

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page-in pb-safe-bottom" style={{ background: '#F2F2F0', minHeight: '100dvh' }}>
      {showReset && (
        <ConfirmReset
          onCancel={() => setShowReset(false)}
          onConfirm={async () => {
            if (session) {
              await wipeCloudData(session.user.id);
            }
            resetAll();
            initProgress(wordlists);
            setShowReset(false);
            refresh();
          }}
        />
      )}

      <div style={{ padding: '52px 20px 32px' }}>
        {/* ── Profile & Auth Header ── */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: 0 }}>
              {session ? `Hi ${profileName || session.user.user_metadata?.full_name || 'there'}` : 'Profile'}
            </h1>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#ADADAD', marginTop: 2 }}>{todayStr}</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleLogout}
            style={{ padding: '8px 16px', borderRadius: 999, background: '#EAEAE8', border: 'none', color: '#111', fontWeight: 600, fontSize: 12, cursor: 'pointer', lineHeight: 1 }}>
            Log Out
          </motion.button>
        </div>

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

        {/* ── Weekly Goal Calendar ── */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: '0 0 12px' }}>Weekly Goal Calendar</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {weekRows.map((d) => {
              const pct = Math.max(0, Math.min(100, Math.round((d.count / d.goal) * 100)));
              const done = d.count >= d.goal;
              return (
                <button
                  key={d.iso}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setSelectedDay({
                      ...d,
                      x: rect.left + (rect.width / 2),
                      y: rect.top - 8,
                    });
                  }}
                  style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '999px',
                      margin: '0 auto 6px',
                      border: '1px solid #222',
                      background: done ? '#111' : `conic-gradient(#111 ${pct}%, #fff ${pct}% 100%)`,
                    }}
                  />
                  <p style={{ margin: 0, fontSize: 10, color: '#8A8A8A', textAlign: 'center' }}>
                    {d.label} <span style={{ color: '#111', fontWeight: 700 }}>{d.dateNum}</span>
                  </p>
                </button>
              );
            })}
          </div>
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

        {selectedDay && (
          <div
            onClick={() => setSelectedDay(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: Math.max(12, Math.min(window.innerWidth - 148, selectedDay.x - 68)),
                top: Math.max(12, selectedDay.y - 74),
                width: 136,
                background: '#111',
                color: '#fff',
                borderRadius: 12,
                padding: '10px 12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
              }}
            >
              <p style={{ fontSize: 11, opacity: 0.8, margin: 0 }}>{selectedDay.label}</p>
              <p style={{ fontSize: 14, fontWeight: 800, margin: '2px 0 0' }}>
                {Math.min(selectedDay.count, selectedDay.goal)}/{selectedDay.goal} words
              </p>
              <div
                style={{
                  position: 'absolute',
                  left: 62,
                  bottom: -6,
                  width: 12,
                  height: 12,
                  background: '#111',
                  transform: 'rotate(45deg)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
