import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authMsg, setAuthMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthMsg('');
    
    let error;
    if (authMode === 'login') {
      const res = await supabase.auth.signInWithPassword({ email, password });
      error = res.error;
    } else {
      const res = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: name } }
      });
      error = res.error;
      
      // Auto-create profile if successful
      if (!error && res.data?.user) {
        await supabase.from('profiles').upsert({
          id: res.data.user.id,
          email: email,
          name: name
        });
      }
    }

    if (error) setAuthMsg(error.message);
    else if (authMode === 'signup') setAuthMsg('Signed up successfully!');
    setLoading(false);
  };

  return (
    <div className="page-in pb-safe-bottom" style={{ background: '#F2F2F0', minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '52px 20px 32px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: '0 0 16px' }}>
        Welcome
      </h1>
      
      <div className="card" style={{ padding: 20, marginBottom: 32 }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: '#111', margin: '0 0 4px' }}>
          {authMode === 'login' ? 'Log In' : 'Sign Up'}
        </p>
        <p style={{ fontSize: 13, color: '#ADADAD', margin: '0 0 16px', lineHeight: 1.5 }}>
          Sign in to automatically save your progress and streaks across all your devices.
        </p>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {authMode === 'signup' && (
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required
              style={{ width: '100%', padding: '12px 16px', borderRadius: '1rem', border: '1px solid #EAEAE8', background: '#F9F9F9', fontSize: 14 }} />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
            style={{ width: '100%', padding: '12px 16px', borderRadius: '1rem', border: '1px solid #EAEAE8', background: '#F9F9F9', fontSize: 14 }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '12px 16px', borderRadius: '1rem', border: '1px solid #EAEAE8', background: '#F9F9F9', fontSize: 14 }} />
          <motion.button whileTap={{ scale: 0.98 }} disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '1rem', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', background: '#111', color: '#fff', marginTop: 4 }}>
            {loading ? 'Loading...' : (authMode === 'login' ? 'Log In' : 'Sign Up')}
          </motion.button>
        </form>
        {authMsg && <p style={{ fontSize: 12, color: authMsg.includes('Check') || authMsg.includes('success') ? '#4CAF50' : '#E53935', marginTop: 12 }}>{authMsg}</p>}
        <p style={{ fontSize: 12, color: '#ADADAD', textAlign: 'center', marginTop: 16 }}>
          {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthMsg(''); }}
            style={{ background: 'none', border: 'none', color: '#111', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            {authMode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
