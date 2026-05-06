import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import WordLibrary from './pages/WordLibrary';
import Flashcards from './pages/Flashcards';
import WordGroups from './pages/WordGroups';
import WordGroupPractice from './pages/WordGroupPractice';
import ConfusingWords from './pages/ConfusingWords';
import Dashboard from './pages/Dashboard';

const HIDE_NAV = ['/flashcards', '/groups/practice', '/confusing/practice'];

export default function App() {
  const loc = useLocation();
  const hideNav = HIDE_NAV.some((p) => loc.pathname.startsWith(p));

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/library"        element={<WordLibrary />} />
          <Route path="/flashcards"     element={<Flashcards />} />
          <Route path="/groups"         element={<WordGroups />} />
          <Route path="/groups/practice" element={<WordGroupPractice />} />
          <Route path="/confusing"      element={<ConfusingWords />} />
          <Route path="/dashboard"      element={<Dashboard />} />
        </Routes>
      </div>
      {!hideNav && <Navbar />}
    </div>
  );
}
