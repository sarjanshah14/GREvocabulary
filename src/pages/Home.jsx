import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, BookOpen, Zap } from 'lucide-react';
import data from '../../data.json';
import ProgressBar from '../components/ProgressBar';
import { getWordlistStats, getStreak, getSessions, getLastWordlists, getOverallStats } from '../utils/storage';

const { wordlists } = data;
const LIST_NUMS = [...new Set(wordlists.map((w) => w.wordlistNumber))].sort((a, b) => a - b);

// 6 neutral grey shades cycling for wordlist cards
const WL_SHADES = ['#3A3A3A','#4A4A4A','#5C5C5C','#686868','#767676','#828282'];
const wlShade = (n) => WL_SHADES[(n - 1) % WL_SHADES.length];

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');

  const streak = getStreak();
  const sessions = getSessions();
  const overall = getOverallStats(wordlists);
  const lastLists = getLastWordlists();
  const recentNums = lastLists.length > 0 ? lastLists : LIST_NUMS.slice(0, 4);

  const goFlashcards = (mode, extra) => {
    if (mode === 'wordlist') navigate(`/flashcards?mode=wordlist&num=${extra}`);
    else if (mode === 'hf') navigate('/flashcards?mode=high_frequency');
    else if (mode === 'bookmarks') navigate('/flashcards?mode=bookmarks');
    else navigate('/flashcards?mode=all');
  };

  const hfCount = wordlists.filter((w) => w.isHighFrequency).length;

  return (
    <div className="page-in min-h-screen" style={{ background: '#F2F2F0' }}>

      {/* ── Top bar ── */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic" style={{ letterSpacing: '-0.03em', color: '#111111' }}>
            GRE Lexicon
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#ADADAD' }}>Master every word</p>
        </div>
        {/* Mastery ring */}
        <div className="relative" style={{ width: 52, height: 52 }}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#E4E4E2" strokeWidth="3.5"/>
            <circle cx="18" cy="18" r="14" fill="none" stroke="#222222" strokeWidth="3.5"
              strokeDasharray={`${(overall.pct / 100) * 87.96} 87.96`} strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-black" style={{ color: '#111111' }}>{overall.pct}%</span>
          </div>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="flex gap-3 px-5 mt-1">
        <div className="flex-1 stat-card">
          <BookOpen size={16} color="#ADADAD" />
          <p className="text-xl font-black" style={{ color: '#111111' }}>{overall.studied}</p>
          <p className="text-xs" style={{ color: '#ADADAD' }}>Studied</p>
        </div>
        <div className="flex-1 stat-card">
          <Zap size={16} color="#ADADAD" />
          <p className="text-xl font-black" style={{ color: '#111111' }}>
            {streak.currentStreak > 0 ? `🔥 ${streak.currentStreak}` : sessions}
          </p>
          <p className="text-xs" style={{ color: '#ADADAD' }}>
            {streak.currentStreak > 0 ? 'Day streak' : 'Sessions'}
          </p>
        </div>
        <div className="flex-1 stat-card">
          <p className="text-xl font-black" style={{ color: '#111111' }}>{overall.mastered}</p>
          <p className="text-xs" style={{ color: '#ADADAD' }}>Mastered</p>
        </div>
      </div>

      {/* ── Pill tabs ── */}
      <div className="px-5 mt-5">
        <div className="flex p-1 rounded-full" style={{ background: '#E8E8E6' }}>
          {[
            { id: 'all',       label: 'All Words' },
            { id: 'hf',        label: `★ High Freq (${hfCount})` },
            { id: 'bookmarks', label: '🔖 Saved' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pill-tab ${tab === t.id ? 'active' : 'inactive'}`}
              id={`home-tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Start CTA ── */}
      <div className="px-5 mt-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => goFlashcards(tab === 'hf' ? 'hf' : tab === 'bookmarks' ? 'bookmarks' : 'all')}
          className="w-full py-4 rounded-2xl font-bold text-white text-base pressable btn-primary flex items-center justify-center gap-2"
          style={{ borderRadius: '1.25rem' }}
          id="home-start-session"
        >
          Start Flashcard Session →
        </motion.button>
      </div>

      {/* ── Quick actions ── */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/groups/practice')}
          className="card p-4 text-left pressable" style={{ border: 'none', cursor: 'pointer' }}
          id="home-group-practice">
          <div className="text-xl mb-2">🎯</div>
          <p className="font-bold text-sm" style={{ color: '#111111' }}>Word Groups</p>
          <p className="text-xs mt-0.5" style={{ color: '#ADADAD' }}>Match the theme</p>
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/confusing')}
          className="card p-4 text-left pressable" style={{ border: 'none', cursor: 'pointer' }}
          id="home-confusing">
          <div className="text-xl mb-2">🤔</div>
          <p className="font-bold text-sm" style={{ color: '#111111' }}>Confusing Words</p>
          <p className="text-xs mt-0.5" style={{ color: '#ADADAD' }}>106 tricky pairs</p>
        </motion.button>
      </div>

      {/* ── Wordlists horizontal scroll ── */}
      <div className="mt-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <p className="font-bold text-base" style={{ color: '#111111' }}>Wordlists</p>
          <span className="text-xs" style={{ color: '#ADADAD' }}>31 lists</span>
        </div>
        <div className="scroll-row flex gap-3 px-5 pb-1">
          {LIST_NUMS.map((n) => {
            const stats = getWordlistStats(n, wordlists);
            const bg = wlShade(n);
            return (
              <motion.button
                key={n}
                whileTap={{ scale: 0.94 }}
                onClick={() => goFlashcards('wordlist', n)}
                className="flex-shrink-0 w-28 rounded-2xl p-4 text-left pressable"
                style={{ background: bg, border: 'none', cursor: 'pointer' }}
                id={`wl-card-${n}`}
              >
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest" style={{ color: '#fff' }}>List</p>
                <p className="font-black text-2xl leading-none mt-0.5" style={{ color: '#fff' }}>{n}</p>
                <p className="text-xs mt-2 opacity-70" style={{ color: '#fff' }}>{stats.total} words</p>
                <div className="mt-2 w-full rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.25)' }}>
                  <div className="h-full rounded-full" style={{ width: `${stats.pct}%`, background: '#FFFFFF' }} />
                </div>
                <p className="text-[10px] mt-1 opacity-70" style={{ color: '#fff' }}>{stats.pct}%</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Recently studied ── */}
      <div className="px-5 mt-6 mb-4">
        <p className="font-bold text-base mb-3" style={{ color: '#111111' }}>Recently Studied</p>
        <div className="flex flex-col gap-2.5">
          {recentNums.map((n) => {
            const stats = getWordlistStats(n, wordlists);
            return (
              <motion.button
                key={n}
                whileTap={{ scale: 0.98 }}
                onClick={() => goFlashcards('wordlist', n)}
                className="card flex items-center gap-3 px-4 py-3.5 pressable"
                style={{ border: 'none', cursor: 'pointer' }}
                id={`recent-${n}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                  style={{ background: wlShade(n), color: '#FFFFFF' }}
                >
                  {n}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: '#111111' }}>Wordlist {n}</p>
                  <div className="mt-1.5">
                    <ProgressBar value={stats.mastered} max={stats.total} height={4} />
                  </div>
                </div>
                <span className="text-xs font-bold" style={{ color: '#7A7A7A' }}>{stats.pct}%</span>
                <ChevronRight size={16} color="#CCCCCC" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
