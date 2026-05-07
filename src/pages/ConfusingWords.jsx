import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
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
    const pct = ((practiceIdx + 1) / filtered.length) * 100;
    return (
      <div className="page-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#F2F2F0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 16px' }}>
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => { setPractice(false); setRevealed(new Set()); }}
            style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: '#fff', color: '#777', border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', cursor: 'pointer' }}
            id="cw-exit">
            ← Exit
          </motion.button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
            {practiceIdx + 1} / {filtered.length}
          </span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ height: 4, background: '#E4E4E2', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#333', borderRadius: 999, width: `${pct}%`, transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ flex: 1, padding: '0 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p className="section-label" style={{ textAlign: 'center', marginBottom: 16 }}>
            Confusing Pair #{group.groupNumber}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {group.words.map((w, i) => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: '#111', marginBottom: 8 }}>{w.word}</p>
                <AnimatePresence>
                  {isRevealed(group.groupNumber, i) ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{w.meaning}</p>
                      {w.example && (
                        <p style={{ fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 8, lineHeight: 1.4 }}>"{w.example}"</p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.93 }}
                      onClick={() => reveal(group.groupNumber, i)}
                      style={{ width: '100%', padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: '#EAEAE8', color: '#777', border: 'none', cursor: 'pointer' }}
                      id={`reveal-${group.groupNumber}-${i}`}>
                      Tap to reveal
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '20px 20px 120px' }}>
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => { setPracticeIdx((i) => Math.max(0, i - 1)); setRevealed(new Set()); }}
            disabled={practiceIdx === 0}
            className="btn-secondary pressable"
            style={{ flex: 1, padding: '14px', borderRadius: '1.25rem', fontSize: 14, opacity: practiceIdx === 0 ? 0.4 : 1 }}
            id="cw-prev">← Prev</motion.button>
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => { setPracticeIdx((i) => Math.min(filtered.length - 1, i + 1)); setRevealed(new Set()); }}
            disabled={practiceIdx >= filtered.length - 1}
            className="btn-primary pressable"
            style={{ flex: 1, padding: '14px', borderRadius: '1.25rem', fontSize: 14, fontWeight: 700, opacity: practiceIdx >= filtered.length - 1 ? 0.4 : 1 }}
            id="cw-next">Next →</motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-in" style={{ minHeight: '100dvh', background: '#F2F2F0' }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '52px 20px 12px', background: 'rgba(242,242,240,0.95)', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111', letterSpacing: '-0.02em', margin: 0 }}>Easily Confused</h1>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => setPractice(true)}
            className="btn-primary pressable"
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, borderRadius: 999 }}
            id="cw-practice-btn">
            Practice
          </motion.button>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} color="#ADADAD" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="search" placeholder="Search confusing pairs…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="search-bar" id="cw-search" />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={15} color="#ADADAD" />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '8px 20px 4px' }}>
        <span style={{ fontSize: 12, color: '#ADADAD', fontWeight: 600 }}>{filtered.length} pairs</span>
      </div>

      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((group) => (
          <div key={group.groupNumber} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '8px 16px', background: '#EAEAE8', borderBottom: '1px solid #E0E0DE' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', margin: 0 }}>Pair #{group.groupNumber}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {group.words.map((w, i) => (
                <div key={i} style={{ padding: 14, borderRight: i === 0 ? '1px solid #EAEAE8' : 'none' }}>
                  <p style={{ fontWeight: 900, color: '#111', fontSize: 15, margin: '0 0 4px' }}>{w.word}</p>
                  <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5, margin: 0 }}>{w.meaning}</p>
                  {w.example && (
                    <p style={{ fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 6, lineHeight: 1.4 }}>"{w.example}"</p>
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
