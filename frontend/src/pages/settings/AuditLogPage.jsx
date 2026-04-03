import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import api from '../../utils/api';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';

const TABLE_LABELS = {
  offices: 'Office', staff: 'Staff', leave_records: 'Leave',
  inspection_programme: 'Inspection', inspection_visits: 'Visit',
  complaints: 'Complaint', revenue_entries: 'Revenue',
  inquiries: 'Inquiry', settings: 'Settings',
};

const ACTION_COLORS = {
  INSERT: 'bg-success/10 text-success border-success/30',
  UPDATE: 'bg-primary/10 text-primary border-primary/30',
  DELETE: 'bg-danger/10 text-danger border-danger/30',
};

export default function AuditLogPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ table_name: '', action: '', page: 1 });

  useEffect(() => {
    setLoading(true);
    const params = { page: filters.page, limit: 50 };
    if (filters.table_name) params.table_name = filters.table_name;
    if (filters.action)     params.action     = filters.action;
    api.get('/audit-log', { params })
      .then((res) => { setLogs(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }, [filters]);

  const columns = [
    {
      key: 'created_at', label: t('dateTime'),
      render: (r) => (
        <span className="text-xs text-gray-500">
          {new Date(r.created_at).toLocaleString('en-PK')}
        </span>
      ),
    },
    { key: 'username', label: t('user'), render: (r) => r.username || '—' },
    {
      key: 'action', label: t('action'),
      render: (r) => (
        <span className={`px-2 py-0.5 text-xs font-semibold border rounded-full ${ACTION_COLORS[r.action] || 'bg-gray-100 text-gray-600'}`}>
          {r.action}
        </span>
      ),
    },
    {
      key: 'table_name', label: t('module'),
      render: (r) => TABLE_LABELS[r.table_name] || r.table_name,
    },
    { key: 'record_id', label: t('recordNo'), render: (r) => r.record_id || '—' },
  ];

  const tableOptions = Object.entries(TABLE_LABELS);

  return (
    <div>
      <PageHeader title={t('auditLog')} />
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filters.table_name}
          onChange={(e) => setFilters({ ...filters, table_name: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">{t('allModules')}</option>
          {tableOptions.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">{t('allActions')}</option>
          <option value="INSERT">{t('insert')}</option>
          <option value="UPDATE">{t('update')}</option>
          <option value="DELETE">{t('delete')}</option>
        </select>
      </div>
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
        emptyMessage={t('noAuditEntries')}
      />
    </div>
  );
}
