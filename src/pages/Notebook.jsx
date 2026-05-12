/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Upload, Search, Shuffle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const TAB_BUTTON_STYLE = {
  flex: 1,
  borderRadius: 999,
  padding: '10px 8px',
  fontWeight: 700,
  fontSize: 13,
  border: '1px solid #D6D6D3',
  background: '#FFFFFF',
  color: '#7A7A7A',
  cursor: 'pointer',
};

function fisherYatesShuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function normalizeNotebookJson(json) {
  if (!Array.isArray(json)) {
    throw new Error('JSON must be an array like [{ "word": "...", "meaning": "...", "sentence": "..." }]');
  }

  return json
    .map((row) => {
      const word = String(row?.word || '').trim();
      if (!word) return null;

      let meaning = '';
      if (typeof row?.meaning === 'string' && row.meaning.trim()) {
        meaning = row.meaning.trim();
      } else if (typeof row?.sentence === 'string' && row.sentence.trim()) {
        meaning = row.sentence.trim();
      }

      if (!meaning) return null;
      return { word, meaning };
    })
    .filter(Boolean);
}

const NotebookPracticeCard = forwardRef(function NotebookPracticeCard({ card, onSwipe }, ref) {
  const [flipped, setFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-16, 0, 16]);
  const controls = useAnimation();
  const isAnimating = useRef(false);

  useEffect(() => {
    setFlipped(false);
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  }, [card?.id, controls]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: async (dir) => {
      if (!card || isAnimating.current) return;
      isAnimating.current = true;
      await controls.start({
        x: dir === 'right' ? 700 : -700,
        opacity: 0,
        rotate: dir === 'right' ? 22 : -22,
        transition: { duration: 0.25, ease: [0.32, 0, 0.67, 0] },
      });
      isAnimating.current = false;
      onSwipe();
    },
  }));

  const handleDragEnd = async (_, info) => {
    if (!card || isAnimating.current) return;
    const delta = info.offset.x;
    if (Math.abs(delta) > 80) {
      isAnimating.current = true;
      const dir = delta > 0 ? 'right' : 'left';
      await controls.start({
        x: dir === 'right' ? 700 : -700,
        opacity: 0,
        rotate: dir === 'right' ? 22 : -22,
        transition: { duration: 0.25, ease: [0.32, 0, 0.67, 0] },
      });
      isAnimating.current = false;
      onSwipe();
      return;
    }

    controls.start({
      x: 0,
      rotate: 0,
      transition: { type: 'spring', stiffness: 500, damping: 38 },
    });
  };

  if (!card) return null;

  return (
    <div className="relative w-full" style={{ touchAction: 'none' }}>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.55}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onClick={() => !isAnimating.current && setFlipped((f) => !f)}
        animate={controls}
        className="relative w-full"
        style={{ x, rotate, cursor: 'grab', willChange: 'transform', aspectRatio: '1/1' }}
        whileDrag={{ cursor: 'grabbing', scale: 1.01 }}
      >
        <div
          className="flip-inner w-full"
          style={{
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
            aspectRatio: '1/1',
            minHeight: 320,
          }}
        >
          <div
            className="flip-front card-lg w-full flex flex-col items-center justify-center text-center p-8"
            style={{ aspectRatio: '1/1', minHeight: 320, background: '#FFFFFF' }}
          >
            <h1
              className="font-black leading-none"
              style={{ fontSize: 'clamp(34px, 9vw, 46px)', letterSpacing: '-0.03em', color: '#111111' }}
            >
              {card.word}
            </h1>
            <p className="text-xs mt-8 font-medium" style={{ color: '#CCCCCC' }}>
              Tap to reveal · Swipe left or right
            </p>
          </div>

          <div
            className="flip-back card-lg w-full flex flex-col p-6 overflow-y-auto"
            style={{ aspectRatio: '1/1', minHeight: 320, background: '#FFFFFF' }}
          >
            <span className="section-label mb-2">Meaning</span>
            <p className="font-semibold text-base leading-relaxed" style={{ color: '#111111' }}>
              {card.meaning}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

