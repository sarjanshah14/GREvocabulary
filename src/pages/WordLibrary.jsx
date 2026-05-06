import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import data from '../../data.json';
import WordCard from '../components/WordCard';
import { toggleBookmark, getBookmarks } from '../utils/storage';

const { wordlists } = data;

export default function WordLibrary() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [bookmarks, setBookmarks] = useState(() => getBookmarks());

  // Only 3 filters — no wordlist numbers
  const filters = [
    { id: 'all',       label: 'All Words' },
    { id: 'hf',        label: '★ High Freq' },
    { id: 'bookmarked',label: '🔖 Saved' },
  ];

  const filtered = useMemo(() => {
    let list = wordlists;
    if (filter === 'hf')        list = list.filter((w) => w.isHighFrequency);
    else if (filter === 'bookmarked') list = list.filter((w) => bookmarks.includes(w.word));

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
    <div className="page-in min-h-screen" style={{ background: '#F2F2F0' }}>

      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-5 pt-14 pb-3"
        style={{ background: 'rgba(242,242,240,0.95)', backdropFilter: 'blur(16px)' }}
      >
        <h1 className="text-2xl font-black mb-3" style={{ letterSpacing: '-0.02em', color: '#111111' }}>
          Word Library
        </h1>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} color="#ADADAD" className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="Search words, meanings, synonyms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
            id="lib-search"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 pressable"
              style={{ background: 'none', border: 'none' }}>
              <X size={16} color="#ADADAD" />
            </button>
          )}
        </div>

        {/* 3 filter chips only */}
        <div className="flex gap-2">
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
        <span className="text-xs font-medium" style={{ color: '#ADADAD' }}>{filtered.length} words</span>
      </div>

      {/* Word list */}
      <div className="px-4 pb-6 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="text-5xl">{filter === 'bookmarked' ? '🔖' : '🔍'}</div>
            <p className="font-bold text-lg" style={{ color: '#111111' }}>
              {filter === 'bookmarked' ? 'No bookmarks yet' : 'No results found'}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#ADADAD' }}>
              {filter === 'bookmarked'
                ? 'Bookmark words during study to revisit them here.'
                : 'Try a different search term.'}
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
