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

  const handleNext = () => {
    const newScores = [...scores];
    if (index + 1 >= shuffled.length) { setDone(true); }
    else setIndex((i) => i + 1);
  };

  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  if (done) {
    return (
      <div className="page-in flex flex-col min-h-screen px-5" style={{ background: '#FAF9F6' }}>
        <div className="flex items-center pt-14 mb-8">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/groups')}
            className="w-10 h-10 rounded-full flex items-center justify-center pressable mr-4"
            style={{ background: '#FFFFFF', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} id="gp-back">
            <ArrowLeft size={18} color="#6B7280" />
          </motion.button>
          <h1 className="text-2xl font-black text-charcoal">Practice Complete!</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
            className="text-6xl mb-4">🏆</motion.div>
          <p className="text-muted mb-2">Average accuracy over {scores.length} groups</p>
          <p className="text-7xl font-black mb-8" style={{ color: '#E8735A' }}>{avg}%</p>
          <div className="grid grid-cols-5 gap-2 w-full mb-8">
            {scores.map((s, i) => (
              <div key={i} className="rounded-xl p-2 text-center"
                style={{ background: s >= 80 ? '#D1FAE5' : s >= 50 ? '#FEF3C7' : '#FEE2E2' }}>
                <p className="text-xs text-muted">{i + 1}</p>
                <p className="font-bold text-charcoal text-sm">{s}%</p>
              </div>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => { setIndex(0); setScores([]); setDone(false); }}
            className="w-full py-4 rounded-2xl font-bold text-white mb-3 pressable"
            style={{ background: 'linear-gradient(135deg,#E8735A,#F4A492)', border: 'none', cursor: 'pointer' }}
            id="gp-again">Practice Again</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/groups')}
            className="w-full py-3.5 rounded-2xl font-semibold pressable"
            style={{ background: '#FFFFFF', color: '#6B7280', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
            id="gp-browse">Browse Groups</motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-in flex flex-col min-h-screen px-5" style={{ background: '#FAF9F6' }}>
      {/* Header */}
      <div className="flex items-center justify-between pt-14 mb-4">
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/groups')}
          className="w-10 h-10 rounded-full flex items-center justify-center pressable"
          style={{ background: '#FFFFFF', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} id="gp-back-btn">
          <ArrowLeft size={18} color="#6B7280" />
        </motion.button>
        <div className="text-center">
          <p className="font-bold text-charcoal text-sm">Group Practice</p>
          <p className="text-muted text-xs">{index + 1} of {shuffled.length}</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="progress-track mb-6">
        <div className="progress-fill" style={{ width: `${(index / shuffled.length) * 100}%` }} />
      </div>

      <div className="flex-1 pb-32">
        <MatchingGame key={index} group={current} allWords={wordlists} onNext={handleNext} onEnd={() => setDone(true)} />
      </div>
    </div>
  );
}
