import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import data from '../../data.json';
import MatchingGame from '../components/MatchingGame';

const { wordgroups, wordlists } = data;

export default function WordGroupPractice() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [done, setDone] = useState(false);
  const [shuffled] = useState(() => [...wordgroups].sort(() => Math.random() - 0.5));
  const current = shuffled[index];

  const handleNext = (accuracy) => {
    const updated = [...scores, accuracy ?? 0];
    setScores(updated);
    if (index + 1 >= shuffled.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const avg = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  if (done) {
    return (
      <div className="page-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', padding: '0 20px', background: '#F2F2F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 52, marginBottom: 32 }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/groups')}
            style={{ width: 40, height: 40, borderRadius: 999, background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', marginRight: 16 }}
            id="gp-back">
            <ArrowLeft size={18} color="#777" />
          </motion.button>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: 0 }}>Practice Complete!</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{ fontSize: 60, marginBottom: 16 }}>
            🏆
          </motion.div>
          <p style={{ fontSize: 13, color: '#ADADAD', margin: '0 0 4px' }}>
            Average accuracy over {scores.length} groups
          </p>
          <p style={{ fontSize: 80, fontWeight: 900, color: '#111', lineHeight: 1, margin: '0 0 32px' }}>
            {avg}%
          </p>

          {/* Score grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, width: '100%', marginBottom: 32 }}>
            {scores.map((s, i) => (
              <div key={i} style={{
                borderRadius: 12, padding: '8px 4px', textAlign: 'center',
                background: s >= 80 ? '#333' : s >= 50 ? '#888' : '#CCCCCC',
              }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0 }}>#{i + 1}</p>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: 13, margin: 0 }}>{s}%</p>
              </div>
            ))}
          </div>

          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => { setIndex(0); setScores([]); setDone(false); }}
            className="btn-primary pressable w-full"
            style={{ marginBottom: 10, padding: '16px', borderRadius: '1.25rem', fontSize: 15, fontWeight: 700 }}
            id="gp-again">
            Practice Again
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/groups')}
            className="btn-secondary pressable w-full"
            style={{ padding: '14px', borderRadius: '1.25rem', fontSize: 14, fontWeight: 600 }}
            id="gp-browse">
            Browse Groups
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', padding: '0 20px', background: '#F2F2F0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, marginBottom: 12 }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/groups')}
          style={{ width: 40, height: 40, borderRadius: 999, background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' }}
          id="gp-back-btn">
          <ArrowLeft size={18} color="#777" />
        </motion.button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>Group Practice</p>
          <p style={{ fontSize: 12, color: '#ADADAD', margin: '2px 0 0' }}>{index + 1} of {shuffled.length}</p>
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ height: 4, background: '#E4E4E2', borderRadius: 999, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: '100%', background: '#333', borderRadius: 999, width: `${(index / shuffled.length) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ flex: 1, paddingBottom: 120 }}>
        <MatchingGame
          key={index}
          group={current}
          allWords={wordlists}
          onNext={handleNext}
          onEnd={() => setDone(true)}
        />
      </div>
    </div>
  );
}
