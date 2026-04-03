import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { INSPECTION_STATUSES } from '../../utils/constants';
import { MONTHS } from '../../utils/dateFormat';

export default function InspectionProgrammePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [inspections, setInspections] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: currentYear, half: '', status: '', page: 1,
  });

  useEffect(() => {
    setLoading(true);
    const params = { page: filters.page, year: filters.year };
    if (filters.half) params.half = filters.half;
    if (filters.status) params.status = filters.status;
    api.get('/inspections', { params })
      .then((res) => { setInspections(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }, [filters]);

  const columns = [
    { key: 'office_name', label: t('office') },
    { key: 'allotted_month', label: 'Month', render: (r) => MONTHS[r.allotted_month] },
    { key: 'half', label: 'Half Year' },
    { key: 'inspecting_officer', label: 'Officer' },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '',
      render: (r) => (
        <button onClick={() => navigate(`/inspections/${r.id}`)} className="text-primary text-xs hover:underline">
          View →
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('inspections')} action="Enter Programme" onAction={() => navigate('/inspections/programme/new')} />
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="number" value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24" />
        <select value={filters.half}
          onChange={(e) => setFilters({ ...filters, half: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Both Halves</option>
          <option value="First">First (Jan–Jun)</option>
          <option value="Second">Second (Jul–Dec)</option>
        </select>
        <select value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Statuses</option>
          {INSPECTION_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => navigate('/inspections/diary')}
          className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light">
          {t('weeklyDiary')}
        </button>
        <button onClick={() => navigate('/inspections/statement')}
          className="px-4 py-2 text-sm bg-success text-white rounded-lg hover:opacity-90">
          {t('monthlyStatement')}
        </button>
      </div>
      <DataTable columns={columns} data={inspections} loading={loading} pagination={pagination}
        onPageChange={(p) => setFilters({ ...filters, page: p })} />
    </div>
  );
}
