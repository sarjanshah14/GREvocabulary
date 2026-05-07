import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X } from 'lucide-react';
import data from '../../data.json';

const { wordgroups, wordlists } = data;
const wordMap = {};
wordlists.forEach((w) => { wordMap[w.word.toLowerCase()] = w; });

function WordDetail({ word, onClose }) {
  const d = wordMap[word?.toLowerCase()];
  return (
    <AnimatePresence>
      <motion.div className="sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="sheet-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }} onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-warmgrey" />
          <h2 className="text-2xl font-black text-charcoal mb-1">{word}</h2>
          {d ? (
            <>
              <p className="text-charcoal text-sm leading-relaxed mb-3">{d.meaning}</p>
              {d.usage && <p className="text-sm italic mb-4" style={{ color: '#E8735A' }}>"{d.usage}"</p>}
              {d.synonyms?.length > 0 && (
                <div className="mb-3">
                  <p className="section-label mb-2">Synonyms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.synonyms.map((s, i) => <span key={i} className="chip chip-green">{s}</span>)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted text-sm">No definition found in wordlists.</p>
          )}
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
            style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: '1.25rem', fontWeight: 600, fontSize: 14, background: '#EAEAE8', color: '#555', border: 'none', cursor: 'pointer' }}
            id="word-detail-close">
            Close
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function WordGroups() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(new Set());
  // Word chips are display-only — no detail sheet needed

  const filtered = useMemo(() => {
    if (!search.trim()) return wordgroups;
    const q = search.toLowerCase();
    return wordgroups.filter((g) =>
      g.phrase.toLowerCase().includes(q) || g.words.some((w) => w.toLowerCase().includes(q))
    );
  }, [search]);

  const toggle = (phrase) => {
    setExpanded((p) => { const n = new Set(p); n.has(phrase) ? n.delete(phrase) : n.add(phrase); return n; });
  };

  return (
    <div className="page-in min-h-screen" style={{ background: '#FAF9F6' }}>
      {selectedWord && <WordDetail word={selectedWord} onClose={() => setSelectedWord(null)} />}

      {/* Header */}
      <div className="sticky top-0 z-10 px-5 pt-14 pb-3"
        style={{ background: 'rgba(250,249,246,0.92)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black text-charcoal" style={{ letterSpacing: '-0.02em' }}>Word Groups</h1>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => navigate('/groups/practice')}
            className="btn-primary pressable"
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, borderRadius: 999, border: 'none', cursor: 'pointer' }}
            id="groups-practice-btn">
            Practice →
          </motion.button>
        </div>
        <div className="relative">
          <Search size={16} color="#9CA3AF" className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search" placeholder="Search themes or words…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="search-bar" id="groups-search" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 pressable" style={{ background: 'none', border: 'none' }}>
              <X size={16} color="#9CA3AF" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-2">
        <span className="text-xs text-muted font-medium">{filtered.length} groups</span>
      </div>

      <div className="px-4 pb-6 flex flex-col gap-2.5">
        {filtered.map((group) => {
          const open = expanded.has(group.phrase);
          return (
            <motion.div key={group.phrase} layout className="card overflow-hidden">
              <button className="w-full flex items-center justify-between px-4 py-4 text-left pressable"
                onClick={() => toggle(group.phrase)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                id={`group-${group.phrase}`}>
                <div>
                  <p className="section-label mb-1">Theme</p>
                  <p className="font-black text-charcoal text-base leading-tight">{group.phrase}</p>
                  <p className="text-muted text-xs mt-1">{group.words.length} words</p>
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={18} color="#C4B7A6" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                    <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid #F0EDE8' }}>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {group.words.map((w, i) => (
                          <span key={i}
                            className="chip chip-lavender"
                            style={{ userSelect: 'none' }}
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                      {group.antonyms?.length > 0 && (
                        <div className="mt-3">
                          <p className="section-label mb-2">Antonyms</p>
                          <div className="flex flex-wrap gap-2">
                            {group.antonyms.map((w, i) => (
                              <span key={i}
                                className="chip chip-ant"
                                style={{ userSelect: 'none' }}
                              >
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
