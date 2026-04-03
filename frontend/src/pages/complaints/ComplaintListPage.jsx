import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { COMPLAINT_STATUSES } from '../../utils/constants';
import {  } from '../../utils/dateFormat';

export default function ComplaintListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: searchParams.get('status') || '',
    office_id: searchParams.get('office_id') || '',
    from_date: '',
    to_date: '',
    page: 1,
  });

  useEffect(() => {
    setLoading(true);
    const params = { page: filters.page };
    if (filters.search)    params.search    = filters.search;
    if (filters.status)    params.status    = filters.status;
    if (filters.office_id) params.office_id = filters.office_id;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date)   params.to_date   = filters.to_date;

    api.get('/complaints', { params })
      .then((res) => { setComplaints(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }, [filters]);

  function clearDates() {
    setFilters({ ...filters, from_date: '', to_date: '', page: 1 });
  }

  const columns = [
    { key: 'complaint_number', label: 'No.' },
    { key: 'complainant_name', label: t('complainant') },
    { key: 'office_name', label: t('office') },
    { key: 'article_type', label: t('articleType') },
    { key: 'date_received', label: t('dateReceived'), render: (r) => (r.date_received) },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '',
      render: (r) => (
        <button onClick={() => navigate(`/complaints/${r.id}`)} className="text-primary text-xs hover:underline">
          View →
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('complaints')} action={t('newComplaint')} onAction={() => navigate('/complaints/new')} />

      {/* Row 1: search + status */}
      <div className="flex flex-wrap gap-3 mb-2">
        <input
          type="text"
          placeholder={t('search')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          {COMPLAINT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Row 2: date range */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-xs text-gray-500 font-medium">From:</label>
        <input
          type="date"
          value={filters.from_date}
          onChange={(e) => setFilters({ ...filters, from_date: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <label className="text-xs text-gray-500 font-medium">To:</label>
        <input
          type="date"
          value={filters.to_date}
          onChange={(e) => setFilters({ ...filters, to_date: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        {(filters.from_date || filters.to_date) && (
          <button
            onClick={clearDates}
            className="text-xs text-gray-400 hover:text-danger underline"
          >
            Clear dates
          </button>
        )}
        {pagination && (
          <span className="text-xs text-gray-400 ml-auto">{pagination.total} record{pagination.total !== 1 ? 's' : ''}</span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={complaints}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
      />
    </div>
  );
}
