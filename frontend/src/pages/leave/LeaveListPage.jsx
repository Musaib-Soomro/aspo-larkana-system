import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../utils/api';
import { useIsAdmin } from '../../context/AuthContext';
import { LEAVE_STATUSES } from '../../utils/constants';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';

export default function LeaveListPage() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { t } = useLanguage();
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [filters, setFilters] = useState({ leave_type: '', status: '', year: now.getFullYear(), page: 1 });

  useEffect(() => {
    api.get('/leave/types').then((res) => setLeaveTypes(res.data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page: filters.page };
    if (filters.leave_type) params.leave_type = filters.leave_type;
    if (filters.status) params.status = filters.status;
    if (filters.year) params.year = filters.year;
    api.get('/leave', { params })
      .then((res) => { setLeaves(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }, [filters]);

  async function handleStatus(id, status) {
    try {
      await api.put(`/leave/${id}`, { status });
      setFilters((f) => ({ ...f }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  }

  const columns = [
    { key: 'staff_name', label: t('staffMember') },
    { key: 'designation', label: t('designation') },
    { key: 'office_name', label: t('office') },
    { key: 'leave_type', label: t('leaveType') },
    { key: 'start_date', label: t('from'), render: (r) => (r.start_date) },
    { key: 'end_date', label: t('to'), render: (r) => (r.end_date) },
    { key: 'total_days', label: t('days') },
    { key: 'substitute_name', label: t('substitute'), render: (r) => r.substitute_name || <span className="text-gray-300">—</span> },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: t('actions'),
      render: (r) => (isAdmin && r.status === 'Active') ? (
        <div className="flex gap-3">
          <button onClick={() => handleStatus(r.id, 'Completed')} className="text-xs text-success hover:underline font-medium">{t('complete')}</button>
          <button onClick={() => handleStatus(r.id, 'Cancelled')} className="text-xs text-danger hover:underline font-medium">{t('cancel')}</button>
        </div>
      ) : <span className="text-gray-300 text-xs">—</span>,
    },
  ];

  return (
    <div>
      <PageHeader title={t('leaveRecords')} action={t('grantLeave')} onAction={() => navigate('/leave/new')} />
      <div className="mb-4">
        <button
          onClick={() => navigate('/leave/balance')}
          className="text-xs text-primary border border-primary/30 bg-primary/5 rounded-lg px-3 py-1.5 hover:bg-primary/10 font-medium"
        >
          {t('viewLeaveBalance')}
        </button>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="number"
          value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
          placeholder="Year"
        />
        <select
          value={filters.leave_type}
          onChange={(e) => setFilters({ ...filters, leave_type: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">{t('allLeaveTypes')}</option>
          {leaveTypes.map((lt) => <option key={lt.id} value={lt.type_name}>{lt.type_name}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">{t('allStatuses')}</option>
          {LEAVE_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <DataTable
        columns={columns}
        data={leaves}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
        emptyMessage={t('noData')}
      />
    </div>
  );
}
