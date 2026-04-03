import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';
import { useIsAdmin } from '../../context/AuthContext';

function InfoRow({ label, value }) {
  return (
    <div className="py-2 flex justify-between text-sm border-b border-gray-100 last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800 text-right max-w-xs">{value ?? '—'}</dd>
    </div>
  );
}

export default function LookAfterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdmin = useIsAdmin();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showEndForm, setShowEndForm] = useState(false);
  const [endForm, setEndForm] = useState({ end_date: '', end_reason: '' });
  const [endError, setEndError] = useState('');
  const [ending, setEnding] = useState(false);

  function load() {
    api.get(`/look-after/${id}`).then(r => setRecord(r.data.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function handleEnd(e) {
    e.preventDefault();
    setEndError('');
    setEnding(true);
    try {
      await api.patch(`/look-after/${id}/end`, endForm);
      setShowEndForm(false);
      load();
    } catch (err) {
      setEndError(err.response?.data?.error || 'Failed to end assignment.');
    } finally {
      setEnding(false);
    }
  }

  if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;
  if (!record) return <p className="text-center text-gray-400 py-12">{t('noData')}</p>;

  return (
    <div>
      <PageHeader title={t('lookAfterAssignment')} backTo="/look-after" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Assignment Details */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-gray-800">{t('lookAfterAssignment')}</h2>
            <StatusBadge status={record.is_active ? 'Active' : 'Ended'} />
          </div>
          <dl>
            <InfoRow label={t('staff')} value={`${record.staff_name} (${record.staff_designation})`} />
            <InfoRow label={t('homeOffice')} value={record.home_office_name} />
            <InfoRow label={t('coveringDesignation')} value={record.lookafter_designation} />
            <InfoRow label={t('atOffice')} value={record.lookafter_office_name} />
            <InfoRow label={t('assignedSince')} value={(record.start_date)} />
          </dl>
        </div>

        {/* DSPS Order + Reason */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5">
          <h2 className="font-display text-base font-semibold text-gray-800 mb-3">{t('dspsOrderNo')}</h2>
          <dl>
            <InfoRow label={t('dspsOrderNo')} value={record.dsps_order_no} />
            <InfoRow label={t('dspsOrderDate')} value={(record.dsps_order_date)} />
          </dl>
          <div className="mt-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{t('startReason')}</p>
            <p className="text-sm text-gray-800 bg-surface rounded-lg p-3">{record.start_reason}</p>
          </div>
        </div>

        {/* End Details — only if ended */}
        {!record.is_active && (
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 md:col-span-2">
            <h2 className="font-display text-base font-semibold text-gray-800 mb-3">{t('lookAfterEnded')}</h2>
            <dl className="mb-3">
              <InfoRow label={t('endDate')} value={(record.end_date)} />
            </dl>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{t('endReason')}</p>
            <p className="text-sm text-gray-800 bg-surface rounded-lg p-3">{record.end_reason}</p>
          </div>
        )}

        {/* End Assignment — active + admin */}
        {record.is_active && isAdmin && (
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 md:col-span-2">
            {!showEndForm ? (
              <button onClick={() => setShowEndForm(true)}
                className="text-sm font-medium text-danger border border-danger rounded-lg px-4 py-2 hover:bg-red-50 transition-colors">
                {t('endAssignment')}
              </button>
            ) : (
              <form onSubmit={handleEnd} className="space-y-4 max-w-md">
                <h2 className="font-display text-base font-semibold text-gray-800">{t('endAssignment')}</h2>
                {endError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">{endError}</div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('endDate')} *</label>
                  <input type="date" required value={endForm.end_date}
                    onChange={e => setEndForm({ ...endForm, end_date: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('endReason')} *</label>
                  <textarea required rows={3} value={endForm.end_reason}
                    onChange={e => setEndForm({ ...endForm, end_reason: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={ending}
                    className="bg-danger text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60">
                    {ending ? t('saving') : t('endAssignment')}
                  </button>
                  <button type="button" onClick={() => { setShowEndForm(false); setEndError(''); }}
                    className="border border-border text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-surface">
                    {t('cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
