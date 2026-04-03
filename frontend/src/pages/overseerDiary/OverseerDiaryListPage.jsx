import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import api from '../../utils/api';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';
import { useIsAdmin } from '../../context/AuthContext';

export default function OverseerDiaryListPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdmin = useIsAdmin();

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get('/overseer-diaries', { params: { page, limit: 20, year } })
      .then(r => { setData(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [page, year]);

  const columns = [
    { key: 'week', label: t('weekStartDate'), render: r => (
      <div>
        <p className="font-medium text-gray-800">{(r.week_start_date)}</p>
        <p className="text-xs text-gray-400">→ {(r.week_end_date)}</p>
      </div>
    )},
    { key: 'staff_name', label: t('staff') },
    { key: 'places_visited', label: t('placesVisited'), render: r => (
      <span className="text-sm text-gray-600">
        {r.places_visited ? r.places_visited.slice(0, 40) + (r.places_visited.length > 40 ? '…' : '') : '—'}
      </span>
    )},
    { key: 'work_summary', label: t('workSummary'), render: r => (
      <span className="text-sm text-gray-600">
        {r.work_summary ? r.work_summary.slice(0, 40) + (r.work_summary.length > 40 ? '…' : '') : '—'}
      </span>
    )},
    { key: 'submitted_date', label: t('submittedDate'), render: r => (r.submitted_date) },
    { key: 'actions', label: '', render: r => (
      <button onClick={() => navigate(`/overseer-diary/${r.id}`)} className="text-primary text-xs hover:underline">
        {t('view')} →
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader
        title={t('overseerDiary')}
        action={isAdmin ? t('submitDiary') : undefined}
        onAction={isAdmin ? () => navigate('/overseer-diary/new') : undefined}
      />

      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4">
        <label className="text-xs text-gray-500 mr-2">{t('year')}:</label>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading}
        pagination={pagination} onPageChange={setPage} emptyMessage={t('noData')} />
    </div>
  );
}
