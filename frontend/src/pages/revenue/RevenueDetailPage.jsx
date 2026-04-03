import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { MONTHS,  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';

export default function RevenueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api.get(`/revenue/${id}`)
      .then((res) => setEntry(res.data.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function handleSubmit(is_draft) {
    setSubmitting(true);
    try {
      await api.put(`/revenue/${id}`, { is_draft, submitted_date: is_draft ? null : new Date().toISOString().split('T')[0] });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner /></div>;
  if (!entry) return <div className="text-center py-10 text-gray-500">{t('revenueEntryNotFound')}</div>;

  const amountRows = entry.data?.filter((r) => r.unit === 'amount') || [];
  const countRows = entry.data?.filter((r) => r.unit === 'count') || [];
  const totalAmount = amountRows.reduce((sum, r) => sum + parseFloat(r.value || 0), 0);

  return (
    <div>
      <PageHeader
        title={`${entry.office_name} — ${MONTHS[entry.month]} ${entry.year}`}
        backTo="/revenue"
        action={t('edit')}
        onAction={() => navigate(`/revenue/${id}/edit`)}
      />

      {/* Header info */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">{t('office')}</p>
            <p className="font-medium">{entry.office_name}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">{t('period')}</p>
            <p className="font-medium">{MONTHS[entry.month]} {entry.year}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">{t('status')}</p>
            <StatusBadge status={entry.is_draft ? 'Draft' : 'Submitted'} />
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">{t('submittedBy')}</p>
            <p className="font-medium">{entry.submitted_by || '—'}</p>
          </div>
          {entry.submitted_date && (
            <div>
              <p className="text-gray-500 text-xs mb-1">{t('submittedDate')}</p>
              <p className="font-medium">{(entry.submitted_date)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500 text-xs mb-1">{t('totalRevenue')}</p>
            <p className="font-bold text-primary text-base">
              PKR {totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Amount rows */}
        {amountRows.length > 0 && (
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
            <h3 className="text-sm font-semibold text-primary mb-3">{t('revenuePKR')}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-1.5 text-xs text-gray-500 font-medium">{t('category')}</th>
                  <th className="text-left py-1.5 text-xs text-gray-500 font-medium">{t('subCategory')}</th>
                  <th className="text-right py-1.5 text-xs text-gray-500 font-medium">{t('amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {amountRows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 text-gray-700">{r.category}</td>
                    <td className="py-1.5 text-gray-500 text-xs">{r.sub_category}</td>
                    <td className="py-1.5 text-right font-medium">
                      {parseFloat(r.value).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={2} className="py-2 text-xs font-semibold text-gray-600">{t('total')}</td>
                  <td className="py-2 text-right font-bold text-primary">
                    {totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Count rows */}
        {countRows.length > 0 && (
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
            <h3 className="text-sm font-semibold text-primary mb-3">{t('articlesCount')}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-1.5 text-xs text-gray-500 font-medium">{t('category')}</th>
                  <th className="text-left py-1.5 text-xs text-gray-500 font-medium">{t('subCategory')}</th>
                  <th className="text-right py-1.5 text-xs text-gray-500 font-medium">{t('count')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {countRows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 text-gray-700">{r.category}</td>
                    <td className="py-1.5 text-gray-500 text-xs">{r.sub_category}</td>
                    <td className="py-1.5 text-right font-medium">{parseInt(r.value).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {entry.is_draft ? (
          <button onClick={() => handleSubmit(false)} disabled={submitting}
            className="bg-success text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60">
            {submitting ? t('submitting') : t('markAsSubmitted')}
          </button>
        ) : (
          <button onClick={() => handleSubmit(true)} disabled={submitting}
            className="border border-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-60">
            {submitting ? '...' : t('revertToDraft')}
          </button>
        )}
        <button onClick={() => navigate(`/revenue/${id}/edit`)}
          className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
          {t('editData')}
        </button>
      </div>
    </div>
  );
}
