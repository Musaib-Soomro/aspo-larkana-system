import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import api from '../../utils/api';
import { useIsAdmin } from '../../context/AuthContext';
import { TRANSFER_STATUSES } from '../../utils/constants';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';

export default function TransferListPage() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { t } = useLanguage();
  const [transfers, setTransfers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [confirmId, setConfirmId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { page: filters.page };
    if (filters.status) params.status = filters.status;
    api.get('/transfers', { params })
      .then((res) => { setTransfers(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }, [filters]);

  async function handleDelete() {
    setDeleteError('');
    try {
      await api.delete('/transfers/' + confirmId);
      setTransfers((prev) => prev.filter((tr) => tr.id !== confirmId));
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete.');
    } finally {
      setConfirmId(null);
    }
  }

  const filtered = filters.search
    ? transfers.filter((tr) =>
        tr.staff_name?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : transfers;

  const columns = [
    { key: 'staff_name', label: t('staffMember') },
    { key: 'designation', label: t('designation') },
    {
      key: 'offices', label: t('fromOffice') + ' → ' + t('toOffice'),
      render: (r) => <span>{r.from_office_name} <span className="text-gray-400">→</span> {r.to_office_name}</span>,
    },
    { key: 'reference_letter_no', label: t('refLetterNo') },
    { key: 'transfer_order_date', label: t('transferOrderDate'), render: (r) => (r.transfer_order_date) },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'transit_days', label: t('transitDays'),
      render: (r) => r.transit_days != null ? `${r.transit_days} ${t('days')}` : <span className="text-gray-300">—</span>,
    },
    {
      key: 'actions', label: t('actions'),
      render: (r) => (
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/transfers/' + r.id)} className="text-primary text-xs hover:underline">
            {t('view')} →
          </button>
          {isAdmin && r.status !== 'Completed' && (
            <button
              onClick={() => setConfirmId(r.id)}
              className="text-xs text-danger hover:underline"
            >
              {t('delete')}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('transfers')}
        action={isAdmin ? t('newTransfer') : undefined}
        onAction={isAdmin ? () => navigate('/transfers/new') : undefined}
      />
      {deleteError && <p className="text-sm text-danger mb-3">{deleteError}</p>}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          placeholder={t('staffMember') + '...'}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">{t('allStatuses')}</option>
          {TRANSFER_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
        emptyMessage={t('noTransfers')}
      />
      <ConfirmModal
        open={confirmId !== null}
        title={t('delete') + ' Transfer'}
        message="This will permanently delete the transfer record. This cannot be undone."
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
