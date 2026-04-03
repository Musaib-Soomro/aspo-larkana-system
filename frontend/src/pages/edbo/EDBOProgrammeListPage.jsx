import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { useIsAdmin } from '../../context/AuthContext';

export default function EDBOProgrammeListPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdmin = useIsAdmin();

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get('/edbo-programmes', { params: { page, limit: 20 } })
      .then(r => { setData(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [page]);

  const columns = [
    { key: 'year',       label: t('year'), render: r => <span className="font-bold text-gray-800">{r.year}</span> },
    { key: 'staff_name', label: t('staff') },
    { key: 'total',      label: t('edboAssignments'), render: r => <span className="text-sm">{r.total}</span> },
    { key: 'completed',  label: 'Completed',  render: r => <span className="text-green-600 font-medium">{r.completed}</span> },
    { key: 'pending',    label: 'Pending',    render: r => <span className="text-alert font-medium">{r.pending}</span> },
    { key: 'carried',    label: 'Carried Fwd', render: r => <span className="text-gray-500">{r.carried_forward}</span> },
    { key: 'actions',   label: '', render: r => (
      <button onClick={() => navigate(`/edbo-programme/${r.id}`)} className="text-primary text-xs hover:underline">
        {t('view')} →
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader
        title={t('edboProgramme')}
        action={isAdmin ? t('newEdboProgramme') : undefined}
        onAction={isAdmin ? () => navigate('/edbo-programme/new') : undefined}
      />
      <DataTable columns={columns} data={data} loading={loading}
        pagination={pagination} onPageChange={setPage} emptyMessage={t('noData')} />
    </div>
  );
}
