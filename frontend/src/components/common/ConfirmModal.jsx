import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = false }) {
  const { t } = useLanguage();
  
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-dark-card rounded-2xl shadow-modal border border-border dark:border-dark-border p-6 w-full max-w-sm"
          >
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-dark-text mb-2">
              {title || t('confirm')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-dark-muted mb-8 leading-relaxed">
              {message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="btn-outline"
              >
                {t('cancel')}
              </button>
              <button
                onClick={onConfirm}
                className={`btn-primary ${danger ? 'bg-danger hover:bg-red-700' : ''}`}
              >
                {t('confirm')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
