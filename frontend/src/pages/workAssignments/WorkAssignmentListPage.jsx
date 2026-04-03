import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../utils/api';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';
import { useIsAdmin } from '../../context/AuthContext';

export default function WorkAssignmentListPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdmin = useIsAdmin();

  const [data, setData]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [staff, setStaff]       = useState([]);
  const [filters, setFilters]   = useState({ status: '', staff_id: '', page: 1 });

  useEffect(() => {
    api.get('/staff', { params: { limit: 200, is_active: true } }).then(r => setStaff(r.data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page: filters.page, limit: 20 };
    if (filters.status)   params.status   = filters.status;
    if (filters.staff_id) params.staff_id = filters.staff_id;
    api.get('/work-assignments', { params })
      .then(r => { setData(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [filters]);

  function set(field) { return e => setFilters({ ...filters, [field]: e.target.value, page: 1 }); }

  const columns = [
    { key: 'title', label: t('title'), render: r => (
      <p className="font-medium text-gray-800 text-sm">{r.title}</p>
    )},
    { key: 'staff_name', label: t('staff') },
    { key: 'order_type', label: t('orderType'), render: r => (
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
        r.order_type === 'Written' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-500 border-gray-300'
      }`}>{t(r.order_type === 'Written' ? 'written' : 'verbal')}</span>
    )},
    { key: 'order_reference', label: t('orderReference'), render: r => r.order_reference || '—' },
    { key: 'assigned_date', label: t('assignedDate'), render: r => (r.assigned_date) },
    { key: 'due_date',      label: t('dueDate'),      render: r => (r.due_date) },
    { key: 'status',        label: t('status'),       render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '', render: r => (
      <button onClick={() => navigate(`/work-assignments/${r.id}`)} className="text-primary text-xs hover:underline">
        {t('edit')} →
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader
        title={t('workAssignments')}
        action={isAdmin ? t('newAssignment') : undefined}
        onAction={isAdmin ? () => navigate('/work-assignments/new') : undefined}
      />

      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4 flex flex-wrap gap-3">
        <select value={filters.status} onChange={set('status')}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="">— {t('status')} —</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select value={filters.staff_id} onChange={set('staff_id')}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="">— {t('staff')} —</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading}
        pagination={pagination} onPageChange={p => setFilters({...filters, page: p})}
        emptyMessage={t('noData')} />
    </div>
  );
}
