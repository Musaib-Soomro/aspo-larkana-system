import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { INQUIRY_STATUSES } from '../../utils/constants';
import { formatDate } from '../../utils/dateFormat';

export default function InquiryListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', page: 1 });

  useEffect(() => {
    setLoading(true);
    const params = { page: filters.page };
    if (filters.status) params.status = filters.status;
    api.get('/inquiries', { params })
      .then((res) => { setInquiries(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }, [filters]);

  const columns = [
    { key: 'inquiry_number', label: 'No.' },
    { key: 'subject', label: t('subject') },
    { key: 'office_name', label: t('office') },
    { key: 'date_received', label: t('dateReceived'), render: (r) => formatDate(r.date_received) },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '',
      render: (r) => (
        <button onClick={() => navigate(`/inquiries/${r.id}`)} className="text-primary text-xs hover:underline">
          View →
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('inquiries')} action={t('newInquiry')} onAction={() => navigate('/inquiries/new')} />
      <div className="flex gap-3 mb-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          {INQUIRY_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={inquiries} loading={loading} pagination={pagination}
        onPageChange={(p) => setFilters({ ...filters, page: p })} />
    </div>
  );
}
