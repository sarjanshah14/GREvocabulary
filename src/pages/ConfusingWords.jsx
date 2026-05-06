import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, EyeOff, ChevronLeft, ChevronRight, X } from 'lucide-react';
import data from '../../data.json';

const { confusingwords } = data;

export default function ConfusingWords() {
  const [search, setSearch] = useState('');
  const [practice, setPractice] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [revealed, setRevealed] = useState(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return confusingwords;
    const q = search.toLowerCase();
    return confusingwords.filter((g) =>
      g.words.some((w) => w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q))
    );
  }, [search]);

  const revealKey = (gn, wi) => `${gn}_${wi}`;
  const isRevealed = (gn, wi) => revealed.has(revealKey(gn, wi));
  const reveal = (gn, wi) => setRevealed((p) => new Set([...p, revealKey(gn, wi)]));

  if (practice && filtered.length > 0) {
    const group = filtered[practiceIdx];
    return (
      <div className="page-in flex flex-col min-h-screen" style={{ background: '#FAF9F6' }}>
        <div className="flex items-center justify-between px-5 pt-14 pb-4">
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => { setPractice(false); setRevealed(new Set()); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold pressable"
            style={{ background: '#FFFFFF', color: '#6B7280', border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', cursor: 'pointer' }}
            id="cw-exit">← Exit</motion.button>
          <span className="text-charcoal font-bold text-sm">{practiceIdx + 1} / {filtered.length}</span>
          <div className="w-16" />
        </div>

        <div className="px-5 mb-6">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${((practiceIdx + 1) / filtered.length) * 100}%` }} />
          </div>
        </div>

        <div className="flex-1 px-5 flex flex-col justify-center">
          <div className="text-center mb-6">
            <p className="section-label">Confusing Pair #{group.groupNumber}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {group.words.map((w, i) => (
              <motion.div key={i} layout className="card-md p-5">
                <p className="text-xl font-black text-charcoal mb-2">{w.word}</p>
                <AnimatePresence>
                  {isRevealed(group.groupNumber, i) ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-charcoal text-sm leading-relaxed">{w.meaning}</p>
                      {w.example && (
                        <p className="text-xs italic mt-2 leading-relaxed" style={{ color: '#E8735A' }}>"{w.example}"</p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.93 }} onClick={() => reveal(group.groupNumber, i)}
                      className="w-full py-2 rounded-xl text-xs font-semibold pressable"
                      style={{ background: '#FDF0EC', color: '#E8735A', border: 'none', cursor: 'pointer' }}
                      id={`reveal-${group.groupNumber}-${i}`}>
                      Tap to reveal
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-36">
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => { setPracticeIdx((i) => Math.max(0, i - 1)); setRevealed(new Set()); }}
            disabled={practiceIdx === 0}
            className="flex-1 py-3.5 rounded-2xl font-semibold pressable disabled:opacity-40"
            style={{ background: '#FFFFFF', color: '#6B7280', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', cursor: 'pointer' }}
            id="cw-prev">← Prev</motion.button>
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => { setPracticeIdx((i) => Math.min(filtered.length - 1, i + 1)); setRevealed(new Set()); }}
            disabled={practiceIdx >= filtered.length - 1}
            className="flex-1 py-3.5 rounded-2xl font-bold text-white pressable disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#E8735A,#F4A492)', border: 'none', cursor: 'pointer' }}
            id="cw-next">Next →</motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-in min-h-screen" style={{ background: '#FAF9F6' }}>
      <div className="sticky top-0 z-10 px-5 pt-14 pb-3"
        style={{ background: 'rgba(250,249,246,0.92)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black text-charcoal" style={{ letterSpacing: '-0.02em' }}>Easily Confused</h1>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => setPractice(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white pressable"
            style={{ background: 'linear-gradient(135deg,#E8735A,#F4A492)', border: 'none', cursor: 'pointer' }}
            id="cw-practice-btn">Practice</motion.button>
        </div>
        <div className="relative">
          <Search size={16} color="#9CA3AF" className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="search" placeholder="Search confusing pairs…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="search-bar" id="cw-search" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 pressable"
              style={{ background: 'none', border: 'none' }}>
              <X size={16} color="#9CA3AF" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-2">
        <span className="text-xs text-muted font-medium">{filtered.length} pairs</span>
      </div>

      <div className="px-4 pb-6 flex flex-col gap-3">
        {filtered.map((group) => (
          <div key={group.groupNumber} className="card overflow-hidden">
            <div className="px-4 py-2" style={{ background: '#FDF0EC', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-xs font-bold" style={{ color: '#C2513A' }}>Pair #{group.groupNumber}</p>
            </div>
            <div className="grid grid-cols-2">
              {group.words.map((w, i) => (
                <div key={i} className="p-4"
                  style={{ borderRight: i === 0 ? '1px solid #F0EDE8' : 'none' }}>
                  <p className="font-black text-charcoal text-base mb-1">{w.word}</p>
                  <p className="text-charcoal text-sm leading-relaxed">{w.meaning}</p>
                  {w.example && (
                    <p className="text-xs italic mt-2 leading-relaxed" style={{ color: '#E8735A' }}>"{w.example}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
