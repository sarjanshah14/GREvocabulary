import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, Bookmark, Heart } from 'lucide-react';
import data from '../../data.json';
import FlashCard from '../components/FlashCard';
import SwipeButtons from '../components/SwipeButtons';
import { useSpacedRepetition } from '../hooks/useSpacedRepetition';
import {
  toggleBookmark, toggleFavourite,
  getBookmarks, getFavourites,
  incrementSessions, updateStreak,
  filterWords, getDailyGoal,
} from '../utils/engine';

const { wordlists } = data;

/* ─── Mode picker sheet ─── */
function ModeSheet({ onSelect, onClose, canClose }) {
  const hfCount = wordlists.filter((w) => w.isHighFrequency).length;
  return (
    <AnimatePresence>
      <motion.div
        className="sheet-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={canClose ? onClose : undefined}
      >
        <motion.div
          className="sheet-panel"
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ width: 40, height: 4, borderRadius: 999, background: '#E4E4E2', margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: '0 0 4px' }}>
            Choose Session Mode
          </h2>
          <p style={{ fontSize: 13, color: '#ADADAD', margin: '0 0 20px' }}>
            All modes draw from the complete word pool
          </p>

          {[
            { id: 'all',            label: '📚 All Words',           desc: `${wordlists.length} words · HF words appear 3× more` },
            { id: 'high_frequency', label: '★ High Frequency only',  desc: `${hfCount} essential GRE words` },
            { id: 'bookmarks',      label: '🔖 Bookmarked',           desc: 'Only words you saved' },
            { id: 'due',            label: '🔄 Due for Review',       desc: 'Spaced repetition queue' },
          ].map((m) => (
            <motion.button
              key={m.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(m.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 16, marginBottom: 8,
                background: '#F4F4F2', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
              id={`mode-${m.id}`}
            >
              <div>
                <p style={{ fontWeight: 600, color: '#111', margin: 0 }}>{m.label}</p>
                <p style={{ fontSize: 12, color: '#ADADAD', margin: '2px 0 0' }}>{m.desc}</p>
              </div>
              <span style={{ color: '#CCC', fontSize: 20, lineHeight: 1 }}>›</span>
            </motion.button>
          ))}

          {canClose && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="btn-secondary pressable w-full"
              style={{ marginTop: 8, padding: '12px', borderRadius: '1.25rem', fontSize: 14 }}
              id="mode-cancel"
            >
              Cancel
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Session complete ─── */
function SessionDone({ total, mode, onRestart, onHome }) {
  useState(() => { incrementSessions(); updateStreak(); });

  const modeLabel = {
    all: 'All Words',
    high_frequency: '★ High Frequency',
    bookmarks: 'Bookmarked',
    due: 'Due for Review',
  }[mode] || 'All Words';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100dvh', padding: '0 24px',
      textAlign: 'center', background: '#F2F2F0',
    }}>
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        style={{ fontSize: 64, marginBottom: 20 }}
      >
        🎉
      </motion.div>
      <h2 style={{ fontSize: 32, fontWeight: 900, color: '#111', margin: '0 0 4px' }}>
        Session Complete!
      </h2>
      <p style={{ fontSize: 14, color: '#ADADAD', margin: '0 0 6px' }}>Mode: {modeLabel}</p>
      <p style={{ fontSize: 80, fontWeight: 900, color: '#111', lineHeight: 1, margin: '0 0 4px' }}>
        {total}
      </p>
      <p style={{ fontSize: 14, color: '#ADADAD', margin: '0 0 36px' }}>
        words reviewed this session
      </p>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onRestart}
        className="btn-primary pressable w-full"
        style={{ marginBottom: 12, padding: '16px', borderRadius: '1.25rem', fontSize: 16, fontWeight: 700 }}
        id="fc-restart"
      >
        Practice Again
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onHome}
        className="btn-secondary pressable w-full"
        style={{ padding: '14px', borderRadius: '1.25rem', fontSize: 14, fontWeight: 600 }}
        id="fc-home"
      >
        Go Home
      </motion.button>
    </div>
  );
}

