import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BookOpen, Layers, Grid3x3, User } from 'lucide-react';

const TABS = [
  { id: 'home',     path: '/',           label: 'Home',    Icon: Home },
  { id: 'library',  path: '/library',    label: 'Library', Icon: BookOpen },
  { id: 'practice', path: '/flashcards', label: 'Cards',   Icon: Layers },
  { id: 'groups',   path: '/groups',     label: 'Groups',  Icon: Grid3x3 },
  { id: 'profile',  path: '/profile',    label: 'Profile', Icon: User },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className="bottom-dock">
      {TABS.map(({ id, path, label, Icon }) => {
        const active = isActive(path);
        return (
          <motion.button
            key={id}
            onClick={() => navigate(path)}
            whileTap={{ scale: 0.82 }}
            className="flex flex-col items-center justify-center gap-1 w-14 h-full pressable"
            style={{ background: 'none', border: 'none' }}
            id={`nav-${id}`}
            aria-label={label}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.4 : 1.7}
              color={active ? '#111111' : '#C0C0C0'}
            />
            <span
              className="text-[10px] font-semibold leading-none"
              style={{ color: active ? '#111111' : '#C0C0C0' }}
            >
              {label}
            </span>
            {active && (
              <motion.div
                layoutId="nav-dot"
                className="w-1 h-1 rounded-full"
                style={{ background: '#111111', marginTop: -2 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
