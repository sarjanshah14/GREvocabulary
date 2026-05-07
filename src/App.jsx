import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import SplashScreen from './components/SplashScreen';
import Home from './pages/Home';
import WordLibrary from './pages/WordLibrary';
import Flashcards from './pages/Flashcards';
import WordGroups from './pages/WordGroups';
import WordGroupPractice from './pages/WordGroupPractice';
import ConfusingWords from './pages/ConfusingWords';
import Profile from './pages/Profile';
import { supabase } from './utils/supabaseClient';

const HIDE_NAV = ['/flashcards', '/groups/practice', '/confusing/practice'];

export default function App() {
  const loc = useLocation();
  const hideNav = HIDE_NAV.some((p) => loc.pathname.startsWith(p));
  const [splashDone, setSplashDone] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Initialize dark mode from localStorage
    if (localStorage.getItem('gre_dark_mode') === 'true') {
      document.documentElement.classList.add('dark-mode');
      const metaTheme = document.getElementById('meta-theme-color');
      if (metaTheme) metaTheme.setAttribute('content', '#0D0D0F');
    } else {
      const metaTheme = document.getElementById('meta-theme-color');
      if (metaTheme) metaTheme.setAttribute('content', '#F2F2F0');
    }
  }, []);

  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {/* Splash — renders above everything, unmounts when done */}
      <AnimatePresence>
        {!splashDone && (
          <SplashScreen onDone={handleSplashDone} />
        )}
      </AnimatePresence>

      {/* Main app shell — rendered underneath, fades in as splash exits */}
      <motion.div
        className="app-shell"
        initial={{ opacity: 0 }}
        animate={{ opacity: splashDone ? 1 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="page-wrap">
          {!session ? (
            <Profile />
          ) : (
            <Routes>
              <Route path="/"               element={<Home />} />
              <Route path="/library"        element={<WordLibrary />} />
              <Route path="/flashcards"     element={<Flashcards />} />
              <Route path="/groups"         element={<WordGroups />} />
              <Route path="/groups/practice" element={<WordGroupPractice />} />
              <Route path="/confusing"      element={<ConfusingWords />} />
              <Route path="/profile"        element={<Profile />} />
            </Routes>
          )}
        </div>
        {(!hideNav && session) && <Navbar />}
      </motion.div>
    </>
  );
}
