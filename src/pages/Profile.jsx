import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';
import data from '../../data.json';
import { getAllStats, getGameScores, resetAll, initProgress, getDailyWordsHistory, getDailyGoal } from '../utils/engine';
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
            {loading ? 'Wiping...' : 'Confirm - erase all data'}
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
  const navigate = useNavigate();
  const [showReset, setShowReset] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [tick, setTick] = useState(0);
  const monthTrackRef = useRef(null);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    if (session) {
      supabase.from('profiles').select('name').eq('id', session.user.id).single().then(({ data }) => {
        if (data) setProfileName(data.name);
      });
      fetchCloudData(session.user.id).then(() => refresh());
    }
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(timer);
  }, []);

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
  const dailyToday = getDailyGoal();
  const [selectedDay, setSelectedDay] = useState(null);

  const monthRows = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const iso = d.toISOString().split('T')[0];
      const base = dailyHistory[iso] || { count: 0, goal: 30, words: [] };
      const isToday = iso === dailyToday.date;
      rows.push({
        iso,
        day,
        isToday,
        count: isToday ? Math.max(base.count || 0, dailyToday.count || 0) : (base.count || 0),
        goal: isToday ? Math.max(base.goal || 30, dailyToday.goal || 30) : (base.goal || 30),
        words: Array.isArray(base.words) ? base.words : [],
      });
    }

    return rows;
  }, [dailyHistory, dailyToday.date, dailyToday.count, dailyToday.goal, tick]);

  useEffect(() => {
    if (!monthTrackRef.current) return;
    const todayIndex = monthRows.findIndex((r) => r.isToday);
    if (todayIndex === -1) return;
    const target = monthTrackRef.current.querySelector(`[data-day-index="${todayIndex}"]`);
    if (target) target.scrollIntoView({ inline: 'end', block: 'nearest', behavior: 'smooth' });
  }, [monthRows]);

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
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: 0 }}>
            {session ? `Hi ${profileName || session.user.user_metadata?.full_name || 'there'}` : 'Profile'}
          </h1>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleLogout}
            style={{ padding: '8px 16px', borderRadius: 999, background: '#EAEAE8', border: 'none', color: '#111', fontWeight: 600, fontSize: 12, cursor: 'pointer', lineHeight: 1 }}>
            Log Out
          </motion.button>
        </div>

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
              Mastered = score &gt;= 5 - recalled &gt;= 3 times
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Studied', val: stats.studied },
            { label: 'Streak', val: stats.streak.current > 0 ? `${stats.streak.current}d` : '-' },
            { label: 'Group Avg', val: `${groupAvg}%` },
          ].map(({ label, val }) => (
            <div key={label} className="stat-card">
              <p style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1, margin: 0 }}>{val}</p>
              <p style={{ fontSize: 11, color: '#ADADAD', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: '0 0 8px' }}>Monthly Goal Calendar</p>
          <p style={{ fontSize: 11, color: '#8A8A8A', margin: '0 0 12px' }}>Scroll horizontally · active day is at the end</p>
          <div ref={monthTrackRef} style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollBehavior: 'smooth' }}>
            {monthRows.map((d, idx) => {
              const pct = Math.max(0, Math.min(100, Math.round((d.count / d.goal) * 100)));
              const done = d.count >= d.goal;
              return (
                <button
                  key={d.iso}
                  data-day-index={idx}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setSelectedDay({
                      ...d,
                      x: rect.left + (rect.width / 2),
                      y: rect.top - 8,
                    });
                  }}
                  style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', minWidth: 38 }}
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
                  <p style={{ margin: 0, fontSize: 10, color: d.isToday ? '#111' : '#8A8A8A', textAlign: 'center', fontWeight: d.isToday ? 700 : 500 }}>
                    {d.day}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: '0 0 16px' }}>Mastery Breakdown</p>
          <Bar label="New" count={stats.unseen} total={stats.total} shade="#EAEAE8" />
          <Bar label="Learning" count={stats.learning} total={stats.total} shade="#AAAAAA" />
          <Bar label="Familiar" count={stats.familiar} total={stats.total} shade="#666666" />
          <Bar label="Mastered" count={stats.mastered} total={stats.total} shade="#222222" />
        </div>

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
          <div onClick={() => setSelectedDay(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: Math.max(12, Math.min(window.innerWidth - 148, selectedDay.x - 68)),
                top: Math.max(12, selectedDay.y - (selectedDay.count >= selectedDay.goal && selectedDay.words?.length > 0 ? 110 : 74)),
                width: 136,
                background: '#111',
                color: '#fff',
                borderRadius: 12,
                padding: '10px 12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
              }}
            >
              <p style={{ fontSize: 11, opacity: 0.8, margin: 0 }}>{selectedDay.iso}</p>
              <p style={{ fontSize: 14, fontWeight: 800, margin: '2px 0 0' }}>
                {Math.min(selectedDay.count, selectedDay.goal)}/{selectedDay.goal} words
              </p>
              {selectedDay.count >= selectedDay.goal && selectedDay.words?.length > 0 && (
                <button
                  onClick={() => navigate(`/flashcards?mode=all&historyDate=${selectedDay.iso}`)}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    border: 'none',
                    borderRadius: 8,
                    background: '#fff',
                    color: '#111',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '6px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Practice Again
                </button>
              )}
              <div style={{ position: 'absolute', left: 62, bottom: -6, width: 12, height: 12, background: '#111', transform: 'rotate(45deg)' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