/* ─── Main page ─── */
export default function Flashcards() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlMode = searchParams.get('mode');

  const [showSheet, setShowSheet] = useState(!urlMode);
  const [mode, setMode] = useState(urlMode || 'all');
  const [sessionKey, setSessionKey] = useState(0);
  const [bookmarks, setBookmarks] = useState(() => getBookmarks());
  const [favourites, setFavourites] = useState(() => getFavourites());

  const { current, index, total, swipe, isDone } = useSpacedRepetition(wordlists, mode);
  const daily = getDailyGoal();

  const handleSelect = (m) => { setMode(m); setShowSheet(false); };
  const handleFav  = () => { if (current) setFavourites([...toggleFavourite(current.word)]); };
  const handleBook = () => { if (current) setBookmarks([...toggleBookmark(current.word)]); };
  const handleRestart = () => { setShowSheet(true); setSessionKey((k) => k + 1); };

  // Label for the current deck size
  const deckLabel = () => {
    if (mode === 'high_frequency') {
      const hf = filterWords(wordlists, 'high_frequency');
      return `${hf.length} high-frequency words`;
    }
    if (mode === 'bookmarks') {
      const bm = filterWords(wordlists, 'bookmarks');
      return `${bm.length} bookmarked word${bm.length !== 1 ? 's' : ''}`;
    }
    return `${wordlists.length} words`;
  };

  const modeNames = {
    all: 'All Words',
    high_frequency: '★ High Frequency',
    bookmarks: 'Bookmarks',
    due: 'Due for Review',
  };

  const isFav  = current ? favourites.includes(current.word) : false;
  const isBook = current ? bookmarks.includes(current.word) : false;

  if (isDone && !showSheet) {
    return <SessionDone total={total} mode={mode} onRestart={handleRestart} onHome={() => navigate('/')} />;
  }

  const pct = total > 0 ? (index / total) * 100 : 0;

  return (
    <div key={sessionKey} className="page-in" style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100dvh', background: '#F2F2F0',
    }}>
      {showSheet && (
        <ModeSheet onSelect={handleSelect} onClose={() => setShowSheet(false)} canClose={!!urlMode} />
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '68px 20px 12px' }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/')}
          style={{ width: 40, height: 40, borderRadius: 999, background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', cursor: 'pointer' }}
          id="fc-back">
          <ArrowLeft size={18} color="#777" strokeWidth={2} />
        </motion.button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>{modeNames[mode] || 'All Words'}</p>
          <p style={{ fontSize: 12, color: '#ADADAD', margin: '3px 0 0' }}>
            {index} of {total} · Goal: <strong style={{ color: daily.count >= daily.goal ? '#333' : '#777' }}>{daily.count}/{daily.goal}</strong> today
          </p>
        </div>

        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowSheet(true)}
          style={{ width: 40, height: 40, borderRadius: 999, background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', cursor: 'pointer' }}
          id="fc-mode-btn">
          <SlidersHorizontal size={16} color="#777" strokeWidth={2} />
        </motion.button>
      </div>

      {/* ── Progress bars ── */}
      <div style={{ padding: '0 20px 12px' }}>
        {/* Session progress */}
        <div style={{ height: 4, background: '#E4E4E2', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: '#333', borderRadius: 999 }}
          />
        </div>
        {/* Daily goal progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 3, background: '#E4E4E2', borderRadius: 999, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${Math.min(100, Math.round((daily.count / daily.goal) * 100))}%` }}
              transition={{ duration: 0.5 }}
              style={{ height: '100%', background: '#ADADAD', borderRadius: 999 }}
            />
          </div>
          <p style={{ fontSize: 10, color: '#ADADAD', whiteSpace: 'nowrap', margin: 0 }}>
            {daily.count >= daily.goal ? '✓ Daily goal done' : `${daily.count}/${daily.goal} daily goal`}
          </p>
        </div>
      </div>

      {/* ── Fav / Bookmark row ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 20px 8px' }}>
        {[
          { fn: handleFav,  Icon: Heart,     filled: isFav,  id: 'fc-fav-btn',      label: 'Favourite' },
          { fn: handleBook, Icon: Bookmark,  filled: isBook, id: 'fc-bookmark-btn', label: 'Bookmark' },
        ].map(({ fn, Icon, filled, id, label }) => (
          <motion.button
            key={id}
            whileTap={{ scale: 0.85 }}
            onClick={fn}
            disabled={!current}
            aria-label={label}
            style={{
              width: 40, height: 40, borderRadius: 999, background: '#fff', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)', cursor: 'pointer', opacity: current ? 1 : 0.3,
            }}
            id={id}
          >
            <Icon size={17} fill={filled ? '#222' : 'none'} color={filled ? '#222' : '#CCC'} strokeWidth={2} />
          </motion.button>
        ))}
      </div>

      {/* ── Card stack ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ position: 'relative' }}>
          {/* Ghost cards for depth */}
          {[
            { scale: 0.88, bottom: -16, bg: '#D8D8D6', zIndex: 1 },
            { scale: 0.94, bottom: -8,  bg: '#E8E8E6', zIndex: 2 },
          ].map((g, i) => (
            <div key={i} style={{
              position: 'absolute', left: 0, right: 0, bottom: g.bottom, height: '100%',
              borderRadius: '2rem', background: g.bg, zIndex: g.zIndex,
              transform: `scale(${g.scale})`, transformOrigin: 'bottom center',
            }} />
          ))}
          <div style={{ position: 'relative', zIndex: 3 }}>
            {current && (
              <FlashCard key={current.word + sessionKey} word={current} onSwipe={swipe} />
            )}
          </div>
        </div>
      </div>

      {/* ── Swipe buttons ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 140px' }}>
        <SwipeButtons onLeft={() => swipe('left')} onRight={() => swipe('right')} disabled={!current} word={current?.word} />
      </div>
    </div>
  );
}
