import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PageHeader({ title, action, onAction, backTo }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4 min-w-0">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-border dark:border-dark-border text-gray-500 dark:text-dark-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="min-w-0"
        >
          <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-dark-text truncate tracking-tight">
            {title}
          </h1>
          <div className="h-1 w-10 bg-primary rounded-full mt-1.5 opacity-80" />
        </motion.div>
      </div>
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="btn-primary shrink-0 ml-4 shadow-lg shadow-primary/20"
        >
          {action}
        </motion.button>
      )}
    </div>
  );
}
