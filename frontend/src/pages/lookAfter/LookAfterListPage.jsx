import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../utils/api';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';
import { useIsAdmin } from '../../context/AuthContext';

const DESIGNATIONS = ['Postmaster', 'Postman', 'Mail Peon', 'Mail Runner'];

export default function LookAfterListPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdmin = useIsAdmin();

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState([]);

  const [filters, setFilters] = useState({
    is_active: '',
    office_id: '',
    lookafter_designation: '',
    search: '',
    page: 1,
  });

  useEffect(() => {
    api.get('/offices', { params: { limit: 200 } }).then(r => setOffices(r.data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page: filters.page, limit: 20 };
    if (filters.is_active !== '') params.is_active = filters.is_active;
    if (filters.office_id) params.office_id = filters.office_id;
    if (filters.lookafter_designation) params.lookafter_designation = filters.lookafter_designation;
    if (filters.search) params.search = filters.search;

    api.get('/look-after', { params })
      .then(r => { setData(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [filters]);

  function set(field) {
    return (e) => setFilters({ ...filters, [field]: e.target.value, page: 1 });
  }

  const columns = [
    { key: 'staff_name', label: t('staff'), render: r => (
      <div>
        <p className="font-medium text-gray-800 text-sm">{r.staff_name}</p>
        <p className="text-xs text-gray-400">{r.staff_designation}</p>
      </div>
    )},
    { key: 'home_office_name', label: t('homeOffice'), render: r => (
      <span className="text-sm text-gray-600">{r.home_office_name}</span>
    )},
    { key: 'lookafter_designation', label: t('lookingAfter'), render: r => (
      <span className="text-sm font-medium text-gray-800">{r.lookafter_designation}</span>
    )},
    { key: 'lookafter_office_name', label: t('atOffice'), render: r => (
      <span className="text-sm text-gray-600">{r.lookafter_office_name}</span>
    )},
    { key: 'dsps_order_no', label: t('dspsOrderNo'), render: r => (
      <div>
        <p className="text-sm text-gray-700">{r.dsps_order_no}</p>
        <p className="text-xs text-gray-400">{(r.dsps_order_date)}</p>
      </div>
    )},
    { key: 'start_date', label: t('assignedSince'), render: r => (
      <span className="text-sm text-gray-600">{(r.start_date)}</span>
    )},
    { key: 'is_active', label: t('status'), render: r => (
      <StatusBadge status={r.is_active ? 'Active' : 'Ended'} />
    )},
    { key: 'actions', label: '', render: r => (
      <button onClick={() => navigate(`/look-after/${r.id}`)} className="text-primary text-xs hover:underline">
        {t('view')} →
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader
        title={t('lookAfterDuties')}
        action={isAdmin ? t('newLookAfter') : undefined}
        onAction={isAdmin ? () => navigate('/look-after/new') : undefined}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4 flex flex-wrap gap-3">
        <select
          value={filters.is_active}
          onChange={set('is_active')}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">{t('all')}</option>
          <option value="true">{t('lookAfterActive')}</option>
          <option value="false">{t('lookAfterEnded')}</option>
        </select>

        <select
          value={filters.lookafter_designation}
          onChange={set('lookafter_designation')}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">— {t('designation')} —</option>
          {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={filters.office_id}
          onChange={set('office_id')}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">— {t('office')} —</option>
          {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>

        <input
          type="text"
          placeholder={t('searchByName')}
          value={filters.search}
          onChange={set('search')}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary flex-1 min-w-[160px]"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
        emptyMessage={t('noLookAfterAssignments')}
      />
    </div>
  );
}
