import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, Bookmark, Heart, X } from 'lucide-react';
import data from '../../data.json';
import FlashCard from '../components/FlashCard';
import SwipeButtons from '../components/SwipeButtons';
import { useSpacedRepetition } from '../hooks/useSpacedRepetition';
import {
  toggleBookmark, toggleFavourite,
  getBookmarks, getFavourites,
  incrementSessions, updateStreak,
  filterWords, getDailyWordsHistory,
} from '../utils/engine';

const { wordlists } = data;

// ─── Mode picker sheet ───────────────────────────────────────────────────────
// Always has a close/dismiss — tapping overlay OR X closes it.

function ModeSheet({ current, onSelect, onClose }) {
  const hfCount = filterWords(wordlists, 'high_frequency').length;
  const bmCount = filterWords(wordlists, 'bookmarks').length;
  const dueCount = filterWords(wordlists, 'due').length;

  const modes = [
    { id: 'all',            label: 'All Words',         desc: `${wordlists.length} words · HF appear 3× more` },
    { id: 'high_frequency', label: 'High Frequency',  desc: `${hfCount} essential GRE words` },
    { id: 'bookmarks',      label: 'Bookmarked',      desc: bmCount > 0 ? `${bmCount} saved words` : 'No bookmarks yet' },
    { id: 'due',            label: 'Due for Review',  desc: dueCount > 0 ? `${dueCount} words due` : 'Nothing due right now' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="sheet-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}   // tap outside = dismiss
      >
        <motion.div
          className="sheet-panel"
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 999, background: '#EAEAE8', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              id="mode-close-btn"
              aria-label="Close"
            >
              <X size={15} color="#888" strokeWidth={2.5} />
            </motion.button>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: '0 0 4px' }}>
            Session Mode
          </h2>
          <p style={{ fontSize: 12, color: '#ADADAD', margin: '0 0 16px' }}>
            Tap to switch · swipe right = Know · left = Skip
          </p>

          {modes.map((m) => {
            const isActive = m.id === current;
            return (
              <motion.button
                key={m.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(m.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 14, marginBottom: 8,
                  background: isActive ? '#222' : '#F4F4F2',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                id={`mode-${m.id}`}
              >
                <div>
                  <p style={{ fontWeight: 600, color: isActive ? '#fff' : '#111', margin: 0 }}>{m.label}</p>
                  <p style={{ fontSize: 12, color: isActive ? 'rgba(255,255,255,0.6)' : '#ADADAD', margin: '2px 0 0' }}>{m.desc}</p>
                </div>
                {isActive && <span style={{ color: '#fff', fontSize: 16 }}>✓</span>}
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Session complete ─────────────────────────────────────────────────────────

function SessionDone({ mode, onNewBatch, onSameBatch, onHome }) {
  useEffect(() => { incrementSessions(); updateStreak(); }, []);

  const modeLabel = {
    all: 'All Words',
    high_frequency: 'High Frequency',
    bookmarks: 'Bookmarked',
    due: 'Due for Review',
  }[mode] || 'All Words';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100dvh', padding: '0 24px',
      textAlign: 'center', background: '#F2F2F0',
    }}>
      <h2 style={{ fontSize: 32, fontWeight: 900, color: '#111', margin: '0 0 4px' }}>
        Session Complete!
      </h2>
      <p style={{ fontSize: 13, color: '#ADADAD', margin: '0 0 6px' }}>Mode: {modeLabel}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 36px' }}>
        Great job! You've completed your batch.
      </p>

      <motion.button
        whileTap={{ scale: 0.97 }} onClick={onNewBatch}
        className="btn-primary pressable w-full"
        style={{ marginBottom: 10, padding: '16px', borderRadius: '1.25rem', fontSize: 16, fontWeight: 700 }}
        id="fc-new-batch">
        Practice New Batch
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.97 }} onClick={onSameBatch}
        style={{ width: '100%', marginBottom: 12, padding: '14px', borderRadius: '1.25rem', fontSize: 15, fontWeight: 700, border: 'none', background: '#EAEAE8', color: '#111', cursor: 'pointer' }}
        id="fc-same-batch">
        Review Same Batch
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.97 }} onClick={onHome}
        className="btn-secondary pressable w-full"
        style={{ padding: '14px', borderRadius: '1.25rem', fontSize: 14, fontWeight: 600 }}
        id="fc-home">
        Go Home
      </motion.button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Flashcards() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlMode = searchParams.get('mode');
  const historyDate = searchParams.get('historyDate');
  const isReplaySession = Boolean(historyDate);

  // NEVER force-show mode sheet on load. Always start immediately.
  const [showSheet, setShowSheet] = useState(false);
  const [mode, setMode] = useState(urlMode || 'all');
  const [sessionKey, setSessionKey] = useState(0);
  const [bookmarks, setBookmarks] = useState(() => getBookmarks());
  const [favourites, setFavourites] = useState(() => getFavourites());

  const cardRef = useRef(null);
  const historyRows = getDailyWordsHistory();
  const historyWordsForDate = historyDate && Array.isArray(historyRows[historyDate]?.words)
    ? historyRows[historyDate].words
    : [];
  const historyPool = historyWordsForDate
    .map((w) => wordlists.find((x) => x.word === w))
    .filter(Boolean);

  const { current, index, total, swipe, resetIndex, isDone } = useSpacedRepetition(
    wordlists,
    mode,
    historyPool.length > 0 ? historyPool : null,
    { trackDaily: !isReplaySession }
  );

  const handleSelect = (m) => { setMode(m); setShowSheet(false); };
  const handleFav   = () => { if (current) setFavourites([...toggleFavourite(current.word)]); };
  const handleBook  = () => { if (current) setBookmarks([...toggleBookmark(current.word)]); };
  const handleRestart = () => { setShowSheet(false); setSessionKey((k) => k + 1); };

  const handleButtonSwipe = (dir) => {
    if (cardRef.current) {
      cardRef.current.triggerSwipe(dir);
    } else {
      swipe(dir);
    }
  };

  const modeNames = {
    all: 'All Words',
    high_frequency: 'High Frequency',
    bookmarks: 'Bookmarks',
    due: 'Due for Review',
    history: 'History Replay',
  };
  const currentModeLabel = historyDate ? modeNames.history : (modeNames[mode] || 'All Words');

  const isFav  = current ? favourites.includes(current.word) : false;
  const isBook = current ? bookmarks.includes(current.word) : false;

  if (isDone && !showSheet && total > 0) {
    return (
      <SessionDone
        total={total}
        mode={mode}
        onNewBatch={handleRestart}
        onSameBatch={resetIndex}
        onHome={() => navigate('/')}
      />
    );
  }

  const pct = total > 0 ? (index / total) * 100 : 0;
  return (
    <div key={sessionKey} className="page-in" style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100dvh', background: '#F2F2F0',
    }}>
      {showSheet && (
        <ModeSheet
          current={mode}
          onSelect={handleSelect}
          onClose={() => setShowSheet(false)}
        />
      )}

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(env(safe-area-inset-top, 0px) + 32px, 72px) 20px 10px',
      }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/')}
          style={{ width: 40, height: 40, borderRadius: 999, background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', cursor: 'pointer', flexShrink: 0 }}
          id="fc-back">
          <ArrowLeft size={18} color="#777" strokeWidth={2} />
        </motion.button>

        <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>
            {currentModeLabel}
          </p>
          <p style={{ fontSize: 12, color: '#ADADAD', margin: '3px 0 0' }}>
            {historyDate ? `${historyDate} · Card ${index + 1}` : `Card ${index + 1}`}
          </p>
        </div>

        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowSheet(true)}
          style={{ width: 40, height: 40, borderRadius: 999, background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', cursor: 'pointer', flexShrink: 0 }}
          id="fc-mode-btn">
          <SlidersHorizontal size={16} color="#777" strokeWidth={2} />
        </motion.button>
      </div>

      {/* ── Session progress bar ── */}
      <div style={{ padding: '4px 20px 12px' }}>
        <div style={{ height: 4, background: '#E4E4E2', borderRadius: 999, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }}
            style={{ height: '100%', background: '#333', borderRadius: 999 }}
          />
        </div>
      </div>

      {/* ── Fav / Bookmark ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 20px 8px' }}>
        {[
          { fn: handleFav,  Icon: Heart,    filled: isFav,  id: 'fc-fav-btn',      label: 'Favourite' },
          { fn: handleBook, Icon: Bookmark, filled: isBook, id: 'fc-bookmark-btn', label: 'Bookmark' },
        ].map(({ fn, Icon, filled, id, label }) => (
          <motion.button key={id} whileTap={{ scale: 0.85 }} onClick={fn} disabled={!current}
            aria-label={label}
            style={{
              width: 40, height: 40, borderRadius: 999, background: '#fff', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)', cursor: 'pointer', opacity: current ? 1 : 0.3,
            }}
            id={id}>
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
              <FlashCard ref={cardRef} key={current.word + sessionKey} word={current} onSwipe={swipe} />
            )}
          </div>
        </div>
      </div>

      {/* ── Swipe buttons ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 140px' }}>
        <SwipeButtons
          onLeft={() => handleButtonSwipe('left')}
          onRight={() => handleButtonSwipe('right')}
          disabled={!current}
          word={current?.word}
        />
      </div>
    </div>
  );
}
