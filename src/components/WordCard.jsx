import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bookmark } from 'lucide-react';

export default function WordCard({ word: w, onToggleBookmark, isBookmarked }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      className="card overflow-hidden pressable"
      onClick={() => setOpen((o) => !o)}
      id={`wcard-${w.word}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between px-4 py-4">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-[#111111] text-base leading-tight">{w.word}</span>
            {w.isHighFrequency && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#EAEAE8', color: '#555555' }}>
                HF
              </span>
            )}
          </div>
          <p className="text-sm leading-snug line-clamp-2" style={{ color: '#7A7A7A' }}>
            {w.meaning}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(w.word); }}
            className="w-9 h-9 flex items-center justify-center rounded-full pressable"
            style={{ background: '#F4F4F2', border: 'none' }}
            id={`bm-${w.word}`}
            aria-label="Bookmark"
          >
            <Bookmark
              size={16}
              fill={isBookmarked ? '#222222' : 'none'}
              color={isBookmarked ? '#222222' : '#ADADAD'}
              strokeWidth={2}
            />
          </motion.button>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} color="#CCCCCC" strokeWidth={2} />
          </motion.div>
        </div>
      </div>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-4 pb-4 pt-0"
              style={{ borderTop: '1px solid #F0F0EE' }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[#111111] text-sm leading-relaxed mt-3">{w.meaning}</p>

              {w.usage && (
                <p className="text-sm italic mt-2 leading-relaxed" style={{ color: '#7A7A7A' }}>
                  "{w.usage}"
                </p>
              )}

              {w.synonyms?.length > 0 && (
                <div className="mt-3">
                  <p className="section-label mb-2">Synonyms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {w.synonyms.map((s, i) => (
                      <span key={i} className="chip chip-syn">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {w.antonyms?.length > 0 && (
                <div className="mt-3">
                  <p className="section-label mb-2">Antonyms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {w.antonyms.map((a, i) => (
                      <span key={i} className="chip chip-ant">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: '#EAEAE8', color: '#777777' }}>
                  WL {w.wordlistNumber}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
