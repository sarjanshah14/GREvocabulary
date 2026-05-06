import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Zap } from 'lucide-react';
import data from '../../data.json';
import { getStreak, getSessions, getOverallStats } from '../utils/storage';

const { wordlists } = data;
const totalWords = wordlists.length;
const hfWords = wordlists.filter((w) => w.isHighFrequency);

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');

  const streak = getStreak();
  const sessions = getSessions();
  const overall = getOverallStats(wordlists);

  const goFlashcards = (mode) => {
    if (mode === 'hf')        navigate('/flashcards?mode=high_frequency');
    else if (mode === 'bookmarks') navigate('/flashcards?mode=bookmarks');
    else if (mode === 'due')  navigate('/flashcards?mode=due');
    else                      navigate('/flashcards?mode=all');
  };

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
        <div className="relative" style={{ width: 56, height: 56 }}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#E4E4E2" strokeWidth="3.5"/>
            <circle cx="18" cy="18" r="14" fill="none" stroke="#222222" strokeWidth="3.5"
              strokeDasharray={`${(overall.pct / 100) * 87.96} 87.96`} strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-black leading-none" style={{ color: '#111111' }}>{overall.pct}%</span>
            <span className="text-[9px]" style={{ color: '#ADADAD' }}>done</span>
          </div>
        </div>
      </div>

      {/* ── Stat row ── */}
      <div className="flex gap-3 px-5 mt-1">
        <div className="flex-1 stat-card">
          <BookOpen size={16} color="#ADADAD" />
          <p className="text-2xl font-black" style={{ color: '#111111' }}>{overall.studied}</p>
          <p className="text-xs" style={{ color: '#ADADAD' }}>Studied</p>
        </div>
        <div className="flex-1 stat-card">
          <p className="text-2xl font-black" style={{ color: '#111111' }}>{overall.mastered}</p>
          <p className="text-xs" style={{ color: '#ADADAD' }}>Mastered</p>
        </div>
        <div className="flex-1 stat-card">
          <Zap size={16} color="#ADADAD" />
          <p className="text-2xl font-black" style={{ color: '#111111' }}>
            {streak.currentStreak > 0 ? `🔥${streak.currentStreak}` : sessions}
          </p>
          <p className="text-xs" style={{ color: '#ADADAD' }}>
            {streak.currentStreak > 0 ? 'Streak' : 'Sessions'}
          </p>
        </div>
      </div>

      {/* ── Total word count pill ── */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl px-5 py-3.5 flex items-center justify-between"
          style={{ background: '#FFFFFF', border: '1px solid #E8E8E6' }}>
          <div>
            <p className="font-bold text-sm" style={{ color: '#111111' }}>Total Vocabulary</p>
            <p className="text-xs mt-0.5" style={{ color: '#ADADAD' }}>All words in one pool</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black" style={{ color: '#111111' }}>{totalWords}</p>
            <p className="text-xs" style={{ color: '#ADADAD' }}>words</p>
          </div>
        </div>
      </div>

      {/* ── Mode tabs ── */}
      <div className="px-5 mt-4">
        <div className="flex p-1 rounded-full" style={{ background: '#E8E8E6' }}>
          {[
            { id: 'all',       label: 'All Words' },
            { id: 'hf',        label: `★ HF (${hfWords.length})` },
            { id: 'bookmarks', label: '🔖 Saved' },
            { id: 'due',       label: '🔄 Due' },
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
          onClick={() => goFlashcards(tab)}
          className="w-full py-4 rounded-2xl font-bold text-white text-base pressable btn-primary flex items-center justify-center gap-2"
          style={{ borderRadius: '1.25rem' }}
          id="home-start-session"
        >
          Start Flashcard Session →
        </motion.button>
      </div>

      {/* ── Mode descriptions ── */}
      <div className="px-5 mt-3">
        <p className="text-xs text-center" style={{ color: '#ADADAD' }}>
          {tab === 'all'       && `Practice all ${totalWords} words. High frequency words appear more often.`}
          {tab === 'hf'        && `Only the ${hfWords.length} high-priority GRE words. Best for focused review.`}
          {tab === 'bookmarks' && 'Only words you\'ve bookmarked during study sessions.'}
          {tab === 'due'       && 'Words your spaced repetition schedule says to review today.'}
        </p>
      </div>

      {/* ── Quick actions ── */}
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/library')}
          className="card p-4 text-left pressable" style={{ border: 'none', cursor: 'pointer' }}
          id="home-library">
          <div className="text-xl mb-2">📖</div>
          <p className="font-bold text-sm" style={{ color: '#111111' }}>Browse Words</p>
          <p className="text-xs mt-0.5" style={{ color: '#ADADAD' }}>{totalWords} words</p>
        </motion.button>

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

        <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/dashboard')}
          className="card p-4 text-left pressable" style={{ border: 'none', cursor: 'pointer' }}
          id="home-progress">
          <div className="text-xl mb-2">📊</div>
          <p className="font-bold text-sm" style={{ color: '#111111' }}>My Progress</p>
          <p className="text-xs mt-0.5" style={{ color: '#ADADAD' }}>{overall.pct}% mastered</p>
        </motion.button>
      </div>

      {/* ── HF progress card ── */}
      <div className="px-5 mt-5 mb-6">
        <div className="card p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-sm" style={{ color: '#111111' }}>★ High Frequency Progress</p>
            <span className="text-xs font-bold" style={{ color: '#7A7A7A' }}>
              {overall.mastered} / {totalWords}
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${overall.pct}%` }} />
          </div>
          <p className="text-xs mt-2" style={{ color: '#ADADAD' }}>
            Keep going — HF words repeat more often to help you retain them.
          </p>
        </div>
      </div>

    </div>
  );
}