function UploadTab({ userId }) {
  const [parsedWords, setParsedWords] = useState([]);
  const [fileName, setFileName] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successText, setSuccessText] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const inputRef = useRef(null);

  const refreshCount = useCallback(async () => {
    const { count } = await supabase
      .from('notebook_words')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    setTotalCount(count || 0);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    // refresh per signed-in user
    refreshCount();
  }, [userId, refreshCount]);

  const parseFile = async (file) => {
    try {
      setError('');
      setSuccessText('');
      const raw = await file.text();
      const json = JSON.parse(raw);
      const items = normalizeNotebookJson(json);
      if (!items.length) {
        setParsedWords([]);
        setError('No valid words found. Expected: [{ "word": "...", "meaning": "...", "sentence": "..." }].');
        return;
      }
      setParsedWords(items);
      setFileName(file.name);
    } catch (e) {
      setParsedWords([]);
      setError(`Invalid JSON: ${e.message}`);
    }
  };

  const parseFromTextInput = () => {
    try {
      setError('');
      setSuccessText('');
      const trimmed = jsonInput.trim();
      if (!trimmed) {
        setError('Paste JSON text first.');
        return;
      }
      const json = JSON.parse(trimmed);
      const items = normalizeNotebookJson(json);
      if (!items.length) {
        setParsedWords([]);
        setError('No valid words found. Expected: [{ "word": "...", "meaning": "...", "sentence": "..." }].');
        return;
      }
      setParsedWords(items);
      setFileName('Pasted JSON');
    } catch (e) {
      setParsedWords([]);
      setError(`Invalid JSON: ${e.message}`);
    }
  };

  const onFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await parseFile(file);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Please upload a .json file only.');
      return;
    }
    await parseFile(file);
  };

  const clearAll = (keepSuccess = false) => {
    setParsedWords([]);
    setFileName('');
    setJsonInput('');
    setError('');
    if (!keepSuccess) setSuccessText('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const uploadToNotebook = async () => {
    if (!parsedWords.length || !userId) return;

    setUploading(true);
    setError('');
    setSuccessText('');

    const payload = parsedWords.map((item) => ({
      user_id: userId,
      word: item.word,
      meaning: item.meaning,
    }));

    const { error: upsertError } = await supabase
      .from('notebook_words')
      .upsert(payload, { onConflict: 'user_id,word' });

    setUploading(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setSuccessText(`${parsedWords.length} words added to your notebook`);
    clearAll(true);
    await refreshCount();
  };

  return (
    <div style={{ padding: '8px 0 28px' }}>
      <input ref={inputRef} type="file" accept="application/json,.json" onChange={onFileInput} style={{ display: 'none' }} />

      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        style={{
          width: '100%',
          border: '2px dashed #D9D8D4',
          borderRadius: '1.5rem',
          background: '#fff',
          minHeight: 230,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 16,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Upload size={44} color="#BC6C4B" strokeWidth={2.2} style={{ margin: '0 auto 14px' }} />
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111' }}>Drop your JSON file here</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#ADADAD' }}>or tap to browse</p>
          {fileName && <p style={{ margin: '10px 0 0', fontSize: 12, color: '#7A7A7A' }}>{fileName}</p>}
        </div>
      </button>

      <p style={{ margin: '10px 4px 0', fontSize: 11, color: '#9A9A9A', lineHeight: 1.55 }}>
        JSON format: {'[{ "word": "...", "meaning": "...", "sentence": "..." }]'}.
      </p>

      <div className="card" style={{ padding: 12, marginTop: 12 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#8E8E8E' }}>
          Or paste JSON text
        </p>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='[{"word":"abate","meaning":"to reduce in intensity","sentence":"The storm abated by noon."}]'
          style={{
            width: '100%',
            minHeight: 104,
            borderRadius: 12,
            border: '1px solid #E1E1DE',
            padding: 10,
            fontSize: 12,
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: '#333',
            background: '#FCFCFB',
          }}
        />
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={parseFromTextInput}
          style={{
            marginTop: 10,
            width: '100%',
            border: 'none',
            borderRadius: 12,
            background: '#EAEAE8',
            color: '#333',
            height: 40,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Add
        </motion.button>
      </div>

      {error && <p style={{ margin: '10px 4px 0', color: '#D64242', fontSize: 13, fontWeight: 600 }}>{error}</p>}
      {successText && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} color="#2E8B57" />
          <p style={{ margin: 0, color: '#2E8B57', fontSize: 13, fontWeight: 700 }}>{successText}</p>
        </div>
      )}

      {parsedWords.length > 0 && (
        <div className="card" style={{ padding: 14, marginTop: 14 }}>
          <p style={{ margin: 0, fontWeight: 800, color: '#BC6C4B', fontSize: 15 }}>{parsedWords.length} words found</p>
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 7, maxHeight: 110, overflowY: 'auto' }}>
            {parsedWords.slice(0, 10).map((item) => (
              <span key={item.word} className="chip chip-neutral">{item.word}</span>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={uploadToNotebook}
            disabled={uploading}
            style={{
              marginTop: 14,
              width: '100%',
              border: 'none',
              borderRadius: '1rem',
              background: '#BC6C4B',
              color: '#fff',
              height: 48,
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              opacity: uploading ? 0.8 : 1,
            }}
          >
            {uploading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Uploading...
              </span>
            ) : 'Upload to My Notebook'}
          </motion.button>
          <button onClick={clearAll} style={{ marginTop: 8, border: 'none', background: 'none', color: '#9A9A9A', fontWeight: 600, cursor: 'pointer' }}>
            Clear
          </button>
        </div>
      )}

      <p style={{ margin: '18px 4px 0', fontSize: 12, color: '#8D8D8D' }}>
        Your notebook currently has {totalCount} words
      </p>
    </div>
  );
}

function PracticeTab({ setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const cardRef = useRef(null);

  const loadWords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notebook_words')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setWords([]);
      setLoading(false);
      return;
    }

    const shuffled = fisherYatesShuffle(data || []);
    setWords(shuffled);
    setIndex(0);
    setLoading(false);
  };

  useEffect(() => {
    loadWords();
  }, []);

  const current = words[index] || null;

  const nextCard = () => {
    if (!words.length) return;
    if (index >= words.length - 1) {
      const reshuffled = fisherYatesShuffle(words);
      setWords(reshuffled);
      setIndex(0);
      return;
    }
    setIndex((i) => i + 1);
  };

  const reshuffleNow = () => {
    if (!words.length) return;
    setWords((prev) => fisherYatesShuffle(prev));
    setIndex(0);
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 14 }}>
        <div className="card" style={{ height: 320, borderRadius: '2rem', background: '#ECECE9' }} />
        <div className="card" style={{ marginTop: 12, height: 44, borderRadius: '1rem', background: '#ECECE9' }} />
      </div>
    );
  }

  if (!words.length) {
    return (
      <div style={{ minHeight: '62vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: '#EAEAE8', margin: '0 auto 14px' }} />
          <p style={{ margin: 0, color: '#111', fontWeight: 800, fontSize: 20 }}>No words yet</p>
          <p style={{ margin: '4px 0 12px', color: '#ADADAD', fontSize: 13 }}>Upload a JSON file to get started</p>
          <button
            onClick={() => setActiveTab('upload')}
            style={{ border: 'none', background: '#BC6C4B', color: '#fff', borderRadius: 999, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '72vh' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 12 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: -16, height: '100%', borderRadius: '2rem', background: '#D8D8D6', transform: 'scale(0.88)', transformOrigin: 'bottom center', zIndex: 1 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: -8, height: '100%', borderRadius: '2rem', background: '#E8E8E6', transform: 'scale(0.94)', transformOrigin: 'bottom center', zIndex: 2 }} />
          <div style={{ position: 'relative', zIndex: 3 }}>
            <NotebookPracticeCard ref={cardRef} card={current} onSwipe={nextCard} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 6px' }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={reshuffleNow}
          style={{
            width: 62,
            height: 62,
            borderRadius: 999,
            border: 'none',
            background: '#fff',
            boxShadow: '0 8px 28px rgba(0,0,0,0.09), 0 2px 10px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Reshuffle"
        >
          <Shuffle size={24} color="#777" />
        </motion.button>
      </div>

      <p style={{ textAlign: 'center', margin: '8px 0 4px', fontSize: 11, color: '#ADADAD' }}>Infinite shuffle mode</p>
    </div>
  );
}

function groupByLetter(words) {
  return words.reduce((acc, item) => {
    const key = (item.word?.[0] || '#').toUpperCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function DictionaryTab() {
  const [allWords, setAllWords] = useState([]);
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState('A');
  const listRef = useRef(null);
  const groupRefs = useRef({});

  useEffect(() => {
    const fetchWords = async () => {
      const { data } = await supabase
        .from('notebook_words')
        .select('*')
        .order('word', { ascending: true });
      setAllWords(data || []);
    };
    fetchWords();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allWords;
    return allWords.filter((item) =>
      item.word.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q)
    );
  }, [allWords, search]);

  const grouped = useMemo(() => {
    const by = groupByLetter(filtered);
    return Object.keys(by)
      .sort()
      .map((letter) => ({
        letter,
        items: by[letter].sort((a, b) => a.word.localeCompare(b.word)),
      }));
  }, [filtered]);

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const jumpToLetter = (letter) => {
    const node = groupRefs.current[letter];
    if (!node || !listRef.current) return;
    setActiveLetter(letter);
    listRef.current.scrollTo({ top: node.offsetTop - 8, behavior: 'smooth' });
  };

  const onScroll = () => {
    if (!listRef.current) return;
    const top = listRef.current.scrollTop + 20;
    let latest = activeLetter;
    for (const section of grouped) {
      const node = groupRefs.current[section.letter];
      if (node && node.offsetTop <= top) latest = section.letter;
    }
    if (latest !== activeLetter) setActiveLetter(latest);
  };

  return (
    <div style={{ position: 'relative', paddingTop: 6 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F2F2F0', paddingBottom: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#B1B1B1" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="search-bar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your notebook"
          />
        </div>
        <p style={{ margin: '8px 2px 0', color: '#9A9A9A', fontSize: 12 }}>{filtered.length} words in your notebook</p>
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        style={{ maxHeight: '62vh', overflowY: 'auto', paddingRight: 22, paddingBottom: 20 }}
      >
        {!grouped.length ? (
          <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#ADADAD', fontWeight: 600 }}>No words match your search</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.letter} ref={(el) => { groupRefs.current[group.letter] = el; }} style={{ marginBottom: 12 }}>
              <p style={{ margin: '0 0 8px', color: '#BC6C4B', fontWeight: 800, fontSize: 14 }}>{group.letter}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.items.map((item) => (
                  <div key={item.id} className="card" style={{ padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontWeight: 800, color: '#111' }}>{item.word}</p>
                    <p style={{ margin: '4px 0 0', color: '#7A7A7A', fontSize: 13, lineHeight: 1.5 }}>{item.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          right: -4,
          top: 96,
          width: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {letters.map((letter) => (
          <button
            key={letter}
            onClick={() => jumpToLetter(letter)}
            style={{
              border: 'none',
              background: 'none',
              padding: 0,
              fontSize: 10,
              fontWeight: activeLetter === letter ? 800 : 600,
              color: activeLetter === letter ? '#BC6C4B' : '#ADADAD',
              cursor: 'pointer',
              lineHeight: 1.05,
            }}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Notebook() {
  const [activeTab, setActiveTab] = useState('upload');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  return (
    <div className="page-in" style={{ minHeight: '100dvh', background: '#F2F2F0', padding: '54px 20px 20px' }}>
      <h1 style={{ margin: 0, fontWeight: 900, fontSize: 30, letterSpacing: '-0.03em', color: '#111' }}>My Notebook</h1>
      <p style={{ margin: '6px 0 14px', color: '#9A9A9A', fontSize: 13 }}>Your personal word collection</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { key: 'upload', label: 'Upload' },
          { key: 'practice', label: 'Practice' },
          { key: 'dictionary', label: 'Dictionary' },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...TAB_BUTTON_STYLE,
                background: active ? '#BC6C4B' : '#fff',
                color: active ? '#fff' : '#8D8D8D',
                border: active ? '1px solid #BC6C4B' : '1px solid #D6D6D3',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'upload' && <UploadTab userId={userId} />}
      {activeTab === 'practice' && <PracticeTab setActiveTab={setActiveTab} />}
      {activeTab === 'dictionary' && <DictionaryTab />}
    </div>
  );
}
