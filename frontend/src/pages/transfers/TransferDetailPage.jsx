import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useIsAdmin } from '../../context/AuthContext';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';

export default function TransferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { t } = useLanguage();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const [relievingDate, setRelievingDate] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  const [showExtension, setShowExtension] = useState(false);
  const [ext, setExt] = useState({
    transit_extension_requested: false,
    transit_extension_granted: false,
    transit_extension_days: '',
    transit_extension_authority: '',
    transit_extension_order_ref: '',
  });

  function fetchRecord() {
    api.get('/transfers/' + id)
      .then((res) => setRecord(res.data.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchRecord(); }, [id]);

  useEffect(() => {
    if (record) {
      setExt({
        transit_extension_requested: record.transit_extension_requested || false,
        transit_extension_granted: record.transit_extension_granted || false,
        transit_extension_days: record.transit_extension_days || '',
        transit_extension_authority: record.transit_extension_authority || '',
        transit_extension_order_ref: record.transit_extension_order_ref || '',
      });
    }
  }, [record]);

  async function doAction(body) {
    setActionError('');
    setSaving(true);
    try {
      await api.put('/transfers/' + id, body);
      setLoading(true);
      fetchRecord();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Action failed.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;
  if (!record) return <p className="text-center text-gray-400 py-12">Not found.</p>;

  const transitDays = record.transit_days != null ? parseInt(record.transit_days) : null;
  const maxDays = record.max_allowed_days || 7;
  const isOverdue = record.is_overdue;
  const nearLimit = !isOverdue && transitDays != null && transitDays >= maxDays - 2;

  let transitColor = 'text-gray-600';
  if (isOverdue) transitColor = 'text-danger font-semibold';
  else if (nearLimit) transitColor = 'text-alert font-semibold';
  else if (transitDays != null) transitColor = 'text-success';

  return (
    <div>
      <PageHeader title={t('transferRecord')} backTo="/transfers" />

      {/* Section 1 — Transfer Details */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-semibold text-gray-800">{t('transferOrder')}</h2>
          <StatusBadge status={record.status} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('staffMember')}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">
              <button onClick={() => navigate('/staff/' + record.staff_id)} className="text-primary hover:underline">
                {record.staff_name}
              </button>
              {' — '}{record.designation}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('directedBy')}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">{record.directed_by}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('refLetterNo')}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">{record.reference_letter_no}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('refLetterDate')}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">{(record.reference_letter_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('transferOrderDate')}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">{(record.transfer_order_date)}</p>
          </div>
          <div />
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('fromOffice')}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">{record.from_office_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('toOffice')}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">{record.to_office_name}</p>
          </div>
          {record.notes && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('notes')}</p>
              <p className="text-sm text-gray-800 font-medium mt-0.5">{record.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 2 — Transit Status */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-4">
        <h2 className="font-display text-base font-semibold text-gray-800 mb-3">{t('transitDays')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('relievingDate')}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">
              {record.relieving_date ? (record.relieving_date) : <span className="text-gray-400">—</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('joiningDate')}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">
              {record.joining_date ? (record.joining_date) : <span className="text-gray-400">—</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('transitDays')}</p>
            <p className={`text-sm font-medium mt-0.5 ${transitColor}`}>
              {transitDays != null ? `${transitDays} ${t('days')}` : '—'}
              {isOverdue && <span className="ml-2 text-xs">({t('transitOverdue')})</span>}
              {nearLimit && !isOverdue && <span className="ml-2 text-xs">({t('transitWarning')})</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('maxTransitDays')}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">
              {record.transit_extension_granted && record.transit_extension_days
                ? `7 + ${record.transit_extension_days} ${t('extensionGranted').toLowerCase()}`
                : `${maxDays} ${t('days')}`}
            </p>
          </div>
          {record.transit_extension_granted && (
            <>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('extensionAuthority')}</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{record.transit_extension_authority || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('extensionOrderRef')}</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{record.transit_extension_order_ref || '—'}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 3 — Action Buttons (admin only, status-conditional) */}
      {isAdmin && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-4">
          <h2 className="font-display text-base font-semibold text-gray-800 mb-4">{t('actions')}</h2>

          {actionError && <p className="text-sm text-danger mb-3">{actionError}</p>}

          {record.status === 'Ordered' && (
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('relievingDate')}</label>
                <input
                  type="date"
                  value={relievingDate}
                  onChange={(e) => setRelievingDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={() => relievingDate && doAction({ relieving_date: relievingDate })}
                disabled={!relievingDate || saving}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
              >
                {t('recordRelieving')}
              </button>
            </div>
          )}

          {record.status === 'Relieved' && (
            <>
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('joiningDate')}</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={() => joiningDate && doAction({ joining_date: joiningDate })}
                  disabled={!joiningDate || saving}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
                >
                  {t('recordJoining')}
                </button>
              </div>

              {/* Extension form */}
              <div className="mb-4 border border-gray-200 rounded-lg p-4">
                <button
                  type="button"
                  onClick={() => setShowExtension((v) => !v)}
                  className="text-sm text-primary font-medium hover:underline mb-1"
                >
                  {showExtension ? '▼' : '▶'} {t('requestExtension')}
                </button>
                {showExtension && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm col-span-2">
                      <input
                        type="checkbox"
                        checked={ext.transit_extension_requested}
                        onChange={(e) => setExt({ ...ext, transit_extension_requested: e.target.checked })}
                      />
                      Extension Requested
                    </label>
                    <label className="flex items-center gap-2 text-sm col-span-2">
                      <input
                        type="checkbox"
                        checked={ext.transit_extension_granted}
                        onChange={(e) => setExt({ ...ext, transit_extension_granted: e.target.checked })}
                      />
                      {t('extensionGranted')}
                    </label>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('extensionDays')}</label>
                      <input
                        type="number"
                        min="1"
                        value={ext.transit_extension_days}
                        onChange={(e) => setExt({ ...ext, transit_extension_days: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('extensionAuthority')}</label>
                      <input
                        type="text"
                        value={ext.transit_extension_authority}
                        onChange={(e) => setExt({ ...ext, transit_extension_authority: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">{t('extensionOrderRef')}</label>
                      <input
                        type="text"
                        value={ext.transit_extension_order_ref}
                        onChange={(e) => setExt({ ...ext, transit_extension_order_ref: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <button
                        onClick={() => doAction({
                          transit_extension_requested: ext.transit_extension_requested,
                          transit_extension_granted: ext.transit_extension_granted,
                          transit_extension_days: ext.transit_extension_days ? parseInt(ext.transit_extension_days) : null,
                          transit_extension_authority: ext.transit_extension_authority || null,
                          transit_extension_order_ref: ext.transit_extension_order_ref || null,
                        })}
                        disabled={saving}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-60"
                      >
                        {t('save')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {(record.status === 'Ordered' || record.status === 'Relieved') && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-sm text-danger hover:underline font-medium"
              >
                {t('cancelTransfer')}
              </button>
            </div>
          )}

          {(record.status === 'Completed' || record.status === 'Cancelled') && (
            <p className="text-sm text-gray-500">
              {record.status === 'Completed' ? t('transferCompleted') : t('transferCancelled')}
            </p>
          )}
        </div>
      )}

      <ConfirmModal
        open={showCancelConfirm}
        title={t('cancelTransfer')}
        message="This transfer will be cancelled. This action cannot be undone."
        danger
        onConfirm={() => { setShowCancelConfirm(false); doAction({ status: 'Cancelled' }); }}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
