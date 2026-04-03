import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export default function DataTable({
  columns,
  data,
  loading,
  pagination,
  onPageChange,
  emptyMessage,
}) {
  const { t } = useLanguage();
  if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;

  const effectiveEmptyMessage = emptyMessage || t('noData');

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border dark:border-dark-border shadow-card dark:shadow-none">
        <table className="min-w-full divide-y divide-border dark:divide-dark-border text-sm">
          <thead>
            <tr className="bg-surface dark:bg-dark-surface/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[10px] font-extrabold text-gray-500 dark:text-dark-muted uppercase tracking-[0.1em]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-card divide-y divide-border/60 dark:divide-dark-border/40">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-gray-400 dark:text-dark-muted font-medium text-sm">{effectiveEmptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-surface/70 dark:hover:bg-dark-surface/30 transition-colors duration-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700 dark:text-dark-text">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500 dark:text-dark-muted font-medium">
            {t('paginationInfo')
              .replace('{page}', pagination.page)
              .replace('{pages}', pagination.pages)
              .replace('{total}', pagination.total)}
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 text-xs font-semibold border border-border dark:border-dark-border rounded-lg text-gray-600 dark:text-dark-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {t('prevPage')}
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 text-xs font-semibold border border-border dark:border-dark-border rounded-lg text-gray-600 dark:text-dark-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {t('nextPage')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
