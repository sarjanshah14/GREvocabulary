import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authMsg, setAuthMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <div 
      className="page-in pb-safe-bottom" 
      style={{ 
        background: 'linear-gradient(135deg, #F9F9F9 0%, #E4E4E2 100%)', 
        minHeight: '100dvh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px' 
      }}
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <h1 style={{ fontSize: 42, fontWeight: 900, color: '#111', letterSpacing: '-0.04em', margin: '0' }}>
          GRE Lexicon
        </h1>
      </motion.div>
      
      <motion.div 
        className="card" 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ 
          width: '100%', 
          maxWidth: 360, 
          padding: 28, 
          background: '#fff', 
          borderRadius: 24, 
          boxShadow: '0 20px 40px rgba(0,0,0,0.04)' 
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20, color: '#111', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {authMode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize: 13, color: '#ADADAD', margin: 0, lineHeight: 1.5 }}>
            Sign in to instantly sync your progress across all devices.
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {authMode === 'signup' && (
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required
              style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #EAEAE8', background: '#FBFBFB', fontSize: 15, outline: 'none', transition: 'border-color 0.2s' }} 
              onFocus={(e) => e.target.style.borderColor = '#111'}
              onBlur={(e) => e.target.style.borderColor = '#EAEAE8'}
            />
          )}
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required
            style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #EAEAE8', background: '#FBFBFB', fontSize: 15, outline: 'none', transition: 'border-color 0.2s' }} 
            onFocus={(e) => e.target.style.borderColor = '#111'}
            onBlur={(e) => e.target.style.borderColor = '#EAEAE8'}
          />
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              style={{ width: '100%', padding: '14px 44px 14px 18px', borderRadius: '14px', border: '1px solid #EAEAE8', background: '#FBFBFB', fontSize: 15, outline: 'none', transition: 'border-color 0.2s' }} 
              onFocus={(e) => e.target.style.borderColor = '#111'}
              onBlur={(e) => e.target.style.borderColor = '#EAEAE8'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {showPassword ? <EyeOff size={18} color="#ADADAD" /> : <Eye size={18} color="#ADADAD" />}
            </button>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.96 }} 
            disabled={loading}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '14px', fontWeight: 800, fontSize: 15, 
              border: 'none', cursor: 'pointer', background: '#111', color: '#fff', 
              marginTop: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? 'Loading...' : (authMode === 'login' ? 'Log In' : 'Sign Up')}
          </motion.button>
        </form>
        
        {authMsg && (
          <p style={{ 
            fontSize: 13, fontWeight: 600, marginTop: 16, textAlign: 'center',
            color: authMsg.includes('Check') || authMsg.includes('success') ? '#4CAF50' : '#E53935' 
          }}>
            {authMsg}
          </p>
        )}
        
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthMsg(''); }}
              style={{ background: 'none', border: 'none', color: '#111', fontWeight: 800, cursor: 'pointer', padding: 0 }}
            >
              {authMode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
