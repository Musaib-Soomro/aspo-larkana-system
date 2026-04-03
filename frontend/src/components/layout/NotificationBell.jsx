import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
  const { badges } = useNotifications();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const total = Object.values(badges).reduce((a, b) => a + b, 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all focus:outline-none relative"
      >
        <Bell className="w-4 h-4" />
        {total > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white/20 shadow-sm animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-2xl shadow-modal border border-border dark:border-dark-border py-2 z-50"
            >
              <div className="px-4 py-2 border-b border-border dark:border-dark-border mb-1">
                <p className="text-[10px] font-extrabold text-gray-400 dark:text-dark-muted uppercase tracking-widest">
                  {t('notifications') || 'Notifications'}
                </p>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {badges.complaints > 0 && (
                  <div className="px-4 py-3 hover:bg-surface dark:hover:bg-dark-surface transition-colors cursor-pointer">
                    <p className="text-xs font-bold text-gray-900 dark:text-dark-text">
                      {badges.complaints} {t('activeComplaints')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t('actionRequired') || 'Requires immediate attention'}</p>
                  </div>
                )}
                {badges.inspections > 0 && (
                  <div className="px-4 py-3 hover:bg-surface dark:hover:bg-dark-surface transition-colors cursor-pointer border-t border-border/50 dark:border-dark-border/50">
                    <p className="text-xs font-bold text-gray-900 dark:text-dark-text">
                      {badges.inspections} {t('inspectionsDue')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t('scheduledTasks') || 'Check inspection programme'}</p>
                  </div>
                )}
                {total === 0 && (
                  <div className="px-4 py-8 text-center text-gray-400 italic">
                    <p className="text-xs">{t('noNotifications') || 'No new alerts'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
