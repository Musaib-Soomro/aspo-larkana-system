import React from 'react';

export default function LoadingSpinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
  return (
    <div className="relative">
      <div className={`${sz} border-[3px] border-primary/10 dark:border-primary/5 rounded-full`} />
      <div className={`${sz} border-[3px] border-transparent border-t-primary rounded-full animate-spin absolute inset-0`} />
    </div>
  );
}
