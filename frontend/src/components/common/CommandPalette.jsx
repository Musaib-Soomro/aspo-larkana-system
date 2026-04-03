import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, User, Building, FileText, Settings, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const MODULES = [
  { id: 'dashboard', icon: Command, path: '/dashboard', roles: [] },
  { id: 'staff', icon: User, path: '/staff', roles: ['admin', 'viewer'] },
  { id: 'offices', icon: Building, path: '/offices', roles: ['admin', 'viewer'] },
  { id: 'transfers', icon: ArrowRight, path: '/transfers', roles: ['admin', 'viewer'] },
  { id: 'leave', icon: FileText, path: '/leave', roles: ['admin', 'viewer'] },
  { id: 'revenue', icon: FileText, path: '/revenue', roles: [] },
  { id: 'complaints', icon: ShieldAlert, path: '/complaints', roles: ['admin', 'viewer'] },
  { id: 'auditLog', icon: ShieldAlert, path: '/audit-log', roles: ['admin'] },
  { id: 'settings', icon: Settings, path: '/settings', roles: ['admin'] },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const inputRef = useRef(null);

  const filteredModules = MODULES.filter(m => {
    const hasRole = m.roles.length === 0 || m.roles.includes(user?.role);
    const matchesQuery = t(m.id).toLowerCase().includes(query.toLowerCase());
    return hasRole && matchesQuery;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredModules.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredModules.length) % filteredModules.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredModules[selectedIndex]) {
        handleSelect(filteredModules[selectedIndex].path);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 sm:pt-40">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl bg-white dark:bg-dark-card rounded-2xl shadow-modal border border-border dark:border-dark-border overflow-hidden"
          >
            <div className="flex items-center px-4 py-3 border-b border-border dark:border-dark-border">
              <Search className="w-5 h-5 text-gray-400 dark:text-dark-muted mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={onKeyDown}
                placeholder={t('searchPlaceholder') || 'Search modules... (Ctrl+K)'}
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-dark-text placeholder-gray-400 text-sm"
              />
              <div className="flex items-center gap-1.5 ml-2">
                <kbd className="px-1.5 py-0.5 rounded border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-[10px] font-bold text-gray-400">ESC</kbd>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filteredModules.length > 0 ? (
                filteredModules.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.path)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      idx === selectedIndex 
                        ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                        : 'text-gray-600 dark:text-dark-muted hover:bg-surface dark:hover:bg-dark-surface'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${idx === selectedIndex ? 'text-primary' : 'text-gray-400 dark:text-dark-muted'}`} />
                    <span className="flex-1 text-left font-medium">{t(item.id)}</span>
                    {idx === selectedIndex && (
                      <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Enter</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-400 dark:text-dark-muted text-sm italic">{t('noResults') || 'No modules found.'}</p>
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border dark:border-dark-border bg-surface/50 dark:bg-dark-surface/50 flex justify-end">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                ASPO Larkana Navigator
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
