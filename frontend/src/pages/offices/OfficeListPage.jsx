import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { OFFICE_TYPES, OFFICE_SHIFTS } from '../../utils/constants';

export default function OfficeListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [offices, setOffices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '', shift: '', page: 1 });
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(office) {
    if (!window.confirm(`Delete "${office.name}"? This cannot be undone.`)) return;
    setDeleting(office.id);
    try {
      await api.delete(`/offices/${office.id}`);
      setOffices((prev) => prev.filter((o) => o.id !== office.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete office.');
    } finally {
      setDeleting(null);
    }
  }

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.type) params.type = filters.type;
    if (filters.shift) params.shift = filters.shift;
    params.page = filters.page;

    api.get('/offices', { params })
      .then((res) => {
        setOffices(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const columns = [
    { key: 'name', label: t('officeName') },
    { key: 'type', label: t('type'), render: (r) => <StatusBadge status={r.type} /> },
    { key: 'shift', label: t('shift') },
    { key: 'tehsil', label: t('tehsil') },
    { key: 'account_office', label: t('accountOffice') },
    { key: 'staff_count', label: t('staff') },
    {
      key: 'actions', label: '',
      render: (r) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/offices/${r.id}`)}
            className="text-primary text-xs hover:underline"
          >
            View →
          </button>
          <button
            onClick={() => handleDelete(r)}
            disabled={deleting === r.id}
            className="text-danger text-xs hover:underline disabled:opacity-40"
          >
            {deleting === r.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('offices')} action={t('addNew')} onAction={() => navigate('/offices/new')} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder={t('search')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 flex-1 min-w-48"
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Types</option>
          {OFFICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filters.shift}
          onChange={(e) => setFilters({ ...filters, shift: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Shifts</option>
          {OFFICE_SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={offices}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
        emptyMessage="No offices found."
      />
    </div>
  );
}
