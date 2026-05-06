import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import data from '../../data.json';
import WordCard from '../components/WordCard';
import { toggleBookmark, getBookmarks } from '../utils/storage';

const { wordlists } = data;
const LIST_NUMS = [...new Set(wordlists.map((w) => w.wordlistNumber))].sort((a, b) => a - b);

export default function WordLibrary() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [bookmarks, setBookmarks] = useState(() => getBookmarks());

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'hf', label: '⭐ High Freq' },
    { id: 'bookmarked', label: '🔖 Saved' },
    ...LIST_NUMS.map((n) => ({ id: `wl_${n}`, label: `WL ${n}` })),
  ];

  const filtered = useMemo(() => {
    let list = wordlists;
    if (filter === 'hf') list = list.filter((w) => w.isHighFrequency);
    else if (filter === 'bookmarked') list = list.filter((w) => bookmarks.includes(w.word));
    else if (filter.startsWith('wl_')) list = list.filter((w) => w.wordlistNumber === parseInt(filter.slice(3)));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        (w.synonyms || []).some((s) => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, filter, bookmarks]);

  const handleBookmark = useCallback((word) => {
    const updated = toggleBookmark(word);
    setBookmarks([...updated]);
  }, []);

  return (
    <div className="page-in min-h-screen" style={{ background: '#FAF9F6' }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-5 pt-14 pb-3"
        style={{ background: 'rgba(250,249,246,0.92)', backdropFilter: 'blur(16px)' }}
      >
        <h1 className="text-2xl font-black text-charcoal mb-3" style={{ letterSpacing: '-0.02em' }}>
          Word Library
        </h1>
        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} color="#9CA3AF" className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="Search words, meanings, synonyms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
            id="lib-search"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 pressable"
              style={{ background: 'none', border: 'none' }}
            >
              <X size={16} color="#9CA3AF" />
            </button>
          )}
        </div>
        {/* Filter chips */}
        <div className="scroll-row flex gap-2 pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`filter-chip ${filter === f.id ? 'active' : 'inactive'}`}
              id={`lib-filter-${f.id}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-5 py-2">
        <span className="text-xs text-muted font-medium">{filtered.length} words</span>
      </div>

      {/* List */}
      <div className="px-4 pb-6 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="text-5xl">{filter === 'bookmarked' ? '🔖' : '🔍'}</div>
            <p className="font-bold text-charcoal text-lg">
              {filter === 'bookmarked' ? 'No bookmarks yet' : 'No results found'}
            </p>
            <p className="text-muted text-sm leading-relaxed">
              {filter === 'bookmarked'
                ? 'Start studying and bookmark words you want to revisit.'
                : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          filtered.map((w) => (
            <WordCard
              key={w.word}
              word={w}
              onToggleBookmark={handleBookmark}
              isBookmarked={bookmarks.includes(w.word)}
            />
          ))
        )}
      </div>
    </div>
  );
}
