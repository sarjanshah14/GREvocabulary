import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, Bookmark, Heart } from 'lucide-react';
import data from '../../data.json';
import FlashCard from '../components/FlashCard';
import SwipeButtons from '../components/SwipeButtons';
import { useSpacedRepetition } from '../hooks/useSpacedRepetition';
import {
  toggleFavourite, toggleBookmark,
  getFavourites, getBookmarks,
  incrementSessions, updateStreak, addLastWordlist,
} from '../utils/storage';

const { wordlists } = data;
const LIST_NUMS = [...new Set(wordlists.map((w) => w.wordlistNumber))].sort((a, b) => a - b);

/* ─── Mode picker sheet ─────── */
function ModeSheet({ onSelect, onClose, canClose }) {
  const [pickerWL, setPickerWL] = useState(1);

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
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#E4E4E2' }} />
          <h2 className="text-xl font-black mb-4" style={{ color: '#111111' }}>Choose Session Mode</h2>

          {[
            { id: 'all',            label: '📚 All Words',      desc: `${wordlists.length} words` },
            { id: 'high_frequency', label: '★ High Frequency',  desc: `${wordlists.filter(w => w.isHighFrequency).length} words — boosted frequency` },
            { id: 'bookmarks',      label: '🔖 Bookmarked',      desc: 'Words you saved' },
            { id: 'due',            label: '🔄 Due for Review',  desc: 'Spaced repetition queue' },
          ].map((m) => (
            <motion.button
              key={m.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(m.id, null)}
              className="w-full flex items-center justify-between p-4 rounded-2xl mb-2 pressable text-left"
              style={{ background: '#F4F4F2', border: 'none', cursor: 'pointer' }}
              id={`mode-${m.id}`}
            >
              <div>
                <p className="font-semibold" style={{ color: '#111111' }}>{m.label}</p>
                <p className="text-sm mt-0.5" style={{ color: '#ADADAD' }}>{m.desc}</p>
              </div>
              <span style={{ color: '#CCCCCC', fontSize: 20 }}>›</span>
            </motion.button>
          ))}

          {/* Wordlist picker */}
          <div className="mt-3 p-4 rounded-2xl" style={{ background: '#F4F4F2' }}>
            <p className="font-semibold mb-3" style={{ color: '#111111' }}>📖 By Wordlist</p>
            <div className="scroll-row flex gap-2 pb-1 mb-3">
              {LIST_NUMS.map((n) => (
                <button
                  key={n}
                  onClick={() => setPickerWL(n)}
                  className="flex-shrink-0 w-10 h-10 rounded-xl font-bold text-sm pressable"
                  style={{
                    background: pickerWL === n ? '#222222' : '#FFFFFF',
                    color: pickerWL === n ? '#FFFFFF' : '#9A9A9A',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    border: 'none', cursor: 'pointer',
                  }}
                  id={`pick-wl-${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect('wordlist', pickerWL)}
              className="w-full py-3.5 rounded-xl font-bold text-white pressable btn-primary"
              style={{ borderRadius: '0.75rem' }}
              id="mode-wl-go"
            >
              Practice Wordlist {pickerWL} →
            </motion.button>
          </div>

          {canClose && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
              className="mt-3 w-full py-3 rounded-2xl font-semibold pressable btn-secondary"
              id="mode-cancel">
              Cancel
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Session complete ─────── */
function SessionDone({ total, onRestart, onHome }) {
  useState(() => { incrementSessions(); updateStreak(); });
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ background: '#F2F2F0' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-6xl mb-6">🎉</motion.div>
      <h2 className="text-3xl font-black mb-2" style={{ color: '#111111' }}>Session Complete!</h2>
      <p className="text-sm mb-2" style={{ color: '#ADADAD' }}>You reviewed</p>
      <p className="text-7xl font-black mb-1" style={{ color: '#111111' }}>{total}</p>
      <p className="text-sm mb-10" style={{ color: '#ADADAD' }}>words this session</p>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onRestart}
        className="w-full py-4 rounded-2xl font-bold text-white text-lg mb-3 pressable btn-primary"
        style={{ borderRadius: '1.25rem' }} id="fc-restart">
        Practice Again
      </motion.button>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onHome}
        className="w-full py-3.5 rounded-2xl font-semibold pressable btn-secondary"
        style={{ borderRadius: '1.25rem' }} id="fc-home">
        Go Home
      </motion.button>
    </div>
  );
}

/* ─── Main page ─────── */
export default function Flashcards() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlMode = searchParams.get('mode');
  const urlNum = searchParams.get('num') ? parseInt(searchParams.get('num')) : null;

  const [showSheet, setShowSheet] = useState(!urlMode);
  const [mode, setMode] = useState(urlMode || 'all');
  const [extra, setExtra] = useState(urlNum);
  const [sessionKey, setSessionKey] = useState(0);
  const [favourites, setFavourites] = useState(() => getFavourites());
  const [bookmarks, setBookmarks] = useState(() => getBookmarks());

  const { current, index, total, swipe, isDone } = useSpacedRepetition(wordlists, mode, extra);

  const handleSelect = (m, e) => {
    setMode(m); setExtra(e);
    if (e) addLastWordlist(e);
    setShowSheet(false);
  };

  const handleFav = () => { if (current) setFavourites([...toggleFavourite(current.word)]); };
  const handleBook = () => { if (current) setBookmarks([...toggleBookmark(current.word)]); };
  const handleRestart = () => { setShowSheet(true); setSessionKey((k) => k + 1); };

  const modeName = () => {
    if (mode === 'wordlist' && extra) return `Wordlist ${extra}`;
    if (mode === 'high_frequency') return '★ High Frequency';
    if (mode === 'bookmarks') return 'Bookmarks';
    if (mode === 'due') return 'Due for Review';
    return 'All Words';
  };

  const isFav  = current ? favourites.includes(current.word) : false;
  const isBook = current ? bookmarks.includes(current.word) : false;

  if (isDone && !showSheet) {
    return <SessionDone total={total} onRestart={handleRestart} onHome={() => navigate('/')} />;
  }

  return (
    <div key={sessionKey} className="page-in flex flex-col min-h-screen" style={{ background: '#F2F2F0' }}>
      {showSheet && (
        <ModeSheet onSelect={handleSelect} onClose={() => setShowSheet(false)} canClose={!!urlMode} />
      )}

      {/* ── Header row ── */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full flex items-center justify-center pressable"
          style={{ background: '#FFFFFF', border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
          id="fc-back">
          <ArrowLeft size={18} color="#777777" strokeWidth={2} />
        </motion.button>

        <div className="text-center">
          <p className="font-bold text-sm" style={{ color: '#111111' }}>{modeName()}</p>
          <p className="text-xs" style={{ color: '#ADADAD' }}>{index} of {total}</p>
        </div>

        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowSheet(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center pressable"
          style={{ background: '#FFFFFF', border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
          id="fc-mode-btn">
          <SlidersHorizontal size={16} color="#777777" strokeWidth={2} />
        </motion.button>
      </div>

      {/* ── Progress bar ── */}
      <div className="px-5 mb-4">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${total > 0 ? (index / total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* ── Fav / Bookmark row (BELOW progress bar, separate from card) ── */}
      <div className="flex justify-end px-5 mb-3 gap-2">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleFav}
          disabled={!current}
          className="w-10 h-10 rounded-full flex items-center justify-center pressable disabled:opacity-30"
          style={{ background: '#FFFFFF', border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}
          id="fc-fav-btn" aria-label="Favourite">
          <Heart size={17} fill={isFav ? '#222' : 'none'} color={isFav ? '#222' : '#CCCCCC'} strokeWidth={2} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleBook}
          disabled={!current}
          className="w-10 h-10 rounded-full flex items-center justify-center pressable disabled:opacity-30"
          style={{ background: '#FFFFFF', border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}
          id="fc-bookmark-btn" aria-label="Bookmark">
          <Bookmark size={17} fill={isBook ? '#222' : 'none'} color={isBook ? '#222' : '#CCCCCC'} strokeWidth={2} />
        </motion.button>
      </div>

      {/* ── Card stack ── */}
      <div className="flex-1 flex flex-col justify-center px-5">
        <div className="relative">
          {/* Ghost cards for depth */}
          <div className="absolute inset-x-8 -bottom-4 rounded-3xl"
            style={{ height: '100%', background: '#E0E0DE', zIndex: 1, borderRadius: '2rem',
              transform: 'scale(0.88)', transformOrigin: 'bottom center' }} />
          <div className="absolute inset-x-4 -bottom-2 rounded-3xl"
            style={{ height: '100%', background: '#EBEBEA', zIndex: 2, borderRadius: '2rem',
              transform: 'scale(0.94)', transformOrigin: 'bottom center' }} />
          <div className="relative" style={{ zIndex: 3 }}>
            {current && (
              <FlashCard
                key={current.word + sessionKey}
                word={current}
                onSwipe={swipe}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Swipe dock ── */}
      <div className="flex justify-center pb-36 pt-10">
        <SwipeButtons onLeft={() => swipe('left')} onRight={() => swipe('right')} disabled={!current} />
      </div>
    </div>
  );
}
