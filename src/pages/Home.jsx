import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Layers, Grid3x3, HelpCircle, BarChart2, Moon, Sun } from 'lucide-react';
import data from '../../data.json';
import { getAllStats, getDailyGoal } from '../utils/engine';

const { wordlists } = data;

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('all');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('gre_dark_mode') === 'true');

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('gre_dark_mode', next);
    document.documentElement.classList.toggle('dark-mode', next);
  };

  const stats = getAllStats(wordlists);
  const daily = getDailyGoal();
  const goalPct = Math.min(100, Math.round((daily.count / daily.goal) * 100));
  const goalDone = daily.count >= daily.goal;

  const goFlash = () => {
    const map = {
      all: '/flashcards?mode=all',
      hf: '/flashcards?mode=high_frequency',
      bookmarks: '/flashcards?mode=bookmarks',
      due: '/flashcards?mode=due',
    };
    navigate(map[mode] || '/flashcards?mode=all');
  };

  return (
    <div className="page-in" style={{ background: '#F2F2F0', minHeight: '100dvh' }}>

      {/* ── Header ── */}
      <div className="px-5 pb-4 flex justify-between items-end" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px) + 32px, 72px)' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: 0 }}>
            GRE Lexicon
          </h1>
          <p style={{ color: '#ADADAD', fontSize: 13, marginTop: 2 }}>Daily vocabulary mastery</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.85 }} 
          onClick={toggleDark} 
          style={{ background: 'transparent', border: 'none', padding: 8, margin: 0, cursor: 'pointer', color: '#111', display: 'flex' }}
        >
          {isDark ? <Sun size={24} strokeWidth={2.5} /> : <Moon size={24} strokeWidth={2.5} />}
        </motion.button>
      </div>

      {/* ── 3 Stat Cards ── */}
      <div className="px-5 flex flex-col gap-3 mb-5">

        {/* Card 1: Daily Goal */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="card p-5"
          style={{ cursor: 'default' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="section-label mb-1">Daily Goal</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#111', lineHeight: 1 }}>
                {daily.count}
                <span style={{ fontSize: 18, fontWeight: 600, color: '#ADADAD' }}>
                  {' '}/ {daily.goal}
                </span>
              </p>
              <p style={{ fontSize: 12, color: '#ADADAD', marginTop: 4 }}>
                {goalDone ? '✓ Goal complete today!' : `${daily.goal - daily.count} words remaining`}
              </p>
            </div>
            {/* Mini ring */}
            <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
              <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#EAEAE8" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="14" fill="none"
                  stroke={goalDone ? '#333' : '#555'}
                  strokeWidth="3.5"
                  strokeDasharray={`${(goalPct / 100) * 87.96} 87.96`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#111' }}>{goalPct}%</span>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: '#EAEAE8', borderRadius: 999, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: goalDone ? '#222' : '#555', borderRadius: 999 }}
            />
          </div>
        </motion.div>

        {/* Card 2: Streak */}
        <div className="flex gap-3">
          <div className="card p-4 flex-1">
            <p className="section-label mb-2">Streak</p>
            <p style={{ fontSize: 36, fontWeight: 900, color: '#111', lineHeight: 1 }}>
              {stats.streak.current > 0 ? `🔥 ${stats.streak.current}` : '—'}
            </p>
            <p style={{ fontSize: 11, color: '#ADADAD', marginTop: 4 }}>
              {stats.streak.current > 0 ? 'day streak' : 'Start today!'}
            </p>
          </div>

          {/* Card 3: Mastered */}
          <div className="card p-4 flex-1">
            <p className="section-label mb-2">Mastered</p>
            <p style={{ fontSize: 36, fontWeight: 900, color: '#111', lineHeight: 1 }}>
              {stats.mastered}
            </p>
            <p style={{ fontSize: 11, color: '#ADADAD', marginTop: 4 }}>
              of {stats.total} words
            </p>
          </div>
        </div>
      </div>

      {/* ── Mode Selector ── */}
      <div className="px-5 mb-4">
        <div style={{ display: 'flex', gap: 8, padding: 4, background: '#E8E8E6', borderRadius: 999 }}>
          {[
            { id: 'all',       label: 'All' },
            { id: 'hf',        label: '★ HF' },
            { id: 'bookmarks', label: '🔖 Saved' },
            { id: 'due',       label: '🔄 Due' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className="pill-tab"
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: mode === t.id ? '#222' : 'transparent',
                color: mode === t.id ? '#fff' : '#9A9A9A',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              id={`home-tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#ADADAD', textAlign: 'center', marginTop: 6 }}>
          {mode === 'all' && `${stats.total} words · high-frequency appear 3× more`}
          {mode === 'hf' && `${stats.hfTotal} priority words · ${stats.hfMastered} mastered`}
          {mode === 'bookmarks' && 'Only your bookmarked words'}
          {mode === 'due' && 'Words your review schedule wants today'}
        </p>
      </div>

      {/* ── Start CTA ── */}
      <div className="px-5 mb-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={goFlash}
          className="btn-primary w-full pressable"
          style={{ padding: '16px', borderRadius: '1.25rem', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}
          id="home-start-session"
        >
          Start Flashcard Session →
        </motion.button>
      </div>

      {/* ── Quick Actions ── */}
      <div className="px-5 mb-6">
        <p style={{ fontSize: 12, fontWeight: 700, color: '#ADADAD', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Practice Modes
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: BookOpen, label: 'Browse Words', sub: `${stats.total} words`, path: '/library' },
            { icon: Grid3x3,  label: 'Word Groups',  sub: 'Match the theme',      path: '/groups/practice' },
            { icon: HelpCircle,label: 'Confusing Pairs', sub: '106 tricky pairs', path: '/confusing' },
            { icon: BarChart2, label: 'My Progress',  sub: `${stats.pct}% mastered`, path: '/dashboard' },
          ].map(({ icon: Icon, label, sub, path }) => (
            <motion.button
              key={path}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(path)}
              className="card p-4 text-left pressable"
              style={{ border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
              id={`home-${path.replace('/', '').replace('/', '-')}`}
            >
              <Icon size={18} color="#888" strokeWidth={1.8} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>{label}</p>
                <p style={{ fontSize: 11, color: '#ADADAD', marginTop: 2 }}>{sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

    </div>
  );
}
